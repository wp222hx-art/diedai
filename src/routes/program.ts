import { Hono } from 'hono'
import { Env, need, audit, emit, rid } from '../lib/core'
import { POOL_YUAN, POOL_STD, STD_PRICE, MODELS } from '../lib/lightyear'

/**
 * 迭影计划 · 主流程
 * 报名 → 线上初选（邀请打分，贝叶斯加权排名）→ 晋级路演 → 路演评审 → 双人审批 → 算力发放
 */
const r = new Hono<Env>()

const M = 10 // 贝叶斯平滑：少于 M 票的作品向全站均值收缩，防止少量刷分
const MIN_VOTES = 15 // 晋级路演的最低有效评分人数
const PROMOTE_TOP = 0.25 // 每条赛道前 25% 推荐晋级
const TRACKS = ['专业团队', '院校毕业生']
const FORMS = ['AI电影', 'AI短片', 'AI剧集', 'AI动画']

const EXPORT = {
  data: [
    { k: '20.6 亿美元', v: '2025 年海外短剧应用内购收入，同比 +126.1%', src: '百度百科「海外短剧市场」引 DataEye 数据', url: 'https://baike.baidu.com/item/%E6%B5%B7%E5%A4%96%E7%9F%AD%E5%89%A7%E5%B8%82%E5%9C%BA/67512705' },
    { k: '6.5 亿美元', v: '2026 年海外 AI 剧 / 漫剧市场规模预估，同比 +550%', src: '钛媒体引 DataEye 研究院，2026-08', url: 'https://www.tmtpost.com/8119642.html' },
    { k: '200 万美元+', v: '2026 年 4 月 TikTok AI 短剧单月分账，环比 +300%', src: '虎嗅，2026-05', url: 'https://www.huxiu.com/article/4861158.html' },
  ],
  services: [
    ['多语种译配', 'AI 字幕 + 配音，英 / 西 / 葡 / 印尼 / 泰 / 阿语等，人工母语审校'],
    ['合规与标识', '生成合成内容标识、肖像与音乐权利链核验、目标国分级预审'],
    ['海外版权交易', '按地区 / 媒介 / 期限拆分授权，权利库存锁定，防一权多售'],
    ['平台分发', '短剧平台、视频平台、FAST 频道与电影节选片对接'],
    ['回款与分账', '海外报表导入、币种折算、按实收自动分账'],
  ],
  channels: [
    ['TikTok 短剧', '东南亚 / 北美 / 中东', '分账'],
    ['ReelShort · DramaBox 等短剧 App', '北美 / 欧洲', '买断 / 分账'],
    ['YouTube', '全球', '广告分成'],
    ['FAST 频道', '北美', '授权费'],
    ['国际电影节与市场展', '柏林 / 戛纳 / 釜山 / 香港国际影视展', '选片 / 版权销售'],
  ],
}

async function board(db: D1Database, track?: string) {
  const g = await db.prepare('SELECT AVG((story+visual+craft)/3.0) c FROM program_votes').first<any>()
  const C = g?.c || 7
  const rows = (await db.prepare(`SELECT a.id,a.code,a.title,a.team,a.track,a.school,a.grad_year,a.form,a.minutes,a.logline,a.status,
      COUNT(v.id) votes, AVG((v.story+v.visual+v.craft)/3.0) avg, AVG(v.story) s1, AVG(v.visual) s2, AVG(v.craft) s3
      FROM program_apps a LEFT JOIN program_votes v ON v.app_id=a.id ${track ? 'WHERE a.track=?' : ''}
      GROUP BY a.id`).bind(...(track ? [track] : [])).all()).results as any[]
  for (const x of rows) {
    const R = x.avg || 0
    x.score = x.votes ? +((x.votes / (x.votes + M)) * R + (M / (x.votes + M)) * C).toFixed(2) : 0
    x.avg = x.avg ? +x.avg.toFixed(2) : 0
    ;['s1', 's2', 's3'].forEach((k) => (x[k] = x[k] ? +x[k].toFixed(1) : 0))
  }
  rows.sort((a, b) => b.score - a.score || b.votes - a.votes)
  // 赛道内排名与推荐线
  for (const t of TRACKS) {
    const list = rows.filter((x) => x.track === t)
    const cut = Math.max(1, Math.ceil(list.length * PROMOTE_TOP))
    list.forEach((x, i) => { x.rank = i + 1; x.recommend = i < cut && x.votes >= MIN_VOTES })
  }
  return { rows, C: +C.toFixed(2) }
}

