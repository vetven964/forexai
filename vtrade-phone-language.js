'use strict';

// V-TRADE phone-only bilingual UI layer.
// Keeps the production terminal/MT5/Telegram logic untouched.
(function () {
  const KEY = 'vtrade-phone-language';
  const MAP = {
    'Dashboard':'ផ្ទាំងគ្រប់គ្រង','Terminal':'ស្ថានីយ','Signals':'សញ្ញា','AI Intelligence':'បញ្ញា AI','News Intelligence':'ព័ត៌មានឆ្លាតវៃ','Telegram':'Telegram','Risk Calculator':'គណនាហានិភ័យ','Trade History':'ប្រវត្តិជួញដូរ','Settings':'ការកំណត់',
    'Home':'ទំព័រដើម','Analyzer':'វិភាគ','Chart':'ក្រាប','News':'ព័ត៌មាន','Pre-Market Zone Analysis':'ការវិភាគតំបន់មុនទីផ្សារ','Analyze AI':'វិភាគដោយ AI','PRE-MARKET MTF DIRECTION STRENGTH':'កម្លាំងទិសដៅ MTF មុនទីផ្សារ','BUY Strength':'កម្លាំង BUY','SELL Strength':'កម្លាំង SELL','MTF Bias':'ទិសដៅ MTF','MT5 LIVE DATA CONNECTED':'ទិន្នន័យ MT5 ផ្ទាល់បានភ្ជាប់','AI WAIT — BUY RETEST INTO ZONE':'AI រង់ចាំ — BUY ត្រឡប់មកតំបន់','VALID EXECUTION ZONE':'តំបន់ចូលដែលមានសុពលភាព','BUY ZONE':'តំបន់ BUY','SELL ZONE':'តំបន់ SELL','Current Price':'តម្លៃបច្ចុប្បន្ន','Entry area':'តំបន់ចូល','Execution':'ការប្រតិបត្តិ','WAIT':'រង់ចាំ','Waiting for liquidity sweep':'កំពុងរង់ចាំ Liquidity Sweep','BACKEND LIVE':'Backend ដំណើរការ','MT5 LIVE':'MT5 ផ្ទាល់','BULLISH':'ទិសដៅឡើង','BEARISH':'ទិសដៅចុះ','M15':'M15','M5':'M5','H1':'H1','H4':'H4','D1':'D1'
  };
  let lang = localStorage.getItem(KEY) || 'en';
  let frameDoc = null;
  const original = new WeakMap();

  function textNodes(root) {
    const out = [];
    const walker = root.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.parentElement || ['SCRIPT','STYLE','NOSCRIPT'].includes(n.parentElement.tagName)) continue;
      out.push(n);
    }
    return out;
  }

  function translate() {
    if (!frameDoc) return;
    frameDoc.documentElement.lang = lang === 'km' ? 'km' : 'en';
    for (const node of textNodes(frameDoc)) {
      if (!original.has(node)) original.set(node, node.nodeValue);
      const originalText = original.get(node);
      const source = originalText.trim();
      if (!source) continue;
      const next = lang === 'km' ? (MAP[source] || source) : source;
      if (node.nodeValue.trim() !== next) {
        const lead = originalText.match(/^\s*/)?.[0] || '';
        const tail = originalText.match(/\s*$/)?.[0] || '';
        node.nodeValue = lead + next + tail;
      }
    }
    const btn = document.getElementById('vtradePhoneLang');
    if (btn) btn.textContent = lang === 'km' ? 'EN' : 'ខ្មែរ';
  }

  function mountButton() {
    if (document.getElementById('vtradePhoneLang')) return;
    const btn = document.createElement('button');
    btn.id = 'vtradePhoneLang';
    btn.type = 'button';
    btn.textContent = lang === 'km' ? 'EN' : 'ខ្មែរ';
    Object.assign(btn.style, { position:'fixed', top:'12px', right:'12px', zIndex:'2147483647', minWidth:'58px', height:'40px', padding:'0 12px', border:'1px solid #8050ff', borderRadius:'12px', background:'#15102d', color:'#fff', font:'800 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', boxShadow:'0 8px 24px #0008', cursor:'pointer', backdropFilter:'blur(12px)' });
    btn.addEventListener('click', () => { lang = lang === 'km' ? 'en' : 'km'; localStorage.setItem(KEY, lang); translate(); });
    document.body.appendChild(btn);
  }

  function attach() {
    const frame = document.getElementById('phoneFrame');
    if (!frame) return;
    frame.addEventListener('load', () => {
      try {
        frameDoc = frame.contentDocument;
        translate();
        const observer = new MutationObserver(() => requestAnimationFrame(translate));
        if (frameDoc.body) observer.observe(frameDoc.body, { childList:true, subtree:true, characterData:true });
      } catch (e) {
        console.warn('[V-TRADE PHONE I18N] unavailable', e);
      }
    });
    if (frame.contentDocument?.body) frameDoc = frame.contentDocument;
  }

  mountButton();
  attach();
})();
