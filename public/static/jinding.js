/* 迭代盛典 · 影视专业毕业生作品颁奖盛典（资料来源：公众号「迭代盛典」及公开媒体报道） */
(function () {
  const R = window.ROUTES
  const head = (no, title, note = '') => `<div class="pg-head"><div class="no">${no}</div><div><h2>${title}</h2></div><div>${note ? `<p>${note}</p>` : ''}</div></div>`
  const src = (arr) => (arr && arr.length ? `<p class="xs dim dd-src">来源：${arr.map(([t, u]) => `<a class="pg-link" href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('、')}</p>` : '')
  const block = {
    about: (b) => `<p class="lead" style="max-width:860px">${esc(b.lead)}</p>
      <div class="pg-figs" style="margin:20px 0">${(b.facts || []).map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
      <ul class="jd-points">${(b.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>${src(b.sources)}`,
    edition4: (b) => `<div class="dd-call"><div class="dd-call-main"><span class="dd-live"><i></i>${esc(b.status || '征集中')}</span>
        <p style="margin:10px 0 16px">${esc(b.lead)}</p>
        <dl class="dd-dl">${b.items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <p class="xs muted" style="margin-top:14px"><i class="fa-solid fa-circle-info gold"></i> ${esc(b.note)}</p>${src(b.sources)}</div>
        <div class="dd-call-side"><div class="pg-label">第四届 · 2026</div><b class="dd-big">作品征集</b><p class="xs muted">影视专业毕业生 · 在校生</p>
          <a class="btn btn-gold btn-block" href="${S.user ? '#/apply?track=院校毕业生' : '#/login?mode=register&next=' + encodeURIComponent('#/apply')}">通过迭影计划提交作品</a>
          <a class="btn btn-block" href="javascript:void 0" data-go="dd-posts">查看官方公众号文章</a></div></div>`,
    founders: (b) => `<div class="pg-people">${b.people.map(([n, r, d]) => `<div class="pg-person"><span class="av">${esc(n[0])}</span><div><b>${esc(n)}</b><div class="xs gold">${esc(r)}</div><p class="xs muted">${esc(d)}</p></div></div>`).join('')}</div><p class="xs dim" style="margin-top:10px">${esc(b.note)}</p>`,
    history: (b) => `<ol class="dd-timeline">${b.items.map(([d, t, x]) => `<li class="${/待补充/.test(t) ? 'todo' : ''}"><span class="d mono">${esc(d)}</span><div><b>${esc(t)}</b><p class="small muted">${esc(x)}</p></div></li>`).join('')}</ol><p class="xs dim">${esc(b.note)}</p>`,
    awards: (b) => `<p class="muted" style="margin-bottom:14px">${esc(b.lead)}</p><div class="row">${b.awards.map((a) => `<span class="laurel"><i class="fa-solid fa-award"></i>${esc(a)}</span>`).join('')}</div>`,
    winners: (b) => `<div class="table-wrap"><table class="tbl rwd"><thead><tr><th>奖项</th><th>作品</th><th>获奖者</th></tr></thead><tbody>${b.win.map(([a, w, p]) => `<tr><td data-l="奖项"><span class="tag gold">${esc(a)}</span></td><td data-l="作品"><b>${esc(w)}</b></td><td data-l="获奖者" class="small muted">${esc(p)}</td></tr>`).join('')}</tbody></table></div>
      <details class="dd-more"><summary>单项提名（16 部）与优秀入围作品</summary>
        <dl class="dd-dl" style="margin-top:12px">${b.nom.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}<dt>优秀入围</dt><dd>${esc(b.finalists)}</dd></dl></details>
      <p class="xs dim dd-src">来源：${esc(b.src)}</p>`,
    recent: (b) => `<p class="lead" style="max-width:860px">${esc(b.lead)}</p>
      <div class="cards c3" style="margin:18px 0">${b.quotes.map(([n, t]) => `<blockquote class="dd-quote"><p>${esc(t)}</p><cite>— ${esc(n)} · 发起人</cite></blockquote>`).join('')}</div>
      <ul class="jd-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><p class="xs dim" style="margin-top:8px">${esc(b.note)}</p>`,
    press: (b) => `<div class="pg-links">${b.items.map(([m, t, d, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener"><b>${esc(t)}</b><span class="xs muted">${esc(m)} · ${esc(d)}</span><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`).join('')}</div>`,
  }
  const ORDER = ['edition4', 'about', 'history', 'winners', 'recent', 'awards', 'founders', 'press']
  R.diedai = R.jinding = async (app, p) => {
    if (p[0] === 'post') return postPage(app, p[1])
    const d = await api('/jinding')
    const sec = (c) => d.sections.find((x) => x.code === c)
    const isOp = S.user && ['operator', 'admin'].includes(S.user.role)
    const list = ORDER.filter(sec)
    app.innerHTML = `<section class="pg-hero sm dd-hero"><div class="wrap"><div class="pg-label">DIEDAI AWARDS · 影视专业毕业生作品颁奖盛典</div>
      <h1 style="font-size:clamp(36px,5.8vw,64px)">迭代盛典</h1>
      <p class="pg-slogan" style="letter-spacing:.2em">梦想的起点 · 学院派盛典</p>
      <p class="lead" style="margin:12px 0 18px">由张会军、杨步亭、岳晓湄等电影专家于 2021 年发起，整合全国数百所影视院校毕业生资源，进行作品征集、评选、颁奖与长片孵化。<b>第四届迭代盛典作品征集已于 2026 年 6 月启动。</b></p>
      <div class="row"><a class="btn btn-gold" href="javascript:void 0" data-go="dd-edition4">第四届征集详情</a><a class="btn" href="javascript:void 0" data-go="dd-winners">历届获奖作品</a></div>
      <nav class="jd-toc">${list.map((c, i) => `<a href="javascript:void 0" data-go="dd-${c}">${String(i + 1).padStart(2, '0')} ${esc(sec(c).title.replace(' · 作品征集中', ''))}</a>`).join('')}<a href="javascript:void 0" data-go="dd-posts">${String(list.length + 1).padStart(2, '0')} 公众号文章</a></nav>
    </div></section>
    <div class="wrap section" style="padding-top:30px">
      ${list.map((c, i) => { const s = sec(c); return `<section id="dd-${c}" class="jd-sec">${head(String(i + 1).padStart(2, '0'), esc(s.title), s.status === '草案' ? '草案 · 以官方公布为准' : '')}${(block[c] || (() => ''))(s.body)}</section>` }).join('')}
      <section id="dd-posts" class="jd-sec">${head(String(list.length + 1).padStart(2, '0'), '公众号文章', '收录公众号「迭代盛典」及院校官方号的相关文章，保留来源。')}
        ${isOp ? `<div class="row" style="margin-bottom:14px"><button class="btn btn-gold btn-sm" id="jd-import">导入公众号文章</button><span class="xs muted">后续官方新文章可在此补录</span></div>` : ''}
        ${d.posts.length ? `<div class="pg-links jd-posts">${d.posts.map((x) => `<a href="#/diedai/post/${x.id}"><b>${esc(x.title)}</b><span class="small muted">${esc(x.pub_date || '')} · ${esc(x.source || '')} · ${esc(x.category || '')}</span><i class="fa-solid fa-arrow-right"></i></a>`).join('')}</div>` : '<div class="empty">暂无文章</div>'}
      </section>
      <p class="xs dim" style="margin-top:24px">${esc(d.note)}</p>
    </div>`
    $$('[data-go]').forEach((a) => (a.onclick = () => { const el = document.getElementById(a.dataset.go); el && window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' }) }))
    const imp = $('#jd-import')
    if (imp) imp.onclick = () => modal('导入公众号文章', `<form id="jd-form">
      <div class="field"><label>标题</label><input class="input" name="title"></div>
      <div class="grid2"><div class="field"><label>发布日期</label><input class="input" type="date" name="pub_date"></div><div class="field"><label>分类</label><select class="input" name="category">${['盛典动态', '征集公告', '获奖名单', '评审委员会', '活动回顾', '院校喜报', '人物专访'].map((x) => `<option>${x}</option>`).join('')}</select></div></div>
      <div class="field"><label>原文链接</label><input class="input" name="url" placeholder="https://mp.weixin.qq.com/s/..."></div>
      <div class="field"><label>摘要（选填）</label><input class="input" name="summary"></div>
      <div class="field"><label>正文</label><textarea class="input" name="body" style="min-height:200px" placeholder="空行分段"></textarea></div>
      <button class="btn btn-gold btn-block">导入</button></form>`, (m) => {
      $('#jd-form', m).onsubmit = async (e) => { e.preventDefault(); try { await api('/jinding/posts', { body: bindForm(e.target) }); closeModal(); toast('已导入', 'ok'); router() } catch (er) { errToast(er) } }
    })
  }
  async function postPage(app, id) {
    const x = await api('/jinding/posts/' + encodeURIComponent(id))
    const isSogou = /weixin\.sogou\.com/.test(x.url || '')
    app.innerHTML = `<article class="wrap section jd-article" style="max-width:760px;padding-top:26px">
      <a class="xs muted" href="#/diedai">← 迭代盛典</a>
      <div class="pg-label" style="margin-top:16px">${esc(x.category || '')} · ${esc(x.pub_date || '')}</div>
      <h1 class="pg-title" style="font-size:clamp(24px,4vw,36px)">${esc(x.title)}</h1>
      <p class="xs dim">来源：${esc(x.source || '')}${x.url ? ` · <a class="pg-link" href="${esc(x.url)}" target="_blank" rel="noopener">${isSogou ? '在微信搜索中查看原文' : '查看原文'}</a>` : ''}</p>
      <div class="hr"></div>
      ${String(x.body).split(/\n\s*\n/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
      <div class="notice" style="margin-top:24px"><i class="fa-solid fa-copyright"></i><div>本文转载自${esc(x.source || '原作者')}，版权归原作者所有，仅用于迭代盛典资料汇编。如需删除请联系平台运营。</div></div>
    </article>`
  }
})()
