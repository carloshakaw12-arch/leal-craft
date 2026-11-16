(() => {
  const CONFIG = window.LEAL_CONFIG || {};
  const ANALYTICS = window.LEAL_ANALYTICS || {};
  const BRAND_NAME = 'Leal Craft';

  const PUBLIC_CONTACT = { instagram: CONFIG.instagram || '', facebook: CONFIG.facebook || '', email: CONFIG.email || '', area: CONFIG.areaAtendimento || 'Guapimirim • RJ' };

  const PRODUCTS = (window.LEAL_CATALOGO || []).filter(
    p => p.ativo !== false
  );

  const STORAGE = {
    cart: 'leal_craft_cart_v2',
    favorites: 'leal_craft_favorites_v2',
    intro: 'leal_craft_intro_seen_v3'
  };

  const CATEGORY_META = {
    todos: ['✳','Todos'],
    lembrancinhas: ['✿','Lembrancinhas'],
    decoracao: ['⌂','Decoração'],
    presentes: ['♡','Presentes personalizados'],
    sazonais: ['✧','Datas comemorativas'],
    infantis: ['♧','Peças infantis'],
    pecas3d: ['⬡','Peças 3D'],
    placas: ['◫','Topos, nomes e placas'],
    temas: ['✦','Temas especiais']
  };
  let cart = safeLoad(STORAGE.cart, {});
  let favorites = safeLoad(STORAGE.favorites, []);
  let activeCategory = 'todos';
  let searchTerm = '';
  let activeProduct = null;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const els = {
    catalog: $('#catalogGrid'),
    empty: $('#emptyState'),
    categoryFilters: $('#categoryFilters'),
    quickCategories: $('#quickCategories'),
    search: $('#searchInput'),

    cartBtn: $('#cartBtn'),
    cartDrawer: $('#cartDrawer'),
    cartItems: $('#cartItems'),
    cartEmpty: $('#cartEmpty'),
    cartFooter: $('#cartFooter'),
    cartCount: $('#cartCount'),
    floatingCart: $('#floatingCart'),
    floatingCount: $('#floatingCartCount'),
    cartTotalItems: $('#cartTotalItems'),

    favoritesBtn: $('#favoritesBtn'),
    favoritesDrawer: $('#favoritesDrawer'),
    favoritesItems: $('#favoritesItems'),
    favoritesEmpty: $('#favoritesEmpty'),
    favoritesFooter: $('#favoritesFooter'),
    favoritesCount: $('#favoritesCount'),

    productModal: $('#productModal'),
    modalImage: $('#modalImage'),
    modalThumbs: $('#modalThumbs'),
    modalCategory: $('#modalCategory'),
    modalTitle: $('#productModalTitle'),
    modalDescription: $('#modalDescription'),
    modalIncludes: $('#modalIncludes'),
    modalIncludesWrap: $('#modalIncludesWrap'),
    modalComplements: $('#modalComplements'),
    modalComplementsWrap: $('#modalComplementsWrap'),
    modalPrice: $('#modalPrice'),
    modalFavorite: $('#modalFavoriteBtn'),
    modalAdd: $('#modalAddBtn'),

    toast: $('#toast')
  };

  function safeLoad(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function save() {
    localStorage.setItem(STORAGE.cart, JSON.stringify(cart));
    localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites));
  }

  function getProduct(id) {
    return PRODUCTS.find(p => p.id === id);
  }

  const IMAGE_PLACEHOLDER =
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">' +
      '<rect width="1200" height="900" fill="#f7efec"/>' +
      '<circle cx="600" cy="370" r="74" fill="#ead7d3"/>' +
      '<path d="M420 590l130-135 105 105 85-80 120 110H420z" fill="#dfc3c0"/>' +
      '<text x="600" y="700" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" fill="#8c7276">Foto em atualização</text>' +
      '</svg>'
    )}`;

  function imageCandidates(img, preferred = 'md') {
    const v = img?.variantes || {};

    const order =
      preferred === 'xl'
        ? [v.xl, v.md, v.sm, img?.src]
        : preferred === 'sm'
          ? [v.sm, v.md, v.xl, img?.src]
          : [v.md, v.xl, v.sm, img?.src];

    return [...new Set(order.filter(Boolean))];
  }

  function imageSrc(img, preferred = 'md') {
    return imageCandidates(img, preferred)[0] || IMAGE_PLACEHOLDER;
  }

  function imageSrcset(img) {
    if (!img?.variantes) return '';

    const v = img.variantes;

    return [
      [v.sm, '800w'],
      [v.md, '1800w'],
      [v.xl, '2560w']
    ]
      .filter(x => x[0])
      .map(x => x.join(' '))
      .join(', ');
  }

  function imageAttrs(
    img,
    sizes = '(max-width: 780px) 50vw, 25vw'
  ) {
    const src = imageSrc(img);
    const set = imageSrcset(img);

    return `src="${src}"${
      set ? ` srcset="${set}" sizes="${sizes}"` : ''
    }`;
  }

  function isDemoImage(img) {
    const paths = [
      img?.src,
      img?.variantes?.sm,
      img?.variantes?.md,
      img?.variantes?.xl
    ].filter(Boolean);

    return paths.some(x =>
      String(x).includes('/demo/')
    );
  }

  function normalizeImages(images = []) {
    const out = [];
    const groups = new Map();

    for (const img of images || []) {
      if (
        img?.variantes &&
        Object.keys(img.variantes).length
      ) {
        out.push(img);
        continue;
      }

      const src = img?.src || '';
      const m = src.match(
        /^(.*)-(800|1800|2560)\.webp$/i
      );

      if (!m) {
        if (src) out.push(img);
        continue;
      }

      const base = m[1];
      const width = m[2];

      const key =
        width === '800'
          ? 'sm'
          : width === '1800'
            ? 'md'
            : 'xl';

      if (!groups.has(base)) {
        groups.set(base, {
          alt: img.alt || '',
          variantes: {}
        });
      }

      groups.get(base).variantes[key] = src;
    }

    out.push(...groups.values());

    const real = out.filter(
      img => !isDemoImage(img)
    );

    return real.length ? real : out;
  }

  function productImages(product) {
    return normalizeImages(
      product?.imagens || []
    );
  }

  function galleryEntries(
    gallery = [],
    preferred = 'md'
  ) {
    const seen = new Set();
    const out = [];

    (gallery || []).forEach(
      (img, imageIndex) => {
        imageCandidates(
          img,
          preferred
        ).forEach(src => {
          if (!src || seen.has(src)) return;

          seen.add(src);

          out.push({
            src,
            img,
            imageIndex
          });
        });
      }
    );

    return out;
  }

  function bindGalleryFallback(
    imgEl,
    gallery = [],
    preferred = 'md',
    onResolved = null,
    onFinalFail = null
  ) {
    if (!imgEl) return;

    const entries = galleryEntries(
      gallery,
      preferred
    );

    let index = 0;

    imgEl.removeAttribute('srcset');
    imgEl.removeAttribute('sizes');

    const tryEntry = () => {
      if (index >= entries.length) {
        imgEl.onerror = null;
        imgEl.onload = null;
        imgEl.src = IMAGE_PLACEHOLDER;

        if (
          typeof onFinalFail === 'function'
        ) {
          onFinalFail();
        }

        return;
      }

      const entry = entries[index];

      imgEl.onerror = () => {
        index += 1;
        tryEntry();
      };

      imgEl.onload = () => {
        imgEl.onerror = null;
        imgEl.onload = null;

        if (
          typeof onResolved === 'function'
        ) {
          onResolved(entry);
        }
      };

      imgEl.src = entry.src;
    };

    tryEntry();
  }

  function cartUnits() {
    return Object.values(cart).reduce(
      (sum, q) => sum + Number(q || 0),
      0
    );
  }

  function isConfigured(value) {
    return (
      value &&
      !String(value).includes('SEU_')
    );
  }

  function setBodyLock() {
    const anyOpen =
      $$('.drawer[aria-hidden="false"], .modal[aria-hidden="false"]').length >
      0;

    document.body.classList.toggle(
      'no-scroll',
      anyOpen
    );
  }

  function initMetaPixel() {
    const id = String(
      ANALYTICS.metaPixelId || ''
    ).trim();

    if (!/^\d+$/.test(id)) return;
    if (window.fbq) return;

    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;

      n=f.fbq=function(){
        n.callMethod
          ? n.callMethod.apply(n,arguments)
          : n.queue.push(arguments)
      };

      if(!f._fbq)f._fbq=n;

      n.push=n;
      n.loaded=!0;
      n.version='2.0';
      n.queue=[];

      t=b.createElement(e);
      t.async=!0;
      t.src=v;

      s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
    }(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js'
    );

    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function trackMeta(
    event,
    params = {},
    custom = false
  ) {
    if (
      typeof window.fbq !== 'function'
    ) {
      return;
    }

    window.fbq(
      custom ? 'trackCustom' : 'track',
      event,
      params
    );
  }

  // The intro uses real SVG glyph outlines. The laser traverses each contour,
  // rather than sweeping horizontally across a static word.
  function initIntro() {
    const intro = $('#entryCelebration');
    if (!intro) return;
    const skipButton = $('#skipIntroBtn');
    const svg = $('#introCraftSvg');
    const sparkLayer = $('#introSparkLayer');
    const laserHead = $('#introLaserHead');
    const fallout = $('#introFallout');
    const paths = [...intro.querySelectorAll('.intro-letter')];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const query = new URLSearchParams(location.search);
    let viewed = false;
    try { viewed = !!sessionStorage.getItem(STORAGE.intro); } catch {}
    if (reduced || query.has('skipIntro') || (viewed && !query.has('replayIntro'))) {
      intro.hidden = true;
      return;
    }

    const CUT_START = 780;
    const CUT_DURATION = 1720;
    const END_DELAY = 3550;
    const timeouts = [];
    const schedule = (fn, ms) => {
      const id = window.setTimeout(fn, ms);
      timeouts.push(id);
      return id;
    };
    let frame = 0;
    let finished = false;
    let particlesLast = -1;
    let startTime = 0;

    function woodSpark(x, y) {
      if (!sparkLayer) return;
      const chip = document.createElement('span');
      chip.className = 'intro-spark';
      // Positions are percentages, so sparks stay on the lettering in mobile layouts.
      chip.style.left = `${x}%`;
      chip.style.top = `${y}%`;
      chip.style.setProperty('--spark-x', `${(Math.random() - .5) * 50}px`);
      chip.style.setProperty('--spark-y', `${-7 - Math.random() * 28}px`);
      chip.style.setProperty('--spark-rotation', `${Math.random() * 160 - 80}deg`);
      chip.style.animationDuration = `${.38 + Math.random() * .45}s`;
      sparkLayer.appendChild(chip);
      chip.addEventListener('animationend', () => chip.remove(), { once: true });
    }

    function scatterWood() {
      if (!fallout) return;
      fallout.replaceChildren();
      const amount = Math.min(22, window.innerWidth < 520 ? 13 : 22);
      for (let i = 0; i < amount; i++) {
        const el = document.createElement('span');
        el.className = i % 5 === 0 ? 'fallout-leaf' : 'fallout-chip';
        el.style.left = `${20 + Math.random() * 60}%`;
        el.style.top = `${30 + Math.random() * 24}%`;
        el.style.setProperty('--fallout-x', `${(Math.random() - .5) * 320}px`);
        el.style.setProperty('--fallout-y', `${90 + Math.random() * 240}px`);
        el.style.setProperty('--fallout-spin', `${Math.random() * 900 - 450}deg`);
        el.style.animationDelay = `${Math.random() * .35}s`;
        fallout.appendChild(el);
      }
      schedule(() => fallout.replaceChildren(), 2400);
    }

    const strokes = paths.map(path => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.style.fillOpacity = '0';
      path.style.strokeOpacity = '0';
      return { path, len, x: Number(path.dataset.x), baseline: Number(path.dataset.baseline), scale: Number(path.dataset.scale) };
    });

    const svgWidth = svg?.viewBox.baseVal.width || 520;
    const svgHeight = svg?.viewBox.baseVal.height || 130;

    function animateLaser(now) {
      if (finished) return;
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, (elapsed - CUT_START) / CUT_DURATION));
      const charProgress = progress * strokes.length;
      const activeIndex = Math.min(strokes.length - 1, Math.floor(charProgress));
      strokes.forEach(({path,len},i) => {
        const localProgress = Math.max(0, Math.min(1, charProgress - i));
        path.style.strokeDashoffset = `${len * (1 - localProgress)}`;
        path.style.strokeOpacity = localProgress > 0 ? '1' : '0';
        path.style.fillOpacity = localProgress >= .93 ? String(Math.min(1, (localProgress - .93) / .07)) : '0';
      });
      if (elapsed >= CUT_START && progress < 1 && strokes.length && laserHead) {
        const glyph = strokes[activeIndex];
        const pt = glyph.path.getPointAtLength(glyph.len * Math.max(0, Math.min(1, charProgress - activeIndex)));
        const x = glyph.x + pt.x * glyph.scale;
        const y = glyph.baseline - pt.y * glyph.scale;
        laserHead.setAttribute('transform', `translate(${x} ${y})`);
        laserHead.style.opacity = '1';
        if (Math.floor(elapsed / 48) !== particlesLast) {
          particlesLast = Math.floor(elapsed / 48);
          woodSpark(x / svgWidth * 100, y / svgHeight * 100);
        }
      } else if (laserHead) {
        laserHead.style.opacity = '0';
      }
      if (progress < 1) {
        frame = requestAnimationFrame(animateLaser);
      } else {
        intro.classList.add('intro-engraved');
        scatterWood();
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      timeouts.forEach(clearTimeout);
      intro.classList.add('intro-exit');
      try { sessionStorage.setItem(STORAGE.intro, '1'); } catch {}
      window.setTimeout(() => { intro.hidden = true; }, 550);
      window.setTimeout(() => { fallout?.replaceChildren(); }, 1900);
    }

    skipButton?.addEventListener('click', finish, { once: true });
    intro.classList.add('entry-replay');
    frame = requestAnimationFrame(animateLaser);
    schedule(finish, END_DELAY);
  }

  function burst() { /* Intencionalmente sem confetes na Leal Craft. */ }

  function toast(msg) {
    if (!els.toast) return;

    els.toast.textContent = msg;

    els.toast.classList.add('show');

    clearTimeout(toast.timer);

    toast.timer = setTimeout(
      () =>
        els.toast.classList.remove(
          'show'
        ),
      2200
    );
  }

  function renderCategories() {
    const present = [
      'todos',
      ...Object.keys(
        CATEGORY_META
      ).filter(
        c =>
          c !== 'todos' &&
          PRODUCTS.some(
            p => p.categoria === c
          )
      )
    ];

    if (els.categoryFilters) {
      els.categoryFilters.innerHTML =
        present
          .map(
            c =>
              `<button class="filter-btn ${
                c === activeCategory
                  ? 'active'
                  : ''
              }" data-category="${c}">
                ${CATEGORY_META[c][1]}
              </button>`
          )
          .join('');
    }

    if (els.quickCategories) {
      els.quickCategories.innerHTML =
        present
          .filter(c => c !== 'todos')
          .map(
            c =>
              `<button class="quick-category" data-category="${c}">
                <span>${CATEGORY_META[c][0]}</span>
                ${CATEGORY_META[c][1]}
              </button>`
          )
          .join('');
    }

    $$('[data-category]').forEach(
      btn =>
        btn.addEventListener(
          'click',
          () => {
            activeCategory =
              btn.dataset.category;

            renderCategories();
            renderCatalog();

            const catalog =
              document.querySelector(
                '#catalogo'
              );

            if (catalog) {
              catalog.scrollIntoView({
                behavior: 'smooth'
              });
            }
          }
        )
    );
  }

  function bindImageFallback(
    imgEl,
    imgData,
    preferred = 'md',
    onFinalFail = null
  ) {
    if (!imgEl) return;

    const candidates =
      imageCandidates(
        imgData,
        preferred
      );

    let index = 0;

    imgEl.onerror = () => {
      index += 1;

      if (
        index < candidates.length
      ) {
        imgEl.removeAttribute(
          'srcset'
        );

        imgEl.src =
          candidates[index];

        return;
      }

      imgEl.removeAttribute('srcset');

      imgEl.src =
        IMAGE_PLACEHOLDER;

      imgEl.onerror = null;

      if (
        typeof onFinalFail ===
        'function'
      ) {
        onFinalFail();
      }
    };
  }

  function filteredProducts() {
    const term =
      searchTerm
        .trim()
        .toLowerCase();

    return PRODUCTS
      .filter(
        p =>
          (
            activeCategory ===
              'todos' ||
            p.categoria ===
              activeCategory
          ) &&
          (
            !term ||
            `${p.nome} ${p.categoriaNome} ${p.descricao}`
              .toLowerCase()
              .includes(term)
          )
      )
      .sort(
        (a, b) =>
          (b.destaque ? 1 : 0) -
          (a.destaque ? 1 : 0)
      );
  }

  function renderCatalog() {
    if (!els.catalog) return;

    const list =
      filteredProducts();

    if (els.empty) {
      els.empty.hidden =
        list.length > 0;
    }

    els.catalog.innerHTML =
      list
        .map(p => {
          const fav =
            favorites.includes(p.id);

          const img =
            productImages(p)[0];

          return `
            <article
              class="product-card reveal visible"
              data-id="${p.id}"
            >
              <div
                class="product-image-wrap"
                data-open-product="${p.id}"
              >
                <img
                  class="product-image"
                  src="${IMAGE_PLACEHOLDER}"
                  alt="${img?.alt || p.nome}"
                  loading="lazy"
                  decoding="async"
                >

                ${
                  p.demo
                    ? '<span class="demo-label">Imagem ilustrativa</span>'
                    : ''
                }

                <button
                  class="favorite-btn ${fav ? 'active' : ''}"
                  data-favorite="${p.id}"
                  aria-label="${
                    fav
                      ? 'Remover dos'
                      : 'Adicionar aos'
                  } favoritos"
                >
                  ${fav ? '♥' : '♡'}
                </button>
              </div>

              <div class="product-body">

                <div class="product-meta">
                  <span class="category-tag">
                    ${p.categoriaNome}
                  </span>

                  ${
                    p.destaque
                      ? '<span title="Destaque">⭐</span>'
                      : ''
                  }
                </div>

                <h3>${p.nome}</h3>

                <p>
                  ${p.descricao}
                </p>

                <div class="product-price craft-request-note"><span>Feito sob encomenda</span><strong>Personalizável</strong></div>

                <div class="product-actions">

                  <button
                    class="btn btn-secondary"
                    data-open-product="${p.id}"
                  >
                    Detalhes
                  </button>

                  <button
                    class="btn btn-primary"
                    data-add="${p.id}"
                  >
                    + Adicionar
                  </button>

                </div>
              </div>
            </article>
          `;
        })
        .join('');

    bindProductActions();

    $$('.product-image').forEach(
      imgEl => {
        const p = getProduct(
          imgEl
            .closest('[data-id]')
            ?.dataset.id
        );

        bindGalleryFallback(
          imgEl,
          productImages(p),
          'md'
        );
      }
    );
  }

  function bindProductActions() {
    $$('[data-open-product]').forEach(
      el =>
        el.addEventListener(
          'click',
          e => {
            if (
              e.target.closest(
                '[data-favorite]'
              )
            ) {
              return;
            }

            openProduct(
              el.dataset.openProduct
            );
          }
        )
    );

    $$('[data-favorite]').forEach(
      btn =>
        btn.addEventListener(
          'click',
          e => {
            e.stopPropagation();

            toggleFavorite(
              btn.dataset.favorite
            );
          }
        )
    );

    $$('[data-add]').forEach(
      btn =>
        btn.addEventListener(
          'click',
          () => {
            addToCart(
              btn.dataset.add
            );

            const r =
              btn.getBoundingClientRect();

            burst(
              r.left + r.width / 2,
              r.top + r.height / 2
            );
          }
        )
    );
  }

  function toggleFavorite(id) {
    favorites =
      favorites.includes(id)
        ? favorites.filter(
            x => x !== id
          )
        : [...favorites, id];

    save();
    updateCounts();
    renderCatalog();
    renderFavorites();

    if (
      activeProduct?.id === id &&
      els.modalFavorite
    ) {
      els.modalFavorite.classList.toggle(
        'active',
        favorites.includes(id)
      );

      els.modalFavorite.textContent =
        favorites.includes(id)
          ? '♥'
          : '♡';
    }

    toast(
      favorites.includes(id)
        ? 'Salvo nos favoritos ♡'
        : 'Removido dos favoritos'
    );
  }

  function addToCart(
    id,
    qty = 1
  ) {
    const p = getProduct(id);

    cart[id] =
      (cart[id] || 0) + qty;

    save();
    updateCounts();
    renderCart();

    if (els.cartBtn) {
      els.cartBtn.classList.remove(
        'bump'
      );

      void els.cartBtn.offsetWidth;

      els.cartBtn.classList.add(
        'bump'
      );
    }

    if (p) {
      trackMeta('AddToCart', {
        content_ids: [p.id],
        content_name: p.nome,
        content_type: 'product',
      });
    }

    toast(
      'Adicionado ao orçamento'
    );
  }

  function changeQty(
    id,
    delta
  ) {
    if (!cart[id]) return;

    cart[id] += delta;

    if (cart[id] <= 0) {
      delete cart[id];
    }

    save();
    updateCounts();
    renderCart();
  }

  function removeCart(id) {
    delete cart[id];

    save();
    updateCounts();
    renderCart();
  }

  function updateCounts() {
    const total = cartUnits();

    if (els.cartCount) {
      els.cartCount.textContent =
        total;
    }

    if (els.floatingCount) {
      els.floatingCount.textContent =
        total;
    }

    if (els.floatingCart) {
      els.floatingCart.classList.toggle(
        'visible',
        total > 0
      );
    }

    if (els.favoritesCount) {
      els.favoritesCount.textContent =
        favorites.length;
    }
  }

  function renderCart() {
    if (!els.cartItems) return;

    const items =
      Object.entries(cart)
        .map(([id, qty]) => ({
          p: getProduct(id),
          qty
        }))
        .filter(x => x.p);

    if (els.cartEmpty) {
      els.cartEmpty.hidden =
        items.length > 0;
    }

    if (els.cartFooter) {
      els.cartFooter.hidden =
        items.length === 0;
    }

    if (els.cartTotalItems) {
      els.cartTotalItems.textContent =
        cartUnits();
    }

    els.cartItems.innerHTML =
      items
        .map(
          ({ p, qty }) => `
            <div class="cart-item">

              <img
                src="${imageSrc(
                  productImages(p)[0],
                  'sm'
                )}"
                alt=""
              >

              <div>

                <h4>
                  ${p.nome}
                </h4>

                <small>
                  Sob encomenda
                </small>

                <div class="qty-control">

                  <button
                    data-qty="${p.id}"
                    data-delta="-1"
                  >
                    −
                  </button>

                  <strong>
                    ${qty}
                  </strong>

                  <button
                    data-qty="${p.id}"
                    data-delta="1"
                  >
                    +
                  </button>

                </div>
              </div>

              <button
                class="remove-item"
                data-remove="${p.id}"
                aria-label="Remover"
              >
                ×
              </button>

            </div>
          `
        )
        .join('');

    $$('[data-qty]').forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            changeQty(
              b.dataset.qty,
              Number(
                b.dataset.delta
              )
            )
        )
    );

    $$('[data-remove]').forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            removeCart(
              b.dataset.remove
            )
        )
    );
  }

  function renderFavorites() {
    if (!els.favoritesItems) return;

    const items =
      favorites
        .map(getProduct)
        .filter(Boolean);

    if (els.favoritesEmpty) {
      els.favoritesEmpty.hidden =
        items.length > 0;
    }

    if (els.favoritesFooter) {
      els.favoritesFooter.hidden =
        items.length === 0;
    }

    els.favoritesItems.innerHTML =
      items
        .map(
          p => `
            <div class="favorite-item">

              <img
                src="${imageSrc(
                  productImages(p)[0],
                  'sm'
                )}"
                alt=""
              >

              <div>

                <h4>
                  ${p.nome}
                </h4>

                <small>
                  Sob encomenda
                </small>

                <button
                  class="text-btn"
                  style="padding:6px 0;text-align:left"
                  data-fav-add="${p.id}"
                >
                  + Adicionar ao carrinho
                </button>

              </div>

              <button
                class="remove-item"
                data-fav-remove="${p.id}"
                aria-label="Remover favorito"
              >
                ×
              </button>

            </div>
          `
        )
        .join('');

    $$('[data-fav-add]').forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            addToCart(
              b.dataset.favAdd
            )
        )
    );

    $$('[data-fav-remove]').forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            toggleFavorite(
              b.dataset.favRemove
            )
        )
    );
  }

  function suggestedComplements(p) {
    const explicit = Array.isArray(p.complementos)
      ? p.complementos.map(getProduct).filter(x => x && x.id !== p.id)
      : [];
    if (explicit.length) return explicit.slice(0, 3);
    return PRODUCTS.filter(x => x.id !== p.id).slice(0, 3);
  }

  function openDrawer(drawer) {
    if (!drawer) return;

    drawer.setAttribute(
      'aria-hidden',
      'false'
    );

    setBodyLock();

    if (
      drawer === els.cartDrawer
    ) {
      trackMeta(
        'OpenCart',
        {
          items: cartUnits()
        },
        true
      );
    }
  }

  function closeDrawer(drawer) {
    if (!drawer) return;

    drawer.setAttribute(
      'aria-hidden',
      'true'
    );

    setBodyLock();
  }

  function openModal(modal) {
    if (!modal) return;

    modal.setAttribute(
      'aria-hidden',
      'false'
    );

    setBodyLock();
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    setBodyLock();
  }

  function openProduct(id) {
    const p = getProduct(id);

    if (!p) return;

    activeProduct = p;

    const gallery =
      productImages(p);

    if (els.modalImage) {
      els.modalImage.src =
        IMAGE_PLACEHOLDER;

      els.modalImage.removeAttribute(
        'srcset'
      );

      els.modalImage.alt =
        p.nome;
    }

    if (els.modalCategory) {
      els.modalCategory.textContent =
        p.categoriaNome;
    }

    if (els.modalTitle) {
      els.modalTitle.textContent =
        p.nome;
    }

    if (els.modalDescription) {
      els.modalDescription.textContent =
        p.descricao;
    }

    if (els.modalPrice) {
      els.modalPrice.textContent = 'Sob encomenda';
    }

    if (
      els.modalIncludesWrap &&
      els.modalIncludes
    ) {
      els.modalIncludesWrap.hidden =
        !p.inclui?.length;

      els.modalIncludes.innerHTML =
        (p.inclui || [])
          .map(
            x => `<li>${x}</li>`
          )
          .join('');
    }

    const complements =
      suggestedComplements(p);

    if (
      els.modalComplementsWrap &&
      els.modalComplements
    ) {
      els.modalComplementsWrap.hidden =
        !complements.length;

      els.modalComplements.innerHTML =
        complements
          .map(c => {
            const img =
              productImages(c)[0] ||
              {};

            return `
              <article class="complement-card">

                <button
                  class="complement-open"
                  data-complement-open="${c.id}"
                  aria-label="Ver ${c.nome}"
                >
                  <img
                    src="${imageSrc(img, 'sm')}"
                    alt="${img.alt || c.nome}"
                    loading="lazy"
                  >

                  <span>
                    <strong>
                      ${c.nome}
                    </strong>

                    <small>
                      Sob encomenda
                    </small>
                  </span>
                </button>

                <button
                  class="complement-add"
                  data-complement-add="${c.id}"
                >
                  + Adicionar
                </button>

              </article>
            `;
          })
          .join('');
    }

    if (els.modalThumbs) {
      els.modalThumbs.hidden =
        gallery.length <= 1;

      els.modalThumbs.innerHTML =
        gallery.length > 1
          ? gallery
              .map(
                (img, i) =>
                  `<button data-thumb="${i}">
                    <img
                      src="${IMAGE_PLACEHOLDER}"
                      alt=""
                    >
                  </button>`
              )
              .join('')
          : '';
    }

    const refreshThumbStrip = () => {
      if (!els.modalThumbs) return;

      const visible =
        $$('[data-thumb]').filter(
          btn => !btn.hidden
        );

      els.modalThumbs.hidden =
        visible.length <= 1;
    };

    $$('[data-thumb] img').forEach(
      (imgEl, i) =>
        bindGalleryFallback(
          imgEl,
          [gallery[i]],
          'sm',
          () =>
            refreshThumbStrip(),
          () => {
            const btn =
              imgEl.closest(
                '[data-thumb]'
              );

            if (btn) {
              btn.hidden = true;
            }

            refreshThumbStrip();
          }
        )
    );

    const activateThumb =
      imageIndex => {
        $$('[data-thumb]').forEach(
          x =>
            x.classList.toggle(
              'active',
              Number(
                x.dataset.thumb
              ) === imageIndex
            )
        );
      };

    bindGalleryFallback(
      els.modalImage,
      gallery,
      'xl',
      entry => {
        els.modalImage.alt =
          entry.img?.alt ||
          p.nome;

        activateThumb(
          entry.imageIndex
        );
      }
    );

    if (els.modalFavorite) {
      els.modalFavorite.classList.toggle(
        'active',
        favorites.includes(p.id)
      );

      els.modalFavorite.textContent =
        favorites.includes(p.id)
          ? '♥'
          : '♡';
    }

    $$('[data-thumb]').forEach(
      b =>
        b.addEventListener(
          'click',
          () => {
            const i =
              Number(
                b.dataset.thumb
              );

            bindGalleryFallback(
              els.modalImage,
              [gallery[i]],
              'xl',
              entry => {
                els.modalImage.alt =
                  entry.img?.alt ||
                  p.nome;

                activateThumb(i);
              }
            );
          }
        )
    );

    $$('[data-complement-open]').forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            openProduct(
              b.dataset.complementOpen
            )
        )
    );

    $$('[data-complement-add]').forEach(
      b =>
        b.addEventListener(
          'click',
          e => {
            addToCart(
              b.dataset.complementAdd
            );

            const r =
              e.currentTarget.getBoundingClientRect();

            burst(
              r.left + r.width / 2,
              r.top + r.height / 2,
              12
            );
          }
        )
    );

    trackMeta(
      'ViewContent',
      {
        content_ids: [p.id],
        content_name: p.nome,
        content_type: 'product',
      }
    );

    openModal(
      els.productModal
    );
  }

  function buildOrderMessage() {
    const items = Object.entries(cart)
      .map(([id, qty]) => ({ p: getProduct(id), qty }))
      .filter(x => x.p);
    const lines = [
      'Olá! Vi o catálogo da Leal Craft e gostaria de solicitar um orçamento.',
      '', '*Peças selecionadas:*'
    ];
    items.forEach(({ p, qty }) => lines.push(`• ${qty}x ${p.nome}`));
    lines.push('', 'Podemos conversar sobre tamanho, material, personalização e prazo?');
    return lines.join('\n');
  }

  function openWhatsApp(message) {
    if (
      !isConfigured(
        CONFIG.whatsapp
      )
    ) {
      toast(
        'Configure o WhatsApp em js/config.js'
      );

      return;
    }

    trackMeta(
      'Contact',
      {
        contact_method:
          'WhatsApp'
      }
    );

    window.open(
      `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener'
    );
  }

  function genericWhatsApp() {
    openWhatsApp(
      'Olá! Conheci a Leal Craft e gostaria de conversar sobre uma peça personalizada.'
    );
  }

  function checkout(e) {
    if (cartUnits() === 0) {
      toast(
        'Seu carrinho está vazio'
      );

      return;
    }

    const button =
      e?.currentTarget;

    if (button) {
      const r =
        button.getBoundingClientRect();

      burst(
        r.left + r.width / 2,
        r.top + r.height / 2,
        28
      );
    }

    trackMeta(
      'InitiateCheckout',
      {
        num_items: cartUnits(),
      }
    );

    closeDrawer(
      els.cartDrawer
    );

    openWhatsApp(
      buildOrderMessage()
    );
  }

  function bindStaticActions() {
    if (els.search) {
      els.search.addEventListener(
        'input',
        () => {
          searchTerm =
            els.search.value;

          renderCatalog();
        }
      );
    }

    if (els.cartBtn) {
      els.cartBtn.addEventListener(
        'click',
        () =>
          openDrawer(
            els.cartDrawer
          )
      );
    }

    if (els.floatingCart) {
      els.floatingCart.addEventListener(
        'click',
        () =>
          openDrawer(
            els.cartDrawer
          )
      );
    }

    const ctaCartBtn =
      $('#ctaCartBtn');

    if (ctaCartBtn) {
      ctaCartBtn.addEventListener(
        'click',
        () =>
          openDrawer(
            els.cartDrawer
          )
      );
    }

    if (els.favoritesBtn) {
      els.favoritesBtn.addEventListener(
        'click',
        () =>
          openDrawer(
            els.favoritesDrawer
          )
      );
    }

    $$('[data-close-drawer]').forEach(
      x =>
        x.addEventListener(
          'click',
          () =>
            closeDrawer(
              els.cartDrawer
            )
        )
    );

    $$('[data-close-favorites]').forEach(
      x =>
        x.addEventListener(
          'click',
          () =>
            closeDrawer(
              els.favoritesDrawer
            )
        )
    );

    $$('[data-close-product]').forEach(
      x =>
        x.addEventListener(
          'click',
          () =>
            closeModal(
              els.productModal
            )
        )
    );

    const clearCartBtn =
      $('#clearCartBtn');

    if (clearCartBtn) {
      clearCartBtn.addEventListener(
        'click',
        () => {
          cart = {};

          save();
          updateCounts();
          renderCart();

          toast(
            'Carrinho limpo'
          );
        }
      );
    }

    const checkoutBtn =
      $('#checkoutBtn');

    if (checkoutBtn) {
      checkoutBtn.addEventListener(
        'click',
        checkout
      );
    }

    const addAllFavoritesBtn =
      $('#addAllFavoritesBtn');

    if (addAllFavoritesBtn) {
      addAllFavoritesBtn.addEventListener(
        'click',
        () => {
          favorites.forEach(
            id =>
              cart[id] =
                (cart[id] || 0) + 1
          );

          save();
          updateCounts();
          renderCart();

          closeDrawer(
            els.favoritesDrawer
          );

          openDrawer(
            els.cartDrawer
          );

          toast(
            'Favoritos adicionados'
          );
        }
      );
    }

    if (els.modalFavorite) {
      els.modalFavorite.addEventListener(
        'click',
        () =>
          activeProduct &&
          toggleFavorite(
            activeProduct.id
          )
      );
    }

    if (els.modalAdd) {
      els.modalAdd.addEventListener(
        'click',
        e => {
          if (!activeProduct) {
            return;
          }

          addToCart(
            activeProduct.id
          );

          const r =
            e.currentTarget.getBoundingClientRect();

          burst(
            r.left + r.width / 2,
            r.top + r.height / 2,
            18
          );
        }
      );
    }

    const heroWhatsappBtn =
      $('#heroWhatsappBtn');

    if (heroWhatsappBtn) {
      heroWhatsappBtn.addEventListener(
        'click',
        genericWhatsApp
      );
    }

    const ctaWhatsappBtn =
      $('#ctaWhatsappBtn');

    if (ctaWhatsappBtn) {
      ctaWhatsappBtn.addEventListener(
        'click',
        genericWhatsApp
      );
    }

    const footerWhatsappBtn =
      $('#footerWhatsappBtn');

    if (footerWhatsappBtn) {
      footerWhatsappBtn.addEventListener(
        'click',
        genericWhatsApp
      );
    }

    document.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Escape') {
          closeDrawer(
            els.cartDrawer
          );

          closeDrawer(
            els.favoritesDrawer
          );

          closeModal(
            els.productModal
          );
        }
      }
    );
  }

  function setupBusinessInfo() {
    const year = $('#year');

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }

    const area =
      $('#serviceArea');

    if (area) {
      area.textContent =
        PUBLIC_CONTACT.area;
    }

    const ig =
      $('#instagramLink');

    if (ig) {
      ig.hidden = !PUBLIC_CONTACT.instagram;
      if (PUBLIC_CONTACT.instagram) ig.href = PUBLIC_CONTACT.instagram;
      ig.target = '_blank';
      ig.rel = 'noopener noreferrer';
    }

    const fb =
      $('#facebookLink');

    if (fb) {
      fb.hidden = !PUBLIC_CONTACT.facebook;
      if (PUBLIC_CONTACT.facebook) fb.href = PUBLIC_CONTACT.facebook;
      fb.target = '_blank';
      fb.rel = 'noopener noreferrer';
    }

    const email =
      $('#emailLink');

    if (email) {
      email.hidden = !PUBLIC_CONTACT.email;
      if (PUBLIC_CONTACT.email) email.href = `mailto:${PUBLIC_CONTACT.email}`;
      email.textContent = PUBLIC_CONTACT.email;
    }
  }

  function setupReveal() {
    if (
      typeof IntersectionObserver ===
      'undefined'
    ) {
      $$('.reveal').forEach(
        el =>
          el.classList.add(
            'visible'
          )
      );

      return;
    }

    const io =
      new IntersectionObserver(
        entries =>
          entries.forEach(
            e => {
              if (
                e.isIntersecting
              ) {
                e.target.classList.add(
                  'visible'
                );

                io.unobserve(
                  e.target
                );
              }
            }
          ),
        {
          threshold: 0.1
        }
      );

    $$('.reveal').forEach(
      el => io.observe(el)
    );
  }

  initMetaPixel();
  initIntro();
  renderCategories();
  renderCatalog();
  renderCart();
  renderFavorites();
  updateCounts();
  bindStaticActions();
  setupBusinessInfo();
  setupReveal();
})();