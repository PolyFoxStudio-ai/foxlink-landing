#!/usr/bin/env node
/**
 * Authoring helper: writes the 15 drafted blog posts into blog/_queue/ and
 * regenerates blog/_queue/schedule.json. Each queued post is a complete,
 * standalone HTML page identical in structure to the live posts; the daily
 * publish-drip workflow promotes each on its scheduled date.
 *
 * Re-run any time to regenerate the queue from source. Safe: only touches
 * blog/_queue/. Posts already promoted to blog/ are not re-created here
 * (publish-due removes them from the schedule once live).
 */
import fs from 'fs'
import path from 'path'

const QDIR = path.join(process.cwd(), 'blog', '_queue')

// ---- shared page template (mirrors the live posts exactly) -----------------
const page = (p) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title} | FoxLink</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="https://foxlink.network/blog/${p.slug}.html">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="https://foxlink.network/blog/${p.slug}.html">
<meta property="og:type" content="article">
<meta property="og:site_name" content="FoxLink">
<meta property="article:published_time" content="${p.date}">
<meta property="article:author" content="Michael, Co-founder of FoxLink">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${p.title}">
<meta name="twitter:description" content="${p.desc}">
<meta property="og:image" content="https://foxlink.network/og-image.png">
<meta name="twitter:image" content="https://foxlink.network/og-image.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/assets/blog.css">
<script src="/blog/assets/attribution.js" defer></script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "headline": "${p.title}",
      "description": "${p.desc}",
      "image": "https://foxlink.network/og-image.png",
      "datePublished": "${p.date}",
      "dateModified": "${p.date}",
      "author": { "@type": "Person", "name": "Michael", "jobTitle": "Co-founder", "worksFor": { "@type": "Organization", "name": "FoxLink" } },
      "publisher": { "@type": "Organization", "name": "FoxLink", "logo": { "@type": "ImageObject", "url": "https://foxlink.network/icon-512.png" } },
      "mainEntityOfArticle": { "@type": "WebPage", "@id": "https://foxlink.network/blog/${p.slug}.html" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://foxlink.network/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://foxlink.network/blog/" },
        { "@type": "ListItem", "position": 3, "name": "${p.crumb}", "item": "https://foxlink.network/blog/${p.slug}.html" }
      ]
    }
  ]
}
</script>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="/" class="nav-logo">Fox<em>Link</em></a>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/blog/" class="active">Blog</a>
  </div>
  <a href="https://app.foxlink.network/signup" class="nav-cta">Start free trial</a>
</nav>

<!-- ARTICLE HEADER -->
<header class="article-header">
  <div class="article-header-inner">
    <h1 class="article-title">${p.title}</h1>
    <div class="article-header-meta">
      <span>${p.displayDate}</span>
      <span class="article-header-meta-sep">·</span>
      <span>~${p.readTime}</span>
    </div>
  </div>
</header>

<!-- ARTICLE BODY -->
<main>
  <div class="article-outer">
    <div class="article-body">
${p.body}
    </div><!-- /.article-body -->

    <!-- AUTHOR BLOCK -->
    <div class="author-block">
      <div class="author-avatar">M</div>
      <div class="author-info">
        <div class="author-name">Written by Michael</div>
        <div class="author-role">Co-founder of FoxLink</div>
      </div>
    </div>

    <!-- ARTICLE CTA -->
    <div class="article-cta">
      <div class="article-cta-inner">
        <div class="article-cta-title">${p.ctaTitle}</div>
        <p class="article-cta-body">${p.ctaBody}</p>
        <a href="https://app.foxlink.network" class="btn-cta">Start your free trial →</a>
        <div class="article-cta-note">No credit card · Full access · Cancel any time</div>
      </div>
    </div>

    <!-- RELATED ARTICLES -->
    <div class="related-section">
      <div class="related-heading">More from the FoxLink blog</div>
      <a href="/blog/" class="related-link">← Back to all articles</a>
    </div>

  </div><!-- /.article-outer -->
</main>

<!-- FOOTER -->
<footer>
  <a href="/" class="nav-logo">Fox<em>Link</em></a>
  <div class="footer-links">
    <a href="/">Home</a>
    <a href="/blog/">Blog</a>
    <a href="/privacy.html">Privacy Policy</a>
    <a href="/terms.html">Terms of Service</a>
    <a href="mailto:hello@foxlink.network">Contact</a>
  </div>
  <div class="footer-copy">© 2026 Polyfox Studio Ltd · Registered in England &amp; Wales</div>
</footer>

<!-- COOKIE BAR -->
<div class="cookie-bar" id="cookieBar">
  <span>This site uses only essential cookies required for it to work. No tracking or advertising cookies are used. <a href="/privacy.html">Privacy Policy</a></span>
  <button class="cookie-ok" onclick="document.getElementById('cookieBar').style.display='none';localStorage.setItem('fl_cookie_ok','1')">OK</button>
</div>

<script>
if(localStorage.getItem('fl_cookie_ok')){document.getElementById('cookieBar').style.display='none'}
</script>

