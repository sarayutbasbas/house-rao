// Keep an empty field empty while editing. Convert to a number only on submit.
export function normalizeIntegerInput(value: string) {
  return value.replace(/^0+(?=\d)/, '');
}

export function parseIntegerInput(value: string, minimum = 0) {
  if (!/^\d+$/.test(value)) throw new Error('กรุณากรอกจำนวนเป็นเลขจำนวนเต็ม');
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < minimum || result > 999999)
    throw new Error(`จำนวนต้องอยู่ระหว่าง ${minimum} ถึง 999,999`);
  return result;
}
