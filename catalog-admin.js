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
const REFERENCES = ['MC955', 'MC959', 'MC956', 'MC954', 'MC953', 'MC951', 'MC950'];
const defaultProduct = () => ({
  active: true,
  price: null,
  colors: Object.fromEntries(COLORS.map(color => [color, true]))
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
    colors: Object.fromEntries(COLORS.map(color => [color, saved.colors?.[color] !== false]))
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
  button.setAttribute('aria-label', 'Administrar catálogo');
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
      <p class="eyebrow">ADMINISTRACIÓN</p>
      <h2>Precios y disponibilidad</h2>
      <p class="admin-help">Los precios son profesionales sin IVA. Desmarca un producto o color para impedir que los clientes puedan pedirlo.</p>
      <form class="catalog-admin-form"></form>
      <p class="catalog-admin-feedback" role="status"></p>
      <button class="button dark save-catalog" type="button">Guardar cambios</button>
    </div>`;
  document.body.append(modal);

  const style = document.createElement('style');
  style.textContent = `
    .trade-price{margin:9px 0 0;font-weight:900;color:#111}.trade-price[hidden]{display:none!important}
    .product-unavailable{opacity:.5}.product-unavailable .product-image{cursor:not-allowed}
    .catalog-admin-card{display:block!important;width:min(920px,96vw)!important;padding:45px;max-height:94vh;overflow:auto}
    .catalog-admin-card h2{font-size:42px;margin:10px 0}.admin-help{color:#5d5954;line-height:1.5}
    .catalog-admin-form{display:grid;gap:14px;margin:25px 0}.admin-product{border:1px solid #ddd5cb;padding:18px;background:#faf8f5}
    .admin-product-head{display:grid;grid-template-columns:auto 82px 1fr 190px;gap:16px;align-items:center}
    .admin-product-photo{width:82px;height:82px;object-fit:contain;background:#fff;border:1px solid #e4dfd7;padding:5px}
    .admin-product-head label,.admin-colors label{display:flex;align-items:center;gap:8px;font-weight:700}
    .admin-product input[type="number"]{width:100%;min-height:44px;border:1px solid #cfc9c1;padding:8px 11px}
    .admin-colors{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:15px;padding-top:15px;border-top:1px solid #e4dfd7}
    .catalog-admin-feedback{min-height:20px;font-weight:700}.save-catalog{width:100%}
    @media(max-width:700px){.catalog-admin-card{padding:45px 20px 28px}.admin-product-head{grid-template-columns:1fr}.admin-colors{display:grid;grid-template-columns:1fr 1fr}}
  `;
  document.head.append(style);

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
      </section>`;
    }).join('');
  };

  button.addEventListener('click', () => {
    renderForm();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  });
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
        colors: Object.fromEntries([...section.querySelectorAll('[data-color]')].map(input => [input.dataset.color, input.checked]))
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
