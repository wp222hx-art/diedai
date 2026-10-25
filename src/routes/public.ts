import { Hono } from 'hono'
import { Env, pbkdf2, rid, need, audit, ROLE_LABEL } from '../lib/core'

const r = new Hono<Env>()

// ---------- 身份 M01 ----------
r.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}))
  if (!email || !password) return c.json({ error: '请输入邮箱和密码' }, 422)
  const u = await c.env.DB.prepare('SELECT * FROM users WHERE email=?').bind(String(email).trim().toLowerCase()).first<any>()
  if (!u || (await pbkdf2(password, u.salt)) !== u.pwd_hash) return c.json({ error: '邮箱或密码错误' }, 401)
  const token = rid(32)
  await c.env.DB.prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,datetime('now','+7 days'))").bind(token, u.id).run()
  await audit(c.env.DB, u, 'auth.login', 'user:' + u.id)
  return c.json({ token, user: { id: u.id, name: u.name, email: u.email, role: u.role, role_label: ROLE_LABEL[u.role], org: u.org, title: u.title } })
})
r.post('/auth/register', async (c) => {
  const b = await c.req.json().catch(() => ({}))
  const email = String(b.email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: '邮箱格式不正确' }, 422)
  if (!b.password || String(b.password).length < 8) return c.json({ error: '密码至少8位' }, 422)
  if (!b.name) return c.json({ error: '请填写姓名' }, 422)
  const role = ['creator', 'institution'].includes(b.role) ? b.role : 'creator' // 专家/运营由后台邀请，不开放自助注册
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first()
  if (exists) return c.json({ error: '该邮箱已注册' }, 409)
  const salt = rid(12)
  const res = await c.env.DB.prepare('INSERT INTO users (email,name,role,org,title,salt,pwd_hash,verified) VALUES (?,?,?,?,?,?,?,0)')
    .bind(email, b.name, role, b.org || '', b.title || '', salt, await pbkdf2(b.password, salt)).run()
  const id = res.meta.last_row_id
  const token = rid(32)
  await c.env.DB.prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,datetime('now','+7 days'))").bind(token, id).run()
  await audit(c.env.DB, { id, name: b.name } as any, 'auth.register', 'user:' + id, role === 'institution' ? '机构待核验' : '')
  return c.json({ token, user: { id, name: b.name, email, role, role_label: ROLE_LABEL[role], org: b.org || '' } })
})
r.get('/auth/me', (c) => {
  const g = need(c); if (g.err) return g.err
  return c.json({ user: { ...g.user, role_label: ROLE_LABEL[g.user.role] } })
})
r.post('/auth/logout', async (c) => {
  const t = (c.req.header('Authorization') || '').replace('Bearer ', '')
  if (t) await c.env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(t).run()
  return c.json({ ok: true })
})

// ---------- 首页 P01 ----------
r.get('/home', async (c) => {
  const db = c.env.DB
  const [ed, stats, listings, events, insights, honors, demands] = await Promise.all([
    db.prepare("SELECT * FROM editions WHERE status='报名中' ORDER BY year DESC LIMIT 1").first(),
    db.prepare(`SELECT (SELECT COUNT(*) FROM assets) assets,(SELECT COUNT(*) FROM entries) entries,
      (SELECT COUNT(*) FROM listings WHERE status='已发布') listings,(SELECT COUNT(*) FROM channels) channels,
      (SELECT COUNT(*) FROM expert_library) experts,(SELECT COUNT(*) FROM projects) projects`).first(),
    db.prepare(`SELECT l.id,l.type,l.title,l.summary,l.territory,l.media,l.exclusive,l.price_mode,a.form,a.genre,a.stage,a.cover,a.total_minutes
      FROM listings l JOIN assets a ON a.id=l.asset_id WHERE l.status='已发布' AND l.visibility='公开摘要' ORDER BY l.id LIMIT 6`).all(),
    db.prepare("SELECT * FROM events ORDER BY date LIMIT 4").all(),
    db.prepare("SELECT * FROM insights ORDER BY date DESC LIMIT 4").all(),
    db.prepare(`SELECT ar.id,aw.name award,a.title,a.cover,a.form,e.name edition,ce.code cert
      FROM award_results ar JOIN awards aw ON aw.id=ar.award_id JOIN entries en ON en.id=ar.entry_id
      JOIN assets a ON a.id=en.asset_id JOIN editions e ON e.id=en.edition_id LEFT JOIN certificates ce ON ce.award_result_id=ar.id
      WHERE ar.status='有效' ORDER BY ar.published_at DESC LIMIT 6`).all(),
    db.prepare("SELECT * FROM demands WHERE status='征集中' ORDER BY deadline LIMIT 3").all(),
  ])
  return c.json({ edition: ed, stats, listings: listings.results, events: events.results, insights: insights.results, honors: honors.results, demands: demands.results })
})

