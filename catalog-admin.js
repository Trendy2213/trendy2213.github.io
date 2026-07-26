import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import {
  collection,
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
const FOLDERS = [
  'Novedades',
  'Bolsos',
  'Hombro',
  'Bandoleras',
  'Mochilas',
  'Riñoneras',
  'Bolsos de rafia/capazos',
  'Bolsos de hombre',
  'Viaje',
  'Viaje / Maletas',
  'Viaje / Bolsas de viaje',
  'Viaje / Mochilas de viaje',
  'Viaje / Riñoneras',
  'Monederos',
  'Monederos / Monederos de mujer',
  'Monederos / Monederos de hombre',
  'Cinturones',
  'Cinturones / Cinturones de mujer',
  'Cinturones / Cinturones de hombre',
  'Complementos'
];
const BASE_REFERENCES = ['MC955', 'MC959', 'MC956', 'MC954', 'MC953', 'MC951', 'MC950'];
let references = [...BASE_REFERENCES];
const defaultProduct = () => ({
  active: true,
  price: null,
  name: '',
  measures: '',
  image: '',
  colors: Object.fromEntries(COLORS.map(color => [color, true])),
  folders: Object.fromEntries(FOLDERS.map(folder => [folder, ['Novedades', 'Bolsos'].includes(folder)]))
});
const defaults = Object.fromEntries(BASE_REFERENCES.map(reference => [reference, defaultProduct()]));

let catalog = structuredClone(defaults);
let productImages = {};
let currentEmail = '';
let unsubscribe = null;
let unsubscribeImages = null;
let resolveReady;
const ready = new Promise(resolve => { resolveReady = resolve; });

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const settingsRef = doc(db, 'catalog', 'settings');

const mergeCatalog = remote => {
  references = [...new Set([...BASE_REFERENCES, ...Object.keys(remote || {})])];
  return Object.fromEntries(references.map(reference => {
  const base = defaultProduct();
  const saved = remote?.[reference] || {};
  return [reference, {
    active: saved.active !== false,
    price: Number.isFinite(Number(saved.price)) && saved.price !== '' ? Number(saved.price) : null,
    name: saved.name || '',
    measures: saved.measures || '',
    image: productImages[reference] || saved.image || '',
    colors: Object.fromEntries(COLORS.map(color => [color, saved.colors?.[color] !== false])),
    folders: Object.fromEntries(FOLDERS.map(folder => [folder, saved.folders?.[folder] ?? base.folders[folder]]))
  }];
  }));
};

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
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const downloadCsv = (filename, rows) => {
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
const prepareProductImage = async (file, reference) => {
  if (!file) return '';
  if (!file.type.startsWith('image/')) throw new Error('Selecciona un archivo de imagen.');
  if (file.size > 8 * 1024 * 1024) throw new Error('La imagen supera el máximo de 8 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let dataUrl = canvas.toDataURL('image/webp', 0.84);
  if (dataUrl.length > 850000) dataUrl = canvas.toDataURL('image/jpeg', 0.76);
  if (dataUrl.length > 900000) throw new Error('La fotografía sigue siendo demasiado pesada. Reduce su tamaño e inténtalo de nuevo.');
  await setDoc(doc(db, 'productImages', reference), {
    dataUrl,
    updatedAt: new Date().toISOString()
  });
  productImages[reference] = dataUrl;
  return dataUrl;
};

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
        <p class="admin-help">Gestiona precios, disponibilidad, colores y las secciones de la web. Los precios son profesionales IVA no incluido.</p>
        <details class="admin-new-product">
          <summary>+ Añadir un producto nuevo</summary>
          <div class="admin-new-grid">
            <label>Referencia<input name="newReference" placeholder="Ej. MC960"></label>
            <label>Nombre<input name="newName" placeholder="Ej. Bolso shopper"></label>
            <label>Medidas<input name="newMeasures" placeholder="Ej. 35 × 24 × 12 cm"></label>
            <label>Imagen desde el ordenador<input name="newImageFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
            <label style="grid-column:1/-1">O imagen mediante enlace<input name="newImage" type="url" placeholder="https://…"></label>
          </div>
          <button class="button dark add-product" type="button">Crear producto</button>
          <p class="new-product-feedback" role="status"></p>
        </details>
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
    .admin-new-product{margin:22px 0;padding:18px;border:1px solid #ddd5cb;background:#f7f4ef}.admin-new-product summary{font-weight:900;cursor:pointer}.admin-new-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0}.admin-new-grid label{display:grid;gap:7px;font-size:13px;font-weight:800}.admin-new-grid input{min-height:46px;border:1px solid #cfc9c1;padding:9px 11px}.new-product-feedback{min-height:18px}.catalog-admin-form{display:grid;gap:14px;margin:25px 0}.admin-product{border:1px solid #ddd5cb;padding:18px;background:#faf8f5}
    .admin-search-label{display:grid;gap:7px;margin-top:22px;font-size:13px;font-weight:800}.admin-search{width:100%;min-height:48px;border:1px solid #cfc9c1;padding:10px 13px;background:#fff}
    .admin-product-head{display:grid;grid-template-columns:auto 82px 1fr 190px;gap:16px;align-items:center}
    .admin-product-photo{width:82px;height:82px;object-fit:contain;background:#fff;border:1px solid #e4dfd7;padding:5px;cursor:zoom-in}
    .admin-product-head label,.admin-colors label{display:flex;align-items:center;gap:8px;font-weight:700}
    .admin-product input[type="number"]{width:100%;min-height:44px;border:1px solid #cfc9c1;padding:8px 11px}
    .admin-colors,.admin-folders{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:15px;padding-top:15px;border-top:1px solid #e4dfd7}.admin-folders::before{content:'Secciones web';width:100%;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
    .catalog-admin-feedback{min-height:20px;font-weight:700}.save-catalog{width:100%}
    .admin-data-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.admin-stat{padding:20px;background:#f7f4ef;border:1px solid #ddd5cb}.admin-stat strong{display:block;font-size:30px}.admin-table{width:100%;border-collapse:collapse;margin:18px 0}.admin-table th,.admin-table td{text-align:left;padding:10px;border-bottom:1px solid #ddd5cb;font-size:13px;vertical-align:top}.admin-table th{font-weight:900}.admin-table select{min-height:38px;border:1px solid #cfc9c1;background:#fff;padding:7px}.admin-order-detail{margin-top:8px}.admin-order-detail summary{font-weight:800;cursor:pointer}.admin-order-detail ul{padding-left:18px;line-height:1.6}.admin-order-response{margin:8px 0 0;padding:7px 9px;background:#eef5ec;border-radius:6px}.admin-orders-list h3,.admin-clients-list h3,.admin-analytics-view h3{font-size:28px;margin:25px 0 10px}.admin-export{margin:0 8px 8px 0}
    .admin-image-viewer{position:fixed;inset:0;z-index:250;background:#000d;display:grid;place-items:center;padding:30px}.admin-image-viewer[hidden]{display:none}.admin-image-viewer img{display:block;max-width:92vw;max-height:90vh;object-fit:contain;background:#fff}.admin-image-viewer button{position:fixed;right:25px;top:20px;width:46px;height:46px;border:0;border-radius:50%;background:#fff;font-size:30px;cursor:pointer}
    @media(max-width:700px){.catalog-admin-card{padding:45px 20px 28px}.admin-new-grid{grid-template-columns:1fr}.admin-product-head{grid-template-columns:1fr}.admin-colors,.admin-folders{display:grid;grid-template-columns:1fr 1fr}.admin-tabs{overflow:auto}.admin-tabs button{white-space:nowrap}.admin-data-grid{grid-template-columns:1fr}.admin-table{display:block;overflow:auto}}
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
    modal.querySelector('.catalog-admin-form').innerHTML = references.map(reference => {
      const item = catalog[reference];
      const image = productImage(reference);
      return `<section class="admin-product" data-reference="${escapeHtml(reference)}">
        <div class="admin-product-head">
          <label><input class="admin-active" type="checkbox" ${item.active ? 'checked' : ''}> Disponible</label>
          ${(item.image || image) ? `<img class="admin-product-photo" src="${escapeHtml(item.image || image)}" alt="${escapeHtml(reference)}">` : ''}
          <strong>${escapeHtml(reference)}</strong>
          <label>Precio IVA no incluido (€)<input class="admin-price" type="number" min="0" step="0.01" value="${item.price ?? ''}" placeholder="0,00"></label>
        </div>
        <div class="admin-new-grid">
          <label>Nombre<input class="admin-name" value="${escapeHtml(item.name)}" placeholder="Nombre comercial"></label>
          <label>Medidas<input class="admin-measures" value="${escapeHtml(item.measures)}" placeholder="Ej. 35 × 24 × 12 cm"></label>
          <label>Subir nueva fotografía<input class="admin-image-file" type="file" accept="image/jpeg,image/png,image/webp"></label>
          <label>O conservar/pegar enlace<input class="admin-image" type="url" value="${escapeHtml(item.image)}" placeholder="https://…"></label>
        </div>
        <div class="admin-colors">${COLORS.map(color => `<label><input type="checkbox" data-color="${color}" ${item.colors[color] ? 'checked' : ''}> ${color}</label>`).join('')}</div>
        <div class="admin-folders">${FOLDERS.map(folder => `<label><input type="checkbox" data-folder="${folder}" ${item.folders[folder] ? 'checked' : ''}> ${folder}</label>`).join('')}</div>
        ${BASE_REFERENCES.includes(reference) ? '' : '<button class="button light archive-product" type="button">Archivar producto</button>'}
      </section>`;
    }).join('');
    const searchValue = modal.querySelector('.admin-search').value.trim().toUpperCase();
    if (searchValue) {
      modal.querySelectorAll('.admin-product').forEach(section => {
        section.hidden = !section.dataset.reference.includes(searchValue);
      });
    }
  };
  modal.querySelector('.add-product').addEventListener('click', async event => {
    const reference = modal.querySelector('[name="newReference"]').value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const feedback = modal.querySelector('.new-product-feedback');
    const addButton = event.currentTarget;
    if (!reference) {
      feedback.textContent = 'Escribe una referencia válida.';
      return;
    }
    if (catalog[reference]) {
      feedback.textContent = 'Esta referencia ya existe.';
      return;
    }
    addButton.disabled = true;
    feedback.textContent = 'Preparando producto…';
    try {
      const file = modal.querySelector('[name="newImageFile"]').files[0];
      const uploadedImage = await prepareProductImage(file, reference);
      catalog[reference] = {
        ...defaultProduct(),
        name: modal.querySelector('[name="newName"]').value.trim(),
        measures: modal.querySelector('[name="newMeasures"]').value.trim(),
        image: uploadedImage || modal.querySelector('[name="newImage"]').value.trim()
      };
      references.push(reference);
      renderForm();
      feedback.textContent = `${reference} creado. Revisa sus datos y pulsa Guardar cambios.`;
    } catch (error) {
      feedback.textContent = error.message || 'No se pudo subir la fotografía.';
    } finally {
      addButton.disabled = false;
    }
  });

  modal.querySelector('.admin-search').addEventListener('input', event => {
    const query = event.target.value.trim().toUpperCase();
    modal.querySelectorAll('.admin-product').forEach(section => {
      section.hidden = Boolean(query) && !section.dataset.reference.includes(query);
    });
  });
  modal.querySelector('.catalog-admin-form').addEventListener('click', event => {
    const archiveButton = event.target.closest('.archive-product');
    if (archiveButton) {
      const section = archiveButton.closest('.admin-product');
      const reference = section.dataset.reference;
      if (!confirm(`¿Archivar ${reference}? Dejará de aparecer en la web.`)) return;
      delete catalog[reference];
      references = references.filter(item => item !== reference);
      renderForm();
      modal.querySelector('.catalog-admin-feedback').textContent = `${reference} archivado. Pulsa Guardar cambios para publicarlo.`;
      return;
    }
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

  const loadAdminData = async () => {
    const ordersBox = modal.querySelector('.admin-orders-list');
    const clientsBox = modal.querySelector('.admin-clients-list');
    const analyticsBox = modal.querySelector('.admin-analytics-view');
    try {
      const data = await window.TrendyData?.getAdminData?.();
      if (!data) throw new Error('Cargando conexión segura…');
      const statuses = ['Recibido', 'Revisando', 'Presupuesto enviado', 'Presupuesto aceptado', 'Presupuesto rechazado', 'Pagado', 'Preparando', 'Enviado', 'Cancelado'];
      const orderTotal = data.orders.reduce((total, order) => total + Number(order.subtotal || 0), 0);
      ordersBox.innerHTML = `<h3>Pedidos recibidos</h3><button class="button light admin-export export-orders" type="button">Descargar pedidos CSV</button><div class="admin-data-grid"><div class="admin-stat"><strong>${data.orders.length}</strong>pedidos</div><div class="admin-stat"><strong>${money(orderTotal)}</strong>solicitado IVA no incluido</div><div class="admin-stat"><strong>${data.orders.filter(order => !['Enviado', 'Cancelado'].includes(order.status)).length}</strong>pendientes</div></div>${data.orders.length ? `<table class="admin-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Importe</th><th>Estado</th></tr></thead><tbody>${data.orders.map(order => `<tr><td><strong>${escapeHtml(order.id)}</strong><br>${order.items?.length || 0} líneas<details class="admin-order-detail"><summary>Ver productos</summary><ul>${(order.items || []).map(item => `<li>${escapeHtml(item.reference)} · ${escapeHtml(item.color)} · ${Number(item.quantity || 0)} uds.</li>`).join('')}</ul></details></td><td>${escapeHtml(order.customer?.company || order.customerEmail)}<br>${escapeHtml(order.customer?.contact || '')}<br>${escapeHtml(order.customer?.phone || '')}</td><td>${money(order.subtotal || 0)} IVA no incluido</td><td><select data-order-status="${escapeHtml(order.id)}" aria-label="Estado de ${escapeHtml(order.id)}">${statuses.map(status => `<option ${status === (order.status || 'Recibido') ? 'selected' : ''}>${status}</option>`).join('')}</select>${order.quoteResponse ? `<p class="admin-order-response"><strong>Cliente:</strong> ${order.quoteResponse.accepted ? 'Aceptado' : 'Rechazado'}</p>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p>Todavía no hay pedidos online.</p>'}`;
      ordersBox._orders = data.orders;
      ordersBox.querySelectorAll('tbody tr').forEach((row, index) => {
        const order = data.orders[index];
        if (!order) return;
        const button = document.createElement('button');
        button.className = 'button light prepare-quote';
        button.type = 'button';
        button.dataset.orderId = order.id;
        button.textContent = 'Preparar presupuesto';
        row.cells[0]?.append(document.createElement('br'), button);
      });
      clientsBox.innerHTML = `<h3>Fichas de clientes</h3><button class="button light admin-export export-clients" type="button">Descargar clientes CSV</button>${data.users.length ? `<table class="admin-table"><thead><tr><th>Empresa</th><th>Contacto</th><th>Datos fiscales</th><th>Acceso</th></tr></thead><tbody>${data.users.map(client => {
        const status = client.approvalStatus || 'pending';
        return `<tr data-client-id="${escapeHtml(client.id)}"><td><strong>${escapeHtml(client.company || 'Sin completar')}</strong><br>${escapeHtml(client.email)}</td><td>${escapeHtml(client.contact)}<br>${escapeHtml(client.phone)}</td><td>${escapeHtml(client.taxId)}<br>${escapeHtml([client.address, client.postalCode, client.city, client.country].filter(Boolean).join(', '))}</td><td><span class="client-access-status">${status === 'approved' ? 'Aprobado' : status === 'rejected' ? 'Rechazado' : 'Pendiente'}</span><br><select class="client-approval" data-client-id="${escapeHtml(client.id)}" data-previous="${status}" aria-label="Acceso de ${escapeHtml(client.company || client.email)}"><option value="pending" ${status === 'pending' ? 'selected' : ''}>Pendiente</option><option value="approved" ${status === 'approved' ? 'selected' : ''}>Aprobado</option><option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Rechazado</option></select></td></tr>`;
      }).join('')}</tbody></table>` : '<p>Todavía no hay fichas de clientes guardadas.</p>'}`;
      clientsBox._clients = data.users;
      const productViews = data.events.filter(event => event.type === 'product_view');
      const cartAdds = data.events.filter(event => event.type === 'add_to_cart');
      const searches = data.events.filter(event => event.type === 'search');
      const popular = Object.entries(productViews.reduce((totals, event) => {
        totals[event.reference] = (totals[event.reference] || 0) + 1;
        return totals;
      }, {})).sort((a, b) => b[1] - a[1]);
      const conversion = productViews.length ? Math.round((cartAdds.length / productViews.length) * 100) : 0;
      analyticsBox.innerHTML = `<h3>Actividad de clientes</h3><div class="admin-data-grid"><div class="admin-stat"><strong>${productViews.length}</strong>vistas de productos</div><div class="admin-stat"><strong>${cartAdds.length}</strong>productos añadidos</div><div class="admin-stat"><strong>${conversion}%</strong>conversión a carrito</div></div><h3>Productos más vistos</h3>${popular.length ? `<table class="admin-table"><thead><tr><th>Referencia</th><th>Visualizaciones</th></tr></thead><tbody>${popular.map(([reference, views]) => `<tr><td>${escapeHtml(reference)}</td><td>${views}</td></tr>`).join('')}</tbody></table>` : '<p>Aún no hay datos suficientes.</p>'}<h3>Búsquedas recientes</h3>${searches.length ? `<p>${searches.slice(0, 20).map(item => escapeHtml(item.query || '')).filter(Boolean).join(' · ')}</p>` : '<p>Aún no hay búsquedas registradas.</p>'}`;
    } catch (error) {
      const message = `<p>${escapeHtml(error.message || 'No se pudieron cargar los datos.')}</p>`;
      ordersBox.innerHTML = message;
      clientsBox.innerHTML = message;
      analyticsBox.innerHTML = message;
    }
  };
  modal.querySelector('.admin-orders-list').addEventListener('change', async event => {
    const select = event.target.closest('[data-order-status]');
    if (!select) return;
    select.disabled = true;
    try {
      await window.TrendyData.updateOrder(select.dataset.orderStatus, { status: select.value });
    } catch {
      alert('No se pudo actualizar el pedido.');
    } finally {
      select.disabled = false;
    }
  });
  modal.querySelector('.admin-orders-list').addEventListener('click', event => {
    if (event.target.closest('.export-orders')) {
      const rows = [['Pedido', 'Fecha', 'Cliente', 'Email', 'Teléfono', 'Subtotal IVA no incluido', 'Estado']];
      (event.currentTarget._orders || []).forEach(order => rows.push([
        order.id,
        order.createdAt?.toDate?.().toLocaleDateString('es-ES') || '',
        order.customer?.company || '',
        order.customerEmail || order.customer?.email || '',
        order.customer?.phone || '',
        Number(order.subtotal || 0).toFixed(2),
        order.status || 'Recibido'
      ]));
      downloadCsv(`pedidos-trendy-${new Date().toISOString().slice(0, 10)}.csv`, rows);
      return;
    }
    const button = event.target.closest('.prepare-quote');
    if (!button) return;
    const order = event.currentTarget._orders?.find(item => item.id === button.dataset.orderId);
    if (!order) return;
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      id: order.id,
      items: (order.items || []).map(item => ({
        ref: item.reference || item.ref,
        name: item.name || '',
        color: item.color || '',
        qty: item.quantity || item.qty || 1,
        price: item.price ?? 0
      })),
      customer: order.customer || {},
      customerEmail: order.customerEmail || ''
    }))));
    const frame = modal.querySelector('.admin-budget-frame');
    frame.src = `/presupuesto.html?pedido=${encodeURIComponent(payload)}`;
    frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  modal.querySelector('.admin-clients-list').addEventListener('click', event => {
    if (!event.target.closest('.export-clients')) return;
    const rows = [['Empresa', 'CIF / NIF', 'Contacto', 'Email', 'Teléfono', 'Dirección', 'CP', 'Ciudad', 'País']];
    (event.currentTarget._clients || []).forEach(client => rows.push([
      client.company || '', client.taxId || '', client.contact || '', client.email || '', client.phone || '',
      client.address || '', client.postalCode || '', client.city || '', client.country || ''
    ]));
    downloadCsv(`clientes-trendy-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  });
  modal.querySelector('.admin-clients-list').addEventListener('change', async event => {
    const select = event.target.closest('.client-approval');
    if (!select) return;
    const previous = select.dataset.previous || 'pending';
    select.disabled = true;
    try {
      await window.TrendyData.updateClient(select.dataset.clientId, { approvalStatus: select.value });
      select.dataset.previous = select.value;
      const status = select.closest('td')?.querySelector('.client-access-status');
      if (status) status.textContent = select.value === 'approved' ? 'Aprobado' : select.value === 'rejected' ? 'Rechazado' : 'Pendiente';
    } catch {
      select.value = previous;
      alert('No se pudo actualizar el acceso del cliente.');
    } finally {
      select.disabled = false;
    }
  });
  modal.querySelector('.save-catalog').addEventListener('click', async () => {
    const feedback = modal.querySelector('.catalog-admin-feedback');
    const saveButton = modal.querySelector('.save-catalog');
    const next = {};
    saveButton.disabled = true;
    feedback.textContent = 'Guardando…';
    try {
      for (const section of modal.querySelectorAll('.admin-product')) {
        const reference = section.dataset.reference;
        const rawPrice = section.querySelector('.admin-price').value.trim();
        const imageFile = section.querySelector('.admin-image-file').files[0];
        const uploadedImage = imageFile ? await prepareProductImage(imageFile, reference) : '';
        next[reference] = {
          active: section.querySelector('.admin-active').checked,
          price: rawPrice === '' ? null : Math.max(0, Number(rawPrice)),
          name: section.querySelector('.admin-name').value.trim(),
          measures: section.querySelector('.admin-measures').value.trim(),
          image: uploadedImage ? '' : section.querySelector('.admin-image').value.trim().startsWith('data:')
            ? ''
            : section.querySelector('.admin-image').value.trim(),
          colors: Object.fromEntries([...section.querySelectorAll('[data-color]')].map(input => [input.dataset.color, input.checked])),
          folders: Object.fromEntries([...section.querySelectorAll('[data-folder]')].map(input => [input.dataset.folder, input.checked]))
        };
      }
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
  unsubscribeImages?.();
  unsubscribe = null;
  unsubscribeImages = null;
  if (!detail?.authenticated) {
    productImages = {};
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
  unsubscribeImages = onSnapshot(collection(db, 'productImages'), snapshot => {
    productImages = Object.fromEntries(snapshot.docs
      .map(item => [item.id, item.data()?.dataUrl || ''])
      .filter(([, image]) => image));
    catalog = mergeCatalog(catalog);
    emitCatalog();
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


const installCategoryNavigation = () => {
  const nav = document.querySelector('.category-nav');
  if (!nav || nav.dataset.organized === 'true') return;
  nav.dataset.organized = 'true';
  nav.innerHTML = '<a href="#catalogo" data-folder="Novedades">Novedades</a><details class="category-group"><summary data-folder="Bolsos">Bolsos</summary><div class="category-subnav"><a href="#catalogo" data-folder="Hombro">Hombro</a><a href="#catalogo" data-folder="Bandoleras">Bandoleras</a><a href="#catalogo" data-folder="Mochilas">Mochilas</a><a href="#catalogo" data-folder="Riñoneras">Riñoneras</a><a href="#catalogo" data-folder="Bolsos de rafia/capazos">Bolsos de rafia/capazos</a><a href="#catalogo" data-folder="Bolsos de hombre">Bolsos de hombre</a></div></details><details class="category-group"><summary data-folder="Viaje">Viaje</summary><div class="category-subnav"><a href="#catalogo" data-folder="Viaje / Maletas">Maletas</a><a href="#catalogo" data-folder="Viaje / Bolsas de viaje">Bolsas de viaje</a><a href="#catalogo" data-folder="Viaje / Mochilas de viaje">Mochilas de viaje</a><a href="#catalogo" data-folder="Viaje / Riñoneras">Riñoneras</a></div></details><details class="category-group"><summary data-folder="Monederos">Monederos</summary><div class="category-subnav"><a href="#catalogo" data-folder="Monederos / Monederos de mujer">Monederos de mujer</a><a href="#catalogo" data-folder="Monederos / Monederos de hombre">Monederos de hombre</a></div></details><details class="category-group"><summary data-folder="Cinturones">Cinturones</summary><div class="category-subnav"><a href="#catalogo" data-folder="Cinturones / Cinturones de mujer">Cinturones de mujer</a><a href="#catalogo" data-folder="Cinturones / Cinturones de hombre">Cinturones de hombre</a></div></details><a href="#catalogo" data-folder="Complementos">Complementos</a><a href="#contacto">Contacto</a>';
  const style = document.createElement('style');
  style.textContent = '.category-nav{gap:22px!important;align-items:center}.category-nav>details{position:relative}.category-nav>details summary{padding:10px 0;cursor:pointer;list-style:none}.category-nav>details summary::-webkit-details-marker{display:none}.category-nav>details summary::after{content:"⌄";margin-left:5px}.category-nav a:hover,.category-nav summary:hover{border-bottom-color:transparent!important;text-decoration:none!important}.category-subnav{position:absolute;left:-14px;top:36px;min-width:220px;padding:8px;background:#fff;border:1px solid #ded8d0;box-shadow:0 14px 30px #0002;display:grid;z-index:60}.category-subnav a{padding:10px 13px!important}.category-subnav a:hover{background:#f7f4ef}@media(max-width:800px){.category-nav>details{flex:0 0 auto}.category-subnav{position:fixed;left:16px;right:16px;top:auto;min-width:0}}';
  document.head.append(style);
  nav.addEventListener('click', async event => {
    const link = event.target.closest('[data-folder]');
    if (!link) return;
    const group = link.closest('details');
    if (link.tagName === 'SUMMARY') {
      nav.querySelectorAll('details').forEach(item => { if (item !== group) item.open = false; });
    }
    const folder = link.dataset.folder;
    await window.TrendyCatalog?.whenReady?.();
    document.querySelectorAll('.product').forEach(card => {
      const settings = window.TrendyCatalog?.getProduct?.(card.dataset.reference);
      card.hidden = settings?.active === false || settings?.folders?.[folder] === false;
    });
    nav.querySelectorAll('[data-folder]').forEach(item => item.classList.toggle('active', item === link));
    if (link.tagName !== 'SUMMARY') nav.querySelectorAll('details').forEach(item => { item.open = false; });
  });
};

installCategoryNavigation();
