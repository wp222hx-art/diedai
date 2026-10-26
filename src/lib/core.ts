import type { Context, Next } from 'hono'

export type Bindings = { DB: D1Database; VIDEOS?: R2Bucket }
export type User = { id: number; email: string; name: string; role: string; org: string; title: string }
export type Env = { Bindings: Bindings; Variables: { user: User | null } }

// ---------- 通用 ----------
export const ROLE_LABEL: Record<string, string> = {
  creator: '创作者', expert: '评审专家', institution: '认证机构', distributor: '发行运营',
  operator: '联合运营', finance: '财务', admin: '系统管理员'
}

export async function pbkdf2(pwd: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pwd), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 10000 }, key, 256)
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export const rid = (n = 24) => {
  const a = new Uint8Array(n); crypto.getRandomValues(a)
  return [...a].map((b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')
}

export async function authMiddleware(c: Context<Env>, next: Next) {
  c.set('user', null)
  const h = c.req.header('Authorization') || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (token) {
    const u = await c.env.DB.prepare(
      `SELECT u.id,u.email,u.name,u.role,u.org,u.title FROM sessions s JOIN users u ON u.id=s.user_id
       WHERE s.token=? AND s.expires_at > datetime('now')`).bind(token).first<User>()
    if (u) c.set('user', u)
  }
  await next()
}

export function need(c: Context<Env>, roles?: string[]) {
  const u = c.get('user')
  if (!u) return { err: c.json({ error: '请先登录', code: 401 }, 401) }
  if (roles && !roles.includes(u.role) && u.role !== 'admin')
    return { err: c.json({ error: '无权限：该操作需要角色 ' + roles.map((r) => ROLE_LABEL[r]).join('/'), code: 403 }, 403) }
  return { user: u }
}

export async function audit(db: D1Database, u: User | null, action: string, object: string, detail = '') {
  await db.prepare('INSERT INTO audit_logs (actor_id,actor,action,object,detail) VALUES (?,?,?,?,?)')
    .bind(u?.id ?? 0, u?.name ?? 'system', action, object, detail).run()
}
export async function emit(db: D1Database, topic: string, payload: unknown) {
  await db.prepare('INSERT INTO outbox (event_id,topic,payload) VALUES (?,?,?)')
    .bind('evt_' + rid(16), topic, JSON.stringify(payload)).run()
}

// ---------- 权利范围父子词表（AT08/AT09/AT16） ----------
export const TERRITORY_ALL = ['全球']
export const MEDIA_ALL = ['全媒体']
export const LANG_ALL = ['全语种', '不限']
export const TERRITORIES = ['全球', '中国大陆', '港澳台', '东南亚', '日韩', '北美', '欧洲', '中东', '拉美']
export const MEDIAS = ['全媒体', '网络视频', '短剧平台', '电视/IPTV', '院线/展映', '航空/行业']

/** 生成 SQL 片段：判断表 r 中的已占用范围与新范围 (?,?,?,?,?) 是否重叠且任一方独家 */
export const OVERLAP_SQL = `
  r.asset_id = ? AND r.status = '已占用'
  AND (r.territory = ? OR r.territory = '全球' OR ? = '全球')
  AND (r.media = ? OR r.media = '全媒体' OR ? = '全媒体')
  AND (r.language = ? OR r.language IN ('全语种','不限') OR ? IN ('全语种','不限'))
  AND r.start_date <= ? AND r.end_date >= ?
  AND (r.exclusive = 1 OR ? = 1)`
export type Scope = { asset_id: number; territory: string; media: string; language: string; start_date: string; end_date: string; exclusive: number }
export const overlapBinds = (s: Scope) => [s.asset_id, s.territory, s.territory, s.media, s.media, s.language, s.language, s.end_date, s.start_date, s.exclusive ? 1 : 0]

export async function findConflicts(db: D1Database, s: Scope) {
  const r = await db.prepare(`SELECT r.* FROM rights_reservations r WHERE ${OVERLAP_SQL}`).bind(...overlapBinds(s)).all()
  return r.results
}

// ---------- 算力预算生成器（全案第8章） ----------
export type ShotClass = { name: string; seconds: number; adopt: number; k: number; p?: number; qObserved?: number; r: number; billSec: number; price: number }
export function estimateScenario(shots: ShotClass[]) {
  let total = 0, gens = 0
  const lines = shots.map((s) => {
    const N = Math.ceil(s.seconds / s.adopt)
    let q = s.qObserved && s.qObserved > 0 ? s.qObserved : (s.p && s.p > 0 ? 1 - Math.pow(1 - s.p, s.k) : 0)
    if (!q) return { name: s.name, N, q: 0, G: 0, cost: 0, warn: '需试制校准（p缺失或为0）' }
    const Graw = (N * s.k) / q * (1 + s.r)
    const G = Math.ceil(Graw - 1e-9)
    const cost = G * s.billSec * s.price
    total += cost; gens += G
    return { name: s.name, N, q: +q.toFixed(4), Graw: +Graw.toFixed(2), G, cost: +cost.toFixed(2) }
  })
  return { lines, generations: gens, cost: +total.toFixed(2) }
}

// ---------- 分账瀑布（技术策划第18章） ----------
export function settle(received: number, rule: { commission_pct: number; promo: number; recoup: number; creator_pct: number }) {
  const steps: { item: string; amount: number }[] = []
  let left = received
  const commission = +(received * rule.commission_pct / 100).toFixed(2); left -= commission
  steps.push({ item: `发行佣金 ${rule.commission_pct}%（按实际到账）`, amount: commission })
  const promo = Math.min(rule.promo, Math.max(left, 0)); left -= promo
  steps.push({ item: '回收已批准宣发费', amount: +promo.toFixed(2) })
  const recoup = Math.min(rule.recoup, Math.max(left, 0)); left -= recoup
  steps.push({ item: '回收可回收投资余额', amount: +recoup.toFixed(2) })
  const creator = +(left * rule.creator_pct / 100).toFixed(2)
  const investor = +(left - creator).toFixed(2)
  steps.push({ item: `创作方分成 ${rule.creator_pct}%`, amount: creator })
  steps.push({ item: `投资方分成 ${100 - rule.creator_pct}%`, amount: investor })
  const sum = +steps.reduce((a, b) => a + b.amount, 0).toFixed(2)
  return { received, steps, sum, recoup_left: +(rule.recoup - recoup).toFixed(2), balanced: Math.abs(sum - received) < 0.01 }
}
