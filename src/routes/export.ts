import { Hono } from 'hono'
import { Env, need, audit, emit, rid, sha256 } from '../lib/core'

/**
 * v4.1 出海与交易中心
 * 出海片单（创作者上架 → 运营审核）→ 交易室（询价 → 看片 → 报价 → 条款 → 签约 → 交付 → 上线 → 回款 → 完结）
 * 8 种交易模式 · 独家权利冲突阻断 · 发行窗口 · 银行凭证回款 · 全程留痕
 */
const r = new Hono<Env>()

export const MODES = [
  { code: 'buyout', name: '版权买断', en: 'Buyout', icon: 'fa-handshake', price: 'amount', fit: '成片、短剧，追求一次性回款', how: '买方一次性支付买断价，取得约定地区 / 媒介 / 期限内的全部发行收益', creator: '一次性收入，无后续分账', risk: '价格锁定，作品爆款无额外收益' },
  { code: 'license', name: '授权许可', en: 'License', icon: 'fa-key', price: 'amount', fit: '分地区、分平台多次授权', how: '按地区 × 媒介 × 期限 × 独家性收取授权费，到期权利回归', creator: '授权费；同一作品可拆分多次售卖', risk: '独家授权会占用权利库存' },
  { code: 'mg', name: '保底 + 分成', en: 'MG + Rev-share', icon: 'fa-shield-halved', price: 'mg_share', fit: '有一定市场预期的成片与剧集', how: '买方先付保底预付（MG），实际收益超过保底部分按比例分成', creator: '保底先落袋，超额继续分成', risk: '收益未超保底则无分成' },
  { code: 'revshare', name: '纯分账', en: 'Revenue Share', icon: 'fa-chart-pie', price: 'share', fit: '海外短剧 App、YouTube、FAST 频道', how: '无预付，按平台实收的约定比例结算', creator: '上不封顶，回款随播放与付费增长', risk: '回款周期长、依赖平台报表' },
  { code: 'agency', name: '代理发行', en: 'Sales Agency', icon: 'fa-briefcase', price: 'commission', fit: '需要专业团队代卖多个地区', how: '代理方以佣金为对价，负责海外市场推介、谈判与回款', creator: '净收入 = 实收 − 佣金 − 已批准费用', risk: '需约定佣金上限、费用审批与账目审计' },
  { code: 'coprod', name: '联合出品', en: 'Co-production', icon: 'fa-people-arrows', price: 'amount_share', fit: '开发中项目，引入海外合作方', how: '合作方投入资金 / 资源，按约定比例共享版权与收益', creator: '获得制作资金，保留部分版权', risk: '需提前约定创作控制权与署名' },
  { code: 'option', name: '改编期权', en: 'Option', icon: 'fa-hourglass-half', price: 'amount', fit: '剧本 / IP 海外翻拍或改编', how: '买方支付期权费锁定一段时间的改编权，行权时再付购买价', creator: '期权费 + 行权价，不行权权利回归', risk: '期权期内不得另行出售改编权' },
  { code: 'presale', name: '地区预售', en: 'Pre-sale', icon: 'fa-earth-asia', price: 'amount', fit: '已有样片的开发项目融资', how: '在成片前向各地区发行方预售发行权，用预售款支持制作', creator: '提前获得制作资金', risk: '须按约交付，否则需退款' },
]
const MODE = (c: string) => MODES.find((m) => m.code === c)
export const STAGES = ['询价', '看片', '报价', '条款', '签约', '交付', '上线', '回款', '完结']
export const STAGE_INFO: Record<string, { who: string; do: string; proof: string }> = {
  询价: { who: '买方', do: '选择交易模式、地区、媒介与期限，发起非约束询价', proof: '询价单（不锁权）' },
  看片: { who: '卖方', do: '同意买方观看完整样片 / 正片（带水印、限期）', proof: '看片授权记录' },
  报价: { who: '买方 ↔ 卖方', do: '买方报价，双方可多轮还价', proof: '每轮报价留痕' },
  条款: { who: '双方', do: '一方接受报价，进入条款确认：交付规格、结算周期、税费', proof: '条款清单' },
  签约: { who: '双方 / 运营', do: '上传合同文本，系统计算校验值并校验独家权利冲突', proof: '合同 SHA-256 · 权利占用' },
  交付: { who: '卖方 → 买方', do: '交付母版、字幕、元数据与权利文件，买方验收', proof: '交付清单 · 验收确认' },
  上线: { who: '买方 / 发行', do: '按发行窗口上线，回填渠道内容 ID 与上线证据', proof: '内容 ID · 截图 / 链接' },
  回款: { who: '财务', do: '凭银行回款凭证登记实收，支持分批到账', proof: '银行凭证号' },
  完结: { who: '运营', do: '款项结清、窗口到期或续约，交易归档', proof: '结项记录' },
}
export const REGIONS = ['全球', '中国大陆', '港澳台', '东南亚', '日韩', '北美', '拉美', '欧洲', '中东北非', '南亚']
export const MEDIA = ['全媒体', '短剧 App', '流媒体 SVOD', '免费流媒体 AVOD/FAST', '视频平台 YouTube/TikTok', '电视台', '院线 / 电影节']
const LIVE_STAGES = ['签约', '交付', '上线', '回款', '完结']
const BUYER = ['institution', 'distributor']
const OPS = ['operator', 'admin']
const J = (s: any, d: any = []) => { try { return JSON.parse(s) } catch { return d } }

