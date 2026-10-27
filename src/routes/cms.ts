import { Hono } from 'hono'
import { Env, need, audit, rid } from '../lib/core'

/**
 * v4.2 全站后台 CMS
 * 1) 通用内容管理：前台每一块可编辑内容 ↔ 一个后台资源（白名单表 + 字段定义），统一 CRUD / 排序 / 显隐
 * 2) 专家照片：媒体库上传（R2）→ 绑定到评审 / 导师 / 专家库
 * 3) 影片评语管理：观众短评 + 专家评审意见，按影片聚合，隐藏 / 置顶 / 回复 / 公开精选 / 批量处理
 * 4) 站点文案：首页 Hero、公告条、页脚声明等 key-value，前台实时读取
 */
const r = new Hono<Env>()
const OPS = ['operator']

type F = { k: string; l: string; t?: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'image' | 'url' | 'json' | 'bool'; opts?: string[]; req?: boolean; list?: boolean; ph?: string }
type Res = { table: string; label: string; group: string; front: string; icon: string; order: string; fields: F[]; title: string; photo?: boolean; readonlyFields?: string[]; noCreate?: boolean; noDelete?: boolean }

export const RES: Record<string, Res> = {
  people: { table: 'program_people', label: '评审与导师', group: '专家体系', front: '#/jury', icon: 'fa-user-tie', order: 'sort, id', title: 'name', photo: true, fields: [
    { k: 'photo', l: '照片', t: 'image', list: true }, { k: 'name', l: '姓名', req: true, list: true }, { k: 'title', l: '头衔', req: true, list: true },
    { k: 'role', l: '角色', t: 'select', opts: ['评审', '导师'], req: true, list: true }, { k: 'status', l: '邀约状态', t: 'select', opts: ['邀约中', '已确认', '已婉拒', '待联系'], list: true },
    { k: 'record', l: '公开经历', t: 'textarea' }, { k: 'bio', l: '简介', t: 'textarea' }, { k: 'source', l: '信息来源' }, { k: 'source_url', l: '来源链接', t: 'url' },
    { k: 'photo_credit', l: '照片署名 / 许可', ph: '如：Bryan C · CC BY-SA 2.0 · Wikimedia Commons' }, { k: 'sort', l: '排序', t: 'number' }, { k: 'visible', l: '前台显示', t: 'bool', list: true }] },
  experts: { table: 'expert_library', label: '专家库', group: '专家体系', front: '#/support', icon: 'fa-user-graduate', order: 'sort, id', title: 'name', photo: true, fields: [
    { k: 'photo', l: '照片', t: 'image', list: true }, { k: 'name', l: '姓名', req: true, list: true }, { k: 'title', l: '头衔', req: true, list: true }, { k: 'org', l: '机构', list: true },
    { k: 'field', l: '擅长领域', list: true }, { k: 'note', l: '公开经历', t: 'textarea' }, { k: 'source', l: '信息来源' }, { k: 'source_url', l: '来源链接', t: 'url' },
    { k: 'photo_credit', l: '照片署名 / 许可' }, { k: 'sort', l: '排序', t: 'number' }, { k: 'visible', l: '前台显示', t: 'bool', list: true }] },
  likeness: { table: 'likeness_library', label: '肖像授权库', group: '专家体系', front: '#/support/likeness', icon: 'fa-id-badge', order: 'id', title: 'archetype', fields: [
    { k: 'code', l: '编号', req: true, list: true }, { k: 'archetype', l: '形象类型', req: true, list: true }, { k: 'ages', l: '可用形象' }, { k: 'genres', l: '适合题材' },
    { k: 'uses', l: '授权用途', t: 'textarea' }, { k: 'limits', l: '使用限制', t: 'textarea' }, { k: 'fee', l: '费用', list: true }, { k: 'status', l: '状态', t: 'select', opts: ['洽谈中', '可申请', '已暂停'], list: true }] },
  posts: { table: 'jd_posts', label: '盛典文章', group: '迭代盛典', front: '#/diedai', icon: 'fa-newspaper', order: 'pub_date DESC, id DESC', title: 'title', fields: [
    { k: 'title', l: '标题', req: true, list: true }, { k: 'pub_date', l: '发布日期', t: 'date', list: true }, { k: 'category', l: '分类', list: true }, { k: 'summary', l: '摘要', t: 'textarea' },
    { k: 'body', l: '正文', t: 'textarea', req: true }, { k: 'cover', l: '封面', t: 'image' }, { k: 'source', l: '来源' }, { k: 'url', l: '原文链接', t: 'url' }] },
  sections: { table: 'jd_sections', label: '盛典栏目', group: '迭代盛典', front: '#/diedai', icon: 'fa-trophy', order: 'sort, id', title: 'title', noCreate: true, noDelete: true, fields: [
    { k: 'code', l: '栏目代码', list: true }, { k: 'title', l: '栏目标题', req: true, list: true }, { k: 'status', l: '状态', t: 'select', opts: ['草案', '已发布', '待补充'], list: true },
    { k: 'body', l: '栏目内容（JSON）', t: 'json', req: true }, { k: 'sort', l: '排序', t: 'number' }], readonlyFields: ['code'] },
  events: { table: 'events', label: '路演与活动', group: '运营内容', front: '#/events', icon: 'fa-calendar-days', order: 'date', title: 'title', fields: [
    { k: 'title', l: '活动名称', req: true, list: true }, { k: 'kind', l: '类型', t: 'select', opts: ['路演', '展映', '工作坊', '发行需求会', '盛典'], list: true }, { k: 'date', l: '日期', t: 'date', list: true },
    { k: 'city', l: '城市', list: true }, { k: 'venue', l: '场地' }, { k: 'capacity', l: '名额', t: 'number' }, { k: 'booked', l: '已预约', t: 'number', list: true }, { k: 'intro', l: '介绍', t: 'textarea' }] },
  insights: { table: 'insights', label: '行业洞察', group: '运营内容', front: '#/academy', icon: 'fa-chart-line', order: 'date DESC', title: 'title', fields: [
    { k: 'title', l: '标题', req: true, list: true }, { k: 'source', l: '来源', list: true }, { k: 'url', l: '链接', t: 'url' }, { k: 'date', l: '日期', t: 'date', list: true }, { k: 'tag', l: '标签', list: true }, { k: 'summary', l: '摘要', t: 'textarea' }] },
  courses: { table: 'courses', label: '学院课程', group: '运营内容', front: '#/academy', icon: 'fa-graduation-cap', order: 'id', title: 'title', fields: [
    { k: 'title', l: '课程', req: true, list: true }, { k: 'path', l: '学习路径', list: true }, { k: 'level', l: '难度', t: 'select', opts: ['入门', '进阶', '专业'], list: true }, { k: 'lessons', l: '课时', t: 'number', list: true },
    { k: 'free', l: '免费', t: 'bool', list: true }, { k: 'intro', l: '介绍', t: 'textarea' }] },
  channels: { table: 'channels', label: '发行渠道', group: '出海与发行', front: '#/export/release', icon: 'fa-tower-broadcast', order: 'id', title: 'name', fields: [
    { k: 'name', l: '渠道', req: true, list: true }, { k: 'type', l: '类型', req: true, list: true }, { k: 'region', l: '地区', list: true }, { k: 'model', l: '商业模式' }, { k: 'specs', l: '交付规格' },
    { k: 'biz_status', l: '业务合作状态', t: 'select', opts: ['候选', '洽谈中', '已签约'], list: true }, { k: 'tech_status', l: '技术连接', t: 'select', opts: ['未接入', '对接中', '已接入'] }, { k: 'public_info', l: '公开信息', t: 'textarea' }, { k: 'source_url', l: '来源', t: 'url' }] },
  demands: { table: 'demands', label: '机构需求', group: '出海与发行', front: '#/market', icon: 'fa-bullseye', order: 'deadline', title: 'title', fields: [
    { k: 'title', l: '需求', req: true, list: true }, { k: 'org', l: '机构', list: true }, { k: 'genre', l: '题材' }, { k: 'duration', l: '时长' }, { k: 'region', l: '地区' }, { k: 'language', l: '语言' },
    { k: 'budget_band', l: '预算带', list: true }, { k: 'rights', l: '权利类别' }, { k: 'deadline', l: '截止', t: 'date', list: true }, { k: 'status', l: '状态', t: 'select', opts: ['征集中', '已截止', '已成交'], list: true }] },
  compute: { table: 'compute_buckets', label: '算力资金池', group: '1 亿元扶持', front: '#/fund', icon: 'fa-microchip', order: 'sort', title: 'name', noCreate: true, noDelete: true, readonlyFields: ['code', 'granted'], fields: [
    { k: 'code', l: '代码', list: true }, { k: 'name', l: '名称', req: true, list: true }, { k: 'amount_yuan', l: '面值（元）', t: 'number', list: true }, { k: 'granted', l: '已发放 Token', t: 'number', list: true }, { k: 'intro', l: '说明', t: 'textarea' }, { k: 'sort', l: '排序', t: 'number' }] },
  promo: { table: 'promo_buckets', label: '宣发资金池', group: '1 亿元扶持', front: '#/fund', icon: 'fa-bullhorn', order: 'sort', title: 'name', noCreate: true, noDelete: true, readonlyFields: ['code', 'used_yuan'], fields: [
    { k: 'code', l: '代码', list: true }, { k: 'name', l: '名称', req: true, list: true }, { k: 'amount_yuan', l: '额度（元）', t: 'number', list: true }, { k: 'used_yuan', l: '已发放', t: 'number', list: true }, { k: 'intro', l: '说明', t: 'textarea' }, { k: 'sort', l: '排序', t: 'number' }] },
  apps: { table: 'program_apps', label: '报名作品', group: '作品与展映', front: '#/board', icon: 'fa-clapperboard', order: 'id DESC', title: 'title', noCreate: true, readonlyFields: ['code', 'user_id'], fields: [
    { k: 'code', l: '编号', list: true }, { k: 'title', l: '作品名', req: true, list: true }, { k: 'team', l: '团队', req: true, list: true }, { k: 'track', l: '赛道', t: 'select', opts: ['专业团队', '院校毕业生'], list: true },
    { k: 'form', l: '形态', t: 'select', opts: ['AI电影', 'AI短片', 'AI剧集', 'AI动画'] }, { k: 'minutes', l: '时长', t: 'number' }, { k: 'school', l: '院校' }, { k: 'grad_year', l: '届别', t: 'number' },
    { k: 'logline', l: '一句话梗概', t: 'textarea' }, { k: 'members', l: '主创' }, { k: 'status', l: '状态', t: 'select', opts: ['初选中', '晋级路演', '路演通过', '已审批', '未通过'], list: true },
    { k: 'screen_unit', l: '展映单元', t: 'select', opts: ['', 'feature', 'series', 'short', 'campus', 'lab'] }, { k: 'featured', l: '主推', t: 'bool', list: true }, { k: 'user_id', l: '报名人 ID', t: 'number' }] },
  users: { table: 'users', label: '用户与角色', group: '系统', front: '#/me', icon: 'fa-users', order: 'id', title: 'name', noCreate: true, noDelete: true, photo: true, readonlyFields: ['email'], fields: [
    { k: 'avatar', l: '头像', t: 'image', list: true }, { k: 'name', l: '姓名', req: true, list: true }, { k: 'email', l: '邮箱', list: true },
    { k: 'role', l: '角色', t: 'select', opts: ['creator', 'expert', 'institution', 'distributor', 'operator', 'finance', 'admin'], list: true }, { k: 'org', l: '机构' }, { k: 'title', l: '头衔' },
    { k: 'verified', l: '已认证', t: 'bool', list: true }, { k: 'disabled', l: '停用', t: 'bool', list: true }] },
}
const fieldsOf = (k: string) => RES[k].fields.map((f) => f.k)

