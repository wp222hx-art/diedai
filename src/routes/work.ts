import { Hono } from 'hono'
import { Env, need, audit, emit, rid, sha256, findConflicts, estimateScenario, settle, ShotClass } from '../lib/core'

const r = new Hono<Env>()
const today = () => new Date().toISOString().slice(0, 10)

// ======================= 工作台总览 =======================
r.get('/dashboard', async (c) => {
  const g = need(c); if (g.err) return g.err
  const u = g.user, db = c.env.DB
  const out: any = { user: u }
  if (u.role === 'creator') {
    out.assets = (await db.prepare('SELECT * FROM assets WHERE owner_id=? ORDER BY id DESC').bind(u.id).all()).results
    out.entries = (await db.prepare(`SELECT en.*,a.title,t.name track,e.name edition FROM entries en JOIN assets a ON a.id=en.asset_id
      JOIN tracks t ON t.id=en.track_id JOIN editions e ON e.id=en.edition_id WHERE en.user_id=? ORDER BY en.id DESC`).bind(u.id).all()).results
    out.projects = (await db.prepare('SELECT * FROM projects WHERE owner_id=? ORDER BY id DESC').bind(u.id).all()).results
    out.listings = (await db.prepare('SELECT * FROM listings WHERE seller_id=? ORDER BY id DESC').bind(u.id).all()).results
    out.grants = (await db.prepare(`SELECT g.*,l.title,us.name requester,us.org FROM access_grants g JOIN listings l ON l.id=g.listing_id
      JOIN users us ON us.id=g.requester_id WHERE l.seller_id=? ORDER BY g.id DESC`).bind(u.id).all()).results
    // 反馈：只返回已提交评审的“可反馈意见”，不返回专家身份与内部意见
    out.feedback = (await db.prepare(`SELECT ra.entry_id,ra.total,ra.comment_feedback,a.title FROM review_assignments ra JOIN entries en ON en.id=ra.entry_id
      JOIN assets a ON a.id=en.asset_id WHERE en.user_id=? AND ra.status='已提交'`).bind(u.id).all()).results
  } else if (u.role === 'expert') {
    out.assignments = (await db.prepare(`SELECT ra.id,ra.stage,ra.status,ra.total,ra.conflict,ra.submitted_at,en.receipt_no,a.title,a.form,a.genre,a.total_minutes,
      a.logline,a.synopsis,t.name track,t.weights,v.version FROM review_assignments ra JOIN entries en ON en.id=ra.entry_id
      JOIN assets a ON a.id=en.asset_id JOIN tracks t ON t.id=en.track_id LEFT JOIN asset_versions v ON v.id=en.version_id
      WHERE ra.expert_id=? ORDER BY ra.id`).bind(u.id).all()).results
  } else if (u.role === 'institution') {
    out.grants = (await db.prepare(`SELECT g.*,l.title FROM access_grants g JOIN listings l ON l.id=g.listing_id WHERE g.requester_id=? ORDER BY g.id DESC`).bind(u.id).all()).results
    out.deals = (await db.prepare(`SELECT d.*,a.title FROM deals d JOIN assets a ON a.id=d.asset_id WHERE d.buyer_id=? ORDER BY d.id DESC`).bind(u.id).all()).results
    out.demands = (await db.prepare('SELECT * FROM demands WHERE org_user_id=? ORDER BY id DESC').bind(u.id).all()).results
  } else if (['distributor', 'finance'].includes(u.role)) {
    out.releases = (await db.prepare(`SELECT r.*,a.title,ch.name channel FROM releases r JOIN assets a ON a.id=r.asset_id JOIN channels ch ON ch.id=r.channel_id ORDER BY r.id DESC`).all()).results
    out.statements = (await db.prepare(`SELECT s.*,a.title,ch.name channel FROM statements s JOIN releases r ON r.id=s.release_id JOIN assets a ON a.id=r.asset_id JOIN channels ch ON ch.id=r.channel_id ORDER BY s.id DESC`).all()).results
    out.settlements = (await db.prepare('SELECT * FROM settlements ORDER BY id DESC').all()).results
    out.deals = (await db.prepare(`SELECT d.*,a.title FROM deals d JOIN assets a ON a.id=d.asset_id ORDER BY d.id DESC`).all()).results
  } else {
    // operator / admin：联合运营管理台
    out.queue = {
      listings: (await db.prepare(`SELECT l.*,a.rights_status,a.public_consent FROM listings l JOIN assets a ON a.id=l.asset_id WHERE l.status='审核中'`).all()).results,
      entries: (await db.prepare(`SELECT en.*,a.title,t.name track FROM entries en JOIN assets a ON a.id=en.asset_id JOIN tracks t ON t.id=en.track_id ORDER BY en.id DESC`).all()).results,
      awards: (await db.prepare(`SELECT ar.*,aw.name award,a.title FROM award_results ar JOIN awards aw ON aw.id=ar.award_id JOIN entries en ON en.id=ar.entry_id JOIN assets a ON a.id=en.asset_id ORDER BY ar.id DESC`).all()).results,
      tickets: (await db.prepare('SELECT * FROM tickets ORDER BY id DESC LIMIT 30').all()).results,
    }
    out.experts = (await db.prepare("SELECT id,name,title FROM users WHERE role='expert'").all()).results
    out.metrics = await db.prepare(`SELECT (SELECT COUNT(*) FROM users) users,(SELECT COUNT(*) FROM entries) entries,(SELECT COUNT(*) FROM review_assignments WHERE status='已提交') reviews,
      (SELECT COUNT(*) FROM deals) deals,(SELECT COUNT(*) FROM releases) releases,(SELECT COUNT(*) FROM outbox) events`).first()
  }
  return c.json(out)
})