/** 创作方到手测算（演示口径，不含税） */
export function estimate(mode: string, p: { amount?: number; mg?: number; share_pct?: number; gross?: number; fees?: number }) {
  const amount = +(p.amount || 0), mg = +(p.mg || 0), sh = +(p.share_pct || 0) / 100, gross = +(p.gross || 0), fees = +(p.fees || 0)
  const steps: { k: string; v: number }[] = []
  let creator = 0
  switch (mode) {
    case 'buyout': case 'license': case 'option': case 'presale':
      creator = amount; steps.push({ k: MODE(mode)!.name + '对价', v: amount }); break
    case 'mg': {
      const over = Math.max(0, gross * sh - mg)
      creator = mg + over; steps.push({ k: '保底预付 MG', v: mg }, { k: `超额分成（实收×${p.share_pct}% − MG）`, v: +over.toFixed(2) }); break
    }
    case 'revshare':
      creator = gross * sh; steps.push({ k: `平台实收 × ${p.share_pct}%`, v: +creator.toFixed(2) }); break
    case 'agency': {
      const cm = gross * sh, net = Math.max(0, gross - cm - fees)
      creator = net; steps.push({ k: '实收', v: gross }, { k: `代理佣金 ${p.share_pct}%`, v: -+cm.toFixed(2) }, { k: '已批准发行费用', v: -fees }); break
    }
    case 'coprod':
      creator = gross * (1 - sh); steps.push({ k: '合作方投入（制作资金）', v: amount }, { k: `收益分成（创作方 ${100 - (p.share_pct || 0)}%）`, v: +creator.toFixed(2) }); break
  }
  return { creator: +creator.toFixed(2), steps }
}

const overlap = (a: string[], b: string[]) => a.includes('全球') || b.includes('全球') || a.some((x) => b.includes(x))
async function log(db: D1Database, deal: number, u: any, stage: string, action: string, detail = '') {
  await db.prepare('INSERT INTO export_events (deal_id,actor_id,actor,stage,action,detail) VALUES (?,?,?,?,?,?)').bind(deal, u?.id || 0, u?.name || 'system', stage, action, detail).run()
}
function pubTitle(t: any) {
  return { ...t, modes: J(t.modes), territories: J(t.territories), languages: J(t.languages), formats: J(t.formats) }
}