function clean(res: Res, b: any, creating: boolean) {
  const out: Record<string, any> = {}
  const miss: string[] = []
  for (const f of res.fields) {
    if (!creating && res.readonlyFields?.includes(f.k)) continue
    if (!(f.k in b)) { if (creating && f.req) miss.push(f.l); continue }
    let v = b[f.k]
    if (f.t === 'number') v = v === '' || v == null ? null : Number(v)
    else if (f.t === 'bool') v = v === true || v === 1 || v === '1' || v === 'on' ? 1 : 0
    else if (f.t === 'json') { if (typeof v === 'string') { try { v = JSON.stringify(JSON.parse(v)) } catch { return { err: `「${f.l}」不是合法的 JSON` } } } else v = JSON.stringify(v) }
    else v = v == null ? null : String(v).slice(0, f.t === 'textarea' ? 50000 : 500)
    if (f.t === 'url' && v && !/^https?:\/\//.test(v)) return { err: `「${f.l}」须以 http(s):// 开头` }
    if (f.t === 'select' && f.opts && v != null && !f.opts.includes(v)) return { err: `「${f.l}」取值无效` }
    if (f.req && (v == null || v === '')) miss.push(f.l)
    out[f.k] = v
  }
  if (miss.length) return { err: '请填写：' + miss.join('、') }
  return { out }
}

// ---------------- 资源目录 ----------------
r.get('/cms/schema', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const db = c.env.DB
  const list = await Promise.all(Object.entries(RES).map(async ([k, v]) => {
    const n = await db.prepare(`SELECT COUNT(*) n FROM ${v.table}`).first<any>()
    return { key: k, label: v.label, group: v.group, front: v.front, icon: v.icon, count: n.n, fields: v.fields, title: v.title, photo: !!v.photo, noCreate: !!v.noCreate, noDelete: !!v.noDelete, readonly: v.readonlyFields || [] }
  }))
  return c.json({ resources: list })
})

