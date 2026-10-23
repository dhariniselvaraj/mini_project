/* SURYA TRADERS - page extras: FAQ accordion (index.html) and wholesale
   quantity calculator (bulk-wholesale.html). Each part only runs if its markup exists. */
(function () {
  'use strict';
  const S = window.Surya;
  if (!S) return;

  /* ---------- FAQ accordion: each question opens/closes on its own ---------- */
  const faq = document.querySelector('[data-faq]');
  if (faq) {
    faq.classList.add('is-ready');   /* answers stay visible if JS is unavailable */
    faq.addEventListener('click', e => {
      const btn = e.target.closest('.faq-q');
      if (!btn) return;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.closest('.faq-item').classList.toggle('is-open', !open);
    });
  }

  /* ---------- Wholesale quantity calculator ---------- */
  const calc = document.querySelector('[data-calculator]');
  if (calc) {
    const { esc, fmtNumber, UNIT_TO_KG } = S.helpers;
    const WHOLESALE_MIN_KG = 5;   /* from the Order Details section on bulk-wholesale.html */
    const sel = calc.querySelector('#calcProduct');
    const qtyInput = calc.querySelector('#calcQty');
    const unitSel = calc.querySelector('#calcUnit');
    const out = calc.querySelector('.calc-result');
    const addBtn = calc.querySelector('#calcAdd');

    /* One option per product (Mustard Seeds sits under its first category only) */
    const seen = new Set();
    sel.innerHTML = S.categories.map(cat => {
      const items = S.products.filter(p => p.categories[0] === cat.id && !seen.has(p.id));
      items.forEach(p => seen.add(p.id));
      return '<optgroup label="' + esc(cat.label) + '">' +
        items.map(p => '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>').join('') + '</optgroup>';
    }).join('');

    function update() {
      const p = S.byId.get(sel.value);
      const qty = parseFloat(qtyInput.value);
      const unit = unitSel.value;
      if (!p || !(qty > 0)) {
        out.innerHTML = '<p class="calc-hint">Enter a quantity to see the total.</p>';
        addBtn.disabled = true;
        return;
      }
      addBtn.disabled = false;
      const kg = qty * UNIT_TO_KG[unit];
      let html = '<dl class="calc-lines">' +
        '<div><dt>Product</dt><dd>' + esc(p.name) + '</dd></div>' +
        '<div class="calc-total"><dt>Total Quantity</dt><dd>' + esc(unit === 'g' ? fmtNumber(qty) + ' g (' + fmtNumber(kg) + ' kg)' : fmtNumber(qty) + ' kg') + '</dd></div>';
      if (p.price && p.price.amount != null) {
        /* Only shown if a real price is added to products-data.js */
        const perKg = p.price.per === 'g' ? p.price.amount * 1000 : p.price.amount;
        html += '<div><dt>Estimated Amount</dt><dd>\u20B9' + Math.round(kg * perKg).toLocaleString('en-IN') + ' <small>(estimate only)</small></dd></div>';
      }
      html += '</dl>';
      html += kg >= WHOLESALE_MIN_KG
        ? '<p class="calc-hint is-ok">This meets the 5 kg per item at which wholesale pricing starts.</p>'
        : '<p class="calc-hint">Wholesale pricing starts from 5 kg per item. Smaller quantities are welcome too &mdash; just enquire.</p>';
      if (!(p.price && p.price.amount != null)) html += '<p class="calc-hint">Prices are shared when you enquire, so no amount is shown here.</p>';
      out.innerHTML = html;
    }

    [sel, qtyInput, unitSel].forEach(el => el.addEventListener('input', update));
    unitSel.addEventListener('change', update);
    addBtn.addEventListener('click', () => {
      const qty = parseFloat(qtyInput.value);
      if (sel.value && qty > 0) S.cart.add(sel.value, qty, unitSel.value);
    });
    update();
  }
})();
