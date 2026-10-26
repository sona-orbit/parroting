(() => {
  // 英文頁暫時隱藏（語氣模型還沒有英文版）：不列在選單，也不自動導過去
  const supported = ['zh-Hant', 'zh-Hans'];
  const current = window.PARROTING_LOCALE;
  const page = { model: 'model', guide: 'guide', architecture: 'architecture', 'gemini-key': 'gemini-key', 'speech-models': 'speech-models', 'rewrite-workflow': 'rewrite-workflow', learning: 'learning' }[window.PARROTING_PAGE] || '';
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
      location.replace(preferred + '/' + page + location.hash);
      return;
    }
  }

  if (selector) selector.addEventListener('change', () => {
    const next = selector.value;
    if (!supported.includes(next)) return;
    try { localStorage.setItem('parroting-language', next); } catch (_) {}
    if (next === current) return;
    const prefix = current === 'zh-Hant' ? '' : '../';
    location.href = prefix + (next === 'zh-Hant' ? '' : next + '/') + page;
  });
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
