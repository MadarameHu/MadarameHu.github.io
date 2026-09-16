(() => {
  'use strict';

  // The original markup is the Chinese edition. Keep one DOM and restore its
  // exact content when switching back; English copy lives in translations.js.
  const button = document.querySelector('.language-toggle');
  const translations = (window.SITE_ENGLISH || []).flatMap((entry) => {
    const elements = [...document.querySelectorAll(entry.selector)];
    if (!elements.length) console.error(`Missing translation target: ${entry.selector}`);
    return elements.map((element) => ({
      element,
      english: entry,
      chineseHTML: element.innerHTML,
      chineseAttributes: Object.fromEntries(
        Object.keys(entry.attributes || {}).map((name) => [name, element.getAttribute(name)])
      ),
    }));
  });

  const metadata = {
    en: {
      title: 'Spike Hu | LLM Algorithm Engineer',
      description: 'Spike Hu, LLM algorithm engineer focused on post-training, agentic reinforcement learning, data and environment infrastructure, and RSI.',
    },
    zh: {
      title: 'Spike Hu｜大模型算法工程师',
      description: 'Spike Hu，大模型算法工程师。聚焦 Post Training、Agentic RL、Data&Env Infra 与 RSI。',
    },
  };

  let language = 'en';
  const requestedLanguage = () => new URL(window.location.href).searchParams.get('lang') === 'zh' ? 'zh' : 'en';

  function showLanguage(next) {
    language = next;
    translations.forEach(({ element, english, chineseHTML, chineseAttributes }) => {
      if (typeof english.html === 'string') element.innerHTML = next === 'en' ? english.html : chineseHTML;
      Object.entries(english.attributes || {}).forEach(([name, value]) => {
        const translated = next === 'en' ? value : chineseAttributes[name];
        if (translated === null) element.removeAttribute(name);
        else element.setAttribute(name, translated);
      });
    });
    document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
    document.title = metadata[next].title;
    document.querySelector('meta[name="description"]').content = metadata[next].description;
    document.querySelector('meta[property="og:title"]').content = metadata[next].title;
    document.querySelector('meta[property="og:description"]').content = metadata[next].description;
    button.textContent = next === 'en' ? '中文' : 'English';
    button.lang = next === 'en' ? 'zh-CN' : 'en';
    button.setAttribute('aria-label', next === 'en' ? 'Switch to Chinese' : '切换为英文');
  }

  button.addEventListener('click', () => {
    const next = language === 'en' ? 'zh' : 'en';
    const url = new URL(window.location.href);
    if (next === 'zh') url.searchParams.set('lang', 'zh');
    else url.searchParams.delete('lang');
    // Keep anchor links and make a shared Chinese URL open in Chinese.
    try {
      window.history.pushState(null, '', url);
      showLanguage(next);
      updateCurrentSection();
    } catch {
      window.location.assign(url.href);
    }
  });

  window.addEventListener('popstate', () => {
    showLanguage(requestedLanguage());
    updateCurrentSection();
  });
  showLanguage(requestedLanguage());

  // Highlight the resume section currently being read in both navigation lists.
  const sections = [...document.querySelectorAll('main > .resume-section')];
  const sectionLinks = [...document.querySelectorAll('.rail-nav a, .nav-links a[href^="#"]')];
  function updateCurrentSection() {
    const readingLine = Math.min(window.innerHeight * 0.35, 240);
    const current = sections.filter((section) => section.getBoundingClientRect().top <= readingLine).pop();
    sectionLinks.forEach((link) => {
      if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', updateCurrentSection, { passive: true });
  window.addEventListener('resize', updateCurrentSection, { passive: true });
  updateCurrentSection();
})();
