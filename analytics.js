(() => {
  const measurementId = 'G-E7B2QBCHJW';
  const consentKey = 'trendy-analytics-consent';
  const language = ['es','ca','fr','en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'es';
  const copy = {
    es: ['Usamos cookies analíticas para entender cómo se utiliza la web y mejorar el catálogo.','Aceptar analítica','Rechazar'],
    ca: ['Utilitzem galetes analítiques per entendre com es fa servir el web i millorar el catàleg.','Acceptar analítica','Rebutjar'],
    fr: ['Nous utilisons des cookies analytiques pour comprendre l’utilisation du site et améliorer le catalogue.','Accepter','Refuser'],
    en: ['We use analytics cookies to understand website use and improve the catalogue.','Accept analytics','Reject']
  }[language];
  const loadAnalytics = () => {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', measurementId, { anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.append(script);
  };
  const saved = localStorage.getItem(consentKey);
  if (saved === 'granted') { loadAnalytics(); return; }
  if (saved === 'denied') return;
  const banner = document.createElement('aside');
  banner.setAttribute('aria-label','Analytics cookies');
  banner.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:auto;padding:18px 20px;background:#141414;color:#fff;box-shadow:0 10px 35px #0005;font:14px/1.5 Arial,sans-serif;display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center';
  banner.innerHTML='<span>'+copy[0]+' <a href="/cookies.html" style="color:#fff;text-decoration:underline">Cookies</a></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button data-consent="accept" style="padding:10px 14px;border:0;background:#fff;color:#111;font-weight:800;cursor:pointer">'+copy[1]+'</button><button data-consent="reject" style="padding:10px 14px;border:1px solid #fff;background:transparent;color:#fff;font-weight:800;cursor:pointer">'+copy[2]+'</button></span>';
  banner.addEventListener('click', event => {
    const action = event.target?.dataset?.consent;
    if (!action) return;
    localStorage.setItem(consentKey, action === 'accept' ? 'granted' : 'denied');
    if (action === 'accept') loadAnalytics();
    banner.remove();
  });
  document.body.append(banner);
})();
