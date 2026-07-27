const config = window.TRENDY_FIREBASE_CONFIG || { apiKey: 'AIzaSyDqp23klSLZPgaeh_7uDfcBXhT1bgbsVU4', projectId: 'trendy-bag-a6218' };
const SESSION_KEY = 'trendy-auth-session-v2';
const ADMIN_EMAIL = 'trendybag@hotmail.com';
const identityUrl = method => `https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(config.apiKey)}`;

const messages = {
  INVALID_LOGIN_CREDENTIALS: 'El correo o la contraseña no son correctos.',
  INVALID_EMAIL: 'El correo electrónico no es válido.',
  USER_DISABLED: 'Esta cuenta está desactivada. Contacta con Trendy Bag.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  EMAIL_NOT_FOUND: 'No existe una cuenta con este correo electrónico.',
  NETWORK_ERROR: 'No hay conexión. Comprueba Internet y vuelve a probar.',
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

const identity = (method, body) => api(identityUrl(method), {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});
const friendly = error => new Error(messages[error?.code || error?.message] || 'No se ha podido completar la operación. Vuelve a intentarlo.');
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
  authenticated: Boolean(session && approved), pending: Boolean(session && !approved), email: session?.email || ''
} }));

const approvalStatus = async value => {
  if (String(value.email || '').toLowerCase() === ADMIN_EMAIL) return true;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/users/${encodeURIComponent(value.uid)}`;
    const profile = await api(url, { headers: { Authorization: `Bearer ${value.idToken}` } });
    return profile?.fields?.approvalStatus?.stringValue === 'approved';
  } catch { return false; }
};

window.TrendyAuth = {
  isAuthenticated() { return Boolean(session && approved); },
  whenReady() { return ready; },
  async signIn(email, password, remember = true) {
    try {
      const result = await identity('signInWithPassword', { email: String(email || '').trim(), password, returnSecureToken: true });
      const next = { email: result.email || email, uid: result.localId, idToken: result.idToken, refreshToken: result.refreshToken, expiresAt: Date.now() + Number(result.expiresIn || 3600) * 1000 };
      if (!(await approvalStatus(next))) { const error = new Error('PENDING_APPROVAL'); error.code = 'PENDING_APPROVAL'; throw error; }
      session = next; approved = true; saveStored(next, remember); emit();
      return { user: { email: next.email, uid: next.uid } };
    } catch (error) { clearStored(); session = null; approved = false; emit(); throw friendly(error); }
  },
  async resetPassword(email) {
    try { await identity('sendOobCode', { requestType: 'PASSWORD_RESET', email: String(email || '').trim() }); }
    catch (error) { throw friendly(error); }
  },
  async requestAccess() { throw new Error('Envía la solicitud profesional por email.'); },
  async signOut() { clearStored(); session = null; approved = false; emit(); }
};

(async () => {
  const stored = readStored();
  if (stored && Number(stored.expiresAt || 0) > Date.now() && await approvalStatus(stored)) { session = stored; approved = true; }
  else clearStored();
  readyResolve(session && approved ? session : null); emit();
})();
