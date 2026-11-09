'use strict';

// Same arithmetic as product/app.js recipeCost/cogsPct: sum unitCost * qty,
// subtract the unrounded sum from menu price, then format. Purchase units are
// 500 g beans and 128 US fl oz milk. $4.61/gallon approximates the seed's
// $0.036/fl oz; both yield the same displayed $1.22 / $3.78 / 24%.
function calculateLatte({ menuPrice, bagPrice, milkPrice } = {}) {
  // Reject invalid values and cap extreme input to keep all arithmetic finite.
  const price = value => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 1e9) : 0;
  };
  const menu = price(menuPrice);
  const rawCost = price(bagPrice) / 500 * 18 + price(milkPrice) / 128 * 9 + 0.30;
  const cents = value => Number(value.toFixed(2));
  return { cost: cents(rawCost), keeps: cents(menu - rawCost),
    percent: menu > 0 ? Math.round(Math.min(rawCost / menu * 100, Number.MAX_SAFE_INTEGER)) : null };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { calculateLatte };

if (typeof document !== 'undefined') {
  const calc = document.querySelector('#latte-calc');
  if (calc) {
    const fields = [...calc.querySelectorAll('input')];
    const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const update = () => {
      const result = calculateLatte(Object.fromEntries(fields.map(el => [el.name, el.value])));
      calc.querySelector('[data-cost]').textContent = money.format(result.cost);
      calc.querySelector('[data-keeps]').textContent = money.format(result.keeps);
      calc.querySelector('[data-percent]').textContent = result.percent === null ? '—' : result.percent + '%';
      const invalid = fields.some(el => el.value.trim() === '' || !Number.isFinite(Number(el.value)) || Number(el.value) < 0 || Number(el.value) > 1e9);
      calc.querySelector('[data-calc-note]').textContent = invalid
        ? 'Enter prices from $0 to $1 billion. Blank or invalid prices count as $0; higher prices are capped.'
        : result.percent === null ? 'Add a menu price above $0 to see the cost percentage.'
        : 'Before labour, rent, tax and waste. Negative kept means a loss.';
    };
    fields.forEach(el => el.addEventListener('input', update));
    update();
  }
}