r.get('/cms/:res', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const res = RES[c.req.param('res')]; if (!res) return c.json({ error: '资源不存在' }, 404)
  const q = (c.req.query('q') || '').trim()
  const noId = ['compute_buckets', 'promo_buckets'].includes(res.table)
  const cols = [noId ? 'rowid AS id' : 'id', ...fieldsOf(c.req.param('res'))].join(',')
  const textCols = res.fields.filter((f) => !f.t || ['text', 'textarea', 'select'].includes(f.t)).slice(0, 4).map((f) => f.k)
  const where = q && textCols.length ? 'WHERE ' + textCols.map((k) => `${k} LIKE ?`).join(' OR ') : ''
  const rows = (await c.env.DB.prepare(`SELECT ${cols} FROM ${res.table} ${where} ORDER BY ${res.order} LIMIT 500`).bind(...(where ? textCols.map(() => `%${q}%`) : [])).all()).results
  return c.json({ rows })
})

r.post('/cms/:res', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const key = c.req.param('res'), res = RES[key]; if (!res) return c.json({ error: '资源不存在' }, 404)
  if (res.noCreate) return c.json({ error: '该资源不支持新建' }, 405)
  const x = clean(res, await c.req.json().catch(() => ({})), true); if (x.err) return c.json({ error: x.err }, 422)
  const ks = Object.keys(x.out!)
  const rr = await c.env.DB.prepare(`INSERT INTO ${res.table} (${ks.join(',')}) VALUES (${ks.map(() => '?').join(',')})`).bind(...ks.map((k) => x.out![k])).run()
  await audit(c.env.DB, g.user, 'cms.create', `${key}:${rr.meta.last_row_id}`, String(x.out![res.title] || ''))
  return c.json({ id: rr.meta.last_row_id })
})

