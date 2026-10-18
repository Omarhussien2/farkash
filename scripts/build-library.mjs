import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const articles = JSON.parse(await readFile(new URL('src/content/articles.json', root), 'utf8'));
const origin = 'https://farkash.vercel.app';
const published = '2026-10-18';
const image = `${origin}/images/Gemini_Generated_Image_6cwwmb6cwwmb6cww.jpg`;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const href = (article) => `/articles/${article.slug}/`;
const link = (article) => `<a class="reading-card" href="${href(article)}"><small>${escape(article.category)}</small><h2>${escape(article.title)}</h2><p>${escape(article.description)}</p><span>اقرأ الدليل ←</span></a>`;

function page({ title, description, path, body, schema, type = 'website' }) {
  return `<!doctype html>
<html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${escape(title)} | مكتبة فركش</title><meta name="description" content="${escape(description)}">
<link rel="canonical" href="${origin}${path}"><meta name="theme-color" content="#fffaf0">
<meta property="og:locale" content="ar_EG"><meta property="og:type" content="${type}"><meta property="og:site_name" content="فركش">
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${origin}${path}"><meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}">
<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/styles/library.css">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
</head><body><a class="skip" href="#content">تخطى للمحتوى</a>
<header class="site-header"><a class="wordmark" href="/"><img src="/favicon.svg" width="42" height="42" alt="">فركش <small>FARKASH</small></a><nav aria-label="التنقل الرئيسي"><a href="/">الألعاب</a><a href="/articles/">مكتبة أولياء الأمور</a><a href="/?view=report">تقرير اللعب</a></nav></header>
<main id="content">${body}</main><footer><a href="/">فركش · نلعب. نركز. نكبر.</a><p>محتوى تربوي عام، وليس تشخيصًا أو خطة علاج. المصادر للقراءة ولا تعني اعتمادها للتطبيق.</p><a href="/articles/">كل أدلة أولياء الأمور</a></footer></body></html>`;
}

