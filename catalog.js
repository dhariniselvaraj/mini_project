/* SURYA TRADERS - product catalogue: renders cards from products-data.js,
   then handles instant search + category filtering (no page reload).
   Mount point:  <div data-catalog data-category="seeds"></div>
   data-category = "all" (products.html, filters in place) or a single category id
   (category pages show only that category; chips link to the other pages). */
(function () {
  'use strict';
  const mount = document.querySelector('[data-catalog]');
  const S = window.Surya;
  if (!mount || !S) return;

  const { esc, categoryLabel, categoryText, ICONS } = S.helpers;
  const pageCategory = mount.getAttribute('data-category') || 'all';
  const isAll = pageCategory === 'all';
  const scope = S.products.filter(p => isAll || p.categories.indexOf(pageCategory) > -1);
  const scopeNoun = isAll ? 'products' : categoryLabel(pageCategory).toLowerCase();

  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    cat: isAll && S.categories.some(c => c.id === params.get('category')) ? params.get('category') : 'all'
  };

  /* ---------- markup ---------- */
  const countFor = id => scope.filter(p => id === 'all' || p.categories.indexOf(id) > -1).length;

  function chipsHTML() {
    if (isAll) {
      const all = [{ id: 'all', label: 'All' }].concat(S.categories);
      return all.map(c =>
        '<button type="button" class="chip" data-cat="' + esc(c.id) + '" aria-pressed="' + (state.cat === c.id) + '">' +
        esc(c.label) + ' <span class="chip-count">' + countFor(c.id) + '</span></button>').join('');
    }
    const links = [{ label: 'All Products', page: 'products.html', id: 'all' }].concat(S.categories);
    return links.map(c =>
      '<a class="chip" href="' + esc(c.page) + '"' + (c.id === pageCategory ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</a>').join('');
  }

  function cardHTML(p) {
    const n = esc(p.name);
    return '<article class="cat-prod-card reveal" data-id="' + esc(p.id) + '">' +
      '<div class="cat-prod-img">' +
        '<button type="button" class="img-zoom-btn" data-action="zoom" aria-label="View larger photo of ' + n + '">' +
          '<img loading="lazy" class="lazy-fade" src="' + esc(p.image) + '" alt="' + esc(p.alt || p.name) + '" width="600" height="400">' +
          '<span class="zoom-hint">' + ICONS.zoom + '</span>' +
        '</button>' +
        '<button type="button" class="wish-btn" data-action="wish" data-wish-id="' + esc(p.id) + '" aria-pressed="false" aria-label="Add ' + n + ' to wishlist">' + ICONS.heart + '</button>' +
      '</div>' +
      '<div class="cat-prod-body">' +
        (isAll ? '<p class="cat-tag">' + esc(categoryText(p)) + '</p>' : '') +
        '<h3>' + n + '</h3>' +
        '<p>' + esc(p.description) + '</p>' +
        '<div class="cat-prod-actions">' +
          '<button type="button" class="btn btn-primary btn-add-cart" data-action="add" aria-label="Add ' + n + ' to enquiry">Add to Enquiry</button>' +
          '<button type="button" class="btn btn-secondary btn-wish" data-action="wish" data-wish-id="' + esc(p.id) + '">' + ICONS.heart + '<span class="wish-label">Add to Wishlist</span><span class="visually-hidden">: ' + n + '</span></button>' +
          '<button type="button" class="btn btn-secondary btn-details" data-action="details" aria-label="View details of ' + n + '">View Details</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  mount.innerHTML =
    '<div class="catalog-toolbar">' +
      '<form class="search-box" role="search">' +
        '<label class="visually-hidden" for="catalogSearch">Search ' + esc(scopeNoun) + '</label>' +
        '<svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '<input id="catalogSearch" type="search" name="q" autocomplete="off" enterkeyhint="search" placeholder="Search ' + esc(scopeNoun) + ' by name" value="' + esc(state.q) + '">' +
        '<button type="button" class="search-clear" aria-label="Clear search" hidden>&times;</button>' +
      '</form>' +
      '<div class="filter-chips" role="group" aria-label="Filter by category">' + chipsHTML() + '</div>' +
      '<p class="catalog-status" role="status" aria-live="polite"></p>' +
    '</div>' +
    '<div class="cat-prod-grid" id="productGrid">' + scope.map(cardHTML).join('') + '</div>' +
    '<div class="catalog-empty" hidden>' +
      '<h3>No products found</h3>' +
      '<p class="catalog-empty-text"></p>' +
      '<div class="catalog-empty-actions">' +
        '<button type="button" class="btn btn-primary" data-empty="clear">Clear search</button>' +
        (isAll ? '' : '<a class="btn btn-secondary" data-empty="all" href="products.html">Search all products</a>') +
      '</div>' +
    '</div>';

  const input = mount.querySelector('#catalogSearch');
  const clearBtn = mount.querySelector('.search-clear');
  const statusEl = mount.querySelector('.catalog-status');
  const emptyEl = mount.querySelector('.catalog-empty');
  const emptyText = mount.querySelector('.catalog-empty-text');
  const emptyAll = mount.querySelector('[data-empty="all"]');
  const grid = mount.querySelector('#productGrid');
  const cards = Array.from(grid.children).map((el, i) => ({ el, p: scope[i], name: norm(scope[i].name) }));

  /* ---------- search + filter (work together) ---------- */
  let lastShown = null;
  let emptyToastTimer = null;

  function apply() {
    const term = norm(state.q);
    const tokens = term ? term.split(' ') : [];
    let shown = 0;
    cards.forEach(c => {
      const inCat = !isAll || state.cat === 'all' || c.p.categories.indexOf(state.cat) > -1;
      const inSearch = tokens.every(t => c.name.indexOf(t) > -1);
      const show = inCat && inSearch;
      c.el.hidden = !show;
      if (show) shown++;
    });

    const filtered = term || (isAll && state.cat !== 'all');
    const noun = isAll && state.cat !== 'all' ? categoryLabel(state.cat).toLowerCase() : scopeNoun;
    statusEl.textContent = shown === 0 ? 'No products found'
      : filtered ? 'Showing ' + shown + ' of ' + countFor(isAll ? state.cat : 'all') + ' ' + noun
      : scope.length + ' ' + scopeNoun;

    emptyEl.hidden = shown !== 0;
    grid.hidden = shown === 0;
    clearBtn.hidden = !state.q;
    if (shown === 0) {
      emptyText.textContent = term
        ? 'We couldn\u2019t find \u201C' + state.q.trim() + '\u201D in ' + noun + '. Check the spelling or try a shorter name.'
        : 'Nothing matches this filter yet.';
      if (emptyAll) emptyAll.setAttribute('href', 'products.html' + (state.q.trim() ? '?q=' + encodeURIComponent(state.q.trim()) : ''));
      /* one toast when results drop to zero, not on every keystroke */
      if (lastShown !== 0) {
        clearTimeout(emptyToastTimer);
        emptyToastTimer = setTimeout(() => { if (emptyEl && !emptyEl.hidden) S.toast('No products found', { type: 'info' }); }, 600);
      }
    } else {
      clearTimeout(emptyToastTimer);
    }
    lastShown = shown;

    mount.querySelectorAll('.chip[data-cat]').forEach(ch => ch.setAttribute('aria-pressed', String(ch.getAttribute('data-cat') === state.cat)));
    syncURL();
  }

  function syncURL() {
    try {
      const u = new URLSearchParams();
      if (state.q.trim()) u.set('q', state.q.trim());
      if (isAll && state.cat !== 'all') u.set('category', state.cat);
      const qs = u.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) { /* file:// or sandboxed - the filters still work */ }
  }

  input.addEventListener('input', () => { state.q = input.value; apply(); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape' && input.value) { e.stopPropagation(); input.value = ''; state.q = ''; apply(); } });
  mount.querySelector('.search-box').addEventListener('submit', e => { e.preventDefault(); input.blur(); });
  clearBtn.addEventListener('click', () => { input.value = ''; state.q = ''; apply(); input.focus(); });
  mount.querySelector('[data-empty="clear"]').addEventListener('click', () => {
    input.value = ''; state.q = '';
    if (isAll) state.cat = 'all';
    apply(); input.focus();
  });
  if (isAll) {
    mount.querySelector('.filter-chips').addEventListener('click', e => {
      const chip = e.target.closest('.chip[data-cat]');
      if (!chip) return;
      state.cat = chip.getAttribute('data-cat');
      apply();
    });
  }

  S.syncWishButtons();
  S.initLazyImages(grid);
  S.observeReveals(grid);
  apply();
})();
