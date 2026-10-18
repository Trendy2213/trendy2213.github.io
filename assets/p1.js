document.querySelectorAll('[data-lang]').forEach(link=>link.addEventListener('click',()=>localStorage.setItem('trendy-language',link.dataset.lang)));
document.querySelectorAll('[data-wa-form]').forEach(form=>form.addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(form),language=form.dataset.language||'es',professional=form.dataset.type==='professional';
  const details={name:data.get('name')||'',business:data.get('business')||'',location:data.get('location')||'',models:data.get('models')||''};
  const professionalMessages={
    es:`Hola, soy profesional y me gustaría recibir información sobre el catálogo de Trendy Bag. Mi nombre es ${details.name}, mi negocio se llama ${details.business} y estoy en ${details.location}. Me interesan los modelos ${details.models}. Quisiera consultar disponibilidad, cantidades por caja y condiciones.`,
    ca:`Hola, soc professional i voldria rebre informació sobre el catàleg de Trendy Bag. Em dic ${details.name}, el meu negoci es diu ${details.business} i estic a ${details.location}. M'interessen els models ${details.models}. Voldria consultar disponibilitat, quantitats per caixa i condicions.`,
    en:`Hello, I am a trade customer and would like information about the Trendy Bag catalogue. My name is ${details.name}, my business is ${details.business} and I am located in ${details.location}. I am interested in ${details.models}. Please send me availability, carton quantities and wholesale terms.`,
    fr:`Bonjour, je suis professionnel et je souhaite recevoir des informations sur le catalogue Trendy Bag. Je m'appelle ${details.name}, mon entreprise est ${details.business} et je suis à ${details.location}. Je m'intéresse aux modèles ${details.models}. Je souhaite connaître la disponibilité, les quantités par carton et les conditions de vente en gros.`
  };
  let message='';
  if(professional){message=professionalMessages[language]||professionalMessages.es;}
  else{const title=form.dataset.product,ref=form.dataset.reference,color=data.get('color')||'',url=location.href;message=`Hola, me gustaría consultar la disponibilidad de ${title} ${ref} en color ${color}. Página: ${url}`;}
  window.TrendyAnalytics?.track?.('generate_lead',{lead_type:'whatsapp_professional_form',page_language:language});
  window.open(`https://wa.me/34688124938?text=${encodeURIComponent(message)}`,'_blank','noopener');
}));
