(() => {
  'use strict';
  const categories = ["Celulares","Computación","Audio y TV","Videojuegos","Electrodomésticos","Hogar","Cocina","Muebles","Moda Mujer","Moda Hombre","Calzado","Accesorios","Deportes","Belleza","Salud y Bienestar","Juguetes","Bebés","Mascotas","Libros","Papelería","Herramientas","Automotriz","Jardín","Supermercado","Instrumentos"];
  const $ = id => document.getElementById(id);

  // Cambio de fondo: conserva la imagen elegida en este navegador.
  const BACKGROUND_STORAGE_KEY = 'umatronix.background.v1';
  const backgroundInput = $('backgroundInput');
  const changeBackgroundBtn = $('changeBackgroundBtn');
  function applySavedBackground(){
    try {
      const savedBackground = localStorage.getItem(BACKGROUND_STORAGE_KEY);
      if (savedBackground && savedBackground.startsWith('data:image/')) {
        document.body.style.backgroundImage = `url("${savedBackground}")`;
      }
    } catch (error) {
      // Si el navegador bloquea el almacenamiento, la página sigue funcionando.
    }
  }
  if (changeBackgroundBtn && backgroundInput) {
    changeBackgroundBtn.addEventListener('click', () => backgroundInput.click());
    backgroundInput.addEventListener('change', event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Selecciona un archivo de imagen válido.');
        backgroundInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const src = String(reader.result || '');
        if (!src.startsWith('data:image/')) return;
        document.body.style.backgroundImage = `url("${src}")`;
        try {
          localStorage.setItem(BACKGROUND_STORAGE_KEY, src);
        } catch (error) {
          alert('El fondo se aplicó, pero el navegador no pudo guardarlo para la próxima visita. Prueba con una imagen más pequeña.');
        }
      });
      reader.addEventListener('error', () => alert('No se pudo leer la imagen. Intenta con otra.'));
      reader.readAsDataURL(file);
      backgroundInput.value = '';
    });
  }
  applySavedBackground();

  const grid = $('itemsGrid'), empty = $('emptyState'), addDialog = $('addDialog'), listDialog = $('listDialog'), confirmDialog = $('confirmDialog');
  const select = $('elementCategory');
  let activeCategory = 'Todas';
  let deleteTarget = null;
  const STORAGE_KEY = 'umatronix.catalog.v3';
  const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function formatPrice(value){
    return '$ ' + Number(value).toLocaleString('es-CO', { maximumFractionDigits: 2 });
  }

  function makeId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }


  // Catálogo de ejemplo: se carga solo la primera vez (cuando no hay datos guardados).
  const SEED_ITEMS = {
    "Celulares":["Smartphone 128 GB","Smartphone gama alta","Funda protectora","Cargador rápido USB-C","Audífonos inalámbricos"],
    "Computación":["Portátil 15 pulgadas","Mouse inalámbrico","Teclado mecánico","Disco SSD 1 TB","Monitor 24 pulgadas"],
    "Audio y TV":["Smart TV 50 pulgadas","Barra de sonido","Parlante Bluetooth","Audífonos con cancelación de ruido","Soporte de pared para TV"],
    "Videojuegos":["Consola de videojuegos","Control inalámbrico","Silla gamer","Tarjeta de regalo","Auriculares gamer"],
    "Electrodomésticos":["Nevera","Lavadora","Microondas","Aspiradora","Ventilador de torre"],
    "Hogar":["Juego de sábanas","Lámpara de mesa","Cortinas","Organizador multiuso","Set de toallas"],
    "Cocina":["Olla a presión","Juego de cuchillos","Licuadora","Sartén antiadherente","Cafetera"],
    "Muebles":["Sofá de tres puestos","Escritorio","Mesa de comedor","Biblioteca","Cama doble"],
    "Moda Mujer":["Vestido casual","Blusa estampada","Jeans de tiro alto","Chaqueta ligera","Falda midi"],
    "Moda Hombre":["Camiseta básica","Jeans clásicos","Camisa de vestir","Sudadera con capucha","Chaqueta impermeable"],
    "Calzado":["Tenis deportivos","Botas de cuero","Sandalias","Zapatos formales","Zapatillas casuales"],
    "Accesorios":["Reloj de pulsera","Billetera","Gafas de sol","Mochila","Cinturón de cuero"],
    "Deportes":["Balón de fútbol","Pesas ajustables","Colchoneta de yoga","Bicicleta","Guantes de entrenamiento"],
    "Belleza":["Perfume","Kit de maquillaje","Crema hidratante","Secador de cabello","Set de brochas"],
    "Salud y Bienestar":["Multivitamínico","Termómetro digital","Tensiómetro","Masajeador","Botiquín básico"],
    "Juguetes":["Bloques de construcción","Muñeca","Carro de control remoto","Rompecabezas","Juego de mesa"],
    "Bebés":["Coche para bebé","Pañales","Biberón","Cuna","Móvil musical"],
    "Mascotas":["Alimento para perro","Rascador para gato","Cama para mascota","Correa ajustable","Juguete mordedor"],
    "Libros":["Novela de ficción","Libro de cocina","Libro infantil","Cómic","Libro de autoayuda"],
    "Papelería":["Cuaderno universitario","Set de lapiceros","Resaltadores","Agenda","Carpeta organizadora"],
    "Herramientas":["Taladro inalámbrico","Juego de destornilladores","Caja de herramientas","Cinta métrica","Nivel de burbuja"],
    "Automotriz":["Aceite de motor","Cargador para carro","Cubre asientos","Kit de emergencia","Aspiradora de auto"],
    "Jardín":["Manguera","Tijeras de podar","Maceta grande","Semillas de flores","Regadera"],
    "Supermercado":["Arroz","Aceite de cocina","Café molido","Pasta","Leche en caja"],
    "Instrumentos":["Guitarra acústica","Teclado musical","Ukelele","Flauta dulce","Afinador digital"]
  };
  function seedCatalogs(map){
    categories.forEach(category => {
      map[category] = (SEED_ITEMS[category] || []).map(name => ({ id: makeId(), name, category, inList: false, image: '' }));
    });
    return map;
  }

  function createCatalogMap(){
    const map = {};
    categories.forEach(name => { map[name] = []; });
    return map;
  }

  function normalizeItem(item){
    if (!item || typeof item !== 'object') return null;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) return null;

    const category = typeof item.category === 'string' && categories.includes(item.category)
      ? item.category
      : categories[0];

    return {
      id: typeof item.id === 'string' && item.id ? item.id : makeId(),
      name,
      category,
      inList: Boolean(item.inList),
      image: typeof item.image === 'string' && item.image.startsWith('data:image/') ? item.image : '',
      price: typeof item.price === 'number' && isFinite(item.price) && item.price >= 0 ? item.price : null
    };
  }

  function loadCatalogs(){
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const map = createCatalogMap();
      if (stored === null) {
        seedCatalogs(map);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (e) {}
        return map;
      }
      const raw = JSON.parse(stored || '{}');

      if (Array.isArray(raw)) {
        raw.forEach(item => {
          const normalized = normalizeItem(item);
          if (!normalized) return;
          if (!map[normalized.category]) map[normalized.category] = [];
          map[normalized.category].push(normalized);
        });
        return map;
      }

      if (raw && typeof raw === 'object') {
        categories.forEach(category => {
          const items = Array.isArray(raw[category]) ? raw[category] : [];
          map[category] = items.map(normalizeItem).filter(Boolean);
        });
      }

      return map;
    } catch (error) {
      return createCatalogMap();
    }
  }

  let catalogs = loadCatalogs();
  let items = [];

  function getAllItems(){
    return categories.reduce((all, category) => all.concat(catalogs[category] || []), []);
  }

  function persist(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogs));
    } catch (error) {
      alert('No se pudo guardar en el navegador (posiblemente por exceso de imágenes). Prueba con imágenes más pequeñas.');
    }
  }

  function getCategoryItems(category){
    return category === 'Todas' ? getAllItems() : (catalogs[category] || []);
  }

  function findItemById(id){
    return getAllItems().find(item => item.id === id) || null;
  }

  function findCategoryForItem(id){
    return categories.find(category => (catalogs[category] || []).some(item => item.id === id)) || null;
  }

  categories.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  function render(){
    items = getAllItems();
    const shown = getCategoryItems(activeCategory);
    grid.innerHTML = shown.map(item => `<article class="item-card">${item.image ? `<img class="item-image" src="${item.image}" alt="${safe(item.name)}">` : ''}<div class="item-card-top"><div><div class="item-name">${safe(item.name)}</div><div class="item-category">${safe(item.category)}</div>${item.price !== null && item.price !== undefined ? `<div class="item-price">${safe(formatPrice(item.price))}</div>` : ''}</div><button type="button" class="small-action ${item.inList ? 'selected' : ''}" data-action="list" data-id="${item.id}" aria-label="${item.inList ? 'Quitar de mi lista' : 'Agregar a mi lista'}">${item.inList ? 'En lista' : 'Añadir'}</button></div><div class="item-actions"><button type="button" class="small-action" data-action="edit" data-id="${item.id}">Editar</button><button type="button" class="small-action remove" data-action="delete" data-id="${item.id}">Eliminar</button></div></article>`).join('');

    const hasItems = shown.length > 0;
    empty.classList.toggle('hidden', hasItems);
    $('summary').textContent = `${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}`;
    $('itemCount').textContent = items.filter(item => item.inList).length;
    $('activeCaption').textContent = activeCategory === 'Todas' ? 'Explora las categorías de la tienda.' : `Categoría: ${activeCategory}`;
    $('clearFilter').hidden = activeCategory === 'Todas';
    $('emptyTitle').textContent = activeCategory === 'Todas' ? 'Tu catálogo está vacío' : `Todavía no hay elementos en ${activeCategory}`;
    $('emptyText').textContent = activeCategory === 'Todas' ? 'Agrega un elemento cuando estés listo y asígnalo a una categoría.' : 'Puedes agregar un elemento directamente a esta categoría.';
    renderList();
  }

  let currentImage = '';
  const imageInput = $('elementImage'), imagePreview = $('imagePreview'), imagePreviewBox = $('imagePreviewBox');
  function setImage(src){
    currentImage = src || '';
    imagePreview.src = currentImage;
    imagePreviewBox.hidden = !currentImage;
  }
  // Reduce la imagen para que quepa en el almacenamiento del navegador.
  function resizeImage(file, callback){
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const img = new Image();
      img.addEventListener('load', () => {
        const max = 600;
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.8));
      });
      img.addEventListener('error', () => alert('No se pudo leer la imagen. Intenta con otra.'));
      img.src = String(reader.result || '');
    });
    reader.addEventListener('error', () => alert('No se pudo leer la imagen. Intenta con otra.'));
    reader.readAsDataURL(file);
  }
  imageInput.addEventListener('change', () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecciona un archivo de imagen válido.'); imageInput.value = ''; return; }
    resizeImage(file, setImage);
    imageInput.value = '';
  });
  $('removeImage').addEventListener('click', () => setImage(''));

  function openAdd(item = null){
    setImage(item ? item.image : '');
    $('elementPrice').value = item && item.price !== null && item.price !== undefined ? item.price : '';
    $('addForm').dataset.editing = item ? item.id : '';
    $('elementName').value = item ? item.name : '';
    select.value = item ? item.category : (activeCategory === 'Todas' ? categories[0] : activeCategory);
    $('addDialog').querySelector('h2').textContent = item ? 'Editar elemento' : 'Agregar elemento';
    $('addForm').querySelector('button[type="submit"]').textContent = item ? 'Guardar cambios' : 'Guardar elemento';
    addDialog.showModal();
    requestAnimationFrame(() => $('elementName').focus());
  }

  function closeAdd(){ addDialog.close(); }
  const loginDialog = $('loginDialog');
  $('openLogin').addEventListener('click', () => { $('loginNotice').hidden = true; $('loginNotice').textContent = ''; loginDialog.showModal(); });
  $('closeLogin').addEventListener('click', () => loginDialog.close());
  $('cancelLogin').addEventListener('click', () => loginDialog.close());
  $('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    $('loginNotice').textContent = 'La pantalla de inicio de sesión está lista, pero aún no está conectada a un sistema de cuentas. No se enviaron ni guardaron tus datos.';
    $('loginNotice').hidden = false;
  });

  $('openAdd').addEventListener('click', () => openAdd());
  $('emptyAdd').addEventListener('click', () => openAdd());
  $('closeAdd').addEventListener('click', closeAdd);
  $('cancelAdd').addEventListener('click', closeAdd);
  $('addForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('elementName').value.trim();
    if (!name) {
      $('elementName').focus();
      return;
    }

    const priceRaw = $('elementPrice').value.trim();
    const priceNumber = priceRaw === '' ? null : Number(priceRaw);
    const price = priceNumber !== null && isFinite(priceNumber) && priceNumber >= 0 ? priceNumber : null;

    const editingId = event.currentTarget.dataset.editing;
    const selectedCategory = select.value;

    if (editingId) {
      const current = findItemById(editingId);
      if (current) {
        const oldCategory = current.category;
        if (oldCategory && oldCategory !== selectedCategory) {
          catalogs[oldCategory] = (catalogs[oldCategory] || []).filter(item => item.id !== editingId);
        }

        if (oldCategory && oldCategory === selectedCategory) {
          const targetList = catalogs[selectedCategory] || [];
          const index = targetList.findIndex(item => item.id === editingId);
          if (index >= 0) {
            targetList[index] = { ...targetList[index], name, category: selectedCategory, image: currentImage, price };
          }
        } else {
          const targetList = catalogs[selectedCategory] || [];
          targetList.push({ ...current, name, category: selectedCategory, image: currentImage, price });
          catalogs[selectedCategory] = targetList;
        }
      }
    } else {
      const categoryList = catalogs[selectedCategory] || [];
      categoryList.push({ id: makeId(), name, category: selectedCategory, inList: false, image: currentImage, price });
      catalogs[selectedCategory] = categoryList;
    }

    persist();
    closeAdd();
    render();
  });

  $('categoryBar').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    document.querySelectorAll('.category').forEach(el => {
      const active = el === button;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    render();
  });

  const categoryBar = $('categoryBar');
  $('scrollLeft').addEventListener('click', () => categoryBar.scrollBy({ left: -Math.max(280, categoryBar.clientWidth * .7), behavior: 'smooth' }));
  $('scrollRight').addEventListener('click', () => categoryBar.scrollBy({ left: Math.max(280, categoryBar.clientWidth * .7), behavior: 'smooth' }));
  categoryBar.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      categoryBar.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }, { passive: false });

  $('clearFilter').addEventListener('click', () => {
    const all = document.querySelector('[data-category="Todas"]');
    if (all) all.click();
  });
  $('backToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const item = findItemById(button.dataset.id);
    if (!item) return;

    if (button.dataset.action === 'list') {
      item.inList = !item.inList;
      const category = findCategoryForItem(item.id);
      if (category) {
        const categoryList = catalogs[category] || [];
        const index = categoryList.findIndex(entry => entry.id === item.id);
        if (index >= 0) categoryList[index].inList = item.inList;
      }
      persist();
      render();
    }

    if (button.dataset.action === 'edit') openAdd(item);
    if (button.dataset.action === 'delete') askDelete(item);
  });

  function renderList(){
    const chosen = getAllItems().filter(item => item.inList);
    $('listContents').innerHTML = chosen.length
      ? chosen.map(item => `<div class="list-row"><div><strong>${safe(item.name)}</strong><span>${safe(item.category)}${item.price !== null && item.price !== undefined ? ' · ' + safe(formatPrice(item.price)) : ''}</span></div><button type="button" class="small-action remove" data-unlist="${item.id}">Quitar</button></div>`).join('')
      : '<div class="list-empty">Todavía no tienes elementos en tu lista.</div>';
    $('clearList').disabled = chosen.length === 0;
  }

  $('openList').addEventListener('click', () => { renderList(); listDialog.showModal(); });
  $('closeList').addEventListener('click', () => listDialog.close());
  $('doneList').addEventListener('click', () => listDialog.close());
  $('listContents').addEventListener('click', event => {
    const button = event.target.closest('[data-unlist]');
    if (!button) return;
    const item = findItemById(button.dataset.unlist);
    if (!item) return;
    item.inList = false;
    const category = findCategoryForItem(item.id);
    if (category) {
      const categoryList = catalogs[category] || [];
      const index = categoryList.findIndex(entry => entry.id === item.id);
      if (index >= 0) categoryList[index].inList = false;
    }
    persist();
    render();
  });

  $('clearList').addEventListener('click', () => {
    categories.forEach(category => {
      (catalogs[category] || []).forEach(item => { item.inList = false; });
    });
    persist();
    render();
  });

  function askDelete(item){
    deleteTarget = item.id;
    $('confirmText').textContent = `Se eliminará “${item.name}” del catálogo.`;
    confirmDialog.showModal();
  }

  function closeConfirm(){ deleteTarget = null; confirmDialog.close(); }
  $('cancelDelete').addEventListener('click', closeConfirm);
  $('cancelDeleteX').addEventListener('click', closeConfirm);
  $('confirmDelete').addEventListener('click', () => {
    if (deleteTarget) {
      const category = findCategoryForItem(deleteTarget);
      if (category) {
        catalogs[category] = (catalogs[category] || []).filter(item => item.id !== deleteTarget);
      }
      persist();
      render();
    }
    closeConfirm();
  });

  [addDialog, loginDialog, listDialog, confirmDialog].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  }));

  // PRUEBA_DE_MODIFICACION_2026_10_21_02_56
  render();
})();