// ---------------- 公开：计划总览 ----------------
r.get('/program/overview', async (c) => {
  const db = c.env.DB
  const st = await db.prepare(`SELECT COUNT(*) apps, SUM(track='院校毕业生') grads, SUM(status IN ('晋级路演','路演通过','已审批')) roadshow,
    SUM(status='已审批') granted, (SELECT COUNT(*) FROM program_votes) votes, (SELECT COUNT(DISTINCT school) FROM program_apps WHERE school IS NOT NULL) schools FROM program_apps`).first<any>()
  const pool = await db.prepare('SELECT COALESCE(SUM(granted),0) g FROM compute_buckets').first<any>()
  const buckets = (await db.prepare('SELECT code,name,amount_yuan,std_tokens,granted,intro FROM compute_buckets ORDER BY sort').all()).results
  const people = (await db.prepare('SELECT * FROM program_people ORDER BY sort').all()).results
  const { rows } = await board(db)
  return c.json({
    pool: { yuan: POOL_YUAN, std: POOL_STD, granted: pool.g, std_price: STD_PRICE },
    stats: st, buckets, people, top: rows.slice(0, 6), models: MODELS,
    rules: { min_votes: MIN_VOTES, top_pct: PROMOTE_TOP * 100, m: M },
    timeline: [
      { k: '报名', d: '即日起 — 2027.01.31', t: '专业团队、院校毕业生均可报名；提交样片或概念片' },
      { k: '线上初选', d: '2027.02.01 — 02.28', t: '邀请他人打分，赛道前 25% 且 ≥15 人评分推荐晋级' },
      { k: '路演', d: '2027.03', t: '评审与导师现场 / 线上路演评议' },
      { k: '审批与发放', d: '2027.04 起', t: '双人审批后算力到账，进入完片孵化与发行' },
    ],
    export: EXPORT,
    note: '5,000 万元为合作方拟提供的 Seedance 算力面值，具体以双方书面协议为准；评审与导师名单为其公开报道中的行业评审经历，本平台邀约中，以官方公布为准。',
  })
})

// ---------------- 公开：初选榜 ----------------
r.get('/program/board', async (c) => {
  const t = c.req.query('track')
  const res = await board(c.env.DB, TRACKS.includes(t || '') ? t : undefined)
  return c.json({ ...res, rules: { min_votes: MIN_VOTES, top_pct: PROMOTE_TOP * 100, m: M } })
})

r.get('/program/apps/:code', async (c) => {
  const code = c.req.param('code')
  const { rows } = await board(c.env.DB)
  const a = rows.find((x) => x.code === code)
  if (!a) return c.json({ error: '作品不存在或链接已失效' }, 404)
  const recent = (await c.env.DB.prepare("SELECT name,comment,created_at FROM program_votes WHERE app_id=? AND comment IS NOT NULL AND comment<>'' ORDER BY id DESC LIMIT 8").bind(a.id).all()).results
  return c.json({ app: a, recent })
})

