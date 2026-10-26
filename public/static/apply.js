/* 迭影计划 · 分步报名（移动优先）
 * 流程：0 账号（未登录时内嵌快速注册/登录） → 1 赛道 → 2 作品 → 3 团队 → 4 确认提交 → 完成页（上传视频 / 分享打分）
 * 特性：草稿自动保存（localStorage）、逐步校验、底部固定操作栏、iOS 不缩放输入、系统分享 */
(function () {
  const R = window.ROUTES
  const KEY = 'dd_apply_draft'
  const FORMS = [['AI电影', 'fa-film', '长片 / 院线'], ['AI短片', 'fa-clapperboard', '30 分钟以内'], ['AI剧集', 'fa-tv', '多集剧集'], ['AI动画', 'fa-wand-magic-sparkles', '动画 / 漫剧']]
  const YEARS = [2027, 2026, 2025, 2024, 2023, 2022, 2021]
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d))

  R.apply = async (app, _p, q = {}) => {
    if (S.user && S.user.role !== 'creator') {
      app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-circle-info"></i>迭影计划面向创作团队报名，当前账号为「${esc(S.user.role_label || '')}」。<div style="margin-top:14px"><a class="btn btn-sm" href="#/">返回计划首页</a></div></div></div>`
      return
    }
    const d = Object.assign({ track: '', form: 'AI短片', minutes: 20, grad_year: 2026 }, load())
    if (q.track === '院校毕业生' || q.track === '专业团队') d.track = q.track
    const STEPS = S.user ? ['赛道', '作品', '团队', '确认'] : ['账号', '赛道', '作品', '团队', '确认']
    let i = Math.min(+(q.step || sessionStorage.getItem('dd_apply_step') || 0) || 0, STEPS.length - 1)
    if (!S.user) i = 0
    document.body.classList.add('flow-mode')

    const shell = () => {
      if (S.user) sessionStorage.setItem('dd_apply_step', i)
      const t = $('#toast'); if (t) t.className = ''
      app.innerHTML = `<div class="ap">
        <header class="ap-top"><div class="wrap ap-top-in">
          <a class="ap-close" href="#/" aria-label="退出报名"><i class="fa-solid fa-xmark"></i></a>
          <div class="ap-title"><b>报名迭影计划</b><span class="xs muted">第 ${i + 1} / ${STEPS.length} 步 · ${STEPS[i]}</span></div>
          <span class="ap-save xs dim" id="ap-save"><i class="fa-solid fa-cloud"></i> 草稿已保存</span></div>
          <div class="ap-prog"><i style="width:${((i + 1) / STEPS.length) * 100}%"></i></div>
          <ol class="ap-steps wrap">${STEPS.map((s, k) => `<li class="${k < i ? 'done' : k === i ? 'on' : ''}"><span>${k < i ? '<i class="fa-solid fa-check"></i>' : k + 1}</span>${s}</li>`).join('')}</ol>
        </header>
        <main class="wrap ap-body" id="ap-body"></main>
        <footer class="ap-bar"><div class="wrap ap-bar-in">
          ${i > 0 && !(STEPS[i] === '赛道' && !S.user && false) ? '<button class="btn ap-back" id="ap-back"><i class="fa-solid fa-chevron-left"></i>上一步</button>' : ''}
          <button class="btn btn-gold ap-next" id="ap-next">${STEPS[i] === '确认' ? '<i class="fa-solid fa-paper-plane"></i>确认提交' : STEPS[i] === '账号' ? '注册并继续' : '下一步<i class="fa-solid fa-chevron-right"></i>'}</button>
        </div></footer></div>`
      const body = $('#ap-body')
      VIEWS[STEPS[i]](body)
      const back = $('#ap-back'); if (back) back.onclick = () => go(i - 1)
      $('#ap-next').onclick = next
      body.querySelectorAll('input,select,textarea').forEach((el) => {
        el.addEventListener('input', collect)
        el.addEventListener('change', collect)
      })
      window.scrollTo(0, 0)
      const first = body.querySelector('[data-autofocus]'); if (first && window.innerWidth > 640) first.focus()
    }
    const go = (k) => { collect(); i = Math.max(0, Math.min(k, STEPS.length - 1)); shell() }
    let saveT
    const collect = () => {
      const f = $('#ap-form'); if (!f) return
      new FormData(f).forEach((v, k) => { if (!k.startsWith('auth_')) d[k] = v })
      f.querySelectorAll('input[type=checkbox]').forEach((c) => { if (!c.name.startsWith('auth_')) d[c.name] = c.checked })
      if (f.school) d.school_final = window.schoolValue(f)
      save(d)
      const s = $('#ap-save'); if (s) { s.classList.add('on'); clearTimeout(saveT); saveT = setTimeout(() => s.classList.remove('on'), 1200) }
    }
    const err = (name, msg) => {
      const el = document.querySelector(`[name="${name}"]`) || document.querySelector(`[data-field="${name}"]`)
      const box = el && el.closest('.field')
      if (box) { box.classList.add('bad'); let m = box.querySelector('.err'); if (!m) { m = document.createElement('div'); m.className = 'err'; box.appendChild(m) } m.textContent = msg; box.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
      toast('<i class="fa-solid fa-circle-exclamation"></i> ' + esc(msg), 'err')
      return false
    }
    const clearErr = () => $$('.field.bad').forEach((x) => { x.classList.remove('bad'); const m = x.querySelector('.err'); m && m.remove() })

    // ---------------- 各步骤视图 ----------------
    const VIEWS = {
      账号: (el) => {
        el.innerHTML = `<form id="ap-form" class="ap-card" autocomplete="on" novalidate>
          <h2 class="ap-h">先创建账号</h2><p class="small muted ap-sub">30 秒完成，报名进度、打分链接与算力都会保存在账号中。</p>
          <div class="ly-seg ap-seg" id="auth-mode"><button type="button" class="on" data-v="reg">新用户注册</button><button type="button" data-v="login">已有账号登录</button></div>
          <div class="field" data-reg><label for="a-name">姓名 / 团队负责人<em>*</em></label><input id="a-name" class="input" name="auth_name" autocomplete="name" enterkeyhint="next" data-autofocus></div>
          <div class="field"><label for="a-email">邮箱<em>*</em></label><input id="a-email" class="input" name="auth_email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" enterkeyhint="next" placeholder="name@example.com"></div>
          <div class="field"><label for="a-pwd">密码<em>*</em></label><div class="ap-pwd"><input id="a-pwd" class="input" name="auth_password" type="password" autocomplete="new-password" enterkeyhint="go" placeholder="至少 8 位"><button type="button" class="ap-eye" aria-label="显示密码"><i class="fa-regular fa-eye"></i></button></div></div>
          <label class="check" data-reg><input type="checkbox" name="auth_agree"> 我已阅读并同意《用户协议》《隐私政策》</label>
          <p class="xs dim" style="margin-top:12px">演示可直接登录：creator2@demo.cn / demo1234</p>
        </form>`
        const seg = $('#auth-mode'), btn = $('#ap-next')
        $$('button', seg).forEach((b) => (b.onclick = () => {
          $$('button', seg).forEach((x) => x.classList.toggle('on', x === b))
          const reg = b.dataset.v === 'reg'
          $$('[data-reg]').forEach((x) => (x.style.display = reg ? '' : 'none'))
          $('#a-pwd').autocomplete = reg ? 'new-password' : 'current-password'
          btn.textContent = reg ? '注册并继续' : '登录并继续'
        }))
        $('.ap-eye').onclick = () => { const p = $('#a-pwd'); p.type = p.type === 'password' ? 'text' : 'password' }
        $('#a-pwd').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); next() } }
      },
      赛道: (el) => {
        el.innerHTML = `<form id="ap-form" class="ap-card" novalidate>
          <h2 class="ap-h">选择报名赛道</h2><p class="small muted ap-sub">两条赛道独立排名、独立分配算力额度。</p>
          <div class="ap-choice field" data-field="track">
            ${[['专业团队', 'fa-users-gear', 'AI 专业电影团队', '工作室 / 团队，提交成片、样片或 1—3 分钟概念片'], ['院校毕业生', 'fa-graduation-cap', '影视院校毕业生', '2021—2027 届，可用毕业作品或新项目报名 · 可同步推荐参评第四届迭代盛典']]
              .map(([v, ic, t, p]) => `<label class="ap-opt ${d.track === v ? 'on' : ''}"><input type="radio" name="track" value="${v}" ${d.track === v ? 'checked' : ''}><i class="fa-solid ${ic}"></i><div><b>${t}</b><span>${p}</span></div><em class="fa-solid fa-circle-check"></em></label>`).join('')}
          </div>
          <div id="grad-box" style="${d.track === '院校毕业生' ? '' : 'display:none'}">
            <div class="field" data-field="school"><label>毕业院校<em>*</em></label>${window.schoolPicker('school', d.school || '')}</div>
            <div class="field" data-field="grad_year"><label>毕业届别<em>*</em></label><div class="ap-chips">${YEARS.map((y) => `<label class="ap-chip"><input type="radio" name="grad_year" value="${y}" ${+d.grad_year === y ? 'checked' : ''}><span>${y} 届</span></label>`).join('')}</div></div>
          </div>
        </form>`
        const f = $('#ap-form'); window.bindSchoolPicker(f)
        if (d.school === '__other' && f.school_other) { f.school_other.style.display = ''; f.school_other.value = d.school_other || '' }
        $$('.ap-opt input', f).forEach((r) => (r.onchange = () => { $$('.ap-opt', f).forEach((x) => x.classList.toggle('on', x.contains(r) && r.checked)); $('#grad-box').style.display = r.value === '院校毕业生' ? '' : 'none'; collect() }))
      },
      作品: (el) => {
        el.innerHTML = `<form id="ap-form" class="ap-card" novalidate>
          <h2 class="ap-h">作品信息</h2><p class="small muted ap-sub">可先报名后完善，提交后仍可上传 / 更换视频。</p>
          <div class="field"><label for="f-title">作品名称<em>*</em></label><input id="f-title" class="input" name="title" maxlength="40" value="${esc(d.title || '')}" placeholder="不含书名号" enterkeyhint="next" data-autofocus></div>
          <div class="field" data-field="form"><label>作品形态<em>*</em></label><div class="ap-grid2">${FORMS.map(([v, ic, p]) => `<label class="ap-tile ${d.form === v ? 'on' : ''}"><input type="radio" name="form" value="${v}" ${d.form === v ? 'checked' : ''}><i class="fa-solid ${ic}"></i><b>${v}</b><span>${p}</span></label>`).join('')}</div></div>
          <div class="field"><label for="f-min">成片 / 计划时长</label><div class="ap-stepper"><button type="button" data-d="-5" aria-label="减少">−</button><input id="f-min" class="input" name="minutes" type="number" inputmode="numeric" min="1" max="300" value="${esc(d.minutes || 20)}"><span>分钟</span><button type="button" data-d="5" aria-label="增加">+</button></div></div>
          <div class="field"><label for="f-log">一句话梗概<em>*</em></label><textarea id="f-log" class="input" name="logline" maxlength="200" rows="3" placeholder="例：雾中港口的旧信件，牵出三代人未竟的告别。">${esc(d.logline || '')}</textarea><div class="ap-count xs dim"><span id="log-n">${(d.logline || '').length}</span> / 200 · 至少 10 字</div></div>
        </form>`
        const f = $('#ap-form')
        $$('.ap-tile input', f).forEach((r) => (r.onchange = () => $$('.ap-tile', f).forEach((x) => x.classList.toggle('on', x.contains(r)))))
        $$('.ap-stepper button', f).forEach((b) => (b.onclick = () => { const m = f.minutes; m.value = Math.max(1, Math.min(300, (+m.value || 0) + +b.dataset.d)); collect() }))
        f.logline.oninput = () => { $('#log-n').textContent = f.logline.value.length }
      },
      团队: (el) => {
        el.innerHTML = `<form id="ap-form" class="ap-card" novalidate>
          <h2 class="ap-h">团队与样片</h2><p class="small muted ap-sub">样片链接选填，提交后也可在「我的」直接上传视频文件。</p>
          <div class="field"><label for="t-team">团队名称<em>*</em></label><input id="t-team" class="input" name="team" maxlength="40" value="${esc(d.team || (d.track === '院校毕业生' && d.school_final ? d.school_final.split(' ')[0] + ' ' + (d.grad_year || '') + ' 届' : ''))}" enterkeyhint="next" data-autofocus></div>
          <div class="field"><label for="t-mem">主创成员</label><input id="t-mem" class="input" name="members" maxlength="120" value="${esc(d.members || '')}" placeholder="导演 / 编剧 / AIGC 技术，逗号分隔" enterkeyhint="next"></div>
          <div class="field"><label for="t-url">样片 / 概念片链接</label><input id="t-url" class="input" name="video_url" type="url" inputmode="url" autocapitalize="off" value="${esc(d.video_url || '')}" placeholder="B站 / 视频号 / 网盘链接" enterkeyhint="done"><span class="hint">建议 1—3 分钟；B站、腾讯视频、优酷链接可在作品页直接播放</span></div>
        </form>`
      },
      确认: (el) => {
        const row = (k, v, step) => `<div class="ap-rv"><span>${k}</span><b>${esc(v || '—')}</b><button type="button" class="ap-edit" data-go="${step}">修改</button></div>`
        const idx = (n) => STEPS.indexOf(n)
        el.innerHTML = `<form id="ap-form" class="ap-card" novalidate>
          <h2 class="ap-h">确认报名信息</h2><p class="small muted ap-sub">提交后生成专属打分链接，作品进入初选榜。</p>
          <div class="ap-review">
            ${row('赛道', d.track === '院校毕业生' ? '影视院校毕业生' : 'AI 专业电影团队', idx('赛道'))}
            ${d.track === '院校毕业生' ? row('院校 / 届别', `${d.school_final || ''} · ${d.grad_year} 届`, idx('赛道')) : ''}
            ${row('作品', `《${d.title || ''}》 · ${d.form} · ${d.minutes || '—'} 分钟`, idx('作品'))}
            ${row('梗概', d.logline, idx('作品'))}
            ${row('团队', d.team, idx('团队'))}
            ${d.members ? row('主创', d.members, idx('团队')) : ''}
            ${row('样片', d.video_url || '提交后上传', idx('团队'))}
          </div>
          <div class="field" data-field="accept" style="margin-top:16px"><label class="check ap-accept"><input type="checkbox" name="accept" ${d.accept ? 'checked' : ''}> 我已阅读并同意《迭影计划报名规则》：作品权利清晰，使用的肖像、音乐与素材均已获授权；同意平台展示作品信息用于初选。</label></div>
          ${d.track === '院校毕业生' ? '<div class="notice"><i class="fa-solid fa-trophy"></i><div>院校毕业生作品可同步推荐参评 <a class="pg-link" href="#/diedai">第四届迭代盛典</a>（以组委会官方报名为准）。</div></div>' : ''}
        </form>`
        $$('.ap-edit').forEach((b) => (b.onclick = () => go(+b.dataset.go)))
      },
    }

    // ---------------- 校验与推进 ----------------
    async function next() {
      clearErr(); collect()
      const step = STEPS[i], f = $('#ap-form'), btn = $('#ap-next')
      if (step === '账号') {
        const reg = $('#auth-mode .on').dataset.v === 'reg'
        const name = f.auth_name.value.trim(), email = f.auth_email.value.trim(), pwd = f.auth_password.value
        if (reg && !name) return err('auth_name', '请填写姓名')
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('auth_email', '请填写正确的邮箱')
        if (reg ? pwd.length < 8 : !pwd) return err('auth_password', reg ? '密码至少 8 位' : '请输入密码')
        if (reg && !f.auth_agree.checked) return err('auth_agree', '请先同意用户协议与隐私政策')
        btn.disabled = true; btn.textContent = '请稍候…'
        try {
          const r = await api(reg ? '/auth/register' : '/auth/login', { body: reg ? { name, email, password: pwd, role: 'creator', org: '' } : { email, password: pwd } })
          setSession(r.token, r.user)
          if (r.user.role !== 'creator') { toast('该账号不是创作者账号，无法报名', 'err'); return R.apply(app, [], {}) }
          toast('欢迎，' + esc(r.user.name), 'ok')
          STEPS.shift(); i = 0; if (d.track) i = 1; shell()
        } catch (er) { btn.disabled = false; btn.textContent = reg ? '注册并继续' : '登录并继续'; if (er.status === 409) err('auth_email', '该邮箱已注册，请切换到「已有账号登录」'); else if (er.status === 401) err('auth_password', er.error || '邮箱或密码错误'); else errToast(er) }
        return
      }
      if (step === '赛道') {
        if (!d.track) return err('track', '请选择报名赛道')
        if (d.track === '院校毕业生') {
          if (!d.school_final) return err('school', '请选择或填写毕业院校')
          if (!d.grad_year) return err('grad_year', '请选择毕业届别')
        }
      }
      if (step === '作品') {
        if (!(d.title || '').trim()) return err('title', '请填写作品名称')
        if ((d.logline || '').trim().length < 10) return err('logline', '一句话梗概至少 10 字')
      }
      if (step === '团队') {
        if (!(d.team || '').trim()) return err('team', '请填写团队名称')
        if (d.video_url && !/^https?:\/\//.test(d.video_url)) return err('video_url', '链接需以 http(s):// 开头')
      }
      if (step === '确认') {
        if (!d.accept) return err('accept', '请勾选同意报名规则')
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>提交中…'
        try {
          const body = { track: d.track, title: d.title.trim(), team: d.team.trim(), form: d.form, minutes: +d.minutes || null, logline: d.logline.trim(), video_url: d.video_url || '', members: d.members || '', accept: true }
          if (d.track === '院校毕业生') { body.school = d.school_final; body.grad_year = +d.grad_year }
          const r = await api('/program/apply', { body })
          localStorage.removeItem(KEY); sessionStorage.removeItem('dd_apply_step')
          return done(r, body)
        } catch (er) {
          btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>确认提交'
          if (er.status === 409) { toast(esc(er.error || '同名作品已报名') + '，请修改作品名称', 'err'); return go(STEPS.indexOf('作品')) }
          return errToast(er)
        }
      }
      go(i + 1)
    }

    function done(r, b) {
      document.body.classList.remove('flow-mode')
      const link = location.origin + '/#/vote/' + r.code
      app.innerHTML = `<div class="wrap ap-done">
        <div class="ap-done-ico"><i class="fa-solid fa-check"></i></div>
        <h1 class="h2">报名成功</h1><p class="muted">《${esc(b.title)}》已进入初选榜 · 报名编号 <b class="mono gold">${esc(r.code)}</b></p>
        <ol class="ap-next-steps">
          <li class="${b.video_url ? 'ok' : ''}"><span>1</span><div><b>上传作品视频</b><p class="xs muted">审核通过后作品页可直接播放，专家据此评审</p></div><button class="btn btn-sm btn-gold" id="d-up"><i class="fa-solid fa-cloud-arrow-up"></i>上传</button></li>
          <li><span>2</span><div><b>邀请好友打分</b><p class="xs muted">≥15 人评分且位列赛道前 25% 推荐晋级路演</p></div><button class="btn btn-sm" id="d-share"><i class="fa-solid fa-share-nodes"></i>分享</button></li>
          <li><span>3</span><div><b>关注进度</b><p class="xs muted">初选 → 路演 → 双人审批 → 算力到账</p></div><a class="btn btn-sm" href="#/me">我的</a></li>
        </ol>
        <div class="ap-link"><input class="input mono xs" readonly value="${link}" id="d-link"><button class="btn" id="d-copy">复制</button></div>
        <a class="btn btn-block" href="#/vote/${r.code}" style="margin-top:10px">查看作品页</a>
      </div>`
      $('#d-up').onclick = () => window.openVideoUpload({ id: r.id, title: '《' + b.title + '》' }, () => { const li = $('.ap-next-steps li'); li && li.classList.add('ok') })
      const copy = () => { const i = $('#d-link'); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.resolve((i.select(), document.execCommand('copy')))).then(() => toast('链接已复制', 'ok')) }
      $('#d-copy').onclick = copy
      $('#d-share').onclick = () => navigator.share ? navigator.share({ title: `为《${b.title}》打分 · 迭影计划`, text: b.logline, url: link }).catch(() => {}) : copy()
      window.scrollTo(0, 0)
    }

    shell()
  }

  // 离开报名页时恢复底栏
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/apply')) document.body.classList.remove('flow-mode') })
})()