// ======================= M02 作品档案 =======================
r.post('/assets', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const title = String(b.title || '').trim()
  if (title.length < 2 || title.length > 40) return c.json({ error: '项目名需 2—40 字' }, 422)
  if (!b.form) return c.json({ error: '请选择内容形态' }, 422)
  const logline = String(b.logline || '')
  if (logline.length < 10 || logline.length > 150) return c.json({ error: '一句话梗概需 10—150 字' }, 422)
  const episodes = Math.max(1, Number(b.episodes) || 1), ep = Math.max(0, Number(b.ep_minutes) || 0)
  const res = await c.env.DB.prepare(`INSERT INTO assets (owner_id,title,form,genre,episodes,ep_minutes,total_minutes,stage,logline,synopsis,team,ai_tools,rights_status,public_consent,cover)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(g.user.id, title, b.form, b.genre || '', episodes, ep, +(episodes * ep).toFixed(1), b.stage || '开发中',
    logline, b.synopsis || '', b.team || '', b.ai_tools || '', b.rights_status || '待清权', b.public_consent ? 1 : 0, b.cover || 'noir').run()
  const id = res.meta.last_row_id
  const checksum = 'sha256:' + (await sha256(title + logline + Date.now())).slice(0, 16)
  await c.env.DB.prepare('INSERT INTO asset_versions (asset_id,version,note,checksum,locked) VALUES (?,?,?,?,0)').bind(id, 'V1.0', '初始建档', checksum).run()
  await audit(c.env.DB, g.user, 'asset.create', 'asset:' + id, title)
  return c.json({ id })
})
r.get('/assets/:id', async (c) => {
  const g = need(c); if (g.err) return g.err
  const a = await c.env.DB.prepare('SELECT * FROM assets WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!a) return c.json({ error: '不存在' }, 404)
  if (a.owner_id !== g.user.id && !['operator', 'admin'].includes(g.user.role)) return c.json({ error: '无权限访问该作品档案' }, 403) // AT01 团队隔离
  const versions = (await c.env.DB.prepare('SELECT * FROM asset_versions WHERE asset_id=? ORDER BY id').bind(a.id).all()).results
  const reservations = (await c.env.DB.prepare('SELECT * FROM rights_reservations WHERE asset_id=?').bind(a.id).all()).results
  return c.json({ asset: a, versions, reservations })
})

// ======================= M03 盛典报名 =======================
r.post('/entries', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const db = c.env.DB
  const asset = await db.prepare('SELECT * FROM assets WHERE id=? AND owner_id=?').bind(b.asset_id, g.user.id).first<any>()
  if (!asset) return c.json({ error: '作品不存在或无权限' }, 403)
  const track = await db.prepare('SELECT t.*,e.status es,e.close_at FROM tracks t JOIN editions e ON e.id=t.edition_id WHERE t.id=?').bind(b.track_id).first<any>()
  if (!track) return c.json({ error: '赛道不存在' }, 422)
  if (track.es !== '报名中') return c.json({ error: '该届次不在报名期' }, 409)
  if (!b.accept_rules) return c.json({ error: '请确认接受当届规则（' + 'R' + track.edition_id + '）' }, 422)
  const missing: string[] = []
  if (track.grp === '完成作品') {
    if (asset.stage !== '已成片' || !b.has_full_cut) missing.push('完整审片版（不能仅凭概念片参评完成作品组）') // AT01(策划)
  } else {
    const clips = (b.clips || []).map(Number).filter((x: number) => x >= 30 && x <= 60)
    if (clips.length < 2) missing.push('两支30—60秒概念片（当前合格 ' + clips.length + ' 支）')
    if (!b.has_budget) missing.push('总预算与算力估算')
    if (asset.total_minutes < 30) missing.push('篇幅不足：总时长需 ≥30 分钟（中剧及以上，当期规则可配置）')
  }
  if (!asset.team) missing.push('主创署名与团队')
  if (missing.length) return c.json({ error: '材料不完整，无法提交', missing }, 422)
  const dup = await db.prepare("SELECT id FROM entries WHERE track_id=? AND asset_id=? AND status!='撤回'").bind(b.track_id, asset.id).first()
  if (dup) return c.json({ error: '该作品已报名此赛道' }, 409)
  const ver = await db.prepare('SELECT * FROM asset_versions WHERE asset_id=? ORDER BY id DESC LIMIT 1').bind(asset.id).first<any>()
  await db.prepare('UPDATE asset_versions SET locked=1 WHERE id=?').bind(ver.id).run()
  const receipt = `DD${new Date().getFullYear() + 1}-${track.code}-${rid(5)}`
  const consents = JSON.stringify({ 内部评审: true, 现场展映: !!b.consent_screening, 网络展映: !!b.consent_online, 宣传片段: !!b.consent_promo })
  const res = await db.prepare('INSERT INTO entries (edition_id,track_id,asset_id,version_id,user_id,status,consents,receipt_no) VALUES (?,?,?,?,?,?,?,?)')
    .bind(track.edition_id, track.id, asset.id, ver.id, g.user.id, '已提交', consents, receipt).run()
  await emit(db, 'entry.submitted', { entry_id: res.meta.last_row_id })
  await audit(db, g.user, 'entry.submit', 'entry:' + res.meta.last_row_id, `锁定版本 ${ver.version}；回执 ${receipt}`)
  return c.json({ id: res.meta.last_row_id, receipt_no: receipt, locked_version: ver.version, note: '报名不自动公开作品或上架影市' })
})

// ======================= M04 专业评审 =======================
r.post('/reviews/:id/accept', async (c) => {
  const g = need(c, ['expert']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const ra = await c.env.DB.prepare('SELECT * FROM review_assignments WHERE id=? AND expert_id=?').bind(c.req.param('id'), g.user.id).first<any>()
  if (!ra) return c.json({ error: '未分派给您' }, 403)
  if (ra.status !== '待接受') return c.json({ error: '当前状态不可接受' }, 409)
  const rel = (b.relations || []) as string[]
  if (rel.length) { // AT03：有利益关系 → 回避并重派
    await c.env.DB.prepare("UPDATE review_assignments SET status='已回避',conflict=? WHERE id=?").bind(rel.join('、'), ra.id).run()
    await c.env.DB.prepare("INSERT INTO tickets (kind,object,detail,created_by) VALUES ('回避重派',?,?,?)").bind('assignment:' + ra.id, '专家申报关系：' + rel.join('、'), g.user.id).run()
    await audit(c.env.DB, g.user, 'review.recuse', 'assignment:' + ra.id, rel.join('、'))
    return c.json({ status: '已回避', note: '已记录回避并生成重派工单，您不能对该作品评分' })
  }
  await c.env.DB.prepare("UPDATE review_assignments SET status='评审中',conflict='无' WHERE id=?").bind(ra.id).run()
  await audit(c.env.DB, g.user, 'review.accept', 'assignment:' + ra.id, '无利益冲突声明')
  return c.json({ status: '评审中' })
})
r.post('/reviews/:id/submit', async (c) => {
  const g = need(c, ['expert']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const db = c.env.DB
  const ra = await db.prepare(`SELECT ra.*,t.weights FROM review_assignments ra JOIN entries en ON en.id=ra.entry_id JOIN tracks t ON t.id=en.track_id
    WHERE ra.id=? AND ra.expert_id=?`).bind(c.req.param('id'), g.user.id).first<any>()
  if (!ra) return c.json({ error: '未分派给您' }, 403)
  if (ra.status === '已提交') return c.json({ error: '评分已锁定，修改需主任审批' }, 409)
  if (ra.status !== '评审中') return c.json({ error: '请先完成利益冲突声明' }, 409)
  const w = JSON.parse(ra.weights) as Record<string, number>
  const scores = b.scores || {}, reasons = b.reasons || {}
  for (const k of Object.keys(w)) {
    const s = Number(scores[k]); if (!(s >= 1 && s <= 5)) return c.json({ error: `维度「${k}」需 1—5 分` }, 422)
    if (!String(reasons[k] || '').trim()) return c.json({ error: `维度「${k}」必须填写理由` }, 422)
  }
  // 综合得分 = Σ(维度分÷5×权重)
  const total = +Object.entries(w).reduce((a, [k, wt]) => a + (Number(scores[k]) / 5) * wt, 0).toFixed(1)
  await db.prepare("UPDATE review_assignments SET status='已提交',scores=?,total=?,comment_internal=?,comment_feedback=?,submitted_at=datetime('now') WHERE id=?")
    .bind(JSON.stringify({ scores, reasons }), total, b.comment_internal || '', b.comment_feedback || '', ra.id).run()
  // 双评分差 ≥20 → 第三评工单
  const others = (await db.prepare("SELECT total FROM review_assignments WHERE entry_id=? AND status='已提交' AND id!=?").bind(ra.entry_id, ra.id).all()).results as any[]
  let third = false
  if (others.some((o) => Math.abs(o.total - total) >= 20)) {
    third = true
    await db.prepare("INSERT INTO tickets (kind,object,detail,created_by) VALUES ('第三评',?,?,?)").bind('entry:' + ra.entry_id, '两位专家总分差≥20，需增加第三位专家复核', g.user.id).run()
  }
  await emit(db, 'review.submitted', { assignment: ra.id })
  await audit(db, g.user, 'review.submit', 'assignment:' + ra.id, '总分 ' + total)
  return c.json({ total, locked: true, third_review: third, suggestion: total >= 70 ? '路演候选' : total >= 60 ? '辅导观察' : '反馈退回' })
})

// ======================= M06/M07 孵化与算力 =======================
r.post('/estimates', async (c) => {
  const g = need(c); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const shots = (b.shots || []) as ShotClass[]
  if (!shots.length) return c.json({ error: '请至少填写一类镜头' }, 422)
  for (const s of shots) if (!(s.seconds > 0 && s.adopt > 0 && s.k >= 1 && s.billSec > 0)) return c.json({ error: `镜头类「${s.name}」参数不完整或单位错误` }, 422)
  const sc = b.scenarios || {}
  const mk = (adj: any) => shots.map((s) => ({ ...s, ...(adj?.[s.name] || adj?.all || {}) }))
  const base = estimateScenario(shots)
  const low = estimateScenario(mk(sc.low))
  const high = estimateScenario(mk(sc.high))
  const valid = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)
  const result = { base, low, high, valid_until: valid, excluded: ['图像/音频/口型/超分等其他模型服务', '编剧/制片/后期/配音人力', '权利授权', '宣发与发行交付', '税费与汇损', '风险准备金'],
    disclaimer: '三场景不是统计置信区间；生成费用≠影视项目总预算；需试制校准与供应商书面报价。' }
  const res = await c.env.DB.prepare('INSERT INTO estimates (project_id,user_id,input,result,valid_until) VALUES (?,?,?,?,?)')
    .bind(b.project_id || null, g.user.id, JSON.stringify(b), JSON.stringify(result), valid).run()
  return c.json({ estimate_id: res.meta.last_row_id, ...result })
})
r.get('/projects/:id', async (c) => {
  const g = need(c); if (g.err) return g.err
  const p = await c.env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!p) return c.json({ error: '不存在' }, 404)
  if (p.owner_id !== g.user.id && !['operator', 'finance', 'admin'].includes(g.user.role)) return c.json({ error: '无权限' }, 403)
  const ms = (await c.env.DB.prepare('SELECT * FROM milestones WHERE project_id=? ORDER BY id').bind(p.id).all()).results
  const ledger = (await c.env.DB.prepare('SELECT * FROM usage_ledger WHERE project_id=? ORDER BY id').bind(p.id).all()).results
  return c.json({ project: p, milestones: ms, ledger })
})
r.post('/projects', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const a = await c.env.DB.prepare('SELECT * FROM assets WHERE id=? AND owner_id=?').bind(b.asset_id, g.user.id).first<any>()
  if (!a) return c.json({ error: '作品不存在或无权限' }, 403)
  const res = await c.env.DB.prepare("INSERT INTO projects (asset_id,owner_id,title,package,status,budget_total) VALUES (?,?,?,?,'待材料审核',?)")
    .bind(a.id, g.user.id, a.title, '试制包', Number(b.budget_total) || 0).run()
  const pid = res.meta.last_row_id
  const ms = [['M0', '开发确认', '剧本版本、权利清单、分镜、预算、计划', 0], ['M1', '技术试制', '代表性镜头、角色一致性测试、实际费用', 10], ['M2', '样章验证', '3—5分钟连续叙事样章', 25], ['M3', '阶段成片', '合同约定阶段内容', 40], ['M4', '成片与交付', '母版、字幕、音轨、权利及质检报告', 25]]
  await c.env.DB.batch(ms.map((m) => c.env.DB.prepare('INSERT INTO milestones (project_id,code,name,deliverables,release_pct) VALUES (?,?,?,?,?)').bind(pid, ...m)))
  await audit(c.env.DB, g.user, 'project.create', 'project:' + pid)
  return c.json({ id: pid })
})
// 供应商回调：幂等核销（AT12）
r.post('/provider-callbacks', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (!b.external_id || !b.project_id || !(b.amount > 0)) return c.json({ error: '缺少交易号/项目/金额' }, 422)
  const exist = await c.env.DB.prepare('SELECT id FROM usage_ledger WHERE external_id=?').bind(b.external_id).first()
  if (exist) return c.json({ ok: true, duplicated: true, note: '重复回调，仅处理一次' })
  const p = await c.env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(b.project_id).first<any>()
  if (!p) return c.json({ error: '项目不存在' }, 404)
  if (p.compute_used + b.amount > p.compute_grant) return c.json({ error: '额度不足，超额需先审批' }, 409)
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO usage_ledger (project_id,kind,amount,unit,provider,external_id,note) VALUES (?,'已消费',?,'元面值',?,?,?)").bind(p.id, b.amount, b.provider || '供应商', b.external_id, b.note || ''),
    c.env.DB.prepare('UPDATE projects SET compute_used=compute_used+? WHERE id=?').bind(b.amount, p.id),
  ])
  await emit(c.env.DB, 'usage.posted', { project: p.id, external_id: b.external_id })
  return c.json({ ok: true, duplicated: false })
})

// ======================= M08–M10 影市 =======================
r.post('/listings', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const a = await c.env.DB.prepare('SELECT * FROM assets WHERE id=? AND owner_id=?').bind(b.asset_id, g.user.id).first<any>()
  if (!a) return c.json({ error: '作品不存在或无权限' }, 403)
  if (!b.public_consent) return c.json({ error: '挂牌需单独取得公开授权' }, 422) // AT02 / AT17
  for (const k of ['type', 'territory', 'media', 'language', 'start_date', 'end_date']) if (!b[k]) return c.json({ error: '权利矩阵不完整：' + k }, 422)
  if (b.start_date > b.end_date) return c.json({ error: '起止日期错误' }, 422)
  const scope = { asset_id: a.id, territory: b.territory, media: b.media, language: b.language, start_date: b.start_date, end_date: b.end_date, exclusive: b.exclusive ? 1 : 0 }
  const conflicts = await findConflicts(c.env.DB, scope)
  if (conflicts.length) { // AT10 重复独家挂牌
    await c.env.DB.prepare("INSERT INTO tickets (kind,object,detail,created_by) VALUES ('法务复核',?,?,?)").bind('asset:' + a.id, '挂牌与既有独家权利重叠', g.user.id).run()
    return c.json({ error: '与既有已占用权利范围重叠（含父子地区/媒介），已转法务复核', conflicts }, 409)
  }
  const res = await c.env.DB.prepare(`INSERT INTO listings (asset_id,seller_id,type,title,summary,territory,media,language,start_date,end_date,exclusive,price_mode,price_hint,visibility,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'审核中')`).bind(a.id, g.user.id, b.type, b.title || `《${a.title}》${b.type}`, b.summary || a.logline,
    b.territory, b.media, b.language, b.start_date, b.end_date, scope.exclusive, b.price_mode || '面议', b.price_hint || '', b.visibility || '公开摘要').run()
  await c.env.DB.prepare('UPDATE assets SET public_consent=1 WHERE id=?').bind(a.id).run()
  await audit(c.env.DB, g.user, 'listing.create', 'listing:' + res.meta.last_row_id)
  return c.json({ id: res.meta.last_row_id, status: '审核中' })
})
r.post('/listings/:id/access', async (c) => {
  const g = need(c, ['institution', 'distributor']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const l = await c.env.DB.prepare("SELECT * FROM listings WHERE id=? AND status='已发布'").bind(c.req.param('id')).first<any>()
  if (!l) return c.json({ error: '挂牌不存在' }, 404)
  if (!b.nda) return c.json({ error: '请先签署保密协议（NDA）' }, 422)
  const lv = ['故事大纲', '完整剧本', '预算明细', '法务文件'].includes(b.level) ? b.level : '故事大纲'
  const pending = await c.env.DB.prepare("SELECT id FROM access_grants WHERE listing_id=? AND requester_id=? AND status='待批准'").bind(l.id, g.user.id).first()
  if (pending) return c.json({ error: '已有待批准的申请' }, 409)
  const res = await c.env.DB.prepare("INSERT INTO access_grants (listing_id,requester_id,level,purpose,nda_signed,status) VALUES (?,?,?,?,1,'待批准')")
    .bind(l.id, g.user.id, lv, b.purpose || '项目评估').run()
  await audit(c.env.DB, g.user, 'access.request', 'listing:' + l.id, lv)
  return c.json({ id: res.meta.last_row_id, status: '待批准', note: '签署NDA不等于取得全部资料，需权利人逐级批准' })
})
r.post('/access-grants/:id/decide', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const gr = await c.env.DB.prepare('SELECT g.*,l.seller_id FROM access_grants g JOIN listings l ON l.id=g.listing_id WHERE g.id=?').bind(c.req.param('id')).first<any>()
  if (!gr || gr.seller_id !== g.user.id) return c.json({ error: '无权限' }, 403)
  const status = b.action === 'approve' ? '已批准' : b.action === 'revoke' ? '已撤权' : '已拒绝'
  const exp = new Date(Date.now() + (Number(b.days) || 30) * 864e5).toISOString().slice(0, 10)
  await c.env.DB.prepare('UPDATE access_grants SET status=?,expires_at=? WHERE id=?').bind(status, status === '已批准' ? exp : today(), gr.id).run()
  await emit(c.env.DB, status === '已撤权' ? 'access.revoked' : 'access.granted', { grant: gr.id })
  await audit(c.env.DB, g.user, 'access.' + b.action, 'grant:' + gr.id, status)
  return c.json({ status, expires_at: exp })
})
r.post('/deals', async (c) => {
  const g = need(c, ['institution', 'distributor']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const l = await c.env.DB.prepare("SELECT * FROM listings WHERE id=? AND status='已发布'").bind(b.listing_id).first<any>()
  if (!l) return c.json({ error: '挂牌不存在' }, 404)
  const res = await c.env.DB.prepare(`INSERT INTO deals (listing_id,asset_id,buyer_id,seller_id,deal_type,territory,media,language,start_date,end_date,exclusive,amount,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'意向')`).bind(l.id, l.asset_id, g.user.id, l.seller_id, l.type, b.territory || l.territory, b.media || l.media,
    b.language || l.language, b.start_date || l.start_date, b.end_date || l.end_date, b.exclusive ?? l.exclusive, Number(b.amount) || 0).run()
  await audit(c.env.DB, g.user, 'deal.create', 'deal:' + res.meta.last_row_id, '意向（非约束询价不锁权）')
  return c.json({ id: res.meta.last_row_id, status: '意向', note: '非约束询价不锁权；正式签约生效后才占用权利库存' })
})
// 签约生效：原子锁权（AT08 并发独家）
r.post('/deals/:id/activate', async (c) => {
  const g = need(c, ['operator', 'institution', 'distributor']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const db = c.env.DB
  const d = await db.prepare('SELECT * FROM deals WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!d) return c.json({ error: '交易不存在' }, 404)
  if (!['意向', '条款', '已签待生效'].includes(d.status)) return c.json({ error: '当前状态不可生效：' + d.status }, 409)
  if (!b.contract_text) return c.json({ error: '请上传/粘贴合同文本以计算校验值' }, 422)
  const hash = 'sha256:' + (await sha256(b.contract_text))
  // 单条 INSERT…SELECT…WHERE NOT EXISTS 保证原子性：存在重叠独家则插入 0 行
  const ins = await db.prepare(`INSERT INTO rights_reservations (asset_id,source,source_id,territory,media,language,start_date,end_date,exclusive,status)
    SELECT ?,'deal',?,?,?,?,?,?,?,'已占用' WHERE NOT EXISTS (SELECT 1 FROM rights_reservations r WHERE
      r.asset_id = ? AND r.status='已占用'
      AND (r.territory = ? OR r.territory='全球' OR ?='全球')
      AND (r.media = ? OR r.media='全媒体' OR ?='全媒体')
      AND (r.language = ? OR r.language IN ('全语种','不限') OR ? IN ('全语种','不限'))
      AND r.start_date <= ? AND r.end_date >= ? AND (r.exclusive=1 OR ?=1))`)
    .bind(d.asset_id, d.id, d.territory, d.media, d.language, d.start_date, d.end_date, d.exclusive,
      d.asset_id, d.territory, d.territory, d.media, d.media, d.language, d.language, d.end_date, d.start_date, d.exclusive).run()
  if (!ins.meta.changes) {
    await db.prepare("INSERT INTO tickets (kind,object,detail,created_by) VALUES ('法务复核',?,?,?)").bind('deal:' + d.id, '签约时发现独家权利冲突，已阻断', g.user.id).run()
    await audit(db, g.user, 'deal.activate.blocked', 'deal:' + d.id, '独家冲突')
    return c.json({ error: '权利冲突：相同/父子范围已存在独家占用，签约被阻断并转法务复核' }, 409)
  }
  await db.prepare("UPDATE deals SET status='履约中',contract_hash=? WHERE id=?").bind(hash, d.id).run()
  await emit(db, 'deal.activated', { deal: d.id })
  await audit(db, g.user, 'deal.activate', 'deal:' + d.id, hash.slice(0, 20))
  return c.json({ status: '履约中', contract_hash: hash, note: '签约不等于已付款，付款不等于作品验收' })
})

// ======================= 发行中心 M15–M21 =======================
r.post('/releases', async (c) => {
  const g = need(c, ['distributor']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const ch = await c.env.DB.prepare('SELECT * FROM channels WHERE id=?').bind(b.channel_id).first<any>()
  if (!ch) return c.json({ error: '渠道不存在' }, 404)
  const res = await c.env.DB.prepare(`INSERT INTO releases (asset_id,channel_id,deal_id,region,language,media,window_start,window_end,exclusive,status) VALUES (?,?,?,?,?,?,?,?,?,'计划')`)
    .bind(b.asset_id, ch.id, b.deal_id || null, b.region, b.language, b.media, b.window_start, b.window_end, b.exclusive ? 1 : 0).run()
  await audit(c.env.DB, g.user, 'release.plan', 'release:' + res.meta.last_row_id)
  return c.json({ id: res.meta.last_row_id, status: '计划', note: ch.biz_status.startsWith('候选') ? '该渠道仍为候选：可研究匹配，不得送审或宣称已接入' : '' })
})
const FLOW = ['计划', '权利就绪', '送审', '渠道通过', '待上线', '已上线', '到期处置', '归档']
r.post('/releases/:id/advance', async (c) => {
  const g = need(c, ['distributor']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const db = c.env.DB
  const rl = await db.prepare('SELECT r.*,ch.biz_status,ch.name cname FROM releases r JOIN channels ch ON ch.id=r.channel_id WHERE r.id=?').bind(c.req.param('id')).first<any>()
  if (!rl) return c.json({ error: '发行实例不存在' }, 404)
  const next = FLOW[FLOW.indexOf(rl.status) + 1]
  if (!next) return c.json({ error: '已到最终状态' }, 409)
  if (next === '权利就绪') { // rights-check：须有覆盖该窗口的已生效合同
    const ok = await db.prepare(`SELECT 1 FROM rights_reservations WHERE asset_id=? AND status='已占用' AND (territory=? OR territory='全球')
      AND (media=? OR media='全媒体') AND start_date<=? AND end_date>=?`).bind(rl.asset_id, rl.region, rl.media, rl.window_start, rl.window_end).first()
    if (!ok) return c.json({ error: '权利校验未通过：无覆盖该地区/媒介/窗口的有效许可，已转人工复核' }, 409)
  }
  if (next === '送审' && rl.biz_status.startsWith('候选')) return c.json({ error: `渠道「${rl.cname}」仅为候选档案，无合同及运营账号，不得送审（AT15）` }, 409)
  if (next === '已上线') { // AT20：必须有内容ID与上线证据
    if (!b.content_id || !b.evidence) return c.json({ error: '确认上线需渠道内容ID与可用性证据；无证据保持待核实' }, 422)
    await db.prepare("UPDATE releases SET content_id=?,live_evidence=?,live_at=datetime('now') WHERE id=?").bind(b.content_id, b.evidence, rl.id).run()
    await emit(db, 'release.live', { release: rl.id, note: '不触发收入或付款' })
  }
  await db.prepare('UPDATE releases SET status=? WHERE id=?').bind(next, rl.id).run()
  await audit(db, g.user, 'release.advance', 'release:' + rl.id, rl.status + ' → ' + next)
  return c.json({ status: next })
})
r.post('/statements/import', async (c) => {
  const g = need(c, ['distributor', 'finance']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (!b.release_id || !b.period || !b.external_id || !(b.gross >= 0)) return c.json({ error: '缺少发行实例/账期/外部单号/毛额' }, 422)
  const ver = Number(b.version) || 1
  const dup = await c.env.DB.prepare('SELECT id FROM statements WHERE release_id=? AND period=? AND external_id=? AND version=?').bind(b.release_id, b.period, b.external_id, ver).first()
  if (dup) return c.json({ ok: true, duplicated: true, note: '重复导入已去重，不重复记收入（AT22）' })
  const net = +(b.gross - (b.channel_fee || 0)).toFixed(2)
  const res = await c.env.DB.prepare('INSERT INTO statements (release_id,period,external_id,version,currency,gross,channel_fee,net,status) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(b.release_id, b.period, b.external_id, ver, b.currency || 'CNY', b.gross, b.channel_fee || 0, net, ver > 1 ? '更正版' : '已导入').run()
  if (ver > 1) await c.env.DB.prepare("UPDATE statements SET status='已被更正' WHERE release_id=? AND period=? AND external_id=? AND version<?").bind(b.release_id, b.period, b.external_id, ver).run()
  await emit(c.env.DB, 'statement.imported', { id: res.meta.last_row_id })
  return c.json({ id: res.meta.last_row_id, net, note: '账单应收≠实收，需银行回款核验后才能分账' })
})
r.post('/statements/:id/receipt', async (c) => {
  const g = need(c, ['finance']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const s = await c.env.DB.prepare('SELECT * FROM statements WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!s) return c.json({ error: '账单不存在' }, 404)
  if (!b.bank_ref) return c.json({ error: '需银行回款凭证号，付款截图不能认定实收（AT13）' }, 422)
  const amt = Number(b.amount)
  if (!(amt > 0) || s.received + amt > s.net + 0.001) return c.json({ error: '分配金额超出账单净应收，禁止超配（AT23）' }, 409)
  await c.env.DB.prepare("UPDATE statements SET received=received+?,status=? WHERE id=?").bind(amt, s.received + amt >= s.net ? '已全额到账' : '部分到账', s.id).run()
  await emit(c.env.DB, 'receipt.verified', { statement: s.id, amount: amt })
  await audit(c.env.DB, g.user, 'receipt.verify', 'statement:' + s.id, `${b.bank_ref} ¥${amt}`)
  return c.json({ received: s.received + amt, remaining: +(s.net - s.received - amt).toFixed(2) })
})
r.post('/settlements/preview', async (c) => {
  const g = need(c); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  return c.json(settle(Number(b.received) || 0, { commission_pct: Number(b.commission_pct ?? 10), promo: Number(b.promo ?? 0), recoup: Number(b.recoup ?? 0), creator_pct: Number(b.creator_pct ?? 60) }))
})
r.post('/settlements', async (c) => {
  const g = need(c, ['finance', 'distributor']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const s = await c.env.DB.prepare('SELECT * FROM statements WHERE id=?').bind(b.statement_id).first<any>()
  if (!s) return c.json({ error: '账单不存在' }, 404)
  if (!(s.received > 0)) return c.json({ error: '未到账不生成可支付分账（AT21）' }, 409)
  const rule = { commission_pct: Number(b.commission_pct ?? 10), promo: Number(b.promo ?? 0), recoup: Number(b.recoup ?? 0), creator_pct: Number(b.creator_pct ?? 60) }
  const result = settle(s.received, rule)
  const res = await c.env.DB.prepare("INSERT INTO settlements (statement_id,rule,result,status) VALUES (?,?,?,'待审批')").bind(s.id, JSON.stringify(rule), JSON.stringify(result)).run()
  await audit(c.env.DB, g.user, 'settlement.create', 'settlement:' + res.meta.last_row_id)
  return c.json({ id: res.meta.last_row_id, ...result })
})
r.post('/settlements/:id/approve', async (c) => {
  const g = need(c, ['finance']); if (g.err) return g.err
  await c.env.DB.prepare("UPDATE settlements SET status='已审批',approver=? WHERE id=? AND status='待审批'").bind(g.user.id, c.req.param('id')).run()
  await emit(c.env.DB, 'settlement.approved', { id: c.req.param('id') })
  await audit(c.env.DB, g.user, 'settlement.approve', 'settlement:' + c.req.param('id'))
  return c.json({ status: '已审批' })
})

// ======================= M13 联合运营 =======================
r.post('/ops/listings/:id/review', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const l = await c.env.DB.prepare('SELECT l.*,a.rights_status FROM listings l JOIN assets a ON a.id=l.asset_id WHERE l.id=?').bind(c.req.param('id')).first<any>()
  if (!l) return c.json({ error: '不存在' }, 404)
  if (b.action === 'approve' && l.rights_status !== '已清权') return c.json({ error: '作品尚未清权，不能发布挂牌' }, 409)
  const st = b.action === 'approve' ? '已发布' : '补件'
  await c.env.DB.prepare('UPDATE listings SET status=? WHERE id=?').bind(st, l.id).run()
  if (st === '已发布') await emit(c.env.DB, 'listing.approved', { listing: l.id })
  await audit(c.env.DB, g.user, 'listing.review', 'listing:' + l.id, st + (b.reason ? '：' + b.reason : ''))
  return c.json({ status: st })
})
r.post('/ops/assign', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const ex = await c.env.DB.prepare('SELECT id FROM review_assignments WHERE entry_id=? AND expert_id=?').bind(b.entry_id, b.expert_id).first()
  if (ex) return c.json({ error: '该专家已分派此作品' }, 409)
  await c.env.DB.prepare("INSERT INTO review_assignments (entry_id,expert_id,stage) VALUES (?,?,?)").bind(b.entry_id, b.expert_id, b.stage || '初审').run()
  await c.env.DB.prepare("UPDATE entries SET status='评审中' WHERE id=? AND status IN ('已提交','资格通过')").bind(b.entry_id).run()
  await audit(c.env.DB, g.user, 'review.assign', 'entry:' + b.entry_id, 'expert:' + b.expert_id)
  return c.json({ ok: true })
})
r.post('/ops/award-results', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const res = await c.env.DB.prepare("INSERT INTO award_results (award_id,entry_id,status,approver1) VALUES (?,?,'待批准',?)").bind(b.award_id, b.entry_id, g.user.id).run()
  await audit(c.env.DB, g.user, 'award.propose', 'award_result:' + res.meta.last_row_id, '审批人1')
  return c.json({ id: res.meta.last_row_id, status: '待批准', note: '需第二名授权人批准后进入未公开结果库' })
})
r.post('/ops/award-results/:id/:action', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const db = c.env.DB, action = c.req.param('action')
  const ar = await db.prepare(`SELECT ar.*,aw.name award,a.title,a.team,v.version,e.name edition,en.id eid FROM award_results ar JOIN awards aw ON aw.id=ar.award_id
    JOIN entries en ON en.id=ar.entry_id JOIN assets a ON a.id=en.asset_id LEFT JOIN asset_versions v ON v.id=en.version_id JOIN editions e ON e.id=en.edition_id
    WHERE ar.id=?`).bind(c.req.param('id')).first<any>()
  if (!ar) return c.json({ error: '不存在' }, 404)
  const b = await c.req.json().catch(() => ({}))
  if (action === 'approve') {
    if (ar.status !== '待批准') return c.json({ error: '状态不符' }, 409)
    if (ar.approver1 === g.user.id) return c.json({ error: '双人审批：第二审批人不能与提名人相同' }, 403)
    await db.prepare("UPDATE award_results SET status='未公开',approver2=? WHERE id=?").bind(g.user.id, ar.id).run()
  } else if (action === 'publish') {
    if (ar.status !== '未公开') return c.json({ error: '需先完成双人批准' }, 409)
    const code = `DDSD-${new Date().getFullYear()}-${rid(4)}`
    await db.batch([
      db.prepare("UPDATE award_results SET status='有效',published_at=datetime('now') WHERE id=?").bind(ar.id),
      db.prepare("UPDATE entries SET status='获奖' WHERE id=?").bind(ar.eid),
      db.prepare("INSERT INTO certificates (code,award_result_id,holder,work_title,version,award_name,edition_name,issuer,issued_at) VALUES (?,?,?,?,?,?,?,?,date('now'))")
        .bind(code, ar.id, (ar.team || '').split('、')[0] + ' 团队', ar.title, ar.version || 'V1.0', ar.award, ar.edition, '迭代盛典组委会'),
      // award.published 只生成挂牌邀请，不替用户上架
      db.prepare("INSERT INTO tickets (kind,object,detail,created_by) VALUES ('挂牌邀请',?,?,?)").bind('entry:' + ar.eid, `《${ar.title}》获奖：邀请权利人申请影市精选（不自动上架）`, g.user.id),
    ])
    await emit(db, 'award.published', { award_result: ar.id })
    await audit(db, g.user, 'award.publish', 'award_result:' + ar.id, code)
    return c.json({ status: '有效', certificate: code })
  } else if (action === 'revoke') {
    if (!b.reason) return c.json({ error: '撤销需填写原因' }, 422)
    await db.batch([
      db.prepare("UPDATE award_results SET status='已撤销',revoke_reason=? WHERE id=?").bind(b.reason, ar.id),
      db.prepare("UPDATE certificates SET status='已撤销' WHERE award_result_id=?").bind(ar.id),
      db.prepare("INSERT INTO tickets (kind,object,detail,created_by) VALUES ('交易复核',?,?,?)").bind('award_result:' + ar.id, '荣誉撤销：徽章即时失效，通知相关交易方（不自动解除已签合同）', g.user.id),
    ])
    await emit(db, 'award.revoked', { award_result: ar.id })
  } else return c.json({ error: '未知操作' }, 400)
  await audit(db, g.user, 'award.' + action, 'award_result:' + ar.id, b.reason || '')
  return c.json({ ok: true })
})
r.get('/ops/audit', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const logs = (await c.env.DB.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all()).results
  const events = (await c.env.DB.prepare('SELECT * FROM outbox ORDER BY created_at DESC LIMIT 50').all()).results
  return c.json({ logs, events })
})

export default r
