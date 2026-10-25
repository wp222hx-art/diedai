/* 迭代影交汇 · 我的工作台（创作者 / 专家 / 机构 / 发行&财务 / 联合运营） */
(function () {
  const R = window.ROUTES
  const fmtDate = (s) => (s ? String(s).slice(0, 16).replace('T', ' ') : '—')

  const MENUS = {
    creator: [['overview', '总览', 'fa-gauge'], ['assets', '作品与项目', 'fa-film'], ['entries', '盛典报名', 'fa-trophy'], ['projects', '孵化制作', 'fa-clapperboard'], ['listings', '我的挂牌', 'fa-tag'], ['grants', '资料授权待办', 'fa-key']],
    expert: [['overview', '待评任务', 'fa-list-check']],
    institution: [['overview', '总览', 'fa-gauge'], ['grants', '资料申请', 'fa-key'], ['deals', '洽谈与合同', 'fa-file-signature'], ['demands', '需求单', 'fa-bullhorn']],
    distributor: [['overview', '发行实例', 'fa-satellite-dish'], ['statements', '报表对账', 'fa-file-invoice-dollar'], ['settlements', '分账结算', 'fa-coins'], ['deals', '合同锁权', 'fa-lock']],
    finance: [['overview', '报表对账', 'fa-file-invoice-dollar'], ['settlements', '分账审批', 'fa-coins'], ['audit', '审计日志', 'fa-scroll']],
    operator: [['overview', '运营总览', 'fa-gauge'], ['entries', '报名与分派', 'fa-users-viewfinder'], ['awards', '颁奖与荣誉', 'fa-award'], ['listings', '挂牌审核', 'fa-tag'], ['tickets', '工单队列', 'fa-ticket'], ['audit', '审计与事件', 'fa-scroll']],
  }
  const TITLES = { creator: '创作者工作台', expert: '专家工作台', institution: '机构工作台', distributor: '发行运营工作台', finance: '财务工作台', operator: '联合运营管理台', admin: '联合运营管理台' }

  R.workbench = async (app, p, q) => {
    if (!S.user) return needLogin(app, '请登录后进入「我的工作台」')
    const role = S.user.role === 'admin' ? 'operator' : S.user.role
    const menu = MENUS[role] || MENUS.creator
    const sec = p[0] || (q.go === 'asset' ? 'assets' : q.go === 'entry' ? 'entries' : q.go === 'listing' ? 'listings' : 'overview')
    const d = await api('/dashboard')
    app.innerHTML = `<div class="wrap"><div class="wb">
      <aside class="wb-side"><div class="card"><div class="wb-profile" style="padding:6px 8px 12px;border-bottom:1px solid var(--line);margin-bottom:8px"><div class="row"><span class="avatar">${esc(S.user.name[0])}</span><div><b class="small">${esc(S.user.name)}</b><div class="xs gold">${esc(S.user.role_label || '')}</div></div></div><div class="xs dim" style="margin-top:6px">${esc(S.user.org || '')}</div></div>
        <nav class="wb-menu"><div class="grp">${TITLES[S.user.role]}</div>${menu.map(([k, l, i]) => `<a href="#/workbench/${k}" class="${sec === k ? 'active' : ''}"><i class="fa-solid ${i}"></i>${l}</a>`).join('')}
        <div class="grp">工具</div><a href="#/estimator"><i class="fa-solid fa-calculator"></i>算力估算</a><a href="#/verify"><i class="fa-solid fa-certificate"></i>证书验真</a></nav></div></aside>
      <section id="wb-main" style="min-width:0"></section></div></div>`
    const main = $('#wb-main')
    const fn = (V[role] && V[role][sec]) || (V[role] && V[role].overview)
    await fn(main, d, q)
  }
  const head = (title, sub, actions = '') => `<div class="between" style="margin-bottom:18px"><div><div class="eyebrow">${TITLES[S.user.role]}</div><h2 class="h2" style="font-size:26px">${title}</h2>${sub ? `<p class="xs muted">${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`
  const kpis = (arr) => `<div class="cards c4 m2" style="margin-bottom:18px">${arr.map(([n, l, i]) => `<div class="card kpi"><i class="fa-solid ${i} gold" style="float:right;opacity:.6"></i><b>${n}</b><span>${l}</span></div>`).join('')}</div>`
  const empty = (msg, btn = '') => `<div class="empty"><i class="fa-solid fa-clapperboard"></i>${msg}${btn ? `<div style="margin-top:12px">${btn}</div>` : ''}</div>`
  const reload = () => router()
  const act = async (path, body, okMsg) => { try { const r = await api(path, { body: body || {} }); toast(okMsg || r.note || '操作成功', 'ok'); reload(); return r } catch (e) { errToast(e) } }

  const V = {}

  // ======================= 创作者 =======================
  V.creator = {
    overview(m, d) {
      const pending = d.grants.filter((g) => g.status === '待批准').length
      m.innerHTML = head('欢迎回来，' + esc(S.user.name), '作品与项目、报名、挂牌、授权待办、资源及交付', `<button class="btn btn-gold btn-sm" id="new-asset"><i class="fa-solid fa-plus"></i>创建作品档案</button>`) +
        kpis([[d.assets.length, '作品档案', 'fa-film'], [d.entries.length, '盛典报名', 'fa-trophy'], [d.listings.length, '影市挂牌', 'fa-tag'], [pending, '待处理授权', 'fa-key']]) +
        (d.assets.length ? '' : `<div class="card" style="margin-bottom:16px"><b>开始你的第一个项目</b><div class="row" style="margin-top:12px"><button class="btn btn-gold btn-sm" id="new-asset2">创建项目</button><a class="btn btn-sm" href="#/incubate">查看提报样例</a><a class="btn btn-sm" href="#/estimator">先估算预算</a></div></div>`) +
        `<div class="cards c2"><div class="card"><div class="between"><b>报名进度</b><a class="xs gold" href="#/workbench/entries">全部</a></div>${d.entries.slice(0, 4).map((e) => `<div class="between small" style="padding:10px 0;border-bottom:1px solid var(--line)"><div><b>《${esc(e.title)}》</b><div class="xs dim">${esc(e.edition)} · ${esc(e.track)} · ${esc(e.receipt_no)}</div></div>${statusTag(e.status)}</div>`).join('') || '<p class="xs muted" style="margin-top:10px">暂无报名</p>'}</div>
        <div class="card"><div class="between"><b>评审反馈</b><span class="xs dim">仅显示可反馈意见</span></div>${d.feedback.map((f) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="between small"><b>《${esc(f.title)}》</b><span class="mono gold">${f.total}分</span></div><p class="xs muted">${esc(f.comment_feedback || '—')}</p></div>`).join('') || '<p class="xs muted" style="margin-top:10px">暂无已提交的评审反馈</p>'}</div></div>`
      ;['#new-asset', '#new-asset2'].forEach((s) => { const b = $(s); if (b) b.onclick = assetModal })
    },
    assets(m, d, q) {
      m.innerHTML = head('作品与项目档案', 'Asset 是创意或内容的稳定身份；参赛、开发、挂牌分别建档，不混用状态。', `<button class="btn btn-gold btn-sm" id="new-asset"><i class="fa-solid fa-plus"></i>创建作品档案</button>`) +
        (d.assets.length ? `<div class="cards c2">${d.assets.map((a) => `<div class="poster"><div class="poster-art ${COVER[a.cover] || 'art-noir'}" style="aspect-ratio:21/9"><div class="scan"></div><span class="tag ${FORM_COLOR[a.form] || ''} form-tag">${esc(a.form)}</span><div class="title-art" style="font-size:20px">${esc(a.title)}</div></div>
          <div class="poster-body"><div class="row"><span class="tag">${esc(a.stage)}</span>${a.rights_status === '已清权' ? '<span class="tag green">已清权</span>' : '<span class="tag amber">待清权</span>'}${a.public_consent ? '<span class="tag cyan">已授权公开</span>' : '<span class="tag">未公开</span>'}</div>
          <div class="xs muted">${esc(a.genre)} · ${a.episodes}集×${a.ep_minutes}分钟 = ${a.total_minutes}分钟</div><p class="xs muted">${esc(a.logline)}</p>
          <div class="row"><button class="btn btn-sm" data-entry="${a.id}"><i class="fa-solid fa-trophy"></i>报名</button><button class="btn btn-sm" data-list="${a.id}"><i class="fa-solid fa-tag"></i>挂牌</button><button class="btn btn-sm" data-proj="${a.id}"><i class="fa-solid fa-clapperboard"></i>申请孵化</button></div></div></div>`).join('')}</div>` : empty('还没有作品档案', '<button class="btn btn-gold btn-sm" id="new-asset2">创建作品档案</button>'))
      ;['#new-asset', '#new-asset2'].forEach((s) => { const b = $(s); if (b) b.onclick = assetModal })
      $$('[data-entry]').forEach((b) => (b.onclick = () => entryModal(d, +b.dataset.entry)))
      $$('[data-list]').forEach((b) => (b.onclick = () => listingModal(d, +b.dataset.list)))
      $$('[data-proj]').forEach((b) => (b.onclick = () => modal('申请孵化（试制包）', `<form id="pj-form"><div class="field"><label>项目总预算（元）</label><input class="input" name="budget_total" type="number" required></div><p class="xs muted">提交后进入“待材料审核”，生成 M0—M4 里程碑台账。入围不是获投。</p><button class="btn btn-gold btn-block" style="margin-top:12px">提交</button></form>`, (mm) => {
        $('#pj-form', mm).onsubmit = async (e) => { e.preventDefault(); const r = await act('/projects', { asset_id: +b.dataset.proj, ...bindForm(e.target) }, '已提交孵化申请'); if (r) closeModal() }
      })))
      if (q.go === 'asset') assetModal()
    },
    async entries(m, d, q) {
      m.innerHTML = head('盛典报名', '报名不自动公开作品或上架影市；提交即锁定版本并生成回执。', `<button class="btn btn-gold btn-sm" id="new-entry"><i class="fa-solid fa-plus"></i>新报名</button>`) +
        (d.entries.length ? `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>届次/赛道</th><th>回执</th><th>授权</th><th>状态</th></tr></thead><tbody>${d.entries.map((e) => { const c = JSON.parse(e.consents || '{}'); return `<tr><td data-l="作品"><b>《${esc(e.title)}》</b></td><td data-l="赛道">${esc(e.edition)}<div class="xs dim">${esc(e.track)}</div></td><td data-l="回执" class="mono xs">${esc(e.receipt_no)}</td><td data-l="授权" class="xs">${Object.entries(c).map(([k, v]) => `<span class="${v ? 'green' : 'dim'}">${v ? '✓' : '✗'}${k}</span>`).join(' ')}</td><td data-l="状态">${statusTag(e.status)}</td></tr>` }).join('')}</tbody></table></div>` : empty('暂无报名'))
      $('#new-entry').onclick = () => entryModal(d)
      if (q.go === 'entry') entryModal(d)
    },
    async projects(m, d) {
      m.innerHTML = head('孵化与制作', '资源账本区分授予、预占、已消费；算力面值不可提现、转售或跨项目转移。') + (d.projects.length ? '<div class="stack" id="pj-list"></div>' : empty('暂无孵化项目，可在“作品与项目”中申请'))
      for (const p of d.projects) {
        const r = await api('/projects/' + p.id)
        const pct = p.compute_grant ? Math.round((p.compute_used / p.compute_grant) * 100) : 0
        const curIdx = r.milestones.findIndex((x) => x.status !== '已通过')
        $('#pj-list').insertAdjacentHTML('beforeend', `<div class="card"><div class="between"><div><b class="h3">《${esc(p.title)}》</b><div class="row" style="margin-top:6px"><span class="tag gold">${esc(p.package)}</span>${statusTag(p.status)}</div></div><div style="text-align:right"><div class="xs dim">项目总预算</div><b class="mono gold">${money(p.budget_total)}</b></div></div>
          <div class="flow" style="margin-top:16px">${r.milestones.map((x, i) => `<div class="flow-step ${x.status === '已通过' ? 'done' : i === curIdx ? 'cur' : ''}"><div class="dot">${x.code}</div><p>${esc(x.name)}<br><span class="xs ${x.status === '已通过' ? 'green' : x.status === '验收中' ? 'gold' : 'dim'}">${esc(x.status)} · ${x.release_pct}%</span></p></div>`).join('')}</div>
          <div class="between xs" style="margin-top:8px"><span>算力额度使用</span><span class="mono">${money(p.compute_used)} / ${money(p.compute_grant)}（${pct}%）</span></div><div class="bar" style="margin-top:6px"><i style="width:${pct}%"></i></div>
          <details style="margin-top:12px"><summary class="xs gold" style="cursor:pointer">资源账本（${r.ledger.length}）</summary>${r.ledger.map((l) => `<div class="between xs" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${statusTag(l.kind)} ${esc(l.note)} · <span class="mono dim">${esc(l.external_id)}</span></span><b class="mono">${money(l.amount)}</b></div>`).join('')}</details></div>`)
      }
    },
    listings(m, d, q) {
      m.innerHTML = head('我的挂牌', '挂牌需单独取得公开授权；平台审核材料与可售范围，不提供价值或成交保证。', `<button class="btn btn-gold btn-sm" id="new-list"><i class="fa-solid fa-plus"></i>发布挂牌</button>`) +
        (d.listings.length ? `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>挂牌</th><th>类型</th><th>权利范围</th><th>可见性</th><th>状态</th></tr></thead><tbody>${d.listings.map((l) => `<tr><td data-l="挂牌" class="full"><a class="gold" href="#/listing/${l.id}">${esc(l.title)}</a></td><td data-l="类型">${esc(l.type)}</td><td data-l="范围" class="xs">${esc(l.territory)} · ${esc(l.media)} · ${esc(l.language)}<br>${esc(l.start_date)}~${esc(l.end_date)} ${l.exclusive ? '· 独家' : ''}</td><td data-l="可见性">${esc(l.visibility)}</td><td data-l="状态">${statusTag(l.status)}</td></tr>`).join('')}</tbody></table></div>` : empty('暂无挂牌'))
      $('#new-list').onclick = () => listingModal(d)
      if (q.go === 'listing') listingModal(d)
    },
    grants(m, d) {
      m.innerHTML = head('资料授权待办', '逐机构批准、限时访问；撤权后旧链接立即失效。') +
        (d.grants.length ? `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>机构</th><th>挂牌</th><th>层级/用途</th><th>NDA</th><th>状态</th><th>操作</th></tr></thead><tbody>${d.grants.map((g) => `<tr><td data-l="机构"><b>${esc(g.requester)}</b><div class="xs dim">${esc(g.org)}</div></td><td data-l="挂牌" class="xs">${esc(g.title)}</td><td data-l="层级">${esc(g.level)}<div class="xs dim">${esc(g.purpose)}</div></td><td data-l="NDA">${g.nda_signed ? '<span class="green">已签</span>' : '—'}</td><td data-l="状态">${statusTag(g.status)}${g.expires_at && g.status === '已批准' ? `<div class="xs dim">至 ${esc(g.expires_at)}</div>` : ''}</td>
          <td data-l="操作"><div class="row">${g.status === '待批准' ? `<button class="btn btn-sm btn-gold" data-g="${g.id}" data-a="approve">批准30天</button><button class="btn btn-sm" data-g="${g.id}" data-a="reject">拒绝</button>` : g.status === '已批准' ? `<button class="btn btn-sm btn-red" data-g="${g.id}" data-a="revoke">撤权</button>` : '—'}</div></td></tr>`).join('')}</tbody></table></div>` : empty('暂无资料申请'))
      $$('[data-g]').forEach((b) => (b.onclick = () => { if (b.dataset.a === 'revoke' && !confirm('确认撤销该机构的资料访问权限？撤权后旧链接立即失效。')) return; act(`/access-grants/${b.dataset.g}/decide`, { action: b.dataset.a, days: 30 }) }))
    },
  }

  function assetModal() {
    modal('创建作品档案', `<form id="asset-form">
      <div class="field"><label>项目名<em>*</em></label><input class="input" name="title" required minlength="2" maxlength="40" placeholder="2—40字"></div>
      <div class="grid2"><div class="field"><label>内容形态<em>*</em></label><select class="input" name="form"><option>AI剧集</option><option>AIGC电影</option><option>微短剧</option><option>AI漫剧</option><option>动画</option></select></div>
      <div class="field"><label>题材</label><input class="input" name="genre" placeholder="如 都市悬疑"></div>
      <div class="field"><label>集数</label><input class="input" name="episodes" type="number" value="12" min="1"></div><div class="field"><label>单集时长（分钟）</label><input class="input" name="ep_minutes" type="number" step="0.5" value="5"></div>
      <div class="field"><label>完成阶段</label><select class="input" name="stage"><option>开发中</option><option>试制中</option><option>制作中</option><option>已成片</option></select></div><div class="field"><label>封面风格</label><select class="input" name="cover"><option value="noir">霓虹黑色</option><option value="myth">东方奇幻</option><option value="scifi">科幻星环</option><option value="tang">古装大唐</option></select></div></div>
      <div class="field"><label>一句话梗概<em>*</em></label><textarea class="input" name="logline" required minlength="10" maxlength="150" placeholder="10—150字"></textarea></div>
      <div class="field"><label>主创团队</label><input class="input" name="team" placeholder="姓名（岗位）、…"></div>
      <div class="field"><label>AI工具及许可说明</label><input class="input" name="ai_tools" placeholder="使用的模型/工具与商业许可"></div>
      <div class="field"><label>权利状态</label><select class="input" name="rights_status"><option>待清权</option><option>已清权</option></select><span class="hint">未获授权项目标记“待清权”，不得进入商业发行承诺。</span></div>
      <button class="btn btn-gold btn-block">创建并生成 V1.0</button></form>`, (m) => {
      $('#asset-form', m).onsubmit = async (e) => { e.preventDefault(); const r = await act('/assets', bindForm(e.target), '作品档案已创建（V1.0）'); if (r) { closeModal(); location.hash = '#/workbench/assets' } }
    })
  }
  async function entryModal(d, assetId) {
    const { editions } = await api('/editions')
    const open = editions.filter((e) => e.status === '报名中')
    if (!d.assets.length) return toast('请先创建作品档案', 'err')
    modal('报名迭代盛典', `<form id="entry-form">
      <div class="field"><label>作品<em>*</em></label><select class="input" name="asset_id">${d.assets.map((a) => `<option value="${a.id}" ${a.id === assetId ? 'selected' : ''}>《${esc(a.title)}》${esc(a.stage)} · ${a.total_minutes}分钟</option>`).join('')}</select></div>
      <div class="field"><label>届次/赛道<em>*</em></label><select class="input" name="track_id" id="track-sel">${open.flatMap((e) => e.tracks.map((t) => `<option value="${t.id}" data-grp="${t.grp}">${esc(e.name)} · ${esc(t.name)}</option>`)).join('')}</select><span class="hint" id="track-hint"></span></div>
      <div id="grp-full"><label class="check"><input type="checkbox" name="has_full_cut"> 已上传完整审片版（MP4 H.264/AAC，≤500MB）</label></div>
      <div id="grp-prop"><div class="grid2"><div class="field"><label>概念片1 时长（秒）</label><input class="input" name="clip1" type="number" placeholder="30—60"></div><div class="field"><label>概念片2 时长（秒）</label><input class="input" name="clip2" type="number" placeholder="30—60"></div></div>
        <label class="check"><input type="checkbox" name="has_budget"> 已提交总预算与算力估算报告</label></div>
      <div class="hr"></div><div class="xs muted" style="margin-bottom:6px">展映/宣传授权（分项同意，默认不授权）</div>
      <label class="check"><input type="checkbox" name="consent_screening"> 现场展映</label><label class="check"><input type="checkbox" name="consent_online"> 网络展映（可能影响渠道首映资格）</label><label class="check"><input type="checkbox" name="consent_promo"> 宣传片段</label>
      <label class="check"><input type="checkbox" name="accept_rules"> 我已阅读并接受当届规则；材料复用不等于自动报名。</label>
      <button class="btn btn-gold btn-block" style="margin-top:10px">提交并锁定版本</button></form>`, (m) => {
      const sel = $('#track-sel', m)
      const sync = () => { const g = sel.selectedOptions[0]?.dataset.grp; $('#grp-full', m).style.display = g === '完成作品' ? '' : 'none'; $('#grp-prop', m).style.display = g === '项目提案' ? '' : 'none'; $('#track-hint', m).textContent = g === '完成作品' ? '需完整叙事成片，不能仅凭概念片参评' : '需两支30—60秒概念片、总预算与算力估算；篇幅≥30分钟' }
      sel.onchange = sync; sync()
      $('#entry-form', m).onsubmit = async (e) => {
        e.preventDefault(); const b = bindForm(e.target); b.clips = [b.clip1, b.clip2].filter(Boolean).map(Number); b.asset_id = +b.asset_id; b.track_id = +b.track_id
        const r = await act('/entries', b, '报名成功')
        if (r) { closeModal(); modal('报名回执', `<div style="text-align:center"><i class="fa-solid fa-circle-check green" style="font-size:44px"></i><h3 class="h2" style="font-size:22px;margin:10px 0">提交成功</h3><p class="mono gold">${esc(r.receipt_no)}</p><p class="small muted">已锁定版本 ${esc(r.locked_version)} · ${esc(r.note)}</p><button class="btn btn-block" data-close style="margin-top:16px">好的</button></div>`) }
      }
    })
  }
  function listingModal(d, assetId) {
    if (!d.assets.length) return toast('请先创建作品档案', 'err')
    const T = ['全球', '中国大陆', '港澳台', '东南亚', '日韩', '北美', '欧洲', '中东', '拉美'], M = ['全媒体', '网络视频', '短剧平台', '电视/IPTV', '院线/展映', '航空/行业']
    modal('发布影市挂牌', `<form id="list-form">
      <div class="field"><label>关联作品<em>*</em></label><select class="input" name="asset_id">${d.assets.map((a) => `<option value="${a.id}" ${a.id === assetId ? 'selected' : ''}>《${esc(a.title)}》· ${esc(a.rights_status)}</option>`).join('')}</select></div>
      <div class="field"><label>交易类型<em>*</em></label><select class="input" name="type"><option>剧本/IP开发</option><option>项目联合开发</option><option>成片版权许可</option><option>发行服务合作</option></select></div>
      <div class="grid2"><div class="field"><label>地区</label><select class="input" name="territory">${T.map((x) => `<option>${x}</option>`).join('')}</select></div><div class="field"><label>媒介</label><select class="input" name="media">${M.map((x) => `<option>${x}</option>`).join('')}</select></div>
      <div class="field"><label>语言</label><select class="input" name="language"><option>中文</option><option>英文</option><option>全语种</option></select></div><div class="field"><label>独家性</label><select class="input" name="exclusive"><option value="">非独家</option><option value="1">独家</option></select></div>
      <div class="field"><label>起始</label><input class="input" type="date" name="start_date" required></div><div class="field"><label>截止</label><input class="input" type="date" name="end_date" required></div>
      <div class="field"><label>报价方式</label><select class="input" name="price_mode"><option>面议</option><option>报价</option></select></div><div class="field"><label>可见性</label><select class="input" name="visibility"><option>公开摘要</option><option>认证机构可见</option></select></div></div>
      <div class="field"><label>挂牌摘要</label><textarea class="input" name="summary" placeholder="不披露剧本全文、预算明细与个人联系方式"></textarea></div>
      <label class="check"><input type="checkbox" name="public_consent"> 我作为权利人/授权代理，单独同意公开该挂牌摘要。</label>
      <button class="btn btn-gold btn-block" style="margin-top:10px">提交审核（系统将校验独家冲突）</button></form>`, (m) => {
      $('#list-form', m).onsubmit = async (e) => { e.preventDefault(); const b = bindForm(e.target); b.asset_id = +b.asset_id; b.exclusive = b.exclusive ? 1 : 0; const r = await act('/listings', b, '已提交挂牌，进入审核'); if (r) closeModal() }
    })
  }

  // ======================= 专家 =======================
  V.expert = {
    overview(m, d) {
      const a = d.assignments
      m.innerHTML = head('待评任务', '接受任务前做利益冲突申报；提交前不可见他人评分，提交后锁定。') +
        kpis([[a.filter((x) => x.status === '待接受').length, '待接受', 'fa-inbox'], [a.filter((x) => x.status === '评审中').length, '评审中', 'fa-pen'], [a.filter((x) => x.status === '已提交').length, '已提交', 'fa-lock'], [a.filter((x) => x.status === '已回避').length, '已回避', 'fa-user-slash']]) +
        (a.length ? `<div class="stack">${a.map((x) => `<div class="card"><div class="between"><div><div class="row"><span class="tag">${esc(x.stage)}</span><span class="tag gold">${esc(x.track)}</span><span class="mono xs dim">${esc(x.receipt_no)} · 版本 ${esc(x.version)}</span></div><b class="h3" style="display:block;margin-top:8px">《${esc(x.title)}》</b><div class="xs muted">${esc(x.form)} · ${esc(x.genre)} · ${x.total_minutes}分钟</div></div>${statusTag(x.status)}</div>
          <p class="small muted" style="margin-top:8px">${esc(x.logline)}</p>
          <div class="row" style="margin-top:12px">${x.status === '待接受' ? `<button class="btn btn-gold btn-sm" data-accept="${x.id}"><i class="fa-solid fa-user-check"></i>利益冲突声明并接受</button>` : x.status === '评审中' ? `<button class="btn btn-gold btn-sm" data-score="${x.id}"><i class="fa-solid fa-star-half-stroke"></i>打分</button>` : x.status === '已提交' ? `<span class="xs dim"><i class="fa-solid fa-lock"></i> 已锁定 · 总分 <b class="gold mono">${x.total}</b> · ${fmtDate(x.submitted_at)}</span>` : `<span class="xs red">已回避：${esc(x.conflict)}</span>`}</div></div>`).join('')}</div>` : empty('暂无分派任务'))
      $$('[data-accept]').forEach((b) => (b.onclick = () => modal('利益冲突声明', `<form id="coi-form"><p class="small muted" style="margin-bottom:10px">请如实申报与该作品团队是否存在以下关系（任一勾选将自动回避并重派）：</p>
        ${['指导教师关系', '同团队/合作关系', '近期商业合作', '已投或拟投该项目', '亲属关系'].map((r) => `<label class="check"><input type="checkbox" name="rel" value="${r}"> ${r}</label>`).join('')}
        <label class="check" style="margin-top:6px"><input type="checkbox" name="nda" required> 我签署保密及利益冲突声明，评审资料不下载、不转发。</label>
        <button class="btn btn-gold btn-block" style="margin-top:10px">确认</button></form>`, (mm) => {
        $('#coi-form', mm).onsubmit = async (e) => { e.preventDefault(); const rel = $$('input[name=rel]:checked', mm).map((i) => i.value); const r = await act(`/reviews/${b.dataset.accept}/accept`, { relations: rel }); if (r) closeModal() }
      })))
      $$('[data-score]').forEach((b) => (b.onclick = () => {
        const x = a.find((y) => y.id === +b.dataset.score); const w = JSON.parse(x.weights)
        modal('评分 ·《' + esc(x.title) + '》', `<form id="score-form"><div class="notice" style="margin-bottom:12px"><i class="fa-solid fa-circle-info"></i><div>每维 1—5 分：1=关键证据缺失；3=基本成立但有待验证项；5=证据充分、可执行性高。每项必须写理由。</div></div>
          ${Object.entries(w).map(([k, v]) => `<div class="card" style="padding:12px;margin-bottom:10px"><div class="between"><b class="small">${k}</b><span class="xs gold">权重 ${v}%</span></div><div class="row" style="margin:8px 0">${[1, 2, 3, 4, 5].map((n) => `<label class="tab" style="padding:6px 14px"><input type="radio" name="s_${k}" value="${n}" required style="display:none"> ${n}</label>`).join('')}</div><input class="input" name="r_${k}" placeholder="评分理由" required></div>`).join('')}
          <div class="field"><label>内部风险意见（不对创作者公开）</label><textarea class="input" name="internal"></textarea></div>
          <div class="field"><label>可反馈意见（将展示给创作者，不含专家身份）</label><textarea class="input" name="feedback"></textarea></div>
          <div class="between"><span class="small">预计综合分：<b class="gold mono" id="live-total">—</b></span><button class="btn btn-gold">提交并锁定</button></div></form>`, (mm) => {
          const upd = () => { let t = 0, all = true; for (const [k, v] of Object.entries(w)) { const s = $(`input[name="s_${k}"]:checked`, mm); if (!s) all = false; else t += (s.value / 5) * v } $('#live-total', mm).textContent = all ? t.toFixed(1) : '—'; $$('label.tab', mm).forEach((l) => l.classList.toggle('active', l.querySelector('input').checked)) }
          $$('input[type=radio]', mm).forEach((i) => (i.onchange = upd))
          $('#score-form', mm).onsubmit = async (e) => {
            e.preventDefault(); const scores = {}, reasons = {}
            for (const k of Object.keys(w)) { scores[k] = +($(`input[name="s_${k}"]:checked`, mm) || {}).value; reasons[k] = mm.querySelector(`[name="r_${k}"]`).value }
            if (!confirm('提交后评分将锁定，修改需主任审批。确认提交？')) return
            const r = await act(`/reviews/${x.id}/submit`, { scores, reasons, comment_internal: mm.querySelector('[name=internal]').value, comment_feedback: mm.querySelector('[name=feedback]').value }, '评分已提交并锁定')
            if (r) { closeModal(); toast(`综合分 ${r.total} · 建议：${r.suggestion}${r.third_review ? ' · 已触发第三评' : ''}`, 'ok') }
          }
        })
      }))
    },
  }

  // ======================= 机构 =======================
  V.institution = {
    overview(m, d) {
      m.innerHTML = head('机构工作台', '需求单、匹配摘要、资料申请、会谈、合同及履约', `<a class="btn btn-gold btn-sm" href="#/market"><i class="fa-solid fa-magnifying-glass"></i>浏览影市</a>`) +
        kpis([[d.grants.length, '资料申请', 'fa-key'], [d.grants.filter((g) => g.status === '已批准').length, '有效授权', 'fa-unlock'], [d.deals.length, '洽谈/合同', 'fa-file-signature'], [d.demands.length, '发布需求', 'fa-bullhorn']]) +
        `<div class="cards c2"><div class="card"><b>资料申请</b>${d.grants.map((g) => `<div class="between small" style="padding:10px 0;border-bottom:1px solid var(--line)"><div><a class="gold" href="#/listing/${g.listing_id}">${esc(g.title)}</a><div class="xs dim">${esc(g.level)} · ${g.expires_at ? '至 ' + esc(g.expires_at) : ''}</div></div>${statusTag(g.status)}</div>`).join('') || '<p class="xs muted">暂无</p>'}</div>
        <div class="card"><b>洽谈与合同</b>${d.deals.map((x) => `<div class="between small" style="padding:10px 0;border-bottom:1px solid var(--line)"><div><b>《${esc(x.title)}》</b><div class="xs dim">${esc(x.territory)} · ${esc(x.media)} · ${x.exclusive ? '独家' : '非独家'}</div></div>${statusTag(x.status)}</div>`).join('') || '<p class="xs muted">暂无</p>'}</div></div>`
    },
    grants(m, d) { V.institution.overview(m, d) },
    deals(m, d) {
      m.innerHTML = head('洽谈与合同', '正式签约生效时系统在事务内原子校验权利冲突；签约不等于已付款。') +
        (d.deals.length ? `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>类型</th><th>权利范围</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>${d.deals.map((x) => `<tr><td data-l="作品"><b>《${esc(x.title)}》</b></td><td data-l="类型">${esc(x.deal_type)}</td><td data-l="范围" class="xs">${esc(x.territory)} · ${esc(x.media)} · ${esc(x.language)}<br>${esc(x.start_date)}~${esc(x.end_date)} ${x.exclusive ? '· 独家' : ''}</td><td data-l="金额" class="mono">${money(x.amount)}</td><td data-l="状态">${statusTag(x.status)}${x.contract_hash ? `<div class="xs dim mono">${esc(x.contract_hash.slice(0, 18))}…</div>` : ''}</td><td data-l="操作">${x.status === '意向' ? `<button class="btn btn-sm btn-gold" data-act="${x.id}">登记签约生效</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>` : empty('暂无洽谈，可在影市挂牌详情页提交意向'))
      $$('[data-act]').forEach((b) => (b.onclick = () => modal('登记签约生效', `<form id="ct-form"><div class="field"><label>合同文本/编号（用于计算校验值）<em>*</em></label><textarea class="input" name="contract_text" required placeholder="粘贴合同文本或唯一编号"></textarea></div><p class="xs muted">首期为人工合同登记；系统将原子锁定权利库存，冲突则阻断并转法务复核。</p><button class="btn btn-gold btn-block" style="margin-top:10px">确认生效</button></form>`, (mm) => {
        $('#ct-form', mm).onsubmit = async (e) => { e.preventDefault(); const r = await act(`/deals/${b.dataset.act}/activate`, bindForm(e.target), '签约已生效，权利已锁定'); if (r) closeModal() }
      })))
    },
    demands(m, d) {
      m.innerHTML = head('需求单', '需求单不是平台采购承诺；运营按题材、地区、资源及权利匹配。') +
        `<div class="cards c2">${d.demands.map((x) => `<div class="card"><div class="between"><b>${esc(x.title)}</b>${statusTag(x.status)}</div><div class="xs muted" style="margin-top:8px">${esc(x.genre)} · ${esc(x.duration)}<br>${esc(x.region)} · ${esc(x.language)}<br>预算带 <span class="gold">${esc(x.budget_band)}</span> · ${esc(x.rights)}</div><div class="xs dim" style="margin-top:8px">截止 ${esc(x.deadline)}</div></div>`).join('') || empty('暂无需求单')}</div>`
    },
  }

  // ======================= 发行 & 财务 =======================
  const releaseTable = (d, canAdvance) => `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品 / 渠道</th><th>地区·语言·媒介</th><th>窗口</th><th>状态</th><th>上线证据</th>${canAdvance ? '<th>操作</th>' : ''}</tr></thead><tbody>
    ${d.releases.map((r) => `<tr><td data-l="作品"><b>《${esc(r.title)}》</b><div class="xs gold">${esc(r.channel)}</div></td><td data-l="范围" class="xs">${esc(r.region)} · ${esc(r.language)} · ${esc(r.media)}</td><td data-l="窗口" class="xs mono">${esc(r.window_start)}<br>${esc(r.window_end)}${r.exclusive ? '<br><span class="red">独家</span>' : ''}</td><td data-l="状态">${statusTag(r.status)}</td><td data-l="证据" class="xs">${r.content_id ? `<span class="mono">${esc(r.content_id)}</span><br><span class="dim">${fmtDate(r.live_at)}</span>` : '<span class="dim">—</span>'}</td>${canAdvance ? `<td data-l="操作"><button class="btn btn-sm btn-gold" data-adv="${r.id}" data-st="${esc(r.status)}">推进 <i class="fa-solid fa-arrow-right"></i></button></td>` : ''}</tr>`).join('')}</tbody></table></div>`
  const stmtTable = (d, canReceipt) => `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>账单</th><th>账期/版本</th><th>毛额</th><th>渠道扣项</th><th>净应收</th><th>已核验实收</th><th>状态</th>${canReceipt ? '<th>操作</th>' : ''}</tr></thead><tbody>
    ${d.statements.map((s) => `<tr><td data-l="账单"><b>《${esc(s.title)}》</b><div class="xs dim">${esc(s.channel)} · ${esc(s.external_id)}</div></td><td data-l="账期" class="mono xs">${esc(s.period)} · v${s.version}</td><td data-l="毛额" class="mono">${money(s.gross)}</td><td data-l="扣项" class="mono">${money(s.channel_fee)}</td><td data-l="净应收" class="mono">${money(s.net)}</td><td data-l="实收" class="mono gold">${money(s.received)}</td><td data-l="状态">${statusTag(s.status)}</td>${canReceipt ? `<td data-l="操作"><div class="row">${s.received < s.net ? `<button class="btn btn-sm btn-gold" data-rc="${s.id}" data-left="${s.net - s.received}">核验回款</button>` : ''}${s.received > 0 ? `<button class="btn btn-sm" data-st="${s.id}">生成分账</button>` : ''}</div></td>` : ''}</tr>`).join('') || `<tr><td colspan="8" class="dim" style="text-align:center">暂无账单</td></tr>`}</tbody></table></div>`
  const settleList = (d, canApprove) => d.settlements.length ? `<div class="stack">${d.settlements.map((s) => { const r = JSON.parse(s.result); return `<div class="card"><div class="between"><b>结算单 #${s.id} · 账单 #${s.statement_id}</b>${statusTag(s.status)}</div><div class="xs muted" style="margin:6px 0">实收基数 <b class="gold">${money(r.received)}</b> · ${r.balanced ? '勾稽平衡' : '不平衡'}</div>${r.steps.map((x) => `<div class="between xs" style="padding:4px 0"><span>${esc(x.item)}</span><span class="mono">${money(x.amount)}</span></div>`).join('')}${canApprove && s.status === '待审批' ? `<button class="btn btn-sm btn-gold" style="margin-top:10px" data-ap="${s.id}">财务审批</button>` : ''}</div>` }).join('')}</div>` : empty('暂无结算单')
  function bindFinance(d) {
    $$('[data-adv]').forEach((b) => (b.onclick = () => {
      const st = b.dataset.st
      if (st === '待上线') return modal('确认上线', `<form id="live-form"><div class="notice" style="margin-bottom:12px"><i class="fa-solid fa-circle-info"></i><div>计划日期、渠道审批、已上架和实际可观看为不同字段；无证据保持“待核实”，不伪造成功回调。release.live 不触发收入或付款。</div></div><div class="field"><label>渠道内容ID<em>*</em></label><input class="input" name="content_id" required></div><div class="field"><label>可用性证据（截图存证号/链接）<em>*</em></label><input class="input" name="evidence" required></div><button class="btn btn-gold btn-block">确认已上线</button></form>`, (mm) => {
        $('#live-form', mm).onsubmit = async (e) => { e.preventDefault(); const r = await act(`/releases/${b.dataset.adv}/advance`, bindForm(e.target), '已确认上线'); if (r) closeModal() }
      })
      act(`/releases/${b.dataset.adv}/advance`, {}, '状态已推进')
    }))
    $$('[data-rc]').forEach((b) => (b.onclick = () => modal('核验银行回款', `<form id="rc-form"><div class="field"><label>银行回款凭证号<em>*</em></label><input class="input" name="bank_ref" required placeholder="付款截图不能认定实收"></div><div class="field"><label>本次分配金额（剩余应收 ${money(+b.dataset.left)}）<em>*</em></label><input class="input" name="amount" type="number" step="0.01" required></div><button class="btn btn-gold btn-block">确认实收</button></form>`, (mm) => {
      $('#rc-form', mm).onsubmit = async (e) => { e.preventDefault(); const f = bindForm(e.target); const r = await act(`/statements/${b.dataset.rc}/receipt`, { bank_ref: f.bank_ref, amount: +f.amount }, '回款已核验'); if (r) closeModal() }
    })))
    $$('[data-st]').forEach((b) => { if (!b.dataset.adv) b.onclick = () => modal('生成分账结算单', `<form id="st-form"><p class="xs muted" style="margin-bottom:10px">按合同规则快照计算；仅基于已核验实收。</p><div class="grid2"><div class="field"><label>发行佣金 %</label><input class="input" name="commission_pct" value="10"></div><div class="field"><label>已批准宣发费</label><input class="input" name="promo" value="10000"></div><div class="field"><label>可回收投资余额</label><input class="input" name="recoup" value="40000"></div><div class="field"><label>创作方分成 %</label><input class="input" name="creator_pct" value="60"></div></div><button class="btn btn-gold btn-block">生成（待财务审批）</button></form>`, (mm) => {
      $('#st-form', mm).onsubmit = async (e) => { e.preventDefault(); const f = bindForm(e.target); const r = await act('/settlements', { statement_id: +b.dataset.st, commission_pct: +f.commission_pct, promo: +f.promo, recoup: +f.recoup, creator_pct: +f.creator_pct }, '结算单已生成'); if (r) closeModal() }
    }) })
    $$('[data-ap]').forEach((b) => (b.onclick = () => act(`/settlements/${b.dataset.ap}/approve`, {}, '已审批，可执行约定付款')))
  }
  function importModal(d) {
    modal('导入渠道报表', `<form id="im-form"><div class="field"><label>发行实例<em>*</em></label><select class="input" name="release_id">${d.releases.map((r) => `<option value="${r.id}">#${r.id}《${esc(r.title)}》· ${esc(r.channel)}</option>`).join('')}</select></div>
      <div class="grid2"><div class="field"><label>结算期间<em>*</em></label><input class="input" name="period" value="2027-01" required></div><div class="field"><label>外部单据ID<em>*</em></label><input class="input" name="external_id" value="ST-202701-001" required></div>
      <div class="field"><label>报表版本</label><input class="input" name="version" type="number" value="1"></div><div class="field"><label>币种</label><input class="input" name="currency" value="CNY"></div>
      <div class="field"><label>毛额<em>*</em></label><input class="input" name="gross" type="number" value="100000" required></div><div class="field"><label>渠道已扣费用</label><input class="input" name="channel_fee" type="number" value="20000"></div></div>
      <p class="xs muted">同渠道、账期、外部单据ID及版本用幂等键去重；更正版保留原始并标记被更正。</p><button class="btn btn-gold btn-block" style="margin-top:10px">导入</button></form>`, (mm) => {
      $('#im-form', mm).onsubmit = async (e) => { e.preventDefault(); const f = bindForm(e.target); const r = await act('/statements/import', { ...f, release_id: +f.release_id, version: +f.version, gross: +f.gross, channel_fee: +f.channel_fee }); if (r) closeModal() }
    })
  }
  async function newReleaseModal(d) {
    const { channels } = await api('/channels')
    modal('新建发行计划', `<form id="rl-form"><div class="field"><label>来源合同<em>*</em></label><select class="input" name="deal">${d.deals.map((x) => `<option value="${x.id}|${x.asset_id}">#${x.id}《${esc(x.title)}》· ${esc(x.territory)} ${esc(x.media)} · ${esc(x.status)}</option>`).join('')}</select></div>
      <div class="field"><label>渠道<em>*</em></label><select class="input" name="channel_id">${channels.map((c) => `<option value="${c.id}">${esc(c.name)}（${esc(c.biz_status)}）</option>`).join('')}</select></div>
      <div class="grid2"><div class="field"><label>地区</label><input class="input" name="region" value="中国大陆"></div><div class="field"><label>媒介</label><input class="input" name="media" value="网络视频"></div><div class="field"><label>语言</label><input class="input" name="language" value="中文"></div><div class="field"><label>独家</label><select class="input" name="exclusive"><option value="1">是</option><option value="">否</option></select></div>
      <div class="field"><label>窗口起</label><input class="input" type="date" name="window_start" value="2027-02-01"></div><div class="field"><label>窗口止</label><input class="input" type="date" name="window_end" value="2027-12-31"></div></div>
      <button class="btn btn-gold btn-block">创建（状态：计划）</button></form>`, (mm) => {
      $('#rl-form', mm).onsubmit = async (e) => { e.preventDefault(); const f = bindForm(e.target); const [deal_id, asset_id] = f.deal.split('|').map(Number); const r = await act('/releases', { ...f, deal_id, asset_id, channel_id: +f.channel_id, exclusive: f.exclusive ? 1 : 0 }, '发行计划已创建'); if (r) closeModal() }
    })
  }
  V.distributor = {
    overview(m, d) {
      m.innerHTML = head('发行实例', '“作品版本＋渠道账号＋地区＋语言＋窗口”为一个发行实例，审核、上线与回款互不覆盖。', `<button class="btn btn-gold btn-sm" id="new-rl"><i class="fa-solid fa-plus"></i>新建发行计划</button>`) +
        kpis([[d.releases.length, '发行实例', 'fa-satellite-dish'], [d.releases.filter((r) => r.status === '已上线').length, '已上线', 'fa-circle-play'], [d.statements.length, '渠道账单', 'fa-file-invoice'], [money(d.statements.reduce((a, s) => a + s.received, 0)), '已核验实收', 'fa-sack-dollar']]) +
        releaseTable(d, true) + `<p class="xs dim" style="margin-top:10px">推进规则：权利就绪需覆盖窗口的有效许可；候选渠道不得送审；上线需内容ID与证据。</p>`
      $('#new-rl').onclick = () => newReleaseModal(d); bindFinance(d)
    },
    statements(m, d) { m.innerHTML = head('报表对账', '账单应收≠实收；一笔回款可对应多张账单，未分配款不自动派发。', `<button class="btn btn-gold btn-sm" id="imp"><i class="fa-solid fa-file-import"></i>导入报表</button>`) + stmtTable(d, false); $('#imp').onclick = () => importModal(d); bindFinance(d) },
    settlements(m, d) { m.innerHTML = head('分账结算', '财务审批锁定结算快照；调整需冲正及新审批。') + settleList(d, false); bindFinance(d) },
    deals(m, d) { m.innerHTML = head('合同与权利占用', '发行计划复用交易权利库存，不重复锁同一合同。') + `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>范围</th><th>状态</th><th>合同校验值</th></tr></thead><tbody>${d.deals.map((x) => `<tr><td data-l="作品"><b>《${esc(x.title)}》</b></td><td data-l="范围" class="xs">${esc(x.territory)} · ${esc(x.media)} · ${esc(x.start_date)}~${esc(x.end_date)} ${x.exclusive ? '独家' : ''}</td><td data-l="状态">${statusTag(x.status)}</td><td data-l="校验值" class="mono xs">${esc(x.contract_hash || '—')}</td></tr>`).join('')}</tbody></table></div>` },
  }
  V.finance = {
    overview(m, d) { m.innerHTML = head('报表对账与回款核验', '发行经理可核商务事实，不可单独确认到账；财务对账、付款批准和执行按岗位隔离。', `<button class="btn btn-gold btn-sm" id="imp"><i class="fa-solid fa-file-import"></i>导入报表</button>`) + kpis([[d.statements.length, '账单', 'fa-file-invoice'], [money(d.statements.reduce((a, s) => a + s.net, 0)), '净应收', 'fa-scale-balanced'], [money(d.statements.reduce((a, s) => a + s.received, 0)), '已核验实收', 'fa-sack-dollar'], [d.settlements.filter((s) => s.status === '待审批').length, '待审批结算', 'fa-stamp']]) + stmtTable(d, true); $('#imp').onclick = () => importModal(d); bindFinance(d) },
    settlements(m, d) { m.innerHTML = head('分账审批', 'settlement.approved 才可执行约定付款。') + settleList(d, true); bindFinance(d) },
    audit: (m) => V.operator.audit(m),
  }

  // ======================= 联合运营 =======================
  V.operator = {
    overview(m, d) {
      const mt = d.metrics
      m.innerHTML = head('联合运营管理台', '分域队列、规则、审批、风险、审计和数据看板；评奖、交易、财务权限分离。') +
        kpis([[mt.users, '注册用户', 'fa-users'], [mt.entries, '盛典报名', 'fa-trophy'], [mt.reviews, '已提交评审', 'fa-list-check'], [mt.deals, '交易', 'fa-handshake']]) +
        `<div class="cards c3">${[['挂牌待审核', d.queue.listings.length, '#/workbench/listings', 'fa-tag'], ['荣誉待批准/发布', d.queue.awards.filter((a) => ['待批准', '未公开'].includes(a.status)).length, '#/workbench/awards', 'fa-award'], ['待处理工单', d.queue.tickets.filter((t) => t.status === '待处理').length, '#/workbench/tickets', 'fa-ticket']].map(([l, n, h, i]) => `<a class="card hover kpi" href="${h}"><i class="fa-solid ${i} gold" style="float:right"></i><b>${n}</b><span>${l}</span></a>`).join('')}</div>
        <div class="card" style="margin-top:16px"><b>最新工单</b>${d.queue.tickets.slice(0, 6).map((t) => `<div class="between small" style="padding:9px 0;border-bottom:1px solid var(--line)"><div><span class="tag">${esc(t.kind)}</span> ${esc(t.detail)}</div><span class="xs dim">${fmtDate(t.created_at)}</span></div>`).join('')}</div>`
    },
    entries(m, d) {
      m.innerHTML = head('报名与专家分派', '每份分派绑定规则、作品版本与专家；每项目至少两名无利益冲突专家。') +
        `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>赛道</th><th>回执</th><th>状态</th><th>操作</th></tr></thead><tbody>${d.queue.entries.map((e) => `<tr><td data-l="作品"><b>《${esc(e.title)}》</b></td><td data-l="赛道">${esc(e.track)}</td><td data-l="回执" class="mono xs">${esc(e.receipt_no)}</td><td data-l="状态">${statusTag(e.status)}</td><td data-l="操作"><div class="row"><button class="btn btn-sm" data-asg="${e.id}">分派专家</button>${e.status !== '获奖' ? `<button class="btn btn-sm btn-gold" data-nom="${e.id}" data-track="${e.track_id}">提名获奖</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>`
      $$('[data-asg]').forEach((b) => (b.onclick = () => modal('分派专家', `<form id="as-form"><div class="field"><label>专家</label><select class="input" name="expert_id">${d.experts.map((x) => `<option value="${x.id}">${esc(x.name)} · ${esc(x.title)}</option>`).join('')}</select></div><div class="field"><label>阶段</label><select class="input" name="stage"><option>初审</option><option>复审</option><option>终审</option></select></div><button class="btn btn-gold btn-block">分派</button></form>`, (mm) => {
        $('#as-form', mm).onsubmit = async (e) => { e.preventDefault(); const f = bindForm(e.target); const r = await act('/ops/assign', { entry_id: +b.dataset.asg, expert_id: +f.expert_id, stage: f.stage }, '已分派'); if (r) closeModal() }
      })))
      $$('[data-nom]').forEach((b) => (b.onclick = async () => {
        const { editions } = await api('/editions'); const awards = editions.flatMap((e) => e.tracks).find((t) => t.id === +b.dataset.track)?.awards || []
        modal('提名获奖（审批人1）', `<form id="nm-form"><div class="field"><label>奖项</label><select class="input" name="award_id">${awards.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div><p class="xs muted">提名后需另一名授权人批准，进入未公开结果库，再定时/现场发布。</p><button class="btn btn-gold btn-block" style="margin-top:10px">提交提名</button></form>`, (mm) => {
          $('#nm-form', mm).onsubmit = async (e) => { e.preventDefault(); const r = await act('/ops/award-results', { entry_id: +b.dataset.nom, award_id: +bindForm(e.target).award_id }); if (r) closeModal() }
        })
      }))
    },
    awards(m, d) {
      m.innerHTML = head('颁奖与荣誉', '待批准 → 未公开 → 有效；撤销保留更正记录，徽章即时失效并通知交易方。') +
        `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>奖项</th><th>审批</th><th>状态</th><th>操作</th></tr></thead><tbody>${d.queue.awards.map((a) => `<tr><td data-l="作品"><b>《${esc(a.title)}》</b></td><td data-l="奖项">${esc(a.award)}</td><td data-l="审批" class="xs">审批人1 #${a.approver1 || '—'} / 审批人2 #${a.approver2 || '—'}</td><td data-l="状态">${statusTag(a.status)}</td><td data-l="操作"><div class="row">
          ${a.status === '待批准' ? `<button class="btn btn-sm btn-gold" data-ar="${a.id}" data-a="approve">第二人批准</button>` : ''}${a.status === '未公开' ? `<button class="btn btn-sm btn-gold" data-ar="${a.id}" data-a="publish">发布</button>` : ''}${a.status === '有效' ? `<button class="btn btn-sm btn-red" data-ar="${a.id}" data-a="revoke">撤销</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>
        <p class="xs dim" style="margin-top:10px">提示：第二审批人需使用另一运营账号（如 ops2@demo.cn）。</p>`
      $$('[data-ar]').forEach((b) => (b.onclick = async () => {
        let body = {}
        if (b.dataset.a === 'revoke') { const reason = prompt('请填写撤销原因（将保留更正记录）'); if (!reason) return; body.reason = reason }
        else if (!confirm(b.dataset.a === 'publish' ? '确认发布？将生成电子证书并创建挂牌邀请（不自动上架）。' : '确认批准？')) return
        const r = await act(`/ops/award-results/${b.dataset.ar}/${b.dataset.a}`, body)
        if (r && r.certificate) toast('已发布，证书 ' + r.certificate, 'ok')
      }))
    },
    listings(m, d) {
      m.innerHTML = head('挂牌审核', '审核的是材料与可售范围；未清权作品不能发布。') +
        (d.queue.listings.length ? `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>挂牌</th><th>权利范围</th><th>清权</th><th>操作</th></tr></thead><tbody>${d.queue.listings.map((l) => `<tr><td data-l="挂牌" class="full"><b>${esc(l.title)}</b><div class="xs dim">${esc(l.type)}</div></td><td data-l="范围" class="xs">${esc(l.territory)} · ${esc(l.media)} · ${esc(l.language)} ${l.exclusive ? '· 独家' : ''}</td><td data-l="清权">${l.rights_status === '已清权' ? '<span class="tag green">已清权</span>' : '<span class="tag amber">待清权</span>'}</td><td data-l="操作"><div class="row"><button class="btn btn-sm btn-gold" data-lr="${l.id}" data-a="approve">发布</button><button class="btn btn-sm" data-lr="${l.id}" data-a="reject">退回补件</button></div></td></tr>`).join('')}</tbody></table></div>` : empty('暂无待审核挂牌'))
      $$('[data-lr]').forEach((b) => (b.onclick = () => { const reason = b.dataset.a === 'reject' ? prompt('退回原因（具体缺项）') : ''; if (b.dataset.a === 'reject' && !reason) return; act(`/ops/listings/${b.dataset.lr}/review`, { action: b.dataset.a, reason }) }))
    },
    tickets(m, d) {
      m.innerHTML = head('工单队列', '回避重派、第三评、法务复核、挂牌邀请、交易复核等跨模块事件统一进入人工处理队列。') +
        `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>#</th><th>类型</th><th>对象</th><th>说明</th><th>状态</th><th>时间</th></tr></thead><tbody>${d.queue.tickets.map((t) => `<tr><td data-l="#" class="mono">${t.id}</td><td data-l="类型"><span class="tag gold">${esc(t.kind)}</span></td><td data-l="对象" class="mono xs">${esc(t.object)}</td><td data-l="说明" class="full small">${esc(t.detail)}</td><td data-l="状态">${statusTag(t.status)}</td><td data-l="时间" class="xs dim">${fmtDate(t.created_at)}</td></tr>`).join('')}</tbody></table></div>`
    },
    async audit(m) {
      const { logs, events } = await api('/ops/audit')
      m.innerHTML = head('审计日志与事件 Outbox', '所有写操作留痕：操作者、对象、动作、原因、时间；事件按 event_id 幂等投递。') +
        `<div class="cards split"><div class="card"><b>审计日志（最近100条）</b><div class="timeline" style="margin-top:12px">${logs.map((l) => `<div class="tl-item"><div class="between small"><b>${esc(l.actor)}</b><span class="xs dim">${fmtDate(l.created_at)}</span></div><div class="xs"><span class="mono gold">${esc(l.action)}</span> · <span class="mono">${esc(l.object)}</span></div>${l.detail ? `<div class="xs muted">${esc(l.detail)}</div>` : ''}</div>`).join('')}</div></div>
        <div class="card"><b>事件 Outbox</b>${events.map((e) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="between xs"><span class="mono gold">${esc(e.topic)}</span><span class="dim">${fmtDate(e.created_at)}</span></div><div class="xs dim mono" style="word-break:break-all">${esc(e.event_id)} ${esc(e.payload)}</div></div>`).join('') || '<p class="xs muted">暂无事件</p>'}</div></div>`
    },
  }
})()
