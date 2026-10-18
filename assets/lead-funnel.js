(() => {
  if (!document.head.querySelector('link[href*="lead-funnel.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/lead-funnel.css?v=20261018b';
    document.head.append(stylesheet);
  }
  const lang = ['es', 'ca', 'en', 'fr'].includes(document.documentElement.lang)
    ? document.documentElement.lang : 'es';
  const copy = {
    es: { info: 'Información para tiendas', access: 'Solicitar acceso profesional', wa: 'WhatsApp', message: 'Hola Trendy Bag, tengo una tienda y quiero recibir información del catálogo profesional.', page: '/es/profesionales/' },
    ca: { info: 'Informació per a botigues', access: 'Sol·licitar accés professional', wa: 'WhatsApp', message: 'Hola Trendy Bag, tinc una botiga i vull rebre informació del catàleg professional.', page: '/ca/professionals/' },
    en: { info: 'Information for retailers', access: 'Request trade access', wa: 'WhatsApp', message: 'Hello Trendy Bag, I am a retailer and would like information about the trade catalogue.', page: '/en/professionals/' },
    fr: { info: 'Informations pour boutiques', access: 'Demander un accès professionnel', wa: 'WhatsApp', message: 'Bonjour Trendy Bag, je suis détaillant et je souhaite recevoir des informations sur le catalogue professionnel.', page: '/fr/professionnels/' }
  }[lang];

  const track = (name, detail = {}) => window.TrendyAnalytics?.track?.(name, detail);
  const openAccess = () => {
    const login = document.querySelector('#header-login');
    if (!login) {
      location.href = copy.page;
      return;
    }
    login.click();
    window.setTimeout(() => {
      const request = document.querySelector('#login-modal .request-access');
      if (request) request.open = true;
      request?.querySelector('input')?.focus();
    }, 80);
    track('lead_start', { lead_type: 'professional_access', placement: 'lead_dock' });
  };

  const dock = document.createElement('aside');
  dock.className = 'lead-dock';
  dock.setAttribute('aria-label', copy.info);
  dock.innerHTML = `<a class="lead-dock-info" href="${copy.page}">${copy.info}</a><button class="lead-dock-access" type="button">${copy.access}</button><a class="lead-dock-wa" href="https://wa.me/34688124938?text=${encodeURIComponent(copy.message)}" target="_blank" rel="noopener" aria-label="${copy.wa}">${copy.wa}</a>`;
  document.body.append(dock);

  dock.querySelector('.lead-dock-access').addEventListener('click', openAccess);
  dock.querySelector('.lead-dock-info').addEventListener('click', () => track('lead_start', { lead_type: 'professional_information', placement: 'lead_dock' }));
  dock.querySelector('.lead-dock-wa').addEventListener('click', () => track('generate_lead', { lead_type: 'whatsapp_retailer', placement: 'lead_dock' }));

  const trade = document.querySelector('#profesionales');
  if (trade && !trade.querySelector('.trade-more')) {
    const more = document.createElement('a');
    more.className = 'button light trade-more';
    more.href = copy.page;
    more.textContent = copy.info;
    more.addEventListener('click', () => track('lead_start', { lead_type: 'professional_information', placement: 'trade_section' }));
    trade.querySelector('div:last-child')?.append(more);
  }

  if (new URLSearchParams(location.search).get('access') === '1') {
    window.addEventListener('load', () => window.setTimeout(openAccess, 350), { once: true });
  }
})();
