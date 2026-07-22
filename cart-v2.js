(() => {
  const COLORS = ['Beige', 'Taupe', 'Azul marino', 'Amarillo', 'Marrón', 'Rojo', 'Morado', 'Verde salvia', 'Negro'];
  const phone = '34688124938';
  const productModal = document.querySelector('#product-modal');
  const cartModal = document.querySelector('#cart-modal');
  const floatButton = document.querySelector('#order-float');
  const sheetImage = productModal.querySelector('.modal-image img');
  const colorCanvas = productModal.querySelector('.selected-color-canvas');
  const canvasContext = colorCanvas.getContext('2d');

  let cart = JSON.parse(localStorage.getItem('trendy-bag-order') || '[]');
  let selectedProduct = null;
  let selectedColor = '';

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

  // Recortes medidos sobre cada ficha del proveedor. Cada rectángulo contiene
  // únicamente el producto: quedan fuera referencia, medidas, nombres y unidades.
  const CROP_MAP = {
    MC955: [
      [0.080, 0.495, 0.180, 0.225], [0.305, 0.495, 0.180, 0.225],
      [0.525, 0.495, 0.180, 0.225], [0.750, 0.495, 0.185, 0.225],
      [0.015, 0.740, 0.175, 0.205], [0.210, 0.740, 0.175, 0.205],
      [0.410, 0.740, 0.180, 0.205], [0.610, 0.740, 0.180, 0.205],
      [0.810, 0.740, 0.185, 0.205]
    ],
    MC959: [
      [0.065, 0.560, 0.185, 0.190], [0.275, 0.560, 0.185, 0.190],
      [0.490, 0.560, 0.185, 0.190], [0.705, 0.560, 0.190, 0.190],
      [0.005, 0.770, 0.185, 0.190], [0.200, 0.770, 0.185, 0.190],
      [0.395, 0.770, 0.190, 0.190], [0.595, 0.770, 0.190, 0.190],
      [0.795, 0.770, 0.200, 0.190]
    ],
    MC956: [
      [0.070, 0.535, 0.185, 0.205], [0.275, 0.535, 0.185, 0.205],
      [0.485, 0.535, 0.185, 0.205], [0.695, 0.535, 0.190, 0.205],
      [0.005, 0.760, 0.185, 0.190], [0.200, 0.760, 0.185, 0.190],
      [0.395, 0.760, 0.190, 0.190], [0.595, 0.760, 0.190, 0.190],
      [0.795, 0.760, 0.200, 0.190]
    ],
    MC954: [
      [0.070, 0.620, 0.180, 0.135], [0.280, 0.620, 0.180, 0.135],
      [0.490, 0.620, 0.180, 0.135], [0.700, 0.620, 0.185, 0.135],
      [0.005, 0.790, 0.185, 0.140], [0.200, 0.790, 0.185, 0.140],
      [0.395, 0.790, 0.190, 0.140], [0.595, 0.790, 0.190, 0.140],
      [0.795, 0.790, 0.200, 0.140]
    ],
    MC953: [
      [0.070, 0.610, 0.180, 0.150], [0.280, 0.610, 0.180, 0.150],
      [0.490, 0.610, 0.180, 0.150], [0.700, 0.610, 0.185, 0.150],
      [0.005, 0.785, 0.185, 0.145], [0.200, 0.785, 0.185, 0.145],
      [0.395, 0.785, 0.190, 0.145], [0.595, 0.785, 0.190, 0.145],
      [0.795, 0.785, 0.200, 0.145]
    ],
    MC951: [
      [0.070, 0.610, 0.180, 0.150], [0.280, 0.610, 0.180, 0.150],
      [0.490, 0.610, 0.180, 0.150], [0.700, 0.610, 0.185, 0.150],
      [0.005, 0.785, 0.185, 0.145], [0.200, 0.785, 0.185, 0.145],
      [0.395, 0.785, 0.190, 0.145], [0.595, 0.785, 0.190, 0.145],
      [0.795, 0.785, 0.200, 0.145]
    ],
    MC950: [
      [0.070, 0.620, 0.180, 0.155], [0.280, 0.620, 0.180, 0.155],
      [0.490, 0.620, 0.180, 0.155], [0.700, 0.620, 0.185, 0.155],
      [0.005, 0.800, 0.185, 0.145], [0.200, 0.800, 0.185, 0.145],
      [0.395, 0.800, 0.190, 0.145], [0.595, 0.800, 0.190, 0.145],
      [0.795, 0.800, 0.200, 0.145]
    ]
  };

  const cropFor = (reference, colorIndex) => {
    const crop = CROP_MAP[reference]?.[colorIndex] || CROP_MAP.MC959[colorIndex];
    return { x: crop[0], y: crop[1], w: crop[2], h: crop[3] };
  };

  const showSelectedColor = (card, colorIndex) => {
    const source = card.querySelector('img');
    const draw = () => {
      const crop = cropFor(card.dataset.reference, colorIndex);
      const sx = Math.round(source.naturalWidth * crop.x);
      const sy = Math.round(source.naturalHeight * crop.y);
      const sw = Math.round(source.naturalWidth * crop.w);
      const sh = Math.round(source.naturalHeight * crop.h);

      colorCanvas.width = 1000;
      colorCanvas.height = 760;
      canvasContext.fillStyle = '#fff';
      canvasContext.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
      canvasContext.imageSmoothingEnabled = true;
      canvasContext.imageSmoothingQuality = 'high';

      const scale = Math.min(860 / sw, 620 / sh);
      const width = sw * scale;
      const height = sh * scale;
      canvasContext.drawImage(source, sx, sy, sw, sh, (1000 - width) / 2, (760 - height) / 2, width, height);
      sheetImage.hidden = true;
      colorCanvas.hidden = false;
    };

    if (source.complete && source.naturalWidth) draw();
    else source.addEventListener('load', draw, { once: true });
  };

  const openProduct = card => {
    selectedProduct = { ref: card.dataset.reference, name: card.dataset.name };
    selectedColor = '';
    sheetImage.src = card.querySelector('img').src;
    sheetImage.hidden = false;
    colorCanvas.hidden = true;
    productModal.querySelector('.reference').textContent = selectedProduct.ref;
    productModal.querySelector('h2').textContent = selectedProduct.name;
    productModal.querySelector('.quantity input').value = 1;
    productModal.querySelector('.error').textContent = '';
    productModal.querySelector('.modal-card').scrollTop = 0;

    const colorList = productModal.querySelector('.color-list');
    colorList.innerHTML = '';
    COLORS.forEach((color, index) => {
      const button = document.createElement('button');
      button.className = 'color-choice';
      button.type = 'button';
      button.textContent = color;
      button.addEventListener('click', () => {
        selectedColor = color;
        colorList.querySelectorAll('button').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        productModal.querySelector('.error').textContent = '';
        showSelectedColor(card, index);
      });
      colorList.append(button);
    });

    productModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  document.querySelectorAll('.product-image').forEach(button => {
    button.addEventListener('click', () => openProduct(button.closest('.product')));
  });

  const saveCart = () => {
    localStorage.setItem('trendy-bag-order', JSON.stringify(cart));
    floatButton.hidden = !cart.length;
    floatButton.querySelector('span').textContent = cart.reduce((total, item) => total + item.qty, 0);
  };

  const orderText = () => {
    const lines = cart.map(item => `${item.ref} - ${item.name} - ${item.color}: ${item.qty} unidades`).join('\n');
    return `Hola Trendy Bag, quiero solicitar este pedido profesional:\n${lines}\n\nQuedo pendiente de confirmación de disponibilidad y condiciones.`;
  };

  const openCart = () => {
    const lines = cartModal.querySelector('.cart-lines');
    lines.innerHTML = cart.length
      ? cart.map((item, index) => `<div class="cart-line"><button data-index="${index}" aria-label="Eliminar ${item.ref}">×</button><strong>${item.ref}</strong> · ${item.name}<br>${item.color} · ${item.qty} unidades</div>`).join('')
      : '<p class="empty">El pedido está vacío.</p>';

    lines.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        cart.splice(Number(button.dataset.index), 1);
        saveCart();
        openCart();
      });
    });

    const text = orderText();
    const whatsappLink = cartModal.querySelector('.send-order');
    whatsappLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    whatsappLink.hidden = !cart.length;
    cartModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  productModal.querySelector('.add-selected').addEventListener('click', () => {
    if (!selectedColor) {
      productModal.querySelector('.error').textContent = 'Selecciona un color.';
      return;
    }

    const qty = Math.max(1, Number(productModal.querySelector('.quantity input').value) || 1);
    const existing = cart.find(item => item.ref === selectedProduct.ref && item.color === selectedColor);
    if (existing) existing.qty += qty;
    else cart.push({ ...selectedProduct, color: selectedColor, qty });
    saveCart();
    closeModal(productModal);
    floatButton.classList.remove('just-added');
    void floatButton.offsetWidth;
    floatButton.classList.add('just-added');
  });

  floatButton.addEventListener('click', openCart);
  cartModal.querySelector('.clear-order').addEventListener('click', () => {
    cart = [];
    saveCart();
    openCart();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal(productModal);
      closeModal(cartModal);
    }
  });

  saveCart();
})();