// ---------------- 公开：总览 ----------------
r.get('/export/overview', async (c) => {
  const db = c.env.DB
  const titles = (await db.prepare(`SELECT t.*, a.code, a.title, a.team, a.track, a.form, a.minutes, a.logline, a.school,
      (SELECT COALESCE(SUM(plays),0) FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线') plays,
      (SELECT COUNT(*) FROM export_deals d WHERE d.title_id=t.id AND d.stage<>'已终止') inquiries
      FROM export_titles t JOIN program_apps a ON a.id=t.app_id WHERE t.status='已上架' ORDER BY inquiries DESC, t.id DESC`).all()).results.map(pubTitle)
  const st = await db.prepare(`SELECT (SELECT COUNT(*) FROM export_titles WHERE status='已上架') titles,
    (SELECT COUNT(*) FROM export_deals WHERE stage<>'已终止') deals,
    (SELECT COUNT(*) FROM export_deals WHERE stage IN ('签约','交付','上线','回款','完结')) signed,
    (SELECT COUNT(*) FROM export_releases) windows`).first()
  const channels = (await db.prepare('SELECT name,type,region,model,biz_status FROM channels ORDER BY id').all()).results
  return c.json({ modes: MODES, stages: STAGES, stage_info: STAGE_INFO, regions: REGIONS, media: MEDIA, titles, stats: st, channels,
    note: '交易模式与流程为平台撮合规则；渠道为对接方向，不代表已签约或已接入；测算为演示口径，不含税费，不构成收益承诺。' })
})

r.post('/export/calc', async (c) => {
  const b = await c.req.json().catch(() => ({}))
  if (!MODE(b.mode)) return c.json({ error: '未知交易模式' }, 422)
  return c.json(estimate(b.mode, b))
})

r.get('/export/titles/:id', async (c) => {
  const t = await c.env.DB.prepare(`SELECT t.*, a.code, a.title, a.team, a.track, a.form, a.minutes, a.logline, a.school, a.grad_year, a.user_id owner
    FROM export_titles t JOIN program_apps a ON a.id=t.app_id WHERE t.id=?`).bind(c.req.param('id')).first<any>()
  if (!t) return c.json({ error: '片单不存在' }, 404)
  const u = c.get('user')
  if (t.status !== '已上架' && !(u && (u.id === t.owner || OPS.includes(u.role)))) return c.json({ error: '片单未上架' }, 404)
  const sold = (await c.env.DB.prepare(`SELECT mode,territories,media,exclusive,stage FROM export_deals WHERE title_id=? AND stage IN ('签约','交付','上线','回款','完结')`).bind(t.id).all()).results.map((d: any) => ({ ...d, territories: J(d.territories) }))
  let mine: any = null
  if (u) mine = await c.env.DB.prepare("SELECT id,code,stage FROM export_deals WHERE title_id=? AND buyer_id=? AND stage NOT IN ('已终止','完结') ORDER BY id DESC LIMIT 1").bind(t.id, u.id).first()
  return c.json({ title: pubTitle(t), sold, my_deal: mine, is_owner: !!(u && u.id === t.owner) })
})

