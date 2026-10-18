import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { expect, it } from 'vitest';
import articles from '../src/content/articles.json';

it('builds crawlable Arabic articles with matching canonical URLs, FAQs, internal links and sitemap entries', () => {
  execFileSync(process.execPath, ['scripts/build-library.mjs']);
  const sitemap = readFileSync('public/sitemap.xml', 'utf8');
  const index = new JSDOM(readFileSync('public/articles/index.html', 'utf8')).window.document;
  const titles = new Set<string>();
  for (const article of articles) {
    const path = `/articles/${article.slug}/`;
    const document = new JSDOM(readFileSync(`public${path}index.html`, 'utf8')).window.document;
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('h1')?.textContent).toBe(article.title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(article.description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`https://farkash.vercel.app${path}`);
    const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!)['@graph'];
    expect(graph.find((item: { '@type': string }) => item['@type'] === 'FAQPage').mainEntity).toHaveLength(article.faq.length);
    for (const faq of article.faq) expect(document.body.textContent).toContain(faq.a);
    for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) expect(document.querySelector(anchor.getAttribute('href')!)).not.toBeNull();
    expect(index.querySelector(`a[href="${path}"]`)).not.toBeNull();
    expect(sitemap).toContain(`https://farkash.vercel.app${path}`);
    expect(document.querySelector(`a[href="/?game=${article.game}"]`)).not.toBeNull();
    expect(document.querySelectorAll('.related a')).toHaveLength(articles.length - 1);
    titles.add(document.title);
  }
  expect(titles.size).toBe(4);
});