await mkdir(new URL('public/articles/', root), { recursive: true });
for (const article of articles) {
  if (!/^[a-z0-9-]+$/.test(article.slug)) throw new Error('Invalid article slug');
  const path = href(article);
  const sections = article.sections.map((section, index) => `<section id="section-${index + 1}"><h2>${escape(section.title)}</h2>${(section.paragraphs ?? []).map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}${section.steps ? `<ol>${section.steps.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>` : ''}</section>`).join('');
  const faq = article.faq.map((item) => `<details><summary>${escape(item.q)}</summary><p>${escape(item.a)}</p></details>`).join('');
  const body = `<nav class="breadcrumbs" aria-label="مسار الصفحة"><a href="/">الرئيسية</a> / <a href="/articles/">مكتبة أولياء الأمور</a> / ${escape(article.category)}</nav>
<article><header class="article-heading"><span class="eyebrow">${escape(article.category)}</span><h1>${escape(article.title)}</h1><p class="byline">إعداد: مكتبة فركش · <time datetime="${published}">١٨ أكتوبر ٢٠٢٦</time> · دليل تربوي لأولياء الأمور</p><p class="lead">${escape(article.intro)}</p><div class="topics" aria-label="موضوعات الدليل">${article.keywords.map((keyword) => `<span>${escape(keyword)}</span>`).join('')}</div></header>
<nav class="toc" aria-label="محتويات المقال"><h2>في هذا الدليل</h2><ol>${article.sections.map((section, index) => `<li><a href="#section-${index + 1}">${escape(section.title)}</a></li>`).join('')}<li><a href="#questions">أسئلة أولياء الأمور</a></li></ol></nav>
<div class="article-body">${sections}<section class="game-cta"><span class="eyebrow">نجرّب معًا في فركش</span><h2>${escape(article.gameName)}</h2><p>شارك طفلك فهم القاعدة، وشجّع المحاولة، ثم جرّبوا فكرة مشابهة بعيدًا عن الشاشة. أداة للعب المشترك؛ لا تعني نتيجة اللعبة تقييمًا لنمو الطفل.</p><a class="button" href="/?game=${article.game}">افتح اللعبة</a><a class="text-link" href="/?view=report">تابع محاولات اللعب</a></section>
<section id="questions"><h2>أسئلة شائعة من أولياء الأمور</h2>${faq}</section><section class="sources"><h2>مصادر للقراءة والتوسع</h2><p>بُنيت الخلفية العامة على المصادر التالية، والأنشطة التطبيقية اقتراحات للعب المشترك قابلة للتعديل. بعض إرشادات المصادر مخصصة لأعمار محددة؛ راجع الفئة العمرية داخل كل مصدر.</p><ul>${article.sources.map((source) => `<li><a href="${escape(source.url)}" rel="noopener">${escape(source.label)}</a></li>`).join('')}</ul><p class="byline">اطّلعنا على المصادر في ١٨ أكتوبر ٢٠٢٦. المحتوى لا يغني عن نصيحة مختص عند وجود قلق مستمر بشأن سلوك الطفل أو صحته.</p></section></div></article>
<aside class="related" aria-labelledby="related-heading"><h2 id="related-heading">اقرأ أيضًا</h2><div class="reading-grid">${articles.filter((other) => other.slug !== article.slug).map(link).join('')}</div></aside>`;
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': `${origin}${path}#article`, headline: article.title, description: article.description, inLanguage: 'ar', datePublished: published, dateModified: published, image, mainEntityOfPage: `${origin}${path}`, author: { '@type': 'Organization', name: 'مكتبة فركش', url: `${origin}/articles/` }, publisher: { '@type': 'Organization', name: 'فركش', url: origin }, keywords: article.keywords.join(', '), citation: article.sources.map((source) => source.url) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'الرئيسية', item: origin }, { '@type': 'ListItem', position: 2, name: 'مكتبة أولياء الأمور', item: `${origin}/articles/` }, { '@type': 'ListItem', position: 3, name: article.title, item: `${origin}${path}` }] },
    { '@type': 'FAQPage', mainEntity: article.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) },
  ] };
  await mkdir(new URL(`public${path}`, root), { recursive: true });
  await writeFile(new URL(`public${path}index.html`, root), page({ title: article.title, description: article.description, path, body, schema, type: 'article' }));
}
await writeFile(new URL('public/articles/index.html', root), page({ title: 'أدلة اللعب والسلوك لأولياء الأمور', description: 'مكتبة عربية عن العصبية والاندفاع والصبر والتركيز عند الأطفال، مع أفكار لعب مشترك وخطوات عملية وأسئلة شائعة ومصادر موثوقة.', path: '/articles/', body: `<section class="library-hero"><div><span class="eyebrow">معًا نفهم، ومعًا نلعب</span><h1>مساحة لأسئلة أولياء الأمور</h1><p class="lead">هل طفلي عصبي؟ كيف أساعده ينتظر دوره؟ هنا أدلة عملية تقرّب الفكرة، وتقترح لعبًا تشاركون فيه، وتساعدك تلاحظ محاولاته بهدوء.</p><p>٤ أدلة عربية · أفكار داخل الشاشة وخارجها · مصادر للقراءة</p></div><img src="/images/Gemini_Generated_Image_6cwwmb6cwwmb6cww.jpg" width="2752" height="1536" alt="شخصيات ألعاب فركش الملونة"></section><div class="reading-grid">${articles.map(link).join('')}</div><section class="game-cta"><h2>من القراءة إلى وقت لطيف مع طفلك</h2><p>اختاروا لعبة، اتفقوا على قاعدة، وشجّعوا المحاولة. تقرير اللعب يساعدك تتابع ما سُجّل على جهازك وتفهم التغير داخل كل لعبة.</p><a class="button" href="/">اكتشف الألعاب الست</a><a class="text-link" href="/?view=report">افتح تقرير اللعب</a></section>`, schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'مكتبة أولياء الأمور — فركش', url: `${origin}/articles/`, inLanguage: 'ar', hasPart: articles.map((article) => ({ '@type': 'Article', headline: article.title, url: `${origin}${href(article)}` })) } }));
const paths = ['/', '/articles/', ...articles.map(href)];
await writeFile(new URL('public/sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>\n`);
await writeFile(new URL('public/robots.txt', root), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
