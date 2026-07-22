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
  let selectedPreview = '';

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
    MC955: [0.155, 0.130, 0.390, 0.340],
    MC959: [0.135, 0.135, 0.415, 0.350],
    MC956: [0.095, 0.185, 0.445, 0.335],
    MC954: [0.120, 0.225, 0.420, 0.305],
    MC953: [0.120, 0.225, 0.420, 0.300],
    MC951: [0.120, 0.225, 0.420, 0.300],
    MC950: [0.120, 0.220, 0.420, 0.305]
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
      if (labels[start] || Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) > 242) continue;
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
          if (Math.min(pixels[nextOffset], pixels[nextOffset + 1], pixels[nextOffset + 2]) > 242) continue;
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
      if (min > 242) continue;
      const lightness = (max + min) / 510;
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
    const source = card.querySelector('img');
    const draw = () => {
      const crop = cropFor(card.dataset.reference);
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

      const scale = Math.min(820 / sw, 590 / sh);
      const width = sw * scale;
      const height = sh * scale;
      const drawX = (1000 - width) / 2;
      const drawY = (760 - height) / 2;
      canvasContext.drawImage(source, sx, sy, sw, sh, drawX, drawY, width, height);
      if (['MC954', 'MC953', 'MC951', 'MC950'].includes(card.dataset.reference)) {
        canvasContext.fillStyle = '#fff';
        canvasContext.fillRect(drawX - 2, drawY + height * 0.72, width * 0.18, height * 0.30);
      }
      recolorProduct(COLORS[colorIndex]);
      selectedPreview = createPreview();
      sheetImage.hidden = true;
      colorCanvas.hidden = false;
    };

    if (source.complete && source.naturalWidth) draw();
    else source.addEventListener('load', draw, { once: true });
  };

  const openProduct = card => {
    selectedProduct = { ref: card.dataset.reference, name: card.dataset.name };
    selectedColor = '';
    selectedPreview = '';
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
      ? cart.map((item, index) => `<div class="cart-line">${item.preview ? `<img class="cart-product-image" src="${item.preview}" alt="${item.ref} ${item.color}">` : ''}<div class="cart-product-copy"><button data-index="${index}" aria-label="Eliminar ${item.ref}">×</button><strong>${item.ref}</strong> · ${item.name}<br><span class="cart-color">${item.color}</span> · ${item.qty} unidades</div></div>`).join('')
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
    if (existing) {
      existing.qty += qty;
      existing.preview = selectedPreview || existing.preview;
    } else {
      cart.push({ ...selectedProduct, color: selectedColor, qty, preview: selectedPreview });
    }
    saveCart();
    productModal.querySelector('.quantity input').value = 1;
    const addButton = productModal.querySelector('.add-selected');
    const originalLabel = addButton.textContent;
    addButton.textContent = `${selectedColor} añadido al pedido ✓`;
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

