import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
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

const friendlyError = error => {
  const messages = {
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/user-disabled': 'Esta cuenta está desactivada. Contacta con Trendy Bag.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
    'auth/network-request-failed': 'No hay conexión. Comprueba Internet y vuelve a probar.'
    ,'auth/email-already-in-use': 'Ya existe una solicitud o cuenta con este correo. Utiliza “He olvidado mi contraseña” o contacta con Trendy Bag.'
    ,'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres.'
    ,'auth/pending-approval': 'Tu solicitud está pendiente de validación por Trendy Bag.'
  };
  return new Error(messages[error?.code] || 'No se ha podido completar la operación. Vuelve a intentarlo.');
};

let auth;
let db;
let currentUser = null;
let currentApproved = false;
let resolveAuthReady;
const authReady = new Promise(resolve => { resolveAuthReady = resolve; });
try {
  if (!firebaseConfig.apiKey) throw new Error('pending-config');
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  onAuthStateChanged(auth, async user => {
    currentUser = user;
    let approved = false;
    if (user) {
      if (user.email?.toLowerCase() === 'trendybag@hotmail.com') {
        approved = true;
      } else {
        try {
          const profile = await getDoc(doc(db, 'users', user.uid));
          approved = profile.exists() && profile.data()?.approvalStatus === 'approved';
        } catch {
          approved = false;
        }
      }
    }
    currentApproved = approved;
    resolveAuthReady?.(approved ? user : null);
    resolveAuthReady = null;
    window.dispatchEvent(new CustomEvent('trendy-auth-state', {
      detail: {
        authenticated: Boolean(user) && approved,
        pending: Boolean(user) && !approved,
        email: user?.email || ''
      }
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
    return Boolean(auth?.currentUser || currentUser) && currentApproved;
  },
  whenReady() {
    return authReady;
  },
  async signIn(email, password, remember = true) {
    if (!auth) throw new Error('Estamos terminando de activar el acceso seguro.');
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (credential.user.email?.toLowerCase() !== 'trendybag@hotmail.com') {
        const profile = await getDoc(doc(db, 'users', credential.user.uid));
        if (!profile.exists() || profile.data()?.approvalStatus !== 'approved') {
          await firebaseSignOut(auth);
          const pendingError = new Error('pending');
          pendingError.code = 'auth/pending-approval';
          throw pendingError;
        }
      }
      return credential;
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
  async requestAccess(data, password) {
    if (!auth || !db) throw new Error('Estamos terminando de activar el acceso seguro.');
    try {
      const credential = await createUserWithEmailAndPassword(auth, String(data.email || '').trim(), password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        company: data.company || '',
        taxId: data.taxId || '',
        contact: data.contact || '',
        phone: data.phone || '',
        location: data.location || '',
        business: data.business || '',
        website: data.website || '',
        message: data.message || '',
        email: credential.user.email || '',
        uid: credential.user.uid,
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await firebaseSignOut(auth);
      return true;
    } catch (error) {
      throw friendlyError(error);
    }
  },
  async signOut() {
    if (auth) await firebaseSignOut(auth);
  }
};
