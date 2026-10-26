/* 金鼎盛典 · 体系介绍栏目 */
(function () {
  const R = window.ROUTES
  const head = (no, title, note = '') => `<div class="pg-head"><div class="no">${no}</div><div><h2>${title}</h2></div><div>${note ? `<p>${note}</p>` : ''}</div></div>`
  const block = {
    about: (b) => `<p class="lead" style="max-width:820px">${esc(b.lead)}</p><ul class="jd-points">${(b.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`,
    system: (b) => `<div class="jd-chain">${b.items.map(([t, d, k], i) => `<div class="jd-node ${i === 0 ? 'on' : ''}"><span class="pg-label">${k}</span><b>${t}</b><p class="xs muted">${d}</p></div>`).join('<i class="fa-solid fa-chevron-right jd-arrow"></i>')}</div>`,
    tracks: (b) => `<div class="cards c2" style="gap:16px">${b.tracks.map(([t, m, aw]) => `<div class="pg-box"><div class="pg-label">赛道</div><h3>${t}</h3><p class="xs muted" style="margin:6px 0 12px">提交材料：${esc(m)}</p><div class="xs dim">评审权重：${esc(b.weights[t] || '')}</div><div class="row" style="margin-top:12px">${aw.map((a) => `<span class="laurel">${a}</span>`).join('')}</div></div>`).join('')}</div>`,
    review: (b) => `<ol class="pg-steps jd-steps">${b.steps.map(([t, d], i) => `<li><span class="no">${i + 1}</span><div><b>${t}</b><p class="small muted">${esc(d)}</p></div></li>`).join('')}</ol>`,
    calendar: (b) => `<table class="pg-table"><tbody>${b.items.map(([t, d], i) => `<tr><td class="n">${String(i + 1).padStart(2, '0')}</td><td class="t"><b>${t}</b></td><td class="c">${esc(d)}</td></tr>`).join('')}</tbody></table>`,
    honor: (b) => `<p class="muted">${esc(b.lead)}</p>`,
  }
  R.jinding = async (app, p) => {
    if (p[0] === 'post') return postPage(app, p[1])
    const d = await api('/jinding')
    const sec = (c) => d.sections.find((x) => x.code === c)
    const order = ['about', 'system', 'tracks', 'review', 'calendar', 'honor']
    const isOp = S.user && ['operator', 'admin'].includes(S.user.role)
    app.innerHTML = `<section class="pg-hero sm"><div class="wrap"><div class="pg-label">迭代 · 年度作品盛典</div>
      <h1 style="font-size:clamp(34px,5.4vw,60px)">金鼎盛典</h1>
      <p class="pg-slogan" style="letter-spacing:.2em">发现新一代影视创作力量</p>
      <p class="lead" style="margin:12px 0 22px">面向影视院校毕业生与青年创作者的年度作品盛典，与迭影计划、迭代影市、发行中心共同构成“发现—孵化—交易—发行”的完整体系。</p>
      <div class="row"><a class="btn btn-gold" href="#/festival">报名本届盛典</a><a class="btn" href="#/verify">证书验真</a></div>
      <nav class="jd-toc">${order.map((c, i) => sec(c) ? `<a href="javascript:void 0" data-go="jd-${c}">${String(i + 1).padStart(2, '0')} ${sec(c).title}</a>` : '').join('')}<a href="javascript:void 0" data-go="jd-posts">07 公众号文章</a></nav>
    </div></section>
    <div class="wrap section" style="padding-top:30px">
      ${order.map((c, i) => { const s = sec(c); if (!s) return ''; return `<section id="jd-${c}" class="jd-sec">${head(String(i + 1).padStart(2, '0'), s.title, s.status === '草案' ? '草案 · 以官方公布为准' : '')}${(block[c] || (() => ''))(s.body)}
        ${c === 'honor' ? `<div class="pg-ranks" style="margin-top:16px">${d.honors.map((h, k) => `<a class="pg-rank" href="#/verify/${esc(h.cert || '')}"><span class="no">${String(k + 1).padStart(2, '0')}</span><div class="t"><b>《${esc(h.title)}》</b><div class="xs dim">${esc(h.edition)} · ${esc(h.form)}</div></div><div class="s"><span class="laurel">${esc(h.award)}</span></div><div class="f xs mono gold">${esc(h.cert || '')}</div></a>`).join('') || '<p class="xs muted">暂无已发布奖项</p>'}</div>` : ''}</section>` }).join('')}
      <section id="jd-posts" class="jd-sec">${head('07', '公众号文章', '收录金鼎盛典官方公众号文章，保留原文链接。')}
        ${isOp ? `<div class="row" style="margin-bottom:14px"><button class="btn btn-gold btn-sm" id="jd-import">导入公众号文章</button><span class="xs muted">粘贴文章标题、日期、正文与原文链接</span></div>` : ''}
        ${d.posts.length ? `<div class="pg-links jd-posts">${d.posts.map((x) => `<a href="#/jinding/post/${x.id}"><b>${esc(x.title)}</b><span class="small muted">${esc(x.pub_date || '')} · ${esc(x.category || '')} · ${esc(x.summary || '')}</span><i class="fa-solid fa-arrow-right"></i></a>`).join('')}</div>`
          : `<div class="pg-box jd-empty"><b>官方文章待接入</b><p class="small muted" style="margin-top:6px">公开渠道未检索到金鼎盛典影视类公众号的可抓取文章（搜狗微信结果多为同名的净水、地产等行业奖项）。请提供公众号名称 / 原始 ID 或文章链接，运营可在此一键导入，内容将以原文署名展示。</p></div>`}
      </section>
      <p class="xs dim" style="margin-top:24px">${esc(d.note)}</p>
    </div>`
    $$('[data-go]').forEach((a) => (a.onclick = () => { const el = document.getElementById(a.dataset.go); el && window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' }) }))
    const imp = $('#jd-import')
    if (imp) imp.onclick = () => modal('导入公众号文章', `<form id="jd-form">
      <div class="field"><label>标题</label><input class="input" name="title"></div>
      <div class="grid2"><div class="field"><label>发布日期</label><input class="input" type="date" name="pub_date"></div><div class="field"><label>分类</label><select class="input" name="category">${['盛典动态', '征集公告', '评审委员会', '获奖名单', '活动回顾', '人物专访'].map((x) => `<option>${x}</option>`).join('')}</select></div></div>
      <div class="field"><label>原文链接</label><input class="input" name="url" placeholder="https://mp.weixin.qq.com/s/..."></div>
      <div class="field"><label>摘要（选填）</label><input class="input" name="summary"></div>
      <div class="field"><label>正文</label><textarea class="input" name="body" style="min-height:200px" placeholder="空行分段"></textarea></div>
      <button class="btn btn-gold btn-block">导入</button></form>`, (m) => {
      $('#jd-form', m).onsubmit = async (e) => { e.preventDefault(); try { await api('/jinding/posts', { body: bindForm(e.target) }); closeModal(); toast('已导入', 'ok'); router() } catch (er) { errToast(er) } }
    })
  }
  async function postPage(app, id) {
    const x = await api('/jinding/posts/' + encodeURIComponent(id))
    app.innerHTML = `<article class="wrap section jd-article" style="max-width:760px;padding-top:26px">
      <a class="xs muted" href="#/jinding">← 金鼎盛典</a>
      <div class="pg-label" style="margin-top:16px">${esc(x.category || '')} · ${esc(x.pub_date || '')}</div>
      <h1 class="pg-title">${esc(x.title)}</h1>
      <p class="xs dim">来源：${esc(x.source || '')}${x.url ? ` · <a class="pg-link" href="${esc(x.url)}" target="_blank" rel="noopener">查看原文</a>` : ''}</p>
      <div class="hr"></div>
      ${String(x.body).split(/\n\s*\n/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
    </article>`
  }
})()
