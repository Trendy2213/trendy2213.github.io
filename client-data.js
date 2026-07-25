import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import {
  addDoc, collection, doc, getDoc, getDocs, getFirestore, limit,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const config = {
  apiKey: 'AIzaSyDqp23klSLZPgaeh_7uDfcBXhT1bgbsVU4',
  projectId: 'trendy-bag-a6218',
  authDomain: 'trendy-bag-a6218.firebaseapp.com',
  storageBucket: 'trendy-bag-a6218.firebasestorage.app',
  messagingSenderId: '564876869679',
  appId: '1:564876869679:web:cd02d9c9e27b37945906da'
};
const ADMIN = 'trendybag@hotmail.com';
const app = getApps().length ? getApp() : initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
let user = null;

const profileModal = document.createElement('div');
profileModal.className = 'modal';
profileModal.id = 'client-profile-modal';
profileModal.hidden = true;
profileModal.innerHTML = `<div class="modal-card client-profile-card">
  <button class="modal-close" type="button" aria-label="Cerrar">×</button>
  <p class="eyebrow">MI CUENTA PROFESIONAL</p><h2>Ficha de cliente</h2>
  <p>Estos datos se utilizarán para preparar pedidos y presupuestos.</p>
  <nav class="client-account-tabs" aria-label="Mi cuenta">
    <button class="active" type="button" data-account-tab="profile">Mis datos</button>
    <button type="button" data-account-tab="orders">Mis pedidos</button>
  </nav>
  <form class="client-profile-form">
    <label>Empresa o razón social<input name="company" required></label>
    <label>CIF / NIF<input name="taxId" required></label>
    <label>Persona de contacto<input name="contact" required></label>
    <label>Teléfono<input name="phone" type="tel" required></label>
    <label class="wide">Dirección de facturación<input name="address" required></label>
    <label>Ciudad<input name="city" required></label>
    <label>Código postal<input name="postalCode" required></label>
    <label>País<input name="country" value="España" required></label>
    <label>Email<input name="email" type="email" readonly></label>
    <p class="profile-feedback wide" role="status"></p>
    <button class="button dark wide" type="submit">Guardar ficha</button>
  </form>
  <section class="client-orders" hidden><p>Cargando pedidos…</p></section>
</div>`;
document.body.append(profileModal);
const style = document.createElement('style');
style.textContent = `.client-profile-card{display:block!important;width:min(820px,96vw)!important;padding:48px;max-height:94vh;overflow:auto}.client-profile-card h2{font-size:42px;margin:10px 0}.client-account-tabs{display:flex;gap:8px;margin:22px 0;border-bottom:1px solid #ddd5cb}.client-account-tabs button{border:0;background:none;padding:12px 15px;font-weight:800;cursor:pointer;border-bottom:3px solid transparent}.client-account-tabs button.active{border-color:#171717}.client-profile-form{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:24px}.client-profile-form label{display:grid;gap:7px;font-size:13px;font-weight:800}.client-profile-form input{width:100%;min-height:48px;border:1px solid #cfc9c1;padding:10px 12px}.client-profile-form .wide{grid-column:1/-1}.profile-feedback{min-height:18px}.client-orders{display:grid;gap:12px}.client-order{border:1px solid #ddd5cb;padding:18px;background:#faf8f5}.client-order-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.client-order-items{margin:12px 0 0;padding-left:18px;color:#555}.client-order-status{display:inline-flex;padding:6px 10px;background:#e9e0d2;font-size:12px;font-weight:900}.client-order-total{font-size:20px;font-weight:900}.client-order-quote{margin-top:15px;padding:15px;border:1px solid #ddd5cb;background:#fff}.quote-response-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.quote-response-actions button{border:1px solid #171717;background:#fff;padding:10px 14px;font-weight:800;cursor:pointer}.quote-response-actions .accept-quote{background:#171717;color:#fff}.quote-response-feedback{min-height:18px;font-size:13px;font-weight:700}@media(max-width:700px){.client-profile-card{padding:50px 20px 28px}.client-profile-form{grid-template-columns:1fr}.client-profile-form .wide{grid-column:auto}.client-order-head{display:grid}}`;
document.head.append(style);

const form = profileModal.querySelector('form');
const closeProfile = () => {
  profileModal.hidden = true;
  document.body.style.overflow = '';
};
profileModal.querySelector('.modal-close').addEventListener('click', closeProfile);
profileModal.addEventListener('click', event => {
  if (event.target === profileModal) closeProfile();
});

const loadProfile = async () => {
  if (!user) return;
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  const profile = snapshot.exists() ? snapshot.data() : {};
  ['company', 'taxId', 'contact', 'phone', 'address', 'city', 'postalCode', 'country'].forEach(name => {
    if (form.elements[name]) form.elements[name].value = profile[name] || (name === 'country' ? 'España' : '');
  });
  form.elements.email.value = user.email || '';
};
const openProfile = async () => {
  await loadProfile().catch(() => {});
  profileModal.hidden = false;
  document.body.style.overflow = 'hidden';
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const formatMoney = value => Number(value || 0).toLocaleString('es-ES', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2
});
const loadMyOrders = async () => {
  const box = profileModal.querySelector('.client-orders');
  if (!user) return;
  box.innerHTML = '<p>Cargando pedidos…</p>';
  try {
    const snapshot = await getDocs(query(
      collection(db, 'orders'),
      where('customerUid', '==', user.uid),
      limit(100)
    ));
    const orders = snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    box.innerHTML = orders.length ? orders.map(order => `<article class="client-order">
      <div class="client-order-head">
        <div><strong>${escapeHtml(order.id)}</strong><br><small>${order.createdAt?.toDate?.().toLocaleDateString('es-ES') || 'Pedido enviado'}</small></div>
        <span class="client-order-status">${escapeHtml(order.status || 'Recibido')}</span>
        <span class="client-order-total">${formatMoney(order.subtotal)} IVA no incluido</span>
      </div>
      <ul class="client-order-items">${(order.items || []).map(item => `<li>${escapeHtml(item.reference || item.ref)} · ${escapeHtml(item.color)} · ${Number(item.quantity || item.qty || 0)} uds.</li>`).join('')}</ul>
      ${order.quote ? `<div class="client-order-quote"><strong>Presupuesto ${escapeHtml(order.quote.number)}</strong><br>Total: <span class="client-order-total">${formatMoney(order.quote.total)}</span><br><small>${escapeHtml(order.quote.notes || 'Pendiente de aceptación y pago.')}</small>
        ${order.quoteResponse ? `<p><strong>Tu respuesta:</strong> ${order.quoteResponse.accepted ? 'Aceptado' : 'Rechazado'}.</p>` : `<div class="quote-response-actions"><button class="accept-quote" type="button" data-order-id="${escapeHtml(order.id)}">Aceptar presupuesto</button><button class="reject-quote" type="button" data-order-id="${escapeHtml(order.id)}">Rechazar / solicitar cambios</button></div>`}
        <p class="quote-response-feedback" role="status"></p>
      </div>` : ''}
    </article>`).join('') : '<p>Todavía no has enviado ningún pedido.</p>';
  } catch {
    box.innerHTML = '<p>No se pudieron cargar los pedidos. Vuelve a intentarlo.</p>';
  }
};
profileModal.querySelector('.client-orders').addEventListener('click', async event => {
  const button = event.target.closest('.accept-quote, .reject-quote');
  if (!button || !user) return;
  const accepted = button.classList.contains('accept-quote');
  if (!confirm(accepted
    ? '¿Confirmas que aceptas este presupuesto?'
    : '¿Confirmas que quieres rechazarlo o solicitar cambios?')) return;
  const card = button.closest('.client-order');
  const feedback = card.querySelector('.quote-response-feedback');
  card.querySelectorAll('.quote-response-actions button').forEach(item => { item.disabled = true; });
  feedback.textContent = 'Guardando tu respuesta…';
  try {
    await updateDoc(doc(db, 'orders', button.dataset.orderId), {
      quoteResponse: {
        accepted,
        respondedAt: new Date().toISOString(),
        customerEmail: user.email || ''
      },
      status: accepted ? 'Presupuesto aceptado' : 'Presupuesto rechazado',
      updatedAt: serverTimestamp()
    });
    feedback.textContent = accepted
      ? 'Presupuesto aceptado. Trendy Bag te indicará los datos de pago.'
      : 'Respuesta enviada. Trendy Bag contactará contigo para revisar el presupuesto.';
    await loadMyOrders();
  } catch {
    feedback.textContent = 'No se pudo guardar la respuesta. Vuelve a intentarlo.';
    card.querySelectorAll('.quote-response-actions button').forEach(item => { item.disabled = false; });
  }
});
profileModal.querySelectorAll('[data-account-tab]').forEach(tab => tab.addEventListener('click', () => {
  profileModal.querySelectorAll('[data-account-tab]').forEach(item => item.classList.toggle('active', item === tab));
  const showOrders = tab.dataset.accountTab === 'orders';
  form.hidden = showOrders;
  profileModal.querySelector('.client-orders').hidden = !showOrders;
  if (showOrders) loadMyOrders();
}));

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!user) return;
  const feedback = form.querySelector('.profile-feedback');
  const data = Object.fromEntries(new FormData(form));
  feedback.textContent = 'Guardando…';
  try {
    await setDoc(doc(db, 'users', user.uid), {
      ...data, email: user.email || '', uid: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    feedback.textContent = 'Ficha guardada correctamente.';
  } catch {
    feedback.textContent = 'No se pudo guardar. Vuelve a intentarlo.';
  }
});