r.put('/cms/:res/:id', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const key = c.req.param('res'), res = RES[key]; if (!res) return c.json({ error: '资源不存在' }, 404)
  const x = clean(res, await c.req.json().catch(() => ({})), false); if (x.err) return c.json({ error: x.err }, 422)
  const ks = Object.keys(x.out!); if (!ks.length) return c.json({ error: '没有可更新的字段' }, 422)
  if (key === 'users' && x.out!.role && Number(c.req.param('id')) === g.user.id && x.out!.role !== g.user.role) return c.json({ error: '不能修改自己的角色' }, 403)
  if (key === 'compute' && x.out!.amount_yuan != null) {
    const cur = await c.env.DB.prepare('SELECT granted FROM compute_buckets WHERE rowid=?').bind(c.req.param('id')).first<any>()
    x.out!.std_tokens = Math.round((Number(x.out!.amount_yuan) / 46) * 1e6)
    if (cur && x.out!.std_tokens < cur.granted) return c.json({ error: '面值不能低于已发放额度' }, 409)
    ks.push('std_tokens')
  }
  if (key === 'promo' && x.out!.amount_yuan != null) {
    const cur = await c.env.DB.prepare('SELECT used_yuan FROM promo_buckets WHERE rowid=?').bind(c.req.param('id')).first<any>()
    if (cur && Number(x.out!.amount_yuan) < cur.used_yuan) return c.json({ error: '额度不能低于已发放金额' }, 409)
  }
  const idCol = ['compute_buckets', 'promo_buckets', 'site_settings'].includes(res.table) ? 'rowid' : 'id'
  const rr = await c.env.DB.prepare(`UPDATE ${res.table} SET ${ks.map((k) => `${k}=?`).join(',')}${res.table === 'jd_sections' ? ", updated_at=datetime('now')" : ''} WHERE ${idCol}=?`).bind(...ks.map((k) => x.out![k]), c.req.param('id')).run()
  if (!rr.meta.changes) return c.json({ error: '记录不存在' }, 404)
  if (key === 'users' && x.out!.disabled === 1) await c.env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(c.req.param('id')).run()
  await audit(c.env.DB, g.user, 'cms.update', `${key}:${c.req.param('id')}`, ks.join(','))
  return c.json({ ok: true })
})

