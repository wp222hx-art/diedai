/* 光年计划 · 5000万元 Seedance 影视算力共享 */
(function () {
  const R = window.ROUTES
  const tok = (n) => {
    n = Number(n) || 0
    if (n >= 1e8) return (n / 1e8).toFixed(n >= 1e9 ? 1 : 2).replace(/\.?0+$/, '') + ' 亿'
    if (n >= 1e4) return (n / 1e4).toFixed(n >= 1e6 ? 0 : 1).replace(/\.0$/, '') + ' 万'
    return n.toLocaleString()
  }
  const yuanOf = (std) => Math.round((std / 1e6) * 46)
  const secOf720 = (std) => Math.round(std / 21600) // 720p 每秒 21,600 tokens（2.0 刊例口径）
  window.lyTok = tok
  const TIER_NO = { 星火: 'I', 星耀: 'II', 星河: 'III', 光年: 'IV' }
  const TIER_EN = { 星火: 'ONBOARD', 星耀: 'SELECTED', 星河: 'INCUBATION', 光年: 'CO-DEVELOPMENT' }
  const PAL = ['#c9a45c', '#9c8355', '#7d7768', '#56534d', '#3a3835']
  const head = (no, title, note = '', extra = '') => `<div class="pg-head"><div class="no">${no}</div><div><h2>${title}</h2></div><div>${note ? `<p>${note}</p>` : ''}${extra}</div></div>`

  // ---------- 首页：计划海报（One-sheet） ----------
  window.lightyearPoster = (ov) => {
    const p = ov.pool, pct = Math.min(100, (p.granted / p.std) * 100)
    return `<section class="pg-sec" id="lightyear-poster"><div class="wrap"><div class="pg-onesheet">
      <a class="pg-sheet" href="#/lightyear" aria-label="光年计划">
        <div class="pg-sheet-top"><span>迭代盛典 × 捷成世纪</span><span>2026</span></div>
        <div class="pg-sheet-mid"><div class="pg-label">光年计划 · AI 影视算力扶持</div><div class="pg-num">5,000<small>万元</small></div><div class="pg-sheet-title">Seedance 生成算力 免费共享</div></div>
        <div class="pg-billing"><b>迭代影交汇</b> 联合 <b>捷成世纪</b> 发起 · 模型 <b>SEEDANCE 2.0 / 2.5</b><br>适用 入驻项目 · 入选项目 · 孵化签约项目 · 盛典获奖作品<br>额度以光年预测核定 · 按里程碑释放 · 不可提现或转让</div>
      </a>
      <div class="pg-copy">
        <div class="pg-label">Programme Notice · 计划公告</div>
        <h2>为入驻与入选项目提供<br>免费的 AI 影视生成算力</h2>
        <p>迭代影交汇联合捷成世纪，拟投入价值 <b class="gold">5,000 万元</b> 的 Seedance 2.0 / 2.5 视频生成算力。凡在平台建档的项目均可领取基础额度；入选、签约项目依据「光年预测」核定定向额度，最高覆盖预测用量的 100%。按基准口径测算，总池约可支撑 <b style="color:var(--text)">${p.ref_projects.toLocaleString()} 部</b> 60 分钟 720p AI 剧集的生成用量。</p>
        <table class="pg-table compact" style="margin:18px 0 6px"><tbody>${ov.tiers.map((t) => `<tr><td class="n">${TIER_NO[t.code]}</td><td class="t"><b>${t.name}</b></td><td class="c small muted">${esc(t.cond)}</td><td class="r small">${esc(t.give.split('，')[0].replace('星火礼包 · ', ''))}</td></tr>`).join('')}</tbody></table>
        <div class="between xs" style="margin-top:14px"><span class="muted">已发放</span><span class="mono">${tok(p.granted)} / ${tok(p.std)} 标准Token</span></div><div class="bar" style="margin-top:6px"><i style="width:${Math.max(pct, 1)}%"></i></div>
        <div class="row" style="margin-top:22px"><a class="btn btn-gold" href="#/lightyear">查看计划与申领</a><a class="btn" href="#/lightyear/predict">算力与周期预测</a></div>
      </div></div></div></section>`
  }

  // ---------- 计划主页 ----------
  R.lightyear = async (app, p) => {
    if (p[0] === 'predict') return predictPage(app)
    if (p[0] === 'wallet') return walletPage(app)
    const ov = await api('/lightyear/overview')
    const pool = ov.pool
    const total = ov.buckets.reduce((a, b) => a + b.amount_yuan, 0)
    app.innerHTML = `
    <section class="pg-hero"><div class="wrap">
      <div class="pg-label">迭代盛典 × 捷成世纪 · Seedance 2.0 / 2.5</div>
      <h1>光年计划<br><span>5,000 万元</span> AI 影视算力扶持</h1>
      <p class="lead">面向平台全部有项目的创作者与团队：建档即可领取基础额度，入选与签约项目按可解释的预测模型核定定向额度，随制作里程碑分批释放。</p>
      <div class="row"><a class="btn btn-gold" href="${S.user ? '#/lightyear/wallet' : '#/login?mode=register&next=' + encodeURIComponent('#/lightyear/wallet')}">${S.user ? '我的算力账户' : '入驻并申领'}</a><a class="btn" href="#/lightyear/predict">算力与周期预测</a></div>
    </div></section>

    <section class="wrap" style="margin-top:28px"><div class="pg-figs">
      ${[[tok(pool.std), '标准Token 总额度'], [tok(pool.granted), '已发放'], [ov.stats.creators, '已获额度创作者'], [pool.ref_projects.toLocaleString() + ' 部', '可支撑 60 分钟 720p 剧集']].map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}
    </div><p class="xs dim" style="margin-top:8px">标准Token：按 Seedance 2.0 刊例 ¥46 / 百万 tokens 折算的统一计量单位。</p></section>

    <section class="section"><div class="wrap">
      ${head('01', '额度档位', '额度与项目进度绑定：入选按预测用量覆盖，签约随 M1—M4 里程碑分批释放。算力不可提现、转售或跨项目转移。')}
      <div class="table-wrap" style="border:0"><table class="pg-table"><thead><tr><th>档</th><th>名称</th><th>适用条件</th><th>额度规则</th><th style="text-align:right">资金池</th></tr></thead><tbody>
        ${ov.tiers.map((t) => `<tr><td class="n">${TIER_NO[t.code]}</td><td class="t"><b>${t.name}</b><small>${TIER_EN[t.code]}</small></td><td class="c">${esc(t.cond)}</td><td class="c">${esc(t.give)}</td><td class="r xs muted">${esc((ov.buckets.find((b) => b.code === t.bucket) || {}).name || '')}</td></tr>`).join('')}
      </tbody></table></div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap"><div class="cards split" style="gap:40px">
      <div>${head('02', '基础额度 · 入驻任务', '“有项目”是共享门槛。完成以下事项即可在算力账户中领取。')}
        ${ov.tasks.map((t, i) => `<div class="pg-task"><span class="n">${String(i + 1).padStart(2, '0')}</span><div style="min-width:0"><b class="small">${esc(t.name)}</b><div class="xs dim">${esc(t.desc)}</div></div><span class="mono small">+${tok(t.tokens)}</span><span></span></div>`).join('')}
        <div class="pg-task"><span class="n">+</span><div><b class="small">盛典荣誉加成</b><div class="xs dim">迭代盛典每个有效奖项</div></div><span class="mono small">+${tok(ov.honor_bonus)}</span><span></span></div>
        <p class="xs muted" style="margin-top:12px">基础任务合计最高 3,000 万标准Token，约合 720p 视频 ${Math.round(30000000 / 21600).toLocaleString()} 秒。</p>
      </div>
      <div>${head('03', '资金池分配', '')}
        <div class="pg-alloc">${ov.buckets.map((b, i) => `<i style="width:${(b.amount_yuan / total) * 100}%;background:${PAL[i]}"></i>`).join('')}</div>
        <table class="pg-table compact"><tbody>${ov.buckets.map((b, i) => `<tr><td class="t" style="width:auto"><span class="pg-sw" style="background:${PAL[i]}"></span><b class="small" style="font-family:var(--sans)">${esc(b.name)}</b><div class="xs dim" style="margin-top:2px">${esc(b.intro)}</div></td><td class="r small">${(b.amount_yuan / 1e4).toLocaleString()} 万元<div class="xs dim">已发 ${((b.granted / b.std_tokens) * 100).toFixed(1)}%</div></td></tr>`).join('')}</tbody></table>
      </div>
    </div></div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      ${head('04', '测算方法 · LY-1.0', '算力用量可预测、可复核。定向额度以此公式的基准场景为依据。', '<a class="pg-link small" href="#/lightyear/predict">打开预测工具 →</a>')}
      <div class="pg-formula">
        <div class="main">T = Σ<sub>j</sub> E<sub>j</sub> × M<sub>j</sub> × O × (1+i) × W·H·24/1024 × (1+8%)</div>
        <div class="sub"><span>M<sub>j</sub> = k ÷ q<sub>j</sub> × (1 + r)</span><span>q<sub>j</sub> = 1 − (1 − p<sub>j</sub>)<sup>k</sup></span><span>p<sub>j</sub> = p₀<sub>j</sub> × 风格 × 团队 × 模型</span></div>
      </div>
      <div class="pg-defs">${[['E', '有效成片秒数', '片长 × AI 覆盖率 × 镜头类占比'], ['M', '迭代倍率', '每采用 1 秒平均需生成的秒数'], ['O / i', '时长开销 / 参考输入', '2.0 单段 ≤15s，2.5 单段 ≤30s'], ['W·H·24/1024', '每秒 Token', '720p = 21,600；1080p = 48,600']].map(([a, b, c]) => `<div><b>${a}</b><div class="small" style="margin-top:4px">${b}</div><div class="xs dim">${c}</div></div>`).join('')}</div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap"><div class="cards c2" style="gap:40px">
      <div>${head('05', '模型与刊例', '')}
        <table class="pg-table compact"><thead><tr><th>模型</th><th>适用</th><th style="text-align:right">¥ / 百万 tokens</th></tr></thead><tbody>${Object.entries(ov.models).map(([k, m]) => `<tr><td class="t"><b class="small" style="font-family:var(--sans)">${m.name}</b><small>单段 ≤${m.maxClip} 秒</small></td><td class="c xs muted">${k === '2.5' ? '长叙事、多镜头组织，适合动作、特效、群像与连续长镜头' : '音视频联合生成、性价比高，适合对白文戏、空镜与批量量产'}</td><td class="r small">${m.price}<div class="xs dim">含视频输入 ${m.priceVideoIn}</div></td></tr>`).join('')}</tbody></table>
        <p class="xs dim" style="margin-top:10px">来源：火山引擎公开定价及媒体报道，详见「学院与资源 · 行业洞察」。</p></div>
      <div>${head('06', '发放记录', '')}
        <table class="pg-table compact"><tbody>${ov.feed.map((f) => `<tr><td class="n" style="width:40px">${TIER_NO[f.tier] || '—'}</td><td class="c small">${esc(f.name)}<div class="xs dim">${esc(f.note)}</div></td><td class="r small">+${tok(f.tokens)}</td></tr>`).join('') || '<tr><td class="muted small">暂无</td></tr>'}</tbody></table></div>
    </div>
    <div class="notice" style="margin-top:28px"><i class="fa-solid fa-circle-info"></i><div>${esc(ov.note)} 免费算力不代表获奖、获投或发行承诺；生成内容须遵守权利与生成合成标识规范，素材未经授权不得用于模型训练。</div></div>
    </div></section>`
  }

  // ---------- 光年预测器 ----------
  async function predictPage(app) {
    const ov = await api('/lightyear/overview')
    let assets = []
    if (S.user && S.user.role === 'creator') { try { assets = (await api('/lightyear/me')).assets } catch {} }
    const sel = (name, obj, val) => `<select class="input" name="${name}">${Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(v.label || v.name || v)}</option>`).join('')}</select>`
    app.innerHTML = `<section class="pg-hero sm"><div class="wrap"><div class="pg-label">光年计划 · Forecast LY-1.0</div><h1 style="font-size:clamp(28px,4.4vw,44px)">算力与制作周期预测</h1><p class="lead" style="margin:8px 0 0">输入片长、风格、镜头构成与模型策略，测算 Token 用量、刊例成本、制作周期及计划可覆盖额度。</p></div></section>
    <div class="wrap section" style="padding-top:26px"><div class="cards split ly-pred">
      <form id="pred-form" class="card">
        ${assets.length ? `<div class="field"><label>关联作品（用于申请定向额度）</label><select class="input" name="asset_id"><option value="">不关联</option>${assets.map((a) => `<option value="${a.id}">《${esc(a.title)}》</option>`).join('')}</select></div>` : ''}
        <div class="grid2"><div class="field"><label>内容形态</label>${sel('form', ov.forms, 'series')}</div><div class="field"><label>视觉风格</label>${sel('style', ov.styles, 'oriental')}</div></div>
        <div class="field"><label>成片总时长 <b class="gold mono" id="v-min">60</b> 分钟</label><input type="range" name="minutes" min="5" max="180" step="5" value="60" class="ly-range"></div>
        <div class="field"><label>AI 生成覆盖率 <b class="gold mono" id="v-cov">90</b>%</label><input type="range" name="coverage" min="10" max="100" step="5" value="90" class="ly-range"></div>
        <div class="field"><label>模型策略</label><div class="ly-seg" data-name="model">${[['2.0', 'Seedance 2.0'], ['mix', '智能混合'], ['2.5', 'Seedance 2.5']].map(([v, l]) => `<button type="button" data-v="${v}" class="${v === 'mix' ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="field"><label>输出分辨率</label><div class="ly-seg" data-name="resolution">${['480p', '720p', '1080p'].map((v) => `<button type="button" data-v="${v}" class="${v === '720p' ? 'on' : ''}">${v}</button>`).join('')}</div></div>
        <div class="field"><label>镜头构成（%）</label>${Object.entries(ov.shots).map(([k, s]) => `<div class="ly-mix"><span>${s.label}</span><input type="range" name="mix_${k}" min="0" max="100" step="5" value="${{ dialog: 45, action: 15, vfx: 10, crowd: 5, ambient: 25 }[k]}" class="ly-range"><b class="mono" data-mv="${k}"></b></div>`).join('')}</div>
        <div class="grid3"><div class="field"><label>团队经验</label>${sel('experience', ov.exp, 'skilled')}</div><div class="field"><label>每轮候选 k</label><select class="input" name="k">${[1, 2, 3, 4].map((n) => `<option ${n === 2 ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="field"><label>生成操作员</label><input class="input" type="number" name="operators" value="3" min="1" max="50"></div></div>
        <div class="field"><label>参考视频输入比例 <b class="gold mono" id="v-ref">0</b>%</label><input type="range" name="refRatio" min="0" max="100" step="10" value="0" class="ly-range"><span class="hint">使用参考视频/续写时按“含视频输入”价计费，且输入秒数计入Token</span></div>
        <button class="btn btn-gold btn-block">保存预测结果</button>
      </form>
      <div id="pred-out"><div class="card muted small">正在测算…</div></div>
    </div></div>`
    const form = $('#pred-form')
    $$('.ly-seg button', form).forEach((b) => (b.onclick = () => { $$('button', b.parentNode).forEach((x) => x.classList.remove('on')); b.classList.add('on'); run() }))
    let timer
    const sync = () => { $('#v-min').textContent = form.minutes.value; $('#v-cov').textContent = form.coverage.value; $('#v-ref').textContent = form.refRatio.value; const t = Object.keys(ov.shots).reduce((a, k) => a + +form['mix_' + k].value, 0) || 1; Object.keys(ov.shots).forEach((k) => ($(`[data-mv="${k}"]`).textContent = Math.round((form['mix_' + k].value / t) * 100) + '%')) }
    form.oninput = () => { sync(); clearTimeout(timer); timer = setTimeout(() => run(false), 350) }
    form.onchange = form.oninput
    form.onsubmit = (e) => { e.preventDefault(); run(true) }
    sync(); run(false)
    async function run(save) {
      const segv = (n) => $(`.ly-seg[data-name="${n}"] .on`, form).dataset.v
      const body = { form: form.form.value, style: form.style.value, minutes: +form.minutes.value, coverage: +form.coverage.value, model: segv('model'), resolution: segv('resolution'), experience: form.experience.value, k: +form.k.value, operators: +form.operators.value, refRatio: form.refRatio.value / 100, mix: Object.fromEntries(Object.keys(ov.shots).map((k) => [k, +form['mix_' + k].value])), asset_id: form.asset_id ? +form.asset_id.value || null : null }
      const tk = S.token; if (!save) S.token = '' // 实时预览不入库
      let d; try { d = await api('/lightyear/predict', { body }) } catch (e) { S.token = tk; return errToast(e) }
      S.token = tk
      if (save && S.user) { try { d = await api('/lightyear/predict', { body }) } catch {} }
      renderResult(d, ov, save, body)
    }
  }
  function renderResult(d, ov, saved, body) {
    const maxW = d.totalWeeks
    $('#pred-out').innerHTML = `<div class="stack">
      <div class="card"><div class="pg-result-top"><div class="pg-label">基准场景 · 标准Token</div><div class="pg-num">${tok(d.base.std)}</div>
        <div class="small muted">刊例约 <b style="color:var(--text)">${money(d.base.cost)}</b> · 生成视频 ${Math.round(d.base.genSec / 60).toLocaleString()} 分钟 · 迭代倍率 ${d.base.multiplier}×</div></div>
        <table class="pg-table compact" style="margin-top:14px"><thead><tr><th>场景</th><th style="text-align:right">标准Token</th><th style="text-align:right">刊例成本</th></tr></thead><tbody>${[['low', '乐观'], ['base', '基准'], ['high', '保守']].map(([k, l]) => `<tr><td class="c small" ${k === 'base' ? 'style="color:var(--gold2)"' : ''}>${l}</td><td class="r small">${tok(d[k].std)}</td><td class="r small">${money(d[k].cost)}</td></tr>`).join('')}</tbody></table></div>
      <div class="card"><div class="between"><b>制作周期</b><span class="mono small">${d.totalWeeks} 周 · 约 ${(d.totalWeeks / 4.3).toFixed(1)} 个月</span></div>
        <div class="ly-gantt">${(() => { let acc = 0; return d.phases.map((p, i) => { const s = (acc / maxW) * 100; acc += p.weeks; return `<div class="ly-g-row"><div><b class="small">${p.name}</b><div class="xs dim">${esc(p.sub)}</div></div><div class="ly-g-track"><i style="left:${s}%;width:${Math.max(3, (p.weeks / maxW) * 100)}%;background:${i % 2 ? '#8c8577' : 'var(--gold)'}"></i></div><span class="mono xs">${p.weeks} 周</span></div>` }).join('') })()}</div>
        <div class="xs dim">约 ${d.calls.toLocaleString()} 次生成调用 · 操作工时约 ${d.opHours.toLocaleString()} 小时（每次含提示词、参考准备与审片约 3.5 分钟）</div></div>
      <div class="card"><b>计划可覆盖额度</b>
        <table class="pg-table compact" style="margin-top:8px"><thead><tr><th>档</th><th>名称</th><th style="text-align:right">覆盖</th><th style="text-align:right">额度</th></tr></thead><tbody>${d.tiers.map((t) => `<tr><td class="n">${TIER_NO[t.code]}</td><td class="c small">${t.name}</td><td class="r small">${t.coverage}%</td><td class="r small">${tok(t.std)}<div class="xs dim">≈ ${money(t.yuan)}</div></td></tr>`).join('')}</tbody></table>
        <div class="xs muted" style="margin-top:10px">另：基础任务额度最高 3,000 万标准Token，所有建档项目可领。${saved && d.prediction_id ? `<span class="green">预测已保存 #${d.prediction_id}，可在算力账户中据此申请定向额度。</span>` : S.user ? '点击“保存预测结果”后可用于申请。' : '<a class="pg-link" href="#/login?mode=register">登录</a>后可保存预测并申请。'}</div></div>
      <div class="card"><b>风格与策略建议</b>${d.tips.map((t) => `<p class="small muted" style="margin-top:8px">— ${esc(t)}</p>`).join('')}</div>
      <details class="card"><summary class="small" style="cursor:pointer">分镜头类测算明细与公式</summary>
        <p class="mono xs" style="margin:10px 0;line-height:1.8">${esc(d.formula)}<br>每秒Token（${esc(d.input.resolution)}）= ${d.tokPerSec.toLocaleString()}</p>
        <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>镜头类</th><th>模型</th><th>有效秒</th><th>p</th><th>q</th><th>M</th><th>生成秒</th><th>Tokens</th></tr></thead><tbody>${d.base.lines.map((l) => `<tr><td data-l="镜头类">${l.shot}</td><td data-l="模型">${l.model}</td><td data-l="有效秒" class="mono">${l.effSec}</td><td data-l="p" class="mono">${l.p}</td><td data-l="q" class="mono">${l.q}</td><td data-l="M" class="mono">${l.M}</td><td data-l="生成秒" class="mono">${l.genSec.toLocaleString()}</td><td data-l="Tokens" class="mono">${tok(l.tokens)}</td></tr>`).join('')}</tbody></table></div>
        <p class="xs dim" style="margin-top:8px">${esc(d.disclaimer)}</p></details>
    </div>`
  }

  // ---------- 我的算力钱包 ----------
  async function walletPage(app) {
    if (!S.user) return needLogin(app, '登录后查看你的光年算力钱包')
    if (S.user.role !== 'creator') {
      if (['operator', 'finance', 'admin'].includes(S.user.role)) return adminPage(app)
      app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-circle-info"></i>算力额度面向创作者 / 团队发放。<div style="margin-top:12px"><a class="btn btn-sm" href="#/lightyear">返回活动页</a></div></div></div>`; return
    }
    const d = await api('/lightyear/me')
    const b = d.balance
    app.innerHTML = `<div class="wrap section" style="padding-top:28px">
      <div class="pg-wallet">
        <div class="between"><div><div class="pg-label">光年计划 · 算力账户</div><div class="row" style="margin-top:8px"><span class="pg-level">${TIER_NO[d.level] || ''} ${esc(d.level)}</span><span class="small muted">${esc(S.user.name)}</span></div></div><a class="btn btn-sm" href="#/lightyear/predict">算力预测</a></div>
        <div class="pg-num">${tok(b.available)}</div><div class="xs muted" style="margin-bottom:16px">可用标准Token</div>
        <div class="pg-kv" style="grid-template-columns:repeat(4,1fr)"><div><b>${tok(b.granted)}</b><span>累计获得</span></div><div><b>${tok(b.used)}</b><span>已消耗</span></div><div><b>${Math.floor(secOf720(b.available) / 60).toLocaleString()} 分钟</b><span>≈ 720p 可生成</span></div><div><b>${money(yuanOf(b.available))}</b><span>≈ 刊例价值</span></div></div>
      </div>
      <div class="cards split" style="margin-top:18px">
        <div class="stack">
          <div class="card"><div class="between"><b class="h3">基础额度任务</b><span class="xs dim">“有项目”即可共享</span></div>
            ${d.tasks.map((t, i) => `<div class="pg-task ${t.claimed ? 'done' : ''}"><span class="n">${String(i + 1).padStart(2, '0')}</span><div style="min-width:0"><b class="small">${esc(t.name)}</b><div class="xs dim">${esc(t.desc)}</div></div><span class="mono xs">+${tok(t.tokens)}</span>
              ${t.claimed ? '<span class="tag green"><i class="fa-solid fa-check"></i>已领</span>' : t.locked && t.code !== 'asset' ? '<span class="tag"><i class="fa-solid fa-lock"></i>需先建档</span>' : t.done ? `<button class="btn btn-sm btn-gold ly-claim" data-c="${t.code}">领取</button>` : `<a class="btn btn-sm" href="${{ asset: '#/workbench/assets?go=asset', predict: '#/lightyear/predict', entry: '#/workbench/entries?go=entry', listing: '#/workbench/listings?go=listing', event: '#/events' }[t.code] || '#/'}">去完成</a>`}</div>`).join('')}
            ${d.honors.map((h) => `<div class="pg-task ${h.claimed ? 'done' : ''}"><span class="n">+</span><div style="min-width:0"><b class="small">荣誉加成</b><div class="xs dim">《${esc(h.title)}》${esc(h.award)}</div></div><span class="mono xs">+${tok(h.tokens)}</span>${h.claimed ? '<span class="tag green">已领</span>' : `<button class="btn btn-sm btn-gold ly-claim" data-c="${h.code}">领取</button>`}</div>`).join('')}
          </div>
          <div class="card"><b class="h3">申请定向额度（星耀 / 星河 / 光年）</b><p class="xs muted" style="margin:4px 0 12px">额度 = 光年预测基准用量 × 覆盖比例（封顶），需运营审批；星河/光年按里程碑分批释放。</p>
            ${d.assets.length ? d.assets.map((a) => `<div class="ly-apply"><div style="flex:1;min-width:0"><b class="small">《${esc(a.title)}》</b><div class="xs dim">${esc(a.form)} · ${a.total_minutes}分钟 · ${a.last_prediction ? `最近预测 ${tok(a.last_prediction.std_tokens)}` : '<span class="red">尚未预测</span>'}</div><div class="row" style="margin-top:6px">${['星耀', '星河', '光年'].map((t) => `<span class="tag ${a.eligible.includes(t) ? 'gold' : ''}">${a.eligible.includes(t) ? '✓' : '✗'} ${t}</span>`).join('')}</div></div>
              <div class="row">${!a.last_prediction ? `<a class="btn btn-sm" href="#/lightyear/predict">去预测</a>` : a.eligible.map((t) => `<button class="btn btn-sm btn-gold ly-apply-btn" data-a="${a.id}" data-t="${t}" data-p="${a.last_prediction.id}">申请${t}</button>`).join('') || '<span class="xs dim">入选/签约后解锁</span>'}</div></div>`).join('') : '<div class="empty" style="padding:20px">先建立作品档案</div>'}
          </div>
        </div>
        <div class="stack">
          <div class="card"><b class="h3">登记一次生成</b><p class="xs muted" style="margin:4px 0 12px">实际调用 Seedance 时按 Token 实时扣减（对接供应商 API 后自动回调）。</p>
            <form id="use-form"><div class="grid2"><div class="field"><label>模型</label><select class="input" name="model"><option value="2.0">Seedance 2.0（≤15秒）</option><option value="2.5">Seedance 2.5（≤30秒）</option></select></div><div class="field"><label>分辨率</label><select class="input" name="resolution"><option>480p</option><option selected>720p</option><option>1080p</option></select></div><div class="field"><label>输出秒数</label><input class="input" type="number" name="seconds" value="10" min="1" max="30"></div><div class="field"><label>参考视频输入秒</label><input class="input" type="number" name="input_seconds" value="0" min="0"></div></div>
            <div class="field"><label>关联作品</label><select class="input" name="asset_id"><option value="">不关联</option>${d.assets.map((a) => `<option value="${a.id}">《${esc(a.title)}》</option>`).join('')}</select></div>
            <div class="xs muted mono" id="use-preview" style="margin-bottom:10px"></div><button class="btn btn-gold btn-block">确认生成并扣减</button></form></div>
          <div class="card"><b class="h3">算力流水</b>
            ${[...d.grants.map((g) => ({ t: g.created_at, txt: g.note, amt: g.tokens, st: g.status, plus: true, tier: g.tier })), ...d.usage.map((u) => ({ t: u.created_at, txt: `Seedance ${u.model} · ${u.resolution} · ${u.seconds}s ${u.note || ''}`, amt: u.std_tokens, st: '已消耗', plus: false }))].sort((a, b) => (a.t < b.t ? 1 : -1)).map((x) => `<div class="ly-flow"><div style="flex:1;min-width:0"><div class="small">${esc(x.txt)}</div><div class="xs dim">${esc(String(x.t).slice(0, 16))} ${x.tier ? '· ' + esc(x.tier) : ''}</div></div><div style="text-align:right"><b class="mono ${x.plus ? (x.st === '待审批' ? 'dim' : 'green') : 'red'}">${x.plus ? '+' : '−'}${tok(x.amt)}</b><div>${statusTag(x.st)}</div></div></div>`).join('') || '<p class="xs muted">暂无</p>'}
          </div>
        </div>
      </div></div>`
    $$('.ly-claim').forEach((btn) => (btn.onclick = async () => {
      try { const r = await api('/lightyear/claim', { body: { code: btn.dataset.c } }); toast(`已领取 ${tok(r.tokens)} 标准Token`, 'ok'); router() } catch (e) { errToast(e) }
    }))
    $$('.ly-apply-btn').forEach((btn) => (btn.onclick = async () => {
      if (!confirm(`以最近一次光年预测为基础申请「${btn.dataset.t}」定向额度？`)) return
      try { const r = await api('/lightyear/apply', { body: { asset_id: +btn.dataset.a, tier: btn.dataset.t, prediction_id: +btn.dataset.p } }); toast(`已提交申请：${tok(r.tokens)} 标准Token · ${r.note}`, 'ok'); router() } catch (e) { errToast(e) }
    }))
    const uf = $('#use-form')
    const prev = () => { const tps = { '480p': 854 * 480 * 24 / 1024, '720p': 21600, '1080p': 48600 }[uf.resolution.value]; const raw = ((+uf.seconds.value || 0) + (+uf.input_seconds.value || 0)) * tps; const price = +uf.input_seconds.value > 0 ? (uf.model.value === '2.5' ? 42 : 28) : (uf.model.value === '2.5' ? 70 : 46); $('#use-preview').textContent = `预计消耗 ${tok(Math.round(raw * price / 46))} 标准Token（原始 ${tok(Math.round(raw))} tokens）` }
    uf.oninput = prev; prev()
    uf.onsubmit = async (e) => { e.preventDefault(); const f = bindForm(uf); try { const r = await api('/lightyear/usage', { body: { ...f, seconds: +f.seconds, input_seconds: +f.input_seconds, asset_id: +f.asset_id || null, request_id: 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) } }); toast(`已扣减 ${tok(r.std)} 标准Token`, 'ok'); router() } catch (er) { errToast(er) } }
  }
  // ---------- 运营：额度审批 ----------
  async function adminPage(app) {
    const d = await api('/lightyear/admin')
    app.innerHTML = `<div class="wrap section" style="padding-top:28px"><div class="pg-label">光年计划 · 运营</div><h2 class="h2">额度审批与资金池</h2>
      <div class="cards c3" style="margin:18px 0">${d.buckets.map((b, i) => `<div class="card"><div class="between"><b class="small">${esc(b.name)}</b><span class="xs mono">${(b.amount_yuan / 1e4).toLocaleString()}万元</span></div><div class="mono" style="margin-top:6px">${tok(b.granted)} / ${tok(b.std_tokens)}</div><div class="bar" style="height:6px;margin-top:6px"><i style="width:${Math.max(1, (b.granted / b.std_tokens) * 100)}%;background:${PAL[i]}"></i></div></div>`).join('')}</div>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>创作者</th><th>说明</th><th>星阶/池</th><th>额度</th><th>状态</th><th>操作</th></tr></thead><tbody>${d.grants.map((g) => `<tr><td data-l="创作者">${esc(g.name)}</td><td data-l="说明" class="full small">${esc(g.note)}</td><td data-l="星阶">${esc(g.tier)} · <span class="xs dim">${esc(g.bucket)}</span></td><td data-l="额度" class="mono">${tok(g.tokens)}</td><td data-l="状态">${statusTag(g.status)}</td><td data-l="操作">${g.status === '待审批' ? `<div class="row"><button class="btn btn-sm btn-gold" data-g="${g.id}" data-a="approve">批准</button><button class="btn btn-sm" data-g="${g.id}" data-a="reject">拒绝</button></div>` : '—'}</td></tr>`).join('')}</tbody></table></div></div>`
    $$('[data-g]').forEach((b) => (b.onclick = async () => { const body = { action: b.dataset.a }; if (b.dataset.a === 'reject') { body.reason = prompt('拒绝原因'); if (!body.reason) return } try { await api(`/lightyear/grants/${b.dataset.g}/decide`, { body }); toast('已处理', 'ok'); router() } catch (e) { errToast(e) } }))
  }
})()
