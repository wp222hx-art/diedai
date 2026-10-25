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
  const TIER_STYLE = { 星火: ['#e6a23c', 'fa-fire'], 星耀: ['#f0cf86', 'fa-star'], 星河: ['#5fc8d6', 'fa-water'], 光年: ['#c3adf5', 'fa-meteor'] }

  // ---------- 首页海报区块（被 pages.js 首页调用） ----------
  window.lightyearPoster = (ov) => {
    const p = ov.pool, pct = Math.min(100, (p.granted / p.std) * 100)
    return `<section class="ly-poster-sec" id="lightyear-poster"><div class="wrap"><div class="ly-poster">
      <div class="ly-poster-art"><img src="/static/img/lightyear-poster.jpg" alt="光年计划海报：放映机光束射向银河" loading="lazy">
        <div class="ly-poster-overlay">
          <div class="ly-poster-top"><span class="ly-chip">迭代盛典 × 捷成世纪</span><span class="ly-chip ghost">SEEDANCE 2.0 · 2.5</span></div>
          <div class="ly-poster-bottom">
            <div class="ly-poster-kicker">光年计划 · LIGHT-YEAR PROGRAM</div>
            <div class="ly-poster-big"><span class="ly-num">5000</span><span class="ly-unit">万元</span></div>
            <div class="ly-poster-title">影视 AI 生成算力 · 免费共享</div>
            <div class="ly-poster-sub">入驻即点亮 · 入选即加速 · 签约即护航</div>
          </div>
        </div><div class="ly-shine"></div></div>
      <div class="ly-poster-copy">
        <div class="eyebrow">LIGHT-YEAR PROGRAM</div>
        <h2 class="h2" style="font-size:clamp(26px,3.6vw,40px)">每一个好故事<br>都值得一束<span class="ly-grad">光年级</span>的算力</h2>
        <p class="muted" style="margin:14px 0 18px">迭代影交汇联合捷成世纪，拟投入价值 <b class="gold">5,000 万元</b> 的 Seedance 2.0 / 2.5 影视生成算力。所有入驻且有项目的创作者共享普惠礼包；入选与签约项目按「光年预测」核定定向额度，最高覆盖 100% 生成用量。按光年公式基准测算，约可支撑 <b class="gold">${p.ref_projects.toLocaleString()} 部</b> 60 分钟 720p AI 剧集的全部生成用量。</p>
        <div class="ly-mini-tiers">${ov.tiers.map((t) => `<div class="ly-mini" style="--c:${TIER_STYLE[t.code][0]}"><i class="fa-solid ${TIER_STYLE[t.code][1]}"></i><b>${t.name}</b><span>${esc(t.give.split('，')[0])}</span></div>`).join('')}</div>
        <div class="ly-meter"><div class="between xs"><span class="muted">已点亮</span><span class="mono gold">${tok(p.granted)} / ${tok(p.std)} 标准Token</span></div><div class="bar" style="margin-top:6px"><i style="width:${Math.max(pct, 1.5)}%"></i></div></div>
        <div class="row" style="margin-top:18px"><a class="btn btn-gold" href="#/lightyear"><i class="fa-solid fa-meteor"></i>领取免费算力</a><a class="btn" href="#/lightyear/predict"><i class="fa-solid fa-wand-magic-sparkles"></i>光年预测</a></div>
      </div></div></div></section>`
  }

  // ---------- 活动主页 ----------
  R.lightyear = async (app, p) => {
    if (p[0] === 'predict') return predictPage(app)
    if (p[0] === 'wallet') return walletPage(app)
    const ov = await api('/lightyear/overview')
    const pool = ov.pool
    app.innerHTML = `
    <section class="ly-hero"><div class="ly-hero-bg"></div><div class="ly-stars"></div><div class="wrap">
      <div class="ly-hero-copy">
        <div class="row" style="margin-bottom:16px"><span class="ly-chip">迭代盛典 × 捷成世纪</span><span class="ly-chip ghost">Seedance 2.0 · Seedance 2.5</span></div>
        <div class="ly-kicker">光年计划 · LIGHT-YEAR PROGRAM</div>
        <h1 class="ly-h1"><span class="ly-count" data-to="50000000">0</span><small>元</small></h1>
        <p class="ly-h1-sub">影视 AI 生成算力 · 向每一个有项目的人免费共享</p>
        <p class="lead" style="margin:14px 0 24px">把算力当作创作者的「光」：入驻即点亮星火，入选即升为星耀，签约即驶入星河与光年。用一套可解释的「光年公式」预测你的片子需要多少算力、多长周期，然后——免费去拍。</p>
        <div class="row"><a class="btn btn-gold" href="${S.user ? '#/lightyear/wallet' : '#/login?mode=register&next=' + encodeURIComponent('#/lightyear/wallet')}"><i class="fa-solid fa-fire"></i>${S.user ? '进入我的算力钱包' : '立即入驻 · 点亮星火'}</a><a class="btn" href="#/lightyear/predict"><i class="fa-solid fa-wand-magic-sparkles"></i>光年预测器</a></div>
      </div></div></section>

    <section class="wrap" style="margin-top:-46px;position:relative;z-index:5">
      <div class="ly-dash">
        ${[[tok(pool.std), '标准Token总池', 'fa-database'], [tok(pool.granted), '已点亮发放', 'fa-bolt'], [ov.stats.creators, '获得算力的创作者', 'fa-user-astronaut'], [pool.ref_projects.toLocaleString() + ' 部', '可支撑60分钟AI剧集', 'fa-film']].map(([n, l, i]) => `<div><i class="fa-solid ${i}"></i><b>${n}</b><span>${l}</span></div>`).join('')}
      </div>
    </section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">FOUR STARS</div><h2 class="h2">四级星阶 · 从星火到光年</h2></div><p class="muted small" style="max-width:440px">额度与项目进度绑定：入选按预测用量覆盖，签约随 M1—M4 里程碑分批释放。算力不可提现、转售或跨项目转移。</p></div>
      <div class="ly-tiers">${ov.tiers.map((t, i) => `<div class="ly-tier" style="--c:${TIER_STYLE[t.code][0]}"><div class="ly-tier-no">0${i + 1}</div><div class="ly-tier-ico"><i class="fa-solid ${TIER_STYLE[t.code][1]}"></i></div><div class="ly-tier-en">${t.en}</div><h3>${t.name}</h3><div class="ly-tier-cond"><i class="fa-solid fa-key"></i> ${esc(t.cond)}</div><p>${esc(t.give)}</p></div>`).join('')}</div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap"><div class="cards split">
      <div class="card"><div class="eyebrow">SPARK MISSIONS</div><h3 class="h2" style="font-size:24px">星火任务 · 入驻即领</h3><p class="xs muted" style="margin:4px 0 14px">完成任务即可领取，所有任务合计最高 <b class="gold">3,000 万</b> 标准Token（约可生成 720p 视频 ${Math.round(30000000 / 21600)} 秒）。“有项目”是共享门槛。</p>
        ${ov.tasks.map((t) => `<div class="ly-task"><i class="fa-solid ${t.icon}"></i><div style="flex:1;min-width:0"><b class="small">${esc(t.name)}</b><div class="xs dim">${esc(t.desc)}</div></div><span class="mono gold">+${tok(t.tokens)}</span></div>`).join('')}
        <div class="ly-task" style="border-color:rgba(240,207,134,.4)"><i class="fa-solid fa-award"></i><div style="flex:1"><b class="small">盛典荣誉加成</b><div class="xs dim">迭代盛典每个有效奖项</div></div><span class="mono gold">+${tok(ov.honor_bonus)}</span></div>
        <a class="btn btn-gold btn-block" style="margin-top:14px" href="${S.user ? '#/lightyear/wallet' : '#/login?mode=register'}">去领取</a></div>
      <div class="card"><div class="eyebrow">POOL ALLOCATION</div><h3 class="h2" style="font-size:24px">5000万元 · 五池分配</h3>
        <div class="ly-donut-wrap">${donut(ov.buckets)}</div>
        ${ov.buckets.map((b, i) => `<div class="ly-bucket"><span class="dot" style="background:${PAL[i]}"></span><div style="flex:1;min-width:0"><div class="between small"><b>${esc(b.name)}</b><span class="mono">${(b.amount_yuan / 1e4).toLocaleString()}万元</span></div><div class="xs dim">${esc(b.intro)}</div><div class="bar" style="height:5px;margin-top:6px"><i style="width:${Math.max(1, (b.granted / b.std_tokens) * 100)}%;background:${PAL[i]}"></i></div></div></div>`).join('')}
      </div></div></div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="ly-formula-card">
        <div class="eyebrow">LIGHT-YEAR FORMULA · LY-1.0</div><h2 class="h2" style="font-size:26px">光年公式：算力是可以被预测的</h2>
        <div class="ly-formula">
          <div class="ly-f-main">T = Σ<sub>j</sub> E<sub>j</sub> × M<sub>j</sub> × O × (1+i) × <span class="gold">W·H·24/1024</span> × (1+8%)</div>
          <div class="ly-f-row"><span>M<sub>j</sub> = k ÷ q<sub>j</sub> × (1 + r)</span><span>q<sub>j</sub> = 1 − (1 − p<sub>j</sub>)<sup>k</sup></span><span>p<sub>j</sub> = p₀<sub>j</sub> × 风格 × 团队 × 模型</span></div>
        </div>
        <div class="cards c4 m2" style="margin-top:16px">${[['E', '有效成片秒数', '片长 × AI 覆盖率 × 镜头类占比'], ['M', '迭代倍率', '每采用 1 秒平均要生成多少秒'], ['O / i', '时长开销 / 参考输入', '2.0 单段≤15s，2.5 单段≤30s'], ['W·H·24/1024', '每秒Token', '720p=21,600；1080p=48,600']].map(([a, b, c]) => `<div class="ly-var"><b class="mono gold">${a}</b><div class="small">${b}</div><div class="xs dim">${c}</div></div>`).join('')}</div>
        <a class="btn btn-gold" style="margin-top:18px" href="#/lightyear/predict"><i class="fa-solid fa-wand-magic-sparkles"></i>用光年公式预测我的片子</a>
      </div></div></section>

    <section class="section" style="padding-top:0"><div class="wrap"><div class="cards c2">
      <div class="card"><div class="eyebrow">LIVE FEED</div><h3 class="h3" style="margin:4px 0 12px">实时点亮</h3><div class="ly-feed">${ov.feed.map((f) => `<div class="ly-feed-item"><span class="tag" style="border-color:${(TIER_STYLE[f.tier] || ['#888'])[0]};color:${(TIER_STYLE[f.tier] || ['#ccc'])[0]}">${esc(f.tier)}</span><span class="small" style="flex:1;min-width:0">${esc(f.name)} · ${esc(f.note)}</span><b class="mono gold xs">+${tok(f.tokens)}</b></div>`).join('')}</div></div>
      <div class="card"><div class="eyebrow">MODELS</div><h3 class="h3" style="margin:4px 0 12px">双模型算力 · 按场景调度</h3>
        ${Object.entries(ov.models).map(([k, m]) => `<div class="ly-model"><div class="between"><b>${m.name}</b><span class="tag ${k === '2.5' ? 'violet' : 'cyan'}">单段≤${m.maxClip}秒</span></div><div class="xs muted" style="margin-top:4px">${k === '2.5' ? '30秒长叙事、多镜头逻辑组织、最多30图/10视频/10音频参考——适合动作、特效、群像与连续长镜头' : '多模态音视频联合生成、性价比高——适合对白文戏、空镜与大批量量产'}</div><div class="xs dim mono" style="margin-top:4px">刊例 ¥${m.price}/百万tokens（含视频输入 ¥${m.priceVideoIn}）</div></div>`).join('')}
        <p class="xs dim" style="margin-top:10px">价格来源：火山引擎公开定价及媒体报道，见「学院与资源 · 行业洞察」。</p></div>
    </div>
    <div class="notice" style="margin-top:16px"><i class="fa-solid fa-circle-info"></i><div>${esc(ov.note)} 免费算力不代表获奖、获投或发行承诺；生成内容须遵守权利与生成合成标识规范，素材未经授权不得用于模型训练。</div></div>
    </div></section>`
    // 计数动画
    const el = $('.ly-count'); if (el) { const to = +el.dataset.to, t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(step) }; requestAnimationFrame(step) }
  }
  const PAL = ['#e6a23c', '#f0cf86', '#5fc8d6', '#c3adf5', '#e04a4f']
  function donut(buckets) {
    const total = buckets.reduce((a, b) => a + b.amount_yuan, 0); let acc = 0
    const segs = buckets.map((b, i) => { const s = (acc / total) * 100; acc += b.amount_yuan; return `${PAL[i]} ${s}% ${(acc / total) * 100}%` }).join(',')
    return `<div class="ly-donut" style="background:conic-gradient(${segs})"><div><b>5000</b><span>万元</span></div></div>`
  }

  // ---------- 光年预测器 ----------
  async function predictPage(app) {
    const ov = await api('/lightyear/overview')
    let assets = []
    if (S.user && S.user.role === 'creator') { try { assets = (await api('/lightyear/me')).assets } catch {} }
    const sel = (name, obj, val) => `<select class="input" name="${name}">${Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(v.label || v.name || v)}</option>`).join('')}</select>`
    app.innerHTML = `<section class="ly-hero ly-hero-sm"><div class="ly-hero-bg"></div><div class="ly-stars"></div><div class="wrap"><div class="ly-kicker">LIGHT-YEAR FORECAST</div><h1 class="h2" style="font-size:clamp(28px,4.5vw,46px)">光年预测器</h1><p class="lead" style="margin-top:8px">输入片长、风格、镜头构成与模型策略，预测 <b class="gold">算力消耗、制作周期与补贴覆盖</b>。</p></div></section>
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
        <button class="btn btn-gold btn-block"><i class="fa-solid fa-wand-magic-sparkles"></i>开始光年预测</button>
      </form>
      <div id="pred-out"><div class="card ly-empty-pred"><i class="fa-solid fa-meteor"></i><p>调整左侧参数，实时预测你的片子</p></div></div>
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
    const sc = [['low', '乐观', 'green'], ['base', '基准', 'gold'], ['high', '保守', 'red']]
    $('#pred-out').innerHTML = `<div class="stack">
      <div class="card ly-result-hero"><div class="xs muted">基准预测 · 标准Token</div><div class="ly-result-big">${tok(d.base.std)}</div>
        <div class="row" style="justify-content:center;gap:16px"><span class="small">≈ 刊例 <b class="gold">${money(d.base.cost)}</b></span><span class="small">生成 <b class="gold">${Math.round(d.base.genSec / 60).toLocaleString()}</b> 分钟视频</span><span class="small">迭代倍率 <b class="gold">${d.base.multiplier}×</b></span></div>
        <div class="sc-cards" style="margin-top:16px">${sc.map(([k, l, c]) => `<div class="sc ${k === 'base' ? 'base' : ''}"><div class="xs ${c}">${l}场景</div><b style="font-size:20px">${tok(d[k].std)}</b><div class="xs dim">${money(d[k].cost)}</div></div>`).join('')}</div></div>
      <div class="card"><div class="between"><b><i class="fa-regular fa-calendar gold"></i> 制作周期预测</b><span class="mono gold">${d.totalWeeks} 周 ≈ ${(d.totalWeeks / 4.3).toFixed(1)} 个月</span></div>
        <div class="ly-gantt">${(() => { let acc = 0; return d.phases.map((p, i) => { const s = (acc / maxW) * 100; acc += p.weeks; return `<div class="ly-g-row"><div class="ly-g-l"><b class="small">${p.name}</b><div class="xs dim">${esc(p.sub)}</div></div><div class="ly-g-track"><i style="left:${s}%;width:${Math.max(3, (p.weeks / maxW) * 100)}%;background:${PAL[i]}"></i></div><span class="mono xs">${p.weeks}周</span></div>` }).join('') })()}</div>
        <div class="xs dim">约 ${d.calls.toLocaleString()} 次生成调用 · 操作工时约 ${d.opHours.toLocaleString()} 小时（每次含提示词、参考准备与审片约 3.5 分钟）</div></div>
      <div class="card"><b><i class="fa-solid fa-hand-holding-heart gold"></i> 光年计划可为你覆盖</b>
        <div class="ly-cover">${d.tiers.map((t) => `<div class="ly-cover-item" style="--c:${TIER_STYLE[t.code][0]}"><div class="between"><b>${t.name}</b><span class="mono">${t.coverage}%</span></div><div class="ly-cover-amt">${tok(t.std)}</div><div class="xs dim">≈ ${money(t.yuan)} 免费</div><div class="bar" style="height:5px;margin-top:6px"><i style="width:${t.coverage}%;background:var(--c)"></i></div></div>`).join('')}</div>
        <div class="xs muted" style="margin-top:8px">另：星火任务最高 3,000 万标准Token 人人可领。${saved && d.prediction_id ? `<span class="green">预测已保存 #${d.prediction_id}，可在算力钱包中凭此申请定向额度。</span>` : S.user ? '点击“开始光年预测”保存结果用于申请。' : '<a class="gold" href="#/login?mode=register">登录</a>后可保存预测并申请。'}</div></div>
      <div class="card"><b><i class="fa-solid fa-lightbulb gold"></i> 风格与策略建议</b>${d.tips.map((t) => `<p class="small muted" style="margin-top:8px">· ${esc(t)}</p>`).join('')}</div>
      <details class="card"><summary class="small gold" style="cursor:pointer">查看分镜头类测算明细与公式</summary>
        <p class="mono xs" style="margin:10px 0;line-height:1.8">${esc(d.formula)}<br>每秒Token（${esc(d.input.resolution)}）= ${d.tokPerSec.toLocaleString()}</p>
        <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>镜头类</th><th>模型</th><th>有效秒</th><th>p</th><th>q</th><th>M</th><th>生成秒</th><th>Tokens</th></tr></thead><tbody>${d.base.lines.map((l) => `<tr><td data-l="镜头类">${l.shot}</td><td data-l="模型">${l.model}</td><td data-l="有效秒" class="mono">${l.effSec}</td><td data-l="p" class="mono">${l.p}</td><td data-l="q" class="mono">${l.q}</td><td data-l="M" class="mono">${l.M}</td><td data-l="生成秒" class="mono">${l.genSec.toLocaleString()}</td><td data-l="Tokens" class="mono gold">${tok(l.tokens)}</td></tr>`).join('')}</tbody></table></div>
        <p class="xs dim" style="margin-top:8px">${esc(d.disclaimer)}</p></details>
    </div>`
  }

  // ---------- 我的算力钱包 ----------
  async function walletPage(app) {
    if (!S.user) return needLogin(app, '登录后查看你的光年算力钱包')
    if (S.user.role !== 'creator') {
      if (['operator', 'finance', 'admin'].includes(S.user.role)) return adminPage(app)
      app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-meteor"></i>光年算力面向创作者/团队发放。<div style="margin-top:12px"><a class="btn btn-sm" href="#/lightyear">返回活动页</a></div></div></div>`; return
    }
    const d = await api('/lightyear/me')
    const b = d.balance, lv = TIER_STYLE[d.level] || ['#777', 'fa-circle']
    app.innerHTML = `<div class="wrap section" style="padding-top:28px">
      <div class="ly-wallet" style="--c:${lv[0]}"><div class="ly-wallet-bg"></div>
        <div class="between" style="position:relative"><div><div class="xs" style="letter-spacing:3px;opacity:.8">LIGHT-YEAR WALLET · 光年算力钱包</div><div class="row" style="margin-top:6px"><span class="ly-level"><i class="fa-solid ${lv[1]}"></i>${esc(d.level)}</span><span class="small">${esc(S.user.name)}</span></div></div><a class="btn btn-sm" href="#/lightyear/predict"><i class="fa-solid fa-wand-magic-sparkles"></i>光年预测</a></div>
        <div class="ly-wallet-big"><span>${tok(b.available)}</span><small>可用标准Token</small></div>
        <div class="row" style="gap:22px;position:relative"><div><div class="xs dim">累计获得</div><b class="mono">${tok(b.granted)}</b></div><div><div class="xs dim">已消耗</div><b class="mono">${tok(b.used)}</b></div><div><div class="xs dim">≈ 720p 可生成</div><b class="mono">${Math.floor(secOf720(b.available) / 60).toLocaleString()} 分钟</b></div><div><div class="xs dim">≈ 刊例价值</div><b class="mono">${money(yuanOf(b.available))}</b></div></div>
      </div>
      <div class="cards split" style="margin-top:18px">
        <div class="stack">
          <div class="card"><div class="between"><b class="h3"><i class="fa-solid fa-fire" style="color:#e6a23c"></i> 星火任务</b><span class="xs dim">“有项目”即可共享</span></div>
            ${d.tasks.map((t) => `<div class="ly-task ${t.claimed ? 'done' : ''}"><i class="fa-solid ${t.icon}"></i><div style="flex:1;min-width:0"><b class="small">${esc(t.name)}</b><div class="xs dim">${esc(t.desc)}</div></div><span class="mono gold xs">+${tok(t.tokens)}</span>
              ${t.claimed ? '<span class="tag green"><i class="fa-solid fa-check"></i>已领</span>' : t.locked && t.code !== 'asset' ? '<span class="tag"><i class="fa-solid fa-lock"></i>需先建档</span>' : t.done ? `<button class="btn btn-sm btn-gold ly-claim" data-c="${t.code}">领取</button>` : `<a class="btn btn-sm" href="${{ asset: '#/workbench/assets?go=asset', predict: '#/lightyear/predict', entry: '#/workbench/entries?go=entry', listing: '#/workbench/listings?go=listing', event: '#/events' }[t.code] || '#/'}">去完成</a>`}</div>`).join('')}
            ${d.honors.map((h) => `<div class="ly-task ${h.claimed ? 'done' : ''}" style="border-color:rgba(240,207,134,.4)"><i class="fa-solid fa-award"></i><div style="flex:1;min-width:0"><b class="small">荣誉加成</b><div class="xs dim">《${esc(h.title)}》${esc(h.award)}</div></div><span class="mono gold xs">+${tok(h.tokens)}</span>${h.claimed ? '<span class="tag green">已领</span>' : `<button class="btn btn-sm btn-gold ly-claim" data-c="${h.code}">领取</button>`}</div>`).join('')}
          </div>
          <div class="card"><b class="h3"><i class="fa-solid fa-star gold"></i> 申请定向额度（星耀 / 星河 / 光年）</b><p class="xs muted" style="margin:4px 0 12px">额度 = 光年预测基准用量 × 覆盖比例（封顶），需运营审批；星河/光年按里程碑分批释放。</p>
            ${d.assets.length ? d.assets.map((a) => `<div class="ly-apply"><div style="flex:1;min-width:0"><b class="small">《${esc(a.title)}》</b><div class="xs dim">${esc(a.form)} · ${a.total_minutes}分钟 · ${a.last_prediction ? `最近预测 ${tok(a.last_prediction.std_tokens)}` : '<span class="red">尚未预测</span>'}</div><div class="row" style="margin-top:6px">${['星耀', '星河', '光年'].map((t) => `<span class="tag ${a.eligible.includes(t) ? 'gold' : ''}">${a.eligible.includes(t) ? '✓' : '✗'} ${t}</span>`).join('')}</div></div>
              <div class="row">${!a.last_prediction ? `<a class="btn btn-sm" href="#/lightyear/predict">去预测</a>` : a.eligible.map((t) => `<button class="btn btn-sm btn-gold ly-apply-btn" data-a="${a.id}" data-t="${t}" data-p="${a.last_prediction.id}">申请${t}</button>`).join('') || '<span class="xs dim">入选/签约后解锁</span>'}</div></div>`).join('') : '<div class="empty" style="padding:20px">先建立作品档案</div>'}
          </div>
        </div>
        <div class="stack">
          <div class="card"><b class="h3"><i class="fa-solid fa-clapperboard gold"></i> 登记一次生成</b><p class="xs muted" style="margin:4px 0 12px">实际调用 Seedance 时按 Token 实时扣减（对接供应商 API 后自动回调）。</p>
            <form id="use-form"><div class="grid2"><div class="field"><label>模型</label><select class="input" name="model"><option value="2.0">Seedance 2.0（≤15秒）</option><option value="2.5">Seedance 2.5（≤30秒）</option></select></div><div class="field"><label>分辨率</label><select class="input" name="resolution"><option>480p</option><option selected>720p</option><option>1080p</option></select></div><div class="field"><label>输出秒数</label><input class="input" type="number" name="seconds" value="10" min="1" max="30"></div><div class="field"><label>参考视频输入秒</label><input class="input" type="number" name="input_seconds" value="0" min="0"></div></div>
            <div class="field"><label>关联作品</label><select class="input" name="asset_id"><option value="">不关联</option>${d.assets.map((a) => `<option value="${a.id}">《${esc(a.title)}》</option>`).join('')}</select></div>
            <div class="xs gold" id="use-preview" style="margin-bottom:10px"></div><button class="btn btn-gold btn-block">确认生成并扣减</button></form></div>
          <div class="card"><b class="h3">算力流水</b>
            ${[...d.grants.map((g) => ({ t: g.created_at, txt: g.note, amt: g.tokens, st: g.status, plus: true, tier: g.tier })), ...d.usage.map((u) => ({ t: u.created_at, txt: `Seedance ${u.model} · ${u.resolution} · ${u.seconds}s ${u.note || ''}`, amt: u.std_tokens, st: '已消耗', plus: false }))].sort((a, b) => (a.t < b.t ? 1 : -1)).map((x) => `<div class="ly-flow"><div style="flex:1;min-width:0"><div class="small">${esc(x.txt)}</div><div class="xs dim">${esc(String(x.t).slice(0, 16))} ${x.tier ? '· ' + esc(x.tier) : ''}</div></div><div style="text-align:right"><b class="mono ${x.plus ? (x.st === '待审批' ? 'dim' : 'green') : 'red'}">${x.plus ? '+' : '−'}${tok(x.amt)}</b><div>${statusTag(x.st)}</div></div></div>`).join('') || '<p class="xs muted">暂无</p>'}
          </div>
        </div>
      </div></div>`
    $$('.ly-claim').forEach((btn) => (btn.onclick = async () => {
      try { const r = await api('/lightyear/claim', { body: { code: btn.dataset.c } }); celebrate(r.tokens); setTimeout(router, 1400) } catch (e) { errToast(e) }
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
  function celebrate(n) {
    const m = document.createElement('div'); m.className = 'ly-celebrate'
    m.innerHTML = `<div class="ly-burst">${Array.from({ length: 24 }, (_, i) => `<i style="--a:${i * 15}deg;--d:${80 + Math.random() * 90}px"></i>`).join('')}</div><div class="ly-cel-txt"><i class="fa-solid fa-meteor"></i><b>+${tok(n)}</b><span>标准Token 已点亮</span></div>`
    document.body.appendChild(m); setTimeout(() => m.remove(), 1600)
  }

  // ---------- 运营：额度审批 ----------
  async function adminPage(app) {
    const d = await api('/lightyear/admin')
    app.innerHTML = `<div class="wrap section" style="padding-top:28px"><div class="eyebrow">LIGHT-YEAR ADMIN</div><h2 class="h2">光年算力 · 额度审批与资金池</h2>
      <div class="cards c3" style="margin:18px 0">${d.buckets.map((b, i) => `<div class="card"><div class="between"><b class="small">${esc(b.name)}</b><span class="xs mono">${(b.amount_yuan / 1e4).toLocaleString()}万元</span></div><div class="mono gold" style="margin-top:6px">${tok(b.granted)} / ${tok(b.std_tokens)}</div><div class="bar" style="height:6px;margin-top:6px"><i style="width:${Math.max(1, (b.granted / b.std_tokens) * 100)}%;background:${PAL[i]}"></i></div></div>`).join('')}</div>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>创作者</th><th>说明</th><th>星阶/池</th><th>额度</th><th>状态</th><th>操作</th></tr></thead><tbody>${d.grants.map((g) => `<tr><td data-l="创作者">${esc(g.name)}</td><td data-l="说明" class="full small">${esc(g.note)}</td><td data-l="星阶">${esc(g.tier)} · <span class="xs dim">${esc(g.bucket)}</span></td><td data-l="额度" class="mono gold">${tok(g.tokens)}</td><td data-l="状态">${statusTag(g.status)}</td><td data-l="操作">${g.status === '待审批' ? `<div class="row"><button class="btn btn-sm btn-gold" data-g="${g.id}" data-a="approve">批准</button><button class="btn btn-sm" data-g="${g.id}" data-a="reject">拒绝</button></div>` : '—'}</td></tr>`).join('')}</tbody></table></div></div>`
    $$('[data-g]').forEach((b) => (b.onclick = async () => { const body = { action: b.dataset.a }; if (b.dataset.a === 'reject') { body.reason = prompt('拒绝原因'); if (!body.reason) return } try { await api(`/lightyear/grants/${b.dataset.g}/decide`, { body }); toast('已处理', 'ok'); router() } catch (e) { errToast(e) } }))
  }
})()
