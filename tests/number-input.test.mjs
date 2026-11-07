import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeIntegerInput, parseIntegerInput } from '../src/lib/number-input.ts';

test('clearing and retyping a number does not keep a leading zero', () => {
  assert.equal(normalizeIntegerInput(''), '');
  assert.equal(normalizeIntegerInput('1'), '1');
  assert.equal(normalizeIntegerInput('01'), '1');
  assert.equal(normalizeIntegerInput('00012'), '12');
  assert.equal(normalizeIntegerInput('0'), '0');
});

test('empty, fractional, negative and excessive quantities cannot be saved', () => {
  for (const value of ['', '-1', '1.5', '1e2', '1000000']) assert.throws(() => parseIntegerInput(value));
  assert.equal(parseIntegerInput('0'), 0);
  assert.equal(parseIntegerInput('12'), 12);
  assert.throws(() => parseIntegerInput('0', 1));
});
