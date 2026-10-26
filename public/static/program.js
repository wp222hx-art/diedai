/* 迭影计划 · 活动主站（首页 / 初选榜 / 评审导师 / 配套支持 / 出海交易 / 报名 / 我的） */
(function () {
  const R = window.ROUTES
  const tok = (n) => window.lyTok(n)
  const wanYuan = (y) => (y >= 1e4 ? (y / 1e4).toLocaleString() + ' 万元' : '¥' + y)
  const head = (no, title, note = '', extra = '') => `<div class="pg-head"><div class="no">${no}</div><div><h2>${title}</h2></div><div>${note ? `<p>${note}</p>` : ''}${extra}</div></div>`
  const device = () => { let d = localStorage.getItem('dd_device'); if (!d) { d = 'dv' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('dd_device', d) } return d }
  const ST = { 初选中: '', 晋级路演: 'gold', 路演通过: 'green', 已审批: 'green', 未通过: 'red' }
  const stTag = (s) => `<span class="tag ${ST[s] || ''}">${esc(s)}</span>`
  const applyHref = () => '#/apply'
  const rankRow = (x, i, showTrack = true) => `<a class="pg-rank" href="#/vote/${x.code}">
      <span class="no">${String(i + 1).padStart(2, '0')}</span>
      <div class="t"><b>${esc(x.title)}</b><div class="xs dim">${esc(x.team)}${x.school ? ' · ' + esc(x.school) + ' ' + x.grad_year + ' 届' : ''} · ${esc(x.form)}${showTrack ? ' · ' + esc(x.track) : ''}</div></div>
      <div class="s"><b class="mono">${x.score ? x.score.toFixed(2) : '—'}</b><span class="xs dim">${x.votes} 人评分</span></div>
      <div class="f">${x.recommend && x.status === '初选中' ? '<span class="tag gold">推荐晋级</span>' : stTag(x.status)}</div></a>`

  // ================= 首页 = 计划主页 =================
  R[''] = async (app) => {
    const d = await api('/program/overview')
    const s = d.stats || {}
    const judges = d.people.filter((p) => p.role === '评审'), mentors = d.people.filter((p) => p.role === '导师')
    app.innerHTML = `
    <section class="pg-hero pg-hero-home"><div class="wrap">
      <div class="pg-label">迭代 × 捷成世纪 · 2027 年度扶持计划</div>
      <h1>迭影计划</h1>
      <p class="pg-hero-sub"><span>5,000 万元</span> AI 影视算力扶持</p>
      <p class="pg-slogan">每一次迭代，离银幕更近一帧</p>
      <p class="lead">面向国内所有 AI 专业级电影团队与影视院校毕业生，提供 <b style="color:var(--text)">免费算力、完片孵化、发行支持</b>。提交作品，邀请观众打分，通过路演即可获得 Seedance 2.0 / 2.5 专业影视模型算力。</p>
      <div class="row"><a class="btn btn-gold" href="${applyHref()}">立即报名</a><a class="btn" href="#/board">查看初选榜</a></div>
      <div class="pg-hero-meta"><span>报名截止 <b>2027.01.31</b></span><span>已报名 <b>${s.apps || 0}</b> 部</span><span>累计评分 <b>${(s.votes || 0).toLocaleString()}</b> 人次</span></div>
    </div></section>

    <section class="dd-strip"><div class="wrap"><a href="#/diedai" class="dd-strip-in">
      <span class="dd-live"><i></i>征集中</span><b>第四届迭代盛典 · 影视专业毕业生作品征集已启动</b>
      <span class="xs muted">2021 年由张会军、杨步亭、岳晓湄等电影专家发起 · 院校毕业生赛道可同步参评</span><i class="fa-solid fa-arrow-right"></i></a></div></section>

    <section class="section"><div class="wrap">
      ${head('01', '三项扶持', '路演通过并完成双人审批后生效；算力与项目绑定，不可提现或转让。')}
      <div class="pg-three">
        ${[['免费算力', '5,000 万元', `Seedance 2.0 / 2.5 专业影视生成模型。按项目预测用量核定，单项目最高 300 万元面值，分里程碑到账。`, '#/support/predict', '测算我的用量'],
           ['完片孵化', '导师 1 对 1', `知名导演、编剧、剪辑导师分组指导，覆盖剧本、分镜、生成、剪辑到终混；配套专家团与肖像授权库。`, '#/jury', '查看导师'],
           ['发行支持', '国内 + 海外', `成片进入迭代影市与发行中心，对接国内平台与海外短剧、视频平台及电影节市场，统一版权交易与分账。`, '#/export', '了解出海']]
          .map(([t, k, p, h, l], i) => `<div class="pg-three-item"><div class="pg-label">0${i + 1}</div><h3>${t}</h3><div class="pg-num" style="font-size:28px;margin:6px 0 10px">${k}</div><p class="small muted">${p}</p><a class="pg-link small" href="${h}">${l} →</a></div>`).join('')}
      </div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      ${head('02', '评选流程', `线上初选由大众评分决定排名，路演由评审与导师评议。`)}
      <ol class="pg-steps">${d.timeline.map((t, i) => `<li><span class="no">${i + 1}</span><div><b>${t.k}</b><div class="xs gold mono">${t.d}</div><p class="small muted">${t.t}</p></div></li>`).join('')}</ol>
      <div class="cards c2" style="gap:16px;margin-top:22px">
        <div class="pg-box"><div class="pg-label">报名对象 A</div><h3>AI 专业电影团队</h3><p class="small muted">国内从事 AI 电影、剧集、动画创作的工作室与团队，提交成片、样片或 1—3 分钟概念片。</p></div>
        <div class="pg-box"><div class="pg-label">报名对象 B</div><h3>影视院校毕业生</h3><p class="small muted">2021—2027 届影视、动画、数字媒体相关专业毕业生，可以毕业作品或新项目报名，设院校专项额度。</p></div>
      </div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      ${head('03', '评审与导师', `${judges.length} 位评审 · ${mentors.length} 位导师。名单来自其公开报道中的院校与电影节评审经历，本计划邀约中。`, '<a class="pg-link small" href="#/jury">全部名单 →</a>')}
      <div class="pg-people">${d.people.slice(0, 8).map(person).join('')}</div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      ${head('04', '初选榜', `赛道前 ${d.rules.top_pct}% 且不少于 ${d.rules.min_votes} 人评分，推荐晋级路演。`, '<a class="pg-link small" href="#/board">完整榜单 →</a>')}
      <div class="pg-ranks">${d.top.map((x, i) => rankRow(x, i)).join('')}</div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      ${head('05', '配套支持', '')}
      <div class="pg-links">
        ${[['#/support', '专家支持', '编剧、摄影、美术、剪辑、AIGC 技术专家按需问诊'], ['#/support/likeness', '老艺术家肖像授权', '经授权的肖像与声音素材，合法用于 AI 影视创作'], ['#/export', '海外发行与版权交易', '译配、合规、海外平台分发，成片可挂牌交易'], ['#/support/predict', '算力与周期测算', '按片长、风格、镜头构成预测 Token 用量与制作周期']]
          .map(([h, t, p]) => `<a href="${h}"><b>${t}</b><span class="small muted">${p}</span><i class="fa-solid fa-arrow-right"></i></a>`).join('')}
      </div>
      <div class="pg-cta"><div><div class="pg-label">报名进行中</div><b>每一次迭代，离银幕更近一帧</b></div><a class="btn btn-gold" href="${applyHref()}">立即报名</a></div>
      <p class="xs dim" style="margin-top:14px">${esc(d.note)}</p>
    </div></section>`
  }

  function person(p) {
    return `<div class="pg-person"><div class="av">${esc(p.name[0])}</div><div style="min-width:0"><b>${esc(p.name)}</b><div class="xs muted">${esc(p.title)}</div><div class="xs dim" style="margin-top:4px">${esc(p.record)}</div></div></div>`
  }

  // ================= 初选榜 =================
  R.board = async (app, _p, q) => {
    const track = q.track || ''
    const d = await api('/program/board' + (track ? '?track=' + encodeURIComponent(track) : ''))
    app.innerHTML = `<section class="pg-hero sm"><div class="wrap"><div class="pg-label">第一阶段 · 线上初选</div><h1 style="font-size:clamp(28px,4.4vw,44px)">初选榜</h1>
      <p class="lead" style="margin:8px 0 0">所有报名作品都可以邀请他人打分。排名采用加权评分（评分人数少于 ${d.rules.m} 时向全站均值 ${d.C} 收缩，防止少量刷分）；赛道前 ${d.rules.top_pct}% 且不少于 ${d.rules.min_votes} 人评分推荐晋级路演。</p></div></section>
    <div class="wrap section" style="padding-top:22px">
      <div class="tabs">${[['', '全部'], ['专业团队', '专业团队'], ['院校毕业生', '院校毕业生']].map(([v, l]) => `<a class="tab ${track === v ? 'active' : ''}" href="#/board${v ? '?track=' + encodeURIComponent(v) : ''}">${l}</a>`).join('')}</div>
      <div class="pg-ranks">${d.rows.map((x, i) => rankRow(x, i, !track)).join('') || '<div class="empty">暂无作品</div>'}</div>
      <div class="pg-cta" style="margin-top:28px"><div><div class="pg-label">还没报名？</div><b>报名后即可获得专属打分链接</b></div><a class="btn btn-gold" href="${applyHref()}">立即报名</a></div>
    </div>`
  }

  // ================= 作品页 / 邀请打分 =================
  R.vote = async (app, p) => {
    const d = await api('/program/apps/' + encodeURIComponent(p[0] || ''))
    const a = d.app
    const link = location.origin + '/#/vote/' + a.code
    app.innerHTML = `<div class="wrap section" style="padding-top:26px;max-width:860px">
      <a class="xs muted" href="#/board">← 初选榜</a>
      <div id="work-video" style="margin-top:14px">${window.VPlayer ? window.VPlayer.html(null, { emptyText: '视频加载中…' }) : ''}</div>
      <div class="pg-label" style="margin-top:18px">${esc(a.track)} · ${esc(a.form)}${a.minutes ? ' · ' + a.minutes + ' 分钟' : ''}</div>
      <h1 class="pg-title">${esc(a.title)}</h1>
      <p class="muted">${esc(a.team)}${a.school ? ' · ' + esc(a.school) + ' ' + a.grad_year + ' 届' : ''}</p>
      <p style="margin:14px 0 18px">${esc(a.logline)}</p>
      <div class="pg-kv" style="grid-template-columns:repeat(4,1fr)"><div><b>${a.score ? a.score.toFixed(2) : '—'}</b><span>加权评分</span></div><div><b>${a.votes}</b><span>评分人数</span></div><div><b>#${a.rank}</b><span>${esc(a.track)}排名</span></div><div><b>${esc(a.status)}</b><span>状态</span></div></div>
      <div class="pg-kv" style="grid-template-columns:repeat(3,1fr)"><div><b>${a.s1 || '—'}</b><span>叙事</span></div><div><b>${a.s2 || '—'}</b><span>视觉</span></div><div><b>${a.s3 || '—'}</b><span>完成度</span></div></div>
      <div class="card" style="margin-top:22px" id="vote-card">
        <b class="h3">为这部作品打分</b><p class="xs muted" style="margin:4px 0 14px">每人每部作品限评一次，1—10 分。</p>
        <form id="vote-form">${[['story', '叙事'], ['visual', '视觉'], ['craft', '完成度']].map(([k, l]) => `<div class="pg-score"><span>${l}</span><div class="pg-score-btns" data-k="${k}">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-v="${i + 1}">${i + 1}</button>`).join('')}</div></div>`).join('')}
          ${S.user ? '' : '<div class="field" style="margin-top:12px"><label>昵称（选填）</label><input class="input" name="name" maxlength="20" placeholder="匿名观众"></div>'}
          <div class="field" style="margin-top:12px"><label>短评（选填）</label><input class="input" name="comment" maxlength="200" placeholder="一句话说说你的感受"></div>
          <button class="btn btn-gold btn-block">提交评分</button></form></div>
      <div class="card" style="margin-top:14px"><b class="h3">邀请好友打分</b><p class="xs muted" style="margin:4px 0 10px">复制链接发给朋友、同学或业内同行。</p>
        <div class="row" style="flex-wrap:nowrap"><input class="input mono xs" readonly value="${link}" id="share-link" style="min-width:0"><button class="btn" id="copy-btn">复制</button></div></div>
      ${d.recent.length ? `<div style="margin-top:22px"><div class="pg-label">观众短评</div>${d.recent.map((c) => `<div class="ly-flow"><div style="flex:1"><span class="small">${esc(c.comment)}</span><div class="xs dim">${esc(c.name)} · ${esc(String(c.created_at).slice(0, 10))}</div></div></div>`).join('')}</div>` : ''}
    </div>`
    window.mountWorkVideo && window.mountWorkVideo($('#work-video'), a)
    const f = $('#vote-form'), val = {}
    $$('.pg-score-btns', f).forEach((g) => $$('button', g).forEach((b) => (b.onclick = () => { $$('button', g).forEach((x) => x.classList.toggle('on', +x.dataset.v <= +b.dataset.v)); val[g.dataset.k] = +b.dataset.v })))
    f.onsubmit = async (e) => {
      e.preventDefault()
      if (!val.story || !val.visual || !val.craft) return toast('请为叙事、视觉、完成度分别打分', 'err')
      try { await api('/program/vote/' + a.code, { body: { ...val, comment: f.comment.value, name: f.name ? f.name.value : '', device: device() } }); toast('评分已提交，感谢参与', 'ok'); router() } catch (er) { errToast(er) }
    }
    $('#copy-btn').onclick = () => { const i = $('#share-link'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.resolve(document.execCommand('copy'))).then(() => toast('链接已复制', 'ok')) }
  }

  // ================= 评审与导师 =================
  R.jury = async (app) => {
    const d = await api('/program/overview')
    const grp = (r) => d.people.filter((p) => p.role === r)
    app.innerHTML = `<section class="pg-hero sm"><div class="wrap"><div class="pg-label">评审委员会 · 导师团</div><h1 style="font-size:clamp(28px,4.4vw,44px)">评审与导师</h1>
      <p class="lead" style="margin:8px 0 0">评审负责路演评议；导师对晋级团队进行分组指导，覆盖剧本、视听、AIGC 技术与剪辑。</p></div></section>
    <div class="wrap section" style="padding-top:26px">
      ${head('A', '评审委员会', '路演阶段按叙事 30%、视听 25%、AI 技术 20%、完成可行性 15%、市场 10% 评分；与参评团队存在师生、合作等利益关系须回避。')}
      <div class="pg-people">${grp('评审').map(person).join('')}</div>
      <div style="height:36px"></div>
      ${head('B', '导师团', '晋级路演的团队按题材与形态分组，每组配 1 位导演导师 + 1 位技术导师，完片孵化期内每月不少于 2 次指导。')}
      <div class="pg-people">${grp('导师').map(person).join('')}</div>
      <div class="pg-box" style="margin-top:30px"><div class="pg-label">信息来源</div>
        <table class="pg-table compact" style="margin-top:8px"><tbody>${[...new Map(d.people.map((p) => [p.source_url, p.source])).entries()].map(([u, s]) => `<tr><td class="c xs"><a class="pg-link" href="${esc(u)}" target="_blank" rel="noopener">${esc(s)}</a></td></tr>`).join('')}</tbody></table>
        <p class="xs dim" style="margin-top:10px">以上为公开报道中的院校与电影节评审经历；本计划评审与导师均为邀约中，最终名单以官方公布为准。</p></div>
    </div>`
  }

  // ================= 配套支持（专家 / 肖像授权 / 测算） =================
  R.support = async (app, p) => {
    if (p[0] === 'predict') return R.lightyear(app, ['predict'])
    const [ex, lk] = await Promise.all([api('/experts').catch(() => ({ experts: [] })), api('/program/likeness')])
    const experts = ex.experts || ex.rows || []
    const tab = p[0] === 'likeness' ? 'likeness' : 'experts'
    app.innerHTML = `<section class="pg-hero sm"><div class="wrap"><div class="pg-label">迭影计划 · 配套支持</div><h1 style="font-size:clamp(28px,4.4vw,44px)">配套支持</h1>
      <p class="lead" style="margin:8px 0 0">专家问诊、老艺术家肖像授权与算力测算，为入选团队补齐创作所需的人、权、算。</p></div></section>
    <div class="wrap section" style="padding-top:22px">
      <div class="tabs">${[['experts', '专家支持', '#/support'], ['likeness', '肖像授权', '#/support/likeness'], ['predict', '算力测算', '#/support/predict']].map(([k, l, h]) => `<a class="tab ${tab === k ? 'active' : ''}" href="${h}">${l}</a>`).join('')}</div>
      <div id="sup-body"></div></div>`
    const body = $('#sup-body')
    if (tab === 'experts') {
      body.innerHTML = `${head('01', '专家库', '晋级团队可预约专家问诊；专家名单来自公开报道，平台邀约中。')}
        <div class="pg-people">${experts.map((e) => `<div class="pg-person"><div class="av">${esc(e.name[0])}</div><div style="min-width:0"><b>${esc(e.name)}</b><div class="xs muted">${esc(e.title)}</div><div class="xs dim" style="margin-top:4px">${esc(e.field || '')}</div></div></div>`).join('')}</div>
        <div style="height:30px"></div>${head('02', '问诊方向', '')}
        <table class="pg-table"><tbody>${[['剧本与结构', '故事大纲、人物弧光、节拍表诊断'], ['视听与分镜', '镜头语言、风格统一、AI 生成镜头的调度'], ['AIGC 技术', '模型选型、角色一致性、参考图与提示词工程'], ['剪辑与声音', '节奏、配乐、AI 配音与终混'], ['权利与合规', '素材权利链、肖像授权、生成合成标识']].map(([a, b], i) => `<tr><td class="n">${String(i + 1).padStart(2, '0')}</td><td class="t"><b>${a}</b></td><td class="c">${b}</td></tr>`).join('')}</tbody></table>`
    } else {
      body.innerHTML = `${head('01', '老艺术家肖像与声音授权库', '经艺人本人或继承人书面授权的肖像 / 声音素材，供入选团队在约定范围内用于 AI 影视创作。')}
        <div class="pg-lk">${lk.rows.map((x) => `<div class="pg-box"><div class="between"><span class="pg-label">${esc(x.code)}</span><span class="tag">${esc(x.status)}</span></div>
          <h3 style="margin-top:6px">${esc(x.archetype)}</h3>
          <dl class="pg-dl">${[['形象', x.ages], ['题材', x.genres], ['用途', x.uses], ['限制', x.limits], ['费用', x.fee]].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          <button class="btn btn-sm btn-block lk-req" data-id="${x.id}" style="margin-top:12px">申请使用</button></div>`).join('')}</div>
        <div class="notice" style="margin-top:20px"><i class="fa-solid fa-circle-info"></i><div>${esc(lk.note)} 依据《民法典》肖像权与《互联网信息服务深度合成管理规定》，未经授权不得生成可识别特定自然人的形象或声音。</div></div>`
      $$('.lk-req', body).forEach((b) => (b.onclick = () => {
        if (!S.user) return (location.hash = '#/login?next=' + encodeURIComponent('#/support/likeness'))
        modal('申请肖像授权', `<form id="lk-form"><div class="field"><label>项目与使用场景</label><textarea class="input" name="purpose" placeholder="作品名称、角色、出现时长、发行范围"></textarea></div><button class="btn btn-gold btn-block">提交申请</button></form>`, (m) => {
          $('#lk-form', m).onsubmit = async (e) => { e.preventDefault(); try { await api(`/program/likeness/${b.dataset.id}/request`, { body: { purpose: e.target.purpose.value } }); closeModal(); toast('已提交，授权专员将在 3 个工作日内联系你', 'ok') } catch (er) { errToast(er) } }
        })
      }))
    }
  }

  // ================= 出海与交易 =================
  R.export = async (app) => {
    const d = await api('/program/overview')
    const e = d.export
    app.innerHTML = `<section class="pg-hero sm"><div class="wrap"><div class="pg-label">发行支持 · 国内与海外</div><h1 style="font-size:clamp(28px,4.4vw,44px)">出海与版权交易</h1>
      <p class="lead" style="margin:8px 0 0">入选作品完片后进入统一发行通道：国内平台、海外短剧与视频平台、国际电影节市场，版权可按地区、媒介、期限拆分交易。</p></div></section>
    <div class="wrap section" style="padding-top:26px">
      <div class="pg-figs">${e.data.map((x) => `<div><b>${x.k}</b><span>${esc(x.v)}</span><a class="xs dim" style="display:block;margin-top:6px" href="${esc(x.url)}" target="_blank" rel="noopener">来源：${esc(x.src)}</a></div>`).join('')}<div><b>3 步</b><span>挂牌 → 授权锁定 → 实收分账</span></div></div>
      <div style="height:40px"></div>
      <div class="cards c2" style="gap:40px">
        <div>${head('01', '出海服务', '')}<table class="pg-table"><tbody>${e.services.map(([a, b], i) => `<tr><td class="n">${String(i + 1).padStart(2, '0')}</td><td class="t"><b>${a}</b></td><td class="c">${b}</td></tr>`).join('')}</tbody></table></div>
        <div>${head('02', '渠道矩阵', '渠道为对接方向，具体合作以签约为准。')}<table class="pg-table compact"><thead><tr><th>渠道</th><th>地区</th><th style="text-align:right">模式</th></tr></thead><tbody>${e.channels.map(([a, b, c]) => `<tr><td class="c small" style="color:var(--text)">${a}</td><td class="c xs muted">${b}</td><td class="r xs">${c}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div style="height:30px"></div>
      ${head('03', '版权交易', '成片或开发中项目可在迭代影市挂牌，机构经 NDA 查看资料；签约即锁定权利范围，杜绝一权多售。')}
      <div class="pg-links"><a href="#/market"><b>迭代影市</b><span class="small muted">剧本 / IP、联合开发、成片许可挂牌与询价</span><i class="fa-solid fa-arrow-right"></i></a><a href="#/distribution"><b>发行中心</b><span class="small muted">窗口日历、母版交付、上线证据、报表对账与分账</span><i class="fa-solid fa-arrow-right"></i></a></div>
    </div>`
  }

  // ================= 报名 =================
  // R.apply 已迁移至 apply.js（移动端分步报名）

  // ================= 我的 =================
  R.me = async (app) => {
    if (!S.user) return needLogin(app, '登录后查看报名进度与算力')
    if (S.user.role === 'operator' || S.user.role === 'finance' || S.user.role === 'admin') { location.hash = '#/admin'; return }
    if (S.user.role === 'expert') { location.hash = '#/review'; return }
    if (S.user.role !== 'creator') { location.hash = '#/workbench'; return }
    const d = await api('/program/mine')
    const FLOW = ['初选中', '晋级路演', '路演通过', '已审批']
    app.innerHTML = `<div class="wrap section" style="padding-top:26px">
      <div class="pg-wallet"><div class="between"><div><div class="pg-label">我的 · 迭影计划</div><b style="font-size:18px">${esc(S.user.name)}</b></div><a class="btn btn-sm btn-gold" href="#/apply">报名新作品</a></div>
        <div class="pg-num">${tok(d.balance.available)}</div><div class="xs muted" style="margin-bottom:12px">可用标准Token（≈ ¥${Math.round((d.balance.available / 1e6) * 46).toLocaleString()} 刊例价值）</div>
        <div class="row"><a class="btn btn-sm" href="#/lightyear/wallet">算力账户与流水</a><a class="btn btn-sm" href="#/support/predict">算力测算</a><a class="btn btn-sm" href="#/workbench">创作工作台</a></div></div>
      <div style="height:26px"></div>
      ${head('', '我的报名', '')}
      ${d.apps.map((a) => {
        const k = a.status === '未通过' ? -1 : FLOW.indexOf(a.status)
        return `<div class="pg-box" style="margin-bottom:14px"><div class="between"><div><b>${esc(a.title)}</b><div class="xs dim">${esc(a.track)} · ${esc(a.form)} · ${esc(a.team)}</div></div>${stTag(a.status)}</div>
          <div class="pg-flow">${FLOW.map((s, i) => `<span class="${i <= k ? 'on' : ''}">${s}</span>`).join('')}</div>
          <div class="pg-kv" style="grid-template-columns:repeat(3,1fr);margin-top:6px"><div><b>${a.score ? a.score.toFixed(2) : '—'}</b><span>加权评分</span></div><div><b>${a.votes}</b><span>评分人数</span></div><div><b>#${a.rank}</b><span>赛道排名</span></div></div>
          ${a.roadshow_score != null ? `<p class="small muted" style="margin-top:10px">路演 ${a.roadshow_score} 分 · ${esc(a.roadshow_note || '')}</p>` : ''}
          ${a.status === '已审批' ? `<p class="small green" style="margin-top:6px">已获算力面值 ${wanYuan(a.grant_yuan)}，已到账算力账户。</p>` : ''}
          <div class="me-video"><i class="fa-solid fa-film"></i><span class="small">作品视频</span>${a.video_status ? statusTag(a.video_status) : '<span class="tag amber">未上传</span>'}${a.reviews ? `<span class="xs muted">专家评审 ${a.reviews} 份</span>` : ''}${a.video_reject ? `<span class="xs red">驳回：${esc(a.video_reject)}</span>` : ''}</div>
          <div class="row" style="margin-top:12px"><button class="btn btn-sm btn-gold" data-up="${a.id}" data-t="${esc(a.title)}"><i class="fa-solid fa-cloud-arrow-up"></i>${a.video_status ? '更换视频' : '上传视频'}</button><a class="btn btn-sm" href="#/vote/${a.code}">作品页 / 邀请打分</a></div></div>`
      }).join('') || `<div class="empty">还没有报名作品<div style="margin-top:12px"><a class="btn btn-gold btn-sm" href="#/apply">立即报名</a></div></div>`}
    </div>`
    $$('[data-up]').forEach((b) => (b.onclick = () => window.openVideoUpload({ id: +b.dataset.up, title: b.dataset.t }, () => router())))
  }

  window.programAdminPage = (el, embed) => adminPage(el, embed)
  async function adminPage(app, embed) {
    const d = await api('/program/admin')
    app.innerHTML = `<div class="${embed ? '' : 'wrap section'}" style="${embed ? '' : 'padding-top:26px'}">
      <div class="adm-head"><div><div class="pg-label">管理后台 · Admin</div><h1 class="h2">路演与算力审批</h1></div><div class="row"><button class="btn btn-gold btn-sm" id="promote-btn">按规则推荐晋级</button><a class="btn btn-sm" href="#/admin/compute">资金池</a></div></div>
      <p class="xs muted" style="margin:8px 0 16px">规则：赛道前 ${d.rules.top_pct}% 且 ≥${d.rules.min_votes} 人评分推荐晋级；路演 ≥70 分通过；算力发放需两名不同运营人员审批。</p>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>作品</th><th>赛道</th><th>评分</th><th>状态</th><th>路演</th><th>操作</th></tr></thead><tbody>
      ${d.rows.map((x) => `<tr><td data-l="作品"><b class="small">${esc(x.title)}</b><div class="xs dim">${esc(x.team)}</div></td><td data-l="赛道" class="small">${esc(x.track)} #${x.rank}</td><td data-l="评分" class="mono small">${x.score.toFixed(2)} · ${x.votes}人${x.recommend ? ' <span class="tag gold">推荐</span>' : ''}</td><td data-l="状态">${stTag(x.status)}</td><td data-l="路演" class="small">${x.roadshow_score ?? '—'}</td>
        <td data-l="操作">${x.status === '晋级路演' ? `<button class="btn btn-sm" data-rs="${x.id}">录入路演</button>` : x.status === '路演通过' ? `<button class="btn btn-sm btn-gold" data-ap="${x.id}" data-first="${x.approver1 ? 0 : 1}">${x.approver1 ? `复核 ${wanYuan(x.grant_yuan)}` : '初审核定'}</button>` : x.status === '已审批' ? `<span class="xs green">${wanYuan(x.grant_yuan)}</span>` : '—'}</td></tr>`).join('')}
      </tbody></table></div></div>`
    $('#promote-btn').onclick = async () => { try { const r = await api('/program/promote', { method: 'POST' }); toast(`已推荐晋级 ${r.promoted} 部`, 'ok'); router() } catch (e) { errToast(e) } }
    $$('[data-rs]').forEach((b) => (b.onclick = () => modal('录入路演结果', `<form id="rs"><div class="field"><label>路演综合分（0—100，≥70 通过）</label><input class="input" type="number" name="score" min="0" max="100"></div><div class="field"><label>评议意见</label><textarea class="input" name="note"></textarea></div><button class="btn btn-gold btn-block">保存</button></form>`, (m) => {
      $('#rs', m).onsubmit = async (e) => { e.preventDefault(); try { const r = await api(`/program/apps/${b.dataset.rs}/roadshow`, { body: { score: +e.target.score.value, note: e.target.note.value } }); closeModal(); toast('路演结果：' + r.status, 'ok'); router() } catch (er) { errToast(er) } }
    })))
    $$('[data-ap]').forEach((b) => (b.onclick = async () => {
      let body = {}
      if (b.dataset.first === '1') { const v = prompt('核定算力面值（元，1 万—300 万）', '500000'); if (!v) return; body = { grant_yuan: +v } } else if (!confirm('确认复核并发放算力？')) return
      try { const r = await api(`/program/apps/${b.dataset.ap}/approve`, { body }); toast(r.stage === '已审批' ? `已发放 ${tok(r.tokens)} 标准Token` : '初审完成，待另一名运营复核', 'ok'); router() } catch (e) { errToast(e) }
    }))
  }
})()