r.delete('/cms/:res/:id', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const key = c.req.param('res'), res = RES[key]; if (!res) return c.json({ error: '资源不存在' }, 404)
  if (res.noDelete) return c.json({ error: '该资源不允许删除（可改为隐藏 / 停用）' }, 405)
  if (key === 'apps') {
    const used = await c.env.DB.prepare("SELECT COUNT(*) n FROM export_deals WHERE app_id=? AND stage IN ('签约','交付','上线','回款','完结')").bind(c.req.param('id')).first<any>()
    if (used.n) return c.json({ error: '该作品存在已签约交易，不可删除' }, 409)
  }
  const rr = await c.env.DB.prepare(`DELETE FROM ${res.table} WHERE id=?`).bind(c.req.param('id')).run()
  if (!rr.meta.changes) return c.json({ error: '记录不存在' }, 404)
  await audit(c.env.DB, g.user, 'cms.delete', `${key}:${c.req.param('id')}`)
  return c.json({ ok: true })
})

r.post('/cms/:res/reorder', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const res = RES[c.req.param('res')]; if (!res || !fieldsOf(c.req.param('res')).includes('sort')) return c.json({ error: '该资源不支持排序' }, 422)
  const b = await c.req.json().catch(() => ({}))
  const ids: number[] = Array.isArray(b.ids) ? b.ids.map(Number) : []
  for (let i = 0; i < ids.length; i++) await c.env.DB.prepare(`UPDATE ${res.table} SET sort=? WHERE id=?`).bind(i, ids[i]).run()
  await audit(c.env.DB, g.user, 'cms.reorder', c.req.param('res'), ids.join(','))
  return c.json({ ok: true })
})

