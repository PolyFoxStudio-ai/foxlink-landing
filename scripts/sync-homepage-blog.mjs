#!/usr/bin/env node
/**
 * Keeps the homepage "From the blog" section in sync with the newest posts.
 *
 * Reads the top N article cards from blog/index.html (which is always ordered
 * newest-first) and renders them into the marked block in index.html between
 * <!-- BLOG_TEASER_START --> and <!-- BLOG_TEASER_END -->.
 *
 * Idempotent — run it any time; no change means no diff. The drip workflow runs
 * this right after publishing a post, so the homepage updates automatically.
 */
import fs from 'fs'

const N        = 3
const BLOG     = 'blog/index.html'
const HOME     = 'index.html'

const blog = fs.readFileSync(BLOG, 'utf8')

const cards = []
const cardRe = /<article class="article-card">([\s\S]*?)<\/article>/g
let m
while ((m = cardRe.exec(blog)) && cards.length < N) {
  const b = m[1]
  const date    = (b.match(/<div class="article-card-meta">\s*<span>([^<]*)<\/span>/) || [])[1] || ''
  const title   = (b.match(/<h2 class="article-card-title">([\s\S]*?)<\/h2>/)         || [])[1]?.trim() || ''
  const excerpt = (b.match(/<p class="article-card-excerpt">([\s\S]*?)<\/p>/)         || [])[1]?.trim() || ''
  const href    = (b.match(/href="([^"]*)"/)                                          || [])[1] || '#'
  cards.push({ date, title, excerpt, href })
}

const rendered = cards.map(c =>
`      <a href="${c.href}" class="blog-teaser-card">
        <div class="blog-teaser-meta">${c.date}</div>
        <h3 class="blog-teaser-title">${c.title}</h3>
        <p class="blog-teaser-excerpt">${c.excerpt}</p>
        <span class="blog-teaser-link">Read →</span>
      </a>`).join('\n')

let home = fs.readFileSync(HOME, 'utf8')
const block = `<!-- BLOG_TEASER_START -->\n${rendered}\n      <!-- BLOG_TEASER_END -->`
const next = home.replace(/<!-- BLOG_TEASER_START -->[\s\S]*?<!-- BLOG_TEASER_END -->/, block)

if (next === home) { console.log('Homepage teaser already up to date.'); process.exit(0) }
fs.writeFileSync(HOME, next)
console.log(`Synced ${cards.length} post(s) into the homepage teaser.`)