// ---------- 盛典 P02 / P06 ----------
r.get('/editions', async (c) => {
  const eds = (await c.env.DB.prepare('SELECT * FROM editions ORDER BY year DESC').all()).results as any[]
  const tracks = (await c.env.DB.prepare('SELECT * FROM tracks').all()).results as any[]
  const awards = (await c.env.DB.prepare('SELECT * FROM awards').all()).results as any[]
  for (const e of eds) e.tracks = tracks.filter((t) => t.edition_id === e.id).map((t) => ({ ...t, weights: JSON.parse(t.weights || '{}'), awards: awards.filter((a) => a.track_id === t.id) }))
  return c.json({ editions: eds })
})
r.get('/honors', async (c) => {
  // 公开接口只返回“有效/复核中/已撤销（更正记录）”，不返回未公开结果（AT04）
  const rows = await c.env.DB.prepare(`SELECT ar.id,ar.status,ar.published_at,aw.name award,t.name track,a.title,a.form,a.cover,a.team,
    v.version,e.name edition,ce.code cert FROM award_results ar JOIN awards aw ON aw.id=ar.award_id JOIN tracks t ON t.id=aw.track_id
    JOIN entries en ON en.id=ar.entry_id JOIN assets a ON a.id=en.asset_id LEFT JOIN asset_versions v ON v.id=en.version_id
    JOIN editions e ON e.id=en.edition_id LEFT JOIN certificates ce ON ce.award_result_id=ar.id
    WHERE ar.status IN ('有效','复核中','已撤销') ORDER BY ar.published_at DESC`).all()
  return c.json({ honors: rows.results })
})
r.get('/certificates/:code', async (c) => {
  const cert = await c.env.DB.prepare('SELECT code,holder,work_title,version,award_name,edition_name,issuer,issued_at,status FROM certificates WHERE code=?')
    .bind(c.req.param('code').toUpperCase()).first()
  if (!cert) return c.json({ error: '未找到该证书编号，请核对后重试' }, 404)
  return c.json({ certificate: cert, note: '本页为可验证电子证书，仅披露必要信息；不构成司法确权或区块链存证。' })
})

// ---------- 专家网络（公开资料）----------
r.get('/experts', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM expert_library ORDER BY id').all()
  return c.json({ experts: rows.results, disclaimer: '以下人士信息来源于公开报道，仅用于专家网络建设参考；未经本人书面确认，不代表其已受邀或担任本平台评委。' })
})

