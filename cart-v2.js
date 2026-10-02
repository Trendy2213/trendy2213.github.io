import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

(() => {
const collapseDuplicatedPage = () => {
  ['.notice', 'header', 'main', 'footer'].forEach(selector => {
    [...document.querySelectorAll(`body > ${selector}`)].slice(1).forEach(node => node.remove());
  });
  ['order-float', 'product-modal', 'login-modal', 'cart-modal'].forEach(id => {
    [...document.querySelectorAll(`[id="${id}"]`)].slice(1).forEach(node => node.remove());
  });
  const loadedScripts = new Set();
  document.querySelectorAll('body > script[src]').forEach(script => {
    const source = script.getAttribute('src')?.split('?')[0] || '';
    if (loadedScripts.has(source)) script.remove();
    else loadedScripts.add(source);
  });
  document.querySelectorAll('body > meta, body > title, body > link[rel]').forEach(node => node.remove());
};
window.setTimeout(collapseDuplicatedPage, 0);
window.addEventListener('load', collapseDuplicatedPage, { once: true });

const cartRuntimeConfig = window.TRENDY_FIREBASE_CONFIG || {
  apiKey: 'AIzaSyDqp23klSLZPgaeh_7uDfcBXhT1bgbsVU4',
  projectId: 'trendy-bag-a6218',
  authDomain: 'trendy-bag-a6218.firebaseapp.com',
  storageBucket: 'trendy-bag-a6218.firebasestorage.app',
  messagingSenderId: '564876869679',
  appId: '1:564876869679:web:cd02d9c9e27b37945906da'
};
const cartFirebaseApp = getApps().length ? getApp() : initializeApp(cartRuntimeConfig);
const firebaseAuth = getAuth(cartFirebaseApp);
const SESSION_KEY = 'trendy-auth-session-v2';
const ADMIN_EMAIL = 'trendybag@hotmail.com';

const messages = {
  INVALID_LOGIN_CREDENTIALS: 'El correo o la contraseña no son correctos.',
  INVALID_CREDENTIAL: 'El correo o la contraseña no son correctos.',
  INVALID_EMAIL: 'El correo electrónico no es válido.',
  EMAIL_EXISTS: 'Ya existe una cuenta con este correo. Inicia sesión o utiliza “He olvidado mi contraseña”.',
  EMAIL_ALREADY_IN_USE: 'Ya existe una cuenta con este correo. Inicia sesión o utiliza “He olvidado mi contraseña”.',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 8 caracteres.',
  USER_DISABLED: 'Esta cuenta está desactivada. Contacta con Trendy Bag.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  EMAIL_NOT_FOUND: 'No existe una cuenta con este correo electrónico.',
  NETWORK_ERROR: 'No hay conexión. Comprueba Internet y vuelve a probar.',
  EMAIL_NOT_VERIFIED: 'Confirma tu correo electrónico antes de iniciar sesión. Te hemos enviado un nuevo enlace.',
  PENDING_APPROVAL: 'Tu solicitud está pendiente de validación por Trendy Bag.'
};

const api = async (url, options = {}) => {
  let response;
  try { response = await fetch(url, options); }
  catch { const error = new Error('NETWORK_ERROR'); error.code = 'NETWORK_ERROR'; throw error; }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(data?.error?.message || 'REQUEST_FAILED').split(' : ')[0];
    const error = new Error(code); error.code = code; throw error;
  }
  return data;
};

const firestoreBase = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cartRuntimeConfig.projectId)}/databases/(default)/documents`;
const toFirestoreValue = value => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)])) } };
};
const fromFirestoreValue = value => {
  if (!value || 'nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, fromFirestoreValue(item)]));
  return null;
};
const decodeFirestoreDocument = document => document
  ? Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]))
  : {};
const writeFirestoreDocument = (path, data, idToken) => api(`${firestoreBase}/${path}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])) })
});
const normalizedErrorCode = error => String(error?.code || error?.message || '')
  .replace(/^auth\//, '')
  .replaceAll('-', '_')
  .toUpperCase();
const friendly = error => new Error(messages[normalizedErrorCode(error)] || 'No se ha podido completar la operación. Vuelve a intentarlo.');
const clearStored = () => { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); };
const readStored = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
};
const saveStored = (session, remember) => {
  clearStored();
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
};

let session = null;
let approved = false;
let readyResolve;
const ready = new Promise(resolve => { readyResolve = resolve; });
const emit = () => window.dispatchEvent(new CustomEvent('trendy-auth-state', { detail: {
  authenticated: Boolean(session && approved), pending: Boolean(session && !approved), email: session?.email || '', uid: session?.uid || ''
} }));

