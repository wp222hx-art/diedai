/* 迭影计划 · 视频播放器 / 作品上传 / 专家评审 / 统一管理后台 */
(function () {
  const R = window.ROUTES
  const fmtT = (s) => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
  const fmtMB = (b) => (b ? (b / 1048576).toFixed(1) + ' MB' : '')
  const VST = { 待审核: 'amber', 已上线: 'green', 已驳回: 'red', 已替换: '' }
  const vTag = (s) => `<span class="tag ${VST[s] || ''}">${esc(s || '未上传')}</span>`
  const isOp = () => S.user && ['operator', 'admin', 'finance'].includes(S.user.role)

  // =====================================================================
  // 播放器：点击播放 · 播放/完播统计 · 观看时长（专家评审门槛）
  // =====================================================================
  function playerHTML(v, opt = {}) {
    if (!v) return `<div class="vp vp-empty"><div><i class="fa-regular fa-circle-play"></i><p>${opt.emptyText || '作品视频尚未上传'}</p></div></div>`
    const badge = v.status && v.status !== '已上线' ? `<span class="vp-badge">${esc(v.status)}</span>` : ''
    if (v.player.type === 'external') return `<div class="vp vp-empty">${badge}<div><i class="fa-solid fa-up-right-from-square"></i><p>该平台不支持站内嵌入</p><a class="btn btn-gold btn-sm" target="_blank" rel="noopener" href="${esc(v.player.src)}">前往原平台观看</a></div></div>`
    return `<div class="vp" data-vp="${v.id}">${badge}
      <div class="vp-cover" role="button" tabindex="0" aria-label="播放视频">
        <span class="vp-play"><i class="fa-solid fa-play"></i></span>
        <div class="vp-meta"><b>${esc(v.title || '作品视频')}</b><span>${v.duration ? fmtT(v.duration) : ''}${v.player.type === 'iframe' ? ' · 第三方平台' : ''}${v.plays ? ' · ' + v.plays.toLocaleString() + ' 次播放' : ''}</span></div>
      </div>
      <div class="vp-frame"></div>
      <div class="vp-corner tl"></div><div class="vp-corner tr"></div><div class="vp-corner bl"></div><div class="vp-corner br"></div>
    </div>`
  }
  function mountPlayer(root, v, opt = {}) {
    const el = root && root.querySelector('[data-vp]')
    if (!el || !v) return
    const cover = el.querySelector('.vp-cover'), frame = el.querySelector('.vp-frame')
    let watched = opt.watched || 0, last = 0, lastSent = 0, played = false
    const send = (type) => fetch('/api/media/' + v.id + '/event', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(S.token ? { Authorization: 'Bearer ' + S.token } : {}) }, body: JSON.stringify({ type, watched: Math.round(watched) }), keepalive: true }).catch(() => {})
    const start = () => {
      el.classList.add('on')
      if (v.player.type === 'iframe') {
        frame.innerHTML = `<iframe src="${esc(v.player.src)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade" title="作品视频"></iframe>`
        const k = 'vp-play-' + v.id
        if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, 1); send('play') }
        return
      }
      frame.innerHTML = `<video controls playsinline preload="auto" src="${esc(v.player.src)}${v.player.src.startsWith('/api/') && v.status !== '已上线' && S.token ? '?token=' + encodeURIComponent(S.token) : ''}"></video>`
      const vid = frame.querySelector('video')
      vid.addEventListener('play', () => {
        if (played) return; played = true
        const k = 'vp-play-' + v.id
        if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, 1); send('play') }
      })
      vid.addEventListener('timeupdate', () => {
        const d = vid.currentTime - last; last = vid.currentTime
        if (d > 0 && d < 1.6) watched = Math.min(watched + d, vid.duration || v.duration || 1e9)
        opt.onWatch && opt.onWatch(watched, vid.duration || v.duration)
        if (opt.track && watched - lastSent >= 4) { lastSent = watched; send('progress') }
      })
      vid.addEventListener('seeked', () => (last = vid.currentTime))
      vid.addEventListener('pause', () => opt.track && send('progress'))
      vid.addEventListener('ended', () => { send('finish'); opt.onWatch && opt.onWatch(watched, vid.duration) })
      vid.play().catch(() => {})
    }
    cover.onclick = start
    cover.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start() } }
  }
  window.VPlayer = { html: playerHTML, mount: mountPlayer }

  // =====================================================================
  // 上传 / 外链提交（创作者，运营可代传）
  // =====================================================================
  function readDuration(file) {
    return new Promise((res) => {
      const v = document.createElement('video'); v.preload = 'metadata'
      v.onloadedmetadata = () => { res(isFinite(v.duration) ? Math.round(v.duration) : 0); URL.revokeObjectURL(v.src) }
      v.onerror = () => res(0)
      v.src = URL.createObjectURL(file)
    })
  }
  function openUpload(app, onDone) {
    modal(`上传作品视频 · ${esc(app.title)}`, `
      <div class="ly-seg" id="up-seg" style="margin-bottom:16px"><button type="button" class="on" data-v="file">本地文件</button><button type="button" data-v="link">平台链接</button></div>
      <form id="up-file">
        <label class="up-drop" id="up-drop"><input type="file" accept="video/mp4,video/webm,video/quicktime" hidden>
          <i class="fa-solid fa-cloud-arrow-up"></i><b>点击选择或拖入视频文件</b><span class="xs muted">MP4 / WebM / MOV，单个 ≤ 300MB；建议 H.264 · 1080p</span></label>
        <div id="up-info" class="small" style="margin:10px 0"></div>
        <div class="up-bar" hidden><i></i></div><div id="up-pct" class="xs muted mono"></div>
        <button class="btn btn-gold btn-block" disabled>开始上传</button>
      </form>
      <form id="up-link" hidden>
        <div class="field"><label>视频链接<em>*</em></label><input class="input" name="url" placeholder="https://www.bilibili.com/video/BV… 或 .mp4 直链"><span class="hint">支持 B站 / 腾讯视频 / 优酷 / YouTube / Vimeo 站内嵌入播放；抖音、网盘等将以外链方式展示</span></div>
        <div class="grid2"><div class="field"><label>标题</label><input class="input" name="title" placeholder="如：正片 / 先导预告"></div><div class="field"><label>时长（秒，选填）</label><input class="input" type="number" name="duration" min="1"></div></div>
        <button class="btn btn-gold btn-block">提交链接</button>
      </form>
      <p class="xs dim" style="margin-top:12px"><i class="fa-solid fa-shield-halved"></i> 提交后进入运营审核，审核通过即在作品页公开播放；重新上传将替换原视频。请确认拥有作品全部素材的合法授权。</p>`, (m) => {
      const seg = $('#up-seg', m), ff = $('#up-file', m), lf = $('#up-link', m)
      $$('button', seg).forEach((b) => (b.onclick = () => { $$('button', seg).forEach((x) => x.classList.toggle('on', x === b)); ff.hidden = b.dataset.v !== 'file'; lf.hidden = b.dataset.v !== 'link' }))
      let file = null, dur = 0
      const inp = $('input[type=file]', m), drop = $('#up-drop', m), btn = $('button', ff)
      const pick = async (f) => {
        if (!f) return
        if (!/^video\/(mp4|webm|quicktime)$/.test(f.type)) return toast('仅支持 MP4 / WebM / MOV', 'err')
        if (f.size > 300 * 1048576) return toast('文件超过 300MB，请压缩或使用平台链接', 'err')
        file = f; dur = await readDuration(f)
        $('#up-info', m).innerHTML = `<i class="fa-solid fa-film gold"></i> ${esc(f.name)} · ${fmtMB(f.size)}${dur ? ' · ' + fmtT(dur) : ''}`
        btn.disabled = false
      }
      inp.onchange = () => pick(inp.files[0])
      drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over') }
      drop.ondragleave = () => drop.classList.remove('over')
      drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); pick(e.dataTransfer.files[0]) }
      ff.onsubmit = (e) => {
        e.preventDefault(); if (!file) return
        btn.disabled = true; btn.textContent = '上传中…'
        const bar = $('.up-bar', m); bar.hidden = false
        const x = new XMLHttpRequest()
        x.open('POST', `/api/program/apps/${app.id}/video`)
        x.setRequestHeader('Content-Type', file.type)
        x.setRequestHeader('Authorization', 'Bearer ' + S.token)
        x.setRequestHeader('x-file-name', encodeURIComponent(file.name))
        if (dur) x.setRequestHeader('x-duration', String(dur))
        x.upload.onprogress = (ev) => { if (ev.lengthComputable) { const p = (ev.loaded / ev.total) * 100; $('i', bar).style.width = p + '%'; $('#up-pct', m).textContent = `${p.toFixed(0)}% · ${fmtMB(ev.loaded)} / ${fmtMB(ev.total)}` } }
        x.onload = () => {
          let d = {}; try { d = JSON.parse(x.responseText) } catch {}
          if (x.status >= 200 && x.status < 300) { closeModal(); toast('上传成功，已提交运营审核', 'ok'); onDone && onDone() }
          else { errToast(d); btn.disabled = false; btn.textContent = '重新上传' }
        }
        x.onerror = () => { toast('网络异常，上传中断', 'err'); btn.disabled = false; btn.textContent = '重新上传' }
        x.send(file)
      }
      lf.onsubmit = async (e) => {
        e.preventDefault()
        try { await api(`/program/apps/${app.id}/video`, { body: { url: lf.url.value.trim(), title: lf.title.value, duration: +lf.duration.value || null } }); closeModal(); toast('链接已提交，等待运营审核', 'ok'); onDone && onDone() } catch (er) { errToast(er) }
      }
    })
  }
  window.openVideoUpload = openUpload

  // 作品页注入播放器（program.js 的 R.vote 渲染后调用）
  window.mountWorkVideo = async (slot, a) => {
    if (!slot) return
    let v = null
    try { v = (await api('/program/apps/' + a.code + '/video')).video } catch {}
    const mine = S.user && (S.user.id === a.user_id || isOp())
    slot.innerHTML = playerHTML(v, { emptyText: mine ? '还没有上传作品视频' : '作品视频审核中 / 尚未上传' }) +
      (mine ? `<div class="vp-owner"><span class="xs muted">${v ? `当前视频：${vTag(v.status)} ${v.reject_reason ? '<span class="red xs">驳回原因：' + esc(v.reject_reason) + '</span>' : ''}` : '上传后经运营审核即可公开播放、参与评选'}</span><button class="btn btn-sm btn-gold" id="vp-up"><i class="fa-solid fa-cloud-arrow-up"></i>${v ? '更换视频' : '上传视频'}</button></div>` : '')
    mountPlayer(slot, v)
    const b = $('#vp-up', slot); if (b) b.onclick = () => openUpload(a, () => window.mountWorkVideo(slot, a))
  }

  // =====================================================================
  // 专家评审工作台  #/review   #/review/:appId
  // =====================================================================
  R.review = async (app, p) => {
    if (!S.user) return needLogin(app, '专家登录后进入评审工作台')
    if (!['expert', 'operator'].includes(S.user.role)) { app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-user-lock"></i>评审工作台仅向受邀评审专家开放</div></div>`; return }
    const d = await api('/review/queue')
    if (p[0]) return reviewDetail(app, d, +p[0])
    const done = d.rows.filter((x) => x.rstatus === '已提交' || x.rstatus === '已回避').length
    app.innerHTML = `<div class="wrap section" style="padding-top:26px">
      <div class="adm-head"><div><div class="pg-label">评审工作台 · Jury Console</div><h1 class="h2">作品评审</h1></div>
        <div class="adm-kpis"><div><b>${d.rows.length}</b><span>待评作品</span></div><div><b>${done}</b><span>已完成</span></div><div><b>${Math.round(d.min_watch * 100)}%</b><span>观看门槛</span></div></div></div>
      <div class="notice" style="margin:16px 0 20px"><i class="fa-solid fa-circle-info"></i><div>评分维度：${d.criteria.map(([, l, w]) => `${l} ${w}%`).join(' · ')}。每项 1—10 分，折算百分制。须观看 ≥${Math.round(d.min_watch * 100)}% 时长后方可提交；与作品存在师生、雇佣、亲属、投资等关系请申请回避。提交后锁定不可修改。</div></div>
      <div class="rv-list">${d.rows.map((x) => `<a class="rv-item" href="#/review/${x.id}">
        <div class="rv-thumb"><i class="fa-solid fa-play"></i><span class="mono xs">${x.duration ? fmtT(x.duration) : '—'}</span></div>
        <div class="rv-body"><b>${esc(x.title)}</b><div class="xs muted">${esc(x.team)} · ${esc(x.track)} · ${esc(x.form)}</div><p class="xs dim">${esc(x.logline)}</p></div>
        <div class="rv-st">${x.rstatus === '已提交' ? `<span class="tag green">已评 ${x.my_total}</span>` : x.rstatus === '已回避' ? '<span class="tag">已回避</span>' : x.rstatus === '观看中' ? `<span class="tag cyan">观看中 ${fmtT(x.watched_sec)}</span>` : '<span class="tag amber">待评审</span>'}</div></a>`).join('') || '<div class="empty"><i class="fa-regular fa-folder-open"></i>暂无待评审作品（作品视频审核上线后进入评审队列）</div>'}</div>
    </div>`
  }
  async function reviewDetail(app, d, id) {
    const x = d.rows.find((r) => r.id === id)
    if (!x) { app.innerHTML = `<div class="wrap section"><div class="empty">作品不在你的评审队列中</div></div>`; return }
    const v = (await api('/program/apps/' + x.code + '/video')).video
    const locked = x.rstatus === '已提交' || x.rstatus === '已回避'
    const need = v && v.duration ? Math.ceil(v.duration * d.min_watch) : 0
    const isExpert = S.user.role === 'expert'
    app.innerHTML = `<div class="wrap section" style="padding-top:22px">
      <a class="xs muted" href="#/review">← 评审队列</a>
      <div class="rv-grid">
        <div><div id="rv-player">${playerHTML(v)}</div>
          <div class="pg-label" style="margin-top:18px">${esc(x.track)} · ${esc(x.form)}${x.minutes ? ' · 全片约 ' + x.minutes + ' 分钟' : ''}</div>
          <h1 class="pg-title" style="font-size:clamp(24px,3.6vw,34px)">${esc(x.title)}</h1>
          <p class="muted small">${esc(x.team)}${x.school ? ' · ' + esc(x.school) : ''}</p><p style="margin-top:8px">${esc(x.logline)}</p>
          ${need ? `<div class="rv-watch"><div class="between xs"><span>已观看 <b id="rv-w" class="mono">${fmtT(x.watched_sec || 0)}</b> / 需 ${fmtT(need)}</span><span id="rv-ok" class="${(x.watched_sec || 0) >= need ? 'green' : 'muted'}">${(x.watched_sec || 0) >= need ? '已达评审门槛' : '未达门槛'}</span></div><div class="up-bar"><i id="rv-bar" style="width:${Math.min(100, ((x.watched_sec || 0) / need) * 100)}%"></i></div></div>` : ''}
        </div>
        <aside class="rv-panel">
          ${locked ? `<div class="empty" style="border-style:solid"><i class="fa-solid fa-lock"></i>${x.rstatus === '已回避' ? '你已申请回避本作品' : `评审已提交并锁定 · 总分 <b class="mono">${x.my_total}</b>`}</div>` : !isExpert ? `<div class="empty">运营账号仅可预览，评分请使用专家账号</div>` : `
          <form id="rv-form"><div class="between"><b class="h3">专业评分</b><span class="rv-total"><b class="mono" id="rv-total">—</b><small>/100</small></span></div>
            ${d.criteria.map(([k, l, w]) => `<div class="rv-c"><div class="between xs"><span>${l} <span class="dim">权重 ${w}%</span></span><b class="mono" data-show="${k}">—</b></div><div class="pg-score-btns sm" data-k="${k}">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-v="${i + 1}">${i + 1}</button>`).join('')}</div></div>`).join('')}
            <div class="field" style="margin-top:14px"><label>评审意见<em>*</em>（≥15 字，将匿名反馈给创作者）</label><textarea class="input" name="comment" maxlength="1000" placeholder="亮点、问题与改进建议"></textarea></div>
            <label class="check"><input type="checkbox" name="recommend">推荐晋级路演</label>
            <button class="btn btn-gold btn-block" id="rv-submit" ${need && (x.watched_sec || 0) < need ? 'disabled' : ''}>提交评审（提交后锁定）</button>
            <button type="button" class="btn btn-ghost btn-block btn-sm" id="rv-recuse" style="margin-top:8px"><i class="fa-solid fa-hand"></i>利益冲突，申请回避</button>
          </form>`}
        </aside>
      </div></div>`
    mountPlayer($('#rv-player'), v, {
      track: isExpert && !locked, watched: x.watched_sec || 0,
      onWatch: (w) => {
        if (!need) return
        const wEl = $('#rv-w'); if (!wEl) return
        wEl.textContent = fmtT(w); $('#rv-bar').style.width = Math.min(100, (w / need) * 100) + '%'
        if (w >= need) { const ok = $('#rv-ok'); ok.textContent = '已达评审门槛'; ok.className = 'green'; const s = $('#rv-submit'); if (s) s.disabled = false }
      },
    })
    const f = $('#rv-form'); if (!f) return
    const val = {}
    const calc = () => { const n = d.criteria.filter(([k]) => val[k]).length; $('#rv-total').textContent = n === d.criteria.length ? (d.criteria.reduce((a, [k, , w]) => a + val[k] * w, 0) / 10).toFixed(1) : '—' }
    $$('.pg-score-btns', f).forEach((g) => $$('button', g).forEach((b) => (b.onclick = () => { $$('button', g).forEach((y) => y.classList.toggle('on', +y.dataset.v <= +b.dataset.v)); val[g.dataset.k] = +b.dataset.v; $(`[data-show="${g.dataset.k}"]`, f).textContent = b.dataset.v; calc() })))
    f.onsubmit = async (e) => {
      e.preventDefault()
      const miss = d.criteria.filter(([k]) => !val[k]).map(([, l]) => l)
      if (miss.length) return toast('请为「' + miss.join('、') + '」打分', 'err')
      if (!confirm('提交后评审将锁定，不可修改。确认提交？')) return
      try { const r = await api('/review/' + id, { body: { scores: val, comment: f.comment.value, recommend: f.recommend.checked } }); toast('评审已提交 · 总分 ' + r.total, 'ok'); location.hash = '#/review' } catch (er) { errToast(er) }
    }
    $('#rv-recuse').onclick = () => modal('申请回避', `<form id="rc"><p class="small muted" style="margin-bottom:12px">请勾选与该作品团队存在的关系（可多选），回避记录将进入审计日志。</p>${['师生关系', '雇佣/合作关系', '亲属关系', '投资/利益关系', '其他'].map((t) => `<label class="check"><input type="checkbox" value="${t}">${t}</label>`).join('')}<button class="btn btn-gold btn-block" style="margin-top:12px">确认回避</button></form>`, (m) => {
      $('#rc', m).onsubmit = async (e) => { e.preventDefault(); const c = $$('input:checked', m).map((i) => i.value); if (!c.length) return toast('请至少选择一项', 'err'); try { await api('/review/' + id, { body: { conflict: c } }); closeModal(); toast('已回避', 'ok'); location.hash = '#/review' } catch (er) { errToast(er) } }
    })
  }

  // =====================================================================
  // 统一管理后台  #/admin/:tab
  // =====================================================================
  const TABS = [
    ['dashboard', '总控台', 'fa-gauge-high', '总览'],
    ['overview', '评选概览', 'fa-chart-simple', '总览'],
    ['content', '内容管理', 'fa-pen-to-square', '前台内容'],
    ['experts', '专家体系', 'fa-user-tie', '前台内容'],
    ['settings', '站点文案', 'fa-font', '前台内容'],
    ['media', '媒体库', 'fa-images', '前台内容'],
    ['videos', '视频审核', 'fa-film', '作品与评审'],
    ['comments', '影片评语', 'fa-comments', '作品与评审'],
    ['materials', '申报材料', 'fa-folder-open', '作品与评审'],
    ['selection', '评选总表', 'fa-ranking-star', '作品与评审'],
    ['roadshow', '路演与审批', 'fa-stamp', '作品与评审'],
    ['screening', '展映与宣发', 'fa-tv', '扶持与发行'],
    ['compute', '算力资金池', 'fa-coins', '扶持与发行'],
    ['export', '出海交易', 'fa-earth-asia', '扶持与发行'],
    ['audit', '审计日志', 'fa-clock-rotate-left', '系统'],
  ]
  R.admin = async (app, p, q) => {
    if (!S.user) return needLogin(app, '运营人员登录后进入管理后台')
    if (!isOp()) { app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-user-lock"></i>管理后台仅向运营 / 财务人员开放</div></div>`; return }
    const tab = TABS.find((t) => t[0] === p[0]) ? p[0] : 'dashboard'
    app.innerHTML = `<div class="wrap"><div class="wb adm">
      <aside class="wb-side"><div class="card"><div class="wb-profile adm-me"><span class="avatar">${esc(S.user.name[0])}</span><div><b class="small">${esc(S.user.name)}</b><div class="xs muted">${esc(S.user.role_label || '运营')}</div></div></div>
        <nav class="wb-menu">${TABS.map(([k, l, i, g], n) => `${n === 0 || TABS[n - 1][3] !== g ? `<div class="grp">${g}</div>` : ''}<a href="#/admin/${k}" class="${k === tab ? 'active' : ''}"><i class="fa-solid ${i}"></i>${l}<span class="adm-badge" data-badge="${k}"></span></a>`).join('')}
          <div class="grp">快捷</div><a href="#/review"><i class="fa-solid fa-gavel"></i>评审工作台</a><a href="#/workbench"><i class="fa-solid fa-briefcase"></i>运营工作台</a></nav></div></aside>
      <select class="input adm-jump" id="adm-jump" aria-label="切换后台模块">${TABS.map(([k, l, , g]) => `<option value="${k}" ${k === tab ? 'selected' : ''}>${g} · ${l}</option>`).join('')}</select>
      <section id="adm-main" style="min-width:0"><div class="loading-screen" style="min-height:40vh"><div class="reel"></div></div></section></div></div>`
    const main = $('#adm-main')
    $('#adm-jump').onchange = (e) => (location.hash = '#/admin/' + e.target.value)
    api('/cms-dashboard').then((d) => { const k = d.kpi; const b = { comments: k.c_flag, materials: k.m_pending, export: k.t_pending, experts: k.no_photo }; Object.entries(b).forEach(([kk, n]) => { const e = $(`[data-badge="${kk}"]`); if (e && n) e.textContent = n }) }).catch(() => {})
    api('/admin/stats').then((s) => {
      const b = { videos: s.pending_videos, roadshow: s.roadshow + s.to_approve }
      Object.entries(b).forEach(([k, n]) => { const e = $(`[data-badge="${k}"]`); if (e && n) e.textContent = n })
    }).catch(() => {})
    await ADM[tab](main, q)
  }
  const admHead = (t, sub, extra = '') => `<div class="adm-head"><div><div class="pg-label">管理后台 · Admin</div><h1 class="h2">${t}</h1>${sub ? `<p class="xs muted" style="margin-top:4px">${sub}</p>` : ''}</div><div class="row">${extra}</div></div>`

  const ADM = {
    async overview(el) {
      const s = await api('/admin/stats')
      const sel = await api('/admin/selection').catch(() => ({ rows: [] }))
      const flags = sel.rows.filter((x) => x.flag)
      const FUN = [['报名作品', s.apps], ['视频上线', s.live_videos], ['专家评审', s.reviews], ['晋级路演', s.roadshow], ['待审批', s.to_approve]]
      const mx = Math.max(...FUN.map((f) => f[1]), 1)
      el.innerHTML = admHead('运营概览', '实时数据 · 视频→评审→路演→算力发放全链路') + `
        <div class="adm-stats">
          ${[['报名作品', s.apps, 'fa-clapperboard'], ['待审视频', s.pending_videos, 'fa-hourglass-half', s.pending_videos ? 'warn' : ''], ['已上线视频', s.live_videos, 'fa-circle-play'], ['累计播放', s.plays.toLocaleString(), 'fa-eye'], ['大众评分', s.votes.toLocaleString(), 'fa-users'], ['专家评审', s.reviews, 'fa-gavel'], ['晋级路演', s.roadshow, 'fa-person-chalkboard'], ['已发算力', window.lyTok ? window.lyTok(s.granted) : s.granted, 'fa-microchip']].map(([l, v, i, c]) => `<div class="adm-stat ${c || ''}"><i class="fa-solid ${i}"></i><b>${v}</b><span>${l}</span></div>`).join('')}
        </div>
        <div class="cards c2" style="margin-top:18px">
          <div class="card"><b class="h3">评选漏斗</b><div class="adm-funnel">${FUN.map(([l, n]) => `<div><span class="xs">${l}</span><div class="adm-fbar"><i style="width:${Math.max(4, (n / mx) * 100)}%"></i></div><b class="mono small">${n}</b></div>`).join('')}</div></div>
          <div class="card"><b class="h3">待办事项</b><div class="adm-todo">
            ${s.pending_videos ? `<a href="#/admin/videos"><i class="fa-solid fa-film amber"></i><span>${s.pending_videos} 个视频待审核</span><i class="fa-solid fa-chevron-right dim"></i></a>` : ''}
            ${flags.map((f) => `<a href="#/admin/selection"><i class="fa-solid fa-triangle-exclamation red"></i><span>${esc(f.title)}：${esc(f.flag)}</span><i class="fa-solid fa-chevron-right dim"></i></a>`).join('')}
            ${s.roadshow ? `<a href="#/admin/roadshow"><i class="fa-solid fa-person-chalkboard gold"></i><span>${s.roadshow} 部作品待录入路演结果</span><i class="fa-solid fa-chevron-right dim"></i></a>` : ''}
            ${s.to_approve ? `<a href="#/admin/roadshow"><i class="fa-solid fa-stamp green"></i><span>${s.to_approve} 部作品待算力审批</span><i class="fa-solid fa-chevron-right dim"></i></a>` : ''}
            ${!s.pending_videos && !flags.length && !s.roadshow && !s.to_approve ? '<p class="small muted">暂无待办</p>' : ''}
          </div></div>
        </div>`
    },

    async videos(el, q) {
      const st = q.status || '待审核'
      const d = await api('/admin/videos?status=' + encodeURIComponent(st))
      const cnt = Object.fromEntries(d.counts.map((c) => [c.status, c.n]))
      el.innerHTML = admHead('视频审核', '内容合规 · 授权核验 · 技术质量；审核通过即在作品页公开并进入专家评审队列') + `
        <div class="tabs">${['待审核', '已上线', '已驳回', '已替换'].map((s) => `<a class="tab ${s === st ? 'active' : ''}" href="#/admin/videos?status=${encodeURIComponent(s)}">${s} <span class="mono xs">${cnt[s] || 0}</span></a>`).join('')}</div>
        <div class="adm-vgrid">${d.rows.map((v) => `<article class="adm-v" data-id="${v.id}">
          ${playerHTML(v)}
          <div class="adm-v-body"><div class="between"><b>${esc(v.app_title)}</b>${vTag(v.status)}</div>
            <div class="xs muted">${esc(v.team)} · 上传人 ${esc(v.uploader)} · ${esc(String(v.created_at).slice(0, 16))}</div>
            <div class="xs dim"><b>${esc(v.category || '正片')}</b> · ${v.kind === 'upload' ? '站内上传' : '外链'}${v.duration ? ' · ' + fmtT(v.duration) : ''}${v.size ? ' · ' + fmtMB(v.size) : ''}${v.status === '已上线' ? ` · 播放 ${v.plays} / 完播 ${v.finishes}` : ''}</div>
            ${v.reject_reason ? `<div class="xs red">驳回原因：${esc(v.reject_reason)}</div>` : ''}
            ${v.status === '待审核' ? `<div class="row" style="margin-top:10px"><button class="btn btn-sm btn-gold" data-ok="${v.id}"><i class="fa-solid fa-check"></i>通过上线</button><button class="btn btn-sm" data-no="${v.id}"><i class="fa-solid fa-xmark"></i>驳回</button><a class="btn btn-sm btn-ghost" href="#/vote/${v.code}">作品页</a></div>` : `<div class="row" style="margin-top:10px"><a class="btn btn-sm btn-ghost" href="#/vote/${v.code}">作品页</a></div>`}
          </div></article>`).join('') || `<div class="empty"><i class="fa-regular fa-circle-check"></i>「${st}」暂无视频</div>`}</div>`
      d.rows.forEach((v) => mountPlayer($(`.adm-v[data-id="${v.id}"]`, el), v))
      $$('[data-ok]', el).forEach((b) => (b.onclick = async () => { try { await api(`/admin/videos/${b.dataset.ok}/decide`, { body: { action: 'approve' } }); toast('已通过并上线', 'ok'); router() } catch (e) { errToast(e) } }))
      $$('[data-no]', el).forEach((b) => (b.onclick = () => modal('驳回视频', `<form id="rj"><div class="field"><label>驳回原因（将通知创作者）</label><select class="input" name="pre"><option value="">选择常见原因…</option><option>画面/声音存在明显技术问题</option><option>未能提供素材与肖像授权证明</option><option>内容不符合平台规范</option><option>时长或格式不符合报名要求</option><option>视频无法播放，请重新上传</option></select></div><div class="field"><textarea class="input" name="reason" placeholder="补充说明"></textarea></div><button class="btn btn-red btn-block">确认驳回</button></form>`, (m) => {
        $('#rj', m).onsubmit = async (e) => { e.preventDefault(); const r = [e.target.pre.value, e.target.reason.value].filter(Boolean).join('；'); try { await api(`/admin/videos/${b.dataset.no}/decide`, { body: { action: 'reject', reason: r } }); closeModal(); toast('已驳回', 'ok'); router() } catch (er) { errToast(er) } }
      })))
    },

    async selection(el) {
      const d = await api('/admin/selection')
      el.innerHTML = admHead('评选总表', esc(d.rule), `<button class="btn btn-sm" id="sel-csv"><i class="fa-solid fa-file-csv"></i>导出 CSV</button>`) + `
        <div class="table-wrap"><table class="tbl rwd adm-tbl"><thead><tr><th>#</th><th>作品</th><th>视频</th><th>专家均分</th><th>大众分</th><th>综合分</th><th>评审</th><th>状态</th><th>操作</th></tr></thead><tbody>
        ${d.rows.map((x, i) => `<tr class="${x.flag ? 'flag' : ''}"><td data-l="排名" class="mono"><div class="c">${x.composite != null ? i + 1 : '—'}</div></td>
          <td data-l="作品"><div class="c"><b class="small">${esc(x.title)}</b><div class="xs dim">${esc(x.team)} · ${esc(x.track)}</div></div></td>
          <td data-l="视频"><div class="c">${vTag(x.video)}${x.plays ? `<div class="xs dim">${x.plays.toLocaleString()} 播放</div>` : ''}</div></td>
          <td data-l="专家均分" class="mono"><div class="c">${x.exp_avg ?? '—'}${x.spread != null && x.reviews > 1 ? `<div class="xs dim">分差 ${x.spread.toFixed(1)}</div>` : ''}</div></td>
          <td data-l="大众分" class="mono"><div class="c">${x.pub100 ?? '—'}<div class="xs dim">${x.votes} 人</div></div></td>
          <td data-l="综合分"><div class="c"><b class="mono adm-score">${x.composite ?? '—'}</b></div></td>
          <td data-l="评审" class="small"><div class="c">${x.reviews} 份${x.recs ? ` · <span class="green">${x.recs} 推荐</span>` : ''}${x.recused ? ` · <span class="dim">${x.recused} 回避</span>` : ''}${x.flag ? `<div class="xs red"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(x.flag)}</div>` : ''}</div></td>
          <td data-l="状态"><div class="c">${statusTag(x.status)}</div></td>
          <td data-l="操作"><div class="c"><div class="row" style="justify-content:flex-end;gap:6px"><button class="btn btn-sm" data-rv="${x.id}" data-t="${esc(x.title)}">评审详情</button>${x.status === '初选中' ? `<button class="btn btn-sm btn-gold" data-adv="${x.id}">晋级</button>` : ''}</div></div></td></tr>`).join('')}
        </tbody></table></div>`
      $$('[data-rv]', el).forEach((b) => (b.onclick = async () => {
        const r = await api(`/admin/apps/${b.dataset.rv}/reviews`)
        modal('评审详情 · ' + b.dataset.t, r.rows.length ? r.rows.map((x) => `<div class="adm-rv"><div class="between"><b>${esc(x.expert)}</b>${x.status === '已回避' ? `<span class="tag">回避 · ${esc(x.conflict || '')}</span>` : `<span><b class="mono gold">${x.total}</b>${x.recommend ? ' <span class="tag green">推荐</span>' : ''}</span>`}</div>
          ${x.status === '已提交' ? `<div class="adm-rv-sc">${r.criteria.map(([k, l]) => `<div><span class="xs dim">${l}</span><b class="mono">${x.scores[k] ?? '—'}</b></div>`).join('')}</div><p class="small" style="margin-top:8px">${esc(x.comment)}</p><div class="xs dim">${esc(String(x.created_at).slice(0, 16))} · 观看 ${fmtT(x.watched_sec)}</div>` : ''}</div>`).join('') : '<div class="empty">暂无专家评审</div>')
      }))
      $$('[data-adv]', el).forEach((b) => (b.onclick = async () => { if (!confirm('确认将该作品晋级路演？')) return; try { await api(`/admin/apps/${b.dataset.adv}/advance`, { method: 'POST' }); toast('已晋级路演', 'ok'); router() } catch (e) { errToast(e) } }))
      $('#sel-csv').onclick = () => {
        const head = ['作品', '团队', '赛道', '视频', '专家均分', '大众分', '综合分', '评审数', '推荐数', '状态', '预警']
        const rows = d.rows.map((x) => [x.title, x.team, x.track, x.video || '', x.exp_avg ?? '', x.pub100 ?? '', x.composite ?? '', x.reviews, x.recs || 0, x.status, x.flag])
        const csv = '\ufeff' + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = '迭影计划_评选总表.csv'; a.click()
      }
    },

    async materials(el, q) { return window.admMaterials(el, q) },
    async screening(el) { return window.admScreening(el) },
    async export(el) { return window.admExport(el) },
    async roadshow(el) {
      if (window.programAdminPage) return window.programAdminPage(el, true)
      el.innerHTML = '<div class="empty">模块加载失败</div>'
    },

    async compute(el) {
      el.innerHTML = admHead('算力资金池', '7,000 万元算力面值（总扶持 1 亿元，另 3,000 万宣发见「展映与宣发」）· 分桶管理 · 额度审批') + `<div id="adm-ly"></div>`
      if (window.lightyearAdminPage) return window.lightyearAdminPage($('#adm-ly'), true)
      $('#adm-ly').innerHTML = `<a class="btn" href="#/lightyear/wallet">进入资金池</a>`
    },

    async content(el, q) { return window.CMS.content(el, q) },
    async dashboard(el) { return window.CMS.dashboard(el) },
    async experts(el, q) { return window.CMS.experts(el, q) },
    async comments(el, q) { return window.CMS.comments(el, q) },
    async settings(el) { return window.CMS.settings(el) },
    async media(el) { return window.CMS.media(el) },
    async audit(el, q) { return window.CMS.audit(el, q) },
  }
})()
