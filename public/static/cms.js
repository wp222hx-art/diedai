/* 迭影计划 · 全站后台（CMS）
 * 后台 tab：总控台 / 内容管理（通用 CRUD，对应前台每块内容）/ 专家与照片 / 影片评语 / 站点文案 / 媒体库 / 审计日志
 * 前台：评审与导师 / 专家库 带照片；作品页评语读取治理后的数据；站点文案覆盖
 */
(function () {
  const R = window.ROUTES
  const head = (t, sub, extra = '') => `<div class="adm-head"><div><div class="pg-label">管理后台 · Admin</div><h1 class="h2">${t}</h1>${sub ? `<p class="xs muted" style="margin-top:4px">${sub}</p>` : ''}</div><div class="row">${extra}</div></div>`
  let SCHEMA = null
  const schema = async () => (SCHEMA = SCHEMA || (await api('/cms/schema')).resources)
  const av = (url, name, cls = '') => url ? `<img class="cm-av ${cls}" src="${esc(url)}" alt="${esc(name || '')}" loading="lazy">` : `<span class="cm-av ${cls} ph">${esc((name || '?')[0])}</span>`
  window.cmsAvatar = av

  // ------------------------------ 图片上传 ------------------------------
  async function uploadImage(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw { error: '仅支持 JPG / PNG / WebP' }
    // 压缩到最长边 800px，移动端拍照也能快速上传
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file) })
    const k = Math.min(1, 800 / Math.max(img.width, img.height)), cv = document.createElement('canvas')
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
    const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.86))
    const r = await fetch('/api/cms-media', { method: 'POST', headers: { 'Content-Type': 'image/jpeg', Authorization: 'Bearer ' + S.token, 'x-file-name': encodeURIComponent(file.name) }, body: blob })
    const d = await r.json().catch(() => ({})); if (!r.ok) throw d
    return d.url
  }
  function imageField(name, val) {
    return `<div class="cm-img" data-img="${name}">${av(val, '图', 'lg')}<div class="cm-img-act"><label class="btn btn-sm btn-gold"><input type="file" accept="image/jpeg,image/png,image/webp" hidden><i class="fa-solid fa-camera"></i>上传照片</label><button type="button" class="btn btn-sm" data-pick><i class="fa-regular fa-images"></i>媒体库</button>${val ? '<button type="button" class="btn btn-sm btn-ghost" data-clear>移除</button>' : ''}</div><input type="hidden" name="${name}" value="${esc(val || '')}"><span class="xs dim">建议正方形或竖构图，自动压缩到 800px；请确认肖像使用授权</span></div>`
  }
  function bindImage(root) {
    $$('[data-img]', root).forEach((box) => {
      const hid = $('input[type=hidden]', box), set = (u) => { hid.value = u; const old = $('.cm-av', box); old.outerHTML = av(u, '图', 'lg') }
      $('input[type=file]', box).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { toast('照片上传中…'); set(await uploadImage(f)); toast('照片已上传', 'ok') } catch (er) { errToast(er) } }
      const cl = $('[data-clear]', box); if (cl) cl.onclick = () => set('')
      $('[data-pick]', box).onclick = async () => {
        const d = await api('/cms-media')
        const pop = document.createElement('div'); pop.className = 'cm-pick'
        pop.innerHTML = d.rows.map((m) => `<button type="button" data-u="${m.url}"><img src="${m.url}" loading="lazy"></button>`).join('') || '<p class="xs muted">媒体库为空，请先上传</p>'
        box.appendChild(pop)
        $$('button', pop).forEach((b) => (b.onclick = () => { set(b.dataset.u); pop.remove() }))
      }
    })
  }

  // ------------------------------ 通用表单 ------------------------------
  function fieldHTML(f, v, ro) {
    const val = v ?? ''
    const dis = ro ? 'disabled' : ''
    if (f.t === 'image') return `<div class="field cm-full"><label>${f.l}</label>${imageField(f.k, val)}</div>`
    if (f.t === 'textarea' || f.t === 'json') return `<div class="field cm-full"><label>${f.l}${f.req ? '<em>*</em>' : ''}</label><textarea class="input ${f.t === 'json' ? 'mono xs' : ''}" name="${f.k}" rows="${f.t === 'json' ? 12 : 4}" ${dis}>${esc(f.t === 'json' && val ? JSON.stringify(JSON.parse(val), null, 2) : val)}</textarea></div>`
    if (f.t === 'select') return `<div class="field"><label>${f.l}${f.req ? '<em>*</em>' : ''}</label><select class="input" name="${f.k}" ${dis}>${f.opts.map((o) => `<option value="${esc(o)}" ${String(val) === o ? 'selected' : ''}>${esc(o || '（无）')}</option>`).join('')}</select></div>`
    if (f.t === 'bool') return `<div class="field"><label>${f.l}</label><label class="cm-switch"><input type="checkbox" name="${f.k}" ${val ? 'checked' : ''} ${dis}><span></span></label></div>`
    const type = f.t === 'number' ? 'number' : f.t === 'date' ? 'date' : f.t === 'url' ? 'url' : 'text'
    return `<div class="field"><label>${f.l}${f.req ? '<em>*</em>' : ''}</label><input class="input" type="${type}" name="${f.k}" value="${esc(val)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} ${type === 'number' ? 'inputmode="decimal"' : ''} ${dis}></div>`
  }
  function editor(res, row, onDone) {
    const isNew = !row
    modal(`${isNew ? '新建' : '编辑'} · ${res.label}`, `<form id="cm-form" class="cm-form">${res.fields.map((f) => fieldHTML(f, row ? row[f.k] : f.t === 'bool' && f.k === 'visible' ? 1 : '', !isNew && res.readonly.includes(f.k))).join('')}
      <div class="cm-form-bar cm-full">${!isNew && !res.noDelete ? '<button type="button" class="btn btn-ghost" id="cm-del"><i class="fa-regular fa-trash-can"></i>删除</button>' : '<span></span>'}<button class="btn btn-gold"><i class="fa-solid fa-check"></i>保存</button></div></form>`, (m) => {
      m.querySelector('.modal-box').classList.add('cm-modal')
      bindImage(m)
      $('#cm-form', m).onsubmit = async (e) => {
        e.preventDefault()
        const f = e.target, body = {}
        res.fields.forEach((x) => { const el = f.elements[x.k]; if (!el || el.disabled) return; body[x.k] = x.t === 'bool' ? el.checked : el.value })
        try { await api(`/cms/${res.key}${isNew ? '' : '/' + row.id}`, { method: isNew ? 'POST' : 'PUT', body }); closeModal(); SCHEMA = null; toast('已保存，前台即时生效', 'ok'); onDone() } catch (er) { errToast(er) }
      }
      const del = $('#cm-del', m); if (del) del.onclick = async () => { if (!confirm(`确认删除「${row[res.title]}」？此操作不可恢复`)) return; try { await api(`/cms/${res.key}/${row.id}`, { method: 'DELETE' }); closeModal(); SCHEMA = null; toast('已删除', 'ok'); onDone() } catch (er) { errToast(er) } }
    })
  }
  const cell = (f, v) => {
    if (f.t === 'image') return av(v, '')
    if (f.t === 'bool') return v ? '<span class="tag green">是</span>' : '<span class="tag">否</span>'
    if (f.t === 'number' && v != null && Math.abs(v) >= 10000) return `<span class="mono">${Number(v).toLocaleString()}</span>`
    if (f.t === 'select') return statusTag(v || '—')
    return esc(String(v ?? '—').slice(0, 60))
  }

  // ------------------------------ 内容管理 ------------------------------
  async function content(el, q) {
    const list = await schema()
    const key = q.res || 'people'
    const res = list.find((x) => x.key === key) || list[0]
    const groups = [...new Set(list.map((x) => x.group))]
    el.innerHTML = head('内容管理', '前台每一块内容都在这里编辑，保存后前台即时生效；所有改动写入审计日志') + `
      <div class="cm-res">${groups.map((g) => `<div class="cm-grp"><span>${g}</span>${list.filter((x) => x.group === g).map((x) => `<a class="${x.key === res.key ? 'on' : ''}" href="#/admin/content?res=${x.key}"><i class="fa-solid ${x.icon}"></i>${x.label}<em>${x.count}</em></a>`).join('')}</div>`).join('')}</div>
      <div class="cm-bar"><div><b class="h3">${res.label}</b> <a class="xs pg-link" href="${res.front}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> 对应前台 ${res.front}</a></div>
        <form id="cm-q" class="row" style="flex-wrap:nowrap"><input class="input input-sm" name="q" placeholder="搜索…" value="${esc(q.q || '')}"><button class="btn btn-sm"><i class="fa-solid fa-magnifying-glass"></i></button>${res.noCreate ? '' : '<button type="button" class="btn btn-sm btn-gold" id="cm-new"><i class="fa-solid fa-plus"></i>新建</button>'}</form></div>
      <div id="cm-list"></div>`
    const d = await api(`/cms/${res.key}?q=${encodeURIComponent(q.q || '')}`)
    const cols = res.fields.filter((f) => f.list)
    const sortable = res.fields.some((f) => f.k === 'sort') && !q.q
    $('#cm-list').innerHTML = `<div class="table-wrap"><table class="tbl rwd cm-tbl"><thead><tr>${sortable ? '<th></th>' : ''}${cols.map((f) => `<th>${f.l}</th>`).join('')}<th></th></tr></thead><tbody>
      ${d.rows.map((r) => `<tr data-id="${r.id}" ${sortable ? 'draggable="true"' : ''}>${sortable ? '<td class="cm-drag" data-l=""><i class="fa-solid fa-grip-vertical"></i></td>' : ''}${cols.map((f) => `<td data-l="${f.l}">${cell(f, r[f.k])}</td>`).join('')}<td data-l=""><button class="btn btn-sm" data-ed="${r.id}"><i class="fa-solid fa-pen"></i>编辑</button></td></tr>`).join('') || `<tr><td colspan="${cols.length + 2}"><div class="empty">暂无数据</div></td></tr>`}
      </tbody></table></div>${sortable ? '<p class="xs dim" style="margin-top:8px"><i class="fa-solid fa-grip-vertical"></i> 拖动行可调整前台展示顺序（手机端请在编辑中修改「排序」）</p>' : ''}`
    const reload = () => content(el, q)
    $$('[data-ed]', el).forEach((b) => (b.onclick = () => editor(res, d.rows.find((r) => r.id === +b.dataset.ed), reload)))
    const nb = $('#cm-new'); if (nb) nb.onclick = () => editor(res, null, reload)
    $('#cm-q').onsubmit = (e) => { e.preventDefault(); location.hash = `#/admin/content?res=${res.key}&q=${encodeURIComponent(e.target.q.value)}` }
    if (sortable) {
      let drag = null
      $$('tr[draggable]', el).forEach((tr) => {
        tr.ondragstart = () => { drag = tr; tr.classList.add('dragging') }
        tr.ondragend = async () => { tr.classList.remove('dragging'); const ids = $$('tr[draggable]', el).map((x) => +x.dataset.id); try { await api(`/cms/${res.key}/reorder`, { body: { ids } }); toast('顺序已保存', 'ok') } catch (e) { errToast(e) } }
        tr.ondragover = (e) => { e.preventDefault(); const t = e.currentTarget; if (drag && t !== drag) { const rect = t.getBoundingClientRect(); t.parentNode.insertBefore(drag, e.clientY > rect.top + rect.height / 2 ? t.nextSibling : t) } }
      })
    }
  }

  // ------------------------------ 专家与照片 ------------------------------
  async function experts(el, q) {
    const tab = q.t === 'experts' ? 'experts' : 'people'
    const [list, d] = await Promise.all([schema(), api('/cms/' + tab)])
    const res = list.find((x) => x.key === tab)
    const noPhoto = d.rows.filter((r) => !r.photo).length
    el.innerHTML = head('专家体系', '评审、导师与专家库统一管理；照片、头衔、邀约状态、显隐与排序', `<button class="btn btn-sm btn-gold" id="ex-new"><i class="fa-solid fa-user-plus"></i>新增${tab === 'people' ? '评审 / 导师' : '专家'}</button>`) + `
      <div class="tabs"><a class="tab ${tab === 'people' ? 'active' : ''}" href="#/admin/experts">评审与导师</a><a class="tab ${tab === 'experts' ? 'active' : ''}" href="#/admin/experts?t=experts">专家库</a></div>
      ${noPhoto ? `<div class="notice" style="margin-bottom:14px"><i class="fa-solid fa-camera"></i><div>${noPhoto} 位尚无照片，前台以姓氏头像占位。点击卡片上传照片；请使用本人授权或开放许可（CC）照片，并填写署名。</div></div>` : ''}
      <div class="cm-people">${d.rows.map((r) => `<article class="cm-person ${r.visible ? '' : 'off'}" data-id="${r.id}">
        <label class="cm-person-ph">${av(r.photo, r.name, 'xl')}<input type="file" accept="image/jpeg,image/png,image/webp" hidden data-up="${r.id}"><span><i class="fa-solid fa-camera"></i>${r.photo ? '更换' : '上传'}</span></label>
        <div class="cm-person-b"><b>${esc(r.name)}</b><div class="xs muted">${esc(r.title || '')}</div>
          <div class="row" style="gap:4px;margin-top:6px">${r.role ? `<span class="tag gold">${esc(r.role)}</span>` : r.field ? `<span class="tag">${esc(r.field)}</span>` : ''}${r.status ? statusTag(r.status) : ''}${r.visible ? '' : '<span class="tag red">已隐藏</span>'}</div>
          ${r.photo_credit ? `<div class="xs dim cm-credit"><i class="fa-regular fa-copyright"></i> ${esc(r.photo_credit)}</div>` : ''}</div>
        <button class="btn btn-sm" data-ed="${r.id}"><i class="fa-solid fa-pen"></i></button></article>`).join('')}</div>`
    const reload = () => experts(el, q)
    $$('[data-up]', el).forEach((inp) => (inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return
      try { toast('照片上传中…'); const url = await uploadImage(f); await api(`/cms/${tab}/${inp.dataset.up}`, { method: 'PUT', body: { photo: url } }); toast('照片已更新，前台即时生效', 'ok'); reload() } catch (er) { errToast(er) }
    }))
    $$('[data-ed]', el).forEach((b) => (b.onclick = () => editor(res, d.rows.find((r) => r.id === +b.dataset.ed), reload)))
    $('#ex-new').onclick = () => editor(res, null, reload)
  }

  // ------------------------------ 影片评语 ------------------------------
  async function comments(el, q) {
    const kind = q.kind || 'all', st = q.status || 'all', appId = q.app || ''
    const d = await api(`/cms-comments?kind=${kind}&status=${st}&app=${appId}&q=${encodeURIComponent(q.q || '')}`)
    const k = d.kpi
    const link = (o) => '#/admin/comments?' + new URLSearchParams({ kind, status: st, app: appId, q: q.q || '', ...o }).toString()
    el.innerHTML = head('影片评语管理', '所有影片的观众短评与专家评审意见：隐藏 / 置顶 / 官方回复 / 公开精选 / 敏感词扫描', '<button class="btn btn-sm" id="cm-scan"><i class="fa-solid fa-shield-virus"></i>敏感词扫描</button>') + `
      <div class="adm-stats cm-kpi">${[['观众短评', k.audience, 'fa-comments'], ['已隐藏', k.hidden, 'fa-eye-slash'], ['待处理（疑似违规）', k.flagged, 'fa-triangle-exclamation', k.flagged ? 'warn' : ''], ['专家评审', k.experts, 'fa-gavel'], ['公开精选', k.featured, 'fa-star']].map(([l, v, i, c]) => `<div class="adm-stat ${c || ''}"><i class="fa-solid ${i}"></i><b>${v}</b><span>${l}</span></div>`).join('')}</div>
      <div class="cm-cm">
        <aside class="cm-films"><a class="${!appId ? 'on' : ''}" href="${link({ app: '' })}"><b>全部影片</b><span class="xs muted">${d.films.length} 部</span></a>${d.films.map((f) => `<a class="${+appId === f.id ? 'on' : ''}" href="${link({ app: f.id })}"><b>${esc(f.title)}</b><span class="xs muted">观众 ${f.audience}${f.hidden ? ` · 隐藏 ${f.hidden}` : ''} · 专家 ${f.experts}${f.exp_avg ? ` · ${f.exp_avg.toFixed(1)} 分` : ''}</span></a>`).join('')}</aside>
        <div style="min-width:0">
          <div class="cm-filter"><div class="sc-units">${[['all', '全部'], ['audience', '观众短评'], ['expert', '专家评审']].map(([v, l]) => `<a class="${kind === v ? 'on' : ''}" href="${link({ kind: v })}">${l}</a>`).join('')}</div>
            <div class="sc-units">${[['all', '全部状态'], ['visible', '前台可见'], ['hidden', '已隐藏 / 未公开'], ['pinned', '置顶 / 精选'], ['flag', '疑似违规']].map(([v, l]) => `<a class="${st === v ? 'on' : ''}" href="${link({ status: v })}">${l}</a>`).join('')}</div>
            <form id="cm-cq" class="row" style="flex-wrap:nowrap"><input class="input input-sm" name="q" placeholder="搜索评语内容 / 昵称" value="${esc(q.q || '')}"><button class="btn btn-sm"><i class="fa-solid fa-magnifying-glass"></i></button></form></div>
          <div class="cm-batch" hidden><span class="xs"><b id="cm-n">0</b> 条已选</span><button class="btn btn-sm" data-batch="hide">批量隐藏</button><button class="btn btn-sm" data-batch="show">批量恢复</button></div>
          <div class="cm-list">${d.rows.map((x) => x.kind === 'audience' ? `<article class="cm-c ${x.hidden ? 'off' : ''} ${x.flag ? 'flag' : ''}">
              <label class="cm-ck"><input type="checkbox" value="${x.id}"></label>
              <div class="cm-c-b"><div class="cm-c-h"><span class="tag">观众</span><b class="small">${esc(x.name || '匿名')}</b><span class="mono xs gold">${x.score}</span><a class="xs pg-link" href="#/vote/${x.code}" target="_blank">${esc(x.title)}</a><span class="xs dim">${esc(String(x.created_at).slice(0, 16))}</span>
                ${x.pinned ? '<span class="tag gold"><i class="fa-solid fa-thumbtack"></i>置顶</span>' : ''}${x.hidden ? '<span class="tag red">已隐藏</span>' : ''}${x.flag ? `<span class="tag amber">${esc(x.flag)}</span>` : ''}</div>
                <p>${esc(x.comment)}</p>${x.reply ? `<div class="cm-reply"><i class="fa-solid fa-reply"></i><b>官方回复：</b>${esc(x.reply)}</div>` : ''}
                <div class="cm-c-act">${x.hidden ? `<button class="btn btn-sm" data-a="show" data-id="${x.id}">恢复显示</button>` : `<button class="btn btn-sm" data-a="hide" data-id="${x.id}"><i class="fa-regular fa-eye-slash"></i>隐藏</button>`}
                  ${x.pinned ? `<button class="btn btn-sm" data-a="unpin" data-id="${x.id}">取消置顶</button>` : `<button class="btn btn-sm" data-a="pin" data-id="${x.id}"><i class="fa-solid fa-thumbtack"></i>置顶</button>`}
                  <button class="btn btn-sm" data-a="reply" data-id="${x.id}" data-v="${esc(x.reply || '')}"><i class="fa-solid fa-reply"></i>回复</button><button class="btn btn-sm btn-ghost" data-a="delete" data-id="${x.id}"><i class="fa-regular fa-trash-can"></i></button></div></div></article>`
            : `<article class="cm-c ex ${x.public_ok ? '' : 'off'}"><div class="cm-c-b"><div class="cm-c-h"><span class="tag cyan">专家</span><b class="small">${esc(x.expert)}</b><span class="mono xs gold">${x.total} / 100</span>${x.recommend ? '<span class="tag green">推荐晋级</span>' : ''}<a class="xs pg-link" href="#/vote/${x.code}" target="_blank">${esc(x.title)}</a><span class="xs dim">${esc(String(x.created_at).slice(0, 16))}</span>
                ${x.featured ? '<span class="tag gold"><i class="fa-solid fa-star"></i>精选</span>' : ''}${x.public_ok ? '<span class="tag green">前台匿名公开</span>' : '<span class="tag">仅内部</span>'}</div>
                <p>${esc(x.comment)}</p><div class="cm-scores">${Object.entries(x.scores).map(([kk, v]) => `<span>${({ story: '叙事', visual: '视听', ai: 'AI 技术', craft: '完成度', market: '市场' })[kk] || kk} <b>${v}</b></span>`).join('')}</div>
                ${x.op_note ? `<div class="cm-reply"><i class="fa-solid fa-note-sticky"></i><b>运营备注：</b>${esc(x.op_note)}</div>` : ''}
                <div class="cm-c-act">${x.public_ok ? `<button class="btn btn-sm" data-e="unpublish" data-id="${x.id}">撤回公开</button>` : `<button class="btn btn-sm" data-e="publish" data-id="${x.id}"><i class="fa-solid fa-globe"></i>匿名公开</button>`}
                  ${x.featured ? `<button class="btn btn-sm" data-e="unfeature" data-id="${x.id}">取消精选</button>` : `<button class="btn btn-sm" data-e="feature" data-id="${x.id}"><i class="fa-solid fa-star"></i>设为精选</button>`}
                  <button class="btn btn-sm" data-e="note" data-id="${x.id}" data-v="${esc(x.op_note || '')}"><i class="fa-regular fa-note-sticky"></i>备注</button><span class="xs dim">专家评分不可改动</span></div></div></article>`).join('') || '<div class="empty"><i class="fa-regular fa-comments"></i>没有符合条件的评语</div>'}</div>
        </div></div>`
    const reload = () => comments(el, q)
    const act = async (kind2, id, body, ok) => { try { await api(`/cms-comments/${kind2}/${id}`, { body }); toast(ok, 'ok'); reload() } catch (er) { errToast(er) } }
    $$('[data-a]', el).forEach((b) => (b.onclick = () => {
      const a = b.dataset.a, id = b.dataset.id
      if (a === 'reply') return modal('官方回复', `<form id="rp"><textarea class="input" name="t" rows="3" maxlength="300" placeholder="将显示在作品页该条短评下方（留空则删除回复）">${esc(b.dataset.v)}</textarea><button class="btn btn-gold btn-block" style="margin-top:10px">保存回复</button></form>`, (m) => { $('#rp', m).onsubmit = (e) => { e.preventDefault(); closeModal(); act('audience', id, { action: 'reply', reply: e.target.t.value }, '回复已保存') } })
      if (a === 'delete') { const r = prompt('删除将同时移除该条评分，影响作品排名。请填写原因：'); if (!r) return; return act('audience', id, { action: 'delete', reason: r }, '已删除') }
      act('audience', id, { action: a }, { hide: '已隐藏', show: '已恢复', pin: '已置顶', unpin: '已取消置顶' }[a])
    }))
    $$('[data-e]', el).forEach((b) => (b.onclick = () => {
      const a = b.dataset.e, id = b.dataset.id
      if (a === 'note') return modal('运营备注', `<form id="nt"><textarea class="input" name="t" rows="3" maxlength="300">${esc(b.dataset.v)}</textarea><button class="btn btn-gold btn-block" style="margin-top:10px">保存</button></form>`, (m) => { $('#nt', m).onsubmit = (e) => { e.preventDefault(); closeModal(); act('expert', id, { action: 'note', note: e.target.t.value }, '备注已保存') } })
      act('expert', id, { action: a }, { publish: '已匿名公开到作品页', unpublish: '已撤回', feature: '已设为精选', unfeature: '已取消精选' }[a])
    }))
    const sel = () => $$('.cm-ck input:checked', el).map((i) => +i.value)
    $$('.cm-ck input', el).forEach((i) => (i.onchange = () => { const n = sel().length; $('.cm-batch', el).hidden = !n; $('#cm-n').textContent = n }))
    $$('[data-batch]', el).forEach((b) => (b.onclick = async () => { try { const r = await api('/cms-comments/batch', { body: { ids: sel(), action: b.dataset.batch } }); toast(`已处理 ${r.updated} 条`, 'ok'); reload() } catch (er) { errToast(er) } }))
    $('#cm-scan').onclick = async () => { try { const r = await api('/cms-comments/scan', { method: 'POST' }); toast(`扫描 ${r.scanned} 条，标记疑似违规 ${r.flagged} 条`, 'ok'); location.hash = link({ status: 'flag' }) } catch (er) { errToast(er) } }
    $('#cm-cq').onsubmit = (e) => { e.preventDefault(); location.hash = link({ q: e.target.q.value }) }
  }

  // ------------------------------ 站点文案 ------------------------------
  async function settings(el) {
    const d = await api('/cms-settings')
    const groups = [...new Set(d.rows.map((x) => x.grp))]
    el.innerHTML = head('站点文案', '首页、公告条、页脚声明等全站文字；保存后刷新前台即可看到') + `<form id="st-form">${groups.map((g) => `<div class="card" style="margin-bottom:14px"><b class="h3">${esc(g)}</b><div class="cm-form" style="margin-top:10px">${d.rows.filter((x) => x.grp === g).map((x) => `<div class="field ${x.kind === 'textarea' ? 'cm-full' : ''}"><label>${esc(x.label)} <span class="xs dim mono">${esc(x.key)}</span></label>${x.kind === 'textarea' ? `<textarea class="input" name="${x.key}" rows="3">${esc(x.value || '')}</textarea>` : `<input class="input" name="${x.key}" value="${esc(x.value || '')}">`}${x.updated_at ? `<span class="xs dim">更新于 ${esc(String(x.updated_at).slice(0, 16))}</span>` : ''}</div>`).join('')}</div></div>`).join('')}
      <div class="cm-sticky"><button class="btn btn-gold btn-block"><i class="fa-solid fa-floppy-disk"></i>保存全部文案</button></div></form>`
    $('#st-form').onsubmit = async (e) => { e.preventDefault(); const values = {}; d.rows.forEach((x) => (values[x.key] = e.target.elements[x.key].value)); try { const r = await api('/cms-settings', { method: 'PUT', body: { values } }); window.SITE = null; toast(`已保存 ${r.updated} 项`, 'ok') } catch (er) { errToast(er) } }
  }

  // ------------------------------ 媒体库 ------------------------------
  async function media(el) {
    const d = await api('/cms-media')
    el.innerHTML = head('媒体库', '专家照片、文章封面等图片资源（存储于对象存储）', '<label class="btn btn-sm btn-gold"><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden id="md-up"><i class="fa-solid fa-upload"></i>上传图片</label>') +
      `<div class="cm-media">${d.rows.map((m) => `<figure><img src="${m.url}" loading="lazy" alt=""><figcaption class="xs"><span>${esc(m.name || '#' + m.id)}</span><button class="btn btn-sm btn-ghost" data-copy="${m.url}">复制地址</button></figcaption></figure>`).join('') || '<div class="empty">媒体库为空</div>'}</div>`
    $('#md-up').onchange = async (e) => { for (const f of e.target.files) { try { await uploadImage(f) } catch (er) { errToast(er) } } toast('上传完成', 'ok'); media(el) }
    $$('[data-copy]', el).forEach((b) => (b.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(location.origin + b.dataset.copy); toast('地址已复制', 'ok') }))
  }

  // ------------------------------ 审计日志 ------------------------------
  async function auditPage(el, q) {
    const d = await api('/cms-audit?q=' + encodeURIComponent(q.q || ''))
    el.innerHTML = head('审计日志', '后台每一次新建 / 修改 / 删除 / 审核都有记录') + `<form id="au-q" class="row" style="flex-wrap:nowrap;margin-bottom:12px"><input class="input input-sm" name="q" placeholder="搜索操作人 / 动作 / 对象" value="${esc(q.q || '')}"><button class="btn btn-sm">搜索</button></form>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>详情</th></tr></thead><tbody>${d.rows.map((x) => `<tr><td data-l="时间" class="mono xs">${esc(String(x.created_at).slice(5, 16))}</td><td data-l="操作人" class="small">${esc(x.actor)}</td><td data-l="动作"><span class="tag">${esc(x.action)}</span></td><td data-l="对象" class="mono xs">${esc(x.object)}</td><td data-l="详情" class="xs muted">${esc(String(x.detail || '').slice(0, 80))}</td></tr>`).join('')}</tbody></table></div>`
    $('#au-q').onsubmit = (e) => { e.preventDefault(); location.hash = '#/admin/audit?q=' + encodeURIComponent(e.target.q.value) }
  }

  // ------------------------------ 总控台 ------------------------------
  async function dashboard(el) {
    const [d, s, list] = await Promise.all([api('/cms-dashboard'), api('/admin/stats'), schema()])
    const k = d.kpi
    const todo = [[k.v_pending, '视频待审核', '#/admin/videos', 'fa-film'], [k.m_pending, '申报材料待审阅', '#/admin/materials', 'fa-folder-open'], [k.t_pending, '出海片单待上架', '#/admin/export', 'fa-earth-asia'], [k.c_flag, '评语疑似违规', '#/admin/comments?status=flag', 'fa-triangle-exclamation'], [k.no_photo, '评审 / 导师缺照片', '#/admin/experts', 'fa-camera'], [s.roadshow, '路演待录入', '#/admin/roadshow', 'fa-person-chalkboard'], [s.to_approve, '算力待审批', '#/admin/roadshow', 'fa-stamp'], [k.tickets, '法务 / 合规工单', '#/workbench', 'fa-scale-balanced']].filter((x) => x[0])
    el.innerHTML = head('后台总控台', '全站运营数据、待办与前台内容入口') + `
      <div class="adm-stats">${[['注册用户', k.users, 'fa-users'], ['报名作品', k.apps, 'fa-clapperboard'], ['上线视频', s.live_videos, 'fa-circle-play'], ['累计播放', s.plays.toLocaleString(), 'fa-eye'], ['大众评分', s.votes.toLocaleString(), 'fa-star'], ['专家评审', s.reviews, 'fa-gavel'], ['进行中交易', k.deals, 'fa-handshake'], ['已发算力', window.lyTok ? window.lyTok(s.granted) : s.granted, 'fa-microchip']].map(([l, v, i]) => `<div class="adm-stat"><i class="fa-solid ${i}"></i><b>${v}</b><span>${l}</span></div>`).join('')}</div>
      <div class="cards c2" style="margin-top:16px">
        <div class="card"><b class="h3">待办 ${todo.length ? `<span class="tag red">${todo.reduce((a, t) => a + t[0], 0)}</span>` : ''}</b><div class="adm-todo">${todo.map(([n, l, h, i]) => `<a href="${h}"><i class="fa-solid ${i} gold"></i><span>${l} <b>${n}</b></span><i class="fa-solid fa-chevron-right dim"></i></a>`).join('') || '<p class="small muted" style="margin-top:8px">暂无待办 🎉</p>'}</div></div>
        <div class="card"><b class="h3">最近操作</b><div class="cm-logs">${d.logs.map((x) => `<div><span class="mono xs dim">${esc(String(x.created_at).slice(5, 16))}</span><b class="xs">${esc(x.actor)}</b><span class="xs muted">${esc(x.action)} · ${esc(x.object)}</span></div>`).join('')}</div><a class="pg-link xs" href="#/admin/audit">全部审计日志 →</a></div>
      </div>
      <b class="h3" style="display:block;margin:22px 0 10px">前台 ↔ 后台对照</b>
      <div class="cm-map">${MAP(list).map(([front, label, items]) => `<div class="cm-map-row"><a class="cm-map-f" href="${front}" target="_blank"><i class="fa-solid fa-display"></i>${label}<span class="mono xs dim">${front}</span></a><div class="cm-map-b">${items.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</div></div>`).join('')}</div>`
  }
  const MAP = () => [
    ['#/', '首页', [['#/admin/settings', '首页文案 / 公告条'], ['#/admin/content?res=apps', '主推作品'], ['#/admin/experts', '评审导师']]],
    ['#/fund', '1 亿元扶持', [['#/admin/content?res=compute', '算力资金池'], ['#/admin/content?res=promo', '宣发资金池'], ['#/admin/settings', '扶持声明']]],
    ['#/screening', '展映厅', [['#/admin/screening', '展映单元 / 主推 / 宣发发放'], ['#/admin/videos', '视频审核']]],
    ['#/board', '初选榜 / 作品页', [['#/admin/content?res=apps', '报名作品信息'], ['#/admin/comments', '影片评语'], ['#/admin/selection', '评选总表']]],
    ['#/jury', '评审与导师', [['#/admin/experts', '照片 / 头衔 / 邀约状态 / 排序']]],
    ['#/support', '配套支持', [['#/admin/experts?t=experts', '专家库'], ['#/admin/content?res=likeness', '肖像授权库']]],
    ['#/diedai', '迭代盛典', [['#/admin/content?res=sections', '栏目内容'], ['#/admin/content?res=posts', '公众号文章']]],
    ['#/guide', '申报材料', [['#/admin/materials', '材料审阅 / 补件']]],
    ['#/export', '出海与交易', [['#/admin/export', '片单审核 / 交易'], ['#/admin/content?res=channels', '发行渠道'], ['#/admin/content?res=demands', '机构需求']]],
    ['#/events', '路演活动 / 学院', [['#/admin/content?res=events', '活动'], ['#/admin/content?res=insights', '行业洞察'], ['#/admin/content?res=courses', '课程']]],
    ['#/me', '用户', [['#/admin/content?res=users', '用户 / 角色 / 停用']]],
  ]

  window.CMS = { dashboard, content, experts, comments, settings, media, audit: auditPage }

  // ------------------------------ 前台：站点文案 ------------------------------
  window.siteText = async () => (window.SITE = window.SITE || (await api('/site').catch(() => ({}))))
})()
