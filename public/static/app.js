/* 迭代影交汇 · 前端核心：状态、API、路由、布局 */
(function () {
  const S = (window.S = {
    token: localStorage.getItem('dd_token') || '',
    user: JSON.parse(localStorage.getItem('dd_user') || 'null'),
  })

  // ---------- 工具 ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const money = (n) => (n == null ? '—' : '¥' + Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 }))
  const wan = (n) => (n >= 10000 ? (n / 10000).toFixed(n % 10000 ? 1 : 0) + '万' : String(n))
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]

  async function api(path, opt = {}) {
    const headers = { 'Content-Type': 'application/json' }
    if (S.token) headers.Authorization = 'Bearer ' + S.token
    let res
    try {
      res = await fetch('/api' + path, { method: opt.method || (opt.body ? 'POST' : 'GET'), headers, body: opt.body ? JSON.stringify(opt.body) : undefined })
    } catch (e) {
      throw { status: 0, error: '网络异常，请检查连接后重试' }
    }
    const data = await res.json().catch(() => ({}))
    if (res.status === 401 && S.token && path !== '/auth/login') { logout(true) }
    if (!res.ok) throw { status: res.status, ...data }
    return data
  }

  let toastT
  function toast(msg, type = '') {
    const t = $('#toast'); t.className = 'show ' + type; t.innerHTML = msg
    clearTimeout(toastT); toastT = setTimeout(() => (t.className = ''), 3200)
  }
  function errToast(e) {
    const extra = e && e.missing ? '<br><span class="xs">' + e.missing.map(esc).join('<br>') + '</span>' : ''
    toast('<i class="fa-solid fa-circle-exclamation red"></i> ' + esc((e && e.error) || '操作失败') + extra, 'err')
  }

  function modal(title, body, onMount) {
    const m = $('#modal')
    m.innerHTML = `<div class="modal-box"><div class="modal-head"><b>${title}</b><button class="icon-btn" style="display:grid" data-close aria-label="关闭"><i class="fa-solid fa-xmark"></i></button></div><div class="modal-body">${body}</div></div>`
    m.hidden = false
    m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal() }
    onMount && onMount(m)
  }
  function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = '' }

  function setSession(token, user) {
    S.token = token; S.user = user
    localStorage.setItem('dd_token', token); localStorage.setItem('dd_user', JSON.stringify(user))
    renderChrome()
  }
  async function logout(silent) {
    if (!silent) { try { await api('/auth/logout', { method: 'POST' }) } catch {} }
    S.token = ''; S.user = null
    localStorage.removeItem('dd_token'); localStorage.removeItem('dd_user')
    renderChrome()
    if (!silent) { toast('已退出登录'); location.hash = '#/' } else toast('登录已过期，请重新登录', 'err')
  }

  // ---------- 导航 ----------
  const NAV = [
    ['#/', '迭影计划', 'fa-film'],
    ['#/board', '初选榜', 'fa-ranking-star'],
    ['#/jinding', '金鼎盛典', 'fa-trophy'],
    ['#/jury', '评审导师', 'fa-user-tie'],
    ['#/support', '配套支持', 'fa-toolbox'],
    ['#/export', '出海交易', 'fa-earth-asia'],
  ]
  const ALIAS = { '#/admin': '#/me', '#/review': '#/jury', '#/vote': '#/board', '#/lightyear': '#/support', '#/market': '#/export', '#/distribution': '#/export', '#/listing': '#/export', '#/apply': '#/', '#/festival': '#/jinding', '#/verify': '#/jinding' }
  function renderChrome() {
    const h = location.hash || '#/'
    const raw = '#/' + (h.slice(2).split('?')[0].split('/')[0] || ''), base = ALIAS[raw] || raw
    $('#main-nav').innerHTML = NAV.map(([href, label]) => `<a href="${href}" class="${base === href ? 'active' : ''}">${label}</a>`).join('')
    const u = S.user
    $('#top-actions').innerHTML = u
      ? `<a class="btn btn-gold btn-sm btn-login-text" href="#/apply">报名</a>
         <div class="user-chip" id="user-chip"><span class="avatar">${esc(u.name[0])}</span><div><small>${esc(u.role_label || '')}</small><span>${esc(u.name)}</span></div></div>`
      : `<a class="btn btn-sm btn-ghost btn-login-text" href="#/login">登录</a><a class="btn btn-gold btn-sm" href="#/login?mode=register&next=%23%2Fapply">立即报名</a>`
    const chip = $('#user-chip')
    if (chip) chip.onclick = () => modal('账户', `<div class="stack"><div class="row"><span class="avatar" style="width:46px;height:46px;font-size:18px">${esc(u.name[0])}</span><div><b>${esc(u.name)}</b><div class="xs muted">${esc(u.email || '')}</div><div class="xs gold">${esc(u.role_label)} · ${esc(u.org || '')}</div></div></div>
      ${['operator', 'finance', 'admin'].includes(u.role) ? '<a class="btn btn-block btn-gold" href="#/admin" data-close><i class="fa-solid fa-gauge-high"></i>管理后台</a>' : u.role === 'expert' ? '<a class="btn btn-block btn-gold" href="#/review" data-close><i class="fa-solid fa-gavel"></i>评审工作台</a>' : '<a class="btn btn-block" href="#/me" data-close>我的报名与算力</a>'}<a class="btn btn-block" href="#/workbench" data-close>创作 / 业务工作台</a><button class="btn btn-block btn-ghost" id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i>退出登录</button></div>`,
      (m) => ($('#logout-btn', m).onclick = () => { closeModal(); logout() }))

    const tabs = [['#/', '计划', 'fa-film'], ['#/board', '初选榜', 'fa-ranking-star'], ['#/apply', '报名', 'fa-plus', 'center'], ['#/jury', '评审', 'fa-user-tie'], u && ['operator', 'finance', 'admin'].includes(u.role) ? ['#/admin', '后台', 'fa-gauge-high'] : u && u.role === 'expert' ? ['#/review', '评审台', 'fa-gavel'] : ['#/me', '我的', 'fa-user']]
    $('#tabbar').innerHTML = tabs.map(([href, l, i, cls]) => `<a href="${href}" class="${cls || ''} ${(raw === href || (href !== '#/apply' && base === href && !tabs.some((t) => t && t[0] === raw))) ? 'active' : ''}"><i class="fa-solid ${i}"></i>${l}</a>`).join('')

    $('#drawer').innerHTML = `<div class="between" style="margin-bottom:10px"><b class="gold" style="font-family:var(--serif);font-size:18px">导航</b><button class="icon-btn" style="display:grid" id="drawer-close"><i class="fa-solid fa-xmark"></i></button></div>
      ${NAV.map(([href, l, i]) => `<a href="${href}"><i class="fa-solid ${i}"></i>${l}</a>`).join('')}
      <a href="#/apply"><i class="fa-solid fa-plus"></i>立即报名</a><a href="#/me"><i class="fa-solid fa-user"></i>我的报名与算力</a>
      <div class="xs dim" style="padding:16px 10px 6px;letter-spacing:.2em">更多</div>
      ${u && ['operator', 'finance', 'admin'].includes(u.role) ? '<a href="#/admin"><i class="fa-solid fa-gauge-high"></i>管理后台</a>' : ''}${u && ['expert', 'operator'].includes(u.role) ? '<a href="#/review"><i class="fa-solid fa-gavel"></i>评审工作台</a>' : ''}<a href="#/support/predict"><i class="fa-solid fa-chart-line"></i>算力与周期测算</a><a href="#/workbench"><i class="fa-solid fa-briefcase"></i>工作台</a><a href="#/academy"><i class="fa-solid fa-book"></i>行业洞察</a><a href="#/rules"><i class="fa-solid fa-scale-balanced"></i>规则与边界</a>
      ${u ? `<a href="javascript:void 0" id="drawer-logout"><i class="fa-solid fa-right-from-bracket"></i>退出登录</a>` : `<a href="#/login"><i class="fa-solid fa-right-to-bracket"></i>登录 / 入驻</a>`}`
    $('#drawer-close').onclick = closeDrawer
    const dl = $('#drawer-logout'); if (dl) dl.onclick = () => { closeDrawer(); logout() }
  }
  function openDrawer() {
    $('#drawer').classList.add('open')
    const mask = document.createElement('div'); mask.className = 'drawer-mask'; mask.id = 'drawer-mask'; mask.onclick = closeDrawer
    document.body.appendChild(mask)
  }
  function closeDrawer() { $('#drawer').classList.remove('open'); const m = $('#drawer-mask'); m && m.remove() }

  function renderFooter() {
    $('#site-footer').innerHTML = `<div class="wrap"><div class="cols">
      <div><div class="brand" style="margin-bottom:12px"><span class="brand-mark"><i class="fa-solid fa-film"></i></span><span class="brand-text"><b>迭影计划</b><small>ITER·FILM PROGRAM</small></span></div>
        <p class="small muted" style="max-width:380px">迭代 × 捷成世纪 AI 影视扶持计划：免费算力、完片孵化、发行支持。面向 AI 专业电影团队与影视院校毕业生。</p></div>
      <div><h4>计划</h4><a href="#/apply">报名</a><a href="#/board">初选榜</a><a href="#/jinding">金鼎盛典</a><a href="#/jury">评审与导师</a></div>
      <div><h4>支持</h4><a href="#/support">专家支持</a><a href="#/support/likeness">肖像授权</a><a href="#/support/predict">算力测算</a><a href="#/export">出海与交易</a></div>
      <div><h4>平台</h4><a href="#/workbench">工作台</a><a href="#/verify">证书验真</a><a href="#/academy">行业洞察</a><a href="#/rules">规则与边界</a></div>
    </div><div class="hr"></div>
    <p class="xs dim">“迭影计划”为工作名称；5,000 万元为合作方拟提供的算力面值，以书面协议为准。评审与导师为邀约中，以官方公布为准。免费算力不代表获奖、获投或发行承诺。演示数据均已标注。© 2026 迭代</p></div>`
  }


  // ---------- 路由 ----------
  const routes = (window.ROUTES = {})
  async function router() {
    closeDrawer(); closeModal()
    const h = location.hash || '#/'
    const [pathPart, qs] = h.slice(1).split('?')
    const parts = pathPart.split('/').filter(Boolean)
    const key = parts[0] || ''
    const params = Object.fromEntries(new URLSearchParams(qs || ''))
    renderChrome()
    const app = $('#app')
    app.innerHTML = '<div class="loading-screen"><div class="reel"></div><p>正在放映…</p></div>'
    window.scrollTo(0, 0)
    const fn = routes[key] || routes['404']
    try { await fn(app, parts.slice(1), params) } catch (e) {
      console.error(e)
      app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-film"></i>${esc(e.error || e.message || '页面加载失败')}<div style="margin-top:14px"><a class="btn btn-sm" href="#/">返回首页</a></div></div></div>`
    }
    app.classList.remove('fade-in'); void app.offsetWidth; app.classList.add('fade-in')
  }

  // ---------- 共用渲染片段 ----------
  const COVER = { noir: 'art-noir', myth: 'art-myth', scifi: 'art-scifi', tang: 'art-tang' }
  const FORM_COLOR = { 'AI剧集': 'cyan', 'AI漫剧': 'green', 'AIGC电影': 'violet', '微短剧': 'amber', '动画': 'gold' }
  function posterCard(l) {
    return `<a class="poster" href="#/listing/${l.id}">
      <div class="poster-art ${COVER[l.cover] || 'art-noir'}"><div class="scan"></div>
        <span class="tag ${FORM_COLOR[l.form] || ''} form-tag">${esc(l.form)}</span>
        ${l.honor ? `<span class="laurel honor-tag"><i class="fa-solid fa-award"></i>获奖</span>` : ''}
        <div class="title-art">${esc((l.title.match(/《(.+?)》/) || [, l.title])[1])}</div></div>
      <div class="poster-body">
        <div class="row"><span class="tag gold">${esc(l.type)}</span>${l.exclusive ? '<span class="tag red">独家</span>' : '<span class="tag">非独家</span>'}<span class="tag">${esc(l.stage)}</span></div>
        <div class="small" style="font-weight:600">${esc(l.title)}</div>
        <div class="xs muted">${esc(l.summary || '')}</div>
        <div class="meta"><span><i class="fa-solid fa-earth-asia"></i> ${esc(l.territory)}</span><span><i class="fa-solid fa-tv"></i> ${esc(l.media)}</span><span><i class="fa-regular fa-clock"></i> ${l.total_minutes}分钟</span></div>
      </div></a>`
  }
  const statusTag = (s) => {
    const m = { 有效: 'green', 已发布: 'green', 已批准: 'green', 已提交: 'cyan', 评审中: 'cyan', 获奖: 'gold', 履约中: 'gold', 已上线: 'green', 已通过: 'green', 进行中: 'cyan', 验收中: 'amber', 待批准: 'amber', 审核中: 'amber', 待接受: 'amber', 送审: 'amber', 意向: 'amber', 已撤销: 'red', 已回避: 'red', 已拒绝: 'red', 已撤权: 'red', 补件: 'red', 候选: '', 未接入: '', 部分到账: 'amber', 已全额到账: 'green', 待审批: 'amber', 已审批: 'green', 待审核: 'amber', 已驳回: 'red', 已替换: '', 晋级路演: 'gold', 初选中: '', 路演通过: 'green', 未通过: 'red', 观看中: 'cyan' }
    return `<span class="tag ${m[s] || ''}">${esc(s)}</span>`
  }
  function needLogin(app, msg) {
    app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-lock"></i>${esc(msg || '请先登录后访问')}<div style="margin-top:14px"><a class="btn btn-gold" href="#/login?next=${encodeURIComponent(location.hash)}">登录 / 入驻</a></div></div></div>`
  }
  function pageHero(eyebrow, title, lead, extra = '') {
    return `<section class="page-hero"><div class="wrap"><div class="eyebrow">${eyebrow}</div><h1 class="h2" style="font-size:clamp(26px,4vw,42px)">${title}</h1><p class="lead tag-line">${lead}</p>${extra}</div></section>`
  }
  function bindForm(form) {
    const o = {}
    new FormData(form).forEach((v, k) => (o[k] = v))
    $$('input[type=checkbox]', form).forEach((c) => (o[c.name] = c.checked))
    return o
  }

  Object.assign(window, { api, toast, errToast, modal, closeModal, esc, money, wan, $, $$, setSession, logout, router, posterCard, statusTag, needLogin, pageHero, bindForm, COVER, FORM_COLOR })

  window.addEventListener('hashchange', router)
  window.addEventListener('DOMContentLoaded', () => {
    $('#menu-btn').onclick = openDrawer
    renderFooter()
    if (S.token) api('/auth/me').then((d) => { S.user = { ...S.user, ...d.user }; localStorage.setItem('dd_user', JSON.stringify(S.user)); renderChrome() }).catch(() => {})
    router()
  })
})()
