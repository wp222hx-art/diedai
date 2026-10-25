import { Hono } from 'hono'
import { Env, need, audit, emit } from '../lib/core'
import { predict, TASKS, TIERS, HONOR_BONUS, POOL_STD, POOL_YUAN, STD_PRICE, STYLES, SHOTS, FORMS, EXP, MODELS, RES, usageTokens, PredictInput } from '../lib/lightyear'

const r = new Hono<Env>()
const LIVE = "('已到账','已授予')"

async function balance(db: D1Database, uid: number) {
  const g = await db.prepare(`SELECT COALESCE(SUM(tokens),0) t FROM compute_grants WHERE user_id=? AND status IN ${LIVE}`).bind(uid).first<any>()
  const u = await db.prepare('SELECT COALESCE(SUM(std_tokens),0) t FROM compute_usage WHERE user_id=?').bind(uid).first<any>()
  return { granted: g.t, used: u.t, available: g.t - u.t }
}
/** 从资金池扣减，原子校验余量 */
async function takeFromBucket(db: D1Database, bucket: string, tokens: number) {
  const res = await db.prepare('UPDATE compute_buckets SET granted=granted+? WHERE code=? AND granted+?<=std_tokens').bind(tokens, bucket, tokens).run()
  return !!res.meta.changes
}

// ---------------- 公开：活动总览 ----------------
r.get('/lightyear/overview', async (c) => {
  const db = c.env.DB
  const buckets = (await db.prepare('SELECT * FROM compute_buckets ORDER BY sort').all()).results as any[]
  const granted = buckets.reduce((a, b) => a + b.granted, 0)
  const stats = await db.prepare(`SELECT (SELECT COUNT(DISTINCT user_id) FROM compute_grants WHERE status IN ${LIVE}) creators,
    (SELECT COUNT(*) FROM compute_predictions) predictions, (SELECT COUNT(DISTINCT asset_id) FROM compute_grants WHERE asset_id IS NOT NULL AND status IN ${LIVE}) projects,
    (SELECT COALESCE(SUM(seconds),0) FROM compute_usage) seconds`).first()
  const feed = (await db.prepare(`SELECT g.tier,g.tokens,g.note,g.created_at,u.name FROM compute_grants g JOIN users u ON u.id=g.user_id
    WHERE g.status IN ${LIVE} ORDER BY g.id DESC LIMIT 12`).all()).results.map((x: any) => ({ ...x, name: x.name[0] + '**' }))
  const ref = predict({ form: 'series', style: 'oriental', minutes: 60, coverage: 90, resolution: '720p', model: 'mix', mix: { dialog: 45, action: 15, vfx: 10, crowd: 5, ambient: 25 }, experience: 'skilled', k: 2, refRatio: 0, operators: 3 })
  return c.json({
    pool: { yuan: POOL_YUAN, std: POOL_STD, granted, std_price: STD_PRICE, ref_cost: ref.base.cost, ref_projects: Math.floor(POOL_YUAN / ref.base.cost) },
    buckets, stats, feed, tasks: TASKS, tiers: TIERS, honor_bonus: HONOR_BONUS,
    models: MODELS, styles: STYLES, shots: SHOTS, forms: FORMS, exp: EXP, res: RES,
    note: '“标准Token”按 Seedance 2.0 不含视频输入刊例价 46元/百万tokens 折算；5000万元为合作方拟提供的算力面值，具体以双方书面协议为准。算力不可提现、转售或跨项目转移。',
  })
})

