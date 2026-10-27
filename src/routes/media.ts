import { Hono } from 'hono'
import { Env, need, audit, emit, rid } from '../lib/core'
import { ROUND1, ROUND2, SHEET_FIELDS, FILE_RULES, MAT_MIME, itemOf } from '../lib/materials'
import { POOL_YUAN, PROMO_YUAN, TOTAL_YUAN } from '../lib/lightyear'

/**
 * v4 · 分片断点续传（R2 multipart）· 申报材料（首轮/二轮，版本化）· 展映厅 · 推广与宣发扶持
 */
const r = new Hono<Env>()

const PART = 8 * 1024 * 1024 // 每片 8MB（R2 要求除最后一片外 ≥5MB）
const MAX_VIDEO = 4 * 1024 ** 3 // 单个视频最大 4GB（长片 / 剧集）
const MAX_MAT = 200 * 1024 * 1024
export const VIDEO_CATS = ['正片', '预告', '先导片A', '先导片B', '样章', '花絮']
const VIDEO_MIME = MAT_MIME.video
const ROUND2_OPEN = ['晋级路演', '路演通过', '已审批']
export const UNITS = [
  { code: 'feature', name: '长片展映', desc: 'AI 电影 · 院线与流媒体长片' },
  { code: 'series', name: '剧集单元', desc: 'AI 剧集 · 短剧 · 漫剧' },
  { code: 'short', name: '短片竞赛', desc: '30 分钟以内的 AI 短片' },
  { code: 'campus', name: '院校新锐', desc: '影视院校毕业生作品 · 迭代盛典推荐' },
  { code: 'lab', name: '先导实验室', desc: '开发中项目的先导片与样章' },
]

async function appOf(db: D1Database, user: any, appId: number, allowExpert = false) {
  const a = await db.prepare('SELECT id,code,user_id,title,status,track,form FROM program_apps WHERE id=?').bind(appId).first<any>()
  if (!a) return { err: '作品不存在', code: 404 as const }
  const ok = a.user_id === user.id || ['operator', 'admin', 'finance'].includes(user.role) || (allowExpert && user.role === 'expert')
  if (!ok) return { err: '只能管理自己的作品', code: 403 as const }
  return { app: a }
}
const extOf = (name: string, mime: string) => (name.match(/\.([a-z0-9]{2,5})$/i)?.[1] || mime.split('/')[1] || 'bin').toLowerCase()