// ---------------- 公开：邀请打分 ----------------
r.post('/program/vote/:code', async (c) => {
  const db = c.env.DB
  const b = await c.req.json().catch(() => ({}))
  const a = await db.prepare('SELECT id,user_id,status FROM program_apps WHERE code=?').bind(c.req.param('code')).first<any>()
  if (!a) return c.json({ error: '作品不存在' }, 404)
  if (a.status !== '初选中' && a.status !== '晋级路演') return c.json({ error: '该作品已结束初选打分' }, 409)
  const u = c.get('user')
  if (u && u.id === a.user_id) return c.json({ error: '不能为自己的作品打分' }, 403)
  const sc = ['story', 'visual', 'craft'].map((k) => Number(b[k]))
  if (sc.some((x) => !Number.isInteger(x) || x < 1 || x > 10)) return c.json({ error: '请为叙事、视觉、完成度分别打 1—10 分' }, 422)
  const key = u ? 'u:' + u.id : String(b.device || '').slice(0, 64)
  if (!u && key.length < 12) return c.json({ error: '缺少设备标识' }, 422)
  const res = await db.prepare('INSERT OR IGNORE INTO program_votes (app_id,voter_key,user_id,name,story,visual,craft,comment) VALUES (?,?,?,?,?,?,?,?)')
    .bind(a.id, u ? key : 'd:' + key, u?.id ?? null, u ? u.name : String(b.name || '匿名观众').slice(0, 20), sc[0], sc[1], sc[2], String(b.comment || '').slice(0, 200)).run()
  if (!res.meta.changes) return c.json({ error: '你已为该作品打过分' }, 409)
  return c.json({ ok: true })
})