// ---------------- 公开：迭影测算 ----------------
r.post('/lightyear/predict', async (c) => {
  const b = await c.req.json().catch(() => ({}))
  const inp: PredictInput = {
    form: FORMS[b.form] ? b.form : 'series', style: STYLES[b.style] ? b.style : 'realistic',
    minutes: Math.min(600, Math.max(1, Number(b.minutes) || 60)), coverage: Math.min(100, Math.max(10, Number(b.coverage) || 100)),
    resolution: RES[b.resolution] ? b.resolution : '720p', model: ['2.0', '2.5', 'mix'].includes(b.model) ? b.model : 'mix',
    mix: Object.fromEntries(Object.keys(SHOTS).map((k) => [k, Math.max(0, Number(b.mix?.[k]) || 0)])),
    experience: EXP[b.experience] ? b.experience : 'skilled', k: Math.min(6, Math.max(1, Number(b.k) || 2)),
    refRatio: Math.min(1, Math.max(0, Number(b.refRatio) || 0)), operators: Math.min(50, Math.max(1, Number(b.operators) || 3)),
  }
  if (!Object.values(inp.mix).some((v) => v > 0)) inp.mix = { dialog: 50, action: 15, vfx: 10, crowd: 5, ambient: 20 }
  const res = predict(inp)
  const u = c.get('user')
  let id = null
  if (u) {
    const ins = await c.env.DB.prepare('INSERT INTO compute_predictions (user_id,asset_id,input,result,std_tokens) VALUES (?,?,?,?,?)')
      .bind(u.id, b.asset_id || null, JSON.stringify(inp), JSON.stringify({ base: res.base.std, low: res.low.std, high: res.high.std, weeks: res.totalWeeks }), res.base.std).run()
    id = ins.meta.last_row_id
  }
  return c.json({ prediction_id: id, ...res })
})

// ---------------- 我的算力钱包 ----------------
r.get('/lightyear/me', async (c) => {
  const g = need(c); if (g.err) return g.err
  return c.json(await myState(c.env.DB, g.user))
})

async function myState(db: D1Database, user: { id: number; role: string }) {
  const uid = user.id
  const g = { user }
  const counts = await db.prepare(`SELECT (SELECT COUNT(*) FROM assets WHERE owner_id=?) assets,(SELECT COUNT(*) FROM entries WHERE user_id=?) entries,
    (SELECT COUNT(*) FROM listings WHERE seller_id=?) listings,(SELECT COUNT(*) FROM bookings WHERE user_id=?) events,
    (SELECT COUNT(*) FROM compute_predictions WHERE user_id=?) predictions`).bind(uid, uid, uid, uid, uid).first<any>()
  const grants = (await db.prepare('SELECT g.*,a.title FROM compute_grants g LEFT JOIN assets a ON a.id=g.asset_id WHERE g.user_id=? ORDER BY g.id DESC').bind(uid).all()).results as any[]
  const claimed = new Set(grants.map((x) => x.task_code))
  const done: Record<string, boolean> = { join: g.user.role === 'creator', asset: counts.assets > 0, predict: counts.predictions > 0, entry: counts.entries > 0, listing: counts.listings > 0, event: counts.events > 0 }
  const tasks = TASKS.map((t) => ({ ...t, done: done[t.code], claimed: claimed.has(t.code), locked: counts.assets === 0 }))
  // 荣誉加成任务
  const honors = (await db.prepare(`SELECT ar.id,aw.name award,a.title,a.id asset_id FROM award_results ar JOIN awards aw ON aw.id=ar.award_id JOIN entries en ON en.id=ar.entry_id
    JOIN assets a ON a.id=en.asset_id WHERE en.user_id=? AND ar.status='有效'`).bind(uid).all()).results.map((h: any) => ({ ...h, code: 'honor:' + h.id, claimed: claimed.has('honor:' + h.id), tokens: HONOR_BONUS }))
  // 每个作品的可申请星级
  const assets = (await db.prepare('SELECT id,title,form,total_minutes FROM assets WHERE owner_id=?').bind(uid).all()).results as any[]
  for (const a of assets) {
    a.eligible = await eligibleTiers(db, a.id)
    a.last_prediction = await db.prepare('SELECT id,std_tokens,created_at FROM compute_predictions WHERE user_id=? AND asset_id=? ORDER BY id DESC LIMIT 1').bind(uid, a.id).first()
  }
  const usage = (await db.prepare('SELECT * FROM compute_usage WHERE user_id=? ORDER BY id DESC LIMIT 30').bind(uid).all()).results
  const level = grants.some((x) => x.tier === '共创' && x.status !== '已拒绝') ? '共创' : grants.some((x) => x.tier === '孵化' && x.status !== '已拒绝') ? '孵化' : grants.some((x) => x.tier === '入选') ? '入选' : counts.assets ? '体验' : '未点亮'
  return { balance: await balance(db, uid), level, tasks, honors, assets, grants, usage }
}

