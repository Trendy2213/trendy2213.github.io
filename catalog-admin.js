import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import {
  doc,
  getFirestore,
  onSnapshot,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const firebaseConfig = window.TRENDY_FIREBASE_CONFIG || {
  apiKey: 'AIzaSyDqp23klSLZPgaeh_7uDfcBXhT1bgbsVU4',
  projectId: 'trendy-bag-a6218',
  authDomain: 'trendy-bag-a6218.firebaseapp.com',
  storageBucket: 'trendy-bag-a6218.firebasestorage.app',
  messagingSenderId: '564876869679',
  appId: '1:564876869679:web:cd02d9c9e27b37945906da'
};

const ADMIN_EMAIL = 'trendybag@hotmail.com';
const COLORS = ['Beige', 'Taupe', 'Azul marino', 'Amarillo', 'Marrón', 'Rojo', 'Morado', 'Verde salvia', 'Negro'];
const FOLDERS = ['Novedades', 'Bolsos', 'Viaje', 'Monederos', 'Cinturones', 'Complementos'];
const REFERENCES = ['MC955', 'MC959', 'MC956', 'MC954', 'MC953', 'MC951', 'MC950'];
const defaultProduct = () => ({
  active: true,
  price: null,
  colors: Object.fromEntries(COLORS.map(color => [color, true])),
  folders: Object.fromEntries(FOLDERS.map(folder => [folder, ['Novedades', 'Bolsos'].includes(folder)]))
});
const defaults = Object.fromEntries(REFERENCES.map(reference => [reference, defaultProduct()]));

let catalog = structuredClone(defaults);
let currentEmail = '';
let unsubscribe = null;
let resolveReady;
const ready = new Promise(resolve => { resolveReady = resolve; });

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const settingsRef = doc(db, 'catalog', 'settings');

const mergeCatalog = remote => Object.fromEntries(REFERENCES.map(reference => {
  const base = defaultProduct();
  const saved = remote?.[reference] || {};
  return [reference, {
    active: saved.active !== false,
    price: Number.isFinite(Number(saved.price)) && saved.price !== '' ? Number(saved.price) : null,
    colors: Object.fromEntries(COLORS.map(color => [color, saved.colors?.[color] !== false])),
    folders: Object.fromEntries(FOLDERS.map(folder => [folder, saved.folders?.[folder] ?? base.folders[folder]]))
  }];
}));

const emitCatalog = () => {
  window.dispatchEvent(new CustomEvent('trendy-catalog-state', {
    detail: { catalog: structuredClone(catalog), admin: currentEmail === ADMIN_EMAIL }
  }));
};

const money = value => Number(value).toLocaleString('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2
});

const productImage = reference => {
  const card = [...document.querySelectorAll('.product-card, article')].find(item =>
    item.querySelector('.reference')?.textContent.trim() === reference
  );
  return card?.querySelector('img')?.src || '';
};

