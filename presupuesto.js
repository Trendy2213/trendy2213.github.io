import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { doc, getFirestore, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const ADMIN = 'trendybag@hotmail.com';
const config = {apiKey:'AIzaSyDqp23klSLZPgaeh_7uDfcBXhT1bgbsVU4',authDomain:'trendy-bag-a6218.firebaseapp.com',projectId:'trendy-bag-a6218',storageBucket:'trendy-bag-a6218.firebasestorage.app',messagingSenderId:'564876869679',appId:'1:564876869679:web:cd02d9c9e27b37945906da'};
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const login = document.querySelector('.login');
const budgetLoginForm = login.querySelector('form');
const budgetRemember = document.createElement('label');
budgetRemember.style.cssText = 'display:flex;align-items:center;gap:9px';
budgetRemember.innerHTML = '<input name="remember" type="checkbox" checked style="width:18px"> Recordarme en este equipo';
budgetLoginForm.querySelector('[name="password"]').after(budgetRemember);
const quote = document.querySelector('.quote');
const lines = document.querySelector('#lines');
const money = value => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(value || 0);
let order = {items:[]};

try {
  const encoded = new URLSearchParams(location.search).get('pedido');
  if (encoded) order = JSON.parse(decodeURIComponent(escape(atob(encoded))));
} catch { order = {items:[]}; }
if (!order.items?.length) order.items = [{ref:'',name:'',color:'',qty:1}];
document.querySelector('#customer').value = order.customer?.company || order.customer?.contact || order.customerEmail || '';

const quoteId = `TB-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(Date.now()).slice(-4)}`;
document.querySelector('#quote-number').value = quoteId;

const render = () => {
  lines.innerHTML = order.items.map((item,index)=>`<tr data-index="${index}"><td><select class="availability status"><option value="yes">Sí</option><option value="no">No hay</option></select></td><td><strong>${item.ref||'-'}</strong></td><td>${item.name||'-'}</td><td>${item.color||'-'}</td><td>${item.qty||1}</td><td><input class="served qty" type="number" min="0" value="${item.qty||1}"></td><td><input class="price money" type="number" min="0" step="0.01" value="${Number(item.price || 0)}"></td><td class="subtotal">0,00 €</td></tr>`).join('');
  calculate();
};
const calculate = () => {
  let products = 0;
  lines.querySelectorAll('tr').forEach(row=>{
    const available = row.querySelector('.availability').value==='yes';
    row.classList.toggle('unavailable',!available);
    const subtotal = available ? (Number(row.querySelector('.served').value)||0)*(Number(row.querySelector('.price').value)||0) : 0;
    row.dataset.subtotal = subtotal;
    row.querySelector('.subtotal').textContent = money(subtotal);
    products += subtotal;
  });
  const shipping = Number(document.querySelector('#shipping').value)||0;
  const base = products+shipping;
  const vat = base*(Number(document.querySelector('#vat').value)||0)/100;
  document.querySelector('#base').textContent=money(base);document.querySelector('#vat-value').textContent=money(vat);document.querySelector('#total').textContent=money(base+vat);
};
const textQuote = () => {
  const number=document.querySelector('#quote-number').value;
  const customer=document.querySelector('#customer').value||'Cliente';
  const itemLines=[...lines.querySelectorAll('tr')].map((row,i)=>{
    const item=order.items[i], available=row.querySelector('.availability').value==='yes';
    return available?`✓ ${item.ref} · ${item.color} · ${row.querySelector('.served').value} uds × ${money(Number(row.querySelector('.price').value)||0)} = ${row.querySelector('.subtotal').textContent}`:`✗ ${item.ref} · ${item.color} · NO DISPONIBLE`;
  }).join('\n');
  return `TRENDY BAG · PRESUPUESTO ${number}\nCliente: ${customer}\n\n${itemLines}\n\nBase: ${document.querySelector('#base').textContent}\nIVA: ${document.querySelector('#vat-value').textContent}\nTOTAL: ${document.querySelector('#total').textContent}\n\n${document.querySelector('#notes').value||'Presupuesto sujeto a disponibilidad.'}`;
};
const quoteData = () => {
  const items = [...lines.querySelectorAll('tr')].map((row, index) => {
    const source = order.items[index] || {};
    const available = row.querySelector('.availability').value === 'yes';
    const quantity = available ? Number(row.querySelector('.served').value) || 0 : 0;
    const unitPrice = Number(row.querySelector('.price').value) || 0;
    return {
      reference: source.ref || source.reference || '',
      name: source.name || '',
      color: source.color || '',
      requestedQuantity: Number(source.qty || source.quantity || 1),
      available,
      quantity,
      unitPrice,
      subtotal: available ? quantity * unitPrice : 0
    };
  });
  const base = items.reduce((total, item) => total + item.subtotal, 0) + (Number(document.querySelector('#shipping').value) || 0);
  const vatPercent = Number(document.querySelector('#vat').value) || 0;
  const vatAmount = base * vatPercent / 100;
  return {
    number: document.querySelector('#quote-number').value,
    customer: document.querySelector('#customer').value,
    items,
    shipping: Number(document.querySelector('#shipping').value) || 0,
    vatPercent,
    base,
    vatAmount,
    total: base + vatAmount,
    notes: document.querySelector('#notes').value,
    text: textQuote()
  };
};

render();
quote.addEventListener('input',calculate);quote.addEventListener('change',calculate);
document.querySelector('#print').onclick=()=>window.print();
document.querySelector('#copy').onclick=async()=>{await navigator.clipboard.writeText(textQuote());document.querySelector('.quote-feedback').textContent='Presupuesto copiado.'};
document.querySelector('#send').onclick=()=>{
  const phone = String(order.customer?.phone || '').replace(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(textQuote())}`,'_blank');
};
document.querySelector('#save').onclick=async()=>{
  const feedback = document.querySelector('.quote-feedback');
  const data = quoteData();
  localStorage.setItem(`trendy-quote-${data.number}`, JSON.stringify({order, quote:data}));
  if (!order.id) {
    feedback.textContent='Borrador guardado en este ordenador.';
    return;
  }
  feedback.textContent='Guardando presupuesto…';
  try {
    await updateDoc(doc(db, 'orders', order.id), {
      quote: data,
      status: 'Presupuesto enviado',
      updatedAt: serverTimestamp()
    });
    feedback.textContent='Presupuesto guardado en la cuenta del cliente.';
  } catch {
    feedback.textContent='No se pudo guardar online. Se ha conservado el borrador en este ordenador.';
  }
};
document.querySelector('#logout').onclick=()=>signOut(auth);
document.querySelector('.login form').onsubmit=async event=>{event.preventDefault();const f=event.currentTarget;const feedback=f.querySelector('.feedback');try{await setPersistence(auth,f.remember.checked?browserLocalPersistence:browserSessionPersistence);const result=await signInWithEmailAndPassword(auth,f.email.value.trim(),f.password.value);if(result.user.email.toLowerCase()!==ADMIN){await signOut(auth);throw new Error('Cuenta no autorizada.')}feedback.textContent='';}catch(e){feedback.textContent=e.message==='Cuenta no autorizada.'?e.message:'Correo o contraseña incorrectos.'}};
onAuthStateChanged(auth,user=>{const allowed=user?.email?.toLowerCase()===ADMIN;login.hidden=allowed;quote.hidden=!allowed;document.querySelector('.admin-email').textContent=allowed?user.email:''});
