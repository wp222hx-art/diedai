import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Env, authMiddleware } from './lib/core'
import publicRoutes from './routes/public'
import workRoutes from './routes/work'
import lightyearRoutes from './routes/lightyear'
import programRoutes from './routes/program'

const app = new Hono<Env>()

app.use('/api/*', cors())
app.use('/api/*', authMiddleware)
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: '服务异常，请稍后重试', detail: String(err?.message || err) }, 500)
})
app.get('/api/health', (c) => c.json({ ok: true, service: '迭代影交汇', version: '1.1.0' }))
app.route('/api', publicRoutes)
app.route('/api', workRoutes)
app.route('/api', lightyearRoutes)
app.route('/api', programRoutes)
app.all('/api/*', (c) => c.json({ error: '接口不存在' }, 404))

const shell = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="迭影计划｜迭代 × 捷成世纪 —— 5000万元 AI 影视算力扶持，面向 AI 专业电影团队与影视院校毕业生">
<title>迭影计划 · 迭代 × 捷成世纪 AI 影视扶持</title>
<meta property="og:title" content="迭影计划 · 5,000 万元 AI 影视算力扶持">
<meta property="og:description" content="每一次迭代，离银幕更近一帧。迭代 × 捷成世纪，为 AI 专业电影团队与影视院校毕业生提供免费算力、完片孵化与发行支持。">
<meta property="og:image" content="/static/img/program-poster.jpg">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='30' fill='%230b0b0f' stroke='%23d4a94f' stroke-width='4'/><circle cx='32' cy='32' r='8' fill='%23d4a94f'/></svg>">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body>
<div id="grain" aria-hidden="true"></div>
<header id="topbar">
  <a href="#/" class="brand" aria-label="迭影计划首页">
    <span class="brand-mark"><i class="fa-solid fa-film"></i></span>
    <span class="brand-text"><b>迭影计划</b><small>ITER·FILM PROGRAM</small></span>
  </a>
  <nav id="main-nav" aria-label="主导航"></nav>
  <div class="top-actions" id="top-actions"></div>
  <button id="menu-btn" class="icon-btn" aria-label="菜单"><i class="fa-solid fa-bars"></i></button>
</header>
<aside id="drawer" aria-hidden="true"></aside>
<main id="app" tabindex="-1"><div class="loading-screen"><div class="reel"></div><p>正在放映…</p></div></main>
<footer id="site-footer"></footer>
<nav id="tabbar" aria-label="移动端导航"></nav>
<div id="toast" role="status" aria-live="polite"></div>
<div id="modal" role="dialog" aria-modal="true" hidden></div>
<script src="/static/schools.js"></script>
<script src="/static/app.js"></script>
<script src="/static/pages.js"></script>
<script src="/static/work.js"></script>
<script src="/static/lightyear.js"></script>
<script src="/static/program.js"></script>
<script src="/static/jinding.js"></script>
</body>
</html>`

app.get('*', (c) => c.html(shell))

export default app
