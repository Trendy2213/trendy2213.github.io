import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import {
  addDoc, collection, doc, getDoc, getDocs, getFirestore, limit,
  orderBy, query, serverTimestamp, setDoc
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
</div>`;
document.body.append(profileModal);
const style = document.createElement('style');
style.textContent = `.client-profile-card{display:block!important;width:min(720px,96vw)!important;padding:48px;max-height:94vh;overflow:auto}.client-profile-card h2{font-size:42px;margin:10px 0}.client-profile-form{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:24px}.client-profile-form label{display:grid;gap:7px;font-size:13px;font-weight:800}.client-profile-form input{width:100%;min-height:48px;border:1px solid #cfc9c1;padding:10px 12px}.client-profile-form .wide{grid-column:1/-1}.profile-feedback{min-height:18px}@media(max-width:700px){.client-profile-card{padding:50px 20px 28px}.client-profile-form{grid-template-columns:1fr}.client-profile-form .wide{grid-column:auto}}`;
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
    await setDoc(doc(db, 'orders', order.id), {
      ...order, customerUid: user.uid, customerEmail: user.email || '',
      customer: profile, status: 'Recibido', createdAt: serverTimestamp()
    });
    return order.id;
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
