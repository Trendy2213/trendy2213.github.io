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

  const cropFor = (reference, colorIndex) => {
    const firstRow = colorIndex < 4;
    const column = firstRow ? colorIndex : colorIndex - 4;
    const compactSheet = ['MC954', 'MC953', 'MC951', 'MC950'].includes(reference);

    if (reference === 'MC955') {
      return firstRow
        ? { x: column * 0.25, y: 0.51, w: 0.25, h: 0.24 }
        : { x: column * 0.20, y: 0.75, w: 0.20, h: 0.24 };
    }

    if (compactSheet) {
      return firstRow
        ? { x: column * 0.25, y: 0.61, w: 0.25, h: 0.20 }
        : { x: column * 0.20, y: 0.79, w: 0.20, h: 0.20 };
    }

    return firstRow
      ? { x: column * 0.25, y: 0.52, w: 0.25, h: 0.24 }
      : { x: column * 0.20, y: 0.75, w: 0.20, h: 0.24 };
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

      const scale = Math.min(900 / sw, 660 / sh);
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
    openCart();
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
