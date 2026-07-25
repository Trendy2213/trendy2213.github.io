(() => {
  const lang = ['es', 'ca', 'fr', 'en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'es';
  const I18N = {
    es: { colors: ['Beige', 'Taupe', 'Azul marino', 'Amarillo', 'Marrón', 'Rojo', 'Morado', 'Verde salvia', 'Negro'], productGate: 'Solo los clientes registrados pueden consultar colores y añadir productos al pedido.', cartGate: 'Inicia sesión como cliente registrado para acceder al carrito.', addGate: 'Inicia sesión como cliente registrado para añadir productos.', choose: 'Selecciona un color.', empty: 'El pedido está vacío.', units: 'unidades', orderStart: 'Hola Trendy Bag, quiero solicitar este pedido profesional:', orderEnd: 'Quedo pendiente de confirmación de disponibilidad y condiciones.', added: 'añadido al pedido', pending: 'El acceso privado se activará cuando validemos tu cuenta profesional.', emailReady: 'Se abrirá tu correo con la solicitud preparada. Solo tendrás que pulsar Enviar.' },
    ca: { colors: ['Beix', 'Taupe', 'Blau marí', 'Groc', 'Marró', 'Vermell', 'Morat', 'Verd sàlvia', 'Negre'], productGate: 'Només els clients registrats poden consultar colors i afegir productes a la comanda.', cartGate: 'Inicia sessió com a client registrat per accedir al carretó.', addGate: 'Inicia sessió com a client registrat per afegir productes.', choose: 'Selecciona un color.', empty: 'La comanda està buida.', units: 'unitats', orderStart: 'Hola Trendy Bag, vull sol·licitar aquesta comanda professional:', orderEnd: 'Quedo pendent de la confirmació de disponibilitat i condicions.', added: 'afegit a la comanda', pending: 'L’accés privat s’activarà quan validem el teu compte professional.', emailReady: 'S’obrirà el teu correu amb la sol·licitud preparada. Només hauràs de prémer Enviar.' },
    fr: { colors: ['Beige', 'Taupe', 'Bleu marine', 'Jaune', 'Marron', 'Rouge', 'Violet', 'Vert sauge', 'Noir'], productGate: 'Seuls les clients enregistrés peuvent consulter les couleurs et ajouter des produits à la commande.', cartGate: 'Connectez-vous en tant que client enregistré pour accéder au panier.', addGate: 'Connectez-vous en tant que client enregistré pour ajouter des produits.', choose: 'Sélectionnez une couleur.', empty: 'La commande est vide.', units: 'unités', orderStart: 'Bonjour Trendy Bag, je souhaite passer cette commande professionnelle :', orderEnd: 'Dans l’attente de la confirmation des disponibilités et des conditions.', added: 'ajouté à la commande', pending: 'L’accès privé sera activé après validation de votre compte professionnel.', emailReady: 'Votre messagerie va s’ouvrir avec la demande préparée. Il vous suffira de cliquer sur Envoyer.' },
    en: { colors: ['Beige', 'Taupe', 'Navy blue', 'Yellow', 'Brown', 'Red', 'Purple', 'Sage green', 'Black'], productGate: 'Only registered customers can view colours and add products to an order.', cartGate: 'Sign in as a registered customer to access the cart.', addGate: 'Sign in as a registered customer to add products.', choose: 'Select a colour.', empty: 'Your order is empty.', units: 'units', orderStart: 'Hello Trendy Bag, I would like to place this trade order:', orderEnd: 'Please confirm availability and trade terms.', added: 'added to order', pending: 'Private access will be activated once we validate your trade account.', emailReady: 'Your email app will open with the request ready. You will only need to press Send.' }
  };
  const copy = I18N[lang];
  const documentCopy = {
    es: ['Modelo 036 *', 'Selecciona el Modelo 036. Al abrirse el correo deberás adjuntar este mismo archivo antes de enviarlo.'],
    ca: ['Model 036 *', 'Selecciona el Model 036. Quan s’obri el correu hauràs d’adjuntar aquest mateix arxiu abans d’enviar-lo.'],
    fr: ['Formulaire 036 *', 'Sélectionnez le formulaire 036. Lorsque votre messagerie s’ouvrira, joignez ce même fichier avant l’envoi.'],
    en: ['Form 036 *', 'Select Form 036. When your email app opens, attach this same file before sending.']
  }[lang];
  const enhancementStyles = document.createElement('style');
  enhancementStyles.textContent = '[hidden]{display:none!important}.document-field{grid-column:1/-1;border:1px dashed #a9a198;background:#fff;padding:18px}.document-field input{border:0!important;padding:8px 0!important;min-height:auto!important}.document-note{font-size:12px;font-weight:400;color:#666;line-height:1.5}.selected-color-label{font-weight:800;color:#e95642;min-height:20px}.modal-trade-price{font-size:20px;font-weight:900;margin:12px 0}.unavailable-message{color:#a52c20;font-weight:800}.category-nav [data-folder].active{border-color:currentColor;font-weight:900}.catalog-tools{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin:0 0 30px;padding:18px;background:#f7f4ef;border:1px solid #e4dfd7}.catalog-tools label{display:grid;gap:7px;font-size:12px;font-weight:800}.catalog-tools input,.catalog-tools select{width:100%;min-height:46px;border:1px solid #cfc9c1;background:#fff;padding:9px 11px}.catalog-results{grid-column:1/-1;margin:0;color:#666;font-size:13px}.cart-summary{padding:15px;background:#f7f4ef;border:1px solid #e4dfd7;margin:14px 0}.cart-summary strong{font-size:22px}.minimum-warning{color:#a52c20;font-weight:800}.send-order[aria-disabled="true"]{opacity:.45;pointer-events:none}@media(max-width:700px){.catalog-tools{grid-template-columns:1fr}.catalog-results{grid-column:auto}}';
  document.head.append(enhancementStyles);
  const COLORS = copy.colors;
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
    rememberLabel.innerHTML = '<input name="remember" type="checkbox" checked style="width:18px;min-height:18px;margin:0"> Recordarme en este equipo';
    passwordInput.closest('label').after(rememberLabel);
  }
  const requestGrid = loginModal.querySelector('.request-grid');
  if (requestGrid && !requestGrid.querySelector('[name="model036"]')) {
    const messageField = requestGrid.querySelector('textarea[name="message"]')?.closest('label');
    const documentField = document.createElement('label');
    documentField.className = 'document-field';
    documentField.innerHTML = `${documentCopy[0]}<input name="model036" type="file" accept=".pdf,.jpg,.jpeg,.png" required><span class="document-note">${documentCopy[1]}</span>`;
    requestGrid.insertBefore(documentField, messageField || null);
  }
  const sheetImage = productModal.querySelector('.modal-image img');
  const colorCanvas = productModal.querySelector('.selected-color-canvas');
  const canvasContext = colorCanvas.getContext('2d');

  let cart = JSON.parse(localStorage.getItem('trendy-bag-order') || '[]');
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
  const isRegisteredClient = () => authenticatedClient === true && Boolean(window.TrendyAuth?.isAuthenticated?.());
  const productSettings = reference => catalogSettings[reference] || {
    active: true,
    price: null,
    colors: Object.fromEntries(COLORS.map(color => [color, true])),
    folders: {Novedades:true,Bolsos:true}
  };
  const safeUrl = value => {
    try {
      const url = new URL(String(value), location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };
  const syncDynamicProducts = () => {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;
    Object.entries(catalogSettings).forEach(([reference, settings]) => {
      const imageUrl = safeUrl(settings.image);
      if (grid.querySelector(`[data-reference="${CSS.escape(reference)}"]`) || !imageUrl) return;
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
    });
  };

  const applyCatalogToPage = () => {
    syncDynamicProducts();
    let visibleCount = 0;
    document.querySelectorAll('.product').forEach(card => {
      const settings = productSettings(card.dataset.reference);
      const belongsToFolder = settings.folders?.[activeFolder] !== false;
      const searchable = `${card.dataset.reference} ${card.dataset.name} ${card.textContent}`.toLowerCase();
      const matchesSearch = !searchTerm || searchable.includes(searchTerm);
      const matchesColor = !colorFilter || settings.colors?.[colorFilter] !== false;
      const matchesAvailability = availabilityFilter !== 'available' || settings.active !== false;
      card.hidden = (isRegisteredClient() && settings.active === false)
        || !belongsToFolder || !matchesSearch || !matchesColor || !matchesAvailability;
      if (!card.hidden) visibleCount += 1;
      let price = card.querySelector('.trade-price');
      if (!price) {
        price = document.createElement('p');
        price.className = 'trade-price';
        card.querySelector('.measure')?.after(price);
      }
      price.hidden = !isRegisteredClient() || settings.price == null;
      price.textContent = settings.price == null ? '' : `${window.TrendyCatalog?.formatPrice?.(settings.price) || settings.price.toFixed(2) + ' €'} · sin IVA`;
    });
    const results = document.querySelector('.catalog-results');
    if (results) results.textContent = `${visibleCount} producto${visibleCount === 1 ? '' : 's'}`;
  };

  const productGrid = document.querySelector('.product-grid');
  if (productGrid && !document.querySelector('.catalog-tools')) {
    const tools = document.createElement('div');
    tools.className = 'catalog-tools';
    tools.innerHTML = `<label>Buscar producto<input class="catalog-search" type="search" placeholder="Referencia o nombre"></label>
      <label>Color<select class="catalog-color"><option value="">Todos los colores</option>${COLORS.map(color => `<option value="${color}">${color}</option>`).join('')}</select></label>
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
    floatButton.hidden = !allowed || !cart.length;
    headerCartCount.textContent = allowed && cart.length ? cart.reduce((total, item) => total + item.qty, 0) : '';
  };

  window.addEventListener('trendy-auth-state', event => {
    authenticatedClient = Boolean(event.detail?.authenticated);
    const logoutButton = loginModal.querySelector('.logout-button');
    if (logoutButton) logoutButton.hidden = !authenticatedClient;
    updatePrivateControls();
    applyCatalogToPage();
  });

  window.addEventListener('trendy-catalog-state', event => {
    catalogSettings = event.detail?.catalog || {};
    applyCatalogToPage();
    updatePrivateControls();
  });

  window.TrendyAuth?.whenReady?.().then(user => {
    authenticatedClient = Boolean(user);
    updatePrivateControls();
  });

  const openLogin = message => {
    loginModal.querySelector('.login-feedback').textContent = message || '';
    loginModal.hidden = false;
    document.body.style.overflow = 'hidden';
    loginModal.querySelector('input').focus();
  };

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
    if (label) label.textContent = `${copy.choose.replace('.', '')}: ${COLORS[colorIndex]}`;
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
    modalPrice.textContent = settings.price == null ? '' : `${window.TrendyCatalog?.formatPrice?.(settings.price) || settings.price.toFixed(2) + ' €'} · sin IVA`;
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
      button.textContent = color;
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
    localStorage.setItem('trendy-bag-order', JSON.stringify(cart));
    floatButton.hidden = !isRegisteredClient() || !cart.length;
    floatButton.querySelector('span').textContent = cart.reduce((total, item) => total + item.qty, 0);
    headerCartCount.textContent = isRegisteredClient() && cart.length ? cart.reduce((total, item) => total + item.qty, 0) : '';
  };

  const orderText = () => {
    const lines = cart.map(item => {
      const unit = item.price == null ? '' : ` × ${window.TrendyCatalog?.formatPrice?.(item.price) || item.price.toFixed(2) + ' €'}`;
      return `${item.ref} - ${item.name} - ${item.color}: ${item.qty} ${copy.units}${unit}`;
    }).join('\n');
    const orderData = btoa(unescape(encodeURIComponent(JSON.stringify({
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
      ? cart.map((item, index) => `<div class="cart-line">${item.preview ? `<img class="cart-product-image" src="${item.preview}" alt="${item.ref} ${item.color}">` : ''}<div class="cart-product-copy"><button data-index="${index}" aria-label="Eliminar ${item.ref}">×</button><strong>${item.ref}</strong> · ${item.name}<br><span class="cart-color">${item.color}</span> · ${item.qty} unidades${item.price == null ? '' : `<br><strong>${window.TrendyCatalog?.formatPrice?.(item.price * item.qty) || (item.price * item.qty).toFixed(2) + ' €'} sin IVA</strong>`}</div></div>`).join('')
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
    const priced = hasItems && cart.every(item => Number.isFinite(Number(item.price)));
    const subtotal = priced ? cart.reduce((total, item) => total + Number(item.price) * item.qty, 0) : 0;
    let summary = cartModal.querySelector('.cart-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'cart-summary';
      cartModal.querySelector('.cart-actions').before(summary);
    }
    summary.hidden = !hasItems;
    summary.innerHTML = priced
      ? `<span>Total sin IVA</span><br><strong>${window.TrendyCatalog?.formatPrice?.(subtotal) || subtotal.toFixed(2) + ' €'}</strong>${subtotal < MINIMUM_ORDER ? `<p class="minimum-warning">El pedido mínimo es de ${MINIMUM_ORDER.toFixed(2)} € sin IVA. Faltan ${(MINIMUM_ORDER - subtotal).toFixed(2)} €.</p>` : ''}`
      : '<p class="minimum-warning">Falta indicar el precio de algún producto. Trendy Bag debe completar los precios antes de enviar pedidos online.</p>';
    const canSend = hasItems && priced && subtotal >= MINIMUM_ORDER;
    whatsappLink.hidden = !hasItems;
    whatsappLink.setAttribute('aria-disabled', String(!canSend));
    whatsappLink.removeAttribute('href');
    whatsappLink.dataset.canSend = String(canSend);
    whatsappLink.dataset.subtotal = String(subtotal);
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
    addButton.textContent = `${selectedColor} ${copy.added} ✓`;
    addButton.classList.add('added');
    window.setTimeout(() => {
      addButton.textContent = originalLabel;
      addButton.classList.remove('added');
    }, 1400);
    floatButton.classList.remove('just-added');
    void floatButton.offsetWidth;
    floatButton.classList.add('just-added');
  });

  floatButton.addEventListener('click', openCart);
  headerCartButton.addEventListener('click', openCart);
  document.querySelector('#header-login').addEventListener('click', () => {
    openLogin('');
  });
  loginModal.querySelector('.login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = form.querySelector('.login-feedback');
    const button = form.querySelector('[type="submit"]');
    feedback.textContent = '';
    button.disabled = true;
    try {
      await window.TrendyAuth.signIn(form.elements.email.value, form.elements.password.value, form.elements.remember.checked);
      feedback.textContent = 'Sesión iniciada correctamente.';
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
      feedback.textContent = 'Escribe primero tu correo electrónico.';
      return;
    }
    try {
      await window.TrendyAuth.resetPassword(email);
      feedback.textContent = 'Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña. Revisa también el correo no deseado.';
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
  loginModal.querySelector('.logout-button').addEventListener('click', async () => {
    await window.TrendyAuth.signOut();
    loginModal.querySelector('.login-feedback').textContent = 'Sesión cerrada.';
  });
  loginModal.querySelector('.request-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
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
      `Modelo 036 seleccionado para adjuntar: ${data.get('model036')?.name || 'NO SELECCIONADO'}`,
      '',
      `Mensaje: ${data.get('message') || '-'}`,
      '',
      'IMPORTANTE: adjuntar el archivo Modelo 036 a este correo antes de enviarlo.'
    ].join('\n');
    form.querySelector('.request-feedback').textContent = copy.emailReady;
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
    if (link.dataset.canSend !== 'true') return;
    const orderId = `TB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-5)}`;
    const subtotal = Number(link.dataset.subtotal) || 0;
    try {
      await window.TrendyData?.saveOrder?.({
        id: orderId,
        items: cart.map(({ ref, name, color, qty, price }) => ({ ref, name, color, qty, price })),
        subtotal,
        minimumOrder: MINIMUM_ORDER
      });
      const text = `${orderText()}\n\nNúmero de pedido: ${orderId}\nTotal sin IVA: ${subtotal.toFixed(2)} €`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    } catch (error) {
      const summary = cartModal.querySelector('.cart-summary');
      summary.innerHTML += `<p class="minimum-warning">${error.message || 'No se pudo registrar el pedido.'}</p>`;
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