async function eligibleTiers(db: D1Database, assetId: number) {
  const out: string[] = []
  const sel = await db.prepare(`SELECT 1 FROM entries en WHERE en.asset_id=? AND (en.status IN ('提名','获奖')
      OR EXISTS (SELECT 1 FROM review_assignments ra WHERE ra.entry_id=en.id AND ra.status='已提交' AND ra.total>=70)
      OR EXISTS (SELECT 1 FROM award_results ar WHERE ar.entry_id=en.id AND ar.status='有效'))`).bind(assetId).first()
  if (sel) out.push('入选')
  const pj = (await db.prepare("SELECT package FROM projects WHERE asset_id=? AND status NOT IN ('待材料审核','待专业评审')").bind(assetId).all()).results as any[]
  if (pj.some((p) => p.package === '孵化包')) out.push('孵化')
  if (pj.some((p) => p.package === '联合开发包')) out.push('共创')
  return out
}

// ---------------- 领取任务奖励 ----------------
r.post('/lightyear/claim', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const { code } = await c.req.json().catch(() => ({}))
  const db = c.env.DB, uid = g.user.id
  const me: any = await myState(db, g.user)
  let tokens = 0, note = '', assetId: number | null = null, bucket = 'onboard', tier = '体验'
  if (String(code).startsWith('honor:')) {
    const h = me.honors.find((x: any) => x.code === code)
    if (!h) return c.json({ error: '没有可领取的荣誉加成' }, 404)
    tokens = HONOR_BONUS; note = `荣誉加成：《${h.title}》${h.award}`; assetId = h.asset_id; bucket = 'honor'; tier = '入选'
  } else {
    const t = me.tasks.find((x: any) => x.code === code)
    if (!t) return c.json({ error: '任务不存在' }, 404)
    if (t.locked) return c.json({ error: '请先建立作品档案——“有项目”才能共享迭影算力' }, 409)
    if (!t.done) return c.json({ error: '任务尚未完成：' + t.desc }, 409)
    tokens = t.tokens; note = t.name
  }
  const dup = await db.prepare('SELECT id FROM compute_grants WHERE user_id=? AND task_code=?').bind(uid, code).first()
  if (dup) return c.json({ error: '已领取过该奖励' }, 409)
  if (!(await takeFromBucket(db, bucket, tokens))) return c.json({ error: '该资金池额度已发放完毕，敬请关注下一期' }, 409)
  try {
    await db.prepare("INSERT INTO compute_grants (user_id,asset_id,task_code,tier,bucket,tokens,status,note) VALUES (?,?,?,?,?,?,'已到账',?)").bind(uid, assetId, code, tier, bucket, tokens, note).run()
  } catch {
    await db.prepare('UPDATE compute_buckets SET granted=granted-? WHERE code=?').bind(tokens, bucket).run() // 补偿
    return c.json({ error: '已领取过该奖励' }, 409)
  }
  await emit(db, 'compute.granted', { user: uid, code, tokens })
  await audit(db, g.user, 'lightyear.claim', 'task:' + code, tokens + ' 标准Token')
  return c.json({ ok: true, tokens, balance: await balance(db, uid) })
})

// ---------------- 申请定向额度（入选/孵化/共创）----------------
r.post('/lightyear/apply', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const db = c.env.DB
  const a = await db.prepare('SELECT * FROM assets WHERE id=? AND owner_id=?').bind(b.asset_id, g.user.id).first<any>()
  if (!a) return c.json({ error: '作品不存在或无权限' }, 403)
  const tier = TIERS.find((t) => t.code === b.tier && t.pct)
  if (!tier) return c.json({ error: '请选择入选/孵化/共创' }, 422)
  const el = await eligibleTiers(db, a.id)
  if (!el.includes(tier.code)) return c.json({ error: `《${a.title}》尚未满足「${tier.name}」条件：${tier.cond}` }, 409)
  const pr = await db.prepare('SELECT * FROM compute_predictions WHERE id=? AND user_id=?').bind(b.prediction_id, g.user.id).first<any>()
  if (!pr) return c.json({ error: '请先为该作品完成一次迭影测算，额度按预测基准用量核定' }, 422)
  const tokens = Math.min(tier.cap!, Math.round(pr.std_tokens * tier.pct!))
  const code = `apply:${a.id}:${tier.code}`
  const dup = await db.prepare("SELECT id FROM compute_grants WHERE user_id=? AND task_code=? AND status!='已拒绝'").bind(g.user.id, code).first()
  if (dup) return c.json({ error: '该作品已申请过此星级额度' }, 409)
  await db.prepare("DELETE FROM compute_grants WHERE user_id=? AND task_code=? AND status='已拒绝'").bind(g.user.id, code).run()
  const res = await db.prepare("INSERT INTO compute_grants (user_id,asset_id,task_code,tier,bucket,tokens,status,prediction_id,note) VALUES (?,?,?,?,?,?,'待审批',?,?)")
    .bind(g.user.id, a.id, code, tier.code, tier.bucket, tokens, pr.id, `《${a.title}》${tier.name}定向额度`).run()
  await audit(db, g.user, 'lightyear.apply', 'grant:' + res.meta.last_row_id, `${tier.code} ${tokens}`)
  return c.json({ id: res.meta.last_row_id, tokens, status: '待审批', note: tier.code === '入选' ? '审批通过后一次性到账' : '审批通过后按 M1—M4 里程碑分批释放' })
})