// ---------------- 媒体库（照片 / 封面） ----------------
const IMG = ['image/jpeg', 'image/png', 'image/webp']
r.post('/cms-media', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  if (!c.env.VIDEOS) return c.json({ error: '存储未开通' }, 503)
  const mime = (c.req.header('content-type') || '').split(';')[0]
  if (!IMG.includes(mime)) return c.json({ error: '仅支持 JPG / PNG / WebP 图片' }, 415)
  const buf = await c.req.arrayBuffer()
  if (buf.byteLength > 5 * 1048576) return c.json({ error: '图片不超过 5MB' }, 413)
  if (buf.byteLength < 100) return c.json({ error: '图片无效' }, 422)
  const key = `cms/${Date.now()}-${rid(8)}.${mime.split('/')[1].replace('jpeg', 'jpg')}`
  await c.env.VIDEOS.put(key, buf, { httpMetadata: { contentType: mime } })
  const name = decodeURIComponent(c.req.header('x-file-name') || '').slice(0, 120)
  const rr = await c.env.DB.prepare('INSERT INTO cms_media (r2_key,mime,size,name,user_id) VALUES (?,?,?,?,?)').bind(key, mime, buf.byteLength, name, g.user.id).run()
  await audit(c.env.DB, g.user, 'cms.media.upload', 'media:' + rr.meta.last_row_id, name)
  return c.json({ id: rr.meta.last_row_id, url: `/api/cms-media/${rr.meta.last_row_id}` })
})
r.get('/cms-media', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const rows = (await c.env.DB.prepare('SELECT id,mime,size,name,created_at FROM cms_media ORDER BY id DESC LIMIT 200').all()).results.map((x: any) => ({ ...x, url: `/api/cms-media/${x.id}` }))
  return c.json({ rows })
})
r.get('/cms-media/:id', async (c) => {
  const m = await c.env.DB.prepare('SELECT * FROM cms_media WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!m || !c.env.VIDEOS) return c.json({ error: '图片不存在' }, 404)
  const o = await c.env.VIDEOS.get(m.r2_key)
  if (!o) return c.json({ error: '文件丢失' }, 404)
  return new Response(o.body, { headers: { 'Content-Type': m.mime, 'Cache-Control': 'public, max-age=86400' } })
})

// ---------------- 站点文案 ----------------
r.get('/site', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT key,value FROM site_settings').all()).results as any[]
  return c.json(Object.fromEntries(rows.map((x) => [x.key, x.value])))
})
r.get('/cms-settings', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  return c.json({ rows: (await c.env.DB.prepare('SELECT * FROM site_settings ORDER BY grp, sort').all()).results })
})
r.put('/cms-settings', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const items = Object.entries(b.values || {})
  let n = 0
  for (const [k, v] of items) {
    const rr = await c.env.DB.prepare("UPDATE site_settings SET value=?, updated_by=?, updated_at=datetime('now') WHERE key=?").bind(String(v ?? '').slice(0, 4000), g.user.id, k).run()
    n += rr.meta.changes
  }
  await audit(c.env.DB, g.user, 'cms.settings', 'site', items.map(([k]) => k).join(','))
  return c.json({ updated: n })
})

// ---------------- 影片评语管理 ----------------
r.get('/cms-comments', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const db = c.env.DB
  const kind = c.req.query('kind') || 'all', st = c.req.query('status') || 'all', app = Number(c.req.query('app') || 0), q = (c.req.query('q') || '').trim()
  const films = (await db.prepare(`SELECT a.id,a.code,a.title,a.team,
      (SELECT COUNT(*) FROM program_votes v WHERE v.app_id=a.id AND v.comment<>'') audience,
      (SELECT COUNT(*) FROM program_votes v WHERE v.app_id=a.id AND v.comment<>'' AND v.hidden=1) hidden,
      (SELECT COUNT(*) FROM program_reviews r WHERE r.app_id=a.id AND r.status='已提交') experts,
      (SELECT AVG((story+visual+craft)/3.0) FROM program_votes v WHERE v.app_id=a.id) pub_avg,
      (SELECT AVG(total) FROM program_reviews r WHERE r.app_id=a.id AND r.status='已提交') exp_avg
      FROM program_apps a ORDER BY audience+experts DESC`).all()).results
  const rows: any[] = []
  if (kind !== 'expert') {
    const cond = [`v.comment IS NOT NULL AND v.comment<>''`]; const bind: any[] = []
    if (app) { cond.push('v.app_id=?'); bind.push(app) }
    if (st === 'hidden') cond.push('v.hidden=1'); if (st === 'visible') cond.push('v.hidden=0'); if (st === 'pinned') cond.push('v.pinned=1'); if (st === 'flag') cond.push("v.flag IS NOT NULL AND v.flag<>''")
    if (q) { cond.push('(v.comment LIKE ? OR v.name LIKE ?)'); bind.push(`%${q}%`, `%${q}%`) }
    const vs = (await db.prepare(`SELECT v.id,v.app_id,v.name,v.comment,v.story,v.visual,v.craft,v.hidden,v.pinned,v.reply,v.flag,v.created_at,a.title,a.code
      FROM program_votes v JOIN program_apps a ON a.id=v.app_id WHERE ${cond.join(' AND ')} ORDER BY v.pinned DESC, v.id DESC LIMIT 300`).bind(...bind).all()).results as any[]
    rows.push(...vs.map((x) => ({ ...x, kind: 'audience', score: +((x.story + x.visual + x.craft) / 3).toFixed(1) })))
  }
  if (kind !== 'audience') {
    const cond = [`r.status='已提交'`]; const bind: any[] = []
    if (app) { cond.push('r.app_id=?'); bind.push(app) }
    if (st === 'hidden') cond.push('r.public_ok=0'); if (st === 'visible') cond.push('r.public_ok=1'); if (st === 'pinned') cond.push('r.featured=1'); if (st === 'flag') cond.push('1=0')
    if (q) { cond.push('r.comment LIKE ?'); bind.push(`%${q}%`) }
    const rs = (await db.prepare(`SELECT r.id,r.app_id,r.comment,r.total,r.scores,r.recommend,r.public_ok,r.featured,r.op_note,r.created_at,u.name expert,a.title,a.code
      FROM program_reviews r JOIN users u ON u.id=r.user_id JOIN program_apps a ON a.id=r.app_id WHERE ${cond.join(' AND ')} ORDER BY r.featured DESC, r.id DESC LIMIT 300`).bind(...bind).all()).results as any[]
    rows.push(...rs.map((x) => ({ ...x, kind: 'expert', scores: JSON.parse(x.scores || '{}') })))
  }
  rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  const k = await db.prepare(`SELECT (SELECT COUNT(*) FROM program_votes WHERE comment<>'') audience, (SELECT COUNT(*) FROM program_votes WHERE comment<>'' AND hidden=1) hidden,
    (SELECT COUNT(*) FROM program_votes WHERE flag IS NOT NULL AND flag<>'') flagged, (SELECT COUNT(*) FROM program_reviews WHERE status='已提交') experts,
    (SELECT COUNT(*) FROM program_reviews WHERE featured=1) featured`).first()
  return c.json({ rows, films, kpi: k })
})

