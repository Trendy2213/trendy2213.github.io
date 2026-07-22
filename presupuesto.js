import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const ADMIN = 'trendybag@hotmail.com';
const config = {apiKey:'AIzaSyDqp23klSLZPgaeh_7uDfcBXhT1bgbsVU4',authDomain:'trendy-bag-a6218.firebaseapp.com',projectId:'trendy-bag-a6218',storageBucket:'trendy-bag-a6218.firebasestorage.app',messagingSenderId:'564876869679',appId:'1:564876869679:web:cd02d9c9e27b37945906da'};
const auth = getAuth(initializeApp(config));
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

const quoteId = `TB-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(Date.now()).slice(-4)}`;
document.querySelector('#quote-number').value = quoteId;

const render = () => {
  lines.innerHTML = order.items.map((item,index)=>`<tr data-index="${index}"><td><select class="availability status"><option value="yes">Sí</option><option value="no">No hay</option></select></td><td><strong>${item.ref||'-'}</strong></td><td>${item.name||'-'}</td><td>${item.color||'-'}</td><td>${item.qty||1}</td><td><input class="served qty" type="number" min="0" value="${item.qty||1}"></td><td><input class="price money" type="number" min="0" step="0.01" value="0"></td><td class="subtotal">0,00 €</td></tr>`).join('');
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

render();
quote.addEventListener('input',calculate);quote.addEventListener('change',calculate);
document.querySelector('#print').onclick=()=>window.print();
document.querySelector('#copy').onclick=async()=>{await navigator.clipboard.writeText(textQuote());document.querySelector('.quote-feedback').textContent='Presupuesto copiado.'};
document.querySelector('#send').onclick=()=>window.open(`https://wa.me/?text=${encodeURIComponent(textQuote())}`,'_blank');
document.querySelector('#save').onclick=()=>{localStorage.setItem(`trendy-quote-${document.querySelector('#quote-number').value}`,JSON.stringify({order,customer:document.querySelector('#customer').value,notes:document.querySelector('#notes').value,html:lines.innerHTML,shipping:document.querySelector('#shipping').value,vat:document.querySelector('#vat').value}));document.querySelector('.quote-feedback').textContent='Borrador guardado en este ordenador.'};
document.querySelector('#logout').onclick=()=>signOut(auth);
document.querySelector('.login form').onsubmit=async event=>{event.preventDefault();const f=event.currentTarget;const feedback=f.querySelector('.feedback');try{await setPersistence(auth,f.remember.checked?browserLocalPersistence:browserSessionPersistence);const result=await signInWithEmailAndPassword(auth,f.email.value.trim(),f.password.value);if(result.user.email.toLowerCase()!==ADMIN){await signOut(auth);throw new Error('Cuenta no autorizada.')}feedback.textContent='';}catch(e){feedback.textContent=e.message==='Cuenta no autorizada.'?e.message:'Correo o contraseña incorrectos.'}};
onAuthStateChanged(auth,user=>{const allowed=user?.email?.toLowerCase()===ADMIN;login.hidden=allowed;quote.hidden=!allowed;document.querySelector('.admin-email').textContent=allowed?user.email:''});
