/* 迭影计划 · 1 亿元扶持体系 / 展映厅 / 推广中心 / 分享海报 / 多视频播放 */
(function () {
  const R = window.ROUTES
  const W = (y) => (y >= 1e8 ? (y / 1e8).toFixed(y % 1e8 ? 1 : 0) + ' 亿元' : (y / 1e4).toLocaleString() + ' 万元')
  const fmtT = (s) => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
  const device = () => { let d = localStorage.getItem('dd_device'); if (!d) { d = 'dv' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('dd_device', d) } return d }
  const UNIT_IC = { feature: 'fa-film', series: 'fa-tv', short: 'fa-clapperboard', campus: 'fa-graduation-cap', lab: 'fa-flask' }
  const ART = ['art-a', 'art-b', 'art-c', 'art-d', 'art-e']
  const track = (code, type, ref) => fetch('/api/promo/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, type, ref, device: device() }), keepalive: true }).catch(() => {})
  const shareLink = (code, ref) => `${location.origin}/#/vote/${code}${ref ? '?ref=' + ref : ''}`

  // 数字滚动
  function countUp(el, to, dur = 1400, fmt = (n) => Math.round(n).toLocaleString()) {
    if (!el) return
    const t0 = performance.now()
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(step) }
    requestAnimationFrame(step)
  }
  window.ddCountUp = countUp

  // =====================================================================
  // 1 亿元扶持体系  #/fund
  // =====================================================================
  R.fund = async (app) => {
    const d = await api('/promo/overview')
    const cTot = d.compute_buckets.reduce((a, b) => a + b.amount_yuan, 0)
    app.innerHTML = `
    <section class="fd-hero"><div class="fd-hero-bg"></div><div class="wrap">
      <div class="pg-label">迭代 × 捷成世纪 · 2027 年度 AI 影视扶持</div>
      <div class="fd-big"><span class="fd-num" id="fd-num">0</span><span class="fd-unit">亿元</span></div>
      <h1 class="fd-title">AI 算力 <b>+</b> 宣发扶持</h1>
      <p class="fd-lead">从第一帧生成，到第一场首映。迭影计划把<b>制作所需的算力</b>和<b>让作品被看见的宣发资源</b>一起打包给创作者——完片扶持、展映推广、发行出海，一条链路全部打通。</p>
      <div class="fd-split">
        <div class="fd-part c"><div class="fd-ico"><i class="fa-solid fa-microchip"></i></div><div><b class="fd-v"><span id="fd-c">0</span><small>万元</small></b><span>AI 算力扶持</span><em>Seedance 2.0 / 2.5 专业影视生成</em></div></div>
        <div class="fd-plus">+</div>
        <div class="fd-part p"><div class="fd-ico"><i class="fa-solid fa-bullhorn"></i></div><div><b class="fd-v"><span id="fd-p">0</span><small>万元</small></b><span>宣发扶持</span><em>首映展映 · 平台推流 · 电影节</em></div></div>
      </div>
      <div class="fd-bar"><i class="c" style="width:${(d.compute / d.total) * 100}%"></i><i class="p" style="width:${(d.promo / d.total) * 100}%"></i></div>
      <div class="row" style="margin-top:26px"><a class="btn btn-gold btn-lg" href="#/apply"><i class="fa-solid fa-bolt"></i>立即报名</a><a class="btn btn-lg" href="#/guide">申报材料指南</a></div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="pg-head"><div class="no">01</div><div><h2>7,000 万元 · AI 算力扶持</h2></div><div><p>按「迭影测算 DY-1.0」核定额度，随制作里程碑分批到账；算力与项目绑定，不可提现或转让。</p></div></div>
      <div class="fd-pools">${d.compute_buckets.map((b, i) => `<div class="fd-pool"><div class="fd-pool-top"><span class="pg-label">C${i + 1}</span><b>${(b.amount_yuan / 1e4).toLocaleString()}<small> 万</small></b></div><h3>${esc(b.name)}</h3><p class="xs muted">${esc(b.intro)}</p><div class="fd-meter"><i style="width:${(b.amount_yuan / cTot) * 100}%"></i></div></div>`).join('')}</div>
    </div></section>

    <section class="section fd-promo-sec"><div class="wrap">
      <div class="pg-head"><div class="no">02</div><div><h2>3,000 万元 · 宣发扶持</h2></div><div><p>入选作品按评审结果与展映热度分档获得宣发资源。好作品不只被做出来，更要被看见。</p></div></div>
      <div class="fd-pools">${d.promo_buckets.map((b, i) => `<div class="fd-pool p"><div class="fd-pool-top"><span class="pg-label">P${i + 1}</span><b>${(b.amount_yuan / 1e4).toLocaleString()}<small> 万</small></b></div><h3>${esc(b.name)}</h3><p class="xs muted">${esc(b.intro)}</p><div class="fd-meter"><i style="width:${(b.amount_yuan / d.promo) * 100}%"></i></div></div>`).join('')}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="pg-head"><div class="no">03</div><div><h2>一条链路 · 从报名到出海</h2></div><div><p>每一步都有对应的平台功能，数据全程留痕。</p></div></div>
      <ol class="fd-chain">${[
        ['fa-pen-to-square', '报名建档', '手机 3 分钟完成分步报名，生成专属作品页与打分链接', '#/apply'],
        ['fa-folder-open', '申报材料', '首轮 10 项 / 二轮 9 项，在线速览表 + 文件续传 + 版本管理', '#/guide'],
        ['fa-cloud-arrow-up', '影片上传', '正片、预告、先导片 A/B、样章分类上传，最大 4GB，断网续传', '#/me'],
        ['fa-gavel', '双轮评审', '远程预审 → 六人联合评审路演；专家观看门槛与回避机制', '#/jury'],
        ['fa-microchip', '算力到账', '双人审批后按里程碑发放 Seedance 算力', '#/support/predict'],
        ['fa-tv', '展映推广', '展映厅公开放映、热度榜、分享海报、渠道来源追踪', '#/screening'],
        ['fa-bullhorn', '宣发扶持', '首映、推流、物料、电影节、媒体五大资金池', '#/fund'],
        ['fa-earth-asia', '发行出海', '国内平台、海外短剧与电影节市场，版权交易与分账', '#/export'],
      ].map(([ic, t, p, h], i) => `<li><a href="${h}"><span class="fd-step">${String(i + 1).padStart(2, '0')}</span><i class="fa-solid ${ic}"></i><b>${t}</b><p class="xs muted">${p}</p></a></li>`).join('')}</ol>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="pg-head"><div class="no">04</div><div><h2>五大展映单元</h2></div><div><p>上线作品自动归入展映单元，运营可编排主推。</p></div></div>
      <div class="fd-units">${d.units.map((u) => `<a href="#/screening?unit=${u.code}"><i class="fa-solid ${UNIT_IC[u.code]}"></i><b>${u.name}</b><span class="xs muted">${u.desc}</span></a>`).join('')}</div>
      <div class="pg-cta" style="margin-top:28px"><div><div class="pg-label">报名进行中 · 截止 2027.01.31</div><b>1 亿元扶持，等你的下一帧</b></div><a class="btn btn-gold" href="#/apply">立即报名</a></div>
      <p class="xs dim" style="margin-top:14px">1 亿元为合作方拟投入的扶持总面值（AI 算力 7,000 万元 + 宣发资源 3,000 万元），具体额度、使用条件与资金池划分以双方书面协议及当期征集通知为准；算力支持、宣发扶持、现金投资、获奖及发行合作分别确认，不构成获奖、获投或发行承诺。</p>
    </div></section>`
    countUp($('#fd-num'), 1, 1200, (n) => (n >= 0.995 ? '1' : n.toFixed(2)))
    countUp($('#fd-c'), d.compute / 1e4, 1500)
    countUp($('#fd-p'), d.promo / 1e4, 1500)
  }

  // =====================================================================
  // 展映厅  #/screening?unit=&sort=
  // =====================================================================
  const card = (x, i) => `<a class="sc-card" href="#/vote/${x.code}?ref=screening">
      <div class="sc-art ${ART[x.id % ART.length]}"><span class="sc-play"><i class="fa-solid fa-play"></i></span>
        <span class="sc-unit"><i class="fa-solid ${UNIT_IC[x.unit]}"></i></span>${x.featured ? '<span class="sc-feat">主推</span>' : ''}
        <div class="sc-t">${esc(x.title.replace(/[《》]/g, ''))}</div></div>
      <div class="sc-body"><b>${esc(x.title)}</b><div class="xs muted">${esc(x.team)} · ${esc(x.form)}${x.minutes ? ' · ' + x.minutes + ' 分钟' : ''}</div>
        <div class="sc-stats xs"><span><i class="fa-solid fa-fire"></i>${x.hot.toLocaleString()}</span><span><i class="fa-solid fa-play"></i>${x.plays.toLocaleString()}</span><span><i class="fa-solid fa-star"></i>${x.avg ?? '—'}</span><span><i class="fa-solid fa-layer-group"></i>${x.clips}</span></div></div></a>`

  R.screening = async (app, _p, q = {}) => {
    const unit = q.unit || '', sort = q.sort === 'new' ? 'new' : 'hot'
    const d = await api(`/screening?unit=${encodeURIComponent(unit)}&sort=${sort}`)
    const f = d.featured[0]
    app.innerHTML = `
    <section class="sc-hero"><div class="sc-hero-bg"></div><div class="wrap">
      <div class="pg-label">迭影计划 · 线上展映厅</div>
      <h1>展映厅<small>SCREENING ROOM</small></h1>
      <p class="lead">审核上线的作品在这里公开放映。看片、打分、分享，每一次播放都在为作品积累热度——热度与评审结果共同决定宣发扶持分档。</p>
      <div class="sc-kpis"><div><b id="sc-k1">0</b><span>上线影片</span></div><div><b id="sc-k2">0</b><span>累计播放</span></div><div><b id="sc-k3">0</b><span>分享次数</span></div></div>
    </div></section>
    ${f ? `<section class="wrap sc-feature"><a href="#/vote/${f.code}?ref=screening" class="sc-feature-in ${ART[f.id % ART.length]}">
      <div class="sc-feature-tx"><span class="tag gold">本周主推</span><h2>${esc(f.title)}</h2><p class="small">${esc(f.logline || '')}</p><div class="xs">${esc(f.team)} · ${esc(f.form)} · <i class="fa-solid fa-fire"></i> ${f.hot.toLocaleString()}</div><span class="btn btn-gold btn-sm" style="margin-top:12px"><i class="fa-solid fa-play"></i>立即观看</span></div></a></section>` : ''}
    <section class="wrap section" style="padding-top:22px">
      <div class="sc-units" role="tablist">${[{ code: '', name: '全部', n: d.units.reduce((a, u) => a + u.n, 0) }, ...d.units].map((u) => `<a role="tab" class="${unit === u.code ? 'on' : ''}" href="#/screening?unit=${u.code}&sort=${sort}">${u.code ? `<i class="fa-solid ${UNIT_IC[u.code]}"></i>` : ''}${u.name}<em>${u.n}</em></a>`).join('')}</div>
      <div class="between" style="margin:14px 0 16px"><span class="xs muted">热度 = 播放 + 评分×6 + 分享×4 + 访问</span>
        <div class="ly-seg sm"><a class="${sort === 'hot' ? 'on' : ''}" href="#/screening?unit=${unit}&sort=hot">最热</a><a class="${sort === 'new' ? 'on' : ''}" href="#/screening?unit=${unit}&sort=new">最新</a></div></div>
      <div class="sc-grid">${d.rows.map(card).join('') || '<div class="empty"><i class="fa-regular fa-circle-play"></i>该单元暂无上线影片</div>'}</div>
      <div class="pg-cta" style="margin-top:30px"><div><div class="pg-label">你的作品也可以在这里放映</div><b>报名 → 上传影片 → 审核上线 → 进入展映厅</b></div><a class="btn btn-gold" href="#/apply">立即报名</a></div>
    </section>`
    countUp($('#sc-k1'), d.totals.clips); countUp($('#sc-k2'), d.totals.plays); countUp($('#sc-k3'), d.totals.shares)
  }

  // =====================================================================
  // 作品页：多视频播放（覆盖 admin.js 的 mountWorkVideo）+ 推广追踪 + 分享
  // =====================================================================
  window.mountWorkVideo = async (slot, a) => {
    if (!slot) return
    const ref = new URLSearchParams((location.hash.split('?')[1] || '')).get('ref') || 'direct'
    track(a.code, 'view', ref)
    let rows = []
    try { rows = (await api('/program/apps/' + a.code + '/videos')).rows } catch {}
    const mine = S.user && (S.user.id === a.user_id || ['operator', 'admin'].includes(S.user.role))
    let cur = rows.find((v) => v.status === '已上线') || rows[0] || null
    const render = () => {
      slot.innerHTML = window.VPlayer.html(cur, { emptyText: mine ? '还没有上传作品视频' : '作品视频审核中 / 尚未上传' }) +
        (rows.length > 1 ? `<div class="vp-list" role="tablist">${rows.map((v) => `<button role="tab" class="${cur && v.id === cur.id ? 'on' : ''}" data-v="${v.id}"><i class="fa-solid fa-play"></i><span>${esc(v.category)}</span>${v.duration ? `<em>${fmtT(v.duration)}</em>` : ''}${v.status !== '已上线' ? `<em class="amber">${esc(v.status)}</em>` : ''}</button>`).join('')}</div>` : '') +
        (mine ? `<div class="vp-owner"><span class="xs muted">${cur ? `当前：${esc(cur.category)} · ${statusTag(cur.status)}${cur.reject_reason ? ' <span class="red">驳回：' + esc(cur.reject_reason) + '</span>' : ''}` : '上传后经审核即进入展映厅'}</span><div class="row" style="gap:6px"><a class="btn btn-sm" href="#/promo/${a.id}"><i class="fa-solid fa-chart-line"></i>推广数据</a><button class="btn btn-sm btn-gold" id="vp-up"><i class="fa-solid fa-cloud-arrow-up"></i>上传视频</button></div></div>` : '')
      window.VPlayer.mount(slot, cur)
      $$('.vp-list button', slot).forEach((b) => (b.onclick = () => { cur = rows.find((v) => v.id === +b.dataset.v); render(); const c = $('.vp-cover', slot); c && c.click() }))
      const up = $('#vp-up', slot); if (up) up.onclick = () => window.openVideoUpload(a, () => window.mountWorkVideo(slot, a))
    }
    render()
    // 分享卡片增强
    const shareCard = $('#copy-btn') && $('#copy-btn').closest('.card')
    if (shareCard && !shareCard.dataset.enh) {
      shareCard.dataset.enh = 1
      shareCard.insertAdjacentHTML('beforeend', `<div class="sh-row">
        <button class="sh-btn" data-sh="native"><i class="fa-solid fa-share-nodes"></i>分享</button>
        <button class="sh-btn" data-sh="wechat"><i class="fa-brands fa-weixin"></i>微信</button>
        <button class="sh-btn" data-sh="poster"><i class="fa-regular fa-image"></i>海报</button>
        <button class="sh-btn" data-sh="weibo"><i class="fa-brands fa-weibo"></i>微博</button></div>`)
      $('#share-link').value = shareLink(a.code, 'link')
      $$('[data-sh]', shareCard).forEach((b) => (b.onclick = () => share(a, b.dataset.sh)))
    }
  }

  async function share(a, how) {
    const title = `为${a.title}打分 · 迭影计划`, text = a.logline || '', url = shareLink(a.code, how === 'native' ? 'share' : how)
    if (how === 'poster') return poster(a)
    track(a.code, 'share', how)
    if (how === 'weibo') return window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' ' + text)}`, '_blank')
    if (how === 'native' && navigator.share) return navigator.share({ title, text, url }).catch(() => {})
    try { await navigator.clipboard.writeText(`${title}\n${text}\n${url}`) } catch {}
    toast(how === 'wechat' ? '链接已复制，打开微信粘贴给好友或群聊' : '链接已复制', 'ok')
  }
  window.ddShare = share

  // =====================================================================
  // 分享海报（Canvas 生成，长按保存 / 下载）
  // =====================================================================
  async function poster(a) {
    track(a.code, 'share', 'poster')
    const url = shareLink(a.code, 'poster')
    const W2 = 750, H2 = 1334, cv = document.createElement('canvas'); cv.width = W2; cv.height = H2
    const g = cv.getContext('2d')
    const bg = g.createLinearGradient(0, 0, W2, H2); bg.addColorStop(0, '#0b1a36'); bg.addColorStop(0.55, '#123a7a'); bg.addColorStop(1, '#0596b0')
    g.fillStyle = bg; g.fillRect(0, 0, W2, H2)
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = '/static/img/program-poster-cool.jpg' })
      g.globalAlpha = 0.55; const s = Math.max(W2 / img.width, 820 / img.height); g.drawImage(img, (W2 - img.width * s) / 2, 0, img.width * s, img.height * s); g.globalAlpha = 1
    } catch {}
    const fade = g.createLinearGradient(0, 420, 0, 900); fade.addColorStop(0, 'rgba(11,26,54,0)'); fade.addColorStop(1, 'rgba(11,26,54,.96)'); g.fillStyle = fade; g.fillRect(0, 420, W2, 914)
    g.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 0; y < H2; y += 44) g.fillRect(0, y, W2, 1)
    g.fillStyle = '#8fd3ff'; g.font = '600 24px sans-serif'; g.fillText('迭影计划 · ITER·FILM PROGRAM', 56, 86)
    g.fillStyle = '#fff'; g.font = '700 30px sans-serif'; g.fillText('1 亿元 AI 算力 + 宣发扶持', 56, 132)
    g.fillStyle = '#ffffff'; g.font = '700 64px serif'
    const t = a.title; let lines = [], line = ''
    for (const ch of t) { if (g.measureText(line + ch).width > W2 - 112) { lines.push(line); line = ch } else line += ch } lines.push(line)
    lines.slice(0, 2).forEach((l, i) => g.fillText(l, 56, 840 + i * 80))
    let y = 840 + Math.min(2, lines.length) * 80 + 10
    g.fillStyle = 'rgba(255,255,255,.82)'; g.font = '28px sans-serif'
    let lg = a.logline || '', ln = ''; const ll = []
    for (const ch of lg) { if (g.measureText(ln + ch).width > W2 - 112) { ll.push(ln); ln = ch } else ln += ch } ll.push(ln)
    ll.slice(0, 3).forEach((l, i) => g.fillText(l, 56, y + i * 42)); y += Math.min(3, ll.length) * 42 + 20
    g.fillStyle = '#8fd3ff'; g.font = '24px sans-serif'; g.fillText(`${a.team} · ${a.track} · ${a.form}`, 56, y)
    // 底部卡
    g.fillStyle = '#ffffff'; roundRect(g, 40, H2 - 250, W2 - 80, 200, 20); g.fill()
    g.fillStyle = '#0f1b2d'; g.font = '700 34px sans-serif'; g.fillText('扫码 / 长按识别，为我打分', 72, H2 - 180)
    g.fillStyle = '#56657a'; g.font = '22px sans-serif'; g.fillText('每一次迭代，离银幕更近一帧', 72, H2 - 140)
    g.fillStyle = '#1f6feb'; g.font = '600 22px monospace'; g.fillText('作品编号 ' + a.code, 72, H2 - 98)
    // 二维码：使用公共 QR 服务（失败时回退为编号）
    try {
      const qr = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=' + encodeURIComponent(url) })
      g.drawImage(qr, W2 - 230, H2 - 232, 164, 164)
    } catch { g.fillStyle = '#eef2f8'; g.fillRect(W2 - 230, H2 - 232, 164, 164); g.fillStyle = '#1f6feb'; g.font = '600 26px monospace'; g.fillText(a.code, W2 - 205, H2 - 140) }
    let src = ''
    try { src = cv.toDataURL('image/png') } catch { toast('海报生成失败，请使用复制链接分享', 'err'); return }
    modal('分享海报', `<div class="sh-poster"><img src="${src}" alt="分享海报"></div><p class="xs muted" style="text-align:center;margin:10px 0">手机长按图片保存到相册，发朋友圈 / 群聊</p><a class="btn btn-gold btn-block" download="迭影计划_${esc(a.title.replace(/[《》]/g, ''))}.png" href="${src}"><i class="fa-solid fa-download"></i>保存海报</a>`)
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath() }
  window.ddPoster = poster

  // =====================================================================
  // 推广中心（创作者）  #/promo/:appId
  // =====================================================================
  R.promo = async (app, p) => {
    if (!S.user) return needLogin(app, '登录后查看推广数据')
    const d = await api('/program/apps/' + (+p[0] || 0) + '/promo')
    const a = d.app, k = d.kpi
    const mx = Math.max(1, ...d.days.map((x) => x.views))
    const REF = { wechat: '微信', douyin: '抖音', weibo: '微博', poster: '海报', link: '复制链接', share: '系统分享', screening: '展映厅', direct: '直接访问' }
    app.innerHTML = `<div class="wrap section" style="padding-top:22px;max-width:900px">
      <a class="xs muted" href="#/me">← 我的</a>
      <div class="pg-label" style="margin-top:14px">推广中心 · Promotion</div><h1 class="pg-title" style="font-size:clamp(24px,4vw,34px)">${esc(a.title)}</h1>
      <div class="pm-rank"><i class="fa-solid fa-fire"></i>全站热度第 <b>${d.hot_rank}</b> / ${d.total} 名 <span class="xs muted">热度与评审结果共同决定宣发扶持分档</span></div>
      <div class="pm-kpis">${[['访问', k.views, 'fa-eye'], ['播放', k.plays, 'fa-play'], ['分享', k.shares, 'fa-share-nodes'], ['评分', k.votes, 'fa-star'], ['转化率', k.conv + '%', 'fa-arrow-trend-up']].map(([l, v, i]) => `<div><i class="fa-solid ${i}"></i><b>${v}</b><span>${l}</span></div>`).join('')}</div>
      <div class="cards c2" style="margin-top:16px">
        <div class="card"><b class="h3">近 14 天访问</b><div class="pm-chart">${d.days.map((x) => `<div title="${x.day}"><i style="height:${(x.views / mx) * 100}%"></i><span>${x.day.slice(5)}</span></div>`).join('') || '<p class="xs muted">暂无数据，分享后即可看到增长</p>'}</div></div>
        <div class="card"><b class="h3">来源渠道</b>${d.refs.map((r) => `<div class="pm-ref"><span class="small">${REF[r.ref] || esc(r.ref)}</span><div class="adm-fbar"><i style="width:${(r.n / Math.max(...d.refs.map((x) => x.n))) * 100}%"></i></div><b class="mono small">${r.n}</b></div>`).join('') || '<p class="xs muted" style="margin-top:8px">暂无来源数据</p>'}</div>
      </div>
      <div class="card" style="margin-top:16px"><b class="h3">一键推广</b><p class="xs muted" style="margin:4px 0 12px">每个渠道使用独立追踪链接，来源会计入上方统计。</p>
        <div class="sh-row">${[['native', 'fa-solid fa-share-nodes', '系统分享'], ['wechat', 'fa-brands fa-weixin', '微信'], ['poster', 'fa-regular fa-image', '生成海报'], ['weibo', 'fa-brands fa-weibo', '微博']].map(([h, i, l]) => `<button class="sh-btn" data-sh="${h}"><i class="${i}"></i>${l}</button>`).join('')}</div>
        <div class="ap-link" style="margin-top:12px"><input class="input mono xs" readonly value="${shareLink(a.code, 'link')}" id="pm-link"><button class="btn" id="pm-copy">复制</button></div></div>
      <div class="card" style="margin-top:16px"><b class="h3">宣发扶持记录</b>${d.grants.map((g) => `<div class="pm-ref"><span class="small">${esc(g.name)}</span><span class="xs muted" style="flex:1">${esc(g.note || '')}</span><b class="mono small gold">¥${g.yuan.toLocaleString()}</b></div>`).join('') || '<p class="xs muted" style="margin-top:8px">入选后按评审结果与展映热度分档获得宣发资源（首映展映 / 平台推流 / 物料制作 / 电影节 / 媒体公关）。</p>'}</div>
      <div class="row" style="margin-top:16px"><a class="btn btn-gold" href="#/vote/${a.code}">查看作品页</a><a class="btn" href="#/materials/${a.id}">申报材料</a><a class="btn" href="#/screening">展映厅</a></div>
    </div>`
    $$('[data-sh]').forEach((b) => (b.onclick = () => share(a, b.dataset.sh)))
    $('#pm-copy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText($('#pm-link').value); track(a.code, 'share', 'link'); toast('链接已复制', 'ok') }
  }
})()