const BAD = ['刷分', '垃圾', '傻', '骗', '滚', '加微信', '加V', 'vx', '代刷', '广告']
r.post('/cms-comments/scan', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const rows = (await c.env.DB.prepare("SELECT id,comment FROM program_votes WHERE comment<>'' AND (flag IS NULL OR flag='')").all()).results as any[]
  let n = 0
  for (const x of rows) {
    const hit = BAD.filter((w) => String(x.comment).toLowerCase().includes(w.toLowerCase()))
    if (hit.length) { await c.env.DB.prepare('UPDATE program_votes SET flag=? WHERE id=?').bind('敏感词：' + hit.join('、'), x.id).run(); n++ }
  }
  await audit(c.env.DB, g.user, 'comment.scan', 'program_votes', String(n))
  return c.json({ flagged: n, scanned: rows.length })
})

r.post('/cms-comments/:kind/:id', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const kind = c.req.param('kind'), id = Number(c.req.param('id'))
  const b = await c.req.json().catch(() => ({}))
  const db = c.env.DB
  let sql = '', bind: any[] = []
  if (kind === 'audience') {
    const A: Record<string, [string, any[]]> = {
      hide: ["UPDATE program_votes SET hidden=1 WHERE id=?", [id]], show: ["UPDATE program_votes SET hidden=0, flag=NULL WHERE id=?", [id]],
      pin: ['UPDATE program_votes SET pinned=1, hidden=0 WHERE id=?', [id]], unpin: ['UPDATE program_votes SET pinned=0 WHERE id=?', [id]],
      reply: ['UPDATE program_votes SET reply=? WHERE id=?', [String(b.reply || '').slice(0, 300) || null, id]],
      delete: ['DELETE FROM program_votes WHERE id=?', [id]],
    }
    if (!A[b.action]) return c.json({ error: '无效操作' }, 422)
    if (b.action === 'delete' && (!b.reason || String(b.reason).length < 2)) return c.json({ error: '删除评分须填写原因（将同时移除该条评分）' }, 422)
    ;[sql, bind] = A[b.action]
  } else if (kind === 'expert') {
    const A: Record<string, [string, any[]]> = {
      publish: ['UPDATE program_reviews SET public_ok=1 WHERE id=?', [id]], unpublish: ['UPDATE program_reviews SET public_ok=0, featured=0 WHERE id=?', [id]],
      feature: ['UPDATE program_reviews SET featured=1, public_ok=1 WHERE id=?', [id]], unfeature: ['UPDATE program_reviews SET featured=0 WHERE id=?', [id]],
      note: ['UPDATE program_reviews SET op_note=? WHERE id=?', [String(b.note || '').slice(0, 300) || null, id]],
    }
    if (!A[b.action]) return c.json({ error: '专家评审不可删除或改分，仅可控制公开与备注' }, 422)
    ;[sql, bind] = A[b.action]
  } else return c.json({ error: '无效类型' }, 422)
  const rr = await db.prepare(sql).bind(...bind).run()
  if (!rr.meta.changes) return c.json({ error: '评语不存在' }, 404)
  await audit(db, g.user, `comment.${kind}.${b.action}`, `${kind}:${id}`, b.reason || b.reply || b.note || '')
  return c.json({ ok: true })
})