const accountStatus = async value => {
  if (String(value.email || '').toLowerCase() === ADMIN_EMAIL) return { approved: true, requiresEmailVerification: false };
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cartRuntimeConfig.projectId)}/databases/(default)/documents/users/${encodeURIComponent(value.uid)}`;
    const profile = await api(url, { headers: { Authorization: `Bearer ${value.idToken}` } });
    return {
      approved: profile?.fields?.approvalStatus?.stringValue === 'approved',
      requiresEmailVerification: profile?.fields?.requiresEmailVerification?.booleanValue === true
    };
  } catch { return { approved: false, requiresEmailVerification: false }; }
};

const sessionFromUser = async user => {
  const tokenResult = await user.getIdTokenResult();
  return {
    email: user.email || '',
    uid: user.uid,
    idToken: tokenResult.token,
    expiresAt: Date.parse(tokenResult.expirationTime || '') || Date.now() + 55 * 60 * 1000
  };
};

window.TrendyAuth = {
  isAuthenticated() { return Boolean(session && approved); },
  whenReady() { return ready; },
  async signIn(email, password, remember = true) {
    try {
      await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, String(email || '').trim(), password);
      const next = await sessionFromUser(credential.user);
      const status = await accountStatus(next);
      if (status.requiresEmailVerification && !credential.user.emailVerified) {
        await sendEmailVerification(credential.user).catch(() => {});
        await firebaseSignOut(firebaseAuth);
        const error = new Error('EMAIL_NOT_VERIFIED'); error.code = 'EMAIL_NOT_VERIFIED'; throw error;
      }
      if (!status.approved) {
        await firebaseSignOut(firebaseAuth);
        const error = new Error('PENDING_APPROVAL'); error.code = 'PENDING_APPROVAL'; throw error;
      }
      session = next; approved = true; saveStored(next, remember); emit();
      return { user: { email: next.email, uid: next.uid } };
    } catch (error) { clearStored(); session = null; approved = false; emit(); throw friendly(error); }
  },
  async resetPassword(email) {
    try { await sendPasswordResetEmail(firebaseAuth, String(email || '').trim()); }
    catch (error) { throw friendly(error); }
  },
  async getIdToken() {
    if (!firebaseAuth.currentUser || !session || !approved) return '';
    const idToken = await firebaseAuth.currentUser.getIdToken();
    session.idToken = idToken;
    return idToken;
  },
  async requestAccess(profile, password) {
    const email = String(profile?.email || '').trim().toLowerCase();
    if (String(password || '').length < 8) throw friendly({ code: 'WEAK_PASSWORD' });
    let createdUser = null;
    try {
      await setPersistence(firebaseAuth, browserSessionPersistence);
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      createdUser = credential.user;
      const idToken = await createdUser.getIdToken();
      const pendingProfile = {
        ...profile,
        email,
        approvalStatus: 'pending',
        requiresEmailVerification: true,
        requestedAt: new Date().toISOString(),
        source: 'web'
      };
      await writeFirestoreDocument(`users/${encodeURIComponent(createdUser.uid)}`, pendingProfile, idToken);
      const verificationSent = await sendEmailVerification(createdUser).then(() => true).catch(() => false);
      await firebaseSignOut(firebaseAuth);
      session = null;
      approved = false;
      clearStored();
      emit();
      return { pending: true, uid: createdUser.uid, verificationSent };
    } catch (error) {
      if (createdUser) await deleteUser(createdUser).catch(() => {});
      await firebaseSignOut(firebaseAuth).catch(() => {});
      session = null; approved = false; clearStored(); emit();
      throw friendly(error);
    }
  },
  async saveOrder(order) {
    if (!session || !approved) throw new Error('Debes iniciar sesión como cliente aprobado.');
    const idToken = await window.TrendyAuth.getIdToken();
    if (!idToken) throw new Error('La sesión ha caducado. Inicia sesión de nuevo.');
    const status = await accountStatus({ ...session, idToken });
    if (!status.approved) {
      await window.TrendyAuth.signOut();
      throw new Error('Tu acceso profesional ya no está activo. Contacta con Trendy Bag.');
    }
    const profileDocument = await api(`${firestoreBase}/users/${encodeURIComponent(session.uid)}`, {
      headers: { Authorization: `Bearer ${idToken}` }
    }).catch(() => null);
    const customer = decodeFirestoreDocument(profileDocument);
    const normalizedItems = (order.items || []).map(item => ({
      reference: item.reference || item.ref || '',
      name: item.name || '',
      color: item.color || '',
      quantity: Number(item.quantity || item.qty || 0),
      price: item.price == null || Number(item.price) <= 0 ? null : Number(item.price)
    }));
    await writeFirestoreDocument(`orders/${encodeURIComponent(order.id)}`, {
      ...order,
      items: normalizedItems,
      customerUid: session.uid,
      customerEmail: session.email || '',
      customer,
      status: 'Recibido',
      createdAt: new Date().toISOString()
    }, idToken);
    return order.id;
  },
  async assertApproved() {
    const idToken = await window.TrendyAuth.getIdToken();
    if (!idToken || !session) throw new Error('La sesión ha caducado. Inicia sesión de nuevo.');
    const status = await accountStatus({ ...session, idToken });
    if (!status.approved) {
      await window.TrendyAuth.signOut();
      throw new Error('Tu acceso profesional ya no está activo. Contacta con Trendy Bag.');
    }
    return true;
  },
  async signOut() { await firebaseSignOut(firebaseAuth).catch(() => {}); clearStored(); session = null; approved = false; emit(); }
};

(async () => {
  try {
    await firebaseAuth.authStateReady();
    if (firebaseAuth.currentUser) {
      const restored = await sessionFromUser(firebaseAuth.currentUser);
      const status = await accountStatus(restored);
      if (status.approved && (!status.requiresEmailVerification || firebaseAuth.currentUser.emailVerified)) {
        session = restored; approved = true; saveStored(restored, true);
      } else {
        await firebaseSignOut(firebaseAuth); clearStored();
      }
    } else clearStored();
  } catch {
    await firebaseSignOut(firebaseAuth).catch(() => {}); clearStored(); session = null; approved = false;
  }
  readyResolve(session && approved ? session : null); emit();
})();
})();

(() => {
  const lang = ['es', 'ca', 'fr', 'en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'es';
  const I18N = {
    es: { colors: ['Beige', 'Taupe', 'Azul marino', 'Amarillo', 'Marrón', 'Rojo', 'Morado', 'Verde salvia', 'Negro'], productGate: 'Solo los clientes registrados pueden consultar colores y añadir productos al pedido.', cartGate: 'Inicia sesión como cliente registrado para acceder al carrito.', addGate: 'Inicia sesión como cliente registrado para añadir productos.', choose: 'Selecciona un color.', empty: 'El pedido está vacío.', units: 'unidades', orderStart: 'Hola Trendy Bag, quiero solicitar este pedido profesional:', orderEnd: 'Quedo pendiente de confirmación de disponibilidad y condiciones.', added: 'añadido al pedido', pending: 'Solicitud registrada. Trendy Bag revisará la documentación y activará tu acceso profesional.', emailReady: 'Ahora se abrirá tu correo para que adjuntes el Modelo 036 y envíes la documentación.', passwordMismatch: 'Las dos contraseñas no coinciden.', remember: 'Recordarme en este equipo', forgot: 'He olvidado mi contraseña', logout: 'Cerrar sesión', enterEmail: 'Escribe primero tu correo electrónico.', resetSent: 'Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña. Revisa también el correo no deseado.', signedIn: 'Sesión iniciada correctamente.', signedOut: 'Sesión cerrada.' },
    ca: { colors: ['Beix', 'Taupe', 'Blau marí', 'Groc', 'Marró', 'Vermell', 'Morat', 'Verd sàlvia', 'Negre'], productGate: 'Només els clients registrats poden consultar colors i afegir productes a la comanda.', cartGate: 'Inicia sessió com a client registrat per accedir al carretó.', addGate: 'Inicia sessió com a client registrat per afegir productes.', choose: 'Selecciona un color.', empty: 'La comanda està buida.', units: 'unitats', orderStart: 'Hola Trendy Bag, vull sol·licitar aquesta comanda professional:', orderEnd: 'Quedo pendent de la confirmació de disponibilitat i condicions.', added: 'afegit a la comanda', pending: 'Sol·licitud registrada. Trendy Bag revisarà la documentació i activarà el teu accés professional.', emailReady: 'Ara s’obrirà el correu perquè adjuntis el Model 036 i enviïs la documentació.', passwordMismatch: 'Les dues contrasenyes no coincideixen.', remember: 'Recorda’m en aquest equip', forgot: 'He oblidat la contrasenya', logout: 'Tancar sessió', enterEmail: 'Escriu primer el teu correu electrònic.', resetSent: 'Si existeix un compte amb aquest correu, rebràs un enllaç per crear una contrasenya nova. Revisa també el correu brossa.', signedIn: 'Sessió iniciada correctament.', signedOut: 'Sessió tancada.' },
    fr: { colors: ['Beige', 'Taupe', 'Bleu marine', 'Jaune', 'Marron', 'Rouge', 'Violet', 'Vert sauge', 'Noir'], productGate: 'Seuls les clients enregistrés peuvent consulter les couleurs et ajouter des produits à la commande.', cartGate: 'Connectez-vous en tant que client enregistré pour accéder au panier.', addGate: 'Connectez-vous en tant que client enregistré pour ajouter des produits.', choose: 'Sélectionnez une couleur.', empty: 'La commande est vide.', units: 'unités', orderStart: 'Bonjour Trendy Bag, je souhaite passer cette commande professionnelle :', orderEnd: 'Dans l’attente de la confirmation des disponibilités et des conditions.', added: 'ajouté à la commande', pending: 'Demande enregistrée. Trendy Bag vérifiera les documents et activera votre accès professionnel.', emailReady: 'Votre messagerie va s’ouvrir afin de joindre le formulaire 036 et envoyer les documents.', passwordMismatch: 'Les deux mots de passe ne correspondent pas.', remember: 'Se souvenir de moi sur cet appareil', forgot: 'Mot de passe oublié', logout: 'Se déconnecter', enterEmail: 'Saisissez d’abord votre adresse e-mail.', resetSent: 'Si un compte existe avec cette adresse, vous recevrez un lien pour créer un nouveau mot de passe. Vérifiez également les courriers indésirables.', signedIn: 'Connexion réussie.', signedOut: 'Session fermée.' },
    en: { colors: ['Beige', 'Taupe', 'Navy blue', 'Yellow', 'Brown', 'Red', 'Purple', 'Sage green', 'Black'], productGate: 'Only registered customers can view colours and add products to an order.', cartGate: 'Sign in as a registered customer to access the cart.', addGate: 'Sign in as a registered customer to add products.', choose: 'Select a colour.', empty: 'Your order is empty.', units: 'units', orderStart: 'Hello Trendy Bag, I would like to place this trade order:', orderEnd: 'Please confirm availability and trade terms.', added: 'added to order', pending: 'Request registered. Trendy Bag will review the documents and activate your trade access.', emailReady: 'Your email app will now open so you can attach Form 036 and send the documents.', passwordMismatch: 'The two passwords do not match.', remember: 'Remember me on this device', forgot: 'I forgot my password', logout: 'Sign out', enterEmail: 'Enter your email address first.', resetSent: 'If an account exists for that email, you will receive a link to create a new password. Please also check your junk folder.', signedIn: 'Signed in successfully.', signedOut: 'Signed out.' }
  };
  const copy = I18N[lang];
  const requestButtonCopy = {
    es: 'Solicitar acceso profesional',
    ca: 'Sol·licitar accés professional',
    fr: 'Demander un accès professionnel',
    en: 'Request trade access'
  }[lang];
  const verificationCopy = {
    es: 'Te hemos enviado un correo para confirmar tu dirección.',
    ca: 'T’hem enviat un correu per confirmar la teva adreça.',
    fr: 'Nous vous avons envoyé un e-mail pour confirmer votre adresse.',
    en: 'We have sent you an email to confirm your address.'
  }[lang];
  const requestSavedCopy = {
    es: 'La solicitud ya aparece en el panel de Trendy Bag. También se abrirá tu correo por si quieres enviar ahora el Modelo 036.',
    ca: 'La sol·licitud ja apareix al panell de Trendy Bag. També s’obrirà el correu per si vols enviar ara el Model 036.',
    fr: 'La demande apparaît déjà dans le tableau de bord Trendy Bag. Votre messagerie s’ouvrira également si vous souhaitez envoyer le formulaire 036 maintenant.',
    en: 'The request already appears in the Trendy Bag dashboard. Your email app will also open if you want to send Form 036 now.'
  }[lang];
  const documentCopy = {
    es: ['Modelo 036 (opcional en esta fase)', 'El archivo no se sube automáticamente. Si lo seleccionas, adjúntalo manualmente al correo; también puedes enviarlo después.'],
    ca: ['Model 036 (opcional en aquesta fase)', 'L’arxiu no es puja automàticament. Si el selecciones, adjunta’l manualment al correu; també el pots enviar després.'],
    fr: ['Formulaire 036 (facultatif à ce stade)', 'Le fichier n’est pas téléversé automatiquement. Si vous le sélectionnez, joignez-le manuellement à l’e-mail ou envoyez-le plus tard.'],
    en: ['Form 036 (optional at this stage)', 'The file is not uploaded automatically. If selected, attach it manually to the email, or send it later.']
  }[lang];
  const enhancementStyles = document.createElement('style');
  enhancementStyles.textContent = '[hidden]{display:none!important}.document-field{grid-column:1/-1;border:1px dashed #a9a198;background:#fff;padding:18px}.document-field input{border:0!important;padding:8px 0!important;min-height:auto!important}.document-note{font-size:12px;font-weight:400;color:#666;line-height:1.5}.selected-color-label{font-weight:800;color:#e95642;min-height:20px}.modal-trade-price{font-size:20px;font-weight:900;margin:12px 0}.unavailable-message{color:#a52c20;font-weight:800}.category-nav [data-folder].active{border-color:currentColor;font-weight:900}.catalog-tools{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin:0 0 30px;padding:18px;background:#f7f4ef;border:1px solid #e4dfd7}.catalog-tools label{display:grid;gap:7px;font-size:12px;font-weight:800}.catalog-tools input,.catalog-tools select{width:100%;min-height:46px;border:1px solid #cfc9c1;background:#fff;padding:9px 11px}.catalog-results{grid-column:1/-1;margin:0;color:#666;font-size:13px}.cart-summary{padding:15px;background:#f7f4ef;border:1px solid #e4dfd7;margin:14px 0}.cart-summary strong{font-size:22px}.minimum-warning{color:#a52c20;font-weight:800}.send-order[aria-disabled="true"]{opacity:.45;pointer-events:none}@media(max-width:800px){header{height:auto;min-height:64px;padding-bottom:8px;grid-template-columns:1fr auto}.header-socials{display:none}.header-actions{gap:8px}.header-tool{width:38px;height:38px}.category-nav{display:flex!important;grid-column:1/-1;order:3;width:calc(100vw - 32px);gap:22px;overflow-x:auto;overscroll-behavior-inline:contain;scrollbar-width:none}.category-nav::-webkit-scrollbar{display:none}.category-nav a{flex:0 0 auto;padding:7px 0}.login-card{height:auto!important;min-height:0;display:block!important;padding:54px 22px 32px}.request-grid{grid-template-columns:1fr}.request-form{padding:18px}}@media(max-width:700px){.catalog-tools{grid-template-columns:1fr}.catalog-results{grid-column:auto}}';
  enhancementStyles.textContent += '#login-modal.request-mode .login-card{position:relative;max-height:94vh;overflow:auto}#login-modal.request-mode .request-access{position:absolute;inset:0;z-index:5;margin:0;background:#fff;padding:45px;overflow:auto}#login-modal.request-mode .request-access>summary{position:sticky;top:-45px;z-index:2;margin:-45px -45px 24px;padding:18px 45px;background:#f7f4ef;border-bottom:1px solid #e4dfd7;font-weight:800;cursor:pointer}#login-modal.request-mode .modal-close{z-index:8}.trade-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.request-account-button{margin-top:18px}.seo-category-links{background:#f7f4ef}.seo-category-links h2{max-width:760px}.seo-link-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:30px}.seo-link-grid a{display:flex;align-items:center;justify-content:space-between;min-height:64px;padding:16px 18px;background:#fff;border:1px solid #e4dfd7;font-weight:800}.seo-link-grid a:after{content:"→";color:#e95642}@media(max-width:700px){#login-modal.request-mode .request-access{padding:45px 20px}#login-modal.request-mode .request-access>summary{top:-45px;margin:-45px -20px 20px;padding:18px 20px}.trade-actions{display:grid}.trade-actions .button{width:100%;margin-top:0}.seo-link-grid{grid-template-columns:1fr}}'; document.head.append(enhancementStyles);
  [...document.querySelectorAll('.category-nav a[href="#catalogo"]')].forEach((link, index) => {
    if (!link.dataset.folder) link.dataset.folder = ['Novedades', 'Bolsos', 'Viaje', 'Monederos', 'Cinturones', 'Complementos'][index] || 'Novedades';
  });
  const seoLinks = {
    es: { title: 'Catálogo mayorista para tiendas', intro: 'Explora las principales familias de bolsos y complementos de Trendy Bag.', links: [['Bolsos al por mayor','/es/categorias/bolsos/'],['Viaje','/es/categorias/viaje/'],['Monederos','/es/categorias/monederos/'],['Cinturones','/es/categorias/cinturones/'],['Complementos','/es/categorias/complementos/'],['Conoce Trendy Bag','/es/empresa/']] },
    ca: { title: 'Catàleg majorista per a botigues', intro: 'Explora les principals famílies de bosses i complements de Trendy Bag.', links: [['Bosses a l’engròs','/ca/categories/bosses/'],['Viatge','/ca/categories/viatge/'],['Moneders','/ca/categories/moneders/'],['Cinturons','/ca/categories/cinturons/'],['Complements','/ca/categories/complements/'],['Coneix Trendy Bag','/ca/empresa/']] },
    fr: { title: 'Catalogue de gros pour les boutiques', intro: 'Découvrez les principales familles de sacs et accessoires Trendy Bag.', links: [['Sacs en gros','/fr/categories/sacs/'],['Voyage','/fr/categories/voyage/'],['Portefeuilles','/fr/categories/portefeuilles/'],['Ceintures','/fr/categories/ceintures/'],['Accessoires','/fr/categories/accessoires/'],['Découvrir Trendy Bag','/fr/entreprise/']] },
    en: { title: 'Wholesale catalogue for retailers', intro: 'Explore the main Trendy Bag wholesale bag and accessory ranges.', links: [['Wholesale bags','/en/categories/bags/'],['Travel','/en/categories/travel/'],['Wallets','/en/categories/wallets/'],['Belts','/en/categories/belts/'],['Accessories','/en/categories/accessories/'],['About Trendy Bag','/en/company/']] }
  }[lang];
  if (!document.querySelector('.seo-category-links')) {
    const linkSection = document.createElement('section');
    linkSection.className = 'section seo-category-links';
    linkSection.innerHTML = `<p class="eyebrow">TRENDY BAG B2B</p><h2>${seoLinks.title}</h2><p class="catalog-intro">${seoLinks.intro}</p><nav class="seo-link-grid" aria-label="${seoLinks.title}">${seoLinks.links.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}</nav>`;
    document.querySelector('#profesionales')?.before(linkSection);
  }
  const COLORS = I18N.es.colors;
  const canonicalColor = value => {
    const raw = String(value || '');
    for (const translation of Object.values(I18N)) {
      const index = translation.colors.indexOf(raw);
      if (index >= 0) return COLORS[index];
    }
    return raw;
  };
  const colorLabel = color => copy.colors[COLORS.indexOf(canonicalColor(color))] || String(color || '');
  const VARIANT_CROPS = {
    MC955: [[72,480,175,160],[252,480,175,160],[430,480,175,160],[608,480,175,160],[5,700,160,170],[172,700,160,170],[340,700,160,170],[508,700,160,170],[676,700,160,170]],
    MC959: [[80,490,168,145],[258,490,164,145],[435,490,166,145],[610,490,165,145],[8,680,158,122],[174,680,158,122],[342,680,158,122],[512,680,163,122],[684,680,159,122]],
    MC956: [[190,810,290,170],[495,810,290,170],[815,810,300,170],[1120,810,320,170],[20,1035,300,155],[335,1035,295,155],[650,1035,300,155],[960,1035,300,155],[1260,1035,305,155]],
    MC954: [[94,436,155,80],[258,436,153,80],[420,436,153,80],[584,436,154,80],[5,548,160,86],[171,548,155,86],[338,548,160,86],[505,548,166,86],[680,548,160,86]],
    MC953: [[80,428,170,78],[258,428,163,78],[430,428,168,78],[610,428,172,78],[5,545,162,92],[173,545,158,92],[340,545,160,92],[510,545,165,92],[684,545,158,92]],
    MC951: [[80,435,170,82],[258,435,163,82],[430,435,168,82],[610,435,172,82],[5,558,162,78],[173,558,158,78],[340,558,160,78],[510,558,165,78],[684,558,158,78]],
    MC950: [[80,425,170,100],[258,425,163,100],[430,425,168,100],[610,425,172,100],[5,565,162,100],[173,565,158,100],[340,565,160,100],[510,565,165,100],[684,565,158,100]]
  };
  const phone = '34688124938';
  const productModal = document.querySelector('#product-modal');
  if (!productModal.querySelector('.selected-color-label')) {
    const selectedColorLabel = document.createElement('p');
    selectedColorLabel.className = 'selected-color-label';
    productModal.querySelector('.color-list').after(selectedColorLabel);
  }
  const cartModal = document.querySelector('#cart-modal');
  const floatButton = document.querySelector('#order-float');
  const headerCartButton = document.querySelector('#header-cart');
  const headerCartCount = document.querySelector('.header-cart-count');
  const loginModal = document.querySelector('#login-modal');
  const loginForm = loginModal.querySelector('.login-form');
  const passwordInput = loginForm.querySelector('[name="password"], input[type="password"]');
  const existingRemember = [...loginForm.querySelectorAll('[name="remember"]')];
  existingRemember.slice(1).forEach(input => input.closest('label')?.remove());
  if (!existingRemember.length) {
    const rememberLabel = document.createElement('label');
    rememberLabel.style.cssText = 'display:flex;align-items:center;gap:9px;font-weight:400';
    rememberLabel.innerHTML = `<input name="remember" type="checkbox" checked style="width:18px;min-height:18px;margin:0"> ${copy.remember}`;
    passwordInput.closest('label').after(rememberLabel);
  }
  const loginSubmit = loginForm.querySelector('[type="submit"]');
  let forgotButton = loginForm.querySelector('.forgot-password');
  if (!forgotButton) {
    forgotButton = document.createElement('button');
    forgotButton.className = 'auth-link forgot-password';
    forgotButton.type = 'button';
    loginSubmit.after(forgotButton);
  }
  forgotButton.textContent = copy.forgot;
  let logoutButton = loginForm.querySelector('.logout-button');
  if (!logoutButton) {
    logoutButton = document.createElement('button');
    logoutButton.className = 'auth-link logout-button';
    logoutButton.type = 'button';
    logoutButton.hidden = true;
    forgotButton.after(logoutButton);
  }
  logoutButton.textContent = copy.logout;
  const requestGrid = loginModal.querySelector('.request-grid');
  if (requestGrid && !requestGrid.querySelector('[name="requestPassword"]')) {
    const passwordFields = document.createDocumentFragment();
    const passwordLabel = document.createElement('label');
    passwordLabel.innerHTML = `Contraseña de acceso *<input name="requestPassword" type="password" minlength="8" autocomplete="new-password" required>`;
    const confirmLabel = document.createElement('label');
    confirmLabel.innerHTML = `Repetir contraseña *<input name="requestPasswordConfirm" type="password" minlength="8" autocomplete="new-password" required>`;
    passwordFields.append(passwordLabel, confirmLabel);
    requestGrid.prepend(passwordFields);
  }
  if (requestGrid && !requestGrid.querySelector('[name="model036"]')) {
    const messageField = requestGrid.querySelector('textarea[name="message"]')?.closest('label');
    const documentField = document.createElement('label');
    documentField.className = 'document-field';
    documentField.innerHTML = `${documentCopy[0]}<input name="model036" type="file" accept=".pdf,.jpg,.jpeg,.png"><span class="document-note">${documentCopy[1]}</span>`;
    requestGrid.insertBefore(documentField, messageField || null);
  }
  const requestAccess = loginModal.querySelector('.request-access'); const requestSummary = requestAccess?.querySelector('summary'); if (requestAccess && requestSummary) { const requestTitle = requestSummary.textContent.trim(); const backLabel = { es: '← Volver al inicio de sesión', ca: '← Tornar a l’inici de sessió', fr: '← Retour à la connexion', en: '← Back to sign in' }[lang]; requestAccess.addEventListener('toggle', () => { loginModal.classList.toggle('request-mode', requestAccess.open); requestSummary.textContent = requestAccess.open ? backLabel : requestTitle; if (requestAccess.open) loginModal.querySelector('.login-card').scrollTop = 0; }); } const sheetImage = productModal.querySelector('.modal-image img');
  const colorCanvas = productModal.querySelector('.selected-color-canvas');
  const canvasContext = colorCanvas.getContext('2d');

  let cart = [];
  let currentClientUid = '';
  const cartStorageKey = uid => `trendy-bag-order-${uid}`;
  const loadClientCart = uid => {
    if (!uid) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(cartStorageKey(uid)) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && typeof item.ref === 'string' && typeof item.color === 'string')
        .map(item => ({ ...item, color: canonicalColor(item.color), qty: Math.max(1, Number(item.qty) || 1) }));
    } catch {
      localStorage.removeItem(cartStorageKey(uid));
      return [];
    }
  };
  localStorage.removeItem('trendy-bag-order');
  let selectedProduct = null;
  let selectedColor = '';
  let selectedPreview = '';
  let authenticatedClient = false;
  let catalogSettings = {};
  let activeFolder = 'Novedades';
  let searchTerm = new URLSearchParams(location.search).get('q')?.trim().toLowerCase() || '';
  let colorFilter = '';
  let availabilityFilter = 'all';
  const MINIMUM_ORDER = 100;
  const isRegisteredClient = () => Boolean(authenticatedClient && window.TrendyAuth?.isAuthenticated?.());
  const productSettings = reference => {
    const saved = catalogSettings[reference];
    if (!saved) return {
      active: true,
      price: null,
      colors: Object.fromEntries(COLORS.map(color => [color, true])),
      folders: {Novedades:true,Bolsos:true}
    };
    return { ...saved, price: Number(saved.price) > 0 ? Number(saved.price) : null };
  };
  const safeImageUrl = value => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^data:image\/(?:webp|png|jpeg);base64,[a-z0-9+/=\s]+$/i.test(raw)) return raw;
    try {
      const url = new URL(raw, location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };
  const syncDynamicProducts = () => {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;
    // Una referencia representa siempre una sola ficha. Esta limpieza evita
    // duplicados si una pestaña antigua vuelve a emitir el catálogo o si el
    // contenido remoto llega más de una vez durante una recarga.
    const renderedReferences = new Set();
    grid.querySelectorAll('.product[data-reference]').forEach(card => {
      const reference = String(card.dataset.reference || '').trim().toUpperCase();
      if (!reference || renderedReferences.has(reference)) {
        card.remove();
        return;
      }
      card.dataset.reference = reference;
      renderedReferences.add(reference);
    });
    Object.entries(catalogSettings).forEach(([rawReference, settings]) => {
      const reference = String(rawReference || '').trim().toUpperCase();
      if (!reference || renderedReferences.has(reference)) return;
      const imageUrl = new URL(`/assets/catalogo/${encodeURIComponent(reference)}.webp`, location.origin).href;
      const card = document.createElement('article');
      card.className = 'product';
      card.dataset.reference = reference;
      card.dataset.name = settings.name || reference;
      card.dataset.dynamic = 'true';
      const imageButton = document.createElement('button');
      imageButton.className = 'product-image';
      imageButton.type = 'button';
      imageButton.setAttribute('aria-label', settings.name || reference);
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = settings.name || reference;
      image.loading = 'lazy';
      imageButton.append(image);
      const productCopy = document.createElement('div');
      productCopy.className = 'product-copy';
      const ref = document.createElement('p');
      ref.className = 'reference';
      ref.textContent = reference;
      const title = document.createElement('h3');
      title.textContent = settings.name || reference;
      const measures = document.createElement('p');
      measures.className = 'measure';
      measures.textContent = settings.measures || '';
      const hint = document.createElement('p');
      hint.className = 'product-hint';
      hint.textContent = 'Pulsa la foto para pedir';
      productCopy.append(ref, title, measures, hint);
      card.append(imageButton, productCopy);
      grid.append(card);
      renderedReferences.add(reference);
    });
  };

  const FAMILY_GROUPS = {
    Novedades: ['Bolsos de hombro', 'Bolsos de mano', 'Bolsos de piel', 'Bandoleras', 'Mochilas', 'Riñoneras', 'Bolsos de rafia/capazos', 'Bolsos de hombre', 'Viaje / Maletas', 'Viaje / Bolsas de viaje', 'Viaje / Mochilas de viaje', 'Viaje / Riñoneras', 'Monederos / Monederos de mujer', 'Monederos / Monederos de hombre', 'Cinturones / Cinturones de mujer', 'Cinturones / Cinturones de hombre', 'Complementos'],
    Bolsos: ['Bolsos de hombro', 'Bolsos de mano', 'Bolsos de piel', 'Bandoleras', 'Mochilas', 'Riñoneras', 'Bolsos de rafia/capazos', 'Bolsos de hombre'],
    Viaje: ['Viaje / Maletas', 'Viaje / Bolsas de viaje', 'Viaje / Mochilas de viaje', 'Viaje / Riñoneras'],
    Monederos: ['Monederos / Monederos de mujer', 'Monederos / Monederos de hombre'],
    Cinturones: ['Cinturones / Cinturones de mujer', 'Cinturones / Cinturones de hombre'],
    Complementos: ['Complementos']
  };
  const referenceFamily = reference => {
    const value = String(reference || '').trim().toUpperCase();
    return value.match(/^[A-Z]+/)?.[0] || value.match(/^\d{3}/)?.[0] || 'OTROS';
  };
  const familyLabel = family => family.startsWith('REF:') ? `Colección ${family.slice(4)}` : family;
  const familyForProduct = reference => `REF:${referenceFamily(reference)}`;

  const applyCatalogToPage = () => {
    syncDynamicProducts();
    let visibleCount = 0;
    const visibleProducts = [];
    document.querySelectorAll('.product').forEach(card => {
      const settings = productSettings(card.dataset.reference);
      const configuredImage = card.dataset.dynamic === 'true'
        ? new URL(`/assets/catalogo/${encodeURIComponent(card.dataset.reference)}.webp`, location.origin).href
        : safeImageUrl(settings.image);
      const cardImage = card.querySelector('.product-image img');
      if (configuredImage && cardImage && cardImage.src !== configuredImage) {
        cardImage.src = configuredImage;
      }
      const belongsToFolder = settings.folders?.[activeFolder] !== false;
      const searchable = `${card.dataset.reference} ${card.dataset.name} ${card.textContent}`.toLowerCase();
      const matchesSearch = !searchTerm || searchable.includes(searchTerm);
      const matchesColor = !colorFilter || settings.colors?.[colorFilter] !== false;
      const matchesAvailability = availabilityFilter !== 'available' || settings.active !== false;
      card.hidden = (isRegisteredClient() && settings.active === false)
        || !belongsToFolder || !matchesSearch || !matchesColor || !matchesAvailability;
      if (!card.hidden) {
        visibleCount += 1;
        visibleProducts.push({ card, family: familyForProduct(card.dataset.reference) });
      }
      let price = card.querySelector('.trade-price');
      if (!price) {
        price = document.createElement('p');
        price.className = 'trade-price';
        card.querySelector('.measure')?.after(price);
      }
      price.hidden = !isRegisteredClient() || settings.price == null;
      price.textContent = settings.price == null ? '' : `${window.TrendyCatalog?.formatPrice?.(settings.price) || settings.price.toFixed(2) + ' €'} · IVA no incluido`;
    });
    const grid = document.querySelector('.product-grid');
    grid?.querySelectorAll('.catalog-family-heading').forEach(heading => heading.remove());
    if (grid) {
      const familyOrder = FAMILY_GROUPS[activeFolder] || [activeFolder];
      visibleProducts.sort((a, b) => {
        const aIndex = familyOrder.indexOf(a.family);
        const bIndex = familyOrder.indexOf(b.family);
        const order = (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex);
        const familyOrderByName = aIndex < 0 && bIndex < 0
          ? a.family.localeCompare(b.family, 'es', { numeric: true })
          : 0;
        return order || familyOrderByName || a.card.dataset.reference.localeCompare(b.card.dataset.reference, 'es', { numeric: true });
      });
      let currentFamily = '';
      visibleProducts.forEach(({ card, family }) => {
        if (family !== currentFamily) {
          currentFamily = family;
          const heading = document.createElement('h3');
          heading.className = 'catalog-family-heading';
          heading.textContent = familyLabel(family);
          heading.style.cssText = 'grid-column:1/-1;margin:30px 0 0;padding:18px 0 10px;border-bottom:2px solid #141414;font-family:Georgia,serif;font-size:30px;font-weight:400';
          grid.append(heading);
        }
        grid.append(card);
      });
    }
    const results = document.querySelector('.catalog-results');
    if (results) results.textContent = `${visibleCount} producto${visibleCount === 1 ? '' : 's'}`;
  };

  const productGrid = document.querySelector('.product-grid');
  if (productGrid && !document.querySelector('.catalog-tools')) {
    const tools = document.createElement('div');
    tools.className = 'catalog-tools';
    tools.innerHTML = `<label>Buscar producto<input class="catalog-search" type="search" placeholder="Referencia o nombre"></label>
      <label>Color<select class="catalog-color"><option value="">Todos los colores</option>${COLORS.map(color => `<option value="${color}">${colorLabel(color)}</option>`).join('')}</select></label>
      <label>Disponibilidad<select class="catalog-availability"><option value="all">Todos</option><option value="available">Disponibles</option></select></label>
      <p class="catalog-results"></p>`;
    productGrid.before(tools);
    tools.querySelector('.catalog-search').value = searchTerm;
    tools.querySelector('.catalog-search').addEventListener('input', event => {
      searchTerm = event.target.value.trim().toLowerCase();
      applyCatalogToPage();
      window.TrendyData?.track?.('search', { query: searchTerm });
    });
    tools.querySelector('.catalog-color').addEventListener('change', event => {
      colorFilter = event.target.value;
      applyCatalogToPage();
      window.TrendyData?.track?.('filter_color', { color: colorFilter });
    });
    tools.querySelector('.catalog-availability').addEventListener('change', event => {
      availabilityFilter = event.target.value;
      applyCatalogToPage();
    });
  }

  document.querySelectorAll('.category-nav [data-folder]').forEach(link => {
    link.addEventListener('click', () => {
      activeFolder = link.dataset.folder;
      document.querySelectorAll('.category-nav [data-folder]').forEach(item => item.classList.toggle('active', item === link));
      applyCatalogToPage();
      window.TrendyData?.track?.('filter_category', { folder: activeFolder });
    });
  });

  const updatePrivateControls = () => {
    const allowed = isRegisteredClient();
    productModal.querySelector('.color-list').hidden = !allowed;
    productModal.querySelector('.quantity').hidden = !allowed;
    productModal.querySelector('.add-selected').hidden = !allowed;
    let gate = productModal.querySelector('.product-login-gate');
    if (!gate) {
      gate = document.createElement('button');
      gate.type = 'button';
      gate.className = 'product-login-gate';
      gate.style.cssText = 'width:100%;padding:16px;border:0;background:#111;color:#fff;font-weight:800;cursor:pointer';
      gate.addEventListener('click', () => {
        closeModal(productModal);
        openLogin(copy.addGate);
      });
      productModal.querySelector('.add-selected').before(gate);
    }
    gate.textContent = copy.addGate;
    gate.hidden = allowed;
    if (floatButton) floatButton.hidden = !allowed || !cart.length;
    if (headerCartCount) headerCartCount.textContent = allowed && cart.length ? cart.reduce((total, item) => total + item.qty, 0) : '';
  };

  const applyAuthState = detail => {
    authenticatedClient = Boolean(detail?.authenticated);
    currentClientUid = authenticatedClient ? String(detail?.uid || '') : '';
    cart = currentClientUid ? loadClientCart(currentClientUid) : [];
    const logoutButton = loginModal.querySelector('.logout-button');
    if (logoutButton) logoutButton.hidden = !authenticatedClient;
    if (!authenticatedClient && cartModal) cartModal.hidden = true;
    updatePrivateControls();
    applyCatalogToPage();
  };
  window.addEventListener('trendy-auth-state', event => applyAuthState(event.detail));

  window.addEventListener('trendy-catalog-state', event => {
    catalogSettings = event.detail?.catalog || {};
    applyCatalogToPage();
    updatePrivateControls();
  });

  window.TrendyAuth?.whenReady?.().then(user => {
    applyAuthState({ authenticated: Boolean(user), email: user?.email || '', uid: user?.uid || '' });
  });

  const openLogin = message => {
    loginModal.querySelector('.login-feedback').textContent = message || '';
    loginModal.hidden = false;
    document.body.style.overflow = 'hidden';
    loginModal.querySelector('input').focus();
  };
  const openRequestAccess = () => {
    openLogin('');
    if (requestAccess) requestAccess.open = true;
    requestAccess?.querySelector('input')?.focus();
  };
  document.querySelectorAll('a[href="#profesionales"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      openRequestAccess();
    });
  });
  const tradeContact = document.querySelector('#profesionales > div:last-child');
  if (tradeContact && !tradeContact.querySelector('.request-account-button')) {
    let actions = tradeContact.querySelector('.trade-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'trade-actions';
      const whatsappButton = tradeContact.querySelector('.whatsapp');
      if (whatsappButton) actions.append(whatsappButton);
      tradeContact.append(actions);
    }
    const requestButton = document.createElement('button');
    requestButton.type = 'button';
    requestButton.className = 'button light request-account-button';
    requestButton.textContent = requestButtonCopy;
    requestButton.addEventListener('click', openRequestAccess);
    actions.append(requestButton);
  }

  const closeModal = modal => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', () => closeModal(button.closest('.modal')));
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal);
    });
  });

  // Se usa la fotografía grande de cada ficha. Es mucho más nítida que las
  // miniaturas de colores y está recortada antes de textos y cotas.
  const MASTER_CROPS = {
    MC955: [0.155, 0.130, 0.390, 0.325],
    MC959: [0.135, 0.135, 0.415, 0.350],
    MC956: [0.095, 0.185, 0.445, 0.335],
    MC954: [0.135, 0.225, 0.405, 0.290],
    MC953: [0.120, 0.225, 0.420, 0.300],
    MC951: [0.120, 0.225, 0.420, 0.300],
    MC950: [0.120, 0.220, 0.420, 0.275]
  };

  const COLOR_TONES = {
    Beige: [42, 0.14, 0.34, 0.42], Taupe: [28, 0.15, 0.28, 0.42],
    'Azul marino': [228, 0.52, 0.08, 0.45], Amarillo: [48, 0.76, 0.30, 0.50],
    Marrón: [18, 0.55, 0.10, 0.42], Rojo: [3, 0.76, 0.14, 0.48],
    Morado: [248, 0.40, 0.12, 0.48], 'Verde salvia': [105, 0.22, 0.25, 0.40],
    Negro: [220, 0.06, 0.05, 0.25]
  };

  const cropFor = reference => {
    const crop = MASTER_CROPS[reference] || MASTER_CROPS.MC959;
    return { x: crop[0], y: crop[1], w: crop[2], h: crop[3] };
  };

  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const hslToRgb = (h, s, l) => {
    h /= 360;
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hueToRgb(p, q, h + 1 / 3), hueToRgb(p, q, h), hueToRgb(p, q, h - 1 / 3)].map(value => value * 255);
  };

  const recolorProduct = color => {
    const [hue, saturation, baseLightness, lightnessGain] = COLOR_TONES[color];
    const image = canvasContext.getImageData(0, 0, colorCanvas.width, colorCanvas.height);
    const pixels = image.data;
    const width = colorCanvas.width;
    const pixelCount = width * colorCanvas.height;
    const labels = new Int32Array(pixelCount);
    const queue = new Int32Array(pixelCount);
    let component = 0;
    let largestComponent = 0;
    let largestSize = 0;

    // Conserva el objeto principal y elimina líneas, letras y cifras que hayan
    // quedado aisladas alrededor de la fotografía del producto.
    for (let start = 0; start < pixelCount; start += 1) {
      const offset = start * 4;
      if (labels[start] || Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) > 225) continue;
      component += 1;
      let head = 0;
      let tail = 0;
      let size = 0;
      queue[tail++] = start;
      labels[start] = component;
      while (head < tail) {
        const index = queue[head++];
        size += 1;
        const x = index % width;
        const neighbours = [index - width, index + width, x ? index - 1 : -1, x < width - 1 ? index + 1 : -1];
        for (const next of neighbours) {
          if (next < 0 || next >= pixelCount || labels[next]) continue;
          const nextOffset = next * 4;
          if (Math.min(pixels[nextOffset], pixels[nextOffset + 1], pixels[nextOffset + 2]) > 225) continue;
          labels[next] = component;
          queue[tail++] = next;
        }
      }
      if (size > largestSize) {
        largestSize = size;
        largestComponent = component;
      }
    }

    for (let i = 0; i < pixels.length; i += 4) {
      const pixelIndex = i / 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (labels[pixelIndex] && labels[pixelIndex] !== largestComponent) {
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        continue;
      }
      if (min > 225) {
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        continue;
      }
      const lightness = (max + min) / 510;
      const pixelY = Math.floor(pixelIndex / width);
      if (pixelY > colorCanvas.height * 0.64 && lightness > 0.70) {
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        continue;
      }
      if (lightness < 0.18) continue; // cremalleras y herrajes oscuros
      const adjustedLightness = Math.min(0.88, Math.max(0.06, baseLightness + lightness * lightnessGain));
      const [nr, ng, nb] = hslToRgb(hue, saturation, adjustedLightness);
      pixels[i] = nr;
      pixels[i + 1] = ng;
      pixels[i + 2] = nb;
    }
    canvasContext.putImageData(image, 0, 0);
  };

  const createPreview = () => {
    const preview = document.createElement('canvas');
    preview.width = 320;
    preview.height = 240;
    const context = preview.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, preview.width, preview.height);
    context.drawImage(colorCanvas, 0, 0, preview.width, preview.height);
    return preview.toDataURL('image/webp', 0.82);
  };

  const showSelectedColor = (card, colorIndex) => {
    // No se inventan colores ni se amplían miniaturas. Hasta disponer de una
    // foto individual real, se conserva la ficha original sin alteraciones.
    const source = card.querySelector('img');
    selectedPreview = source.src;
    sheetImage.src = source.src;
    sheetImage.hidden = false;
    colorCanvas.hidden = true;
    const label = productModal.querySelector('.selected-color-label');
    if (label) label.textContent = `${copy.choose.replace('.', '')}: ${colorLabel(COLORS[colorIndex])}`;
  };

  const openProduct = card => {
    const settings = productSettings(card.dataset.reference);
    if (isRegisteredClient() && settings.active === false) return;
    selectedProduct = {
      ref: card.dataset.reference,
      name: card.dataset.name,
      price: settings.price
    };
    selectedColor = '';
    selectedPreview = '';
    sheetImage.src = card.querySelector('img').src;
    sheetImage.hidden = false;
    colorCanvas.hidden = true;
    const selectedLabel = productModal.querySelector('.selected-color-label');
    if (selectedLabel) selectedLabel.textContent = '';
    productModal.querySelector('.reference').textContent = selectedProduct.ref;
    productModal.querySelector('h2').textContent = selectedProduct.name;
    let modalPrice = productModal.querySelector('.modal-trade-price');
    if (!modalPrice) {
      modalPrice = document.createElement('p');
      modalPrice.className = 'modal-trade-price';
      productModal.querySelector('h2').after(modalPrice);
    }
    modalPrice.hidden = !isRegisteredClient() || settings.price == null;
    modalPrice.textContent = settings.price == null ? '' : `${window.TrendyCatalog?.formatPrice?.(settings.price) || settings.price.toFixed(2) + ' €'} · IVA no incluido`;
    productModal.querySelector('.quantity input').value = 1;
    productModal.querySelector('.error').textContent = '';
    productModal.querySelector('.modal-card').scrollTop = 0;

    const colorList = productModal.querySelector('.color-list');
    colorList.innerHTML = '';
    const colors = COLORS.filter(color => settings.colors?.[color] !== false);
    colors.forEach((color, index) => {
      const button = document.createElement('button');
      button.className = 'color-choice';
      button.type = 'button';
      button.textContent = colorLabel(color);
      button.addEventListener('click', () => {
        selectedColor = color;
        colorList.querySelectorAll('button').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        productModal.querySelector('.error').textContent = '';
        showSelectedColor(card, COLORS.indexOf(color));
      });
      colorList.append(button);
    });
    if (!colors.length) {
      productModal.querySelector('.error').textContent = 'Este producto no tiene colores disponibles actualmente.';
    }

    productModal.hidden = false;
    window.TrendyData?.track?.('product_view', { reference: selectedProduct.ref });
    updatePrivateControls();
    document.body.style.overflow = 'hidden';
  };

  productGrid?.addEventListener('click', event => {
    const button = event.target.closest('.product-image');
    if (button) openProduct(button.closest('.product'));
  });

  const saveCart = () => {
    if (currentClientUid) localStorage.setItem(cartStorageKey(currentClientUid), JSON.stringify(cart));
    if (floatButton) {
      floatButton.hidden = !isRegisteredClient() || !cart.length;
      const floatCount = floatButton.querySelector('span');
      if (floatCount) floatCount.textContent = cart.reduce((total, item) => total + item.qty, 0);
    }
    if (headerCartCount) headerCartCount.textContent = isRegisteredClient() && cart.length ? cart.reduce((total, item) => total + item.qty, 0) : '';
  };

  const orderText = orderId => {
    const lines = cart.map(item => {
      const unit = Number(item.price) > 0 ? ` × ${window.TrendyCatalog?.formatPrice?.(item.price) || item.price.toFixed(2) + ' €'}` : '';
      return `${item.ref} - ${item.name} - ${colorLabel(item.color)}: ${item.qty} ${copy.units}${unit}`;
    }).join('\n');
    const orderData = btoa(unescape(encodeURIComponent(JSON.stringify({
      id: orderId || '',
      createdAt: new Date().toISOString(),
      items: cart.map(({ ref, name, color, qty, price }) => ({ ref, name, color, qty, price }))
    }))));
    const budgetLink = `${location.origin}/presupuesto.html?pedido=${encodeURIComponent(orderData)}`;
    return `${copy.orderStart}\n${lines}\n\n${copy.orderEnd}\n\nPanel Trendy Bag: ${budgetLink}`;
  };

  const openCart = () => {
    if (!isRegisteredClient()) {
      openLogin(copy.cartGate);
      return;
    }
    cart = cart.filter(item => {
      const settings = productSettings(item.ref);
      return settings.active !== false && settings.colors?.[item.color] !== false;
    }).map(item => ({ ...item, price: productSettings(item.ref).price }));
    saveCart();
    const lines = cartModal.querySelector('.cart-lines');
    lines.innerHTML = cart.length
      ? cart.map((item, index) => `<div class="cart-line">${item.preview ? `<img class="cart-product-image" src="${item.preview}" alt="${item.ref} ${colorLabel(item.color)}">` : ''}<div class="cart-product-copy"><button data-index="${index}" aria-label="Eliminar ${item.ref}">×</button><strong>${item.ref}</strong> · ${item.name}<br><span class="cart-color">${colorLabel(item.color)}</span> · ${item.qty} unidades${item.price == null ? '' : `<br><strong>${window.TrendyCatalog?.formatPrice?.(item.price * item.qty) || (item.price * item.qty).toFixed(2) + ' €'} IVA no incluido</strong>`}</div></div>`).join('')
      : `<p class="empty">${copy.empty}</p>`;

    lines.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        cart.splice(Number(button.dataset.index), 1);
        saveCart();
        openCart();
      });
    });

    const whatsappLink = cartModal.querySelector('.send-order');
    const hasItems = cart.length > 0;
    const priced = hasItems && cart.every(item => Number.isFinite(Number(item.price)) && Number(item.price) > 0);
    const subtotal = priced ? cart.reduce((total, item) => total + Number(item.price) * item.qty, 0) : 0;
    let summary = cartModal.querySelector('.cart-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'cart-summary';
      cartModal.querySelector('.cart-actions').before(summary);
    }
    summary.hidden = !hasItems;
    summary.innerHTML = priced
      ? `<span>Total IVA no incluido</span><br><strong>${window.TrendyCatalog?.formatPrice?.(subtotal) || subtotal.toFixed(2) + ' €'}</strong>${subtotal < MINIMUM_ORDER ? `<p class="minimum-warning">El pedido mínimo es de ${MINIMUM_ORDER.toFixed(2)} € IVA no incluido. Faltan ${(MINIMUM_ORDER - subtotal).toFixed(2)} €.</p>` : ''}`
      : '<p>Solicitud sin precio cerrado. Trendy Bag confirmará disponibilidad, precios y condiciones antes de aceptar el pedido.</p>';
    const canSend = hasItems && (!priced || subtotal >= MINIMUM_ORDER);
    whatsappLink.hidden = !hasItems;
    whatsappLink.setAttribute('aria-disabled', String(!canSend));
    whatsappLink.removeAttribute('href');
    whatsappLink.dataset.canSend = String(canSend);
    whatsappLink.dataset.subtotal = String(subtotal);
    whatsappLink.dataset.priced = String(priced);
    cartModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  productModal.querySelector('.add-selected').addEventListener('click', () => {
    if (!isRegisteredClient()) {
      closeModal(productModal);
      openLogin(copy.addGate);
      return;
    }
    if (!selectedColor) {
      productModal.querySelector('.error').textContent = copy.choose;
      return;
    }
    const currentSettings = productSettings(selectedProduct.ref);
    if (currentSettings.active === false || currentSettings.colors?.[selectedColor] === false) {
      productModal.querySelector('.error').textContent = 'Este producto o color ya no está disponible.';
      return;
    }

    const qty = Math.max(1, Number(productModal.querySelector('.quantity input').value) || 1);
    selectedProduct.price = currentSettings.price;
    const existing = cart.find(item => item.ref === selectedProduct.ref && item.color === selectedColor);
    if (existing) {
      existing.qty += qty;
      existing.preview = selectedPreview || existing.preview;
    } else {
      cart.push({ ...selectedProduct, color: selectedColor, qty, preview: selectedPreview });
    }
    saveCart();
    window.TrendyData?.track?.('add_to_cart', { reference: selectedProduct.ref, color: selectedColor, quantity: qty });
    productModal.querySelector('.quantity input').value = 1;
    const addButton = productModal.querySelector('.add-selected');
    const originalLabel = addButton.textContent;
    addButton.textContent = `${colorLabel(selectedColor)} ${copy.added} ✓`;
    addButton.classList.add('added');
    window.setTimeout(() => {
      addButton.textContent = originalLabel;
      addButton.classList.remove('added');
    }, 1400);
    if (floatButton) {
      floatButton.classList.remove('just-added');
      void floatButton.offsetWidth;
      floatButton.classList.add('just-added');
    }
  });

  floatButton?.addEventListener('click', openCart);
  headerCartButton?.addEventListener('click', openCart);
  document.querySelector('#header-login')?.addEventListener('click', () => openLogin(''));
  loginModal.querySelector('.login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = form.querySelector('.login-feedback');
    const button = form.querySelector('[type="submit"]');
    feedback.textContent = '';
    button.disabled = true;
    try {
      await window.TrendyAuth.signIn(form.elements.email.value, form.elements.password.value, form.elements.remember.checked);
      feedback.textContent = copy.signedIn;
      window.setTimeout(() => closeModal(loginModal), 650);
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  loginModal.querySelector('.forgot-password').addEventListener('click', async () => {
    const email = loginModal.querySelector('.login-form [name="email"]').value.trim();
    const feedback = loginModal.querySelector('.login-feedback');
    if (!email) {
      feedback.textContent = copy.enterEmail;
      return;
    }
    try {
      await window.TrendyAuth.resetPassword(email);
      feedback.textContent = copy.resetSent;
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
  loginModal.querySelector('.logout-button').addEventListener('click', async () => {
    await window.TrendyAuth.signOut();
    loginModal.querySelector('.login-feedback').textContent = copy.signedOut;
  });
  loginModal.querySelector('.request-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const feedback = form.querySelector('.request-feedback');
    const submit = form.querySelector('[type="submit"]');
    if (data.get('requestPassword') !== data.get('requestPasswordConfirm')) {
      feedback.textContent = copy.passwordMismatch;
      return;
    }
    submit.disabled = true;
    feedback.textContent = 'Registrando solicitud…';
    let accessResult;
    try {
      accessResult = await window.TrendyAuth.requestAccess({
        company: data.get('company'),
        taxId: data.get('taxId'),
        contact: data.get('contact'),
        email: data.get('email'),
        phone: data.get('phone'),
        location: data.get('location'),
        business: data.get('business'),
        website: data.get('website'),
        message: data.get('message')
      }, data.get('requestPassword'));
    } catch (error) {
      feedback.textContent = error.message;
      submit.disabled = false;
      return;
    }
    const documentName = data.get('model036')?.name || '';
    const body = [
      'SOLICITUD DE USUARIO PROFESIONAL - TRENDY BAG',
      '',
      `Empresa / razón social: ${data.get('company')}`,
      `CIF / NIF: ${data.get('taxId')}`,
      `Persona de contacto: ${data.get('contact')}`,
      `Email profesional: ${data.get('email')}`,
      `Teléfono: ${data.get('phone')}`,
      `Ciudad y país: ${data.get('location')}`,
      `Tipo de negocio: ${data.get('business')}`,
      `Web o Instagram: ${data.get('website') || '-'}`,
      `Modelo 036 seleccionado para adjuntar: ${documentName || 'Se enviará más adelante'}`,
      '',
      `Mensaje: ${data.get('message') || '-'}`,
      '',
      documentName ? 'IMPORTANTE: adjuntar el archivo Modelo 036 a este correo antes de enviarlo.' : 'El Modelo 036 se enviará posteriormente.'
    ].join('\n');
    feedback.textContent = `${copy.pending} ${accessResult?.verificationSent ? verificationCopy : ''} ${requestSavedCopy}`.replace(/\s+/g, ' ').trim();
    form.reset();
    submit.disabled = false;
    window.location.href = `mailto:trendybag@hotmail.com?subject=${encodeURIComponent('Solicitud de usuario profesional - ' + data.get('company'))}&body=${encodeURIComponent(body)}`;
  });
  cartModal.querySelector('.clear-order').addEventListener('click', () => {
    cart = [];
    saveCart();
    openCart();
  });
  cartModal.querySelector('.send-order').addEventListener('click', async event => {
    event.preventDefault();
    const link = event.currentTarget;
    if (link.dataset.canSend !== 'true' || link.dataset.sending === 'true') return;
    link.dataset.sending = 'true';
    link.setAttribute('aria-busy', 'true');
    const originalLabel = link.textContent;
    link.textContent = 'Registrando pedido…';
    const whatsappWindow = window.open('about:blank', '_blank');
    const randomPart = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
    const orderId = `TB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomPart}`;
    const subtotal = Number(link.dataset.subtotal) || 0;
    try {
      const orderPayload = {
        id: orderId,
        items: cart.map(({ ref, name, color, qty, price }) => ({ ref, name, color, qty, price })),
        subtotal,
        minimumOrder: MINIMUM_ORDER
      };
      await window.TrendyAuth.assertApproved();
      if (window.TrendyData?.saveOrder) await window.TrendyData.saveOrder(orderPayload);
      else await window.TrendyAuth.saveOrder(orderPayload);
      const totalLine = link.dataset.priced === 'true'
        ? `Total IVA no incluido: ${subtotal.toFixed(2)} €`
        : 'Precios pendientes de confirmación por Trendy Bag.';
      const text = `${orderText(orderId)}\n\nNúmero de pedido: ${orderId}\n${totalLine}`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
      else window.location.href = whatsappUrl;
      cart = [];
      saveCart();
      closeModal(cartModal);
    } catch (error) {
      whatsappWindow?.close();
      const summary = cartModal.querySelector('.cart-summary');
      summary.innerHTML += `<p class="minimum-warning">${error.message || 'No se pudo registrar el pedido.'}</p>`;
    } finally {
      link.dataset.sending = 'false';
      link.removeAttribute('aria-busy');
      link.textContent = originalLabel;
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal(productModal);
      closeModal(cartModal);
    }
  });

  saveCart();
})();