const injectAdminInterface = () => {
  if (document.querySelector('#catalog-admin-button')) return;
  const headerTools = document.querySelector('.header-tools');
  const button = document.createElement('button');
  button.id = 'catalog-admin-button';
  button.className = 'header-tool';
  button.type = 'button';
  button.hidden = true;
  button.setAttribute('aria-label', 'Panel de administración');
  button.innerHTML = '<span style="font-size:21px" aria-hidden="true">⚙</span>';
  headerTools?.prepend(button);

  const modal = document.createElement('div');
  modal.id = 'catalog-admin-modal';
  modal.className = 'modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-card catalog-admin-card">
      <button class="modal-close" type="button" aria-label="Cerrar">×</button>
      <p class="eyebrow">ADMINISTRACIÓN TRENDY</p>
      <h2>Panel de administración</h2>
      <nav class="admin-tabs" aria-label="Secciones de administración"><button class="active" type="button" data-admin-tab="catalog">Productos y web</button><button type="button" data-admin-tab="quotes">Pedidos y presupuestos</button><button type="button" data-admin-tab="clients">Clientes</button><button type="button" data-admin-tab="analytics">Analítica</button></nav>
      <section class="admin-tab-panel" data-admin-panel="catalog">
        <p class="admin-help">Gestiona precios, disponibilidad, colores y las secciones de la web. Los precios son profesionales sin IVA.</p>
        <label class="admin-search-label">Buscar referencia<input class="admin-search" type="search" placeholder="Ej. MC955" autocomplete="off"></label>
        <form class="catalog-admin-form"></form>
        <p class="catalog-admin-feedback" role="status"></p>
        <button class="button dark save-catalog" type="button">Guardar cambios</button>
      </section>
      <section class="admin-tab-panel" data-admin-panel="quotes" hidden>
        <div class="admin-orders-list"><p>Cargando pedidos…</p></div>
        <h3>Crear o editar presupuesto</h3>
        <iframe class="admin-budget-frame" title="Pedidos y presupuestos Trendy" data-src="/presupuesto.html"></iframe>
      </section>
      <section class="admin-tab-panel" data-admin-panel="clients" hidden><div class="admin-clients-list"><p>Cargando clientes…</p></div></section>
      <section class="admin-tab-panel" data-admin-panel="analytics" hidden><div class="admin-analytics-view"><p>Cargando analítica…</p></div></section>
    </div>`;
  document.body.append(modal);

  const style = document.createElement('style');
  style.textContent = `
    .trade-price{margin:9px 0 0;font-weight:900;color:#111}.trade-price[hidden]{display:none!important}
    .product-unavailable{opacity:.5}.product-unavailable .product-image{cursor:not-allowed}
    .catalog-admin-card{display:block!important;width:min(920px,96vw)!important;padding:45px;max-height:94vh;overflow:auto}
    .catalog-admin-card h2{font-size:42px;margin:10px 0}.admin-help{color:#5d5954;line-height:1.5}
    .admin-tabs{display:flex;gap:8px;margin:22px 0;border-bottom:1px solid #ddd5cb}.admin-tabs button{border:0;background:none;padding:12px 15px;font-weight:800;cursor:pointer;border-bottom:3px solid transparent}.admin-tabs button.active{border-color:#171717}
    .admin-tab-panel[hidden]{display:none!important}.admin-budget-frame{width:100%;height:70vh;border:1px solid #ddd5cb;background:#f4f1eb}
    .catalog-admin-form{display:grid;gap:14px;margin:25px 0}.admin-product{border:1px solid #ddd5cb;padding:18px;background:#faf8f5}
    .admin-search-label{display:grid;gap:7px;margin-top:22px;font-size:13px;font-weight:800}.admin-search{width:100%;min-height:48px;border:1px solid #cfc9c1;padding:10px 13px;background:#fff}
    .admin-product-head{display:grid;grid-template-columns:auto 82px 1fr 190px;gap:16px;align-items:center}
    .admin-product-photo{width:82px;height:82px;object-fit:contain;background:#fff;border:1px solid #e4dfd7;padding:5px;cursor:zoom-in}
    .admin-product-head label,.admin-colors label{display:flex;align-items:center;gap:8px;font-weight:700}
    .admin-product input[type="number"]{width:100%;min-height:44px;border:1px solid #cfc9c1;padding:8px 11px}
    .admin-colors,.admin-folders{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:15px;padding-top:15px;border-top:1px solid #e4dfd7}.admin-folders::before{content:'Secciones web';width:100%;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
    .catalog-admin-feedback{min-height:20px;font-weight:700}.save-catalog{width:100%}
    .admin-data-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.admin-stat{padding:20px;background:#f7f4ef;border:1px solid #ddd5cb}.admin-stat strong{display:block;font-size:30px}.admin-table{width:100%;border-collapse:collapse;margin:18px 0}.admin-table th,.admin-table td{text-align:left;padding:10px;border-bottom:1px solid #ddd5cb;font-size:13px;vertical-align:top}.admin-table th{font-weight:900}.admin-orders-list h3,.admin-clients-list h3,.admin-analytics-view h3{font-size:28px;margin:25px 0 10px}
    .admin-image-viewer{position:fixed;inset:0;z-index:250;background:#000d;display:grid;place-items:center;padding:30px}.admin-image-viewer[hidden]{display:none}.admin-image-viewer img{display:block;max-width:92vw;max-height:90vh;object-fit:contain;background:#fff}.admin-image-viewer button{position:fixed;right:25px;top:20px;width:46px;height:46px;border:0;border-radius:50%;background:#fff;font-size:30px;cursor:pointer}
    @media(max-width:700px){.catalog-admin-card{padding:45px 20px 28px}.admin-product-head{grid-template-columns:1fr}.admin-colors,.admin-folders{display:grid;grid-template-columns:1fr 1fr}.admin-tabs{overflow:auto}.admin-tabs button{white-space:nowrap}.admin-data-grid{grid-template-columns:1fr}.admin-table{display:block;overflow:auto}}
  `;
  document.head.append(style);

  const imageViewer = document.createElement('div');
  imageViewer.className = 'admin-image-viewer';
  imageViewer.hidden = true;
  imageViewer.innerHTML = '<button type="button" aria-label="Cerrar imagen">×</button><img alt="Vista ampliada del producto">';
  document.body.append(imageViewer);
  const closeImageViewer = () => { imageViewer.hidden = true; };
  imageViewer.querySelector('button').addEventListener('click', closeImageViewer);
  imageViewer.addEventListener('click', event => {
    if (event.target === imageViewer) closeImageViewer();
  });

  const renderForm = () => {
    modal.querySelector('.catalog-admin-form').innerHTML = REFERENCES.map(reference => {
      const item = catalog[reference];
      const image = productImage(reference);
      return `<section class="admin-product" data-reference="${reference}">
        <div class="admin-product-head">
          <label><input class="admin-active" type="checkbox" ${item.active ? 'checked' : ''}> Disponible</label>
          ${image ? `<img class="admin-product-photo" src="${image}" alt="${reference}">` : ''}
          <strong>${reference}</strong>
          <label>Precio sin IVA (€)<input class="admin-price" type="number" min="0" step="0.01" value="${item.price ?? ''}" placeholder="0,00"></label>
        </div>
        <div class="admin-colors">${COLORS.map(color => `<label><input type="checkbox" data-color="${color}" ${item.colors[color] ? 'checked' : ''}> ${color}</label>`).join('')}</div>
        <div class="admin-folders">${FOLDERS.map(folder => `<label><input type="checkbox" data-folder="${folder}" ${item.folders[folder] ? 'checked' : ''}> ${folder}</label>`).join('')}</div>
      </section>`;
    }).join('');
    const searchValue = modal.querySelector('.admin-search').value.trim().toUpperCase();
    if (searchValue) {
      modal.querySelectorAll('.admin-product').forEach(section => {
        section.hidden = !section.dataset.reference.includes(searchValue);
      });
    }
  };

  modal.querySelector('.admin-search').addEventListener('input', event => {
    const query = event.target.value.trim().toUpperCase();
    modal.querySelectorAll('.admin-product').forEach(section => {
      section.hidden = Boolean(query) && !section.dataset.reference.includes(query);
    });
  });
  modal.querySelector('.catalog-admin-form').addEventListener('click', event => {
    const photo = event.target.closest('.admin-product-photo');
    if (!photo) return;
    imageViewer.querySelector('img').src = photo.src;
    imageViewer.querySelector('img').alt = photo.alt;
    imageViewer.hidden = false;
  });

  button.addEventListener('click', () => {
    renderForm();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  });
  modal.querySelectorAll('[data-admin-tab]').forEach(tab => tab.addEventListener('click', () => {
    modal.querySelectorAll('[data-admin-tab]').forEach(item => item.classList.toggle('active', item === tab));
    modal.querySelectorAll('[data-admin-panel]').forEach(panel => { panel.hidden = panel.dataset.adminPanel !== tab.dataset.adminTab; });
    if (tab.dataset.adminTab === 'quotes') {
      const frame = modal.querySelector('.admin-budget-frame');
      if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
    }
    if (['quotes', 'clients', 'analytics'].includes(tab.dataset.adminTab)) loadAdminData();
  }));

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const loadAdminData = async () => {
    const ordersBox = modal.querySelector('.admin-orders-list');
    const clientsBox = modal.querySelector('.admin-clients-list');
    const analyticsBox = modal.querySelector('.admin-analytics-view');
    try {
      const data = await window.TrendyData?.getAdminData?.();
      if (!data) throw new Error('Cargando conexión segura…');
      ordersBox.innerHTML = `<h3>Pedidos recibidos</h3>${data.orders.length ? `<table class="admin-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Importe</th><th>Estado</th></tr></thead><tbody>${data.orders.map(order => `<tr><td><strong>${escapeHtml(order.id)}</strong><br>${order.items?.length || 0} líneas</td><td>${escapeHtml(order.customer?.company || order.customerEmail)}</td><td>${money(order.subtotal || 0)} sin IVA</td><td>${escapeHtml(order.status || 'Recibido')}</td></tr>`).join('')}</tbody></table>` : '<p>Todavía no hay pedidos online.</p>'}`;
      clientsBox.innerHTML = `<h3>Fichas de clientes</h3>${data.users.length ? `<table class="admin-table"><thead><tr><th>Empresa</th><th>Contacto</th><th>Datos fiscales</th></tr></thead><tbody>${data.users.map(client => `<tr><td><strong>${escapeHtml(client.company || 'Sin completar')}</strong><br>${escapeHtml(client.email)}</td><td>${escapeHtml(client.contact)}<br>${escapeHtml(client.phone)}</td><td>${escapeHtml(client.taxId)}<br>${escapeHtml([client.address, client.postalCode, client.city, client.country].filter(Boolean).join(', '))}</td></tr>`).join('')}</tbody></table>` : '<p>Todavía no hay fichas de clientes guardadas.</p>'}`;
      const productViews = data.events.filter(event => event.type === 'product_view');
      const cartAdds = data.events.filter(event => event.type === 'add_to_cart');
      const searches = data.events.filter(event => event.type === 'search');
      const popular = Object.entries(productViews.reduce((totals, event) => {
        totals[event.reference] = (totals[event.reference] || 0) + 1;
        return totals;
      }, {})).sort((a, b) => b[1] - a[1]);
      analyticsBox.innerHTML = `<h3>Actividad de clientes</h3><div class="admin-data-grid"><div class="admin-stat"><strong>${productViews.length}</strong>vistas de productos</div><div class="admin-stat"><strong>${cartAdds.length}</strong>productos añadidos</div><div class="admin-stat"><strong>${searches.length}</strong>búsquedas</div></div><h3>Productos más vistos</h3>${popular.length ? `<table class="admin-table"><thead><tr><th>Referencia</th><th>Visualizaciones</th></tr></thead><tbody>${popular.map(([reference, views]) => `<tr><td>${escapeHtml(reference)}</td><td>${views}</td></tr>`).join('')}</tbody></table>` : '<p>Aún no hay datos suficientes.</p>'}`;
    } catch (error) {
      const message = `<p>${escapeHtml(error.message || 'No se pudieron cargar los datos.')}</p>`;
      ordersBox.innerHTML = message;
      clientsBox.innerHTML = message;
      analyticsBox.innerHTML = message;
    }
  };
  modal.querySelector('.save-catalog').addEventListener('click', async () => {
    const feedback = modal.querySelector('.catalog-admin-feedback');
    const saveButton = modal.querySelector('.save-catalog');
    const next = {};
    modal.querySelectorAll('.admin-product').forEach(section => {
      const reference = section.dataset.reference;
      const rawPrice = section.querySelector('.admin-price').value.trim();
      next[reference] = {
        active: section.querySelector('.admin-active').checked,
        price: rawPrice === '' ? null : Math.max(0, Number(rawPrice)),
        colors: Object.fromEntries([...section.querySelectorAll('[data-color]')].map(input => [input.dataset.color, input.checked])),
        folders: Object.fromEntries([...section.querySelectorAll('[data-folder]')].map(input => [input.dataset.folder, input.checked]))
      };
    });
    saveButton.disabled = true;
    feedback.textContent = 'Guardando…';
    try {
      await setDoc(settingsRef, { products: next, updatedAt: new Date().toISOString() }, { merge: true });
      catalog = mergeCatalog(next);
      emitCatalog();
      feedback.textContent = 'Cambios guardados y publicados.';
    } catch (error) {
      console.error(error);
      feedback.textContent = 'No se pudo guardar. Revisa que la base de datos esté activada.';
    } finally {
      saveButton.disabled = false;
    }
  });

  window.addEventListener('trendy-auth-state', event => {
    currentEmail = (event.detail?.email || '').toLowerCase();
    button.hidden = currentEmail !== ADMIN_EMAIL;
  });
};

injectAdminInterface();

const handleAuthState = detail => {
  currentEmail = (detail?.email || '').toLowerCase();
  unsubscribe?.();
  unsubscribe = null;
  if (!detail?.authenticated) {
    catalog = structuredClone(defaults);
    emitCatalog();
    resolveReady?.(catalog);
    resolveReady = null;
    return;
  }
  unsubscribe = onSnapshot(settingsRef, snapshot => {
    catalog = mergeCatalog(snapshot.exists() ? snapshot.data()?.products : null);
    emitCatalog();
    resolveReady?.(catalog);
    resolveReady = null;
  }, error => {
    console.error(error);
    catalog = structuredClone(defaults);
    emitCatalog();
    resolveReady?.(catalog);
    resolveReady = null;
  });
};

window.addEventListener('trendy-auth-state', event => handleAuthState(event.detail));
window.TrendyAuth?.whenReady?.().then(user => handleAuthState({
  authenticated: Boolean(user),
  email: user?.email || ''
}));

window.TrendyCatalog = {
  whenReady: () => ready,
  getProduct(reference) {
    return structuredClone(catalog[reference] || defaultProduct());
  },
  isAdmin: () => currentEmail === ADMIN_EMAIL,
  formatPrice: money
};
