#!/usr/bin/env node
/**
 * Drip-publisher for the FoxLink blog.
 *
 * Promotes any queued post whose scheduled date has arrived:
 *   1. move  blog/_queue/<file>  ->  blog/<slug>.html
 *   2. inject its card at the top of blog/index.html
 *   3. add its <url> to sitemap.xml
 *   4. drop its entry from blog/_queue/schedule.json
 *
 * The GitHub Actions workflow runs this daily and commits+pushes if anything
 * changed (which auto-deploys the static site). Nothing due = no changes = no
 * commit. Idempotent: a promoted post is removed from the queue + manifest.
 *
 * Test locally with a forced date:  PUBLISH_TODAY=2026-08-04 node scripts/publish-due.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT    = process.cwd()
const QDIR    = path.join(ROOT, 'blog', '_queue')
const SCHED   = path.join(QDIR, 'schedule.json')
const INDEX   = path.join(ROOT, 'blog', 'index.html')
const SITEMAP = path.join(ROOT, 'sitemap.xml')

const today = process.env.PUBLISH_TODAY || new Date().toISOString().slice(0, 10)

if (!fs.existsSync(SCHED)) { console.log('No schedule.json — nothing to do.'); process.exit(0) }

const schedule = JSON.parse(fs.readFileSync(SCHED, 'utf8'))
const due = schedule
  .filter(e => e.date <= today)
  .sort((a, b) => a.date.localeCompare(b.date)) // oldest first → newest ends on top

if (due.length === 0) { console.log(`Nothing due as of ${today}.`); process.exit(0) }

let index   = fs.readFileSync(INDEX, 'utf8')
let sitemap = fs.readFileSync(SITEMAP, 'utf8')
const publishedSlugs = []

for (const e of due) {
  const src  = path.join(QDIR, e.file)
  const dest = path.join(ROOT, 'blog', `${e.slug}.html`)

  if (!fs.existsSync(src)) { console.warn(`SKIP ${e.slug}: queue file missing (${e.file})`); continue }
  if (fs.existsSync(dest)) { console.warn(`SKIP ${e.slug}: already live`); publishedSlugs.push(e.slug); continue }

  fs.renameSync(src, dest)

  const card =
`\n    <article class="article-card">
      <div class="article-card-meta">
        <span>${e.displayDate}</span>
        <span class="article-card-meta-sep">·</span>
        <span>${e.readTime}</span>
      </div>
      <h2 class="article-card-title">${e.title}</h2>
      <p class="article-card-excerpt">${e.excerpt}</p>
      <a href="/blog/${e.slug}.html" class="article-card-link">Read article →</a>
    </article>\n`
  index = index.replace('<div class="article-grid">', '<div class="article-grid">' + card)

  const url =
`  <url>
    <loc>https://foxlink.network/blog/${e.slug}.html</loc>
    <changefreq>monthly</changefreq>
    <priority>${e.priority || '0.6'}</priority>
  </url>\n`
  sitemap = sitemap.replace('</urlset>', url + '</urlset>')

  publishedSlugs.push(e.slug)
  console.log(`Published ${e.slug} (scheduled ${e.date})`)
}

fs.writeFileSync(INDEX, index)
fs.writeFileSync(SITEMAP, sitemap)

const remaining = schedule.filter(e => !publishedSlugs.includes(e.slug))
fs.writeFileSync(SCHED, JSON.stringify(remaining, null, 2) + '\n')

console.log(`Done: published ${publishedSlugs.length}, ${remaining.length} still queued.`)
