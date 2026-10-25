/* 迭代影交汇 · 公共页面 */
(function () {
  const R = window.ROUTES

  // ================= P01 首页 =================
  R[''] = async (app) => {
    const [d, ov] = await Promise.all([api('/home'), api('/lightyear/overview').catch(() => null)])
    const ed = d.edition, st = d.stats || {}
    const days = ed ? Math.max(0, Math.ceil((new Date(ed.close_at) - new Date()) / 864e5)) : 0
    app.innerHTML = `
    <section class="hero" id="hero-section"><div class="hero-bg"></div><div class="wrap"><div class="hero-copy">
      <div class="hero-badges"><span class="tag gold">迭代盛典 × 捷成世纪</span><span class="tag">AIGC影视 · 短剧 · 动漫</span><span class="tag">中剧及以上</span></div>
      <h1 class="h1">让好故事<em>被看见</em><br>让好作品<em>走向市场</em></h1>
      <p class="lead">不做另一个投稿网站——做把好故事变成<b class="gold">可评估、可投、可制作、可发行</b>项目的协作基础设施。一套作品档案，贯通盛典、孵化、交易与全渠道发行。</p>
      <div class="hero-note"><span class="pg-label" style="color:var(--gold2)">光年计划</span><span><b>5,000 万元</b> Seedance 影视生成算力，向入驻与入选项目免费开放</span><a class="pg-link" href="#/lightyear">了解详情</a></div>
      <div class="row"><a class="btn btn-gold" href="#/festival"><i class="fa-solid fa-trophy"></i>报名迭代盛典</a><a class="btn" href="#/market"><i class="fa-solid fa-handshake"></i>进入迭代影市</a></div>
      ${ed ? `<div class="edition-card"><div><div class="xs gold">当前届次 · ${esc(ed.status)}</div><b>${esc(ed.name)}</b><div class="xs muted">报名截止 ${esc(ed.close_at)} · 典礼 ${esc(ed.ceremony_at)}</div></div><div style="text-align:center;padding-left:16px;border-left:1px solid var(--line2)"><div class="count">${days}</div><div class="xs muted">天后截止</div></div></div>` : ''}
    </div></div></section>
    <div class="filmstrip" aria-hidden="true"></div>

    ${ov ? lightyearPoster(ov) : ''}
    <section class="section" id="stats-section"><div class="wrap">
      <div class="stats">
        ${[[st.assets, '作品档案'], [st.entries, '盛典报名'], [st.listings, '影市挂牌'], [st.projects, '孵化项目'], [st.channels, '发行渠道档案'], [st.experts, '公开专家网络']].map(([n, l]) => `<div class="stat"><b>${n ?? 0}</b><span>${l}</span></div>`).join('')}
      </div>
      <p class="xs dim" style="margin-top:8px">* 平台数据为试点演示样本；行业数据见下方“行业洞察”并标注来源。</p>
    </div></section>

    <section class="section" style="padding-top:10px" id="lines-section"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">ONE ASSET · FOUR LINES</div><h2 class="h2">一套作品档案，四条独立业务线</h2></div><p class="muted small" style="max-width:420px">入围不是获投，获奖不是成交，推荐不是发行保证。评奖、投决、采购三条决策线相互独立。</p></div>
      <div class="cards c4">
        ${[
          ['01', 'fa-trophy', '迭代盛典', '#/festival', '发现新一代影视创作力量', ['完成作品组 / 项目提案组', '盲审·回避·双人批准发布', '可验证电子证书与荣誉库']],
          ['02', 'fa-clapperboard', '迭代影创', '#/incubate', '让好故事成为可交付作品', ['试制包 / 孵化包 / 联合开发包', '算力预算三场景生成器', 'M0—M4 里程碑验收']],
          ['03', 'fa-handshake', '迭代影市', '#/market', '连接创作者、版权方与市场', ['剧本/IP·联合开发·成片许可', 'NDA + 分级资料室', '权利库存原子锁权防一权多售']],
          ['04', 'fa-satellite-dish', '发行中心', '#/distribution', '全渠道发行协作中台', ['渠道档案·窗口日历', '母版交付·送审·上线证据', '报表对账·实收分账瀑布']],
        ].map(([n, i, t, h, s, li]) => `<a class="card hover line-card" href="${h}"><span class="num">${n}</span><div class="ico"><i class="fa-solid ${i}"></i></div><div class="h3">${t}</div><div class="xs gold">${s}</div><ul>${li.map((x) => `<li>${x}</li>`).join('')}</ul></a>`).join('')}
      </div>
    </div></section>

    <section class="section" id="featured-section"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">MARKET PICKS</div><h2 class="h2">影市精选</h2></div><a class="btn btn-sm" href="#/market">查看全部 <i class="fa-solid fa-arrow-right"></i></a></div>
      <div class="cards c3">${d.listings.map(posterCard).join('') || '<div class="empty">暂无公开挂牌</div>'}</div>
    </div></section>

    <section class="section" id="honor-section"><div class="wrap">
      <div class="cards c2">
        <div class="card"><div class="eyebrow">HALL OF HONOR</div><h3 class="h2" style="font-size:24px">荣誉库</h3>
          <div class="stack" style="margin-top:14px">${d.honors.map((h) => `<div class="between"><div class="row"><span class="laurel"><i class="fa-solid fa-award"></i>${esc(h.award)}</span><b>《${esc(h.title)}》</b></div><a class="xs gold" href="#/verify/${esc(h.cert)}">验真 ${esc(h.cert)}</a></div><div class="xs muted">${esc(h.edition)} · ${esc(h.form)}</div>`).join('<div class="hr" style="margin:6px 0"></div>') || '<p class="muted">暂无</p>'}</div>
          <a class="btn btn-sm" style="margin-top:16px" href="#/festival?tab=honors">进入荣誉库</a></div>
        <div class="card"><div class="eyebrow">DEMAND BOARD</div><h3 class="h2" style="font-size:24px">机构需求广场</h3>
          <div class="stack" style="margin-top:14px">${d.demands.map((m) => `<div><div class="between"><b class="small">${esc(m.title)}</b><span class="tag amber">截止 ${esc(m.deadline)}</span></div><div class="xs muted">${esc(m.genre)} · ${esc(m.duration)} · ${esc(m.region)} · ${esc(m.budget_band)}</div></div>`).join('<div class="hr" style="margin:6px 0"></div>')}</div>
          <p class="xs dim" style="margin-top:12px">需求单不是平台采购承诺，匹配按题材、地区、资源及权利，不以付费提高评分。</p></div>
      </div>
    </div></section>

    <section class="section" id="flow-section"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">END TO END</div><h2 class="h2">端到端：从建档到回款</h2></div></div>
      <div class="card"><div class="flow">${['作品建档', '独立参赛', '荣誉发布', '自愿挂牌', '机构选片', '合同锁权', '窗口校验', '母版译配', '渠道送审', '上线证据', '报表对账', '实收分账'].map((s, i) => `<div class="flow-step ${i < 12 ? 'done' : ''}"><div class="dot">${String(i + 1).padStart(2, '0')}</div><p>${s}</p></div>`).join('')}</div></div>
    </div></section>

    <section class="section" id="insight-section"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">INDUSTRY INSIGHT</div><h2 class="h2">行业洞察 <span class="small muted">（来自公开报道）</span></h2></div><a class="btn btn-sm" href="#/academy?tab=insights">更多</a></div>
      <div class="cards c4">${d.insights.map(insightCard).join('')}</div>
    </div></section>

    <section class="section" id="events-section"><div class="wrap">
      <div class="section-head"><div><div class="eyebrow">ROADSHOW & SCREENING</div><h2 class="h2">近期路演与活动</h2></div><a class="btn btn-sm" href="#/events">全部活动</a></div>
      <div class="cards c4">${d.events.map(eventCard).join('')}</div>
    </div></section>`
  }

  const insightCard = (i) => `<a class="card hover insight" href="${esc(i.url)}" target="_blank" rel="noopener"><span class="tag gold" style="align-self:flex-start">${esc(i.tag)}</span><b class="small">${esc(i.title)}</b><p class="xs muted">${esc(i.summary)}</p><span class="src"><i class="fa-solid fa-link"></i> ${esc(i.source)} · ${esc(i.date)}</span></a>`
  const eventCard = (e) => {
    const dt = new Date(e.date)
    return `<div class="card hover"><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div style="text-align:center;min-width:52px;padding:6px;border-radius:10px;border:1px solid rgba(212,169,79,.35)"><div class="xs gold">${dt.getMonth() + 1}月</div><b style="font-family:var(--mono);font-size:22px">${dt.getDate()}</b></div><div><span class="tag">${esc(e.kind)}</span><div class="small" style="font-weight:600;margin-top:6px">${esc(e.title)}</div><div class="xs muted">${esc(e.city)} · ${esc(e.venue)}</div></div></div>
      <div class="bar" style="margin-top:12px"><i style="width:${Math.min(100, (e.booked / e.capacity) * 100)}%"></i></div><div class="xs dim" style="margin-top:4px">已预约 ${e.booked}/${e.capacity}</div></div>`
  }
  window.eventCard = eventCard; window.insightCard = insightCard

  // ================= P02 / P06 盛典 =================
  R.festival = async (app, _p, q) => {
    const [{ editions }, { honors }, ex] = await Promise.all([api('/editions'), api('/honors'), api('/experts')])
    const cur = editions.find((e) => e.status === '报名中') || editions[0]
    const tab = q.tab || 'tracks'
    app.innerHTML = pageHero('JIEDAI FESTIVAL · 荣誉品牌', '迭代盛典 <span class="gold">·</span> 发现新一代影视创作力量', '专业评审、可追溯提名及荣誉认证。完成作品与项目提案分组评审，不以赞助、付费或交易成交干预获奖结论。',
      `<div class="row" style="margin-top:18px"><a class="btn btn-gold" href="#/workbench?go=entry"><i class="fa-solid fa-pen-to-square"></i>立即报名</a><a class="btn" href="#/verify"><i class="fa-solid fa-certificate"></i>证书验真</a></div>`) +
      `<div class="wrap section" style="padding-top:28px">
        <div class="tabs">${[['tracks', '赛制与赛道'], ['flow', '评审流程'], ['honors', '荣誉库'], ['experts', '专家网络'], ['calendar', '执行日历']].map(([k, l]) => `<a class="tab ${tab === k ? 'active' : ''}" href="#/festival?tab=${k}">${l}</a>`).join('')}</div>
        <div id="fest-body"></div></div>`
    const body = $('#fest-body')
    if (tab === 'tracks') {
      body.innerHTML = `<div class="card" style="margin-bottom:16px"><div class="between"><div><div class="xs gold">${esc(cur.status)} · 规则版本 ${esc(cur.rule_version)}</div><h3 class="h2" style="font-size:24px">${esc(cur.name)}</h3><p class="muted small">主题：${esc(cur.theme)}</p></div>
        <div class="row">${[['报名开启', cur.open_at], ['报名截止', cur.close_at], ['颁奖典礼', cur.ceremony_at]].map(([l, v]) => `<div class="kpi card" style="padding:12px 16px"><span>${l}</span><b style="font-size:17px">${esc(v)}</b></div>`).join('')}</div></div></div>
        <div class="cards c2">${cur.tracks.map((t) => `<div class="card"><div class="between"><div class="row"><span class="tag gold">${esc(t.code)}</span><b class="h3">${esc(t.name)}</b></div><span class="xs muted">名额 ${t.quota}</span></div>
          <p class="small muted" style="margin:10px 0"><i class="fa-solid fa-folder-open gold"></i> 必需材料：${esc(t.materials)}</p>
          <div class="xs dim" style="margin-bottom:6px">评分权重（讨论稿）</div>
          ${Object.entries(t.weights).map(([k, v]) => `<div class="between xs" style="margin-bottom:4px"><span>${k}</span><span class="mono gold">${v}%</span></div><div class="bar" style="height:5px;margin-bottom:8px"><i style="width:${v * 2.2}%"></i></div>`).join('')}
          <div class="xs dim" style="margin:10px 0 6px">奖项设置</div><div class="row">${t.awards.map((a) => `<span class="tag"><i class="fa-solid fa-award gold"></i>${esc(a.name)}</span>`).join('')}</div></div>`).join('')}</div>
        <div class="notice" style="margin-top:16px"><i class="fa-solid fa-circle-info"></i><div>商业扶持、采购意向、算力支持、导师推荐单独设“产业支持计划”，不包装成艺术奖；获奖项目尚未成片时不能称“最佳成片”。奖项与赛道为待确认设计。</div></div>`
    } else if (tab === 'flow') {
      body.innerHTML = `<div class="card"><h3 class="h3" style="margin-bottom:14px">报名 → 颁奖全流程</h3><div class="flow">${['选择届次赛道', '绑定作品版本', '资格与材料校验', '分项授权', '提交锁定·回执', '资格初审', '初审/复审/终审', '异常分数复核', '两名授权人批准', '定时发布', '电子证书'].map((s, i) => `<div class="flow-step done"><div class="dot">${i + 1}</div><p>${s}</p></div>`).join('')}</div></div>
        <div class="cards c3" style="margin-top:16px">
          ${[['fa-user-shield', '盲审与回避', '接受任务前申报利益冲突；指导、投资、采购、亲属或团队合作关系按规则回避。提交前不可见他人评分，提交后锁定。'],
             ['fa-scale-balanced', '双评与第三评', '每项目至少两名无利益冲突专家独立评审；两人总分差≥20分自动生成第三评工单。综合分 = Σ(维度分÷5×权重)。'],
             ['fa-stamp', '双人批准发布', '暂存/已批准/可发布权限分离；主持人台本、屏幕名单、证书与官网使用同一发布快照，对外不含分数与评语。']].map(([i, t, s]) => `<div class="card"><div class="line-card" style="padding:0"><div class="ico"><i class="fa-solid ${i}"></i></div></div><b>${t}</b><p class="small muted" style="margin-top:6px">${s}</p></div>`).join('')}
        </div>`
    } else if (tab === 'honors') {
      body.innerHTML = honors.length ? `<div class="cards c3">${honors.map((h) => `<div class="poster"><div class="poster-art ${COVER[h.cover] || 'art-noir'}"><div class="scan"></div><span class="laurel form-tag"><i class="fa-solid fa-award"></i>${esc(h.award)}</span><div class="title-art">${esc(h.title)}</div></div>
        <div class="poster-body"><div class="row">${statusTag(h.status)}<span class="tag">${esc(h.track)}</span><span class="tag">获奖版本 ${esc(h.version || '')}</span></div><div class="xs muted">${esc(h.edition)} · ${esc(h.form)}</div><div class="xs muted">主创：${esc(h.team || '')}</div><a class="btn btn-sm" href="#/verify/${esc(h.cert)}"><i class="fa-solid fa-qrcode"></i>证书 ${esc(h.cert)}</a></div></div>`).join('')}</div>
        <p class="xs dim" style="margin-top:12px">荣誉仅针对指定作品及版本，不自动继承到续作或衍生项目；撤销与更正记录保留可查。</p>` : '<div class="empty"><i class="fa-solid fa-trophy"></i>暂无已发布荣誉</div>'
    } else if (tab === 'experts') {
      body.innerHTML = `<div class="notice" style="margin-bottom:16px"><i class="fa-solid fa-circle-info"></i><div>${esc(ex.disclaimer)}</div></div>
        <div class="cards c3">${ex.experts.map((e) => `<div class="card hover expert"><div class="avatar-lg">${esc(e.name[0])}</div><div style="min-width:0"><b>${esc(e.name)}</b><div class="xs gold">${esc(e.title)}</div><div class="xs muted" style="margin-top:4px">${esc(e.field)}</div><div class="xs dim" style="margin-top:6px">${esc(e.note)}</div><a class="xs gold" href="${esc(e.source_url)}" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i> 来源</a></div></div>`).join('')}</div>`
    } else {
      body.innerHTML = `<div class="card"><div class="timeline">${[['T−90 至 T−60', '锁定征集规则、资源和院校，开启报名', '运营发布规则版本；法务核验品牌及资源承诺'], ['T−60 至 T−30', '材料审核、试制训练、专家评审', '项目池、评审记录、权利缺口清单'], ['T−30 至 T−14', '入围确认、机构邀约、交易偏好收集', '入围名单、路演材料、机构核验及NDA'], ['T−14 至 T−1', '预约配对、展映授权、设备与应急演练', '会谈表、播放清单、资料可见性核查'], ['T 日', '签到、展演、路演、闭门洽谈、意向登记', '预约到场、反馈及授权范围内影像记录'], ['T+1 至 T+14', '意向分级、尽调室开启、复盘反馈', '有效对接清单；明确下一步和负责人'], ['T+15 至 T+60', '合同、资源落实、首里程碑追踪', '签约/未成交原因及首节点进度报表']].map(([t, a, b]) => `<div class="tl-item"><b class="gold mono small">${t}</b><div>${a}</div><div class="xs muted">${b}</div></div>`).join('')}</div></div>`
    }
  }

  // ================= 证书验真 =================
  R.verify = async (app, p) => {
    const code = p[0] || ''
    app.innerHTML = pageHero('CERTIFICATE VERIFY', '电子证书验真', '输入证书编号或扫描证书二维码，公开验证荣誉状态。仅显示必要信息，不展示身份证件。') +
      `<div class="wrap section" style="padding-top:28px"><form id="verify-form" class="row" style="max-width:560px;margin:0 auto 26px;flex-wrap:nowrap"><input class="input" name="code" placeholder="如 DDSD-2026-F01-7K3Q" value="${esc(code)}"><button class="btn btn-gold"><i class="fa-solid fa-magnifying-glass"></i>验真</button></form><div id="cert-out"></div></div>`
    $('#verify-form').onsubmit = (e) => { e.preventDefault(); const c = e.target.code.value.trim(); if (c) location.hash = '#/verify/' + encodeURIComponent(c) }
    if (!code) { $('#cert-out').innerHTML = '<p class="center muted small" style="text-align:center">示例编号：<a class="gold" href="#/verify/DDSD-2026-F01-7K3Q">DDSD-2026-F01-7K3Q</a></p>'; return }
    try {
      const { certificate: c, note } = await api('/certificates/' + encodeURIComponent(code))
      const ok = c.status === '有效'
      $('#cert-out').innerHTML = `<div class="cert"><div class="seal"><i class="fa-solid fa-award"></i></div><div class="xs gold" style="letter-spacing:4px">CERTIFICATE OF HONOR</div><h2>${esc(c.award_name)}</h2>
        <p class="muted" style="margin-top:6px">${esc(c.edition_name)}</p>
        <div style="margin:14px 0">${ok ? '<span class="tag green"><i class="fa-solid fa-circle-check"></i> 证书有效</span>' : `<span class="tag red"><i class="fa-solid fa-ban"></i> ${esc(c.status)}</span>`}</div>
        <dl><dt>证书编号</dt><dd class="mono">${esc(c.code)}</dd><dt>获奖作品</dt><dd>《${esc(c.work_title)}》</dd><dt>获奖版本</dt><dd>${esc(c.version)}</dd><dt>获奖实体</dt><dd>${esc(c.holder)}</dd><dt>颁发主体</dt><dd>${esc(c.issuer)}</dd><dt>颁发日期</dt><dd>${esc(c.issued_at)}</dd></dl>
        <p class="xs dim" style="margin-top:20px">${esc(note)}</p></div>`
    } catch (e) { $('#cert-out').innerHTML = `<div class="empty"><i class="fa-solid fa-circle-question"></i>${esc(e.error)}</div>` }
  }

  // ================= 迭代影创 =================
  R.incubate = async (app) => {
    app.innerHTML = pageHero('JIEDAI STUDIO · 孵化品牌', '迭代影创 <span class="gold">·</span> 让好故事成为可交付作品', '项目筛选、预算与里程碑、受限资源授予。扶持与投资分开：算力券不是现金，入围不是获投。',
      `<div class="row" style="margin-top:18px"><a class="btn btn-gold" href="#/workbench?go=asset"><i class="fa-solid fa-plus"></i>创建项目提报</a><a class="btn" href="#/lightyear/predict">算力与周期预测</a><a class="btn" href="#/lightyear">光年计划</a></div>`) +
      `<div class="wrap section" style="padding-top:28px">
      <div class="section-head"><div><div class="eyebrow">SUPPORT PACKAGES</div><h2 class="h2">三级扶持包 · 以里程碑兑现</h2></div></div>
      <div class="cards c3">${[['试制包', 'fa-seedling', '材料齐备、权利初筛通过、技术可验证', '基础教程、导师诊断、少量试制资源', '按镜头测试释放；失败可复盘退出'], ['孵化包', 'fa-rocket', '综合评审通过、项目计划及责任人明确', '专项算力、制作指导、机构对接', '按概念验证、样章、阶段交付分批'], ['联合开发包', 'fa-gem', '尽调与投决通过、正式合同签署', '合同约定的资金、算力、授权及发行支持', '与验收证据、预算使用率联动']].map(([t, i, a, b, c]) => `<div class="card hover line-card"><div class="ico"><i class="fa-solid ${i}"></i></div><div class="h3">${t}</div><div class="stack small" style="margin-top:12px"><div><span class="xs gold">准入条件</span><div class="muted">${a}</div></div><div><span class="xs gold">资源内容</span><div class="muted">${b}</div></div><div><span class="xs gold">放券规则</span><div class="muted">${c}</div></div></div></div>`).join('')}</div>

      <div class="section-head" style="margin-top:46px"><div><div class="eyebrow">MILESTONES</div><h2 class="h2">M0—M4 制作里程碑</h2></div><span class="xs dim">比例为试点谈判起点，总计100%</span></div>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>节点</th><th>交付物与验收证据</th><th>资源释放</th><th>未通过分支</th></tr></thead><tbody>
      ${[['M0 开发确认', '剧本版本、权利清单、分镜、预算、计划、责任人', '不释放正式生产额度', '补清权/补计划，限期重审'], ['M1 技术试制', '代表性镜头、角色一致性测试、实际费用和问题清单', '正式资源池 10%', '降低复杂度/换模型/退出'], ['M2 样章验证', '3—5分钟连续叙事样章、声音与字幕、修订预算', '再释放 25%', '限定修改项与返工次数'], ['M3 阶段成片', '合同约定的阶段内容、素材台账、阶段费用', '再释放 40%', '暂停新增任务，评估缩片'], ['M4 成片与交付', '母版、字幕、音轨、权利及技术质检报告', '释放或结清剩余 25%', '整改/争议处理，不自动结清']].map((r) => `<tr><td data-l="节点"><b class="gold">${r[0]}</b></td><td data-l="交付物" class="full">${r[1]}</td><td data-l="资源释放">${r[2]}</td><td data-l="未通过">${r[3]}</td></tr>`).join('')}
      </tbody></table></div>

      <div class="section-head" style="margin-top:46px"><div><div class="eyebrow">SUBMISSION</div><h2 class="h2">标准提报七步</h2></div></div>
      <div class="cards c4">${[['基础信息', '项目名、题材、形态、集数、单集及总时长、阶段'], ['团队与主体', '负责人实名、成员岗位、签约主体、院校信息'], ['故事资料', '一句话梗概、大纲1500—5000字、人物小传'], ['美术方案', '主要角色、关键场景、3—8张概念图及来源'], ['概念宣导片', '两支分别30—60秒，一支叙事卖点、一支技术验证'], ['项目预算', '总预算、分项成本、资金来源、算力预估'], ['权利与声明', '原创/改编、音乐/肖像/声音、AI工具许可']].map(([t, s], i) => `<div class="card"><span class="mono gold">STEP ${i + 1}</span><b style="display:block;margin:4px 0">${t}</b><p class="xs muted">${s}</p></div>`).join('')}
        <a class="card hover" href="#/workbench?go=asset" style="display:grid;place-items:center;text-align:center;border-style:dashed"><div><i class="fa-solid fa-plus gold" style="font-size:26px"></i><div style="margin-top:8px">开始提报</div></div></a></div>
    </div>`
  }

  // ================= P05 算力预算生成器 =================
  const DEFAULT_SHOTS = [{ name: '常规对白镜头', seconds: 3600, adopt: 5, k: 2, p: 0.4, r: 0.2, billSec: 5, price: 0.3 }]
  R.estimator = async (app) => {
    app.innerHTML = pageHero('COMPUTE ESTIMATOR', '算力预算生成器', '在明确模型、画质、镜头结构与返工假设下，输出可解释的资源需求区间——不是看似精确的单一数字。') +
      `<div class="wrap section" style="padding-top:26px">
      <div class="card" style="margin-bottom:16px"><div class="between"><b><i class="fa-solid fa-square-root-variable gold"></i> 核心公式</b><span class="xs dim">全案第8章</span></div>
        <p class="mono small" style="margin-top:10px;line-height:2">N<sub>j</sub> = ⌈成片秒数 ÷ 平均采用秒数⌉ &nbsp;·&nbsp; q<sub>j</sub> = 1 − (1 − p<sub>j</sub>)<sup>k<sub>j</sub></sup> &nbsp;·&nbsp; G<sub>j</sub> = N<sub>j</sub> × k<sub>j</sub> ÷ q<sub>j</sub> × (1 + r<sub>j</sub>) &nbsp;·&nbsp; C = Σ G<sub>j</sub> × 计费秒数 × 单价</p>
        <p class="xs muted">有试制观测的一轮通过率 q 时优先使用观测值；p 缺失或为 0 时不计算，提示“需试制校准”。</p></div>
      <form id="est-form" class="card">
        <div class="between" style="margin-bottom:12px"><b>镜头分类</b><div class="row"><button type="button" class="btn btn-sm" id="demo-btn"><i class="fa-solid fa-flask"></i>载入演示案例</button><button type="button" class="btn btn-sm" id="add-shot"><i class="fa-solid fa-plus"></i>添加镜头类</button></div></div>
        <div id="shots"></div>
        <div class="hr"></div>
        <b class="small">场景假设（应用于全部镜头类）</b>
        <div class="grid2" style="margin-top:10px">
          <div class="card" style="padding:14px"><div class="xs green" style="margin-bottom:8px">低耗场景</div><div class="grid3"><div class="field"><label>p</label><input class="input" name="low_p" value="0.6"></div><div class="field"><label>r</label><input class="input" name="low_r" value="0.1"></div><div class="field"><label>单价 元/秒</label><input class="input" name="low_price" value="0.2"></div></div></div>
          <div class="card" style="padding:14px"><div class="xs red" style="margin-bottom:8px">高耗场景</div><div class="grid3"><div class="field"><label>p</label><input class="input" name="high_p" value="0.25"></div><div class="field"><label>r</label><input class="input" name="high_r" value="0.35"></div><div class="field"><label>单价 元/秒</label><input class="input" name="high_price" value="0.5"></div></div></div>
        </div>
        <button class="btn btn-gold btn-block" style="margin-top:6px"><i class="fa-solid fa-calculator"></i>生成三场景报告</button>
        <p class="xs dim" style="margin-top:8px">${S.user ? '报告将绑定不可变快照并保存。' : '登录后可保存报告快照并绑定项目。'}</p>
      </form>
      <div id="est-out" style="margin-top:16px"></div></div>`
    let shots = JSON.parse(JSON.stringify(DEFAULT_SHOTS))
    const F = [['seconds', '成片秒数'], ['adopt', '采用秒/镜'], ['k', '每轮候选k'], ['p', '单候选可用率p'], ['r', '返工r'], ['billSec', '计费秒/条'], ['price', '单价元/秒']]
    const draw = () => {
      $('#shots').innerHTML = shots.map((s, i) => `<div class="shot-row" data-i="${i}"><div class="shot-name"><label>镜头类名称</label><input class="input" data-k="name" value="${esc(s.name)}"></div>
        ${F.map(([k, l]) => `<div><label>${l}</label><input class="input" data-k="${k}" type="number" step="any" value="${s[k]}"></div>`).join('')}
        <div class="shot-del"><label>&nbsp;</label><button type="button" class="btn btn-sm btn-ghost" data-del="${i}" ${shots.length < 2 ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button></div></div>`).join('')
      $$('#shots input').forEach((inp) => (inp.oninput = () => { const i = inp.closest('.shot-row').dataset.i; const k = inp.dataset.k; shots[i][k] = k === 'name' ? inp.value : Number(inp.value) }))
      $$('[data-del]').forEach((b) => (b.onclick = () => { shots.splice(+b.dataset.del, 1); draw() }))
    }
    draw()
    $('#add-shot').onclick = () => { shots.push({ name: '复杂动作镜头', seconds: 600, adopt: 4, k: 4, p: 0.2, r: 0.3, billSec: 5, price: 0.3 }); draw() }
    $('#demo-btn').onclick = () => { shots = JSON.parse(JSON.stringify(DEFAULT_SHOTS)); draw(); toast('已载入全案第8.3节演示案例（非报价）') }
    $('#est-form').onsubmit = async (e) => {
      e.preventDefault()
      const f = e.target
      const body = { shots, scenarios: { low: { all: { p: +f.low_p.value, r: +f.low_r.value, price: +f.low_price.value } }, high: { all: { p: +f.high_p.value, r: +f.high_r.value, price: +f.high_price.value } } } }
      let d
      if (S.user) { try { d = await api('/estimates', { body }) } catch (er) { return errToast(er) } }
      else { d = localEstimate(body) }
      $('#est-out').innerHTML = `<div class="sc-cards">${[['low', '低耗场景', ''], ['base', '基准场景', 'base'], ['high', '高耗场景', '']].map(([k, l, c]) => `<div class="sc ${c}"><div class="xs muted">${l}</div><b>${money(d[k].cost)}</b><div class="xs dim">期望生成 ${d[k].generations.toLocaleString()} 条</div></div>`).join('')}</div>
        <div class="table-wrap" style="margin-top:14px"><table class="tbl rwd"><thead><tr><th>镜头类</th><th>有效镜头N</th><th>一轮通过率q</th><th>期望条数G</th><th>基准成本</th></tr></thead><tbody>
        ${d.base.lines.map((l) => `<tr><td data-l="镜头类">${esc(l.name)}</td><td data-l="N" class="mono">${l.N}</td><td data-l="q" class="mono">${l.q || '<span class="red">需校准</span>'}</td><td data-l="G" class="mono">${l.Graw ?? '—'} → ${l.G}</td><td data-l="成本" class="mono gold">${money(l.cost)}</td></tr>`).join('')}</tbody></table></div>
        <div class="notice" style="margin-top:14px"><i class="fa-solid fa-triangle-exclamation"></i><div><b>未含项：</b>${d.excluded.join('、')}。<br>${esc(d.disclaimer)} 报价有效期至 <b class="gold">${esc(d.valid_until)}</b>${d.estimate_id ? '，报告快照 #' + d.estimate_id : ''}。</div></div>`
    }
  }
  function localEstimate(body) {
    const run = (shots) => { let cost = 0, gens = 0; const lines = shots.map((s) => { const N = Math.ceil(s.seconds / s.adopt); const q = s.p > 0 ? 1 - Math.pow(1 - s.p, s.k) : 0; if (!q) return { name: s.name, N, q: 0, G: 0, cost: 0 }; const Graw = (N * s.k) / q * (1 + s.r); const G = Math.ceil(Graw - 1e-9); const c = G * s.billSec * s.price; cost += c; gens += G; return { name: s.name, N, q: +q.toFixed(4), Graw: +Graw.toFixed(2), G, cost: +c.toFixed(2) } }); return { lines, cost: +cost.toFixed(2), generations: gens } }
    const mk = (a) => body.shots.map((s) => ({ ...s, ...a.all }))
    return { base: run(body.shots), low: run(mk(body.scenarios.low)), high: run(mk(body.scenarios.high)), valid_until: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), excluded: ['其他模型服务', '人力', '权利授权', '宣发与发行交付', '税费', '风险准备金'], disclaimer: '三场景不是统计置信区间；生成费用≠影视项目总预算。' }
  }

  // ================= P07 影市 =================
  R.market = async (app, _p, q) => {
    const type = q.type || ''
    const [{ listings }, { demands }] = await Promise.all([api('/listings?type=' + encodeURIComponent(type) + '&q=' + encodeURIComponent(q.q || '')), api('/demands')])
    app.innerHTML = pageHero('JIEDAI MARKET · 交易品牌', '迭代影市 <span class="gold">·</span> 连接创作者、版权方与市场', '实名挂牌、授权资料室、洽谈签约与履约跟踪。平台审核材料与可售范围，不提供作品价值或成交保证，不做公众募资。',
      `<div class="row" style="margin-top:18px"><a class="btn btn-gold" href="#/workbench?go=listing"><i class="fa-solid fa-tag"></i>发布挂牌</a><a class="btn" href="#/login?mode=register&role=institution"><i class="fa-solid fa-building"></i>机构入驻</a></div>`) +
      `<div class="wrap section" style="padding-top:26px">
      <form id="mk-search" class="row" style="margin-bottom:14px;flex-wrap:nowrap"><input class="input" name="q" placeholder="搜索片名、题材…" value="${esc(q.q || '')}"><button class="btn"><i class="fa-solid fa-magnifying-glass"></i></button></form>
      <div class="tabs">${['', '剧本/IP开发', '项目联合开发', '成片版权许可', '发行服务合作'].map((t) => `<a class="tab ${type === t ? 'active' : ''}" href="#/market?type=${encodeURIComponent(t)}">${t || '全部'}</a>`).join('')}</div>
      <div class="cards c3">${listings.map(posterCard).join('') || '<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-box-open"></i>没有匹配的挂牌，可调整条件或<a class="gold" href="#/workbench">提交需求单</a></div>'}</div>
      ${!S.user || !['institution', 'distributor'].includes(S.user.role) ? '<p class="xs dim" style="margin-top:10px"><i class="fa-solid fa-lock"></i> 部分挂牌仅认证机构可见，请以机构身份登录查看。</p>' : ''}

      <div class="section-head" style="margin-top:46px"><div><div class="eyebrow">DEMAND BOARD</div><h2 class="h2">机构需求广场</h2></div></div>
      <div class="table-wrap"><table class="tbl rwd"><thead><tr><th>需求</th><th>题材</th><th>时长</th><th>地区/语言</th><th>预算带</th><th>权利类别</th><th>截止</th></tr></thead><tbody>
        ${demands.map((m) => `<tr><td data-l="需求" class="full"><b>${esc(m.title)}</b><div class="xs dim">${esc(m.org)}</div></td><td data-l="题材">${esc(m.genre)}</td><td data-l="时长">${esc(m.duration)}</td><td data-l="地区">${esc(m.region)} / ${esc(m.language)}</td><td data-l="预算带" class="gold">${esc(m.budget_band)}</td><td data-l="权利">${esc(m.rights)}</td><td data-l="截止">${esc(m.deadline)}</td></tr>`).join('')}
      </tbody></table></div>

      <div class="section-head" style="margin-top:46px"><div><div class="eyebrow">DEAL FLOW</div><h2 class="h2">交易全流程</h2></div></div>
      <div class="card"><div class="flow">${['审核挂牌', '申请洽谈', 'NDA·资料授权', '尽调报价', '期权与排他', '正式签约', '原子锁权', '履约交付', '结算完结'].map((s, i) => `<div class="flow-step done"><div class="dot">${i + 1}</div><p>${s}</p></div>`).join('')}</div>
        <p class="xs muted" style="margin-top:8px">非约束询价不锁权；正式期权或排他协议才触发占用。权利库存以 作品＋权利类别＋地区＋媒介＋语言＋时间窗＋独家性 为核心，“全球”涵盖各地区、“全媒体”涵盖单一媒介。</p></div>
    </div>`
    $('#mk-search').onsubmit = (e) => { e.preventDefault(); location.hash = '#/market?type=' + encodeURIComponent(type) + '&q=' + encodeURIComponent(e.target.q.value) }
  }

  // ================= P08 挂牌详情 =================
  R.listing = async (app, p) => {
    let d
    try { d = await api('/listings/' + p[0]) } catch (e) {
      if (e.status === 403) return needLogin(app, e.error)
      throw e
    }
    const l = d.listing, u = S.user
    const isOrg = u && ['institution', 'distributor'].includes(u.role)
    app.innerHTML = `<section class="hero" style="min-height:auto;padding:0"><div class="poster-art ${COVER[l.cover] || 'art-noir'}" style="position:absolute;inset:0;aspect-ratio:auto;opacity:.55"><div class="scan"></div></div>
      <div class="wrap" style="position:relative;z-index:3;padding:56px 22px 34px"><a class="xs muted" href="#/market"><i class="fa-solid fa-arrow-left"></i> 返回影市</a>
      <div class="row" style="margin:14px 0 8px"><span class="tag ${FORM_COLOR[l.form] || ''}">${esc(l.form)}</span><span class="tag gold">${esc(l.type)}</span>${l.exclusive ? '<span class="tag red">独家</span>' : '<span class="tag">非独家</span>'}<span class="tag">${esc(l.visibility)}</span>${l.stage === '已成片' ? '<span class="tag green">成片</span>' : '<span class="tag amber">开发中项目</span>'}</div>
      <h1 class="h1" style="font-size:clamp(28px,4.5vw,48px)">${esc(l.asset_title)}</h1><p class="lead" style="margin-top:8px">${esc(l.logline || l.summary)}</p>
      <div class="row" style="margin-top:14px">${d.honors.map((h) => `<a class="laurel" href="#/verify/${esc(h.cert)}"><i class="fa-solid fa-award"></i>${esc(h.edition)} · ${esc(h.award)} · 获奖版本 ${esc(h.version)} ${h.status !== '有效' ? '（' + esc(h.status) + '）' : ''}</a>`).join('')}</div></div></section>
    <div class="wrap section" style="padding-top:26px"><div class="cards split">
      <div class="stack">
        <div class="card"><h3 class="h3">挂牌摘要</h3><p class="muted small" style="margin-top:8px">${esc(l.summary)}</p>
          <div class="cards c3 m2" style="margin-top:14px">${[['题材', l.genre], ['篇幅', `${l.episodes}集 × ${l.ep_minutes}分钟`], ['总时长', l.total_minutes + ' 分钟'], ['阶段', l.stage], ['权利状态', l.rights_status], ['主创', l.team]].map(([a, b]) => `<div><div class="xs dim">${a}</div><div class="small">${esc(b)}</div></div>`).join('')}</div></div>
        <div class="card"><h3 class="h3">权利矩阵</h3><div class="table-wrap" style="margin-top:10px"><table class="tbl rwd"><thead><tr><th>地区</th><th>媒介</th><th>语言</th><th>起止</th><th>独家</th></tr></thead><tbody><tr><td data-l="地区">${esc(l.territory)}</td><td data-l="媒介">${esc(l.media)}</td><td data-l="语言">${esc(l.language)}</td><td data-l="起止" class="mono">${esc(l.start_date)} ~ ${esc(l.end_date)}</td><td data-l="独家">${l.exclusive ? '是' : '否'}</td></tr></tbody></table></div>
          ${d.reservations.length ? `<div class="xs dim" style="margin:12px 0 6px">已占用权利库存（认证机构可见）</div>${d.reservations.map((r) => `<div class="xs"><span class="tag red">已占用</span> ${esc(r.territory)} · ${esc(r.media)} · ${esc(r.language)} · ${esc(r.start_date)}~${esc(r.end_date)} ${r.exclusive ? '· 独家' : ''}</div>`).join('')}` : ''}</div>
        <div class="card"><h3 class="h3"><i class="fa-solid fa-vault gold"></i> 私有资料室</h3>
          ${d.dataroom ? `<p class="xs green" style="margin:6px 0 10px">已授权层级：${esc(d.dataroom.level)}${d.grant ? ' · 有效期至 ' + esc(d.grant.expires_at) : ''}</p>${d.dataroom.files.map((f) => `<div class="between small" style="padding:8px 0;border-bottom:1px solid var(--line)"><span><i class="fa-regular fa-file-pdf red"></i> ${esc(f)}</span><span class="xs dim">水印预览 · 禁止下载</span></div>`).join('')}`
          : `<p class="small muted" style="margin-top:6px">预算、完整剧本与权利证明默认在资料室。需认证机构签署NDA并由权利人逐级批准；签NDA不等于取得全部资料。</p>${d.grant ? `<p style="margin-top:10px">申请状态：${statusTag(d.grant.status)}</p>` : ''}`}</div>
      </div>
      <div class="stack"><div class="card sticky-card">
        <div class="xs dim">报价方式</div><div class="h3 gold">${esc(l.price_mode)}</div><p class="xs muted">${esc(l.price_hint || '开放报价不等于固定可成交价格')}</p>
        <div class="hr"></div>
        ${d.is_owner ? '<div class="notice"><i class="fa-solid fa-user-pen"></i><div>这是您的挂牌，可在工作台审批机构资料申请。</div></div>'
          : isOrg ? `<button class="btn btn-gold btn-block" id="req-access"><i class="fa-solid fa-key"></i>申请资料室访问</button><button class="btn btn-block" style="margin-top:10px" id="req-deal"><i class="fa-solid fa-file-signature"></i>提交洽谈意向</button>`
          : `<a class="btn btn-gold btn-block" href="#/login?mode=register&role=institution"><i class="fa-solid fa-building"></i>以认证机构身份洽谈</a>`}
        <p class="xs dim" style="margin-top:12px">平台提供撮合与流程支持；项目合作不是可自由转让的公众投资份额，不提供公开认购、承诺收益或二级转售。</p>
      </div></div>
    </div></div>`
    const ra = $('#req-access')
    if (ra) ra.onclick = () => modal('申请资料室访问', `<form id="acc-form"><div class="field"><label>资料层级</label><select class="input" name="level"><option>故事大纲</option><option>完整剧本</option><option>预算明细</option><option>法务文件</option></select></div>
      <div class="field"><label>用途说明<em>*</em></label><textarea class="input" name="purpose" required placeholder="如：网络独家采购评估"></textarea></div>
      <label class="check"><input type="checkbox" name="nda"> 我已阅读并签署《项目保密协议（NDA）》，资料仅用于所述用途，不转授权、不批量抓取。</label>
      <button class="btn btn-gold btn-block" style="margin-top:10px">提交申请</button></form>`, (m) => {
      $('#acc-form', m).onsubmit = async (e) => { e.preventDefault(); try { const r = await api(`/listings/${l.id}/access`, { body: bindForm(e.target) }); closeModal(); toast(r.note, 'ok'); router() } catch (er) { errToast(er) } }
    })
    const rd = $('#req-deal')
    if (rd) rd.onclick = () => modal('提交洽谈意向', `<form id="deal-form"><div class="notice" style="margin-bottom:14px"><i class="fa-solid fa-circle-info"></i><div>意向为非约束询价，不锁定权利；正式签约生效后才占用权利库存。</div></div>
      <div class="field"><label>意向金额（元，可选）</label><input class="input" name="amount" type="number" placeholder="面议可留空"></div>
      <div class="grid2"><div class="field"><label>地区</label><input class="input" name="territory" value="${esc(l.territory)}"></div><div class="field"><label>媒介</label><input class="input" name="media" value="${esc(l.media)}"></div></div>
      <button class="btn btn-gold btn-block">提交意向</button></form>`, (m) => {
      $('#deal-form', m).onsubmit = async (e) => { e.preventDefault(); try { const r = await api('/deals', { body: { listing_id: l.id, ...bindForm(e.target) } }); closeModal(); toast(r.note, 'ok') } catch (er) { errToast(er) } }
    })
  }

  // ================= 发行中心 =================
  R.distribution = async (app, _p, q) => {
    const { channels, note } = await api('/channels')
    const tab = q.tab || 'channels'
    app.innerHTML = pageHero('DISTRIBUTION CENTER · 运营中台', '发行中心 <span class="gold">·</span> 全渠道发行协作', '渠道需求 → 发行计划 → 权利窗口 → 母版交付 → 渠道送审 → 上线确认 → 报表回款 → 分账 → 续约下架。上线、收入与回款分开记录。',
      `<div class="row" style="margin-top:18px"><a class="btn btn-gold" href="#/workbench"><i class="fa-solid fa-satellite-dish"></i>发行运营工作台</a><a class="btn" href="#/distribution?tab=waterfall"><i class="fa-solid fa-coins"></i>分账演示</a></div>`) +
      `<div class="wrap section" style="padding-top:26px"><div class="tabs">${[['channels', '渠道体系'], ['flow', '发行流程 D0—D7'], ['delivery', '母版与交付'], ['models', '商业模式'], ['waterfall', '分账瀑布']].map(([k, l]) => `<a class="tab ${tab === k ? 'active' : ''}" href="#/distribution?tab=${k}">${l}</a>`).join('')}</div><div id="dist-body"></div></div>`
    const body = $('#dist-body')
    if (tab === 'channels') {
      const groups = [...new Set(channels.map((c) => c.type))]
      body.innerHTML = `<div class="notice" style="margin-bottom:16px"><i class="fa-solid fa-circle-info"></i><div>${esc(note)}</div></div>` +
        groups.map((g) => `<h3 class="h3" style="margin:22px 0 10px"><i class="fa-solid fa-tower-broadcast gold"></i> ${esc(g)}</h3><div class="cards c3">${channels.filter((c) => c.type === g).map((c) => `<div class="card hover"><div class="between"><b>${esc(c.name)}</b><span class="xs dim">${esc(c.region)}</span></div><div class="row" style="margin:8px 0"><span class="tag ${c.biz_status.startsWith('已签') ? 'green' : ''}">业务：${esc(c.biz_status)}</span><span class="tag ${c.tech_status === '未接入' ? '' : 'cyan'}">技术：${esc(c.tech_status)}</span></div><div class="xs muted">模式：${esc(c.model)}</div><div class="xs muted">规格：${esc(c.specs)}</div><div class="xs dim" style="margin-top:6px">${esc(c.public_info)}</div></div>`).join('')}</div>`).join('')
    } else if (tab === 'flow') {
      body.innerHTML = `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>阶段</th><th>责任人及动作</th><th>必要证据与出口</th></tr></thead><tbody>${[['D0 需求与初评', '发行经理匹配渠道，制片评估成本', '需求卡、受众、成本假设；不把预测当回款'], ['D1 选片与清权', '权利方授权试看片，渠道反馈意向', '版本、选片意见、权利证据及风险缺口'], ['D2 商务与许可', '法务确认代理/采购、地域、费用及窗口', '正式合同、生效条件、权利占用与审批'], ['D3 交付准备', '交付经理组织母版、译配、技术与内容核验', '渠道规格版本、质检、清权及交付包'], ['D4 渠道送审', '授权运营提交并跟踪整改', '渠道任务ID/签收及反馈；回执不等于通过'], ['D5 上线与宣发', '确认渠道批准、排期及地域可用', '内容ID、上线时间、证据与宣发审批'], ['D6 运营及结算', '按渠道收数、对账、到账及分配', '原始账单、银行核验、费用凭证与结算单'], ['D7 续约与退出', '发行及法务检查期限和存续义务', '续约文件或下架回执，关账与证据归档']].map((r) => `<tr><td data-l="阶段"><b class="gold">${r[0]}</b></td><td data-l="动作">${r[1]}</td><td data-l="证据" class="full">${r[2]}</td></tr>`).join('')}</tbody></table></div>
        <div class="card" style="margin-top:16px"><h3 class="h3" style="margin-bottom:10px">发行实例状态机</h3><div class="flow">${['计划', '权利就绪', '送审', '渠道通过', '待上线', '已上线', '到期处置', '归档'].map((s, i) => `<div class="flow-step done"><div class="dot">${i + 1}</div><p>${s}</p></div>`).join('')}</div><p class="xs muted">异常：驳回整改、延期、地区限制、异常暂停及下架。release.live 只驱动运营看板，不触发收入或付款。</p></div>`
    } else if (tab === 'delivery') {
      body.innerHTML = `<div class="cards c2">${[['fa-film', '母版库', '成片、清洁画面、分集、帧率、画幅、分辨率、版本及校验值', '原版不可覆盖；衍生剪辑绑定来源和批准'], ['fa-closed-captioning', '声音与字幕', '对白、音乐音效、混音、语言、字幕及译配工程', '同步、完整性、授权及人工语言审核'], ['fa-tags', '元数据与美术', '中外文名、梗概、分集、主创、海报及评级等', '按渠道必填字段校验，不统一虚构评级'], ['fa-file-shield', '权利与合规包', '链路证明、音乐/艺人许可、地区要求及AI标识', '有效期及使用范围匹配；原始敏感素材不外发'], ['fa-list-check', '质检与送审', '技术规则、问题时间码、修复、批准、批次及回执', '自动检查与内容判断分开，P0允许人工QC'], ['fa-language', '本地化与地区合规', '翻译→术语校审→字幕/配音→音画同步→地区审核→确认', '自动译配仅作草稿；新增声音/语种不越许可']].map(([i, t, a, b]) => `<div class="card"><div class="row"><i class="fa-solid ${i} gold"></i><b>${t}</b></div><p class="small muted" style="margin-top:8px">${a}</p><p class="xs gold" style="margin-top:6px">控制：${b}</p></div>`).join('')}</div>`
    } else if (tab === 'models') {
      body.innerHTML = `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>模式</th><th>系统记录</th><th>不可混淆事项</th></tr></thead><tbody>${[['固定许可费/采购', '合同金额、交付验收、账期及到账', '应收不等于实收；是否含税单独标记'], ['代理发行佣金', '收款主体、佣金基数、比例、可扣费用与上限', '代理收入不等于作品总收入'], ['保底＋超额分成', '保底义务、付款计划、抵扣及超额门槛', '只在已签合同启用，不是平台普遍承诺'], ['订阅/点播/广告分账', '渠道原始计算口径、扣项及账期', '不能用播放量或广告展示反推实际到账'], ['联合发行/多级分销', '各方服务边界、转授权链、报告和回款路径', '禁止未经许可再分销及重复收取未披露佣金']].map((r) => `<tr><td data-l="模式"><b>${r[0]}</b></td><td data-l="记录">${r[1]}</td><td data-l="注意" class="full">${r[2]}</td></tr>`).join('')}</tbody></table></div>`
    } else {
      body.innerHTML = `<div class="cards c2"><form class="card" id="wf-form"><h3 class="h3">分账瀑布计算器</h3><p class="xs muted" style="margin:4px 0 14px">默认参数为技术策划案第18.3节纯演示算例（非报价、非推荐比例）。</p>
        <div class="grid2"><div class="field"><label>渠道报告毛额</label><input class="input" name="gross" value="100000"></div><div class="field"><label>渠道已扣费用</label><input class="input" name="fee" value="20000"></div>
        <div class="field"><label>实际到账（基数）</label><input class="input" name="received" value="80000"></div><div class="field"><label>发行佣金 %</label><input class="input" name="commission_pct" value="10"></div>
        <div class="field"><label>已批准宣发费</label><input class="input" name="promo" value="10000"></div><div class="field"><label>可回收投资余额</label><input class="input" name="recoup" value="40000"></div>
        <div class="field"><label>创作方分成 %</label><input class="input" name="creator_pct" value="60"></div></div>
        <button class="btn btn-gold btn-block">计算</button></form><div id="wf-out"></div></div>`
      const calc = async (f) => {
        const b = bindForm(f)
        const body = { received: +b.received, commission_pct: +b.commission_pct, promo: +b.promo, recoup: +b.recoup, creator_pct: +b.creator_pct }
        let r
        if (S.user) r = await api('/settlements/preview', { body })
        else { // 本地计算（与服务端同算法）
          let left = body.received; const steps = []; const cm = +(left * body.commission_pct / 100).toFixed(2); left -= cm; steps.push({ item: `发行佣金 ${body.commission_pct}%（按实际到账）`, amount: cm })
          const pr = Math.min(body.promo, left); left -= pr; steps.push({ item: '回收已批准宣发费', amount: pr }); const rc = Math.min(body.recoup, left); left -= rc; steps.push({ item: '回收可回收投资余额', amount: rc })
          const cr = +(left * body.creator_pct / 100).toFixed(2); steps.push({ item: `创作方分成 ${body.creator_pct}%`, amount: cr }); steps.push({ item: `投资方分成 ${100 - body.creator_pct}%`, amount: +(left - cr).toFixed(2) })
          r = { received: body.received, steps, sum: steps.reduce((a, s) => a + s.amount, 0), balanced: true, recoup_left: body.recoup - rc }
        }
        const max = Math.max(...r.steps.map((s) => s.amount), 1)
        $('#wf-out').innerHTML = `<div class="card"><div class="between"><h3 class="h3">分配结果</h3>${r.balanced ? '<span class="tag green"><i class="fa-solid fa-check"></i>勾稽平衡</span>' : '<span class="tag red">不平衡</span>'}</div>
          <div class="xs muted" style="margin:6px 0 14px">渠道报告 ${money(+b.gross)} − 已扣渠道费 ${money(+b.fee)} = 实际到账 <b class="gold">${money(r.received)}</b>（渠道费不得二次扣除）</div>
          ${r.steps.map((s) => `<div class="between small" style="margin-top:10px"><span>${esc(s.item)}</span><b class="mono gold">${money(s.amount)}</b></div><div class="bar" style="margin-top:6px"><i style="width:${(s.amount / max) * 100}%"></i></div>`).join('')}
          <div class="hr"></div><div class="between"><b>合计去向</b><b class="mono gold">${money(r.sum)}</b></div><div class="xs dim" style="margin-top:6px">剩余可回收投资余额：${money(r.recoup_left)}；已上线但未到款不生成可支付分账。</div></div>`
      }
      $('#wf-form').onsubmit = (e) => { e.preventDefault(); calc(e.target).catch(errToast) }
      calc($('#wf-form')).catch(errToast)
    }
  }

  // ================= 活动 =================
  R.events = async (app) => {
    const { events } = await api('/events')
    app.innerHTML = pageHero('ROADSHOW · SCREENING', '路演与活动', '全年项目入库 ＋ 季度线上评审/路演 ＋ 年度盛典交易展演。观众票不等于资料室访问权，入围不等于采购意向。') +
      `<div class="wrap section" style="padding-top:26px"><div class="cards c2">${events.map((e) => `<div class="card hover">${eventCard(e).replace(/^<div class="card hover">|<\/div>$/g, '')}<p class="xs muted" style="margin-top:10px">${esc(e.intro)}</p>
        <button class="btn btn-sm ${e.booked_by_me ? '' : 'btn-gold'}" style="margin-top:12px" data-book="${e.id}" ${e.booked_by_me ? 'disabled' : ''}>${e.booked_by_me ? '<i class="fa-solid fa-check"></i>已预约' : '<i class="fa-solid fa-ticket"></i>预约'}</button></div>`).join('')}</div></div>`
    $$('[data-book]').forEach((b) => (b.onclick = async () => {
      if (!S.user) return (location.hash = '#/login?next=' + encodeURIComponent('#/events'))
      try { const r = await api(`/events/${b.dataset.book}/book`, { method: 'POST' }); toast(r.note, 'ok'); router() } catch (e) { errToast(e) }
    }))
  }

  // ================= 学院与资源 =================
  R.academy = async (app, _p, q) => {
    const tab = q.tab || 'courses'
    const [{ courses }, { insights }] = await Promise.all([api('/courses'), api('/insights')])
    app.innerHTML = pageHero('ACADEMY & RESOURCES', '学院与资源', '七条学习路径，入门内容免费开放。课程完成仅代表学习进度，不替代评审和行业资质，培训不换评奖优势。') +
      `<div class="wrap section" style="padding-top:26px"><div class="tabs">${[['courses', '课程路径'], ['insights', '行业洞察'], ['license', '肖像/声音授权']].map(([k, l]) => `<a class="tab ${tab === k ? 'active' : ''}" href="#/academy?tab=${k}">${l}</a>`).join('')}</div><div id="ac-body"></div></div>`
    const b = $('#ac-body')
    if (tab === 'courses') b.innerHTML = `<div class="cards c3">${courses.map((c) => `<div class="card hover"><div class="between"><span class="tag gold">${esc(c.path)}</span>${c.free ? '<span class="tag green">免费</span>' : '<span class="tag amber">训练营</span>'}</div><b style="display:block;margin:10px 0 6px">${esc(c.title)}</b><p class="xs muted">${esc(c.intro)}</p><div class="xs dim" style="margin-top:10px">${esc(c.level)} · ${c.lessons} 课时</div></div>`).join('')}</div>`
    else if (tab === 'insights') b.innerHTML = `<div class="cards c2">${insights.map(insightCard).join('')}</div><p class="xs dim" style="margin-top:12px">以上为公开报道摘要，数据口径以原始来源为准；不将公开披露推定为本平台可直接调用的资源。</p>`
    else b.innerHTML = `<div class="notice red" style="margin-bottom:16px"><i class="fa-solid fa-triangle-exclamation"></i><div>“知名演员/老艺人授权支持”为拟建设服务（P1），不是现有资源承诺。平台不提供未获许可的声音克隆或演员复刻功能。</div></div>
      <div class="timeline">${[['授权建档', '上传合同及代表权限，录入艺人身份和素材范围'], ['项目申请', '提交剧本、角色、场景、台词、使用媒介及地区'], ['权利方审批', '训练与推理分开授权，不默认允许模型训练'], ['签约付款', '明确许可期限、署名、分成、撤回和违约'], ['受控生产', '指定成员、隔离素材，不得导出原始人脸/声纹'], ['样片与成片审核', '新增用途、换模型、改地区须重新确认'], ['发行与到期', '新生成禁用与已发行内容处置分别约定']].map(([t, s]) => `<div class="tl-item"><b>${t}</b><div class="small muted">${s}</div></div>`).join('')}</div>`
  }

  // ================= 规则 =================
  R.rules = async (app) => {
    app.innerHTML = pageHero('TRUST & BOUNDARY', '平台边界与规则', '专业评奖、资源投决、交易采购三套决策独立，不用赞助、获奖或推荐替代合同与权利许可。') +
      `<div class="wrap section" style="padding-top:26px"><div class="table-wrap"><table class="tbl rwd"><thead><tr><th>维度</th><th>本平台做什么</th><th>不做什么</th></tr></thead><tbody>
      ${[['评奖', '专业评审、可追溯提名及荣誉认证', '付费买奖、投资方干预艺术评分'], ['孵化', '项目筛选、预算与里程碑、受限资源授予', '保证所有报名者获投或获得免费算力'], ['交易', '实名挂牌、授权资料室、洽谈签约与履约跟踪', '公众募资、保收益、无资质资金托管'], ['发行', '需求、清权、窗口、交付、宣发、上线、回款与续约', '未经许可直接上架、保证流量或承诺发行收益'], ['内容', '服务中剧及以上的项目和多种AIGC影视形态', '把30—60秒概念片当作完整叙事作品奖成片']].map((r) => `<tr><td data-l="维度"><b class="gold">${r[0]}</b></td><td data-l="做什么" class="full">${r[1]}</td><td data-l="不做什么" class="full red">${r[2]}</td></tr>`).join('')}</tbody></table></div>
      <div class="cards c2" style="margin-top:18px">${[['数据与AI', '未经明确合法授权，用户资料不用于平台或第三方模型训练；AI摘要、标签、辅助匹配需脱敏并人工复核。'], ['安全', '传输与静态加密、私有存储、短期签名链接、动态水印、关键操作双人审批与审计；不宣传“绝对防泄漏”。'], ['资金', 'P0不建设平台资金池；系统登记凭证、到账复核、发票及应付台账，不把付款截图判定已收款。'], ['争议', '发起工单→保存证据→冻结新增操作→双方举证→调解或提交约定争议机构；平台不取得单方裁定权。']].map(([t, s]) => `<div class="card"><b class="gold">${t}</b><p class="small muted" style="margin-top:6px">${s}</p></div>`).join('')}</div></div>`
  }

  // ================= 登录 / 入驻 =================
  R.login = async (app, _p, q) => {
    const reg = q.mode === 'register'
    const demo = [['creator@demo.cn', '创作者 林深', 'fa-pen-nib'], ['expert@demo.cn', '评审专家A', 'fa-user-tie'], ['org@demo.cn', '认证机构', 'fa-building'], ['dist@demo.cn', '发行运营', 'fa-satellite-dish'], ['ops@demo.cn', '联合运营', 'fa-shield-halved'], ['finance@demo.cn', '财务复核', 'fa-coins']]
    app.innerHTML = `<div class="wrap section"><div class="cards c2" style="max-width:980px;margin:0 auto;align-items:start">
      <div class="card" style="padding:28px"><div class="eyebrow">${reg ? 'JOIN' : 'SIGN IN'}</div><h1 class="h2">${reg ? '入驻迭代影交汇' : '登录工作台'}</h1>${reg ? '<p class="xs muted" style="margin-top:10px;padding:10px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)">入驻并建立作品档案，即可在<a class="pg-link" href="#/lightyear">光年计划</a>中领取基础 Seedance 算力额度。</p>' : ''}
        <form id="auth-form" style="margin-top:18px">
          ${reg ? `<div class="field"><label>身份</label><div class="row"><label class="check"><input type="radio" name="role" value="creator" ${q.role !== 'institution' ? 'checked' : ''}> 创作者/团队</label><label class="check"><input type="radio" name="role" value="institution" ${q.role === 'institution' ? 'checked' : ''}> 机构（投资/采购/发行）</label></div><div class="hint">专家与运营账号由平台邀请开通。机构提交后需核验资质。</div></div>
          <div class="field"><label>姓名<em>*</em></label><input class="input" name="name" required></div><div class="field"><label>院校/机构</label><input class="input" name="org"></div>` : ''}
          <div class="field"><label>邮箱<em>*</em></label><input class="input" name="email" type="email" required autocomplete="username"></div>
          <div class="field"><label>密码<em>*</em></label><input class="input" name="password" type="password" required minlength="${reg ? 8 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
          ${reg ? '<label class="check"><input type="checkbox" name="agree" required> 我已阅读并同意《用户协议》《隐私政策》；营销订阅独立勾选。</label>' : ''}
          <button class="btn btn-gold btn-block" style="margin-top:10px">${reg ? '创建账户' : '登录'}</button>
        </form>
        <p class="small muted" style="margin-top:14px;text-align:center">${reg ? '已有账户？<a class="gold" href="#/login">去登录</a>' : '还没有账户？<a class="gold" href="#/login?mode=register">立即入驻</a>'}</p></div>
      <div class="card" style="padding:28px"><div class="eyebrow">DEMO ACCOUNTS</div><h3 class="h3" style="margin:6px 0 4px">演示账号一键体验</h3><p class="xs muted">统一密码 <span class="mono gold">demo1234</span>，覆盖五类工作台。</p>
        <div class="cards c2 m2" style="margin-top:14px">${demo.map(([e, l, i]) => `<button class="btn" data-demo="${e}" style="justify-content:flex-start"><i class="fa-solid ${i} gold"></i>${l}</button>`).join('')}</div>
        <div class="notice" style="margin-top:16px"><i class="fa-solid fa-circle-info"></i><div>另有 creator2@demo.cn（苏芮）、expert2/expert3@demo.cn、ops2@demo.cn（第二审批人）用于演示双人审批与多方协作。</div></div></div>
    </div></div>`
    const go = () => { location.hash = q.next ? decodeURIComponent(q.next) : '#/workbench' }
    $('#auth-form').onsubmit = async (e) => {
      e.preventDefault()
      const b = bindForm(e.target)
      try { const d = await api(reg ? '/auth/register' : '/auth/login', { body: b }); setSession(d.token, d.user); toast('欢迎，' + esc(d.user.name), 'ok'); go() } catch (er) { errToast(er) }
    }
    $$('[data-demo]').forEach((btn) => (btn.onclick = async () => {
      try { const d = await api('/auth/login', { body: { email: btn.dataset.demo, password: 'demo1234' } }); setSession(d.token, d.user); toast('已以「' + esc(d.user.role_label) + '」身份登录', 'ok'); go() } catch (er) { errToast(er) }
    }))
  }

  R['404'] = async (app) => { app.innerHTML = `<div class="wrap section"><div class="empty"><i class="fa-solid fa-film"></i>页面不存在 · CUT!<div style="margin-top:14px"><a class="btn btn-gold btn-sm" href="#/">回到首页</a></div></div></div>` }
})()
