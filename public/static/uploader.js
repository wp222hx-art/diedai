/* 迭影计划 · 分片断点续传上传器（R2 multipart）
 * - 8MB 分片、3 路并发、单片失败自动重试 4 次（指数退避）
 * - 断网 / 切后台 / 刷新后，重新选择同一文件即从已完成分片继续
 * - 移动端：上传期间申请屏幕常亮（Wake Lock），离开页面前提示
 * - 视频分类：正片 / 预告 / 先导片A / 先导片B / 样章 / 花絮
 */
(function () {
  const CATS = ['正片', '预告', '先导片A', '先导片B', '样章', '花絮']
  const CAT_TIP = { 正片: '完整成片或当前最完整版本', 预告: '30 秒—3 分钟宣传预告', 先导片A: '30—60 秒 · 故事、人物与情绪', 先导片B: '30—60 秒 · 连续叙事 / 同一角色跨镜头', 样章: '约 2—3 分钟连续片段（第二轮）', 花絮: '幕后、制作过程记录' }
  const fmtMB = (b) => (b >= 1073741824 ? (b / 1073741824).toFixed(2) + ' GB' : (b / 1048576).toFixed(1) + ' MB')
  const fmtT = (s) => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}` }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  function readDuration(file) {
    if (!/^video\//.test(file.type)) return Promise.resolve(0)
    return new Promise((res) => {
      const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true
      const t = setTimeout(() => res(0), 4000)
      v.onloadedmetadata = () => { clearTimeout(t); res(isFinite(v.duration) ? Math.round(v.duration) : 0); URL.revokeObjectURL(v.src) }
      v.onerror = () => { clearTimeout(t); res(0) }
      v.src = URL.createObjectURL(file)
    })
  }

  async function call(method, path, body, raw) {
    const h = { Authorization: 'Bearer ' + S.token }
    if (!raw) h['Content-Type'] = 'application/json'
    const r = await fetch('/api' + path, { method, headers: h, body: raw ? body : body ? JSON.stringify(body) : undefined })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw { status: r.status, ...d }
    return d
  }

  /** 核心：分片上传。返回 complete 结果；ctl.cancel() 可中止 */
  function chunkUpload({ app_id, file, purpose = 'video', item_code, category, duration, onProgress, onState }) {
    let stopped = false, lock = null
    const ctl = { cancel: () => { stopped = true }, token: null }
    const guard = (e) => { e.preventDefault(); e.returnValue = '视频仍在上传，离开将暂停上传（可稍后续传）' }
    ctl.promise = (async () => {
      try { if (navigator.wakeLock) lock = await navigator.wakeLock.request('screen') } catch {}
      window.addEventListener('beforeunload', guard)
      try {
        onState && onState('准备中…')
        const init = await call('POST', '/uploads/init', { app_id, purpose, item_code, category, file_name: file.name, size: file.size, mime: file.type, duration })
        ctl.token = init.token
        const done = new Set(init.done)
        const ps = init.part_size, total = init.total
        let sent = [...done].reduce((a, n) => a + Math.min(ps, file.size - (n - 1) * ps), 0)
        const t0 = Date.now(), base = sent
        const tick = () => {
          const sec = (Date.now() - t0) / 1000, rate = sec > 0.5 ? (sent - base) / sec : 0
          onProgress && onProgress({ loaded: sent, total: file.size, pct: (sent / file.size) * 100, rate, eta: rate ? (file.size - sent) / rate : 0, parts: done.size, totalParts: total })
        }
        if (init.resumed && done.size) onState && onState(`已从第 ${done.size + 1} / ${total} 片继续上传`)
        else onState && onState('上传中')
        tick()
        const queue = []; for (let n = 1; n <= total; n++) if (!done.has(n)) queue.push(n)
        const worker = async () => {
          while (queue.length && !stopped) {
            const n = queue.shift()
            const blob = file.slice((n - 1) * ps, Math.min(n * ps, file.size))
            for (let k = 0; ; k++) {
              try {
                await new Promise((res, rej) => {
                  const x = new XMLHttpRequest()
                  x.open('PUT', `/api/uploads/${init.token}/part/${n}`)
                  x.setRequestHeader('Authorization', 'Bearer ' + S.token)
                  x.setRequestHeader('Content-Type', 'application/octet-stream')
                  let last = 0
                  x.upload.onprogress = (e) => { sent += e.loaded - last; last = e.loaded; tick() }
                  x.onload = () => { if (x.status >= 200 && x.status < 300) res(); else { sent -= last; let d = {}; try { d = JSON.parse(x.responseText) } catch {} rej({ status: x.status, ...d }) } }
                  x.onerror = () => { sent -= last; rej({ status: 0, error: '网络中断' }) }
                  x.send(blob)
                })
                done.add(n); tick(); break
              } catch (e) {
                if (stopped || (e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429)) throw e
                if (k >= 3) throw { ...e, error: (e.error || '网络中断') + '，已上传部分已保存，可点「继续上传」' }
                onState && onState(`网络波动，第 ${n} 片重试中（${k + 1}/3）…`)
                await sleep(800 * 2 ** k)
                onState && onState('上传中')
              }
            }
          }
        }
        await Promise.all([worker(), worker(), worker()])
        if (stopped) throw { status: -1, error: '已暂停，重新选择同一文件即可续传' }
        onState && onState('正在合并文件…')
        return await call('POST', `/uploads/${init.token}/complete`)
      } finally {
        window.removeEventListener('beforeunload', guard)
        try { lock && lock.release() } catch {}
      }
    })()
    return ctl
  }
  window.chunkUpload = chunkUpload
  window.fmtMB = fmtMB

  /** 上传弹窗：本地文件（分片续传）/ 平台链接；可选视频分类 */
  function openUpload(app, onDone, opt = {}) {
    if (!S.user) { location.hash = '#/login?next=' + encodeURIComponent(location.hash); return }
    const cat0 = opt.category || '正片'
    modal(`上传作品视频 · ${esc(app.title)}`, `
      <div class="ul-cats" id="ul-cats" role="radiogroup" aria-label="视频类型">${CATS.map((c) => `<button type="button" role="radio" class="${c === cat0 ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
      <p class="xs muted" id="ul-cat-tip" style="margin:-4px 0 14px">${CAT_TIP[cat0]}</p>
      <div class="ly-seg" id="up-seg" style="margin-bottom:14px"><button type="button" class="on" data-v="file"><i class="fa-solid fa-mobile-screen"></i> 本地 / 相册</button><button type="button" data-v="link"><i class="fa-solid fa-link"></i> 平台链接</button></div>
      <form id="up-file">
        <label class="up-drop" id="up-drop"><input type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" hidden>
          <i class="fa-solid fa-cloud-arrow-up"></i><b>点击从相册 / 文件选择视频</b><span class="xs muted">MP4 / MOV / WebM · 单个最大 4GB · 断网可续传</span></label>
        <div id="up-info" class="ul-info" hidden></div>
        <div class="ul-prog" hidden><div class="up-bar"><i></i></div><div class="between xs mono"><span id="up-pct">0%</span><span id="up-rate" class="muted"></span></div><div class="xs muted" id="up-state"></div></div>
        <div class="row ul-actions"><button class="btn btn-gold btn-block" id="up-go" disabled><i class="fa-solid fa-upload"></i>开始上传</button><button type="button" class="btn" id="up-stop" hidden>暂停</button></div>
      </form>
      <form id="up-link" hidden>
        <div class="field"><label>视频链接<em>*</em></label><input class="input" name="url" type="url" inputmode="url" autocapitalize="off" placeholder="https://www.bilibili.com/video/BV… 或 .mp4 直链"><span class="hint">B站 / 腾讯视频 / 优酷 / YouTube / Vimeo 可站内播放；抖音、网盘以外链展示</span></div>
        <div class="grid2"><div class="field"><label>标题</label><input class="input" name="title" placeholder="如：正片 / 先导预告"></div><div class="field"><label>时长（秒）</label><input class="input" type="number" inputmode="numeric" name="duration" min="1"></div></div>
        <button class="btn btn-gold btn-block">提交链接</button>
      </form>
      <p class="xs dim" style="margin-top:12px"><i class="fa-solid fa-shield-halved"></i> 文件直接存入平台对象存储，提交后进入运营审核，通过即进入<a class="pg-link" href="#/screening">展映厅</a>公开播放。同类型重新上传会替换旧版本。请确认拥有全部素材的合法授权。</p>`, (m) => {
      let cat = cat0
      $$('#ul-cats button', m).forEach((b) => (b.onclick = () => { cat = b.dataset.c; $$('#ul-cats button', m).forEach((x) => x.classList.toggle('on', x === b)); $('#ul-cat-tip', m).textContent = CAT_TIP[cat] }))
      const seg = $('#up-seg', m), ff = $('#up-file', m), lf = $('#up-link', m)
      $$('button', seg).forEach((b) => (b.onclick = () => { $$('button', seg).forEach((x) => x.classList.toggle('on', x === b)); ff.hidden = b.dataset.v !== 'file'; lf.hidden = b.dataset.v !== 'link' }))
      let file = null, dur = 0, ctl = null
      const inp = $('input[type=file]', m), drop = $('#up-drop', m), go = $('#up-go', m), stop = $('#up-stop', m)
      const pick = async (f) => {
        if (!f) return
        const type = f.type || ({ mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' }[(f.name.split('.').pop() || '').toLowerCase()] || '')
        if (!/^video\/(mp4|webm|quicktime)$/.test(type)) return toast('仅支持 MP4 / MOV / WebM', 'err')
        if (f.size > 4 * 1073741824) return toast('文件超过 4GB，请压缩或使用平台链接', 'err')
        file = type === f.type ? f : new File([f], f.name, { type })
        dur = await readDuration(file)
        const info = $('#up-info', m); info.hidden = false
        info.innerHTML = `<i class="fa-solid fa-film"></i><div><b class="small">${esc(f.name)}</b><span class="xs muted">${fmtMB(f.size)}${dur ? ' · ' + fmtT(dur) : ''} · ${Math.ceil(f.size / 8388608)} 个分片</span></div>`
        go.disabled = false
      }
      inp.onchange = () => pick(inp.files[0])
      drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over') }
      drop.ondragleave = () => drop.classList.remove('over')
      drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); pick(e.dataTransfer.files[0]) }
      ff.onsubmit = async (e) => {
        e.preventDefault(); if (!file || ctl) return
        go.disabled = true; go.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>上传中'; stop.hidden = false; drop.classList.add('busy')
        const prog = $('.ul-prog', m); prog.hidden = false
        ctl = chunkUpload({
          app_id: app.id, file, category: cat, duration: dur,
          onProgress: (p) => { $('i', prog).style.width = p.pct + '%'; $('#up-pct', m).textContent = `${p.pct.toFixed(1)}% · ${fmtMB(p.loaded)} / ${fmtMB(p.total)}`; $('#up-rate', m).textContent = p.rate ? `${fmtMB(p.rate)}/s · 剩余 ${fmtT(p.eta)}` : '' },
          onState: (s) => { $('#up-state', m).textContent = s },
        })
        stop.onclick = () => ctl && ctl.cancel()
        try {
          await ctl.promise
          closeModal(); toast('<i class="fa-solid fa-circle-check"></i> 上传完成，已保存并提交审核', 'ok'); onDone && onDone()
        } catch (er) {
          ctl = null; stop.hidden = true; drop.classList.remove('busy')
          go.disabled = false; go.innerHTML = '<i class="fa-solid fa-rotate-right"></i>继续上传'
          $('#up-state', m).innerHTML = `<span class="red">${esc(er.error || '上传失败')}</span>`
          if (er.status !== -1) errToast(er)
        }
      }
      lf.onsubmit = async (e) => {
        e.preventDefault()
        try { await api(`/program/apps/${app.id}/video`, { body: { url: lf.url.value.trim(), title: lf.title.value || cat, duration: +lf.duration.value || null, category: cat } }); closeModal(); toast('链接已提交，等待运营审核', 'ok'); onDone && onDone() } catch (er) { errToast(er) }
      }
    })
  }
  window.openVideoUpload = openUpload
  window.VIDEO_CATS = CATS

  /** 登录后检测未完成上传，提示续传 */
  window.checkPendingUploads = async (el) => {
    if (!S.user || !el) return
    try {
      const d = await api('/uploads')
      if (!d.rows.length) return
      el.innerHTML = d.rows.slice(0, 3).map((u) => `<div class="ul-resume"><i class="fa-solid fa-pause"></i><div><b class="small">${esc(u.file_name)}</b><span class="xs muted">${esc(u.title)} · ${esc(u.category || '申报材料')} · 已传 ${Math.min(100, Math.round((u.done * u.part_size / u.size) * 100))}%</span></div><button class="btn btn-sm btn-gold" data-resume="${u.app_id}" data-t="${esc(u.title)}" data-c="${esc(u.category || '正片')}" data-p="${u.purpose}">续传</button></div>`).join('')
      $$('[data-resume]', el).forEach((b) => (b.onclick = () => {
        if (b.dataset.p === 'material') { location.hash = '#/materials/' + b.dataset.resume; return }
        openUpload({ id: +b.dataset.resume, title: b.dataset.t }, () => router(), { category: b.dataset.c })
        setTimeout(() => toast('请重新选择同一视频文件，将自动从断点继续', ''), 300)
      }))
    } catch {}
  }
})()