// ---------- 影市公开 P07 ----------
r.get('/listings', async (c) => {
  const u = c.get('user')
  const type = c.req.query('type') || ''
  const kw = c.req.query('q') || ''
  const vis = u && ['institution', 'distributor', 'operator', 'admin'].includes(u.role) ? "('公开摘要','认证机构可见')" : "('公开摘要')"
  const rows = await c.env.DB.prepare(`SELECT l.id,l.type,l.title,l.summary,l.territory,l.media,l.language,l.exclusive,l.price_mode,l.price_hint,
     l.visibility,l.start_date,l.end_date,a.form,a.genre,a.stage,a.cover,a.total_minutes,a.episodes,
     (SELECT aw.name||'｜'||e.name FROM award_results ar JOIN awards aw ON aw.id=ar.award_id JOIN entries en ON en.id=ar.entry_id
       JOIN editions e ON e.id=en.edition_id WHERE en.asset_id=l.asset_id AND ar.status='有效' LIMIT 1) honor
     FROM listings l JOIN assets a ON a.id=l.asset_id
     WHERE l.status='已发布' AND l.visibility IN ${vis} AND (?='' OR l.type=?) AND (?='' OR l.title LIKE ? OR a.genre LIKE ?)
     ORDER BY l.id DESC`).bind(type, type, kw, `%${kw}%`, `%${kw}%`).all()
  return c.json({ listings: rows.results })
})
r.get('/listings/:id', async (c) => {
  const u = c.get('user')
  const l = await c.env.DB.prepare(`SELECT l.*,a.title asset_title,a.form,a.genre,a.stage,a.cover,a.logline,a.total_minutes,a.episodes,a.ep_minutes,a.rights_status,a.team
    FROM listings l JOIN assets a ON a.id=l.asset_id WHERE l.id=?`).bind(c.req.param('id')).first<any>()
  if (!l) return c.json({ error: '挂牌不存在' }, 404)
  const isOwner = u && u.id === l.seller_id
  const isOrg = u && ['institution', 'distributor', 'operator', 'admin'].includes(u.role)
  if (l.status !== '已发布' && !isOwner && !(u && ['operator', 'admin'].includes(u.role))) return c.json({ error: '挂牌未公开' }, 404)
  if (l.visibility === '认证机构可见' && !isOwner && !isOrg) return c.json({ error: '该挂牌仅认证机构可见，请以机构身份登录' }, 403)
  // 荣誉徽章：实时查询 AwardResult，绑定获奖版本（AT05/AT06）
  const honor = await c.env.DB.prepare(`SELECT aw.name award,e.name edition,v.version,ar.status,ce.code cert FROM award_results ar
    JOIN awards aw ON aw.id=ar.award_id JOIN entries en ON en.id=ar.entry_id JOIN editions e ON e.id=en.edition_id
    LEFT JOIN asset_versions v ON v.id=en.version_id LEFT JOIN certificates ce ON ce.award_result_id=ar.id
    WHERE en.asset_id=? AND ar.status IN ('有效','复核中')`).bind(l.asset_id).all()
  let grant: any = null
  if (u) grant = await c.env.DB.prepare(`SELECT * FROM access_grants WHERE listing_id=? AND requester_id=? ORDER BY id DESC LIMIT 1`).bind(l.id, u.id).first()
  // 资料室：仅已批准且未过期的机构可见对应层级（AT10）
  const dataroom = isOwner || (grant && grant.status === '已批准' && grant.expires_at >= new Date().toISOString().slice(0, 10))
    ? { level: isOwner ? '全部（权利人）' : grant.level, files: ['故事大纲.pdf（水印预览）', '人物小传.pdf', isOwner || grant?.level === '完整剧本' ? '完整剧本.pdf' : null, '权利链证明（摘要）'].filter(Boolean) }
    : null
  const reservations = isOwner || isOrg ? (await c.env.DB.prepare(`SELECT territory,media,language,start_date,end_date,exclusive,status FROM rights_reservations WHERE asset_id=?`).bind(l.asset_id).all()).results : []
  return c.json({ listing: l, honors: honor.results, grant, dataroom, reservations, is_owner: !!isOwner })
})
r.get('/demands', async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM demands ORDER BY deadline").all()
  return c.json({ demands: rows.results })
})

// ---------- 发行渠道公开目录 ----------
r.get('/channels', async (c) => {
  const rows = await c.env.DB.prepare('SELECT id,name,type,region,model,specs,biz_status,tech_status,public_info FROM channels ORDER BY id').all()
  return c.json({ channels: rows.results, note: '渠道档案为系统可配置的发行类型与公开信息建档，不代表已签约或已接入；“业务合作状态”与“技术连接状态”独立。' })
})

// ---------- 学院与资源 / 活动 ----------
r.get('/insights', async (c) => c.json({ insights: (await c.env.DB.prepare('SELECT * FROM insights ORDER BY date DESC').all()).results }))
r.get('/courses', async (c) => c.json({ courses: (await c.env.DB.prepare('SELECT * FROM courses').all()).results }))
r.get('/events', async (c) => {
  const u = c.get('user')
  const rows = (await c.env.DB.prepare('SELECT * FROM events ORDER BY date').all()).results as any[]
  if (u) {
    const b = (await c.env.DB.prepare('SELECT event_id FROM bookings WHERE user_id=?').bind(u.id).all()).results as any[]
    const set = new Set(b.map((x) => x.event_id)); rows.forEach((r) => (r.booked_by_me = set.has(r.id)))
  }
  return c.json({ events: rows })
})
r.post('/events/:id/book', async (c) => {
  const g = need(c); if (g.err) return g.err
  const id = Number(c.req.param('id'))
  const ev = await c.env.DB.prepare('SELECT * FROM events WHERE id=?').bind(id).first<any>()
  if (!ev) return c.json({ error: '活动不存在' }, 404)
  if (ev.booked >= ev.capacity) return c.json({ error: '名额已满，可加入候补' }, 409)
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO bookings (event_id,user_id) VALUES (?,?)').bind(id, g.user.id),
      c.env.DB.prepare('UPDATE events SET booked=booked+1 WHERE id=?').bind(id),
    ])
  } catch { return c.json({ error: '您已预约该活动' }, 409) }
  await audit(c.env.DB, g.user, 'event.book', 'event:' + id)
  return c.json({ ok: true, note: '预约成功。观众票不等于资料室访问权。' })
})

export default r
