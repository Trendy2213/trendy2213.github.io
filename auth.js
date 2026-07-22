import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const firebaseConfig = window.TRENDY_FIREBASE_CONFIG || {
  apiKey: 'AIzaSyDqp23klSLZPgaeh_7uDfcBXhT1bgbsVU4',
  projectId: 'trendy-bag-a6218',
  authDomain: 'trendy-bag-a6218.firebaseapp.com',
  storageBucket: 'trendy-bag-a6218.firebasestorage.app',
  messagingSenderId: '564876869679',
  appId: '1:564876869679:web:cd02d9c9e27b37945906da'
};

const friendlyError = error => {
  const messages = {
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/user-disabled': 'Esta cuenta está desactivada. Contacta con Trendy Bag.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
    'auth/network-request-failed': 'No hay conexión. Comprueba Internet y vuelve a probar.'
  };
  return new Error(messages[error?.code] || 'No se ha podido completar la operación. Vuelve a intentarlo.');
};

let auth;
let currentUser = null;
let resolveAuthReady;
const authReady = new Promise(resolve => { resolveAuthReady = resolve; });
try {
  if (!firebaseConfig.apiKey) throw new Error('pending-config');
  auth = getAuth(initializeApp(firebaseConfig));
  onAuthStateChanged(auth, user => {
    currentUser = user;
    resolveAuthReady?.(user);
    resolveAuthReady = null;
    window.dispatchEvent(new CustomEvent('trendy-auth-state', {
      detail: { authenticated: Boolean(user), email: user?.email || '' }
    }));
  });
} catch {
  resolveAuthReady?.(null);
  resolveAuthReady = null;
  window.setTimeout(() => window.dispatchEvent(new CustomEvent('trendy-auth-state', {
    detail: { authenticated: false }
  })), 0);
}

window.TrendyAuth = {
  isAuthenticated() {
    return Boolean(auth?.currentUser || currentUser);
  },
  whenReady() {
    return authReady;
  },
  async signIn(email, password, remember = true) {
    if (!auth) throw new Error('Estamos terminando de activar el acceso seguro.');
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      return await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw friendlyError(error);
    }
  },
  async resetPassword(email) {
    if (!auth) throw new Error('Estamos terminando de activar el acceso seguro.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw friendlyError(error);
    }
  },
  async signOut() {
    if (auth) await firebaseSignOut(auth);
  }
};