// ---------------- 创作者：出海上架 ----------------
r.post('/export/titles', async (c) => {
  const g = need(c, ['creator']); if (g.err) return g.err
  const db = c.env.DB, b = await c.req.json().catch(() => ({}))
  const a = await db.prepare('SELECT id,user_id,status FROM program_apps WHERE id=?').bind(Number(b.app_id)).first<any>()
  if (!a || a.user_id !== g.user.id) return c.json({ error: '作品不存在或无权限' }, 403)
  const modes = (Array.isArray(b.modes) ? b.modes : []).filter((m: string) => MODE(m))
  const terr = (Array.isArray(b.territories) ? b.territories : []).filter((x: string) => REGIONS.includes(x))
  const miss: string[] = []
  if (!modes.length) miss.push('可接受交易模式')
  if (!terr.length) miss.push('可售地区')
  if (!b.rights_confirm) miss.push('确认拥有对应地区的发行权利')
  if (miss.length) return c.json({ error: '上架信息不完整', missing: miss }, 422)
  const live = await db.prepare("SELECT COUNT(*) n FROM program_videos WHERE app_id=? AND status='已上线'").bind(a.id).first<any>()
  if (!live.n) return c.json({ error: '请先上传至少一条视频并通过审核，买方需要看片' }, 409)
  const vals = [g.user.id, JSON.stringify(modes), JSON.stringify(terr), JSON.stringify((b.languages || []).slice(0, 12)), JSON.stringify((b.formats || []).slice(0, 6)),
    String(b.price_hint || '').slice(0, 80), String(b.highlights || '').slice(0, 300), String(b.rights_note || '').slice(0, 300)]
  const ex = await db.prepare('SELECT id FROM export_titles WHERE app_id=?').bind(a.id).first<any>()
  if (ex) {
    await db.prepare("UPDATE export_titles SET user_id=?,modes=?,territories=?,languages=?,formats=?,price_hint=?,highlights=?,rights_note=?,status='审核中',reject_reason=NULL WHERE id=?").bind(...vals, ex.id).run()
    await audit(db, g.user, 'export.title.update', 'export_title:' + ex.id)
    return c.json({ id: ex.id, status: '审核中' })
  }
  const res = await db.prepare('INSERT INTO export_titles (app_id,user_id,modes,territories,languages,formats,price_hint,highlights,rights_note) VALUES (?,?,?,?,?,?,?,?,?)').bind(a.id, ...vals).run()
  await audit(db, g.user, 'export.title.create', 'export_title:' + res.meta.last_row_id)
  return c.json({ id: res.meta.last_row_id, status: '审核中' })
})

r.get('/export/mine', async (c) => {
  const g = need(c); if (g.err) return g.err
  const db = c.env.DB
  const titles = (await db.prepare(`SELECT t.id,t.status,t.reject_reason,t.modes,t.territories,a.id app_id,a.title,a.code FROM export_titles t JOIN program_apps a ON a.id=t.app_id WHERE t.user_id=? ORDER BY t.id DESC`).bind(g.user.id).all()).results.map(pubTitle)
  const deals = (await db.prepare(`SELECT d.id,d.code,d.mode,d.stage,d.amount,d.mg,d.share_pct,d.currency,d.territories,d.updated_at,a.title,
      ub.name buyer, ub.org buyer_org, us.name seller, CASE WHEN d.buyer_id=? THEN 'buyer' ELSE 'seller' END side
      FROM export_deals d JOIN program_apps a ON a.id=d.app_id JOIN users ub ON ub.id=d.buyer_id JOIN users us ON us.id=d.seller_id
      WHERE d.buyer_id=? OR d.seller_id=? ORDER BY d.updated_at DESC`).bind(g.user.id, g.user.id, g.user.id).all()).results.map((d: any) => ({ ...d, territories: J(d.territories) }))
  const apps = g.user.role === 'creator' ? (await db.prepare(`SELECT a.id,a.title,(SELECT COUNT(*) FROM program_videos v WHERE v.app_id=a.id AND v.status='已上线') live,
      (SELECT id FROM export_titles t WHERE t.app_id=a.id) tid FROM program_apps a WHERE a.user_id=?`).bind(g.user.id).all()).results : []
  return c.json({ titles, deals, apps })
})

