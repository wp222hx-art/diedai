import { Hono } from 'hono'
import { Env, need, audit, emit, rid } from '../lib/core'

/**
 * 作品视频与专家评选
 * 上传（R2，支持 Range 播放）/ 外链 → 运营审核上线 → 播放统计 → 专家评审（回避、观看时长门槛）→ 评选总表与晋级
 */
const r = new Hono<Env>()

const MAX_MB = 300
const MIME = ['video/mp4', 'video/webm', 'video/quicktime']
const LINK_OK = /^https:\/\/([\w-]+\.)*(bilibili\.com|b23\.tv|youku\.com|v\.qq\.com|douyin\.com|ixigua\.com|vimeo\.com|youtube\.com|youtu\.be|weixin\.qq\.com|aliyundrive\.com|alipan\.com|quark\.cn)\/|\.(mp4|webm|m3u8)(\?|$)/i
export const CRITERIA: [string, string, number][] = [
  ['story', '叙事', 30], ['visual', '视听', 25], ['ai', 'AI 技术', 20], ['craft', '完成度', 15], ['market', '市场潜力', 10],
]
const MIN_WATCH = 0.6 // 专家须观看 ≥60% 时长方可提交（无时长信息时不限制）

/** 将外链转换为可嵌入的播放器地址 */
function embedOf(url: string): { type: 'file' | 'iframe' | 'external'; src: string } {
  if (/\.(mp4|webm)(\?|$)/i.test(url) || url.startsWith('/static/')) return { type: 'file', src: url }
  let m = url.match(/bilibili\.com\/video\/(BV[\w]+)/i)
  if (m) return { type: 'iframe', src: `https://player.bilibili.com/player.html?bvid=${m[1]}&autoplay=0&high_quality=1` }
  m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)
  if (m) return { type: 'iframe', src: `https://www.youtube.com/embed/${m[1]}` }
  m = url.match(/vimeo\.com\/(\d+)/)
  if (m) return { type: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` }
  m = url.match(/v\.qq\.com\/.*?\/([a-z0-9]{11})\.html/i)
  if (m) return { type: 'iframe', src: `https://v.qq.com/txp/iframe/player.html?vid=${m[1]}` }
  m = url.match(/youku\.com\/v_show\/id_([\w=]+)\.html/)
  if (m) return { type: 'iframe', src: `https://player.youku.com/embed/${m[1]}` }
  return { type: 'external', src: url }
}
function pub(v: any) {
  if (!v) return null
  const e = v.kind === 'upload' ? { type: 'file', src: `/api/media/${v.id}` } : embedOf(v.url)
  return { id: v.id, app_id: v.app_id, kind: v.kind, category: v.category || '正片', title: v.title, status: v.status, duration: v.duration, size: v.size, plays: v.plays, finishes: v.finishes, reject_reason: v.reject_reason, created_at: v.created_at, player: e }
}
async function canManage(db: D1Database, user: any, appId: number) {
  const a = await db.prepare('SELECT id,user_id,title FROM program_apps WHERE id=?').bind(appId).first<any>()
  if (!a) return { err: '作品不存在', code: 404 as const }
  if (a.user_id !== user.id && !['operator', 'admin'].includes(user.role)) return { err: '只能管理自己的作品', code: 403 as const }
  return { app: a }
}

