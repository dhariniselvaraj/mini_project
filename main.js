/* SURYA TRADERS - shared site behaviour (loaded on every page)
   Needs products-data.js first. Sections:
   1. Helpers & storage      5. Enquiry cart
   2. Navigation & header    6. Wishlist
   3. Reveal & lazy images   7. Product details modal + image lightbox
   4. Toasts & focus layers  8. Shared UI injection, mobile bar, event wiring   */
(function () {
  'use strict';

  const Surya = window.Surya = window.Surya || {};

  /* ============================================================
     1. HELPERS & STORAGE
     ============================================================ */
  const WHATSAPP_NUMBER = '919345983823';
  const CART_KEY = 'suryaEnquiryCart';
  const WISH_KEY = 'suryaWishlist';
  const UNIT_TO_KG = { kg: 1, g: 0.001 };
  const UNIT_STEP = { kg: 1, g: 100 };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.SURYA_PRODUCTS) console.error('SURYA TRADERS: products-data.js was not loaded. Add <script src="products-data.js"></script> before main.js on this page, and use the matching updated HTML files.');
  const PRODUCTS = (window.SURYA_PRODUCTS || []).filter(p => p.active !== false);
  const CATEGORIES = window.SURYA_CATEGORIES || [];
  const BY_ID = new Map(PRODUCTS.map(p => [p.id, p]));

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const categoryLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || id;
  const categoryText = p => p.categories.map(categoryLabel).join(', ');

  const store = {
    get(key, fallback) {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode / blocked */ }
    }
  };

  /* Bigger photo for the lightbox. Only rewrites the size hint on the two CDNs already used. */
  function largeSrc(url, width) {
    if (!url) return url;
    if (url.indexOf('images.pexels.com') > -1) return url.replace(/([?&]w=)\d+/, '$1' + width);
    if (url.indexOf('burst.shopifycdn.com') > -1) return url.replace(/([?&]width=)\d+/, '$1' + width);
    return url;
  }

  function fmtNumber(n) { return String(Number(Number(n).toFixed(3))); }
  function fmtQty(qty, unit) { return fmtNumber(qty) + ' ' + unit; }
  function fmtTotalKg(kg) { return kg >= 1 ? fmtNumber(kg) + ' kg' : fmtNumber(kg * 1000) + ' g'; }
  function waLink(text) { return 'https://wa.me/' + WHATSAPP_NUMBER + (text ? '?text=' + encodeURIComponent(text) : ''); }

  const ICONS = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };

  /* ============================================================
     2. NAVIGATION & HEADER
     ============================================================ */
  const navToggle = $('#navToggle');
  const navList = $('#navList');
  function setNav(open) {
    if (!navList) return;
    navList.classList.toggle('open', open);
    if (navToggle) navToggle.setAttribute('aria-expanded', String(open));
  }
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => setNav(!navList.classList.contains('open')));
    navList.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('click', e => {
      if (navList.classList.contains('open') && !e.target.closest('#navList') && !e.target.closest('#navToggle')) setNav(false);
    });
  }

  /* Sticky header: hide on scroll down, show on scroll up */
  const header = $('#siteHeader');
  let lastScrollY = window.scrollY;
  let ticking = false;
  function updateHeader() {
    const currentY = window.scrollY;
    header.classList.toggle('scrolled', currentY > 10);
    if (!prefersReducedMotion) {
      const menuOpen = navList && navList.classList.contains('open');
      if (currentY > lastScrollY && currentY > 120 && !menuOpen) header.classList.add('hide');
      else header.classList.remove('hide');
    }
    lastScrollY = currentY;
    ticking = false;
  }
  if (header) {
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(updateHeader); ticking = true; }
    }, { passive: true });
  }

  /* ============================================================
     3. SCROLL REVEAL & LAZY IMAGE FADE
     ============================================================ */
  let revealObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  }
  function observeReveals(root) {
    $$('.reveal, .reveal-left, .reveal-right', root).forEach(el => {
      if (el.classList.contains('is-visible')) return;
      if (revealObserver) revealObserver.observe(el); else el.classList.add('is-visible');
    });
  }

  function initLazyImages(root) {
    $$('img.lazy-fade', root).forEach(img => {
      if (img.dataset.fadeBound) return;
      img.dataset.fadeBound = '1';
      if (img.complete && img.naturalWidth > 0) img.classList.add('is-loaded');
      else {
        img.addEventListener('load', () => img.classList.add('is-loaded'));
        img.addEventListener('error', () => img.classList.add('is-loaded'));
      }
    });
  }

  /* ============================================================
     4. TOASTS & FOCUS-MANAGED LAYERS (drawers, modal, lightbox)
     ============================================================ */
  const liveToasts = new Map();
  function toast(message, opts) {
    opts = opts || {};
    const region = $('#toastRegion');
    if (!region) return;

    /* Same message again (e.g. repeated +): refresh instead of stacking */
    if (liveToasts.has(message)) {
      const existing = liveToasts.get(message);
      existing.refresh();
      return;
    }
    const el = document.createElement('div');
    el.className = 'toast' + (opts.type ? ' toast-' + opts.type : '');
    el.innerHTML =
      '<span class="toast-icon">' + (opts.type === 'info' ? ICONS.info : ICONS.check) + '</span>' +
      '<span class="toast-msg">' + esc(message) + '</span>' +
      (opts.action ? '<button type="button" class="toast-action">' + esc(opts.action.label) + '</button>' : '') +
      '<button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>';
    region.appendChild(el);
    while (region.children.length > 3) region.firstElementChild.remove();
    requestAnimationFrame(() => el.classList.add('show'));

    const duration = opts.duration || (opts.action ? 5000 : 3200);
    let timer = null;
    function dismiss() {
      clearTimeout(timer);
      liveToasts.delete(message);
      el.classList.remove('show');
      setTimeout(() => el.remove(), prefersReducedMotion ? 0 : 320);
    }
    function start() { clearTimeout(timer); timer = setTimeout(dismiss, duration); }
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', start);
    el.addEventListener('focusin', () => clearTimeout(timer));
    el.addEventListener('focusout', start);
    $('.toast-close', el).addEventListener('click', dismiss);
    if (opts.action) $('.toast-action', el).addEventListener('click', () => { dismiss(); opts.action.run(); });
    liveToasts.set(message, { refresh: start });
    start();
  }

  const Layers = (function () {
    const stack = [];
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusables = root => $$(FOCUSABLE, root).filter(el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');

    function open(layer) {
      if (stack.indexOf(layer) > -1) return;
      layer.opener = document.activeElement;
      layer.show();
      stack.push(layer);
      document.body.classList.add('no-scroll');
      setTimeout(() => {
        const target = (layer.initialFocus && layer.initialFocus()) || focusables(layer.panel)[0] || layer.panel;
        target.focus({ preventScroll: true });
      }, 40);
    }
    function close(layer) {
      const i = stack.indexOf(layer);
      if (i < 0) return;
      stack.splice(i, 1);
      layer.hide();
      if (!stack.length) document.body.classList.remove('no-scroll');
      const opener = layer.opener;
      if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    }
    document.addEventListener('keydown', e => {
      const top = stack[stack.length - 1];
      if (!top) return;
      if (e.key === 'Escape') { e.preventDefault(); close(top); return; }
      if (e.key === 'Tab') {
        const items = focusables(top.panel);
        if (!items.length) { e.preventDefault(); top.panel.focus(); return; }
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === top.panel)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!top.panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    });
    return { open, close };
  })();

  function makeDrawerLayer(drawerId, overlayId, closeId) {
    const drawer = document.getElementById(drawerId);
    const overlay = document.getElementById(overlayId);
    const layer = {
      panel: drawer,
      show() { drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); },
      hide() { drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
    };
    overlay.addEventListener('click', () => Layers.close(layer));
    document.getElementById(closeId).addEventListener('click', () => Layers.close(layer));
    return layer;
  }

  /* ============================================================
     5. ENQUIRY CART  (localStorage, no payments)
        item shape: { id, qty, unit }   unit is "kg" or "g"
     ============================================================ */
  function normaliseCart(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(i => i && BY_ID.has(i.id) && Number(i.qty) > 0)
      .map(i => ({ id: i.id, qty: Number(i.qty), unit: UNIT_TO_KG[i.unit] ? i.unit : 'kg' }));
  }
  const getCart = () => normaliseCart(store.get(CART_KEY, []));
  function saveCart(cart) { store.set(CART_KEY, cart); renderCart(); }
  const cartTotalKg = cart => cart.reduce((sum, i) => sum + i.qty * UNIT_TO_KG[i.unit], 0);

  const cartApi = {
    add(id, qty, unit) {
      const p = BY_ID.get(id);
      if (!p) return;
      qty = Number(qty) > 0 ? Number(qty) : 1;
      unit = UNIT_TO_KG[unit] ? unit : 'kg';
      const cart = getCart();
      const existing = cart.find(i => i.id === id);
      if (existing) existing.qty = Number((existing.qty + qty * UNIT_TO_KG[unit] / UNIT_TO_KG[existing.unit]).toFixed(3));
      else cart.push({ id, qty, unit });
      saveCart(cart);
      toast(existing ? p.name + ' quantity updated in enquiry cart' : p.name + ' added to enquiry cart',
        { action: { label: 'View', run: () => Layers.open(cartLayer) } });
    },
    remove(id) {
      const p = BY_ID.get(id);
      saveCart(getCart().filter(i => i.id !== id));
      toast((p ? p.name : 'Product') + ' removed from enquiry cart', { type: 'info' });
    },
    setQty(id, qty) {
      if (!(qty > 0)) { cartApi.remove(id); return; }
      const cart = getCart();
      const item = cart.find(i => i.id === id);
      if (!item) return;
      item.qty = Math.min(Number(qty.toFixed(3)), 100000);
      saveCart(cart);
    },
    changeBy(id, direction) {
      const item = getCart().find(i => i.id === id);
      if (!item) return;
      cartApi.setQty(id, item.qty + direction * UNIT_STEP[item.unit]);
    },
    setUnit(id, unit) {
      if (!UNIT_TO_KG[unit]) return;
      const cart = getCart();
      const item = cart.find(i => i.id === id);
      if (!item) return;
      item.unit = unit;
      saveCart(cart);
    },
    clear() {
      if (!getCart().length) return;
      saveCart([]);
      toast('Enquiry cart cleared', { type: 'info' });
    },
    get: getCart,
    totalKg: () => cartTotalKg(getCart())
  };

  /* WhatsApp message. items: [{ name, qtyText? }] */
  function buildEnquiryMessage(items, totalText) {
    let msg = 'Hello SURYA TRADERS,\n\nI would like to enquire about the following product' + (items.length > 1 ? 's' : '') + ':\n\n';
    items.forEach((it, i) => { msg += (i + 1) + '. ' + it.name + (it.qtyText ? ' - Quantity: ' + it.qtyText : '') + '\n'; });
    if (totalText) msg += '\nTotal Quantity: ' + totalText + '\n';
    msg += '\nPlease provide the latest price and availability.\n\nThank you.';
    return msg;
  }
  function cartWhatsAppLink(cart) {
    if (!cart.length) return waLink('');
    const items = cart.map(i => ({ name: BY_ID.get(i.id).name, qtyText: fmtQty(i.qty, i.unit) }));
    return waLink(buildEnquiryMessage(items, fmtTotalKg(cartTotalKg(cart))));
  }

  let cartFocusRestore = null;
  function renderCart() {
    const cart = getCart();

    $$('.cart-count').forEach(el => { el.textContent = cart.length; el.setAttribute('data-count', cart.length); });
    const totalEl = document.getElementById('cartTotalCount');
    if (totalEl) totalEl.textContent = cart.length ? fmtTotalKg(cartTotalKg(cart)) : '0';

    const itemsEl = document.getElementById('cartItems');
    if (itemsEl) {
      if (!cart.length) {
        itemsEl.innerHTML = '<p class="cart-empty">Your enquiry cart is empty. Browse our products and tap &ldquo;Add to Enquiry&rdquo; to build your list.</p>';
      } else {
        itemsEl.innerHTML = cart.map(item => {
          const p = BY_ID.get(item.id);
          const n = esc(p.name);
          return '<div class="cart-item" data-id="' + esc(p.id) + '">' +
            '<img class="cart-item-img" src="' + esc(p.image) + '" alt="' + esc(p.alt || p.name) + '" width="54" height="54">' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + n + '</div>' +
              '<div class="cart-item-qty">' +
                '<button type="button" class="qty-btn qty-minus" aria-label="Decrease quantity of ' + n + '">&minus;</button>' +
                '<input class="qty-input" type="number" inputmode="decimal" min="0" step="any" value="' + fmtNumber(item.qty) + '" aria-label="Quantity of ' + n + '">' +
                '<select class="qty-unit" aria-label="Unit for ' + n + '">' +
                  '<option value="kg"' + (item.unit === 'kg' ? ' selected' : '') + '>kg</option>' +
                  '<option value="g"' + (item.unit === 'g' ? ' selected' : '') + '>g</option>' +
                '</select>' +
                '<button type="button" class="qty-btn qty-plus" aria-label="Increase quantity of ' + n + '">+</button>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="cart-item-remove" aria-label="Remove ' + n + ' from enquiry cart">&times;</button>' +
          '</div>';
        }).join('');
      }
    }
    const waBtn = document.getElementById('cartWhatsappBtn');
    if (waBtn) waBtn.setAttribute('href', cartWhatsAppLink(cart));

    /* Keep keyboard focus where the user was after the list is redrawn */
    if (cartFocusRestore && itemsEl) {
      const row = $('.cart-item[data-id="' + cartFocusRestore.id + '"]', itemsEl);
      const target = row && $(cartFocusRestore.selector, row);
      if (target) target.focus({ preventScroll: true });
      cartFocusRestore = null;
    }
  }

  /* ============================================================
     6. WISHLIST  (localStorage)
     ============================================================ */
  const getWish = () => (store.get(WISH_KEY, []) || []).filter(id => BY_ID.has(id));
  function saveWish(list) { store.set(WISH_KEY, list); renderWishlist(); }

  const wishApi = {
    has: id => getWish().indexOf(id) > -1,
    toggle(id) {
      const p = BY_ID.get(id);
      if (!p) return false;
      const list = getWish();
      const i = list.indexOf(id);
      if (i > -1) { list.splice(i, 1); saveWish(list); toast(p.name + ' removed from wishlist', { type: 'info' }); return false; }
      list.push(id); saveWish(list);
      toast(p.name + ' added to wishlist', { action: { label: 'View', run: () => Layers.open(wishLayer) } });
      return true;
    },
    remove(id) {
      const p = BY_ID.get(id);
      saveWish(getWish().filter(x => x !== id));
      toast((p ? p.name : 'Product') + ' removed from wishlist', { type: 'info' });
    },
    get: getWish
  };

  function syncWishButtons() {
    const list = getWish();
    $$('[data-wish-id]').forEach(btn => {
      const id = btn.getAttribute('data-wish-id');
      const on = list.indexOf(id) > -1;
      const p = BY_ID.get(id);
      if (btn.classList.contains('btn-wish')) {            /* labelled button under Add to Enquiry */
        btn.classList.toggle('is-saved', on);
        btn.querySelector('.wish-label').textContent = on ? 'Saved to Wishlist' : 'Add to Wishlist';
        return;
      }
      btn.setAttribute('aria-pressed', String(on));
      if (p) btn.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + p.name + (on ? ' from wishlist' : ' to wishlist'));
    });
  }

  function renderWishlist() {
    const list = getWish();
    $$('.wish-count').forEach(el => { el.textContent = list.length; el.setAttribute('data-count', list.length); });
    const itemsEl = document.getElementById('wishItems');
    if (itemsEl) {
      if (!list.length) {
        itemsEl.innerHTML = '<p class="cart-empty">Your wishlist is empty. Tap the heart on any product to save it here.</p>';
      } else {
        itemsEl.innerHTML = list.map(id => {
          const p = BY_ID.get(id);
          const n = esc(p.name);
          return '<div class="cart-item wl-item" data-id="' + esc(p.id) + '">' +
            '<img class="cart-item-img" src="' + esc(p.image) + '" alt="' + esc(p.alt || p.name) + '" width="54" height="54">' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + n + '</div>' +
              '<div class="wl-actions">' +
                '<button type="button" class="btn btn-primary btn-mini" data-wl="add">Add to Enquiry</button>' +
                '<button type="button" class="btn btn-secondary btn-mini" data-wl="details">Details</button>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="cart-item-remove" data-wl="remove" aria-label="Remove ' + n + ' from wishlist">&times;</button>' +
          '</div>';
        }).join('');
      }
    }
    syncWishButtons();
  }

  /* ============================================================
     7. PRODUCT DETAILS MODAL + IMAGE LIGHTBOX
     ============================================================ */
  let modalId = null;
  let modalLayer = null;
  let lightboxLayer = null;
  let cartLayer = null;
  let wishLayer = null;

  function openProduct(id) {
    const p = BY_ID.get(id);
    if (!p) return;
    modalId = id;
    const img = $('#pmImg');
    img.src = largeSrc(p.image, 900);
    img.alt = p.alt || p.name;
    $('#pmImgBtn').setAttribute('aria-label', 'View larger photo of ' + p.name);
    $('#pmCat').textContent = categoryText(p);
    $('#pmTitle').textContent = p.name;
    $('#pmDesc').textContent = p.description;

    /* Only show facts that really exist in the product data */
    const facts = [];
    if (p.unit) facts.push(['Unit', p.unit]);
    if (p.price && p.price.amount != null) facts.push(['Price', '\u20B9' + p.price.amount + (p.price.per ? ' per ' + p.price.per : '')]);
    const factsEl = $('#pmFacts');
    factsEl.innerHTML = facts.map(f => '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('');
    factsEl.hidden = !facts.length;

    $('#pmWa').setAttribute('href', waLink(buildEnquiryMessage([{ name: p.name }])));
    $('#pmWa').setAttribute('aria-label', 'WhatsApp enquiry about ' + p.name + ' (opens in a new tab)');
    $('#pmWish').setAttribute('data-wish-id', id);
    syncWishButtons();
    Layers.open(modalLayer);
  }

  function openLightbox(p) {
    const lbImg = $('#lbImg');
    const stage = $('#lbStage');
    stage.classList.remove('is-zoomed');
    stage.scrollTo(0, 0);
    lbImg.src = largeSrc(p.image, 1600);
    lbImg.alt = p.alt || p.name;
    $('#lbCaption').textContent = p.name;
    Layers.open(lightboxLayer);
  }

  /* ============================================================
     8. SHARED UI INJECTION, MOBILE BAR & EVENT WIRING
     ============================================================ */
  function injectSharedUI() {
    const parts = [];

    if (!document.getElementById('cartDrawer')) {
      parts.push(
        '<div class="cart-overlay" id="cartOverlay"></div>' +
        '<aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-labelledby="cartTitle" aria-hidden="true" tabindex="-1">' +
          '<div class="cart-drawer-head"><h3 id="cartTitle">Your Enquiry Cart</h3>' +
          '<button type="button" class="cart-drawer-close" id="cartDrawerClose" aria-label="Close enquiry cart">&times;</button></div>' +
          '<div class="cart-items" id="cartItems"></div>' +
          '<div class="cart-drawer-footer">' +
            '<div class="cart-total-row"><span>Total Quantity</span><span id="cartTotalCount">0</span></div>' +
            '<p class="cart-note">Enquiry only &mdash; there is no online payment.</p>' +
            '<a href="' + waLink('') + '" target="_blank" rel="noopener" id="cartWhatsappBtn" class="btn btn-primary cart-send-btn">Send Enquiry on WhatsApp</a>' +
            '<button type="button" class="btn btn-secondary cart-clear-btn" id="cartClearBtn">Clear Cart</button>' +
          '</div>' +
        '</aside>');
    }

    parts.push(
      '<div class="cart-overlay" id="wishOverlay"></div>' +
      '<aside class="cart-drawer" id="wishDrawer" role="dialog" aria-modal="true" aria-labelledby="wishTitle" aria-hidden="true" tabindex="-1">' +
        '<div class="cart-drawer-head"><h3 id="wishTitle">Your Wishlist</h3>' +
        '<button type="button" class="cart-drawer-close" id="wishDrawerClose" aria-label="Close wishlist">&times;</button></div>' +
        '<div class="cart-items" id="wishItems"></div>' +
      '</aside>');

    parts.push(
      '<div class="modal" id="productModal" role="dialog" aria-modal="true" aria-labelledby="pmTitle" aria-hidden="true">' +
        '<div class="modal-backdrop" data-close-modal></div>' +
        '<div class="modal-panel" tabindex="-1">' +
          '<button type="button" class="modal-close" aria-label="Close product details" data-close-modal>&times;</button>' +
          '<button type="button" class="pm-img" id="pmImgBtn"><img id="pmImg" alt="" width="600" height="600"><span class="zoom-hint">' + ICONS.zoom + '</span></button>' +
          '<div class="pm-body">' +
            '<p class="pm-cat" id="pmCat"></p>' +
            '<h2 id="pmTitle"></h2>' +
            '<p class="pm-desc" id="pmDesc"></p>' +
            '<dl class="pm-facts" id="pmFacts" hidden></dl>' +
            '<p class="pm-note">Price and availability are shared when you enquire.</p>' +
            '<div class="pm-actions">' +
              '<button type="button" class="btn btn-primary" id="pmAdd">Add to Enquiry</button>' +
              '<a class="btn btn-whatsapp" id="pmWa" href="#" target="_blank" rel="noopener">&#128172; WhatsApp Enquiry</a>' +
              '<button type="button" class="wish-btn pm-wish" id="pmWish" aria-pressed="false" aria-label="Add to wishlist">' + ICONS.heart + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>');

    parts.push(
      '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Product photo" aria-hidden="true">' +
        '<div class="lightbox-backdrop" data-close-lightbox></div>' +
        '<button type="button" class="lightbox-close" aria-label="Close photo" data-close-lightbox>&times;</button>' +
        '<div class="lightbox-stage" id="lbStage" tabindex="-1"><img id="lbImg" alt=""></div>' +
        '<p class="lightbox-caption" id="lbCaption"></p>' +
      '</div>');

    parts.push('<div class="toast-region" id="toastRegion" role="status" aria-live="polite" aria-atomic="false"></div>');

    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const isHome = page === 'index.html';
    const isProducts = ['products.html', 'dry-fruits.html', 'seeds.html', 'spices.html'].indexOf(page) > -1;
    const iconHome = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/></svg>';
    const iconGrid = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
    const iconHeart = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
    const iconCart = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
    const iconChat = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5A8.4 8.4 0 1 1 21 11.5z"/></svg>';
    parts.push(
      '<nav class="mobile-bar" aria-label="Quick actions">' +
        '<a class="mb-item' + (isHome ? ' is-active' : '') + '" href="index.html#home"' + (isHome ? ' aria-current="page"' : '') + '>' + iconHome + '<span>Home</span></a>' +
        '<a class="mb-item' + (isProducts ? ' is-active' : '') + '" href="products.html"' + (isProducts ? ' aria-current="page"' : '') + '>' + iconGrid + '<span>Products</span></a>' +
        '<button type="button" class="mb-item" data-open="wishlist"><span class="mb-icon">' + iconHeart + '<span class="wish-count" data-count="0">0</span></span><span>Wishlist</span></button>' +
        '<button type="button" class="mb-item" data-open="cart"><span class="mb-icon">' + iconCart + '<span class="cart-count" data-count="0">0</span></span><span>Enquiry</span></button>' +
        '<a class="mb-item" href="' + waLink('') + '" target="_blank" rel="noopener" aria-label="WhatsApp (opens in a new tab)">' + iconChat + '<span>WhatsApp</span></a>' +
      '</nav>');

    document.body.insertAdjacentHTML('beforeend', parts.join(''));
  }

  function wireUI() {
    cartLayer = makeDrawerLayer('cartDrawer', 'cartOverlay', 'cartDrawerClose');
    wishLayer = makeDrawerLayer('wishDrawer', 'wishOverlay', 'wishDrawerClose');

    const modal = document.getElementById('productModal');
    modalLayer = {
      panel: $('.modal-panel', modal),
      show() { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); },
      hide() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); },
      initialFocus: () => $('.modal-close', modal)
    };
    modal.addEventListener('click', e => { if (e.target.closest('[data-close-modal]')) Layers.close(modalLayer); });
    $('#pmAdd').addEventListener('click', () => { if (modalId) cartApi.add(modalId, 1, 'kg'); });
    $('#pmImgBtn').addEventListener('click', () => { const p = BY_ID.get(modalId); if (p) openLightbox(p); });
    $('#pmWish').addEventListener('click', () => { if (modalId) wishApi.toggle(modalId); });

    const lightbox = document.getElementById('lightbox');
    lightboxLayer = {
      panel: lightbox,
      show() { lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden', 'false'); },
      hide() { lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); },
      initialFocus: () => $('.lightbox-close', lightbox)
    };
    lightbox.addEventListener('click', e => { if (e.target.closest('[data-close-lightbox]')) Layers.close(lightboxLayer); });
    $('#lbStage').addEventListener('click', e => {
      if (e.target.id !== 'lbImg') { Layers.close(lightboxLayer); return; }   /* click beside the photo closes */
      const stage = $('#lbStage'), img = $('#lbImg');
      if (stage.classList.contains('is-zoomed')) { stage.classList.remove('is-zoomed'); return; }
      if (img.naturalWidth > img.clientWidth + 8) stage.classList.add('is-zoomed');   /* only zoom if there is more detail */
    });

    /* Cart controls */
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.addEventListener('click', () => Layers.open(cartLayer));
    const wishBtn = document.getElementById('wishBtn');
    if (wishBtn) wishBtn.addEventListener('click', () => Layers.open(wishLayer));
    document.getElementById('cartClearBtn').addEventListener('click', cartApi.clear);

    const cartItems = document.getElementById('cartItems');
    cartItems.addEventListener('click', e => {
      const row = e.target.closest('.cart-item');
      if (!row) return;
      const id = row.getAttribute('data-id');
      if (e.target.closest('.qty-plus')) { cartFocusRestore = { id, selector: '.qty-plus' }; cartApi.changeBy(id, 1); }
      else if (e.target.closest('.qty-minus')) { cartFocusRestore = { id, selector: '.qty-minus' }; cartApi.changeBy(id, -1); }
      else if (e.target.closest('.cart-item-remove')) cartApi.remove(id);
    });
    cartItems.addEventListener('change', e => {
      const row = e.target.closest('.cart-item');
      if (!row) return;
      const id = row.getAttribute('data-id');
      if (e.target.classList.contains('qty-input')) {
        const value = parseFloat(e.target.value);
        cartFocusRestore = { id, selector: '.qty-input' };
        if (isNaN(value)) renderCart(); else cartApi.setQty(id, value);
      } else if (e.target.classList.contains('qty-unit')) {
        cartFocusRestore = { id, selector: '.qty-unit' };
        cartApi.setUnit(id, e.target.value);
      }
    });

    /* Wishlist drawer actions */
    document.getElementById('wishItems').addEventListener('click', e => {
      const btn = e.target.closest('[data-wl]');
      const row = e.target.closest('.wl-item');
      if (!btn || !row) return;
      const id = row.getAttribute('data-id');
      const action = btn.getAttribute('data-wl');
      if (action === 'add') cartApi.add(id, 1, 'kg');
      else if (action === 'details') openProduct(id);
      else if (action === 'remove') wishApi.remove(id);
    });

    /* Mobile bar buttons */
    document.addEventListener('click', e => {
      const opener = e.target.closest('[data-open]');
      if (!opener) return;
      Layers.open(opener.getAttribute('data-open') === 'wishlist' ? wishLayer : cartLayer);
    });

    /* Product cards (rendered by catalog.js or any page with .cat-prod-card[data-id]) */
    document.addEventListener('click', e => {
      const card = e.target.closest('.cat-prod-card[data-id]');
      if (!card) return;
      const id = card.getAttribute('data-id');
      const actionEl = e.target.closest('[data-action]');
      const action = actionEl ? actionEl.getAttribute('data-action') : null;
      if (action === 'add') cartApi.add(id, 1, 'kg');
      else if (action === 'wish') wishApi.toggle(id);
      else if (action === 'zoom') { const p = BY_ID.get(id); if (p) openLightbox(p); }
      else if (action === 'details') openProduct(id);
      else if (!e.target.closest('a, button, input, select')) openProduct(id);   /* click anywhere else on the card */
    });

    /* Keep tabs in sync */
    window.addEventListener('storage', e => {
      if (e.key === CART_KEY) renderCart();
      if (e.key === WISH_KEY) renderWishlist();
    });
  }

  injectSharedUI();
  wireUI();
  renderCart();
  renderWishlist();
  observeReveals(document);
  initLazyImages(document);

  /* Public API for catalog.js / extras.js */
  Surya.products = PRODUCTS;
  Surya.categories = CATEGORIES;
  Surya.byId = BY_ID;
  Surya.cart = cartApi;
  Surya.wishlist = wishApi;
  Surya.toast = toast;
  Surya.observeReveals = observeReveals;
  Surya.initLazyImages = initLazyImages;
  Surya.syncWishButtons = syncWishButtons;
  Surya.openProduct = openProduct;
  Surya.helpers = { esc, categoryLabel, categoryText, fmtNumber, fmtTotalKg, UNIT_TO_KG, ICONS, waLink };
})();