</body>
</html>
`

const CTA_DEFAULT = {
  ctaTitle: 'Try FoxLink free for 30 days',
  ctaBody: 'A simple, UK-hosted CRM for small teams: pipeline, contacts, activity logging, calendar, and 6 AI tools built into the daily workflow — for £19 per seat per month. No card required.',
}

// ---- the 15 drafted posts --------------------------------------------------
const POSTS = [
  {
    slug: 'what-is-lead-scoring', date: '2026-09-08', displayDate: '8 September 2026', readTime: '6 min read', priority: '0.6',
    title: 'What Is Lead Scoring? A Plain-English Guide',
    crumb: 'What Is Lead Scoring?',
    desc: 'Lead scoring in plain English: what it is, why small teams bother, and a simple way to rank who to call first without a data-science project.',
    excerpt: 'Ranking your leads sounds like enterprise jargon. Here is what lead scoring actually is, and a simple way to start.',
    body: `
      <p>Lead scoring sounds like something only a big sales operation would need. Strip away the jargon and it is far simpler than it sounds: it is just a way of answering the question every small team asks every morning — <em>who do I call first?</em></p>

      <h2>What lead scoring actually means</h2>
      <p>A lead score is a number that estimates how likely a contact is to become a customer, and how soon. Instead of working your list top to bottom or by whoever shouted loudest, you put your attention where it is most likely to pay off. That is the whole idea.</p>
      <p>Scores usually run on a small scale — at FoxLink it is 1 to 10 — where a higher number means a warmer, more sales-ready lead. The exact scale matters less than using it consistently.</p>

      <h2>Why a small team should care</h2>
      <p>When you have five hundred contacts and two hours a day to sell, the cost of guessing is high. Chase the wrong ten people and you have lost a morning. Lead scoring is really just a way of making that triage deliberate instead of accidental.</p>
      <ul>
        <li>It stops warm leads going cold while you are busy with tyre-kickers.</li>
        <li>It makes handovers sane — anyone can see who matters without a briefing.</li>
        <li>It turns a gut feeling into something you can review and improve.</li>
      </ul>

      <h2>What goes into a score</h2>
      <p>Two kinds of signal. <strong>Who they are</strong> (fit): the right industry, size, role, or location for what you sell. And <strong>what they have done</strong> (behaviour): opened your quote, replied, booked a call, visited pricing twice. A lead that is both a good fit and actively engaged is your ten. A poor fit who has gone quiet is a one.</p>

      <div class="callout">
        <p><strong>Start embarrassingly simple.</strong> Give every lead a score out of ten based on two things: how well they fit your ideal customer, and how recently they engaged. You can refine it later — the value is in ranking at all, not in a perfect formula.</p>
      </div>

      <h2>Manual or automatic?</h2>
      <p>You can score by hand — a quick judgement as you add each contact — and for a small list that is completely fine. The catch is that hand scores go stale: a hot lead from three weeks ago is not hot any more. This is where a CRM helps, by keeping the score in front of you next to the <a href="/blog/sales-pipeline-stages.html">pipeline stage</a> and nudging it as activity changes. Some tools, FoxLink included, will suggest a score automatically from the signals it can see, so it never drifts out of date.</p>

      <h2>The honest caveat</h2>
      <p>A score is a prompt, not a verdict. It tells you where to look first; it does not tell you to ignore everyone else. Used well, lead scoring simply means the warm ones stop slipping through the cracks. If you want the next layer, our guide to <a href="/blog/best-crm-for-small-sales-teams.html">choosing a CRM for a small sales team</a> covers how scoring fits alongside the rest of your day.</p>
    `,
  },
  {
    slug: 'spreadsheet-vs-crm', date: '2026-09-15', displayDate: '15 September 2026', readTime: '6 min read', priority: '0.6',
    title: 'Spreadsheet vs CRM: When to Make the Switch',
    crumb: 'Spreadsheet vs CRM',
    desc: 'A spreadsheet is a fine first CRM — until it is not. The honest signs you have outgrown the sheet, and what a CRM adds that cells cannot.',
    excerpt: 'A spreadsheet is a perfectly good first CRM. Here are the honest signs you have outgrown it.',
    body: `
      <p>Let us start with something most CRM companies will not tell you: a spreadsheet is a perfectly good place to start. If you have a few dozen contacts and one person selling, a well-kept sheet beats an empty CRM you never open. The question is not whether spreadsheets are bad. It is when they start costing you more than they save.</p>

      <h2>What a spreadsheet does well</h2>
      <p>It is free, instant, and infinitely flexible. Everyone knows how to use one. For a simple list of names, numbers and a status column, it is hard to beat. Do not let anyone shame you off a sheet that is working.</p>

      <h2>The signs you have outgrown it</h2>
      <p>Spreadsheets fail quietly. Nothing breaks — things just start slipping. Watch for these:</p>
      <ul>
        <li><strong>Follow-ups get missed.</strong> A cell cannot tap you on the shoulder. Deals go cold because nothing reminded you to chase.</li>
        <li><strong>You are not sure which version is real.</strong> Two people editing, a copy on someone's laptop, a row deleted by accident.</li>
        <li><strong>History disappears.</strong> You can see a contact's status, but not what was said, when, or what is next.</li>
        <li><strong>Reporting is a manual chore.</strong> Working out how many deals are open, or what is likely to close, means an afternoon of formulas.</li>
      </ul>

      <div class="callout">
        <p><strong>The tipping point.</strong> You have outgrown the sheet the first time a real opportunity slips because nobody was reminded to follow up. That missed deal usually costs more than a year of CRM.</p>
      </div>

      <h2>What a CRM adds that cells cannot</h2>
      <p>A CRM is a spreadsheet that remembers and reminds. It keeps every call, email and note attached to the contact, tells you who to chase today, and shows your <a href="/blog/sales-pipeline-stages.html">pipeline</a> as something you can actually manage rather than a colour-coded status column. It is shared, so there is one source of truth, and it turns your data into a forecast without the formulas.</p>

      <h2>Switching is smaller than you fear</h2>
      <p>The thing that keeps people on a sheet is dread of migration. In reality your spreadsheet <em>is</em> the migration: export to CSV, import it, and you are most of the way there in an afternoon. A simple, <a href="/blog/uk-small-business-crm.html">UK-hosted CRM built for small businesses</a> is designed for exactly this move — not a six-week rollout. If you are weighing options, our <a href="/blog/best-crm-for-small-sales-teams.html">guide to choosing one</a> is a good next read.</p>

      <p>Stay on the sheet as long as it genuinely serves you. Just do not let loyalty to a spreadsheet quietly cost you the deals it was meant to protect.</p>
    `,
  },
  {
    slug: 'how-to-manage-a-sales-pipeline', date: '2026-09-22', displayDate: '22 September 2026', readTime: '6 min read', priority: '0.6',
    title: 'How to Manage a Sales Pipeline Without a Full-Time Admin',
    crumb: 'Managing a Sales Pipeline',
    desc: 'A practical, low-effort routine for keeping a sales pipeline healthy when nobody has time to babysit it. Fewer stages, one weekly habit.',
    excerpt: 'You do not need an ops team to keep a pipeline healthy — you need fewer stages and one weekly habit.',
    body: `
      <p>Most advice on managing a pipeline assumes you have someone whose job is to manage the pipeline. Small teams do not. The good news is that a healthy pipeline needs less maintenance than you think — it needs the right shape and one small habit, not a full-time admin.</p>

      <h2>Keep the stages few</h2>
      <p>The most common mistake is too many stages. Seven finely-graded steps feel thorough and become a chore nobody keeps current. Aim for four or five that map to real decisions: something like <strong>New → Qualified → Proposal → Negotiation → Won/Lost</strong>. If you cannot say what has to be true for a deal to move into a stage, that stage does not earn its place. Our <a href="/blog/sales-pipeline-stages.html">guide to pipeline stages</a> goes deeper on defining them.</p>

      <h2>One rule: every deal has a next step</h2>
      <p>A pipeline rots when deals sit in a stage with nothing scheduled. The single discipline that keeps it alive: <strong>no open deal without a next action and a date</strong>. Logged a call? Book the follow-up before you close the tab. This one habit does more for close rates than any amount of reporting.</p>

      <div class="callout">
        <p><strong>The 15-minute Friday review.</strong> Once a week, scan the board top to bottom and ask three questions of each deal: Is it still real? What is the next step? Is that step booked? Anything that fails becomes a two-minute fix. That is the entire system.</p>
      </div>

      <h2>Be honest about dead deals</h2>
      <p>A pipeline full of stalled deals lies to you — it looks busy while your real forecast is half of what the numbers say. If a deal has had no movement in a month and no scheduled step, mark it lost or park it. A smaller, truthful pipeline is worth more than a bloated hopeful one.</p>

      <h2>Let the tool do the chasing</h2>
      <p>The reason this feels like admin is usually that the tool is not helping. A CRM built for small teams keeps the next step in front of you, reminds you when it is due, and surfaces the deals going quiet — so the Friday review becomes a glance, not a reconstruction. If your current setup makes you dig for that, see how a <a href="/blog/simple-crm-small-sales-teams.html">simpler CRM</a> handles it, and how <a href="/blog/how-to-log-sales-calls.html">logging calls</a> keeps each deal's history intact without extra effort.</p>

      <p>Managing a pipeline without an admin is not about working harder. It is about fewer stages, one firm rule, and a fifteen-minute weekly habit the tool mostly does for you.</p>
    `,
  },
  {
    slug: 'sales-follow-up-email-templates', date: '2026-09-29', displayDate: '29 September 2026', readTime: '7 min read', priority: '0.6',
    title: '7 Follow-Up Email Templates for After a Sales Call',
    crumb: 'Follow-Up Email Templates',
    desc: 'Seven short, copy-and-paste follow-up email templates for after a sales call — recap, proposal, no-show, gone quiet, and the polite break-up.',
    excerpt: 'The deal is usually won or lost in the follow-up, not the call. Seven templates you can copy and send.',
    body: `
      <p>Most deals are not won on the call. They are won — or quietly lost — in the follow-up afterwards. Yet the follow-up is the bit everyone rushes, sends late, or forgets entirely. Here are seven short templates you can adapt in under a minute. Keep them human; nobody replies to a wall of corporate text.</p>

      <h2>1. The same-day recap</h2>
      <p>Send within an hour while it is fresh. <em>"Hi [Name], great speaking today. To recap: you are looking to [goal], and the main thing to solve is [pain]. I will [next step] by [date]. Anything I have missed?"</em> This one email does more for trust than any brochure.</p>

      <h2>2. The proposal send</h2>
      <p><em>"Hi [Name], as promised, here is the proposal for [scope]. The key points are on page one. Happy to walk through it — are you free [two specific times]?"</em> Always offer times; never end with a vague "let me know".</p>

      <h2>3. The gentle nudge (no reply)</h2>
      <p><em>"Hi [Name], just floating this back to the top of your inbox in case it slipped. No rush — is this still something you want to move on this month?"</em> Short, no guilt, gives them an easy out that often prompts a real answer.</p>

      <h2>4. The no-show</h2>
      <p><em>"Hi [Name], sorry we missed each other today — diaries happen. Here is my calendar to grab a new time whenever suits: [link]."</em> Assume good faith. Never scold a prospect.</p>

      <h2>5. The gone-quiet check-in</h2>
      <p><em>"Hi [Name], I know priorities shift. Should I keep this on your radar for later, or is now not the right time?"</em> Permission to say "later" gets you an honest reply instead of silence.</p>

      <div class="callout">
        <p><strong>Templates save typing, not thinking.</strong> Change at least one line to reference something specific to them. A follow-up that could have been sent to anyone reads like it was.</p>
      </div>

      <h2>6. The value add</h2>
      <p><em>"Hi [Name], saw this and thought of your point about [topic] — [link/one line]. No agenda, just useful."</em> A no-ask touch keeps you present without nagging.</p>

      <h2>7. The polite break-up</h2>
      <p><em>"Hi [Name], I have not heard back so I will assume the timing is not right and stop chasing. If that changes, you know where I am — the door is open."</em> Counter-intuitively, this often gets the reply five nudges could not.</p>

      <h2>The real trick: never rely on memory</h2>
      <p>Templates only work if the follow-up actually happens. The teams who win are not better writers — they just never let a follow-up fall through, because the next step is logged against the deal with a date. That is exactly what <a href="/blog/how-to-log-sales-calls.html">logging your calls properly</a> and a CRM that reminds you are for.</p>
    `,
  },
  {
    slug: 'daily-sales-routine', date: '2026-10-06', displayDate: '6 October 2026', readTime: '5 min read', priority: '0.6',
    title: 'Building a Simple Daily Sales Routine',
    crumb: 'A Daily Sales Routine',
    desc: 'A 15-minute daily sales routine for busy small teams: what to check each morning so nothing slips, without turning selling into admin.',
    excerpt: 'Consistency beats intensity. A 15-minute morning routine that keeps deals moving without the admin.',
    body: `
      <p>Selling for a small business rarely fails because of one big mistake. It fails through drift — a follow-up missed here, a quote not chased there, until a good month quietly becomes a thin one. The antidote is not working longer. It is a short, repeatable routine that catches the drift before it costs you.</p>

      <h2>The 15-minute morning check</h2>
      <p>Before the day pulls you elsewhere, spend fifteen minutes doing the same three things in the same order:</p>
      <ul>
        <li><strong>Today's follow-ups (5 min).</strong> What did you promise to do today, and for whom? Do the quick ones now; book the rest.</li>
        <li><strong>Warm deals (5 min).</strong> Look at the top of your <a href="/blog/sales-pipeline-stages.html">pipeline</a> — the deals most likely to close. Does each have a next step booked? If not, that is your first job.</li>
        <li><strong>Gone quiet (5 min).</strong> Anyone slipped off the radar? One nudge is enough to keep a deal alive.</li>
      </ul>

      <div class="callout">
        <p><strong>Same time, same order.</strong> A routine only works if it is automatic. Attach it to something you already do daily — the first coffee, before email — so you never have to decide whether to do it.</p>
      </div>

      <h2>Protect the routine from the inbox</h2>
      <p>The enemy of the morning check is the inbox, which is a list of other people's priorities. Do your fifteen minutes <em>before</em> you open email. Otherwise you spend the day reacting and never touch the deals that actually pay.</p>

      <h2>Let the tool tee it up</h2>
      <p>The routine is far easier when you are not the one remembering. A CRM that opens on a short daily brief — today's follow-ups, the warm deals, who has gone quiet — turns fifteen minutes of hunting into fifteen minutes of doing. FoxLink builds this into the daily workflow on purpose, so the routine is a glance rather than a reconstruction. Pair it with the habit of <a href="/blog/how-to-log-sales-calls.html">logging each call</a> and the next morning's list writes itself.</p>

      <p>Intensity is easy to fake for a week. Consistency is what compounds. Fifteen honest minutes a day will out-sell a heroic Friday scramble every time.</p>
    `,
  },
  {
    slug: 'ai-in-crm', date: '2026-10-13', displayDate: '13 October 2026', readTime: '7 min read', priority: '0.7',
    title: 'AI in CRM: Hype vs the 6 Features That Save Real Time',
    crumb: 'AI in CRM',
    desc: 'Most AI-in-CRM talk is hype. The six AI features that genuinely save a small sales team time — and the ones safe to ignore.',
    excerpt: 'Every CRM claims AI now. Here are the six features that actually save time, and the ones that are noise.',
    body: `
      <p>Every CRM has bolted the word "AI" onto its homepage. Most of it is noise. But underneath the marketing there are a handful of AI features that genuinely give a small team time back — and it is worth knowing which, so you can ignore the rest with a clear conscience.</p>

      <h2>The test: does it save a real minute?</h2>
      <p>A useful AI feature removes a chore you actually do. If you cannot point to the task it replaces, it is a demo, not a tool. By that test, six features earn their place.</p>

      <h2>The six that pull their weight</h2>
      <ul>
        <li><strong>1. Lead scoring.</strong> Ranking who to call first from the signals in your data, kept up to date automatically. This is the big one — see <a href="/blog/what-is-lead-scoring.html">what lead scoring is</a>.</li>
        <li><strong>2. Note and call summaries.</strong> Turning a messy call note into a clean summary and action points, so the history stays useful without you writing an essay.</li>
        <li><strong>3. Drafting follow-ups.</strong> A first-draft follow-up email based on what was just discussed. You edit and send in seconds instead of staring at a blank box.</li>
        <li><strong>4. Next-best-action nudges.</strong> Surfacing the deal going quiet or the follow-up due today, so your <a href="/blog/how-to-manage-a-sales-pipeline.html">pipeline</a> does not rot.</li>
        <li><strong>5. Data tidying.</strong> Spotting duplicates and filling gaps, quietly keeping the database clean so the rest actually works.</li>
        <li><strong>6. A daily brief.</strong> One short summary each morning of what needs attention — the raw material of a <a href="/blog/daily-sales-routine.html">daily routine</a>.</li>
      </ul>

      <div class="callout">
        <p><strong>The pattern.</strong> Every feature worth having removes admin so you can spend more time actually talking to people. Anything that adds a dashboard to admire but no minutes back to your day is the hype.</p>
      </div>

      <h2>What is safe to ignore</h2>
      <p>Chatbots that answer questions you never asked, "AI insights" that restate last month's numbers, and anything that needs a data team to configure. For a small team, complexity is a cost, and AI that demands setup usually costs more attention than it returns.</p>

      <h2>The honest bit</h2>
      <p>AI in a CRM is a helper, not a salesperson. It drafts, ranks and reminds; you still decide and still build the relationship. Used that way it is genuinely useful — FoxLink builds these six into the daily workflow for exactly that reason. Judge any "AI CRM" by one question: <em>which chore does this actually take off my plate?</em> If it cannot answer, neither can the AI.</p>
    `,
  },
  {
    slug: 'ai-lead-scoring', date: '2026-10-20', displayDate: '20 October 2026', readTime: '6 min read', priority: '0.6',
    title: 'AI Lead Scoring: How It Works and When to Trust It',
    crumb: 'AI Lead Scoring',
    desc: 'How AI lead scoring works, how it differs from scoring by hand, and when to trust the number — and when to overrule it.',
    excerpt: 'AI can score your leads automatically. Here is how it works, and when to trust the number.',
    body: `
      <p>Once you understand <a href="/blog/what-is-lead-scoring.html">lead scoring</a>, the obvious next question is whether to let software do it for you. AI lead scoring promises exactly that — a score that keeps itself current so you do not have to. It is genuinely useful, as long as you know what it is doing and where its blind spots are.</p>

      <h2>How it differs from scoring by hand</h2>
      <p>A manual score is a snapshot of your judgement on the day you set it — and it goes stale the moment the lead's behaviour changes. AI scoring watches the signals continuously and adjusts: a lead who opens your proposal twice and books a call climbs; one who goes silent for a fortnight drifts down. The value is not that it is smarter than you. It is that it never forgets to update.</p>

      <h2>What it looks at</h2>
      <p>Broadly the same two things a person would — <strong>fit</strong> (does this contact look like the customers who already buy from you?) and <strong>engagement</strong> (what have they done recently?). The difference is it can weigh dozens of small signals at once and keep the picture live across your whole list.</p>

      <div class="callout">
        <p><strong>It ranks, it does not decide.</strong> Treat the score as a fast, always-current sort order for your day — not a verdict on a person. The best salespeople use it to choose where to look first, then bring the judgement a model cannot.</p>
      </div>

      <h2>When to trust it</h2>
      <p>Trust it most for triage: when you have more leads than hours and need a sensible order to work through. It is far better than working alphabetically or by whoever emailed last. It is also reliable at flagging the deal quietly going cold, which is easy to miss by hand.</p>

      <h2>When to overrule it</h2>
      <p>Overrule it when you know something the data does not — a warm referral it has never seen, a personal relationship, a signal from a conversation that was never logged. A model can only score what it can see, so a brand-new lead or a quiet-but-serious buyer may be underrated. Your job is to add the context it lacks.</p>

      <h2>The takeaway</h2>
      <p>AI lead scoring is a live, tireless first pass at "who first?" — not a replacement for knowing your customers. Let it handle the sorting so your attention goes to selling. FoxLink builds scoring into the workflow on a simple 1-to-10 scale for that reason; if you are choosing a tool, our <a href="/blog/best-crm-for-small-sales-teams.html">CRM guide</a> covers how it fits with everything else.</p>
    `,
  },
  {
    slug: 'hubspot-pricing-uk', date: '2026-10-27', displayDate: '27 October 2026', readTime: '7 min read', priority: '0.7',
    title: 'How Much Does HubSpot Really Cost a UK Small Business?',
    crumb: 'HubSpot Cost for UK Small Business',
    desc: 'HubSpot starts free, but the real cost for a UK small business adds up through seats and paid tiers. How to work out your true monthly bill.',
    excerpt: 'HubSpot starts free — but the real bill for a small UK team is a different number. How to work it out.',
    body: `
      <p>HubSpot's free CRM is one of the best on the market, and it is how most small businesses start. The confusion — and the bill shock — comes later, when the features you actually wanted turn out to sit above the free line. So what does HubSpot really cost a UK small business? The honest answer is: it depends entirely on what you switch on. Here is how to work out your own number rather than trust a headline price.</p>

      <h2>How the pricing is shaped</h2>
      <p>HubSpot is sold as tiers — a free plan, then Starter, Professional and Enterprise — across separate "hubs" (Marketing, Sales, Service and more). Two things drive your bill: <strong>the tier</strong> you need for a given feature, and <strong>the number of paid seats</strong>. The free CRM stays free; the automation, sequences and reporting most teams eventually want live in the paid tiers. Always check HubSpot's own pricing page for current figures — they change, and vary by hub and contract.</p>

      <h2>Where the cost creeps in</h2>
      <ul>
        <li><strong>Feature gates.</strong> The one feature you need is often a whole tier up, so you pay for a band of things you will not use to unlock the one you will.</li>
        <li><strong>Per-seat scaling.</strong> A price that looks fine for one becomes a real monthly line once the whole team needs paid access.</li>
        <li><strong>Contact tiers.</strong> On the marketing side, cost can step up with the size of your contact list.</li>
        <li><strong>Annual commitment.</strong> The best rates usually assume you pay up front for the year.</li>
      </ul>

      <div class="callout">
        <p><strong>Do the real sum.</strong> Take the tier that contains the feature you actually need, multiply by the number of people who need a paid seat, and assume the annual commitment. That number — not the free plan, not the per-seat teaser — is what HubSpot costs you.</p>
      </div>

      <h2>The question underneath the price</h2>
      <p>Cost is really a proxy for fit. If you will genuinely use HubSpot's marketing automation, service desk and reporting, the price buys a lot. If you mostly want to track contacts and deals and never miss a follow-up, you are paying platform prices for CRM work. That is the mismatch we cover in <a href="/blog/hubspot-alternatives-small-teams.html">HubSpot alternatives for small teams</a>.</p>

      <h2>The simpler-tool comparison</h2>
      <p>It is worth pricing the alternative honestly too. A focused CRM like <a href="https://foxlink.network">FoxLink</a> is £19 per seat per month, UK-hosted, with the pipeline, contacts, activity logging, calendar and six AI features included rather than gated — and a 30-day trial to test it against your actual workflow. For many small UK teams the deciding factor is not the sticker price but how much of what they pay for they will actually touch. Our guide to <a href="/blog/affordable-crm-small-business.html">what an affordable CRM gets you</a> breaks that down.</p>
    `,
  },
  {
    slug: 'free-crm-uk', date: '2026-11-03', displayDate: '3 November 2026', readTime: '6 min read', priority: '0.6',
    title: 'Is There a Truly Free CRM for UK Small Business?',
    crumb: 'Free CRM for UK Small Business',
    desc: 'Free CRMs are real, but free comes with limits. When a free plan is genuinely enough for a UK small business, and when it quietly costs more.',
    excerpt: 'Free CRMs are real — but free has limits. When it is genuinely enough, and when it quietly costs you.',
    body: `
      <p>Yes — genuinely free CRMs exist, and several are good. The honest question is not "is it free?" but "is it free for what I actually need?" Because free plans are a doorway, and the doorway is designed to lead somewhere paid. Here is how to tell when free is genuinely enough, and when it will cost you in ways that do not show on an invoice.</p>

      <h2>When a free CRM is the right call</h2>
      <p>If you are one or two people with a modest contact list and simple needs — store contacts, track a handful of deals, log the odd note — a free plan can be all you need for a long time. Do not pay for software to look serious. A free CRM you actually use beats a paid one you resent.</p>

      <h2>Where "free" quietly costs you</h2>
      <ul>
        <li><strong>Caps that arrive fast.</strong> Limits on contacts, users, or emails per month that you hit just as things start working.</li>
        <li><strong>The useful bit is paid.</strong> Automation, reminders, reporting and integrations — often the reason you wanted a CRM — sit behind the upgrade.</li>
        <li><strong>Your data as the price.</strong> With some free consumer tools, the business model is the data. For a UK business handling customer information, that is worth reading the small print on — see our note on <a href="/blog/uk-small-business-crm.html">UK small-business CRMs</a>.</li>
        <li><strong>Friction by design.</strong> Branding on your emails, or a nag to upgrade, that gently makes free uncomfortable.</li>
      </ul>

      <div class="callout">
        <p><strong>The real comparison.</strong> Do not weigh free against paid. Weigh "free plus the paid add-ons I will actually need" against a simple flat price. Free often wins for a solo start and loses the moment a small team needs the grown-up features.</p>
      </div>

      <h2>Free trial vs free forever</h2>
      <p>Worth separating two things. A <strong>free trial</strong> lets you test the full product before paying — the honest way to see if a tool fits. A <strong>free tier</strong> is a permanently limited version. Both are fine; just know which you are signing up for. FoxLink, for the record, is not a free-forever tool — it is £19 per seat with a full 30-day trial, on the view that a fair flat price beats a free plan that pushes you to upgrade the week it starts working.</p>

      <h2>The bottom line</h2>
      <p>There is no shame in starting free, and for a true solo operation it may be all you ever need. Just cost it honestly: if the features that make a CRM worth having are the ones behind the paywall, "free" was the trial all along.</p>
    `,
  },
  {
    slug: 'uk-hosted-crm', date: '2026-11-10', displayDate: '10 November 2026', readTime: '6 min read', priority: '0.6',
    title: 'UK-Hosted CRM: Where Your Customer Data Actually Lives',
    crumb: 'UK-Hosted CRM',
    desc: 'Why data residency matters for a UK business, what UK-hosted really means, and the questions to ask any CRM vendor about where your data lives.',
    excerpt: 'Where does your customer data actually live? Why UK hosting matters, and what to ask a vendor.',
    body: `
      <p>When you put your customers' names, numbers and notes into a CRM, that data has to physically live on a server somewhere. For a UK business, <em>where</em> is not a trivia question — it touches GDPR, trust, and what you can honestly tell your own customers about how their information is handled. Here is what "UK-hosted" actually means and why it is worth asking about.</p>

      <h2>Data residency, in plain terms</h2>
      <p>Data residency is simply the country your data is stored and processed in. Many big CRMs are hosted in the US or spread across global regions by default. That is not automatically wrong — the UK GDPR allows transfers with the right safeguards — but it does mean your customers' data may sit under another country's jurisdiction, which is something you are accountable for.</p>

      <h2>Why it matters for a UK business</h2>
      <ul>
        <li><strong>Accountability.</strong> Under UK GDPR you are the data controller. You should be able to say where your data is and who can access it.</li>
        <li><strong>Trust.</strong> "Your data stays in the UK" is a straightforward, reassuring answer when a client asks — increasingly, they do.</li>
        <li><strong>Simplicity.</strong> Keeping data in the UK sidesteps a layer of transfer paperwork and the questions that come with it.</li>
      </ul>

      <div class="callout">
        <p><strong>Questions to ask any CRM vendor.</strong> Where is my data stored and backed up? Is it in the UK or EU? Who can access it and under whose laws? Can I export all of it whenever I want? Good vendors answer plainly; vague answers are themselves an answer.</p>
      </div>

      <h2>Privacy is more than location</h2>
      <p>Hosting is one piece. Also worth checking: does the tool track your visitors with advertising cookies, does it sell or share data, and is exporting your own data easy or deliberately awkward? A privacy-respecting tool treats your data as yours to hold and to leave with.</p>

      <h2>Where FoxLink stands</h2>
      <p>FoxLink is UK-hosted by design, built by a UK company (Polyfox Studio Ltd), with no advertising trackers and a one-click export of your data whenever you want it. For a UK small business that would rather give a simple, honest answer about where customer data lives, that is the point. If you are weighing it up more broadly, our guide to a <a href="/blog/uk-small-business-crm.html">CRM for UK small business</a> covers the rest.</p>
    `,
  },
  {
    slug: 'crm-for-tradesmen', date: '2026-11-17', displayDate: '17 November 2026', readTime: '6 min read', priority: '0.7',
    title: 'CRM for Tradesmen: Quotes and Follow-Ups Without the Paperwork',
    crumb: 'CRM for Tradesmen',
    desc: 'A simple CRM for tradesmen — electricians, plumbers, builders — to track quotes, chase follow-ups and win repeat work without drowning in admin.',
    excerpt: 'Quotes sent and never chased are lost jobs. How a simple CRM helps trades win the work without the paperwork.',
    body: `
      <p>If you are on the tools all day, the last thing you want at 9pm is admin. But the jobs you lose are rarely lost on price — they are lost because a quote went out and never got chased, or a good customer from last year was never called back. A CRM sounds like office software you do not have time for. The right one is really just a way to stop leaving money on the table.</p>

      <h2>The trades problem in one sentence</h2>
      <p>You quote plenty, but the follow-up lives in your head, your van, and a pile of texts — so some of it slips. Every un-chased quote is a job someone else got round to first.</p>

      <h2>What a simple CRM actually does for a trade</h2>
      <ul>
        <li><strong>Tracks every quote.</strong> One list of who you quoted, for what, and whether you have followed up — so nothing sits forgotten.</li>
        <li><strong>Reminds you to chase.</strong> A nudge two days after a quote goes out. That single habit wins jobs you are currently losing to silence.</li>
        <li><strong>Remembers the customer.</strong> What you did last time, when, and what they might need next — the basis of repeat work and referrals.</li>
        <li><strong>Works from your phone.</strong> Update a job from the van or the doorstep, not back at a desk you rarely sit at.</li>
      </ul>

      <div class="callout">
        <p><strong>Keep it lighter than the job.</strong> A tradesman does not need marketing automation. You need contacts, a simple <a href="/blog/sales-pipeline-stages.html">list of jobs by stage</a>, and reminders. Anything heavier will sit unused — the tool has to be quicker than the notebook it replaces.</p>
      </div>

      <h2>What to ignore</h2>
      <p>Ignore anything that needs a training day, a subscription per feature, or a laptop to use properly. If setting it up feels like a second job, it is the wrong tool. The whole point is less admin, not more.</p>

      <h2>A CRM that fits the trade</h2>
      <p>FoxLink is built to be that lighter option: quotes and jobs in a simple pipeline, reminders so follow-ups actually happen, customer history for repeat work, and it runs on your phone — £19 a month, UK-hosted, 30-day trial. It does the chasing you are too busy to do. If you want the wider view first, start with our guide to a <a href="/blog/uk-small-business-crm.html">CRM for UK small business</a>.</p>
    `,
  },
  {
    slug: 'crm-for-recruitment-agencies', date: '2026-11-24', displayDate: '24 November 2026', readTime: '6 min read', priority: '0.7',
    title: 'CRM for Recruitment Agencies (Small UK Firms)',
    crumb: 'CRM for Recruitment Agencies',
    desc: 'A simple CRM for small UK recruitment agencies to manage candidates and clients, keep placements moving, and handle candidate data responsibly.',
    excerpt: 'Recruitment is two pipelines at once — candidates and clients. How a simple CRM keeps both moving.',
    body: `
      <p>Recruitment is a relationship business running two pipelines at once: clients with roles to fill, and candidates to place. For a small UK agency without a heavyweight applicant-tracking system, the danger is that one side gets attention while the other goes cold — a great candidate forgotten, a client not updated. A simple CRM is really about keeping both sides warm at the same time.</p>

      <h2>The two-pipeline problem</h2>
      <p>Most tools assume one pipeline. Recruitment needs two that meet in the middle: roles moving from <em>briefed</em> to <em>shortlisted</em> to <em>placed</em>, and candidates moving from <em>sourced</em> to <em>submitted</em> to <em>offer</em>. The value is seeing both, and the point where a candidate matches a live role.</p>

      <h2>What a small agency actually needs</h2>
      <ul>
        <li><strong>One record per relationship.</strong> Every conversation with a client or candidate in one place, so anyone can pick it up.</li>
        <li><strong>Follow-ups that do not slip.</strong> The candidate you promised to call back, the client awaiting a shortlist — reminders keep your reputation intact.</li>
        <li><strong>A view of live roles.</strong> A simple <a href="/blog/sales-pipeline-stages.html">pipeline</a> of open vacancies and where each stands.</li>
        <li><strong>Repeat business.</strong> Placed a candidate last year? That client and that candidate are both future work — if you remember to nurture them.</li>
      </ul>

      <div class="callout">
        <p><strong>Candidate data is personal data.</strong> You are handling CVs, contact details and work history under UK GDPR. Know where that data lives, keep it only as long as you need it, and be able to remove it on request. Our note on a <a href="/blog/uk-hosted-crm.html">UK-hosted CRM</a> covers why residency matters here.</p>
      </div>

      <h2>Keep it simpler than a full ATS</h2>
      <p>Enterprise recruitment platforms are powerful and, for a small firm, usually overkill — expensive, and heavy enough that consultants quietly go back to spreadsheets. A small agency is better served by a light CRM that keeps both pipelines and every relationship in view without a rollout.</p>

      <h2>Where FoxLink fits</h2>
      <p>FoxLink gives you flexible pipelines for both roles and candidates, one history per relationship, reminders so nothing slips, and UK hosting for the data-protection side — £19 per seat, with a 30-day trial. It will not replace a specialist ATS at scale, but for a small UK agency that just needs to stop good candidates and warm clients going cold, that is usually the point. See also our guide to a <a href="/blog/crm-for-consultants-agencies.html">CRM for consultants and agencies</a>.</p>
    `,
  },
  {
    slug: 'crm-for-accountants', date: '2026-12-01', displayDate: '1 December 2026', readTime: '6 min read', priority: '0.7',
    title: 'CRM for Accountants and Bookkeepers (UK Practices)',
    crumb: 'CRM for Accountants',
    desc: 'A simple CRM for UK accountants and bookkeepers to manage client relationships, win new work and track referrals — alongside your practice software.',
    excerpt: 'Your practice software runs the compliance. A CRM runs the relationships and the growth. Why you need both.',
    body: `
      <p>Accountants and bookkeepers already run good software — for compliance, filing, and workflow. What most small UK practices do not have is anything managing the <em>relationship</em> and <em>growth</em> side: prospective clients, referrals, and staying close to the clients you already have. That gap is exactly what a CRM fills, and it sits alongside your practice tools rather than replacing them.</p>

      <h2>Practice software and a CRM do different jobs</h2>
      <p>Your practice management system runs the work: deadlines, tasks, compliance. A CRM runs the front of the business: the enquiry that came in last week, the referral from a client, the prospect who wanted to talk again after year-end. Trying to force one to do the other is where things fall down.</p>

      <h2>What a practice gains</h2>
      <ul>
        <li><strong>New enquiries in one place.</strong> Every prospect and where they are, from first call to engagement letter — not scattered across inboxes.</li>
        <li><strong>Referrals tracked.</strong> Much of a practice's growth is word of mouth. A CRM lets you see who refers you and thank them properly.</li>
        <li><strong>Timely, human contact.</strong> A nudge to check in before year-end, or after a client's busy season — the small touches that keep clients for a decade.</li>
        <li><strong>A calmer handover.</strong> When someone is off, the relationship history is not off with them.</li>
      </ul>

      <div class="callout">
        <p><strong>Keep client data in order.</strong> You hold sensitive financial information under UK GDPR. A CRM that is <a href="/blog/uk-hosted-crm.html">UK-hosted</a>, with clear access and easy export, keeps the relationship side as tidy as your books.</p>
      </div>

      <h2>Do not over-buy</h2>
      <p>A small practice does not need a sprawling sales platform. You need contacts, a simple <a href="/blog/sales-pipeline-stages.html">pipeline</a> for enquiries, reminders, and somewhere to log conversations. Anything heavier becomes the tool nobody updates.</p>

      <h2>Where FoxLink fits</h2>
      <p>FoxLink is a light CRM for the relationship side of a practice: enquiries and referrals in a simple pipeline, reminders so no prospect or client goes quiet, and UK hosting for the compliance-minded — £19 per seat, 30-day trial. It complements your practice software rather than competing with it. Our guide to a <a href="/blog/crm-for-consultants-agencies.html">CRM for consultants and professional services</a> is a useful companion read.</p>
    `,
  },
  {
    slug: 'salesforce-alternatives-small-business', date: '2026-12-08', displayDate: '8 December 2026', readTime: '7 min read', priority: '0.7',
    title: 'Salesforce Too Much? Simpler Alternatives for Small UK Teams',
    crumb: 'Salesforce Alternatives',
    desc: 'Salesforce is built for large sales organisations. Why it often overwhelms small UK teams, and what a simpler, cheaper alternative looks like.',
    excerpt: 'Salesforce is the enterprise standard — and usually far too much for a small team. What to use instead.',
    body: `
      <p>Salesforce is the most powerful CRM on the market, and for a large sales organisation that power is the point. For a small UK team, that same power is usually the problem. If you have looked at Salesforce and felt the complexity — or the cost, or the fact that it seems to assume you have an admin to run it — you are not missing something. You are just not the customer it was built for.</p>

      <h2>Salesforce is not too good — it is too much</h2>
      <p>The breadth that makes Salesforce dominant in the enterprise is exactly what makes it heavy for a small team. Deep customisation, a vast feature set, and an ecosystem of add-ons are assets when you have people to configure and maintain them. When you do not, they become a tax on your time.</p>

      <h2>Signs it is the wrong fit for you</h2>
      <ul>
        <li>You would need to hire or pay a consultant just to set it up the way you want.</li>
        <li>Your team uses a fraction of the features but navigates all of them daily.</li>
        <li>The cost — across licences, tiers and add-ons — is hard to even predict.</li>
        <li>Simple actions take more clicks than they should, because the system is built for complex ones.</li>
      </ul>

      <div class="callout">
        <p><strong>The question that matters.</strong> Are you a large, complex sales operation that will use the platform, or a small team that needs to track contacts, deals and follow-ups well? Only the first is really the Salesforce customer. The second is paying an enterprise tax for CRM basics.</p>
      </div>

      <h2>What a simpler alternative looks like</h2>
      <p>Leaving Salesforce, small teams usually want the opposite of what they are leaving: usable in an afternoon, priced in plain terms, and only the features they will actually touch. A drag-and-drop <a href="/blog/sales-pipeline-stages.html">pipeline</a>, fast activity logging, reminders, and enough AI to save time — without the platform around it. The same logic applies whether you are leaving Salesforce or <a href="/blog/hubspot-alternatives-small-teams.html">HubSpot</a>.</p>

      <h2>Moving is easier than staying wrong</h2>
      <p>Export your contacts and open deals to CSV, import them, rebuild a simple pipeline, and run in parallel for a fortnight. For a small team that is an afternoon, not a project — far less painful than another year of working around a tool built for someone ten times your size.</p>

      <p><a href="https://foxlink.network">FoxLink</a> is built for that small team: £19 per seat per month, UK-hosted, with pipeline, contacts, activity logging, calendar and six AI features included and a 30-day trial. Not an enterprise platform — deliberately. Our <a href="/blog/best-crm-for-small-sales-teams.html">guide to choosing a CRM for a small sales team</a> is the place to start.</p>
    `,
  },
  {
    slug: 'best-crm-for-sole-traders', date: '2026-12-15', displayDate: '15 December 2026', readTime: '6 min read', priority: '0.7',
    title: 'Best CRM for Sole Traders (UK)',
    crumb: 'Best CRM for Sole Traders',
    desc: 'What a sole trader actually needs from a CRM, what to ignore, and how to pick one that saves time instead of becoming another job.',
    excerpt: 'As a sole trader you are the whole business. Here is what to look for in a CRM — and what to ignore.',
    body: `
      <p>When you are a sole trader, you are the salesperson, the delivery team and the admin department all at once. A CRM has to earn its place against the one thing you never have enough of: time. Most are built for teams and will drown you in features. The best CRM for a sole trader is the one that quietly makes sure nothing slips while you get on with the work.</p>

      <h2>What you actually need</h2>
      <ul>
        <li><strong>One place for every contact.</strong> Clients, leads and enquiries in a single list you trust — not spread across your phone, inbox and memory.</li>
        <li><strong>Reminders that chase for you.</strong> As a one-person business, the follow-up you forget is gone. The right tool remembers so you do not have to.</li>
        <li><strong>A simple view of what is on.</strong> A light <a href="/blog/sales-pipeline-stages.html">pipeline</a> of enquiries and jobs, so you know what is coming and what needs a push.</li>
        <li><strong>Speed above all.</strong> If logging a note is slower than jotting it down, you will stop doing it. It has to be quicker than the alternative.</li>
      </ul>

      <h2>What to ignore</h2>
      <p>Team permissions, marketing automation suites, complex reporting, anything sold "per feature". As a sole trader, every extra feature is extra noise. The goal is a tool that disappears into your day, not a dashboard to manage.</p>

      <div class="callout">
        <p><strong>The sole trader test.</strong> Can you add a contact, log a note and set a follow-up in under a minute, on your phone, without a manual? If yes, it will help you. If no, it will become another thing you feel guilty about not keeping up to date.</p>
      </div>

      <h2>Price it honestly</h2>
      <p>Free plans can suit a sole trader — but check the <a href="/blog/free-crm-uk.html">limits</a>, because the reminders and reporting you want are often the paid part. Weigh a free-plus-add-ons setup against one simple flat price. Our guide to an <a href="/blog/affordable-crm-small-business.html">affordable CRM</a> walks through the sums.</p>

      <h2>Where FoxLink fits</h2>
      <p>FoxLink is deliberately simple enough for one person: contacts, a light pipeline, reminders so nothing slips, and AI that saves time rather than adding steps — £19 a month, UK-hosted, on your phone, with a 30-day trial. It is designed to be quicker than the notebook, which for a sole trader is the whole game. If you want to compare more broadly, start with our <a href="/blog/best-crm-for-small-sales-teams.html">CRM guide for small teams</a>.</p>
    `,
  },
]

// ---- write the queue -------------------------------------------------------
fs.mkdirSync(QDIR, { recursive: true })
const schedule = []
for (const p of POSTS) {
  const cta = { ...CTA_DEFAULT, ...(p.cta || {}) }
  const html = page({ ...cta, ...p })
  fs.writeFileSync(path.join(QDIR, `${p.slug}.html`), html)
  schedule.push({
    date: p.date,
    file: `${p.slug}.html`,
    slug: p.slug,
    displayDate: p.displayDate,
    readTime: p.readTime,
    title: p.title,
    excerpt: p.excerpt,
    priority: p.priority || '0.6',
  })
  console.log(`  queued ${p.date}  ${p.slug}`)
}
schedule.sort((a, b) => a.date.localeCompare(b.date))
fs.writeFileSync(path.join(QDIR, 'schedule.json'), JSON.stringify(schedule, null, 2) + '\n')
console.log(`\n✅ Wrote ${POSTS.length} posts + schedule.json to blog/_queue/`)
