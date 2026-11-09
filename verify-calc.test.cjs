const { test } = require('node:test');
const assert = require('node:assert/strict');
const calculate = values => require('./site/calc.js').calculateLatte(values);
const demo = { menuPrice: '5.00', bagPrice: '16.50', milkPrice: '4.61' };

test('demo latte displays $1.22 cost, $3.78 kept and 24% COGS', () => {
  assert.deepEqual(calculate(demo), { cost: 1.22, keeps: 3.78, percent: 24 });
});
test('zero inputs retain only the stated packaging cost; no menu percent', () => {
  assert.deepEqual(calculate({ menuPrice: 0, bagPrice: 0, milkPrice: 0 }),
    { cost: 0.30, keeps: -0.30, percent: null });
});
test('blank inputs are safe and visibly incomplete', () => {
  assert.deepEqual(calculate({ menuPrice: '', bagPrice: '', milkPrice: '' }),
    { cost: 0.30, keeps: -0.30, percent: null });
});
test('very expensive beans can show a loss without a negative cost', () => {
  assert.deepEqual(calculate({ ...demo, bagPrice: 5000 }),
    { cost: 180.62, keeps: -175.62, percent: 3612 });
});
test('sum raw ingredient costs before rounding money to cents', () => {
  assert.deepEqual(calculate({ menuPrice: 5, bagPrice: 16, milkPrice: 4 }),
    { cost: 1.16, keeps: 3.84, percent: 23 });
});
test('negative, nonnumeric and nonfinite inputs never produce invalid output', () => {
  for (const value of [-1, 'coffee', Infinity, '1e309', NaN, Number.MAX_VALUE, Number.MIN_VALUE]) {
    const result = calculate({ menuPrice: value, bagPrice: value, milkPrice: value });
    assert.ok(Number.isFinite(result.cost) && result.cost >= 0);
    assert.ok(Number.isFinite(result.keeps));
    assert.ok(result.percent === null || Number.isFinite(result.percent));
  }
});
