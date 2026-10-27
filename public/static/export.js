/* 迭影计划 · 出海与交易中心
 * #/export            总览（市场数据 · 模式 · 流程 · 片单 · 发行）
 * #/export/modes      8 种交易模式 + 到手测算
 * #/export/flow       9 阶段交易流程
 * #/export/titles     出海片单    #/export/title/:id  片单详情 + 询价
 * #/export/release    发行：交付清单 / 窗口 / 渠道 / 回款分账
 * #/export/mine       我的交易    #/export/deal/:id   交易室
 * #/export/list/:appId 创作者出海上架
 */
(function () {
  const R = window.ROUTES
  const TABS = [['', '总览', 'fa-earth-asia'], ['modes', '交易模式', 'fa-handshake'], ['flow', '交易流程', 'fa-route'], ['titles', '出海片单', 'fa-film'], ['release', '发行', 'fa-satellite-dish'], ['mine', '我的交易', 'fa-briefcase']]
  const ST_C = { 询价: '', 看片: 'cyan', 报价: 'amber', 条款: 'amber', 签约: 'gold', 交付: 'gold', 上线: 'green', 回款: 'green', 完结: 'green', 已终止: 'red' }
  const sTag = (s) => `<span class="tag ${ST_C[s] || ''}">${esc(s)}</span>`
  const cur = (c, n) => (n ? `${c === 'CNY' ? '¥' : c === 'USD' ? '$' : '€'}${Number(n).toLocaleString()}` : '—')
  let OV = null
  const ov = async () => (OV = OV || (await api('/export/overview')))
  const priceText = (m, d) => {
    if (!m) return '—'
    if (!d.amount && !d.mg && !d.share_pct) return '待报价'
    if (m.price === 'mg_share') return `保底 ${cur(d.currency, d.mg)} + ${d.share_pct || 0}%`
    if (m.price === 'share') return `分成 ${d.share_pct || 0}%`
    if (m.price === 'commission') return `佣金 ${d.share_pct || 0}%`
    if (m.price === 'amount_share') return `${cur(d.currency, d.amount)} · 合作方 ${d.share_pct || 0}%`
    return cur(d.currency, d.amount)
  }

  const shell = (tab, inner, hero = true) => `
    ${hero ? `<section class="ex-hero"><div class="ex-hero-bg"></div><div class="wrap">
      <div class="pg-label">发行支持 · 国内与海外 · Global Sales</div>
      <h1>出海与交易中心</h1>
      <p class="lead">把作品卖出去、播出去、钱收回来。8 种交易模式、9 步线上交易流程、发行窗口与回款分账一站完成——每一步留痕，独家权利自动防冲突。</p>
    </div></section>` : ''}
    <nav class="ex-tabs wrap" aria-label="出海板块">${TABS.map(([k, l, i]) => `<a class="${tab === k ? 'on' : ''}" href="#/export${k ? '/' + k : ''}"><i class="fa-solid ${i}"></i>${l}</a>`).join('')}</nav>
    <div class="wrap section ex-body">${inner}</div>`

  const titleCard = (t) => `<a class="ex-title" href="#/export/title/${t.id}">
      <div class="sc-art art-${'abcde'[t.app_id % 5]}"><span class="sc-play"><i class="fa-solid fa-play"></i></span><div class="sc-t">${esc(t.title.replace(/[《》]/g, ''))}</div></div>
      <div class="ex-title-b"><b>${esc(t.title)}</b><div class="xs muted">${esc(t.team)} · ${esc(t.form)}${t.minutes ? ' · ' + t.minutes + ' 分钟' : ''}</div>
        <div class="ex-chips">${t.territories.slice(0, 4).map((x) => `<em><i class="fa-solid fa-location-dot"></i>${esc(x)}</em>`).join('')}</div>
        <div class="ex-chips">${t.modes.slice(0, 4).map((m) => `<em class="m">${esc((OV.modes.find((x) => x.code === m) || {}).name || m)}</em>`).join('')}</div>
        <div class="between xs" style="margin-top:8px"><span class="muted">${esc(t.price_hint || '面议')}</span><span><i class="fa-solid fa-comments gold"></i> ${t.inquiries} 询价</span></div></div></a>`

  const modeCard = (m) => `<article class="ex-mode"><div class="ex-mode-h"><i class="fa-solid ${m.icon}"></i><div><b>${m.name}</b><span>${m.en}</span></div></div>
      <p class="small">${esc(m.how)}</p>
      <dl><dt>适合</dt><dd>${esc(m.fit)}</dd><dt>创作方</dt><dd>${esc(m.creator)}</dd><dt>注意</dt><dd>${esc(m.risk)}</dd></dl></article>`

  const flowList = (o, active = -1) => `<ol class="ex-flow">${o.stages.map((s, i) => { const f = o.stage_info[s]; return `<li class="${i < active ? 'done' : i === active ? 'on' : ''}"><span class="n">${i < active ? '<i class="fa-solid fa-check"></i>' : i + 1}</span><div><b>${s}</b><em>${esc(f.who)}</em><p class="xs muted">${esc(f.do)}</p><span class="xs ex-proof"><i class="fa-solid fa-file-shield"></i>${esc(f.proof)}</span></div></li>` }).join('')}</ol>`

  // ================= 总览 =================
  async function overview(app) {
    const [o, p] = await Promise.all([ov(), api('/program/overview')])
    const e = p.export
    app.innerHTML = shell('', `
      <div class="pg-figs ex-figs">${e.data.map((x) => `<div><b>${x.k}</b><span>${esc(x.v)}</span><a class="xs dim" style="display:block;margin-top:6px" href="${esc(x.url)}" target="_blank" rel="noopener">来源：${esc(x.src)}</a></div>`).join('')}</div>
      <div class="ex-kpis">${[['上架片单', o.stats.titles, 'fa-film'], ['进行中交易', o.stats.deals, 'fa-comments'], ['已签约', o.stats.signed, 'fa-file-signature'], ['发行窗口', o.stats.windows, 'fa-calendar-days']].map(([l, v, i]) => `<div><i class="fa-solid ${i}"></i><b>${v}</b><span>${l}</span></div>`).join('')}</div>

      <div class="pg-head" style="margin-top:34px"><div class="no">01</div><div><h2>8 种交易模式</h2></div><div><p>同一部作品可按地区、媒介拆分，用不同模式多次交易。</p></div></div>
      <div class="ex-mode-mini">${o.modes.map((m) => `<a href="#/export/modes#${m.code}"><i class="fa-solid ${m.icon}"></i><b>${m.name}</b><span>${esc(m.fit)}</span></a>`).join('')}</div>

      <div class="pg-head" style="margin-top:34px"><div class="no">02</div><div><h2>9 步交易流程</h2></div><div><p>询价不锁权，签约才占用权利；上线、收入与回款分开记录。</p></div></div>
      <div class="ex-flow-strip">${o.stages.map((s, i) => `<span><em>${i + 1}</em>${s}</span>`).join('<i class="fa-solid fa-chevron-right"></i>')}</div>
      <a class="pg-link small" href="#/export/flow">查看每一步谁来做、留什么证据 →</a>

      <div class="pg-head" style="margin-top:34px"><div class="no">03</div><div><h2>出海片单</h2></div><div><p>审核上架的作品，认证机构可直接看片、询价。</p></div></div>
      <div class="ex-titles">${o.titles.slice(0, 6).map(titleCard).join('') || '<div class="empty">暂无上架片单</div>'}</div>
      <div class="row" style="margin-top:14px"><a class="btn" href="#/export/titles">全部片单</a>${S.user && S.user.role === 'creator' ? '<a class="btn btn-gold" href="#/export/mine">我要出海上架</a>' : ''}</div>

      <div class="pg-head" style="margin-top:34px"><div class="no">04</div><div><h2>出海服务</h2></div><div><p>签约之后，平台协助完成译配、合规、交付与回款。</p></div></div>
      <div class="ex-services">${e.services.map(([a, b], i) => `<div><span class="no">${String(i + 1).padStart(2, '0')}</span><b>${a}</b><p class="xs muted">${b}</p></div>`).join('')}</div>

      <div class="pg-cta" style="margin-top:30px"><div><div class="pg-label">${S.user && ['institution', 'distributor'].includes(S.user.role) ? '认证机构' : '创作者 / 机构'}</div><b>${S.user && ['institution', 'distributor'].includes(S.user.role) ? '浏览片单，发起询价' : '作品上架出海，或以机构身份采购'}</b></div>
        <a class="btn btn-gold" href="${S.user ? (S.user.role === 'creator' ? '#/export/mine' : '#/export/titles') : '#/login?next=' + encodeURIComponent('#/export/mine')}">${S.user ? '开始' : '登录 / 入驻'}</a></div>
      <p class="xs dim" style="margin-top:12px">${esc(o.note)}</p>`)
  }

  // ================= 交易模式 + 测算 =================
  async function modes(app) {
    const o = await ov()
    app.innerHTML = shell('modes', `
      <div class="ex-modes">${o.modes.map((m) => `<div id="${m.code}">${modeCard(m)}</div>`).join('')}</div>
      <div class="cards c2" style="margin-top:24px;gap:16px">
        <form class="card" id="calc"><b class="h3"><i class="fa-solid fa-calculator gold"></i> 创作方到手测算</b><p class="xs muted" style="margin:4px 0 12px">演示口径，不含税费与汇率差，不构成收益承诺。</p>
          <div class="field"><label>交易模式</label><select class="input" name="mode">${o.modes.map((m) => `<option value="${m.code}">${m.name}</option>`).join('')}</select></div>
          <div class="grid2"><div class="field" data-f="amount"><label>金额（元）</label><input class="input" name="amount" type="number" inputmode="numeric" value="200000"></div>
          <div class="field" data-f="mg"><label>保底 MG（元）</label><input class="input" name="mg" type="number" inputmode="numeric" value="80000"></div>
          <div class="field" data-f="share"><label>比例 %</label><input class="input" name="share_pct" type="number" inputmode="numeric" value="50"></div>
          <div class="field" data-f="gross"><label>预计平台实收（元）</label><input class="input" name="gross" type="number" inputmode="numeric" value="300000"></div>
          <div class="field" data-f="fees"><label>已批准发行费用</label><input class="input" name="fees" type="number" inputmode="numeric" value="20000"></div></div>
        </form>
        <div class="card" id="calc-out"></div>
      </div>
      <div class="card" style="margin-top:16px"><b class="h3">怎么选？</b>
        <div class="table-wrap" style="margin-top:10px"><table class="tbl rwd"><thead><tr><th>你的情况</th><th>推荐模式</th></tr></thead><tbody>
        ${[['成片已完成，想尽快回款', '版权买断 / 授权许可'], ['作品有爆款潜力，愿意赌长尾', '保底 + 分成 / 纯分账'], ['没有海外团队，想多地区同时卖', '代理发行'], ['项目还在开发，缺制作资金', '地区预售 / 联合出品'], ['手里是剧本或 IP', '改编期权'], ['院校毕业作品，先求曝光', '纯分账（短剧 App / YouTube / TikTok）']].map(([a, b]) => `<tr><td data-l="情况">${a}</td><td data-l="推荐" class="gold">${b}</td></tr>`).join('')}
        </tbody></table></div></div>`)
    const f = $('#calc')
    const SHOW = { buyout: ['amount'], license: ['amount'], option: ['amount'], presale: ['amount'], mg: ['mg', 'share', 'gross'], revshare: ['share', 'gross'], agency: ['share', 'gross', 'fees'], coprod: ['amount', 'share', 'gross'] }
    const run = async () => {
      const m = f.mode.value
      $$('[data-f]', f).forEach((x) => (x.style.display = SHOW[m].includes(x.dataset.f) ? '' : 'none'))
      const r = await api('/export/calc', { body: { mode: m, amount: +f.amount.value, mg: +f.mg.value, share_pct: +f.share_pct.value, gross: +f.gross.value, fees: +f.fees.value } })
      $('#calc-out').innerHTML = `<b class="h3">测算结果</b><div class="ex-calc-big"><span class="xs muted">创作方到手（演示）</span><b>¥${r.creator.toLocaleString()}</b></div>
        ${r.steps.map((s) => `<div class="between small" style="padding:8px 0;border-bottom:1px dashed var(--line)"><span>${esc(s.k)}</span><b class="mono ${s.v < 0 ? 'red' : ''}">${s.v < 0 ? '−' : ''}¥${Math.abs(s.v).toLocaleString()}</b></div>`).join('')}
        <p class="xs dim" style="margin-top:10px">${m === 'coprod' ? '联合出品中合作方投入用于制作，不计入创作方到手。' : '实际以合同、平台报表与银行到账为准。'}</p>`
    }
    f.oninput = () => run().catch(errToast)
    run().catch(errToast)
    const h = location.hash.split('#')[2]; if (h) setTimeout(() => { const el = document.getElementById(h); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 50)
  }

  // ================= 交易流程 =================
  async function flow(app) {
    const o = await ov()
    app.innerHTML = shell('flow', `
      ${flowList(o)}
      <div class="cards c3" style="margin-top:22px;gap:12px">
        ${[['fa-lock-open', '询价不锁权', '询价、看片、报价都是非约束意向，不占用权利库存，可同时与多家洽谈。'], ['fa-shield-halved', '签约防一权多售', '签约时自动校验地区 × 媒介 × 独家性；与已签约独家重叠会被阻断并转法务复核。'], ['fa-money-bill-transfer', '上线 ≠ 收入 ≠ 回款', '上线需内容 ID 与证据；回款只认银行凭证号，截图不算实收。']].map(([i, t, p]) => `<div class="pg-box"><i class="fa-solid ${i} gold" style="font-size:22px"></i><h3 style="margin:8px 0 4px">${t}</h3><p class="small muted">${p}</p></div>`).join('')}
      </div>
      <div class="card" style="margin-top:16px"><b class="h3">各方职责</b><div class="table-wrap" style="margin-top:10px"><table class="tbl rwd"><thead><tr><th>角色</th><th>能做什么</th></tr></thead><tbody>
        ${[['创作者（卖方）', '出海上架、同意看片、报价 / 还价 / 接受、提交交付清单、登记回款'], ['认证机构（买方）', '浏览片单、发起询价、报价、签约、验收上线、规划发行窗口'], ['平台运营', '片单审核、协调签约与终止、结项归档、法务复核'], ['财务', '凭银行凭证登记回款、分账审批']].map(([a, b]) => `<tr><td data-l="角色"><b>${a}</b></td><td data-l="职责">${b}</td></tr>`).join('')}
      </tbody></table></div></div>`)
  }

  // ================= 片单 =================
  async function titles(app, q) {
    const o = await ov()
    const reg = q.region || '', mode = q.mode || ''
    const list = o.titles.filter((t) => (!reg || t.territories.includes(reg) || t.territories.includes('全球')) && (!mode || t.modes.includes(mode)))
    app.innerHTML = shell('titles', `
      <div class="sc-units">${['', ...o.regions.slice(1)].map((r) => `<a class="${reg === r ? 'on' : ''}" href="#/export/titles?region=${encodeURIComponent(r)}&mode=${mode}">${r || '全部地区'}</a>`).join('')}</div>
      <div class="sc-units" style="margin-top:8px">${[{ code: '', name: '全部模式' }, ...o.modes].map((m) => `<a class="${mode === m.code ? 'on' : ''}" href="#/export/titles?region=${encodeURIComponent(reg)}&mode=${m.code}">${m.name}</a>`).join('')}</div>
      <div class="ex-titles" style="margin-top:16px">${list.map(titleCard).join('') || '<div class="empty">没有符合条件的片单</div>'}</div>`, false)
  }

  async function titleDetail(app, id) {
    const o = await ov()
    const d = await api('/export/titles/' + id)
    const t = d.title, u = S.user
    const isBuyer = u && ['institution', 'distributor'].includes(u.role)
    app.innerHTML = shell('titles', `
      <a class="xs muted" href="#/export/titles">← 出海片单</a>
      <div class="ex-td">
        <div><div id="ex-video"></div>
          <div class="pg-label" style="margin-top:16px">${esc(t.track)} · ${esc(t.form)}${t.minutes ? ' · ' + t.minutes + ' 分钟' : ''}</div>
          <h1 class="pg-title">${esc(t.title)}</h1><p class="muted small">${esc(t.team)}${t.school ? ' · ' + esc(t.school) : ''}</p>
          <p style="margin:10px 0">${esc(t.logline || '')}</p>
          ${t.highlights ? `<div class="pg-box"><div class="pg-label">卖点</div><p class="small">${esc(t.highlights)}</p></div>` : ''}
          <div class="ex-kv">${[['可售地区', t.territories.join('、')], ['语种', (t.languages || []).join('、') || '—'], ['画幅 / 版本', (t.formats || []).join('、') || '—'], ['价格参考', t.price_hint || '面议'], ['权利说明', t.rights_note || '—']].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
          ${d.sold.length ? `<div class="card" style="margin-top:14px"><b class="h3">已签约权利</b>${d.sold.map((s) => `<div class="xs" style="margin-top:8px"><span class="tag ${s.exclusive ? 'red' : ''}">${s.exclusive ? '独家' : '非独家'}</span> ${esc(s.territories.join('/'))} · ${esc(s.media)} · ${esc((o.modes.find((m) => m.code === s.mode) || {}).name)} · ${sTag(s.stage)}</div>`).join('')}<p class="xs dim" style="margin-top:8px">独家已占用的地区 × 媒介不可再签独家。</p></div>` : ''}
        </div>
        <aside class="card ex-side"><b class="h3">开放的交易模式</b>
          <div class="ex-chips" style="margin:10px 0 14px">${t.modes.map((m) => `<em class="m">${esc((o.modes.find((x) => x.code === m) || {}).name)}</em>`).join('')}</div>
          ${d.is_owner ? `<div class="notice"><i class="fa-solid fa-user-pen"></i><div>这是你的片单（${esc(t.status)}）。询价会出现在「我的交易」。</div></div><a class="btn btn-block" style="margin-top:10px" href="#/export/list/${t.app_id}">编辑上架信息</a>`
            : d.my_deal ? `<a class="btn btn-gold btn-block" href="#/export/deal/${d.my_deal.id}"><i class="fa-solid fa-comments"></i>进入交易室 · ${esc(d.my_deal.stage)}</a>`
            : isBuyer ? `<button class="btn btn-gold btn-block" id="ex-ask"><i class="fa-solid fa-paper-plane"></i>发起询价</button><p class="xs dim" style="margin-top:8px">询价为非约束意向，不锁定权利。</p>`
            : `<a class="btn btn-gold btn-block" href="#/login?next=${encodeURIComponent(location.hash)}">以认证机构身份询价</a><p class="xs dim" style="margin-top:8px">需使用发行机构 / 版权采购账号（演示：dist@demo.cn / demo1234）</p>`}
        </aside>
      </div>`, false)
    if (window.mountWorkVideo) window.mountWorkVideo($('#ex-video'), { code: t.code, id: t.app_id, user_id: -1, title: t.title, logline: t.logline })
    const ask = $('#ex-ask')
    if (ask) ask.onclick = () => modal('发起询价 · ' + esc(t.title), `<form id="aq">
        <div class="field"><label>交易模式</label><div class="ul-cats">${t.modes.map((m, i) => `<label class="ap-chip"><input type="radio" name="mode" value="${m}" ${i ? '' : 'checked'}><span>${esc((o.modes.find((x) => x.code === m) || {}).name)}</span></label>`).join('')}</div></div>
        <div class="field"><label>意向地区<em>*</em></label><div class="ul-cats">${(t.territories.includes('全球') ? o.regions : t.territories).map((r) => `<label class="ap-chip"><input type="checkbox" name="territories" value="${r}"><span>${r}</span></label>`).join('')}</div></div>
        <div class="grid2"><div class="field"><label>媒介</label><select class="input" name="media">${o.media.map((m) => `<option>${m}</option>`).join('')}</select></div>
          <div class="field"><label>期限（月）</label><input class="input" name="term_months" type="number" inputmode="numeric" value="24"></div></div>
        <div class="grid2"><div class="field"><label>语种需求</label><input class="input" name="languages" placeholder="如：英文字幕"></div><div class="field"><label>币种</label><select class="input" name="currency"><option>CNY</option><option>USD</option><option>EUR</option></select></div></div>
        <label class="check"><input type="checkbox" name="exclusive"> 申请独家</label>
        <div class="field" style="margin-top:10px"><label>留言</label><textarea class="input" name="message" rows="2" placeholder="平台、上线计划、预算区间…"></textarea></div>
        <button class="btn btn-gold btn-block">提交询价</button></form>`, (m) => {
      $('#aq', m).onsubmit = async (e) => {
        e.preventDefault(); const f = e.target
        const body = { title_id: t.id, mode: f.mode.value, territories: $$('[name=territories]:checked', f).map((x) => x.value), media: f.media.value, term_months: +f.term_months.value, languages: f.languages.value, currency: f.currency.value, exclusive: f.exclusive.checked, message: f.message.value }
        try { const r = await api('/export/deals', { body }); closeModal(); OV = null; toast(r.note, 'ok'); location.hash = '#/export/deal/' + r.id } catch (er) { errToast(er) }
      }
    })
  }

  // ================= 发行 =================
  async function release(app) {
    const o = await ov()
    const groups = [...new Set(o.channels.map((c) => c.type))]
    app.innerHTML = shell('release', `
      <div class="pg-head"><div class="no">R1</div><div><h2>发行路径</h2></div><div><p>签约后进入发行履约，平台按步骤协助并记录证据。</p></div></div>
      <ol class="ex-pipe">${[['fa-language', '译配本地化', 'AI 字幕 + 配音，母语人工审校；英 / 西 / 葡 / 印尼 / 泰 / 阿语等'], ['fa-scale-balanced', '合规与分级', '生成合成内容标识、肖像与音乐权利链核验、目标国分级预审'], ['fa-box-archive', '母版交付', '按渠道规格交付母版、字幕、M&E 音轨、元数据与权利文件'], ['fa-calendar-days', '窗口排期', '按地区 × 渠道 × 期限规划发行窗口，避免窗口冲突'], ['fa-tower-broadcast', '上线确认', '回填渠道内容 ID 与上线证据，作品页同步「已出海」'], ['fa-coins', '报表回款', '导入平台报表、币种折算、银行凭证核验实收'], ['fa-chart-pie', '分账结算', '按合同瀑布顺序分账：佣金 → 费用回收 → 投资回收 → 分成'], ['fa-rotate', '续约下架', '窗口到期续约、权利回归或下架处置']].map(([i, t, p], k) => `<li><span class="n">${k + 1}</span><i class="fa-solid ${i}"></i><div><b>${t}</b><p class="xs muted">${p}</p></div></li>`).join('')}</ol>

      <div class="pg-head" style="margin-top:34px"><div class="no">R2</div><div><h2>标准交付清单</h2></div><div><p>交易室「交付」阶段按此清单逐项勾选，至少 4 项。</p></div></div>
      <div class="ex-deliver">${['母版（ProRes / H.264 高码率）', '多语种字幕（SRT）', '音轨分离（对白 / 音乐音效 M&E）', '海报与剧照', '元数据（简介 / 分级 / 演职员）', '权利链与授权文件', 'AI 生成合成内容标识说明'].map((x) => `<div><i class="fa-regular fa-square-check"></i>${x}</div>`).join('')}</div>

      <div class="pg-head" style="margin-top:34px"><div class="no">R3</div><div><h2>渠道矩阵</h2></div><div><p>渠道为对接方向，「候选」表示尚未签约或接入。</p></div></div>
      ${groups.map((g) => `<h3 class="h3" style="margin:16px 0 8px"><i class="fa-solid fa-tower-broadcast gold"></i> ${esc(g)}</h3><div class="ex-ch">${o.channels.filter((c) => c.type === g).map((c) => `<div><b>${esc(c.name)}</b><span class="xs muted">${esc(c.region)} · ${esc(c.model)}</span><span class="tag ${String(c.biz_status).startsWith('候选') ? '' : 'green'}">${esc(c.biz_status)}</span></div>`).join('')}</div>`).join('')}

      <div class="pg-head" style="margin-top:34px"><div class="no">R4</div><div><h2>回款与分账</h2></div><div><p>渠道报告毛额 ≠ 实收；只有银行到账才进入分账。</p></div></div>
      <div class="ex-water">${[['渠道报告毛额', '平台报表'], ['− 渠道费用', '已由平台扣除，不二次扣'], ['= 实际到账', '凭银行凭证'], ['− 发行 / 代理佣金', '按合同比例与上限'], ['− 已批准宣发费用', '迭影宣发扶持部分不回收'], ['− 投资回收', '联合出品 / 预售'], ['= 创作方分成', '按合同比例']].map(([a, b], i) => `<div class="${i === 2 || i === 6 ? 'em' : ''}"><b>${a}</b><span class="xs muted">${b}</span></div>`).join('')}</div>
      <div class="row" style="margin-top:14px"><a class="btn" href="#/distribution?tab=waterfall"><i class="fa-solid fa-calculator"></i>分账瀑布计算器</a><a class="btn" href="#/distribution?tab=delivery">母版与交付规范</a></div>`)
  }

  // ================= 我的交易 / 上架 =================
  async function mine(app) {
    if (!S.user) return needLogin(app, '登录后查看我的交易与出海上架')
    const [o, d] = await Promise.all([ov(), api('/export/mine')])
    const modeName = (c) => (o.modes.find((m) => m.code === c) || {}).name || c
    app.innerHTML = shell('mine', `
      ${S.user.role === 'creator' ? `<div class="pg-head"><div class="no">A</div><div><h2>我的出海片单</h2></div><div><p>作品有已上线视频即可上架，运营审核后进入出海片单。</p></div></div>
        <div class="ex-mine-apps">${d.apps.map((a) => { const t = d.titles.find((x) => x.app_id === a.id); return `<div class="ex-mine-app"><div><b>${esc(a.title)}</b><div class="xs muted">${t ? `片单 ${statusTag(t.status)}${t.reject_reason ? ' <span class="red">' + esc(t.reject_reason) + '</span>' : ''}` : a.live ? '可上架' : '需先上传视频并通过审核'}</div></div>${a.live ? `<a class="btn btn-sm ${t ? '' : 'btn-gold'}" href="#/export/list/${a.id}">${t ? '编辑' : '出海上架'}</a>` : `<a class="btn btn-sm" href="#/me">上传视频</a>`}</div>` }).join('') || '<div class="empty">还没有报名作品 <a class="gold" href="#/apply">去报名</a></div>'}</div>` : ''}
      <div class="pg-head" style="margin-top:${S.user.role === 'creator' ? 30 : 0}px"><div class="no">B</div><div><h2>我的交易</h2></div><div><p>${d.deals.length} 笔 · 点击进入交易室</p></div></div>
      <div class="ex-deals">${d.deals.map((x) => `<a class="ex-deal" href="#/export/deal/${x.id}"><div class="between"><b>${esc(x.title)}</b>${sTag(x.stage)}</div>
        <div class="xs muted">${x.side === 'buyer' ? '我是买方 · 卖方 ' + esc(x.seller) : '我是卖方 · 买方 ' + esc(x.buyer_org || x.buyer)} · ${esc(x.code)}</div>
        <div class="ex-chips"><em class="m">${modeName(x.mode)}</em>${x.territories.map((r) => `<em>${esc(r)}</em>`).join('')}</div>
        <div class="ex-mini-prog">${o.stages.map((s, i) => `<i class="${i <= o.stages.indexOf(x.stage) ? 'on' : ''}"></i>`).join('')}</div></a>`).join('') || `<div class="empty">暂无交易${['institution', 'distributor'].includes(S.user.role) ? '，<a class="gold" href="#/export/titles">去片单询价</a>' : ''}</div>`}</div>`)
  }

  async function listForm(app, appId) {
    if (!S.user) return needLogin(app)
    const o = await ov()
    const d = await api('/export/mine')
    const a = d.apps.find((x) => x.id === appId)
    if (!a) { app.innerHTML = shell('mine', '<div class="empty">作品不存在或无权限</div>', false); return }
    const t = d.titles.find((x) => x.app_id === appId) || {}
    let full = {}
    if (t.id) try { full = (await api('/export/titles/' + t.id)).title } catch {}
    const has = (arr, v) => (arr || []).includes(v)
    app.innerHTML = shell('mine', `<a class="xs muted" href="#/export/mine">← 我的交易</a>
      <h1 class="pg-title" style="font-size:clamp(22px,4vw,30px);margin-top:10px">出海上架 · ${esc(a.title)}</h1>
      <form id="lf" class="card" style="margin-top:14px">
        <div class="field"><label>可接受的交易模式<em>*</em></label><div class="ex-pick">${o.modes.map((m) => `<label class="ap-chip"><input type="checkbox" name="modes" value="${m.code}" ${has(full.modes, m.code) ? 'checked' : ''}><span><i class="fa-solid ${m.icon}"></i> ${m.name}</span></label>`).join('')}</div></div>
        <div class="field"><label>可售地区<em>*</em></label><div class="ex-pick">${o.regions.map((r) => `<label class="ap-chip"><input type="checkbox" name="territories" value="${r}" ${has(full.territories, r) ? 'checked' : ''}><span>${r}</span></label>`).join('')}</div></div>
        <div class="field"><label>已有 / 可制作语种</label><div class="ex-pick">${['中文', '英文字幕', '英文配音', '日文字幕', '韩文字幕', '西语字幕', '印尼语字幕', '泰语字幕', '阿语字幕'].map((r) => `<label class="ap-chip"><input type="checkbox" name="languages" value="${r}" ${has(full.languages, r) ? 'checked' : ''}><span>${r}</span></label>`).join('')}</div></div>
        <div class="field"><label>画幅 / 版本</label><div class="ex-pick">${['横屏 16:9', '竖屏 9:16', '竖屏切条 9:16', '剧集分集版', '电影节版'].map((r) => `<label class="ap-chip"><input type="checkbox" name="formats" value="${r}" ${has(full.formats, r) ? 'checked' : ''}><span>${r}</span></label>`).join('')}</div></div>
        <div class="field"><label>价格参考</label><input class="input" name="price_hint" value="${esc(full.price_hint || '')}" placeholder="如：授权费 5—30 万元 / 地区，或面议"></div>
        <div class="field"><label>卖点（给买方看）</label><textarea class="input" name="highlights" rows="2" placeholder="题材、风格、目标观众、已有数据">${esc(full.highlights || '')}</textarea></div>
        <div class="field"><label>权利说明</label><textarea class="input" name="rights_note" rows="2" placeholder="原创 / 改编、音乐与肖像授权、已售出权利">${esc(full.rights_note || '')}</textarea></div>
        <label class="check"><input type="checkbox" name="rights_confirm"> 我确认拥有上述地区的发行权利，且未与第三方签署冲突的独家协议</label>
        <button class="btn btn-gold btn-block" style="margin-top:12px">提交审核</button></form>`, false)
    $('#lf').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target
      const pick = (n) => $$(`[name=${n}]:checked`, f).map((x) => x.value)
      try { await api('/export/titles', { body: { app_id: appId, modes: pick('modes'), territories: pick('territories'), languages: pick('languages'), formats: pick('formats'), price_hint: f.price_hint.value, highlights: f.highlights.value, rights_note: f.rights_note.value, rights_confirm: f.rights_confirm.checked } }); OV = null; toast('已提交，运营审核后上架', 'ok'); location.hash = '#/export/mine' } catch (er) { errToast(er) }
    }
  }

  // ================= 交易室 =================
  async function dealRoom(app, id) {
    if (!S.user) return needLogin(app)
    const d = await api('/export/deals/' + id)
    const x = d.deal, m = d.mode, side = d.side
    const si = d.stages.indexOf(x.stage)
    const SIDE = { buyer: '买方', seller: '卖方', operator: '运营', finance: '财务' }
    const acts = []
    const A = (k, l, cls = '') => acts.push(`<button class="btn ${cls}" data-act="${k}">${l}</button>`)
    if (x.stage === '询价' && side === 'seller') A('allow_screen', '<i class="fa-solid fa-eye"></i>同意看片', 'btn-gold')
    if (x.stage === '看片' && side === 'buyer') A('offer', '<i class="fa-solid fa-tag"></i>报价', 'btn-gold')
    if (x.stage === '报价' && ['buyer', 'seller'].includes(side)) { if (x.message !== side) A('accept', '<i class="fa-solid fa-check"></i>接受报价', 'btn-gold'); A('counter', '<i class="fa-solid fa-arrows-rotate"></i>还价') }
    if (x.stage === '条款' && ['buyer', 'seller', 'operator'].includes(side)) A('sign', '<i class="fa-solid fa-file-signature"></i>上传合同签约', 'btn-gold')
    if (x.stage === '签约' && side === 'seller') A('deliver', '<i class="fa-solid fa-box"></i>提交交付', 'btn-gold')
    if (x.stage === '交付' && ['buyer', 'operator'].includes(side)) A('golive', '<i class="fa-solid fa-tower-broadcast"></i>验收并上线', 'btn-gold')
    if (['上线', '回款'].includes(x.stage) && ['finance', 'operator', 'seller'].includes(side)) A('receipt', '<i class="fa-solid fa-building-columns"></i>登记回款', 'btn-gold')
    if (x.stage === '回款' && side === 'operator') A('close', '<i class="fa-solid fa-flag-checkered"></i>结项')
    if (['签约', '交付', '上线', '回款'].includes(x.stage) && ['buyer', 'operator'].includes(side)) A('window', '<i class="fa-solid fa-calendar-plus"></i>规划发行窗口')
    if (!['完结', '已终止'].includes(x.stage) && (side === 'operator' || !['签约', '交付', '上线', '回款'].includes(x.stage))) A('terminate', '终止', 'btn-ghost')
    const waiting = !acts.filter((a) => !a.includes('terminate') && !a.includes('window')).length && !['完结', '已终止'].includes(x.stage)
    app.innerHTML = shell('mine', `<a class="xs muted" href="#/export/mine">← 我的交易</a>
      <div class="ex-room-h"><div><div class="pg-label">交易室 · ${esc(x.code)} · 我是${SIDE[side]}</div><h1 class="pg-title" style="font-size:clamp(22px,4vw,32px)">${esc(x.title)}</h1>
        <div class="ex-chips"><em class="m"><i class="fa-solid ${m.icon}"></i>${m.name}</em>${x.territories.map((r) => `<em>${esc(r)}</em>`).join('')}<em>${esc(x.media)}</em><em>${x.exclusive ? '独家' : '非独家'}</em><em>${x.term_months} 个月</em></div></div>${sTag(x.stage)}</div>
      ${x.stage === '已终止' ? `<div class="notice" style="border-color:var(--red)"><i class="fa-solid fa-ban red"></i><div>交易已终止：${esc(x.close_reason || '')}</div></div>` : `<div class="ex-room-prog">${d.stages.map((s, i) => `<span class="${i < si ? 'done' : i === si ? 'on' : ''}"><i>${i < si ? '✓' : i + 1}</i>${s}</span>`).join('')}</div>
        <div class="ex-now"><b>当前：${esc(x.stage)}</b> · ${esc(d.stage_info[x.stage]?.who || '')}：${esc(d.stage_info[x.stage]?.do || '')}</div>`}
      <div class="ex-room">
        <div>
          <div class="ex-kv">${[['当前报价', priceText(m, x)], ['币种', x.currency], ['买方', (x.buyer_org || '') + ' ' + x.buyer], ['卖方', x.seller], ['语种', x.languages || '—'], ['已回款', cur(x.currency, x.received)]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
          ${x.contract_hash ? `<div class="xs mono dim" style="margin-top:8px;word-break:break-all"><i class="fa-solid fa-file-contract"></i> 合同校验值 ${esc(x.contract_hash)}</div>` : ''}
          ${x.delivery ? `<div class="card" style="margin-top:12px"><b class="small">交付清单</b>${x.delivery.items.map((i) => `<div class="xs" style="margin-top:4px"><i class="fa-solid fa-check green"></i> ${esc(i)}</div>`).join('')}</div>` : ''}
          ${x.content_id ? `<div class="card" style="margin-top:12px"><b class="small">上线信息</b><div class="xs" style="margin-top:4px">内容 ID：<b class="mono">${esc(x.content_id)}</b></div><div class="xs muted">${esc(x.live_evidence || '')}</div></div>` : ''}
          ${d.releases.length ? `<div class="card" style="margin-top:12px"><b class="small">发行窗口</b>${d.releases.map((r) => `<div class="ex-win"><span>${esc(r.region)}</span><b>${esc(r.channel)}</b><span class="mono xs">${esc(r.window_start)} ~ ${esc(r.window_end)}</span>${statusTag(r.status)}</div>`).join('')}</div>` : ''}
          ${d.estimate.creator > 0 ? `<div class="card" style="margin-top:12px"><b class="small">创作方到手测算（演示）</b><div class="ex-calc-big"><b>¥${d.estimate.creator.toLocaleString()}</b></div>${d.estimate.steps.map((s) => `<div class="between xs" style="padding:4px 0"><span>${esc(s.k)}</span><span class="mono">${s.v < 0 ? '−' : ''}¥${Math.abs(s.v).toLocaleString()}</span></div>`).join('')}</div>` : ''}
        </div>
        <div><b class="h3">交易记录</b><ol class="ex-log">${d.events.slice().reverse().map((e) => `<li><span class="ex-dot"></span><div><b class="small">${esc(e.action)}</b> <span class="xs muted">${esc(e.actor)} · ${esc(String(e.created_at).slice(5, 16))}</span><p class="xs">${esc(e.detail || '')}</p></div></li>`).join('')}</ol></div>
      </div>
      <div class="ex-actbar">${waiting ? `<span class="xs muted"><i class="fa-regular fa-clock"></i> 等待${esc(d.stage_info[x.stage]?.who || '对方')}操作</span>` : ''}${acts.join('')}</div>`, false)
    document.body.classList.add('ex-room-mode')
    const post = async (body, ok) => { try { await api(`/export/deals/${x.id}/act`, { body }); closeModal(); OV = null; toast(ok, 'ok'); router() } catch (er) { errToast(er) } }
    $$('[data-act]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.act
      if (k === 'allow_screen') return post({ action: k, days: 14 }, '已授权 14 天水印看片')
      if (k === 'accept') return confirm('接受当前报价并进入条款确认？') && post({ action: k }, '已接受报价')
      if (k === 'offer' || k === 'counter') return modal(k === 'offer' ? '报价' : '还价', `<form id="of"><p class="xs muted" style="margin-bottom:10px">${esc(m.name)}：${esc(m.how)}</p>
          ${['amount', 'amount_share'].includes(m.price) ? `<div class="field"><label>金额（${x.currency}）</label><input class="input" name="amount" type="number" inputmode="numeric" value="${x.amount || ''}"></div>` : ''}
          ${m.price === 'mg_share' ? `<div class="field"><label>保底 MG（${x.currency}）</label><input class="input" name="mg" type="number" inputmode="numeric" value="${x.mg || ''}"></div>` : ''}
          ${['mg_share', 'share', 'commission', 'amount_share'].includes(m.price) ? `<div class="field"><label>${m.price === 'commission' ? '代理佣金' : m.price === 'amount_share' ? '合作方收益占比' : '创作方分成'} %</label><input class="input" name="share_pct" type="number" inputmode="numeric" value="${x.share_pct || ''}"></div>` : ''}
          <div class="field"><label>备注</label><input class="input" name="note" placeholder="如：含英文字幕制作、分 2 期付款"></div><button class="btn btn-gold btn-block">提交</button></form>`, (mm) => {
        $('#of', mm).onsubmit = (e) => { e.preventDefault(); const f = e.target; post({ action: k, amount: f.amount ? +f.amount.value : 0, mg: f.mg ? +f.mg.value : 0, share_pct: f.share_pct ? +f.share_pct.value : 0, note: f.note.value }, k === 'offer' ? '报价已发送' : '还价已发送') }
      })
      if (k === 'sign') return modal('签约', `<form id="sg"><div class="notice" style="margin-bottom:10px"><i class="fa-solid fa-shield-halved"></i><div>系统将计算合同 SHA-256 校验值，并校验与已签约交易的独家地区 / 媒介是否重叠；重叠将阻断签约并转法务复核。</div></div>
          <div class="field"><label>合同文本 / 关键条款<em>*</em></label><textarea class="input" name="t" rows="5" placeholder="粘贴合同全文或关键条款（地区、媒介、期限、价格、交付、结算）"></textarea></div><button class="btn btn-gold btn-block">确认签约</button></form>`, (mm) => {
        $('#sg', mm).onsubmit = (e) => { e.preventDefault(); post({ action: k, contract_text: e.target.t.value }, '签约生效，权利已占用') }
      })
      if (k === 'deliver') return modal('提交交付', `<form id="dl"><p class="xs muted" style="margin-bottom:8px">勾选已交付的物料（至少 4 项）</p>${['母版（ProRes / H.264 高码率）', '多语种字幕（SRT）', '音轨分离（对白 / 音乐音效 M&E）', '海报与剧照', '元数据（简介 / 分级 / 演职员）', '权利链与授权文件', 'AI 生成合成内容标识说明'].map((i, n) => `<label class="check"><input type="checkbox" value="${i}" ${n < 5 ? 'checked' : ''}> ${i}</label>`).join('')}<button class="btn btn-gold btn-block" style="margin-top:10px">提交交付</button></form>`, (mm) => {
        $('#dl', mm).onsubmit = (e) => { e.preventDefault(); post({ action: k, items: $$('input:checked', mm).map((i) => i.value) }, '交付已提交，等待买方验收') }
      })
      if (k === 'golive') return modal('验收并上线', `<form id="gl"><div class="field"><label>渠道内容 ID<em>*</em></label><input class="input" name="cid" placeholder="平台后台的内容 / 剧集 ID"></div><div class="field"><label>上线证据<em>*</em></label><input class="input" name="ev" placeholder="上线链接或截图说明"></div><button class="btn btn-gold btn-block">确认上线</button></form>`, (mm) => {
        $('#gl', mm).onsubmit = (e) => { e.preventDefault(); post({ action: k, content_id: e.target.cid.value, evidence: e.target.ev.value }, '已上线') }
      })
      if (k === 'receipt') return modal('登记回款', `<form id="rc"><div class="field"><label>银行回款凭证号<em>*</em></label><input class="input" name="ref" placeholder="付款截图不能认定实收"></div><div class="field"><label>到账金额（${x.currency}）<em>*</em></label><input class="input" name="amt" type="number" inputmode="numeric"></div><button class="btn btn-gold btn-block">登记</button></form>`, (mm) => {
        $('#rc', mm).onsubmit = (e) => { e.preventDefault(); post({ action: k, bank_ref: e.target.ref.value, amount: +e.target.amt.value }, '回款已登记') }
      })
      if (k === 'close') return post({ action: k }, '交易已结项')
      if (k === 'terminate') return modal('终止交易', `<form id="tm"><div class="field"><label>终止原因<em>*</em></label><textarea class="input" name="r" rows="2"></textarea></div><button class="btn btn-red btn-block">确认终止</button></form>`, (mm) => {
        $('#tm', mm).onsubmit = (e) => { e.preventDefault(); post({ action: k, reason: e.target.r.value }, '交易已终止') }
      })
      if (k === 'window') return modal('规划发行窗口', `<form id="wn"><div class="field"><label>地区</label><select class="input" name="region">${x.territories.map((r) => `<option>${r}</option>`).join('')}</select></div><div class="field"><label>渠道</label><input class="input" name="channel" placeholder="如：TikTok 短剧账号 / FAST 频道"></div><div class="field"><label>语种</label><input class="input" name="language"></div><div class="grid2"><div class="field"><label>开始</label><input class="input" type="date" name="s"></div><div class="field"><label>结束</label><input class="input" type="date" name="e"></div></div><button class="btn btn-gold btn-block">保存</button></form>`, (mm) => {
        $('#wn', mm).onsubmit = async (e) => { e.preventDefault(); const f = e.target; try { await api(`/export/deals/${x.id}/releases`, { body: { region: f.region.value, channel: f.channel.value, language: f.language.value, window_start: f.s.value, window_end: f.e.value } }); closeModal(); toast('发行窗口已保存', 'ok'); router() } catch (er) { errToast(er) } }
      })
    }))
  }

  window.addEventListener('hashchange', () => document.body.classList.remove('ex-room-mode'))

  R.export = async (app, p, q = {}) => {
    const k = p[0] || ''
    if (k === 'modes') return modes(app)
    if (k === 'flow') return flow(app)
    if (k === 'titles') return titles(app, q)
    if (k === 'title') return titleDetail(app, +p[1])
    if (k === 'release') return release(app)
    if (k === 'mine') return mine(app)
    if (k === 'deal') return dealRoom(app, +p[1])
    if (k === 'list') return listForm(app, +p[1])
    return overview(app)
  }

  // 后台：出海交易
  window.admExport = async (el) => {
    const d = await api('/admin/export')
    const mx = Math.max(1, d.funnel[0].n)
    const modeName = (c) => (d.modes.find((m) => m.code === c) || {}).name || c
    el.innerHTML = `<div class="adm-head"><div><div class="pg-label">管理后台 · Admin</div><h1 class="h2">出海交易</h1><p class="xs muted" style="margin-top:4px">片单审核 · 交易漏斗 · 签约 / 结项协调</p></div></div>
      <div class="card"><b class="h3">交易漏斗</b><div class="adm-funnel">${d.funnel.map((f) => `<div><span class="xs">${f.s}</span><div class="adm-fbar"><i style="width:${Math.max(4, (f.n / mx) * 100)}%"></i></div><b class="mono small">${f.n}</b></div>`).join('')}</div></div>
      <h3 class="h3" style="margin:20px 0 10px">片单审核</h3>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>地区</th><th>模式</th><th>状态</th><th>操作</th></tr></thead><tbody>${d.titles.map((t) => `<tr><td data-l="作品"><b class="small">${esc(t.title)}</b><div class="xs dim">${esc(t.team)}</div></td><td data-l="地区" class="xs">${esc(t.territories.join('、'))}</td><td data-l="模式" class="xs">${t.modes.map(modeName).join('、')}</td><td data-l="状态">${statusTag(t.status)}</td>
        <td data-l="操作"><div class="row" style="gap:6px;justify-content:flex-end">${t.status !== '已上架' ? `<button class="btn btn-sm btn-gold" data-ta="approve" data-id="${t.id}">上架</button>` : `<button class="btn btn-sm" data-ta="offline" data-id="${t.id}">下架</button>`}${t.status === '审核中' ? `<button class="btn btn-sm" data-ta="reject" data-id="${t.id}">驳回</button>` : ''}<a class="btn btn-sm btn-ghost" href="#/export/title/${t.id}">查看</a></div></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">暂无片单</div></td></tr>'}</tbody></table></div>
      <h3 class="h3" style="margin:20px 0 10px">全部交易</h3>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>交易</th><th>模式</th><th>地区</th><th>报价</th><th>回款</th><th>阶段</th><th></th></tr></thead><tbody>${d.deals.map((x) => `<tr><td data-l="交易"><b class="small">${esc(x.title)}</b><div class="xs dim">${esc(x.code)} · ${esc(x.buyer_org || x.buyer)}</div></td><td data-l="模式" class="small">${modeName(x.mode)}${x.exclusive ? ' <span class="tag red">独家</span>' : ''}</td><td data-l="地区" class="xs">${esc(x.territories.join('/'))}</td><td data-l="报价" class="mono small">${priceText(d.modes.find((m) => m.code === x.mode), x)}</td><td data-l="回款" class="mono small">${cur(x.currency, x.received)}</td><td data-l="阶段">${sTag(x.stage)}</td><td data-l=""><a class="btn btn-sm" href="#/export/deal/${x.id}">交易室</a></td></tr>`).join('')}</tbody></table></div>`
    $$('[data-ta]', el).forEach((b) => (b.onclick = async () => {
      let reason = ''
      if (b.dataset.ta === 'reject') { reason = prompt('驳回原因'); if (!reason) return }
      try { await api(`/admin/export/titles/${b.dataset.id}/decide`, { body: { action: b.dataset.ta, reason } }); OV = null; toast('已处理', 'ok'); router() } catch (e) { errToast(e) }
    }))
  }
})()