document.querySelector('#header-login')?.addEventListener('click', event => {
  if (!user) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openProfile();
}, true);

onAuthStateChanged(auth, current => {
  user = current;
  const loginButton = document.querySelector('#header-login');
  if (loginButton) {
    loginButton.title = current ? 'Mi ficha de cliente' : 'Iniciar sesión';
    loginButton.setAttribute('aria-label', current ? 'Mi ficha de cliente' : 'Iniciar sesión');
  }
});

window.TrendyData = {
  async track(type, detail = {}) {
    if (!user || user.email?.toLowerCase() === ADMIN) return;
    try {
      await addDoc(collection(db, 'analytics'), {
        type, ...detail, userId: user.uid, createdAt: serverTimestamp()
      });
    } catch {}
  },
  async saveOrder(order) {
    if (!user) throw new Error('Debes iniciar sesión.');
    const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
    const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
    const normalizedItems = (order.items || []).map(item => ({
      reference: item.reference || item.ref || '',
      name: item.name || '',
      color: item.color || '',
      quantity: Number(item.quantity || item.qty || 0),
      price: item.price == null ? null : Number(item.price)
    }));
    await setDoc(doc(db, 'orders', order.id), {
      ...order, items: normalizedItems, customerUid: user.uid, customerEmail: user.email || '',
      customer: profile, status: 'Recibido', createdAt: serverTimestamp()
    });
    return order.id;
  },
  async getMyOrders() {
    if (!user) throw new Error('Debes iniciar sesión.');
    const snapshot = await getDocs(query(collection(db, 'orders'), where('customerUid', '==', user.uid), limit(100)));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  },
  async updateOrder(orderId, changes) {
    if (!user || user.email?.toLowerCase() !== ADMIN) throw new Error('No autorizado');
    await updateDoc(doc(db, 'orders', orderId), { ...changes, updatedAt: serverTimestamp() });
  },
  async updateClient(clientId, changes) {
    if (!user || user.email?.toLowerCase() !== ADMIN) throw new Error('No autorizado');
    await updateDoc(doc(db, 'users', clientId), { ...changes, updatedAt: serverTimestamp() });
  },
  async getAdminData() {
    if (!user || user.email?.toLowerCase() !== ADMIN) throw new Error('No autorizado');
    const [users, orders, events] = await Promise.all([
      getDocs(query(collection(db, 'users'), limit(250))),
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(250))),
      getDocs(query(collection(db, 'analytics'), orderBy('createdAt', 'desc'), limit(1000)))
    ]);
    return {
      users: users.docs.map(item => ({ id: item.id, ...item.data() })),
      orders: orders.docs.map(item => ({ id: item.id, ...item.data() })),
      events: events.docs.map(item => ({ id: item.id, ...item.data() }))
    };
  },
  openProfile
};
window.dispatchEvent(new CustomEvent('trendy-data-ready'));