// ---------------- 运营审批 ----------------
r.get('/lightyear/admin', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const rows = (await c.env.DB.prepare(`SELECT g.*,u.name,a.title FROM compute_grants g JOIN users u ON u.id=g.user_id LEFT JOIN assets a ON a.id=g.asset_id ORDER BY (g.status='待审批') DESC, g.id DESC LIMIT 60`).all()).results
  const buckets = (await c.env.DB.prepare('SELECT * FROM compute_buckets ORDER BY sort').all()).results
  return c.json({ grants: rows, buckets })
})
r.post('/lightyear/grants/:id/decide', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const db = c.env.DB
  const gr = await db.prepare("SELECT * FROM compute_grants WHERE id=? AND status='待审批'").bind(c.req.param('id')).first<any>()
  if (!gr) return c.json({ error: '申请不存在或已处理' }, 409)
  if (b.action === 'approve') {
    if (!(await takeFromBucket(db, gr.bucket, gr.tokens))) return c.json({ error: '资金池余量不足，需调剂或动用机动池（双人审批）' }, 409)
    await db.prepare("UPDATE compute_grants SET status='已授予',approver=? WHERE id=?").bind(g.user.id, gr.id).run()
    await emit(db, 'compute.granted', { grant: gr.id })
  } else {
    await db.prepare("UPDATE compute_grants SET status='已拒绝',approver=?,note=note||?  WHERE id=?").bind(g.user.id, '｜拒绝：' + (b.reason || ''), gr.id).run()
  }
  await audit(db, g.user, 'lightyear.' + b.action, 'grant:' + gr.id, b.reason || '')
  return c.json({ ok: true })
})

// ---------------- 生成任务登记（消耗）----------------
r.post('/lightyear/usage', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (!MODELS[b.model] || !RES[b.resolution]) return c.json({ error: '模型或分辨率不正确' }, 422)
  const sec = Number(b.seconds)
  if (!(sec > 0) || sec > MODELS[b.model].maxClip) return c.json({ error: `单次生成时长需在 1—${MODELS[b.model].maxClip} 秒` }, 422)
  if (!b.request_id) return c.json({ error: '缺少请求ID（幂等键）' }, 422)
  const db = c.env.DB
  const dup = await db.prepare('SELECT id FROM compute_usage WHERE request_id=?').bind(b.request_id).first()
  if (dup) return c.json({ ok: true, duplicated: true })
  const t = usageTokens(b.model, b.resolution, sec, Number(b.input_seconds) || 0)
  const bal = await balance(db, g.user.id)
  if (t.std > bal.available) return c.json({ error: `余额不足：本次需 ${t.std.toLocaleString()} 标准Token，可用 ${bal.available.toLocaleString()}` }, 409)
  await db.prepare('INSERT INTO compute_usage (user_id,asset_id,request_id,model,resolution,seconds,input_seconds,raw_tokens,std_tokens,note) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(g.user.id, b.asset_id || null, b.request_id, b.model, b.resolution, sec, Number(b.input_seconds) || 0, t.raw, t.std, b.note || '').run()
  await emit(db, 'compute.used', { user: g.user.id, std: t.std })
  return c.json({ ok: true, ...t, balance: await balance(db, g.user.id) })
})

export default r
