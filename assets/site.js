(() => {
  // 英文只在使用者自己選過時才去；沒選過的人照瀏覽器語言，非中文一律留在繁中
  // （Google 爬蟲的語言是英文，這樣中文頁不會被導走）。
  const supported = ['zh-Hant', 'zh-Hans', 'en', 'ja'];
  // 該語言沒有這一頁時，改去那個語言的首頁。
  const missing = { en: ['architecture'], ja: ['model', 'guide', 'architecture', 'gemini-key', 'speech-models', 'rewrite-workflow', 'learning'] };
  const current = window.PARROTING_LOCALE;
  const named = { model: 'model', guide: 'guide', architecture: 'architecture', 'gemini-key': 'gemini-key', 'speech-models': 'speech-models', 'rewrite-workflow': 'rewrite-workflow', learning: 'learning', iphone: 'iphone/', 'iphone-guide': 'iphone/guide/', 'ai-cost': 'ai-cost/' };
  const pageId = window.PARROTING_PAGE || '';
  // Blog pages pass their own path, e.g. 'blog/mac-chinese-voice-typing/'.
  const page = named[pageId] || (pageId.startsWith('blog/') ? pageId : '');
  // Site root (…/parroting/), so pages at any depth build the same URLs.
  const root = new URL('../', (document.currentScript && document.currentScript.src) || location.href).href;
  const target = (lang) => root + (lang === 'zh-Hant' ? '' : lang + '/') + ((missing[lang] || []).includes(page) || (lang === 'ja' && page.startsWith('blog/')) ? '' : page);
  const selector = document.getElementById('language');
  let saved;
  try { saved = localStorage.getItem('parroting-language'); } catch (_) {}

  // The root pages are the default locale. A direct language URL stays where it is.
  if (current === 'zh-Hant') {
    const browser = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
    // 繁中：zh-TW／HK／MO／Hant；簡中：zh-CN／SG／Hans 和單純的 zh；其他語言先用繁中
    const preferred = supported.includes(saved) ? saved :
      /^zh-(tw|hk|mo|hant)/.test(browser) ? 'zh-Hant' :
      /^zh(?:-|$)/.test(browser) ? 'zh-Hans' : 'zh-Hant';
    if (preferred !== current) {
      location.replace(target(preferred) + location.hash);
      return;
    }
  }

  if (selector) selector.addEventListener('change', () => {
    const next = selector.value;
    if (!supported.includes(next)) return;
    try { localStorage.setItem('parroting-language', next); } catch (_) {}
    if (next === current) return;
    location.href = target(next);
  });
})();

// 瀏覽器語言和這頁不同時，頂端一條提示（不自動跳轉，John 2026-11-08；自動轉會讓
// Google 爬蟲看不到中文頁）：日文瀏覽器提示日本語版，其他非中文提示 English。
// 選過語言或按過 ✕ 就不再出現。
(() => {
  const browser = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
  if (!browser || browser.startsWith('zh')) return;
  const want = browser.startsWith('ja') ? 'ja' : 'en';
  if (window.PARROTING_LOCALE === want) return;
  const alt = document.querySelector(`link[rel="alternate"][hreflang="${want}"]`);
  if (!alt) return;
  let saved, dismissed;
  try { saved = localStorage.getItem('parroting-language'); dismissed = localStorage.getItem('parroting-' + want + '-hint') || (want === 'en' && localStorage.getItem('parroting-en-hint')); } catch (_) {}
  if (saved || dismissed) return;
  let href;
  try { href = new URL(alt.getAttribute('href'), location.href).pathname + location.hash; } catch (_) { return; }
  const words = want === 'ja'
    ? { text: 'このページは日本語でもご覧いただけます。', link: '日本語版 →', close: '閉じる' }
    : { text: 'This page is also available in English.', link: 'English version →', close: 'Dismiss' };
  const bar = document.createElement('div');
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Language');
  bar.lang = want;
  bar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:10px 48px 10px 16px;' +
    'background:#1F3A2B;color:#FFFFFF;font:600 15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:relative;z-index:1000;text-align:center';
  const text = document.createElement('span');
  text.textContent = words.text;
  const link = document.createElement('a');
  link.href = href;
  link.textContent = words.link;
  link.style.cssText = 'color:#1F3A2B;background:#FFFFFF;border-radius:999px;padding:5px 14px;text-decoration:none;font-weight:700';
  link.addEventListener('click', () => { try { localStorage.setItem('parroting-language', want); } catch (_) {} });
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', words.close);
  close.textContent = '✕';
  close.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;border-radius:50%;' +
    'background:transparent;color:#FFFFFF;font-size:16px;cursor:pointer';
  close.addEventListener('click', () => { try { localStorage.setItem('parroting-' + want + '-hint', 'off'); } catch (_) {} bar.remove(); });
  bar.append(text, link, close);
  document.body.prepend(bar);
})();

document.querySelectorAll('[data-version]').forEach(el => { el.textContent = window.PARROTING_VERSION; });
document.querySelectorAll('[data-size]').forEach(el => { el.textContent = window.PARROTING_SIZE; });

// 中文換行時，最後一行不要只剩一兩個字：把每段最後 4 個字綁在一起不拆行
// （CSS 的 text-wrap 只有較新的瀏覽器支援，這裡補上）
(() => {
  const cjk = /[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]/;
  document.querySelectorAll('h1,h2,h3,p,li,summary,.quote-text,.quote-result').forEach(el => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last = null;
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) last = walker.currentNode;
    if (!last) return;
    // 父層是 flex／grid 時，多包一層 span 會變成獨立的一格，排版會被拆開，所以略過
    if (/flex|grid/.test(getComputedStyle(last.parentNode).display)) return;
    const chars = Array.from(last.nodeValue.replace(/\s+$/, ''));
    if (chars.length < 6 || !cjk.test(chars.slice(-4).join(''))) return;
    const tail = chars.slice(-4).join('');
    const span = document.createElement('span');
    span.style.whiteSpace = 'nowrap';
    span.textContent = tail;
    last.nodeValue = chars.slice(0, -4).join('');
    last.after(span);
  });
})();
