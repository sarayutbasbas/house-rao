// Stable keys are stored in the existing `emoji` column for compatibility with
// deployed databases. Renderers also translate legacy emoji without rewriting data.
export const CATEGORY_ICON_KEYS = ['package', 'food', 'apple', 'fish', 'coffee', 'bottle', 'fridge', 'snow', 'spray', 'sparkles', 'shower', 'scissors', 'shirt', 'bed', 'medical', 'heart', 'baby', 'pet', 'battery', 'plug', 'bulb', 'tools', 'laptop', 'camera', 'book', 'paper', 'shopping', 'house', 'leaf', 'gift', 'help'] as const;
export type CategoryIconKey = typeof CATEGORY_ICON_KEYS[number];
export const CATEGORY_ICON_LABELS: Record<CategoryIconKey, string> = {
  package: 'ของทั่วไป', food: 'อาหาร', apple: 'ผักผลไม้', fish: 'เนื้อสัตว์', coffee: 'เครื่องดื่ม', bottle: 'ขวด / ของใช้', fridge: 'ของแช่เย็น', snow: 'ของแช่แข็ง', spray: 'น้ำยาทำความสะอาด', sparkles: 'ทำความสะอาด', shower: 'ห้องน้ำ', scissors: 'อุปกรณ์ดูแลตัว', shirt: 'เสื้อผ้า', bed: 'เครื่องนอน', medical: 'ยา / ปฐมพยาบาล', heart: 'สุขภาพ', baby: 'ของใช้เด็ก', pet: 'สัตว์เลี้ยง', battery: 'แบตเตอรี่', plug: 'เครื่องใช้ไฟฟ้า', bulb: 'หลอดไฟ', tools: 'เครื่องมือ', laptop: 'อิเล็กทรอนิกส์', camera: 'กล้อง', book: 'หนังสือ', paper: 'กระดาษ', shopping: 'ของซื้อเข้าบ้าน', house: 'ของใช้ในบ้าน', leaf: 'สวน / ต้นไม้', gift: 'ของขวัญ', help: 'อื่น ๆ',
};
const legacy: Record<string, CategoryIconKey> = { '📦': 'package', '🥫': 'food', '🧴': 'bottle', '🧽': 'sparkles', '🔋': 'battery', '🍎': 'apple', '🐟': 'fish', '☕': 'coffee', '🍼': 'baby', '🐾': 'pet', '💊': 'medical', '👕': 'shirt', '🛏️': 'bed', '💡': 'bulb', '🔧': 'tools', '📚': 'book', '🧻': 'paper', '🎁': 'gift', '🏠': 'house' };
export function categoryIconKey(value?: string | null, name = ''): CategoryIconKey {
  if (CATEGORY_ICON_KEYS.includes(value as CategoryIconKey)) return value as CategoryIconKey;
  if (value && legacy[value]) return legacy[value];
  if (/อาหาร|เครื่องปรุง/.test(name)) return 'food';
  if (/ทำความสะอาด/.test(name)) return 'sparkles';
  if (/ของใช้ส่วนตัว/.test(name)) return 'bottle';
  return 'package';
}