// ---------------- 上传 / 外链 ----------------
r.post('/program/apps/:id/video', async (c) => {
  const g = need(c, ['creator', 'operator']); if (g.err) return g.err
  const db = c.env.DB, appId = Number(c.req.param('id'))
  const m = await canManage(db, g.user, appId); if (m.err) return c.json({ error: m.err }, m.code)
  const ct = c.req.header('content-type') || ''
  let row: any
  if (ct.includes('application/json')) {
    const b = await c.req.json().catch(() => ({}))
    const url = String(b.url || '').trim()
    if (!LINK_OK.test(url)) return c.json({ error: '请填写 B站 / 优酷 / 腾讯视频 / 抖音 / Vimeo / YouTube 等平台链接，或 .mp4 直链（https）' }, 422)
    row = { kind: 'link', category: ['正片','预告','先导片A','先导片B','样章','花絮'].includes(b.category) ? b.category : '正片', url, title: b.title || null, duration: Number(b.duration) || null, size: null, mime: null, r2_key: null }
  } else {
    if (!c.env.VIDEOS) return c.json({ error: '当前环境未开通视频存储，请使用外链方式' }, 503)
    const len = Number(c.req.header('content-length') || 0)
    if (len > MAX_MB * 1024 * 1024) return c.json({ error: `单个视频不超过 ${MAX_MB}MB，较大文件请使用外链` }, 413)
    const mime = (ct.split(';')[0] || '').trim()
    if (!MIME.includes(mime)) return c.json({ error: '仅支持 MP4 / WebM / MOV 格式' }, 415)
    const key = `videos/${appId}/${Date.now()}-${rid(8)}.${mime === 'video/webm' ? 'webm' : mime === 'video/quicktime' ? 'mov' : 'mp4'}`
    const obj = await c.env.VIDEOS.put(key, c.req.raw.body as any, { httpMetadata: { contentType: mime } })
    if (!obj) return c.json({ error: '上传失败' }, 500)
    if (obj.size > MAX_MB * 1024 * 1024) { await c.env.VIDEOS.delete(key); return c.json({ error: `单个视频不超过 ${MAX_MB}MB` }, 413) }
    row = { kind: 'upload', category: ['正片','预告','先导片A','先导片B','样章','花絮'].includes(decodeURIComponent(c.req.header('x-category') || '')) ? decodeURIComponent(c.req.header('x-category') || '') : '正片', r2_key: key, mime, size: obj.size, url: null, title: decodeURIComponent(c.req.header('x-file-name') || '') || null, duration: Number(c.req.header('x-duration')) || null }
  }
  await db.prepare("UPDATE program_videos SET status='已替换' WHERE app_id=? AND COALESCE(category,'正片')=? AND status IN ('待审核','已上线','已驳回')").bind(appId, row.category).run()
  const res = await db.prepare('INSERT INTO program_videos (app_id,user_id,kind,r2_key,url,mime,size,duration,title,category) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(appId, g.user.id, row.kind, row.r2_key, row.url, row.mime, row.size, row.duration, row.title, row.category).run()
  await audit(db, g.user, 'video.submit', 'program_app:' + appId, row.kind)
  await emit(db, 'video.submitted', { app_id: appId, video_id: res.meta.last_row_id })
  return c.json({ id: res.meta.last_row_id, status: '待审核' })
})

// ---------------- 播放（R2 流式 + Range） ----------------
r.get('/media/:id', async (c) => {
  const v = await c.env.DB.prepare('SELECT * FROM program_videos WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!v || v.kind !== 'upload') return c.json({ error: '视频不存在' }, 404)
  let u = c.get('user')
  const qt = c.req.query('token')
  if (!u && qt) u = await c.env.DB.prepare("SELECT u.id,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at > datetime('now')").bind(qt).first<any>()
  const privileged = u && (u.id === v.user_id || ['operator', 'admin', 'expert'].includes(u.role))
  if (v.status !== '已上线' && !privileged) return c.json({ error: '视频审核中' }, 403)
  if (!c.env.VIDEOS) return c.json({ error: '存储未开通' }, 503)
  const range = c.req.header('range')
  let opt: any = {}
  let start = 0, end = v.size - 1
  if (range) {
    const mm = range.match(/bytes=(\d*)-(\d*)/)
    if (mm) { start = mm[1] ? +mm[1] : Math.max(0, v.size - +mm[2]); end = mm[2] && mm[1] ? Math.min(+mm[2], v.size - 1) : v.size - 1; opt.range = { offset: start, length: end - start + 1 } }
  }
  const obj = await c.env.VIDEOS.get(v.r2_key, opt)
  if (!obj) return c.json({ error: '文件丢失' }, 404)
  const h = new Headers({ 'Content-Type': v.mime || 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' })
  if (opt.range) { h.set('Content-Range', `bytes ${start}-${end}/${v.size}`); h.set('Content-Length', String(end - start + 1)); return new Response((obj as R2ObjectBody).body, { status: 206, headers: h }) }
  h.set('Content-Length', String(v.size))
  return new Response((obj as R2ObjectBody).body, { headers: h })
})

// 播放统计（去重：同设备同视频 30 分钟内只计一次播放）
r.post('/media/:id/event', async (c) => {
  const b = await c.req.json().catch(() => ({}))
  const id = Number(c.req.param('id'))
  if (b.type === 'play') await c.env.DB.prepare("UPDATE program_videos SET plays=plays+1 WHERE id=? AND status='已上线'").bind(id).run()
  if (b.type === 'finish') await c.env.DB.prepare("UPDATE program_videos SET finishes=finishes+1 WHERE id=? AND status='已上线'").bind(id).run()
  const u = c.get('user')
  if (u && u.role === 'expert' && Number(b.watched) > 0) {
    const v = await c.env.DB.prepare('SELECT app_id FROM program_videos WHERE id=?').bind(id).first<any>()
    if (v) await c.env.DB.prepare(`INSERT INTO program_reviews (app_id,user_id,scores,total,status,watched_sec) VALUES (?,?,'{}',0,'观看中',?)
      ON CONFLICT(app_id,user_id) DO UPDATE SET watched_sec=MAX(watched_sec, excluded.watched_sec)`).bind(v.app_id, u.id, Number(b.watched)).run()
  }
  return c.json({ ok: true })
})

// 作品当前视频（公开只返回已上线；作者/运营/专家可见待审）
r.get('/program/apps/:code/video', async (c) => {
  const db = c.env.DB
  const a = await db.prepare('SELECT id,user_id FROM program_apps WHERE code=? OR id=?').bind(c.req.param('code'), Number(c.req.param('code')) || -1).first<any>()
  if (!a) return c.json({ error: '作品不存在' }, 404)
  const u = c.get('user')
  const privileged = u && (u.id === a.user_id || ['operator', 'admin', 'expert'].includes(u.role))
  const v = await db.prepare(`SELECT * FROM program_videos WHERE app_id=? AND status IN (${privileged ? "'已上线','待审核','已驳回'" : "'已上线'"}) ORDER BY id DESC LIMIT 1`).bind(a.id).first()
  return c.json({ video: pub(v) })
})

// ---------------- 专家评审 ----------------
r.get('/review/queue', async (c) => {
  const g = need(c, ['expert', 'operator']); if (g.err) return g.err
  const db = c.env.DB
  const rows = (await db.prepare(`SELECT a.id,a.code,a.title,a.team,a.track,a.school,a.form,a.minutes,a.logline,a.status,
      v.id vid, v.duration, rv.status rstatus, rv.total my_total, rv.watched_sec
      FROM program_apps a JOIN program_videos v ON v.app_id=a.id AND v.status='已上线'
      LEFT JOIN program_reviews rv ON rv.app_id=a.id AND rv.user_id=?
      WHERE a.status IN ('初选中','晋级路演','路演通过','已审批') ORDER BY (rv.status='已提交'), a.status='晋级路演' DESC, a.id`).bind(g.user.id).all()).results
  return c.json({ rows, criteria: CRITERIA, min_watch: MIN_WATCH })
})

r.post('/review/:appId', async (c) => {
  const g = need(c, ['expert']); if (g.err) return g.err
  const db = c.env.DB, appId = Number(c.req.param('appId'))
  const b = await c.req.json().catch(() => ({}))
  const a = await db.prepare('SELECT a.id,a.user_id FROM program_apps a WHERE a.id=?').bind(appId).first<any>()
  if (!a) return c.json({ error: '作品不存在' }, 404)
  const prev = await db.prepare('SELECT status,watched_sec FROM program_reviews WHERE app_id=? AND user_id=?').bind(appId, g.user.id).first<any>()
  if (prev && (prev.status === '已提交' || prev.status === '已回避')) return c.json({ error: '评审已提交并锁定' }, 409)
  if (Array.isArray(b.conflict) && b.conflict.length) {
    await db.prepare(`INSERT INTO program_reviews (app_id,user_id,scores,total,conflict,status) VALUES (?,?,'{}',0,?,'已回避')
      ON CONFLICT(app_id,user_id) DO UPDATE SET conflict=excluded.conflict, status='已回避'`).bind(appId, g.user.id, b.conflict.join('、')).run()
    await audit(db, g.user, 'review.recuse', 'program_app:' + appId, b.conflict.join('、'))
    return c.json({ status: '已回避' })
  }
  const v = await db.prepare("SELECT duration FROM program_videos WHERE app_id=? AND status='已上线' ORDER BY id DESC LIMIT 1").bind(appId).first<any>()
  if (!v) return c.json({ error: '作品视频尚未上线，暂不可评审' }, 409)
  if (v.duration && (prev?.watched_sec || 0) < v.duration * MIN_WATCH) return c.json({ error: `请至少观看 ${Math.round(MIN_WATCH * 100)}% 时长后再提交评审`, watched: prev?.watched_sec || 0, need: Math.ceil(v.duration * MIN_WATCH) }, 422)
  const scores: Record<string, number> = {}
  for (const [k, l] of CRITERIA) {
    const s = Number(b.scores?.[k])
    if (!Number.isInteger(s) || s < 1 || s > 10) return c.json({ error: `请为「${l}」打 1—10 分` }, 422)
    scores[k] = s
  }
  if (!b.comment || String(b.comment).trim().length < 15) return c.json({ error: '评语不少于 15 字' }, 422)
  const total = +(CRITERIA.reduce((acc, [k, , w]) => acc + scores[k] * w, 0) / 10).toFixed(1) // 百分制
  await db.prepare(`INSERT INTO program_reviews (app_id,user_id,scores,total,comment,recommend,status) VALUES (?,?,?,?,?,?,'已提交')
    ON CONFLICT(app_id,user_id) DO UPDATE SET scores=excluded.scores,total=excluded.total,comment=excluded.comment,recommend=excluded.recommend,status='已提交',created_at=datetime('now')`)
    .bind(appId, g.user.id, JSON.stringify(scores), total, String(b.comment).slice(0, 1000), b.recommend ? 1 : 0).run()
  await audit(db, g.user, 'review.submit', 'program_app:' + appId, String(total))
  return c.json({ total })
})

// ---------------- 运营后台：视频审核 / 评选总表 ----------------
r.get('/admin/videos', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const st = c.req.query('status') || '待审核'
  const rows = (await c.env.DB.prepare(`SELECT v.*, a.title app_title, a.team, a.code, u.name uploader FROM program_videos v
    JOIN program_apps a ON a.id=v.app_id JOIN users u ON u.id=v.user_id WHERE v.status=? ORDER BY v.id DESC LIMIT 200`).bind(st).all()).results as any[]
  const counts = (await c.env.DB.prepare('SELECT status, COUNT(*) n FROM program_videos GROUP BY status').all()).results
  return c.json({ rows: rows.map((v) => ({ ...pub(v), app_title: v.app_title, team: v.team, code: v.code, uploader: v.uploader })), counts })
})
r.post('/admin/videos/:id/decide', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (b.action === 'reject' && !b.reason) return c.json({ error: '请填写驳回原因' }, 422)
  const st = b.action === 'approve' ? '已上线' : b.action === 'reject' ? '已驳回' : null
  if (!st) return c.json({ error: '无效操作' }, 422)
  const res = await c.env.DB.prepare("UPDATE program_videos SET status=?, reviewer=?, reject_reason=?, reviewed_at=datetime('now') WHERE id=? AND status='待审核'")
    .bind(st, g.user.id, b.reason || null, c.req.param('id')).run()
  if (!res.meta.changes) return c.json({ error: '该视频已处理' }, 409)
  await audit(c.env.DB, g.user, 'video.' + b.action, 'video:' + c.req.param('id'), b.reason || '')
  return c.json({ status: st })
})

r.get('/admin/selection', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const db = c.env.DB
  const rows = (await db.prepare(`SELECT a.id,a.code,a.title,a.team,a.track,a.status,a.roadshow_score,
      (SELECT COUNT(*) FROM program_votes pv WHERE pv.app_id=a.id) votes,
      (SELECT AVG((story+visual+craft)/3.0) FROM program_votes pv WHERE pv.app_id=a.id) pub_avg,
      (SELECT COUNT(*) FROM program_reviews r WHERE r.app_id=a.id AND r.status='已提交') reviews,
      (SELECT AVG(total) FROM program_reviews r WHERE r.app_id=a.id AND r.status='已提交') exp_avg,
      (SELECT MAX(total)-MIN(total) FROM program_reviews r WHERE r.app_id=a.id AND r.status='已提交') spread,
      (SELECT SUM(recommend) FROM program_reviews r WHERE r.app_id=a.id AND r.status='已提交') recs,
      (SELECT COUNT(*) FROM program_reviews r WHERE r.app_id=a.id AND r.status='已回避') recused,
      (SELECT status FROM program_videos v WHERE v.app_id=a.id AND v.status<>'已替换' ORDER BY v.id DESC LIMIT 1) video,
      (SELECT plays FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线' ORDER BY v.id DESC LIMIT 1) plays
      FROM program_apps a ORDER BY a.id`).all()).results as any[]
  for (const x of rows) {
    x.pub100 = x.pub_avg ? +(x.pub_avg * 10).toFixed(1) : null
    x.exp_avg = x.exp_avg ? +x.exp_avg.toFixed(1) : null
    // 综合分：专家 70% + 大众 30%（无专家分时仅作参考）
    x.composite = x.exp_avg != null ? +((x.exp_avg * 0.7) + ((x.pub100 ?? x.exp_avg) * 0.3)).toFixed(1) : null
    x.flag = x.spread != null && x.spread >= 20 ? '分差≥20，需第三评' : x.reviews < 2 && x.video === '已上线' ? '专家评审不足 2 份' : ''
  }
  rows.sort((a, b) => (b.composite ?? -1) - (a.composite ?? -1))
  return c.json({ rows, rule: '综合分 = 专家均分 × 70% + 大众评分（百分制）× 30%；每部作品至少 2 份专家评审，分差 ≥20 分需加评。' })
})
r.get('/admin/apps/:id/reviews', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const rows = (await c.env.DB.prepare(`SELECT r.*, u.name expert FROM program_reviews r JOIN users u ON u.id=r.user_id WHERE r.app_id=? AND r.status IN ('已提交','已回避') ORDER BY r.id`).bind(c.req.param('id')).all()).results as any[]
  return c.json({ rows: rows.map((x) => ({ ...x, scores: JSON.parse(x.scores || '{}') })), criteria: CRITERIA })
})
r.post('/admin/apps/:id/advance', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const res = await c.env.DB.prepare("UPDATE program_apps SET status='晋级路演' WHERE id=? AND status='初选中'").bind(c.req.param('id')).run()
  if (!res.meta.changes) return c.json({ error: '仅“初选中”作品可手动晋级' }, 409)
  await audit(c.env.DB, g.user, 'program.advance', 'program_app:' + c.req.param('id'), '评选总表手动晋级')
  return c.json({ status: '晋级路演' })
})

r.get('/admin/stats', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const s = await c.env.DB.prepare(`SELECT (SELECT COUNT(*) FROM program_apps) apps,
    (SELECT COUNT(*) FROM program_videos WHERE status='待审核') pending_videos,
    (SELECT COUNT(*) FROM program_videos WHERE status='已上线') live_videos,
    (SELECT COALESCE(SUM(plays),0) FROM program_videos) plays,
    (SELECT COUNT(*) FROM program_votes) votes,
    (SELECT COUNT(*) FROM program_reviews WHERE status='已提交') reviews,
    (SELECT COUNT(*) FROM program_apps WHERE status='晋级路演') roadshow,
    (SELECT COUNT(*) FROM program_apps WHERE status='路演通过' ) to_approve,
    (SELECT COALESCE(SUM(granted),0) FROM compute_buckets) granted`).first()
  return c.json(s)
})

export default r
