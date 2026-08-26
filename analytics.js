(() => {
  const measurementId = 'G-E7B2QBCHJW';
  const consentKey = 'trendy-analytics-consent';
  const language = ['es', 'ca', 'fr', 'en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'es';
  const copy = {
    es: ['Usamos cookies analíticas para entender cómo se utiliza la web y mejorar el catálogo.', 'Aceptar analítica', 'Rechazar'],
    ca: ['Utilitzem galetes analítiques per entendre com es fa servir el web i millorar el catàleg.', 'Acceptar analítica', 'Rebutjar'],
    fr: ['Nous utilisons des cookies analytiques pour comprendre l’utilisation du site et améliorer le catalogue.', 'Accepter', 'Refuser'],
    en: ['We use analytics cookies to understand website use and improve the catalogue.', 'Accept analytics', 'Reject']
  }[language];

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  let loaded = false;

  const hasConsent = () => localStorage.getItem(consentKey) === 'granted';
  const loadAnalytics = () => {
    if (loaded || !hasConsent()) return;
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      allow_google_signals: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.append(script);
  };

  const clean = value => String(value || '').trim().slice(0, 100);
  const track = (name, detail = {}) => {
    if (!hasConsent()) return;
    loadAnalytics();
    const safeDetail = Object.fromEntries(
      Object.entries(detail)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, typeof value === 'string' ? clean(value) : value])
    );
    window.gtag('event', name, {
      ...safeDetail,
      page_language: language
    });
  };

  window.TrendyAnalytics = {
    track,
    hasConsent,
    measurementId
  };

  const productReference = element => {
    const card = element?.closest?.('.product');
    return clean(
      card?.dataset?.reference ||
      card?.querySelector?.('.reference')?.textContent ||
      document.querySelector('#product-modal .modal-reference, #product-modal .reference')?.textContent
    );
  };

  let searchTimer = 0;
  document.addEventListener('input', event => {
    if (!event.target.matches('.catalog-search')) return;
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const term = clean(event.target.value);
      if (term.length >= 2) track('search', { search_term: term });
    }, 900);
  });

  document.addEventListener('submit', event => {
    if (event.target.matches('.request-form')) track('generate_lead', { lead_type: 'professional_account' });
  });

  document.addEventListener('click', event => {
    const target = event.target.closest('button, a');
    if (!target) return;

    if (target.matches('.product-image')) {
      track('view_item', { item_id: productReference(target) });
      return;
    }

    if (target.matches('.add-selected')) {
      window.setTimeout(() => {
        if (target.classList.contains('added')) {
          track('add_to_cart', { item_id: productReference(target) });
        }
      }, 0);
      return;
    }

    if (target.matches('#header-cart, #order-float')) {
      track('view_cart');
      return;
    }

    if (target.matches('#header-login')) {
      track('login_open');
      return;
    }

    if (target.matches('.send-order') && target.dataset.canSend === 'true') {
      track('begin_checkout', { checkout_method: 'whatsapp' });
      return;
    }

    const href = target.getAttribute('href') || '';
    if (/wa\.me|whatsapp/i.test(href)) {
      track('contact', { method: 'whatsapp' });
    } else if (/instagram\.com/i.test(href)) {
      track('social_click', { network: 'instagram' });
    } else if (/tiktok\.com/i.test(href)) {
      track('social_click', { network: 'tiktok' });
    } else if (target.closest('.category-nav')) {
      track('select_content', { content_type: 'category', item_id: clean(target.textContent) });
    }
  });

  const saved = localStorage.getItem(consentKey);
  if (saved === 'granted') {
    loadAnalytics();
    return;
  }
  if (saved === 'denied') return;

  const banner = document.createElement('aside');
  banner.setAttribute('aria-label', 'Analytics cookies');
  banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:auto;padding:18px 20px;background:#141414;color:#fff;box-shadow:0 10px 35px #0005;font:14px/1.5 Arial,sans-serif;display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center';
  banner.innerHTML = '<span>' + copy[0] + ' <a href="/cookies.html" style="color:#fff;text-decoration:underline">Cookies</a></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button data-consent="accept" style="padding:10px 14px;border:0;background:#fff;color:#111;font-weight:800;cursor:pointer">' + copy[1] + '</button><button data-consent="reject" style="padding:10px 14px;border:1px solid #fff;background:transparent;color:#fff;font-weight:800;cursor:pointer">' + copy[2] + '</button></span>';
  banner.addEventListener('click', event => {
    const action = event.target?.dataset?.consent;
    if (!action) return;
    localStorage.setItem(consentKey, action === 'accept' ? 'granted' : 'denied');
    if (action === 'accept') loadAnalytics();
    banner.remove();
  });
  document.body.append(banner);
})();
