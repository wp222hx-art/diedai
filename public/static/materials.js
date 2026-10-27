/* 迭影计划 · 创作者申报材料指南 #/guide · 我的申报材料 #/materials/:appId · 运营材料审阅 */
(function () {
  const R = window.ROUTES
  const ACC = { pdf: 'PDF', doc: 'Word', sheet: '表格', image: '图片', video: 'MP4', form: '在线填写' }
  const MIME = { pdf: 'application/pdf,.pdf', doc: '.doc,.docx,.txt', sheet: '.xls,.xlsx,.csv', image: 'image/jpeg,image/png,image/webp', video: 'video/mp4,video/quicktime,video/webm,.mp4,.mov' }
  const MST = { 待审阅: 'amber', 已确认: 'green', 需补件: 'red' }
  const mTag = (s) => `<span class="tag ${MST[s] || ''}">${esc(s)}</span>`
  const typeOf = (f) => f.type || ({ pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv', mp4: 'video/mp4', mov: 'video/quicktime', jpg: 'image/jpeg', png: 'image/png' }[(f.name.split('.').pop() || '').toLowerCase()] || '')

  // =====================================================================
  // 指南（公开）
  // =====================================================================
  R.guide = async (app) => {
    const d = await api('/guide')
    const tbl = (list, r) => `<div class="gd-list">${list.map((x) => `<details class="gd-item"${x.no === '01' ? ' open' : ''}><summary><span class="gd-no">${r}-${x.no}</span><b>${esc(x.name)}</b><span class="gd-acc">${x.accept.map((k) => `<em>${ACC[k]}</em>`).join('')}</span><i class="fa-solid fa-chevron-down"></i></summary>
      <div class="gd-body"><div><span class="pg-label">建议内容与规格</span><p class="small">${esc(x.spec)}</p></div><div><span class="pg-label">评审用于判断</span><p class="small muted">${esc(x.judge)}</p></div></div></details>`).join('')}</div>`
    app.innerHTML = `<section class="pg-hero sm"><div class="wrap"><div class="pg-label">创作者版 V1.0 · 2026.10.26</div><h1 style="font-size:clamp(28px,4.4vw,44px)">申报材料指南</h1>
      <p class="lead" style="margin:8px 0 0">第一轮远程预审与第二轮联合评审所需材料。帮助你清楚呈现故事、创作能力及资源需求——材料装帧和海报精美程度不单独作为评判依据。</p>
      <div class="row" style="margin-top:18px"><a class="btn btn-gold" href="${S.user ? '#/me' : '#/apply'}">${S.user ? '去提交材料' : '先报名建档'}</a><a class="btn" href="#/fund">1 亿元扶持体系</a></div></div></section>
    <div class="wrap section" style="padding-top:26px;max-width:960px">
      <ol class="gd-flow">${d.flow.map((f, i) => `<li><span>${i + 1}</span><div><b>${esc(f.k)}</b><p class="small muted">${esc(f.t)}</p></div></li>`).join('')}</ol>
      <div class="pg-head" style="margin-top:34px"><div class="no">R1</div><div><h2>第一轮材料清单 · 10 项</h2></div><div><p>建议将图文内容合并为一个 PDF，另附两条视频和一份可编辑预算表。各模块可合并去重。</p></div></div>
      ${tbl(d.round1, 'R1')}
      <div class="cards c2" style="margin-top:18px;gap:14px">
        <div class="pg-box"><div class="pg-label">两条先导片的不同任务</div><p class="small" style="margin-top:6px">${esc(d.teaser)}</p></div>
        <div class="pg-box"><div class="pg-label">预算至少能回答五个问题</div><ol class="gd-q">${d.budget_q.map((q) => `<li>${esc(q)}</li>`).join('')}</ol><p class="xs muted">${esc(d.budget_note)}</p></div>
      </div>
      <div class="notice" style="margin-top:14px"><i class="fa-solid fa-clock-rotate-left"></i><div><b>首轮可以后补：</b>${esc(d.rules.later)}有现成材料可附；尚待取得的权益请如实列明，后续按补件通知完善。</div></div>
      <div class="pg-head" style="margin-top:38px"><div class="no">R2</div><div><h2>第二轮材料清单 · 9 项</h2></div><div><p>在首轮材料上更新补充，保留项目编号和版本，逐条回应首轮意见；无需重新包装没有变化的材料。</p></div></div>
      ${tbl(d.round2, 'R2')}
      <div class="cards c2" style="margin-top:18px;gap:14px">
        <div class="pg-box"><div class="pg-label">主创讲述与答辩准备</div><ol class="gd-q">${d.pitch_q.map((q) => `<li>${esc(q)}</li>`).join('')}</ol><p class="xs muted">由实际负责项目的创作主理人讲述，技术负责人可随行或远程参与。未来在线评议可提交讲解录像和书面答复。</p></div>
        <div class="pg-box"><div class="pg-label">资源申请摘要 · 统一字段</div><p class="small" style="margin-top:6px">${esc(d.summary_fields)}</p><p class="xs muted" style="margin-top:6px">预算表同时显示全片估算与本次申请，避免把一次试制额度误读为全片承诺。</p></div>
      </div>
      <div class="pg-head" style="margin-top:38px"><div class="no">04</div><div><h2>文件整理与提交</h2></div><div></div></div>
      <table class="pg-table"><tbody>${[['命名', d.rules.naming], ['格式', d.rules.formats], ['网盘', d.rules.netdisk], ['隐私与权利', d.rules.privacy]].map(([k, v]) => `<tr><td class="t"><b>${k}</b></td><td class="c">${esc(v)}</td></tr>`).join('')}</tbody></table>
      <div class="pg-cta" style="margin-top:28px"><div><div class="pg-label">平台已按指南逐项建好提交入口</div><b>在线速览表 · 文件续传 · 版本管理 · 补件提醒</b></div><a class="btn btn-gold" href="${S.user ? '#/me' : '#/apply'}">${S.user ? '提交材料' : '立即报名'}</a></div>
      <p class="xs dim" style="margin-top:12px">来源：${esc(d.source)}</p>
    </div>`
  }

  // =====================================================================
  // 我的申报材料
  // =====================================================================
  R.materials = async (app, p, q = {}) => {
    if (!S.user) return needLogin(app, '登录后提交申报材料')
    const id = +p[0]
    const d = await api(`/program/apps/${id}/materials`)
    const round = q.round === '2' && d.round2_open ? 2 : 1
    const list = round === 1 ? d.round1 : d.round2
    const editable = S.user.id === d.app.user_id || ['operator', 'admin'].includes(S.user.role)
    const pct = round === 1 ? d.progress.r1 : d.progress.r2
    app.innerHTML = `<div class="wrap section mt-page" style="padding-top:22px;max-width:900px">
      <a class="xs muted" href="#/me">← 我的</a>
      <div class="pg-label" style="margin-top:14px">申报材料 · ${esc(d.app.status)}</div>
      <h1 class="pg-title" style="font-size:clamp(24px,4vw,34px)">${esc(d.app.title)}</h1>
      <div class="mt-prog"><div class="between xs"><span>${round === 1 ? '第一轮 · 远程预审' : '第二轮 · 联合评审'} 完成度</span><b class="mono">${pct}%</b></div><div class="up-bar"><i style="width:${pct}%"></i></div>
        ${d.progress.redo ? `<p class="xs red" style="margin-top:6px"><i class="fa-solid fa-circle-exclamation"></i> ${d.progress.redo} 项需补件，请按反馈更新版本</p>` : ''}</div>
      <div class="tabs" style="margin-top:14px"><a class="tab ${round === 1 ? 'active' : ''}" href="#/materials/${id}">第一轮 · 10 项</a><a class="tab ${round === 2 ? 'active' : ''} ${d.round2_open ? '' : 'disabled'}" href="${d.round2_open ? `#/materials/${id}?round=2` : 'javascript:void 0'}" ${d.round2_open ? '' : 'title="晋级路演后开放"'}>第二轮 · 9 项${d.round2_open ? '' : ' <i class="fa-solid fa-lock xs"></i>'}</a><a class="tab" href="#/guide">指南</a></div>
      <div id="mt-up-resume"></div>
      <div class="mt-list">${list.map((x) => {
        const f = x.file
        return `<article class="mt-item ${f ? (f.status === '需补件' ? 'redo' : 'ok') : ''}" data-code="${x.code}">
          <div class="mt-head"><span class="gd-no">${round === 1 ? 'R1' : 'R2'}-${x.no}</span><div class="mt-name"><b>${esc(x.name)}</b>${x.required ? '' : '<span class="xs dim">（按需）</span>'}<div class="xs muted mt-spec">${esc(x.spec)}</div></div>${f ? mTag(f.status) : '<span class="tag">未提交</span>'}</div>
          ${f ? `<div class="mt-file"><i class="fa-solid ${f.kind === 'link' ? 'fa-link' : f.kind === 'form' ? 'fa-table-list' : 'fa-file-lines'}"></i><div><b class="small">${f.kind === 'form' ? '在线速览表' : esc(f.file_name || f.url)}</b><span class="xs muted">V${f.version} · ${esc(String(f.created_at).slice(0, 16))}${f.size ? ' · ' + window.fmtMB(f.size) : ''}${f.note ? ' · ' + esc(f.note) : ''}</span></div>${f.kind === 'file' ? `<a class="btn btn-sm btn-ghost" target="_blank" href="/api/media/m/${f.id}?token=${encodeURIComponent(S.token)}">查看</a>` : f.kind === 'link' ? `<a class="btn btn-sm btn-ghost" target="_blank" rel="noopener" href="${esc(f.url)}">打开</a>` : ''}</div>
            ${f.feedback ? `<div class="mt-fb"><i class="fa-solid fa-comment-dots"></i>${esc(f.feedback)}</div>` : ''}` : ''}
          ${editable ? `<div class="mt-actions">${x.code === 'r1_sheet' ? `<button class="btn btn-sm btn-gold" data-sheet><i class="fa-solid fa-pen"></i>${f ? '编辑速览表' : '在线填写'}</button>` : ''}
            ${x.accept.some((k) => k !== 'form') ? `<label class="btn btn-sm ${x.code === 'r1_sheet' ? '' : 'btn-gold'}"><input type="file" hidden data-file accept="${x.accept.filter((k) => k !== 'form').map((k) => MIME[k]).join(',')}"><i class="fa-solid fa-cloud-arrow-up"></i>${f ? '上传新版本' : '上传文件'}</label>` : ''}
            <button class="btn btn-sm" data-link><i class="fa-solid fa-link"></i>网盘链接</button></div>
          <div class="mt-up" hidden><div class="up-bar"><i></i></div><div class="between xs mono"><span class="mt-pct">0%</span><span class="mt-st muted"></span></div></div>` : ''}
        </article>`
      }).join('')}</div>
      <p class="xs dim" style="margin-top:14px"><i class="fa-solid fa-shield-halved"></i> 文件命名建议「项目名_主创_材料类别_V1_日期」。提交资料仅用于评审；公开展示与宣传另行授权。请勿提交身份证号、银行卡、账号密码或密钥。</p>
    </div>`
    window.checkPendingUploads && window.checkPendingUploads($('#mt-up-resume'))
    if (!editable) return
    $$('.mt-item').forEach((el) => {
      const code = el.dataset.code, it = list.find((x) => x.code === code)
      const fi = $('[data-file]', el)
      if (fi) fi.onchange = async () => {
        const f0 = fi.files[0]; if (!f0) return
        const type = typeOf(f0); const file = type === f0.type ? f0 : new File([f0], f0.name, { type })
        const box = $('.mt-up', el); box.hidden = false
        let dur = 0
        if (/^video\//.test(type)) dur = await new Promise((res) => { const v = document.createElement('video'); v.preload = 'metadata'; v.onloadedmetadata = () => res(Math.round(v.duration) || 0); v.onerror = () => res(0); v.src = URL.createObjectURL(file) })
        const ctl = window.chunkUpload({ app_id: id, file, purpose: 'material', item_code: code, duration: dur,
          onProgress: (pp) => { $('i', box).style.width = pp.pct + '%'; $('.mt-pct', box).textContent = `${pp.pct.toFixed(0)}% · ${window.fmtMB(pp.loaded)} / ${window.fmtMB(pp.total)}` },
          onState: (s) => { $('.mt-st', box).textContent = s } })
        try { await ctl.promise; toast(`「${it.name}」已保存，等待审阅`, 'ok'); router() } catch (er) { $('.mt-st', box).innerHTML = `<span class="red">${esc(er.error || '上传失败')}</span>`; errToast(er) }
        fi.value = ''
      }
      const lk = $('[data-link]', el)
      if (lk) lk.onclick = () => modal(`网盘链接 · ${esc(it.name)}`, `<form id="lk"><div class="field"><label>链接<em>*</em></label><input class="input" name="url" type="url" inputmode="url" autocapitalize="off" placeholder="https://pan.baidu.com/s/…"></div><div class="field"><label>提取码 / 访问方式与到期时间<em>*</em></label><input class="input" name="note" placeholder="如：提取码 8k2d，有效期至 2027-03-31"></div><button class="btn btn-gold btn-block">提交</button></form>`, (m) => {
        $('#lk', m).onsubmit = async (e) => { e.preventDefault(); try { await api(`/program/apps/${id}/materials`, { body: { item: code, url: e.target.url.value.trim(), note: e.target.note.value } }); closeModal(); toast('已提交', 'ok'); router() } catch (er) { errToast(er) } }
      })
      const sh = $('[data-sheet]', el)
      if (sh) sh.onclick = () => modal('项目速览表', `<form id="sh" class="mt-sheet"><p class="xs muted" style="margin-bottom:10px">评审第一眼看的一页：是否符合征集方向、资源需求是否可承受。</p>
        <div class="field"><label>项目名</label><input class="input" value="${esc(d.app.title)}" disabled></div>
        ${d.sheet_fields.map(([k, l, ph]) => `<div class="field"><label>${l}${k === 'promo' ? '' : '<em>*</em>'}</label><input class="input" name="${k}" value="${esc(d.sheet[k] || '')}" placeholder="${esc(ph)}" enterkeyhint="next"></div>`).join('')}
        <button class="btn btn-gold btn-block">保存速览表</button></form>`, (m) => {
        $('#sh', m).onsubmit = async (e) => { e.preventDefault(); try { const r = await api(`/program/apps/${id}/sheet`, { method: 'PUT', body: bindForm(e.target) }); if (r.complete) { closeModal(); toast('速览表已保存并提交', 'ok'); router() } else toast('已暂存，还缺：' + r.missing.join('、'), 'err') } catch (er) { errToast(er) } }
      })
    })
  }

  // =====================================================================
  // 运营：材料审阅 / 展映与宣发（注入统一后台）
  // =====================================================================
  window.admMaterials = async (el, q = {}) => {
    const st = q.status || '待审阅'
    const d = await api('/admin/materials?status=' + encodeURIComponent(st))
    const cnt = Object.fromEntries(d.counts.map((c) => [c.status, c.n]))
    el.innerHTML = `<div class="adm-head"><div><div class="pg-label">管理后台 · Admin</div><h1 class="h2">申报材料</h1><p class="xs muted" style="margin-top:4px">按《申报材料指南 V1.0》逐项审阅；需补件将通知创作者并保留版本。</p></div></div>
      <div class="tabs">${['待审阅', '需补件', '已确认'].map((s) => `<a class="tab ${s === st ? 'active' : ''}" href="#/admin/materials?status=${encodeURIComponent(s)}">${s} <span class="mono xs">${cnt[s] || 0}</span></a>`).join('')}</div>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>材料</th><th>文件</th><th>状态</th><th>操作</th></tr></thead><tbody>
      ${d.rows.map((x) => `<tr><td data-l="作品"><b class="small">${esc(x.title)}</b><div class="xs dim">${esc(x.team)}</div></td><td data-l="材料" class="small">R${x.round}-${x.no} ${esc(x.name)} <span class="xs dim">V${x.version}</span></td>
        <td data-l="文件" class="xs">${x.kind === 'file' ? `<a class="pg-link" target="_blank" href="/api/media/m/${x.id}?token=${encodeURIComponent(S.token)}">${esc(x.file_name)}</a>` : x.kind === 'link' ? `<a class="pg-link" target="_blank" rel="noopener" href="${esc(x.url)}">网盘链接</a> <span class="dim">${esc(x.note || '')}</span>` : '在线速览表'}</td>
        <td data-l="状态">${mTag(x.status)}${x.feedback ? `<div class="xs dim">${esc(x.feedback)}</div>` : ''}</td>
        <td data-l="操作"><div class="row" style="gap:6px;justify-content:flex-end"><button class="btn btn-sm btn-gold" data-ok="${x.id}">确认</button><button class="btn btn-sm" data-redo="${x.id}">需补件</button></div></td></tr>`).join('') || `<tr><td colspan="5"><div class="empty">「${st}」暂无材料</div></td></tr>`}
      </tbody></table></div>
      <h3 class="h3" style="margin:24px 0 10px">各作品材料进度</h3>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>状态</th><th>首轮</th><th>二轮</th><th></th></tr></thead><tbody>${d.apps.map((a) => `<tr><td data-l="作品" class="small"><b>${esc(a.title)}</b><div class="xs dim">${esc(a.team)}</div></td><td data-l="状态">${statusTag(a.status)}</td><td data-l="首轮" class="mono small">${a.r1}/${d.totals.r1}</td><td data-l="二轮" class="mono small">${a.r2}/${d.totals.r2}</td><td data-l=""><a class="btn btn-sm btn-ghost" href="#/materials/${a.id}">查看</a></td></tr>`).join('')}</tbody></table></div>`
    $$('[data-ok]', el).forEach((b) => (b.onclick = async () => { try { await api(`/admin/materials/${b.dataset.ok}/decide`, { body: { action: 'confirm' } }); toast('已确认', 'ok'); router() } catch (e) { errToast(e) } }))
    $$('[data-redo]', el).forEach((b) => (b.onclick = () => modal('需补件', `<form id="rd"><div class="field"><label>需要补充的内容<em>*</em></label><textarea class="input" name="fb" placeholder="如：请补充结局部分的场戏"></textarea></div><button class="btn btn-gold btn-block">发送补件通知</button></form>`, (m) => {
      $('#rd', m).onsubmit = async (e) => { e.preventDefault(); try { await api(`/admin/materials/${b.dataset.redo}/decide`, { body: { action: 'redo', feedback: e.target.fb.value } }); closeModal(); toast('已通知补件', 'ok'); router() } catch (er) { errToast(er) } }
    })))
  }

  window.admScreening = async (el) => {
    const [s, o] = await Promise.all([api('/screening'), api('/promo/overview')])
    el.innerHTML = `<div class="adm-head"><div><div class="pg-label">管理后台 · Admin</div><h1 class="h2">展映与宣发</h1><p class="xs muted" style="margin-top:4px">编排展映单元与主推位，按热度与评审结果发放宣发扶持（3,000 万元）。</p></div></div>
      <div class="fd-pools sm">${o.promo_buckets.map((b) => `<div class="fd-pool p"><div class="fd-pool-top"><span class="pg-label">${esc(b.name)}</span><b>${((b.amount_yuan - b.used_yuan) / 1e4).toLocaleString()}<small> 万可用</small></b></div><div class="fd-meter"><i style="width:${(b.used_yuan / b.amount_yuan) * 100}%"></i></div><span class="xs dim">已发 ${(b.used_yuan / 1e4).toLocaleString()} / ${(b.amount_yuan / 1e4).toLocaleString()} 万</span></div>`).join('')}</div>
      <div class="table-wrap" style="margin-top:18px"><table class="tbl rwd"><thead><tr><th>作品</th><th>热度</th><th>单元</th><th>主推</th><th>宣发</th><th>操作</th></tr></thead><tbody>
      ${s.rows.map((x) => `<tr><td data-l="作品"><b class="small">${esc(x.title)}</b><div class="xs dim">${esc(x.team)} · ${x.plays.toLocaleString()} 播放</div></td><td data-l="热度" class="mono small">${x.hot.toLocaleString()}</td>
        <td data-l="单元"><select class="input input-sm" data-unit="${x.id}">${o.units.map((u) => `<option value="${u.code}" ${x.unit === u.code ? 'selected' : ''}>${u.name}</option>`).join('')}</select></td>
        <td data-l="主推"><label class="check" style="margin:0"><input type="checkbox" data-feat="${x.id}" ${x.featured ? 'checked' : ''}>主推</label></td>
        <td data-l="宣发" class="mono small">${x.promo ? '¥' + x.promo.toLocaleString() : '—'}</td>
        <td data-l="操作"><button class="btn btn-sm btn-gold" data-grant="${x.id}" data-t="${esc(x.title)}">发放宣发</button></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">暂无上线作品</div></td></tr>'}</tbody></table></div>`
    $$('[data-unit]', el).forEach((sel) => (sel.onchange = async () => { try { await api(`/admin/apps/${sel.dataset.unit}/screening`, { body: { unit: sel.value } }); toast('展映单元已更新', 'ok') } catch (e) { errToast(e) } }))
    $$('[data-feat]', el).forEach((c) => (c.onchange = async () => { try { await api(`/admin/apps/${c.dataset.feat}/screening`, { body: { featured: c.checked } }); toast(c.checked ? '已设为主推' : '已取消主推', 'ok') } catch (e) { errToast(e) } }))
    $$('[data-grant]', el).forEach((b) => (b.onclick = () => modal('发放宣发扶持 · ' + b.dataset.t, `<form id="pg"><div class="field"><label>资金池</label><select class="input" name="bucket">${o.promo_buckets.map((x) => `<option value="${x.code}">${esc(x.name)}（可用 ${((x.amount_yuan - x.used_yuan) / 1e4).toLocaleString()} 万）</option>`).join('')}</select></div><div class="field"><label>金额（元）</label><input class="input" type="number" inputmode="numeric" name="yuan" value="50000"></div><div class="field"><label>用途说明</label><input class="input" name="note" placeholder="如：正式海报与预告精剪"></div><button class="btn btn-gold btn-block">确认发放</button></form>`, (m) => {
      $('#pg', m).onsubmit = async (e) => { e.preventDefault(); try { await api(`/admin/apps/${b.dataset.grant}/promo-grant`, { body: { bucket: e.target.bucket.value, yuan: +e.target.yuan.value, note: e.target.note.value } }); closeModal(); toast('宣发扶持已发放', 'ok'); router() } catch (er) { errToast(er) } }
    })))
  }
})()