r.post('/cms-comments/batch', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const ids: number[] = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Boolean).slice(0, 200)
  if (!ids.length || !['hide', 'show'].includes(b.action)) return c.json({ error: '请选择评语与操作' }, 422)
  const ph = ids.map(() => '?').join(',')
  const rr = await c.env.DB.prepare(`UPDATE program_votes SET hidden=?${b.action === 'show' ? ', flag=NULL' : ''} WHERE id IN (${ph})`).bind(b.action === 'hide' ? 1 : 0, ...ids).run()
  await audit(c.env.DB, g.user, 'comment.batch.' + b.action, 'program_votes', ids.join(','))
  return c.json({ updated: rr.meta.changes })
})

// 前台：作品公开评语（观众短评隐藏者不展示；专家仅展示已公开，匿名）
r.get('/program/apps/:code/comments', async (c) => {
  const db = c.env.DB
  const a = await db.prepare('SELECT id FROM program_apps WHERE code=?').bind(c.req.param('code')).first<any>()
  if (!a) return c.json({ error: '作品不存在' }, 404)
  const audience = (await db.prepare("SELECT name,comment,reply,pinned,created_at FROM program_votes WHERE app_id=? AND comment<>'' AND hidden=0 ORDER BY pinned DESC, id DESC LIMIT 20").bind(a.id).all()).results
  const experts = (await db.prepare("SELECT comment,total,featured,created_at FROM program_reviews WHERE app_id=? AND status='已提交' AND public_ok=1 ORDER BY featured DESC, id DESC LIMIT 6").bind(a.id).all()).results
  return c.json({ audience, experts })
})

// ---------------- 后台总控台 ----------------
r.get('/cms-dashboard', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const db = c.env.DB
  const k = await db.prepare(`SELECT (SELECT COUNT(*) FROM users) users, (SELECT COUNT(*) FROM program_apps) apps,
    (SELECT COUNT(*) FROM program_videos WHERE status='待审核') v_pending, (SELECT COUNT(*) FROM app_materials WHERE status='待审阅') m_pending,
    (SELECT COUNT(*) FROM export_titles WHERE status='审核中') t_pending, (SELECT COUNT(*) FROM program_votes WHERE flag IS NOT NULL AND flag<>'') c_flag,
    (SELECT COUNT(*) FROM program_people WHERE photo IS NULL OR photo='') no_photo, (SELECT COUNT(*) FROM program_people) people,
    (SELECT COUNT(*) FROM export_deals WHERE stage NOT IN ('完结','已终止')) deals, (SELECT COUNT(*) FROM tickets WHERE status='待处理') tickets`).first()
  const logs = (await db.prepare('SELECT actor,action,object,detail,created_at FROM audit_logs ORDER BY id DESC LIMIT 15').all()).results
  return c.json({ kpi: k, logs })
})

r.get('/cms-audit', async (c) => {
  const g = need(c, OPS); if (g.err) return g.err
  const q = (c.req.query('q') || '').trim()
  const rows = (await c.env.DB.prepare(`SELECT * FROM audit_logs ${q ? 'WHERE action LIKE ? OR object LIKE ? OR actor LIKE ?' : ''} ORDER BY id DESC LIMIT 300`).bind(...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [])).all()).results
  return c.json({ rows })
})

export default r