// ---------------- 交易 ----------------
r.post('/export/deals', async (c) => {
  const g = need(c, BUYER); if (g.err) return g.err
  const db = c.env.DB, b = await c.req.json().catch(() => ({}))
  const t = await db.prepare("SELECT t.*, a.user_id owner, a.title FROM export_titles t JOIN program_apps a ON a.id=t.app_id WHERE t.id=? AND t.status='已上架'").bind(Number(b.title_id)).first<any>()
  if (!t) return c.json({ error: '片单不存在或未上架' }, 404)
  const modes = J(t.modes), terr = J(t.territories)
  if (!modes.includes(b.mode)) return c.json({ error: '权利方未开放该交易模式' }, 422)
  const want = (Array.isArray(b.territories) ? b.territories : []).filter((x: string) => REGIONS.includes(x))
  if (!want.length) return c.json({ error: '请选择意向地区' }, 422)
  if (!terr.includes('全球') && want.some((x: string) => !terr.includes(x))) return c.json({ error: '意向地区超出权利方可售范围：' + want.filter((x: string) => !terr.includes(x)).join('、') }, 422)
  const open = await db.prepare("SELECT id FROM export_deals WHERE title_id=? AND buyer_id=? AND stage NOT IN ('已终止','完结')").bind(t.id, g.user.id).first()
  if (open) return c.json({ error: '你已有进行中的交易，请在交易室继续沟通' }, 409)
  const code = 'EX' + rid(6)
  const res = await db.prepare(`INSERT INTO export_deals (code,title_id,app_id,buyer_id,seller_id,mode,territories,media,languages,exclusive,term_months,amount,mg,share_pct,currency,message)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(code, t.id, t.app_id, g.user.id, t.owner, b.mode, JSON.stringify(want), MEDIA.includes(b.media) ? b.media : '全媒体',
    String(b.languages || '').slice(0, 60), b.exclusive ? 1 : 0, Math.min(240, Math.max(0, Number(b.term_months) || 24)), Number(b.amount) || 0, Number(b.mg) || 0,
    Math.min(100, Math.max(0, Number(b.share_pct) || 0)), ['CNY', 'USD', 'EUR'].includes(b.currency) ? b.currency : 'CNY', String(b.message || '').slice(0, 500)).run()
  const id = res.meta.last_row_id as number
  await log(db, id, g.user, '询价', '发起询价', `${MODE(b.mode)!.name} · ${want.join('/')} · ${b.exclusive ? '独家' : '非独家'}`)
  await audit(db, g.user, 'export.inquiry', 'export_deal:' + id)
  await emit(db, 'export.inquiry', { deal: id })
  return c.json({ id, code, stage: '询价', note: '询价为非约束意向，不锁定权利；签约生效后才占用权利库存' })
})

async function dealOf(c: any) {
  const g = need(c); if (g.err) return { err: g.err }
  const d = await c.env.DB.prepare(`SELECT d.*, a.title, a.code app_code, ub.name buyer, ub.org buyer_org, us.name seller FROM export_deals d JOIN program_apps a ON a.id=d.app_id
    JOIN users ub ON ub.id=d.buyer_id JOIN users us ON us.id=d.seller_id WHERE d.id=?`).bind(Number(c.req.param('id'))).first()
  if (!d) return { err: c.json({ error: '交易不存在' }, 404) }
  const u = g.user!
  const side = u.id === d.buyer_id ? 'buyer' : u.id === d.seller_id ? 'seller' : OPS.includes(u.role) ? 'operator' : u.role === 'finance' ? 'finance' : null
  if (!side) return { err: c.json({ error: '仅交易双方与运营可查看' }, 403) }
  return { d, u, side }
}

r.get('/export/deals/:id', async (c) => {
  const x = await dealOf(c); if (x.err) return x.err
  const db = c.env.DB, d = x.d
  const events = (await db.prepare('SELECT * FROM export_events WHERE deal_id=? ORDER BY id').bind(d.id).all()).results
  const releases = (await db.prepare('SELECT * FROM export_releases WHERE deal_id=? ORDER BY window_start').bind(d.id).all()).results
  const est = estimate(d.mode, { ...d, gross: d.mode === 'mg' || d.mode === 'revshare' || d.mode === 'agency' || d.mode === 'coprod' ? Math.max(d.received, d.mg * 2, 100000) : 0 })
  return c.json({ deal: { ...d, territories: J(d.territories), delivery: J(d.delivery, null) }, side: x.side, events, releases, mode: MODE(d.mode), stages: STAGES, stage_info: STAGE_INFO, estimate: est, due: d.mode === 'mg' ? d.mg : d.amount })
})

const DELIVERY = ['母版（ProRes / H.264 高码率）', '多语种字幕（SRT）', '音轨分离（对白 / 音乐音效 M&E）', '海报与剧照', '元数据（简介 / 分级 / 演职员）', '权利链与授权文件', 'AI 生成合成内容标识说明']

r.post('/export/deals/:id/act', async (c) => {
  const x = await dealOf(c); if (x.err) return x.err
  const db = c.env.DB, d = x.d, u = x.u, side = x.side
  const b = await c.req.json().catch(() => ({}))
  const act = String(b.action || '')
  const to = async (stage: string, action: string, detail = '', extra = '', binds: any[] = []) => {
    const res = await db.prepare(`UPDATE export_deals SET stage=?, updated_at=datetime('now')${extra} WHERE id=? AND stage=?`).bind(stage, ...binds, d.id, d.stage).run()
    if (!res.meta.changes) return c.json({ error: '交易状态已变化，请刷新' }, 409)
    await log(db, d.id, u, stage, action, detail)
    await audit(db, u, 'export.' + act, 'export_deal:' + d.id, `${d.stage} → ${stage}`)
    await emit(db, 'export.stage', { deal: d.id, stage })
    return c.json({ stage })
  }
  const deny = (msg: string, code: 400 | 403 | 409 | 422 = 403) => c.json({ error: msg }, code)

  if (act === 'terminate') {
    if (['完结', '已终止'].includes(d.stage)) return deny('交易已结束', 409)
    if (LIVE_STAGES.includes(d.stage) && side !== 'operator') return deny('已签约交易须由运营协调终止')
    if (!b.reason || String(b.reason).trim().length < 4) return deny('请填写终止原因', 422)
    if (LIVE_STAGES.includes(d.stage)) await db.prepare("UPDATE rights_reservations SET status='已释放' WHERE source='export' AND source_id=?").bind(d.id).run()
    return to('已终止', '终止交易', b.reason, ', close_reason=?', [String(b.reason).slice(0, 200)])
  }
  switch (d.stage) {
    case '询价':
      if (act !== 'allow_screen' || side !== 'seller') return deny('询价阶段需由权利方同意看片')
      return to('看片', '同意看片', `授权 ${Math.min(30, Number(b.days) || 14)} 天水印看片`)
    case '看片':
    case '报价': {
      if (act === 'offer' || act === 'counter') {
        if (d.stage === '看片' && side !== 'buyer') return deny('请等待买方报价')
        if (!['buyer', 'seller'].includes(side)) return deny('仅交易双方可报价')
        const m = MODE(d.mode)!
        const amount = Number(b.amount) || 0, mg = Number(b.mg) || 0, share = Number(b.share_pct) || 0
        if (['amount', 'amount_share'].includes(m.price) && !(amount > 0)) return deny('请填写金额', 422)
        if (m.price === 'mg_share' && !(mg > 0 && share > 0 && share <= 100)) return deny('请填写保底金额与分成比例', 422)
        if (['share', 'commission'].includes(m.price) && !(share > 0 && share <= 100)) return deny('请填写比例（1—100%）', 422)
        const detail = `${side === 'buyer' ? '买方' : '卖方'}${act === 'offer' ? '报价' : '还价'}：${amount ? d.currency + ' ' + amount.toLocaleString() : ''}${mg ? ' 保底 ' + mg.toLocaleString() : ''}${share ? ' ' + share + '%' : ''}${b.note ? ' · ' + String(b.note).slice(0, 100) : ''}`
        const res = await db.prepare(`UPDATE export_deals SET stage='报价', amount=?, mg=?, share_pct=?, message=?, updated_at=datetime('now') WHERE id=? AND stage=?`)
          .bind(amount, mg, share, side, d.id, d.stage).run()
        if (!res.meta.changes) return deny('交易状态已变化，请刷新', 409)
        await log(db, d.id, u, '报价', act === 'offer' ? '报价' : '还价', detail)
        return c.json({ stage: '报价' })
      }
      if (act === 'accept') {
        if (d.stage !== '报价') return deny('尚无报价', 409)
        if (!['buyer', 'seller'].includes(side) || d.message === side) return deny('需由对方接受报价')
        return to('条款', '接受报价', `${side === 'buyer' ? '买方' : '卖方'}接受当前报价`)
      }
      return deny('无效操作', 422)
    }
    case '条款': {
      if (act !== 'sign') return deny('条款阶段请上传合同完成签约', 422)
      if (!['buyer', 'seller', 'operator'].includes(side)) return deny('无权签约')
      if (!b.contract_text || String(b.contract_text).length < 20) return deny('请粘贴合同文本（≥20 字）用于计算校验值', 422)
      const terr = J(d.territories)
      const others = (await db.prepare(`SELECT id,territories,media,exclusive FROM export_deals WHERE app_id=? AND id<>? AND stage IN ('签约','交付','上线','回款','完结')`).bind(d.app_id, d.id).all()).results as any[]
      const clash = others.find((o) => (o.exclusive || d.exclusive) && overlap(terr, J(o.territories)) && (o.media === d.media || o.media === '全媒体' || d.media === '全媒体'))
      if (clash) {
        await db.prepare("INSERT INTO tickets (kind,object,detail,created_by) VALUES ('法务复核',?,?,?)").bind('export_deal:' + d.id, '与交易 #' + clash.id + ' 独家地区/媒介重叠', u.id).run()
        await log(db, d.id, u, '条款', '签约被阻断', '与已签约交易独家权利重叠，已转法务复核')
        return deny('独家权利冲突：与已签约交易的地区 / 媒介重叠，签约已阻断并转法务复核', 409)
      }
      const hash = 'sha256:' + (await sha256(String(b.contract_text)))
      const start = new Date().toISOString().slice(0, 10), end = new Date(Date.now() + (d.term_months || 24) * 30.4 * 864e5).toISOString().slice(0, 10)
      for (const t of terr) await db.prepare("INSERT INTO rights_reservations (asset_id,source,source_id,territory,media,language,start_date,end_date,exclusive,status) VALUES (?,?,?,?,?,?,?,?,?,'已占用')")
        .bind(-d.app_id, 'export', d.id, t, d.media, d.languages || '不限', start, end, d.exclusive).run()
      return to('签约', '签约生效', hash.slice(0, 23) + '… · 权利占用 ' + terr.join('/') + ` · ${start}~${end}`, ', contract_hash=?', [hash])
    }
    case '签约': {
      if (act !== 'deliver' || side !== 'seller') return deny('签约后由权利方提交交付清单')
      const items = (Array.isArray(b.items) ? b.items : []).filter((i: string) => DELIVERY.includes(i))
      if (items.length < 4) return deny('交付清单至少包含母版、字幕、元数据、权利文件等 4 项', 422)
      return to('交付', '提交交付', items.join('、'), ', delivery=?', [JSON.stringify({ items, at: new Date().toISOString(), accepted: false })])
    }
    case '交付': {
      if (act !== 'golive' || !['buyer', 'operator'].includes(side)) return deny('交付验收后由买方回填上线信息')
      if (!b.content_id || !b.evidence) return deny('确认上线需渠道内容 ID 与上线证据（链接或截图说明）', 422)
      return to('上线', '验收并上线', `内容ID ${String(b.content_id).slice(0, 60)}`, ', content_id=?, live_evidence=?', [String(b.content_id).slice(0, 80), String(b.evidence).slice(0, 300)])
    }
    case '上线':
    case '回款': {
      if (act === 'receipt') {
        if (!['finance', 'operator', 'seller'].includes(side)) return deny('回款由财务 / 运营 / 权利方登记')
        if (!b.bank_ref) return deny('需银行回款凭证号，付款截图不能认定实收', 422)
        const amt = Number(b.amount)
        if (!(amt > 0)) return deny('请填写到账金额', 422)
        const res = await db.prepare("UPDATE export_deals SET received=received+?, stage='回款', updated_at=datetime('now') WHERE id=? AND stage IN ('上线','回款')").bind(amt, d.id).run()
        if (!res.meta.changes) return deny('交易状态已变化', 409)
        await log(db, d.id, u, '回款', '登记回款', `${b.bank_ref} · ${d.currency} ${amt.toLocaleString()}`)
        await audit(db, u, 'export.receipt', 'export_deal:' + d.id, `${b.bank_ref} ${amt}`)
        return c.json({ stage: '回款', received: d.received + amt })
      }
      if (act === 'close') {
        if (side !== 'operator') return deny('由运营确认结项')
        if (d.stage !== '回款') return deny('尚未登记回款', 409)
        return to('完结', '结项归档', b.note || `累计回款 ${d.currency} ${d.received.toLocaleString()}`)
      }
      return deny('无效操作', 422)
    }
  }
  return deny('交易已结束', 409)
})

r.post('/export/deals/:id/releases', async (c) => {
  const x = await dealOf(c); if (x.err) return x.err
  if (!['buyer', 'operator'].includes(x.side)) return c.json({ error: '由买方 / 发行方规划窗口' }, 403)
  if (!LIVE_STAGES.includes(x.d.stage)) return c.json({ error: '签约生效后才能规划发行窗口' }, 409)
  const b = await c.req.json().catch(() => ({}))
  const terr = J(x.d.territories)
  if (!b.region || !(terr.includes(b.region) || terr.includes('全球'))) return c.json({ error: '窗口地区须在已签约地区内' }, 422)
  if (!b.channel || !b.window_start || !b.window_end || b.window_start > b.window_end) return c.json({ error: '请填写渠道与有效的起止日期' }, 422)
  const res = await c.env.DB.prepare('INSERT INTO export_releases (deal_id,region,channel,language,window_start,window_end) VALUES (?,?,?,?,?,?)').bind(x.d.id, b.region, String(b.channel).slice(0, 60), String(b.language || '').slice(0, 30), b.window_start, b.window_end).run()
  await log(c.env.DB, x.d.id, x.u, x.d.stage, '规划发行窗口', `${b.region} · ${b.channel} · ${b.window_start}~${b.window_end}`)
  return c.json({ id: res.meta.last_row_id })
})

// ---------------- 运营 ----------------
r.get('/admin/export', async (c) => {
  const g = need(c, ['operator', 'finance']); if (g.err) return g.err
  const db = c.env.DB
  const titles = (await db.prepare(`SELECT t.*, a.title, a.team, a.code FROM export_titles t JOIN program_apps a ON a.id=t.app_id ORDER BY t.status='审核中' DESC, t.id DESC`).all()).results.map(pubTitle)
  const deals = (await db.prepare(`SELECT d.id,d.code,d.mode,d.stage,d.amount,d.mg,d.share_pct,d.currency,d.received,d.exclusive,d.territories,d.updated_at,a.title,ub.org buyer_org,ub.name buyer
    FROM export_deals d JOIN program_apps a ON a.id=d.app_id JOIN users ub ON ub.id=d.buyer_id ORDER BY d.updated_at DESC`).all()).results.map((d: any) => ({ ...d, territories: J(d.territories) }))
  const funnel = STAGES.map((s) => ({ s, n: deals.filter((d: any) => STAGES.indexOf(d.stage) >= STAGES.indexOf(s)).length }))
  return c.json({ titles, deals, funnel, modes: MODES })
})
r.post('/admin/export/titles/:id/decide', async (c) => {
  const g = need(c, ['operator']); if (g.err) return g.err
  const b = await c.req.json().catch(() => ({}))
  const st = b.action === 'approve' ? '已上架' : b.action === 'reject' ? '已驳回' : b.action === 'offline' ? '已下架' : null
  if (!st) return c.json({ error: '无效操作' }, 422)
  if (st === '已驳回' && !b.reason) return c.json({ error: '请填写驳回原因' }, 422)
  const res = await c.env.DB.prepare('UPDATE export_titles SET status=?, reject_reason=?, reviewer=? WHERE id=?').bind(st, b.reason || null, g.user.id, c.req.param('id')).run()
  if (!res.meta.changes) return c.json({ error: '片单不存在' }, 404)
  await audit(c.env.DB, g.user, 'export.title.' + b.action, 'export_title:' + c.req.param('id'), b.reason || '')
  return c.json({ status: st })
})

export default r