// =====================================================================
// 分片上传：init → PUT part（可并发 / 可重试）→ complete；同文件再次 init 自动续传
// =====================================================================
r.post('/uploads/init', async (c) => {
  const g = need(c, ['creator', 'operator']); if (g.err) return g.err
  if (!c.env.VIDEOS) return c.json({ error: '当前环境未开通存储，请使用链接方式提交' }, 503)
  const db = c.env.DB
  const b = await c.req.json().catch(() => ({}))
  const appId = Number(b.app_id), size = Number(b.size), mime = String(b.mime || '').split(';')[0]
  const purpose = b.purpose === 'material' ? 'material' : 'video'
  const m = await appOf(db, g.user, appId); if (m.err) return c.json({ error: m.err }, m.code)
  const fileName = String(b.file_name || 'file').slice(0, 160)
  if (!(size > 0)) return c.json({ error: '文件大小无效' }, 422)
  let category: string | null = null, item: string | null = null
  if (purpose === 'video') {
    if (!VIDEO_MIME.includes(mime)) return c.json({ error: '仅支持 MP4 / MOV / WebM 视频' }, 415)
    if (size > MAX_VIDEO) return c.json({ error: '单个视频不超过 4GB，更大文件请使用网盘 / 平台链接' }, 413)
    category = VIDEO_CATS.includes(b.category) ? b.category : '正片'
  } else {
    const it = itemOf(String(b.item_code || ''))
    if (!it) return c.json({ error: '未知的材料项' }, 422)
    if (it.code.startsWith('r2_') && !ROUND2_OPEN.includes(m.app!.status)) return c.json({ error: '进入第二轮后方可提交二轮材料' }, 409)
    const allowed = it.accept.flatMap((k) => MAT_MIME[k] || [])
    if (!allowed.includes(mime)) return c.json({ error: `「${it.name}」支持的格式：${it.accept.map((k) => ({ pdf: 'PDF', doc: 'Word/TXT', sheet: 'Excel/CSV', image: 'JPG/PNG', video: 'MP4/MOV', form: '在线表单' } as any)[k]).join(' / ')}` }, 415)
    const lim = it.video ? MAX_VIDEO : MAX_MAT
    if (size > lim) return c.json({ error: `文件不超过 ${Math.round(lim / 1048576)}MB` }, 413)
    item = it.code
  }
  // 续传：同一用户、同一作品、同名同大小、未完成
  const prev = await db.prepare("SELECT * FROM uploads WHERE user_id=? AND app_id=? AND file_name=? AND size=? AND purpose=? AND status='上传中' ORDER BY id DESC LIMIT 1")
    .bind(g.user.id, appId, fileName, size, purpose).first<any>()
  if (prev) {
    const parts = (await db.prepare('SELECT n FROM upload_parts WHERE upload_id=? ORDER BY n').bind(prev.id).all()).results.map((x: any) => x.n)
    if (category && prev.category !== category) await db.prepare('UPDATE uploads SET category=? WHERE id=?').bind(category, prev.id).run()
    return c.json({ token: prev.token, part_size: prev.part_size, total: Math.ceil(size / prev.part_size), done: parts, resumed: true })
  }
  const key = `${purpose === 'video' ? 'videos' : 'materials'}/${appId}/${Date.now()}-${rid(8)}.${extOf(fileName, mime)}`
  const mu = await c.env.VIDEOS.createMultipartUpload(key, { httpMetadata: { contentType: mime } })
  const token = rid(20)
  await db.prepare('INSERT INTO uploads (token,r2_upload_id,r2_key,app_id,user_id,purpose,category,item_code,file_name,size,mime,duration,part_size) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(token, mu.uploadId, key, appId, g.user.id, purpose, category, item, fileName, size, mime, Number(b.duration) || null, PART).run()
  return c.json({ token, part_size: PART, total: Math.ceil(size / PART), done: [], resumed: false })
}
)

async function upOf(c: any) {
  const g = need(c); if (g.err) return { err: g.err }
  const u = await c.env.DB.prepare('SELECT * FROM uploads WHERE token=?').bind(c.req.param('token')).first()
  if (!u || u.user_id !== g.user!.id) return { err: c.json({ error: '上传会话不存在' }, 404) }
  if (u.status !== '上传中') return { err: c.json({ error: '上传已' + (u.status === '已完成' ? '完成' : '取消') }, 409) }
  return { u, user: g.user! }
}

r.put('/uploads/:token/part/:n', async (c) => {
  const x = await upOf(c); if (x.err) return x.err
  const u = x.u, n = Number(c.req.param('n')), total = Math.ceil(u.size / u.part_size)
  if (!(n >= 1 && n <= total)) return c.json({ error: '分片序号无效' }, 422)
  const buf = await c.req.arrayBuffer()
  const expect = n < total ? u.part_size : u.size - u.part_size * (total - 1)
  if (buf.byteLength !== expect) return c.json({ error: `分片大小不符（期望 ${expect}，实际 ${buf.byteLength}）` }, 422)
  const mu = c.env.VIDEOS!.resumeMultipartUpload(u.r2_key, u.r2_upload_id)
  const part = await mu.uploadPart(n, buf)
  await c.env.DB.prepare('INSERT INTO upload_parts (upload_id,n,etag,size) VALUES (?,?,?,?) ON CONFLICT(upload_id,n) DO UPDATE SET etag=excluded.etag').bind(u.id, n, part.etag, buf.byteLength).run()
  return c.json({ n, etag: part.etag })
})

r.get('/uploads/:token', async (c) => {
  const g = need(c); if (g.err) return g.err
  const u = await c.env.DB.prepare('SELECT * FROM uploads WHERE token=? AND user_id=?').bind(c.req.param('token'), g.user.id).first<any>()
  if (!u) return c.json({ error: '上传会话不存在' }, 404)
  const parts = (await c.env.DB.prepare('SELECT n FROM upload_parts WHERE upload_id=? ORDER BY n').bind(u.id).all()).results.map((x: any) => x.n)
  return c.json({ status: u.status, file_name: u.file_name, size: u.size, part_size: u.part_size, total: Math.ceil(u.size / u.part_size), done: parts })
})

r.post('/uploads/:token/complete', async (c) => {
  const x = await upOf(c); if (x.err) return x.err
  const u = x.u, db = c.env.DB, total = Math.ceil(u.size / u.part_size)
  const parts = (await db.prepare('SELECT n,etag FROM upload_parts WHERE upload_id=? ORDER BY n').bind(u.id).all()).results as any[]
  if (parts.length !== total) return c.json({ error: `还有 ${total - parts.length} 个分片未上传`, missing: total - parts.length }, 409)
  const mu = c.env.VIDEOS!.resumeMultipartUpload(u.r2_key, u.r2_upload_id)
  const obj = await mu.complete(parts.map((p) => ({ partNumber: p.n, etag: p.etag })))
  await db.prepare("UPDATE uploads SET status='已完成' WHERE id=?").bind(u.id).run()
  await db.prepare('DELETE FROM upload_parts WHERE upload_id=?').bind(u.id).run()
  if (u.purpose === 'video') {
    await db.prepare("UPDATE program_videos SET status='已替换' WHERE app_id=? AND COALESCE(category,'正片')=? AND status IN ('待审核','已上线','已驳回')").bind(u.app_id, u.category).run()
    const res = await db.prepare("INSERT INTO program_videos (app_id,user_id,kind,r2_key,mime,size,duration,title,category) VALUES (?,?,'upload',?,?,?,?,?,?)")
      .bind(u.app_id, x.user.id, u.r2_key, u.mime, obj.size, u.duration, u.file_name, u.category).run()
    await audit(db, x.user, 'video.submit', 'program_app:' + u.app_id, `multipart ${u.category} ${obj.size}`)
    await emit(db, 'video.submitted', { app_id: u.app_id, video_id: res.meta.last_row_id })
    return c.json({ kind: 'video', id: res.meta.last_row_id, status: '待审核', size: obj.size })
  }
  const id = await addMaterial(db, x.user, u.app_id, u.item_code, { kind: 'file', r2_key: u.r2_key, file_name: u.file_name, mime: u.mime, size: obj.size, note: null })
  // 先导片同时进入作品视频（便于展映与专家观看）
  const it = itemOf(u.item_code)
  if (it?.video) await db.prepare("INSERT INTO program_videos (app_id,user_id,kind,r2_key,mime,size,duration,title,category) VALUES (?,?,'upload',?,?,?,?,?,?)")
    .bind(u.app_id, x.user.id, u.r2_key, u.mime, obj.size, u.duration, u.file_name, it.code === 'r1_teaser' ? '先导片A' : '样章').run()
  return c.json({ kind: 'material', id, status: '待审阅', size: obj.size })
})

r.delete('/uploads/:token', async (c) => {
  const x = await upOf(c); if (x.err) return x.err
  try { await c.env.VIDEOS!.resumeMultipartUpload(x.u.r2_key, x.u.r2_upload_id).abort() } catch {}
  await c.env.DB.prepare("UPDATE uploads SET status='已取消' WHERE id=?").bind(x.u.id).run()
  await c.env.DB.prepare('DELETE FROM upload_parts WHERE upload_id=?').bind(x.u.id).run()
  return c.json({ ok: true })
})

// 我未完成的上传（换设备 / 刷新后提示续传）
r.get('/uploads', async (c) => {
  const g = need(c); if (g.err) return g.err
  const rows = (await c.env.DB.prepare(`SELECT u.token,u.app_id,u.purpose,u.category,u.item_code,u.file_name,u.size,u.part_size,u.created_at,a.title,
    (SELECT COUNT(*) FROM upload_parts p WHERE p.upload_id=u.id) done FROM uploads u JOIN program_apps a ON a.id=u.app_id
    WHERE u.user_id=? AND u.status='上传中' AND u.created_at > datetime('now','-7 day') ORDER BY u.id DESC LIMIT 10`).bind(g.user.id).all()).results
  return c.json({ rows })
})

// =====================================================================
// 申报材料
// =====================================================================
async function addMaterial(db: D1Database, user: any, appId: number, item: string, f: { kind: string; url?: string | null; r2_key?: string | null; file_name?: string | null; mime?: string | null; size?: number | null; note?: string | null }) {
  const it = itemOf(item)!
  const round = it.code.startsWith('r2_') ? 2 : 1
  const v = await db.prepare('SELECT COALESCE(MAX(version),0) v FROM app_materials WHERE app_id=? AND item=?').bind(appId, item).first<any>()
  await db.prepare("UPDATE app_materials SET status='已替换' WHERE app_id=? AND item=? AND status<>'已替换'").bind(appId, item).run()
  const res = await db.prepare('INSERT INTO app_materials (app_id,user_id,round,item,kind,url,r2_key,file_name,mime,size,version,note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(appId, user.id, round, item, f.kind, f.url || null, f.r2_key || null, f.file_name || null, f.mime || null, f.size || null, (v?.v || 0) + 1, f.note || null).run()
  await audit(db, user, 'material.submit', 'program_app:' + appId, `${item} v${(v?.v || 0) + 1}`)
  return res.meta.last_row_id
}

r.get('/guide', (c) => c.json({
  round1: ROUND1, round2: ROUND2, sheet_fields: SHEET_FIELDS, rules: FILE_RULES,
  flow: [
    { k: '第一轮 · 远程预审', t: '通过官网入口在线提交材料，无需到场。平台完成预审后，通知是否进入第二轮及需要补充的内容。' },
    { k: '第二轮 · 联合评审', t: '平台方与捷成共同组成六人评审组评议。初期按批次邀请主理人到北京捷成世纪 OPC 园区路演与答辩；常规项目以在线提交、在线评议为主。' },
    { k: '资源确认', t: '通过第二轮后，仍需确认资源额度、使用条件、协议及开工条件。算力支持、宣发扶持、现金投资、获奖及发行合作分别确认。' },
  ],
  teaser: 'A片呈现故事、人物、冲突与情绪；B片展示连续制作能力，可选择对话、动作、同一角色跨镜头或复杂场景。两片均为同一项目，各30—60秒，可使用已有素材重剪。制作说明请标明AI生成、实拍、素材复用及外包的范围；首轮无需提交完整Prompt正文、模型权重或全部工程。请勿提交账号密码或密钥。',
  budget_q: ['需要生成多少有效成片？', '为了得到这些成片预计要生成多少候选？', '按什么单位计费？', '目前试做花了多少？', '除了算力，还有哪些没有解决的完片成本？'],
  budget_note: '请保留原始计量单位：供应商Token、积分、生成秒数或GPU小时分别列明。不同模型单位不直接相加，算力面值与现金成本分开填写；样片单位成本不能未经调整直接乘全片时长。',
  pitch_q: ['为什么选择这个故事？', '最难完成的段落是什么？', '自己实际负责什么？', '如果可用算力比申请少，如何保住作品价值？', '预算超支、关键人员退出或模型不可用时，如何继续？'],
  summary_fields: '项目编号与版本；全片总时长；AI制作覆盖范围；全项目预计用量；本次申请用途、模型、单位、额度和期限；阶段交付物与日期；已落实现金；未解决现金缺口；所需人员及其他资源；责任人。',
  source: '迭影计划《创作者申报材料指南》创作者版 V1.0 · 2026年10月26日；实际以当期征集通知及评审邀请为准。',
}))

r.get('/program/apps/:id/materials', async (c) => {
  const g = need(c); if (g.err) return g.err
  const db = c.env.DB
  const m = await appOf(db, g.user, Number(c.req.param('id')), true); if (m.err) return c.json({ error: m.err }, m.code)
  const rows = (await db.prepare("SELECT id,round,item,kind,url,file_name,mime,size,version,note,status,feedback,created_at FROM app_materials WHERE app_id=? AND status<>'已替换' ORDER BY item").bind(m.app!.id).all()).results as any[]
  const sheet = await db.prepare('SELECT sheet FROM program_apps WHERE id=?').bind(m.app!.id).first<any>()
  const by = new Map(rows.map((x) => [x.item, x]))
  const pack = (list: typeof ROUND1) => list.map((it) => ({ ...it, file: by.get(it.code) || null }))
  const r1 = pack(ROUND1), r2 = pack(ROUND2)
  const pct = (l: any[]) => Math.round((l.filter((x) => x.file).length / l.filter((x) => x.required).length) * 100)
  return c.json({ app: m.app, round2_open: ROUND2_OPEN.includes(m.app!.status), round1: r1, round2: r2, sheet: JSON.parse(sheet?.sheet || '{}'), sheet_fields: SHEET_FIELDS,
    progress: { r1: Math.min(100, pct(r1)), r2: Math.min(100, pct(r2)), redo: rows.filter((x) => x.status === '需补件').length } })
})

r.post('/program/apps/:id/materials', async (c) => {
  const g = need(c, ['creator', 'operator']); if (g.err) return g.err
  const db = c.env.DB, appId = Number(c.req.param('id'))
  const m = await appOf(db, g.user, appId); if (m.err) return c.json({ error: m.err }, m.code)
  const b = await c.req.json().catch(() => ({}))
  const it = itemOf(String(b.item || ''))
  if (!it) return c.json({ error: '未知的材料项' }, 422)
  if (it.code.startsWith('r2_') && !ROUND2_OPEN.includes(m.app!.status)) return c.json({ error: '进入第二轮后方可提交二轮材料' }, 409)
  const url = String(b.url || '').trim()
  if (!/^https:\/\/\S{6,}$/.test(url)) return c.json({ error: '请填写 https 开头的网盘或文档链接' }, 422)
  if (!b.note || String(b.note).trim().length < 4) return c.json({ error: '请注明提取码 / 访问方式与到期时间' }, 422)
  const id = await addMaterial(db, g.user, appId, it.code, { kind: 'link', url, note: String(b.note).slice(0, 300) })
  return c.json({ id, status: '待审阅' })
})

r.put('/program/apps/:id/sheet', async (c) => {
  const g = need(c, ['creator', 'operator']); if (g.err) return g.err
  const db = c.env.DB, appId = Number(c.req.param('id'))
  const m = await appOf(db, g.user, appId); if (m.err) return c.json({ error: m.err }, m.code)
  const b = await c.req.json().catch(() => ({}))
  const sheet: Record<string, string> = {}
  const miss: string[] = []
  for (const [k, l] of SHEET_FIELDS) { const v = String(b[k] || '').trim().slice(0, 200); sheet[k] = v; if (!v && !['promo'].includes(k)) miss.push(l) }
  await db.prepare('UPDATE program_apps SET sheet=? WHERE id=?').bind(JSON.stringify(sheet), appId).run()
  if (miss.length) return c.json({ saved: true, complete: false, missing: miss })
  const cur = await db.prepare("SELECT id FROM app_materials WHERE app_id=? AND item='r1_sheet' AND status<>'已替换' AND kind='form'").bind(appId).first()
  if (!cur) await addMaterial(db, g.user, appId, 'r1_sheet', { kind: 'form', note: '在线速览表' })
  return c.json({ saved: true, complete: true })
})

r.get('/media/m/:id', async (c) => {
  const db = c.env.DB
  let u = c.get('user')
  const qt = c.req.query('token')
  if (!u && qt) u = await db.prepare("SELECT u.id,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at > datetime('now')").bind(qt).first<any>()
  if (!u) return c.json({ error: '请先登录' }, 401)
  const mt = await db.prepare('SELECT m.*, a.user_id owner FROM app_materials m JOIN program_apps a ON a.id=m.app_id WHERE m.id=?').bind(c.req.param('id')).first<any>()
  if (!mt || !mt.r2_key) return c.json({ error: '文件不存在' }, 404)
  if (mt.owner !== u.id && !['operator', 'admin', 'expert', 'finance'].includes(u.role)) return c.json({ error: '无权查看' }, 403)
  const obj = await c.env.VIDEOS?.get(mt.r2_key)
  if (!obj) return c.json({ error: '文件丢失' }, 404)
  return new Response(obj.body, { headers: { 'Content-Type': mt.mime || 'application/octet-stream', 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(mt.file_name || 'file')}`, 'Cache-Control': 'private, max-age=600' } })
})

r.get('/admin/materials', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const st = c.req.query('status') || '待审阅'
  const rows = (await c.env.DB.prepare(`SELECT m.id,m.app_id,m.round,m.item,m.kind,m.url,m.file_name,m.size,m.version,m.note,m.status,m.feedback,m.created_at,a.title,a.team,a.code
    FROM app_materials m JOIN program_apps a ON a.id=m.app_id WHERE m.status=? ORDER BY m.id DESC LIMIT 200`).bind(st).all()).results as any[]
  const counts = (await c.env.DB.prepare("SELECT status, COUNT(*) n FROM app_materials WHERE status<>'已替换' GROUP BY status").all()).results
  const apps = (await c.env.DB.prepare(`SELECT a.id,a.title,a.team,a.status,
    (SELECT COUNT(DISTINCT item) FROM app_materials m WHERE m.app_id=a.id AND m.round=1 AND m.status<>'已替换') r1,
    (SELECT COUNT(DISTINCT item) FROM app_materials m WHERE m.app_id=a.id AND m.round=2 AND m.status<>'已替换') r2
    FROM program_apps a ORDER BY r1 DESC, a.id LIMIT 100`).all()).results
  return c.json({ rows: rows.map((x) => ({ ...x, name: itemOf(x.item)?.name, no: itemOf(x.item)?.no })), counts, apps, totals: { r1: ROUND1.length, r2: ROUND2.length } })
})
r.post('/admin/materials/:id/decide', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const st = b.action === 'confirm' ? '已确认' : b.action === 'redo' ? '需补件' : null
  if (!st) return c.json({ error: '无效操作' }, 422)
  if (st === '需补件' && (!b.feedback || String(b.feedback).trim().length < 4)) return c.json({ error: '请写明需要补充的内容' }, 422)
  const res = await c.env.DB.prepare("UPDATE app_materials SET status=?, feedback=?, reviewer=?, reviewed_at=datetime('now') WHERE id=? AND status IN ('待审阅','已确认','需补件')")
    .bind(st, b.feedback || null, g.user.id, c.req.param('id')).run()
  if (!res.meta.changes) return c.json({ error: '材料已被替换或不存在' }, 409)
  await audit(c.env.DB, g.user, 'material.' + b.action, 'material:' + c.req.param('id'), b.feedback || '')
  return c.json({ status: st })
})

// =====================================================================
// 展映厅 · 推广拉动 · 宣发扶持
// =====================================================================
const HOT_SQL = `(COALESCE((SELECT SUM(plays) FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线'),0)
  + (SELECT COUNT(*) FROM program_votes pv WHERE pv.app_id=a.id) * 6
  + (SELECT COUNT(*) FROM promo_events e WHERE e.app_id=a.id AND e.type='share') * 4
  + (SELECT COUNT(*) FROM promo_events e WHERE e.app_id=a.id AND e.type='view') * 1)`
const unitOf = (a: any) => a.screen_unit || (a.track === '院校毕业生' ? 'campus' : a.form === 'AI电影' ? 'feature' : a.form === 'AI剧集' || a.form === 'AI动画' ? 'series' : 'short')

r.get('/screening', async (c) => {
  const db = c.env.DB
  const unit = c.req.query('unit') || ''
  const sort = c.req.query('sort') === 'new' ? 'new' : 'hot'
  const rows = (await db.prepare(`SELECT a.id,a.code,a.title,a.team,a.track,a.school,a.grad_year,a.form,a.minutes,a.logline,a.status,a.screen_unit,a.featured,
      ${HOT_SQL} hot,
      (SELECT COUNT(*) FROM program_votes pv WHERE pv.app_id=a.id) votes,
      (SELECT AVG((story+visual+craft)/3.0) FROM program_votes pv WHERE pv.app_id=a.id) avg,
      (SELECT COUNT(*) FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线') clips,
      (SELECT COALESCE(SUM(plays),0) FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线') plays,
      (SELECT MAX(v.id) FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线') last_vid,
      (SELECT COALESCE(SUM(yuan),0) FROM promo_grants pg WHERE pg.app_id=a.id) promo
      FROM program_apps a WHERE EXISTS (SELECT 1 FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线') AND a.status<>'未通过'`).all()).results as any[]
  for (const x of rows) { x.unit = unitOf(x); x.avg = x.avg ? +x.avg.toFixed(1) : null }
  let list = unit ? rows.filter((x) => x.unit === unit) : rows
  list.sort((a, b) => (sort === 'new' ? b.last_vid - a.last_vid : b.hot - a.hot))
  const featured = rows.filter((x) => x.featured).sort((a, b) => b.hot - a.hot).slice(0, 5)
  const units = UNITS.map((u) => ({ ...u, n: rows.filter((x) => x.unit === u.code).length }))
  const tot = await db.prepare(`SELECT (SELECT COALESCE(SUM(plays),0) FROM program_videos WHERE status='已上线') plays,
    (SELECT COUNT(*) FROM program_videos WHERE status='已上线') clips, (SELECT COUNT(*) FROM promo_events WHERE type='share') shares`).first()
  return c.json({ rows: list, featured: featured.length ? featured : rows.sort((a, b) => b.hot - a.hot).slice(0, 3), units, totals: tot, cats: VIDEO_CATS })
})

// 作品全部已上线视频（正片 / 预告 / 先导片…），作者 / 运营 / 专家可见待审
r.get('/program/apps/:code/videos', async (c) => {
  const db = c.env.DB
  const a = await db.prepare('SELECT id,user_id FROM program_apps WHERE code=?').bind(c.req.param('code')).first<any>()
  if (!a) return c.json({ error: '作品不存在' }, 404)
  const u = c.get('user')
  const priv = u && (u.id === a.user_id || ['operator', 'admin', 'expert'].includes(u.role))
  const rows = (await db.prepare(`SELECT * FROM program_videos WHERE app_id=? AND status IN (${priv ? "'已上线','待审核','已驳回'" : "'已上线'"}) ORDER BY CASE COALESCE(category,'正片') WHEN '正片' THEN 0 WHEN '预告' THEN 1 WHEN '先导片A' THEN 2 WHEN '先导片B' THEN 3 WHEN '样章' THEN 4 ELSE 5 END, id DESC`).bind(a.id).all()).results as any[]
  return c.json({ rows: rows.map((v) => ({ id: v.id, category: v.category || '正片', title: v.title, status: v.status, duration: v.duration, size: v.size, plays: v.plays, kind: v.kind, reject_reason: v.reject_reason, player: v.kind === 'upload' ? { type: 'file', src: `/api/media/${v.id}` } : /\.(mp4|webm)(\?|$)/i.test(v.url) || String(v.url).startsWith('/static/') ? { type: 'file', src: v.url } : { type: 'external', src: v.url } })) })
})

r.post('/promo/event', async (c) => {
  const b = await c.req.json().catch(() => ({}))
  if (!['view', 'share', 'poster'].includes(b.type)) return c.json({ error: '无效事件' }, 422)
  const a = await c.env.DB.prepare('SELECT id FROM program_apps WHERE code=?').bind(String(b.code || '')).first<any>()
  if (!a) return c.json({ error: '作品不存在' }, 404)
  const dev = String(b.device || '').slice(0, 64)
  if (dev.length < 8) return c.json({ error: '缺少设备标识' }, 422)
  await c.env.DB.prepare('INSERT OR IGNORE INTO promo_events (app_id,type,ref,device) VALUES (?,?,?,?)').bind(a.id, b.type, String(b.ref || 'direct').slice(0, 24), dev).run()
  return c.json({ ok: true })
})

r.get('/program/apps/:id/promo', async (c) => {
  const g = need(c); if (g.err) return g.err
  const db = c.env.DB
  const m = await appOf(db, g.user, Number(c.req.param('id'))); if (m.err) return c.json({ error: m.err }, m.code)
  const id = m.app!.id
  const k = await db.prepare(`SELECT (SELECT COUNT(*) FROM promo_events WHERE app_id=? AND type='view') views,
    (SELECT COUNT(*) FROM promo_events WHERE app_id=? AND type='share') shares,
    (SELECT COALESCE(SUM(plays),0) FROM program_videos WHERE app_id=? AND status='已上线') plays,
    (SELECT COUNT(*) FROM program_votes WHERE app_id=?) votes`).bind(id, id, id, id).first<any>()
  const refs = (await db.prepare("SELECT ref, COUNT(*) n FROM promo_events WHERE app_id=? AND type='view' GROUP BY ref ORDER BY n DESC LIMIT 6").bind(id).all()).results
  const days = (await db.prepare("SELECT day, SUM(type='view') views, SUM(type='share') shares FROM promo_events WHERE app_id=? AND day >= date('now','-13 day') GROUP BY day ORDER BY day").bind(id).all()).results
  const grants = (await db.prepare('SELECT g.yuan,g.note,g.created_at,b.name FROM promo_grants g JOIN promo_buckets b ON b.code=g.bucket WHERE g.app_id=? ORDER BY g.id DESC').bind(id).all()).results
  const rank = (await db.prepare(`SELECT a.id, ${HOT_SQL} hot FROM program_apps a ORDER BY hot DESC`).all()).results as any[]
  return c.json({ app: m.app, kpi: { ...k, conv: Math.max(k.views, k.plays) ? Math.min(100, +((k.votes / Math.max(k.views, k.plays)) * 100).toFixed(1)) : 0 }, refs, days, grants, hot_rank: rank.findIndex((x) => x.id === id) + 1, total: rank.length })
})

r.get('/promo/overview', async (c) => {
  const buckets = (await c.env.DB.prepare('SELECT * FROM promo_buckets ORDER BY sort').all()).results
  const cb = (await c.env.DB.prepare('SELECT code,name,amount_yuan,granted,std_tokens,intro FROM compute_buckets ORDER BY sort').all()).results
  return c.json({ total: TOTAL_YUAN, compute: POOL_YUAN, promo: PROMO_YUAN, promo_buckets: buckets, compute_buckets: cb, units: UNITS })
})

r.post('/admin/apps/:id/screening', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  if (b.unit && !UNITS.some((u) => u.code === b.unit)) return c.json({ error: '无效展映单元' }, 422)
  const res = await c.env.DB.prepare('UPDATE program_apps SET screen_unit=COALESCE(?,screen_unit), featured=COALESCE(?,featured) WHERE id=?')
    .bind(b.unit || null, b.featured == null ? null : b.featured ? 1 : 0, c.req.param('id')).run()
  if (!res.meta.changes) return c.json({ error: '作品不存在' }, 404)
  await audit(c.env.DB, g.user, 'screening.set', 'program_app:' + c.req.param('id'), JSON.stringify(b))
  return c.json({ ok: true })
})
r.post('/admin/apps/:id/promo-grant', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const yuan = Number(b.yuan)
  if (!(yuan >= 1000 && yuan <= 2000000)) return c.json({ error: '单次宣发扶持 1 千—200 万元' }, 422)
  const a = await c.env.DB.prepare('SELECT id,status FROM program_apps WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!a) return c.json({ error: '作品不存在' }, 404)
  const take = await c.env.DB.prepare('UPDATE promo_buckets SET used_yuan=used_yuan+? WHERE code=? AND used_yuan+?<=amount_yuan').bind(yuan, b.bucket, yuan).run()
  if (!take.meta.changes) return c.json({ error: '宣发资金池不存在或余额不足' }, 409)
  const res = await c.env.DB.prepare('INSERT INTO promo_grants (app_id,bucket,yuan,note,operator) VALUES (?,?,?,?,?)').bind(a.id, b.bucket, yuan, String(b.note || '').slice(0, 200), g.user.id).run()
  await audit(c.env.DB, g.user, 'promo.grant', 'program_app:' + a.id, `${b.bucket} ${yuan}`)
  return c.json({ id: res.meta.last_row_id })
})

export default r