// ---------------- 创作者：报名与我的作品 ----------------
r.post('/program/apply', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const miss: string[] = []
  if (!b.title) miss.push('作品名称')
  if (!b.team) miss.push('团队名称')
  if (!TRACKS.includes(b.track)) miss.push('报名赛道')
  if (!FORMS.includes(b.form)) miss.push('作品形态')
  if (!b.logline || String(b.logline).length < 10) miss.push('一句话梗概（≥10字）')
  if (b.track === '院校毕业生') {
    if (!b.school) miss.push('毕业院校')
    const y = Number(b.grad_year)
    if (!(y >= 2021 && y <= 2027)) miss.push('毕业年份（2021—2027 届）')
  }
  if (!b.accept) miss.push('同意《迭影计划报名规则》')
  if (miss.length) return c.json({ error: '报名信息不完整', missing: miss }, 422)
  const title = String(b.title).replace(/^《|》$/g, '')
  const code = rid(6).toUpperCase()
  try {
    const res = await c.env.DB.prepare(`INSERT INTO program_apps (code,user_id,title,team,track,school,grad_year,form,minutes,logline,video_url,members)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(code, g.user.id, '《' + title + '》', b.team, b.track, b.track === '院校毕业生' ? b.school : null,
      b.track === '院校毕业生' ? Number(b.grad_year) : null, b.form, Number(b.minutes) || null, b.logline, b.video_url || null, b.members || null).run()
    await audit(c.env.DB, g.user, 'program.apply', 'program_app:' + res.meta.last_row_id, b.track)
    await emit(c.env.DB, 'program.applied', { id: res.meta.last_row_id, code })
    return c.json({ id: res.meta.last_row_id, code })
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) return c.json({ error: '同名作品已报名' }, 409)
    throw e
  }
})

r.get('/program/mine', async (c) => {
  const g = need(c); if (g.err) return g.err
  const { rows } = await board(c.env.DB)
  const mine = (await c.env.DB.prepare('SELECT id,grant_yuan,roadshow_score,roadshow_note FROM program_apps WHERE user_id=?').bind(g.user.id).all()).results as any[]
  const ids = new Map(mine.map((x) => [x.id, x]))
  const apps = rows.filter((x) => ids.has(x.id)).map((x) => ({ ...x, ...ids.get(x.id) }))
  const gr = await c.env.DB.prepare("SELECT COALESCE(SUM(tokens),0) t FROM compute_grants WHERE user_id=? AND status IN ('已到账','已授予')").bind(g.user.id).first<any>()
  const us = await c.env.DB.prepare('SELECT COALESCE(SUM(std_tokens),0) t FROM compute_usage WHERE user_id=?').bind(g.user.id).first<any>()
  return c.json({ apps, balance: { granted: gr.t, used: us.t, available: gr.t - us.t } })
})

// ---------------- 公开：配套资源 ----------------
r.get('/program/likeness', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT * FROM likeness_library ORDER BY id').all()).results
  return c.json({ rows, note: '肖像 / 声音授权库为合作洽谈中的演示条目，具体艺人、范围与费用以正式授权合同为准；使用须逐项目报备并添加生成合成标识。' })
})
r.post('/program/likeness/:id/request', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (!b.purpose || String(b.purpose).length < 10) return c.json({ error: '请说明项目与使用场景（≥10字）' }, 422)
  await audit(c.env.DB, g.user, 'likeness.request', 'likeness:' + c.req.param('id'), String(b.purpose).slice(0, 200))
  await emit(c.env.DB, 'likeness.requested', { id: c.req.param('id'), user: g.user.id })
  return c.json({ ok: true })
})

// ---------------- 运营：初选 / 路演 / 审批 ----------------
r.get('/program/admin', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const { rows } = await board(c.env.DB)
  const ext = (await c.env.DB.prepare('SELECT id,roadshow_score,roadshow_note,grant_yuan,approver1,approver2 FROM program_apps').all()).results as any[]
  const m = new Map(ext.map((x) => [x.id, x]))
  return c.json({ rows: rows.map((x) => ({ ...x, ...m.get(x.id) })), rules: { min_votes: MIN_VOTES, top_pct: PROMOTE_TOP * 100 } })
})

r.post('/program/promote', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const { rows } = await board(c.env.DB)
  const ids = rows.filter((x) => x.recommend && x.status === '初选中').map((x) => x.id)
  for (const id of ids) await c.env.DB.prepare("UPDATE program_apps SET status='晋级路演' WHERE id=? AND status='初选中'").bind(id).run()
  await audit(c.env.DB, g.user, 'program.promote', 'program', ids.join(','))
  return c.json({ promoted: ids.length })
})

r.post('/program/apps/:id/roadshow', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const score = Number(b.score)
  if (!(score >= 0 && score <= 100) || !b.note) return c.json({ error: '请填写路演评分（0—100）与评议意见' }, 422)
  const pass = score >= 70
  const res = await c.env.DB.prepare("UPDATE program_apps SET roadshow_score=?, roadshow_note=?, status=? WHERE id=? AND status='晋级路演'")
    .bind(score, b.note, pass ? '路演通过' : '未通过', c.req.param('id')).run()
  if (!res.meta.changes) return c.json({ error: '仅“晋级路演”状态可录入路演结果' }, 409)
  await audit(c.env.DB, g.user, 'program.roadshow', 'program_app:' + c.req.param('id'), `${score} ${pass ? '通过' : '未通过'}`)
  return c.json({ status: pass ? '路演通过' : '未通过' })
})

r.post('/program/apps/:id/approve', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const a = await db.prepare('SELECT * FROM program_apps WHERE id=?').bind(id).first<any>()
  if (!a) return c.json({ error: '报名不存在' }, 404)
  if (a.status !== '路演通过') return c.json({ error: '仅“路演通过”的项目可审批算力' }, 409)
  if (!a.approver1) {
    const yuan = Number((await c.req.json().catch(() => ({}))).grant_yuan)
    if (!(yuan >= 10000 && yuan <= 3000000)) return c.json({ error: '核定算力面值须在 1 万—300 万元之间' }, 422)
    await db.prepare('UPDATE program_apps SET approver1=?, grant_yuan=? WHERE id=? AND approver1 IS NULL').bind(g.user.id, yuan, id).run()
    await audit(db, g.user, 'program.approve1', 'program_app:' + id, String(yuan))
    return c.json({ stage: '待复核', grant_yuan: yuan })
  }
  if (a.approver1 === g.user.id) return c.json({ error: '双人审批：复核人不能与初审人相同' }, 403)
  const tokens = Math.round((a.grant_yuan / STD_PRICE) * 1e6)
  const bucket = a.track === '院校毕业生' ? 'honor' : 'selected'
  const lock = await db.prepare("UPDATE program_apps SET approver2=?, status='已审批' WHERE id=? AND status='路演通过' AND approver2 IS NULL").bind(g.user.id, id).run()
  if (!lock.meta.changes) return c.json({ error: '该项目已被处理' }, 409)
  const take = await db.prepare('UPDATE compute_buckets SET granted=granted+? WHERE code=? AND granted+?<=std_tokens').bind(tokens, bucket, tokens).run()
  if (!take.meta.changes) {
    await db.prepare("UPDATE program_apps SET approver2=NULL, status='路演通过' WHERE id=?").bind(id).run()
    return c.json({ error: '资金池余额不足' }, 409)
  }
  const gr = await db.prepare("INSERT INTO compute_grants (user_id,task_code,tier,bucket,tokens,status,note,approver) VALUES (?,?,?,?,?,'已授予',?,?)")
    .bind(a.user_id, 'program:' + id, a.track === '院校毕业生' ? '院校专项' : '路演扶持', bucket, tokens, `${a.title} 迭影计划路演通过 · 算力面值 ¥${a.grant_yuan.toLocaleString()}`, g.user.id).run()
  await db.prepare('UPDATE program_apps SET grant_id=? WHERE id=?').bind(gr.meta.last_row_id, id).run()
  await audit(db, g.user, 'program.approve2', 'program_app:' + id, `${tokens} std tokens`)
  await emit(db, 'program.granted', { id, tokens })
  return c.json({ stage: '已审批', tokens })
})

// ---------------- 金鼎盛典栏目 ----------------
r.get('/jinding', async (c) => {
  const db = c.env.DB
  const sections = ((await db.prepare('SELECT code,title,body,status,updated_at FROM jd_sections ORDER BY sort').all()).results as any[]).map((x) => ({ ...x, body: JSON.parse(x.body || '{}') }))
  const posts = (await db.prepare('SELECT id,title,pub_date,category,summary,source,url,cover FROM jd_posts ORDER BY pub_date DESC, id DESC').all()).results
  const honors = (await db.prepare(`SELECT ce.code cert, aw.name award, a.title, a.form, e.name edition FROM award_results ar JOIN awards aw ON aw.id=ar.award_id
    JOIN entries en ON en.id=ar.entry_id JOIN assets a ON a.id=en.asset_id JOIN editions e ON e.id=en.edition_id
    LEFT JOIN certificates ce ON ce.award_result_id=ar.id WHERE ar.status='有效' ORDER BY ar.id DESC LIMIT 6`).all()).results
  return c.json({ sections, posts, honors, note: '本栏目体系内容为依据合作方案整理的草案；“公众号文章”栏目仅收录经授权导入的官方文章，并保留原文链接。' })
})
r.get('/jinding/posts/:id', async (c) => {
  const p = await c.env.DB.prepare('SELECT * FROM jd_posts WHERE id=?').bind(c.req.param('id')).first()
  return p ? c.json(p) : c.json({ error: '文章不存在' }, 404)
})
r.post('/jinding/posts', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (!b.title || !b.body) return c.json({ error: '请填写标题与正文' }, 422)
  if (b.url && !/^https?:\/\//.test(b.url)) return c.json({ error: '原文链接格式不正确' }, 422)
  try {
    const res = await c.env.DB.prepare('INSERT INTO jd_posts (title,pub_date,category,summary,body,cover,source,url,created_by) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(String(b.title).slice(0, 120), b.pub_date || null, b.category || '盛典动态', String(b.summary || String(b.body).slice(0, 120)).slice(0, 300), String(b.body).slice(0, 50000), b.cover || null, b.source || '金鼎盛典公众号', b.url || null, g.user.id).run()
    await audit(c.env.DB, g.user, 'jinding.post', 'jd_post:' + res.meta.last_row_id, b.title)
    return c.json({ id: res.meta.last_row_id })
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) return c.json({ error: '该原文链接已导入' }, 409)
    throw e
  }
})
r.put('/jinding/sections/:code', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (!b.body || typeof b.body !== 'object') return c.json({ error: '内容格式不正确' }, 422)
  const res = await c.env.DB.prepare("UPDATE jd_sections SET body=?, title=COALESCE(?,title), status=COALESCE(?,status), updated_at=datetime('now') WHERE code=?")
    .bind(JSON.stringify(b.body), b.title || null, b.status || null, c.req.param('code')).run()
  if (!res.meta.changes) return c.json({ error: '栏目不存在' }, 404)
  await audit(c.env.DB, g.user, 'jinding.section', 'jd_section:' + c.req.param('code'))
  return c.json({ ok: true })
})

export default r
