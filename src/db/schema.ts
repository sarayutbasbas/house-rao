import { boolean, check, date, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'), image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const houses = pgTable('houses', {
  id: uuid('id').primaryKey().defaultRandom(), name: text('name').notNull(),
  houseNumber: text('house_number'),
  inviteCode: text('invite_code').notNull().unique(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const memberships = pgTable('memberships', {
  houseId: uuid('house_id').notNull().references(() => houses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.houseId, t.userId] }), index('memberships_user_idx').on(t.userId)]);
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  houseId: uuid('house_id').notNull().references(() => houses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), imageUrl: text('image_url'), description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('rooms_house_name_idx').on(t.houseId, t.name), index('rooms_house_idx').on(t.houseId)]);
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(), houseId: uuid('house_id').notNull().references(() => houses.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), emoji: text('emoji').notNull().default('📦'), color: text('color').notNull().default('#e7e5e4'),
}, (t) => [uniqueIndex('categories_house_name_idx').on(t.houseId, t.name).where(sql`${t.roomId} IS NULL`), uniqueIndex('categories_room_name_idx').on(t.houseId, t.roomId, t.name)]);
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(), houseId: uuid('house_id').notNull().references(() => houses.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  location: text('location'), barcode: text('barcode'),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(), brand: text('brand'), size: text('size'), variant: text('variant'),
  imageUrl: text('image_url'), quantity: integer('quantity').notNull().default(0), unit: text('unit').notNull().default('ชิ้น'),
  minimum: integer('minimum').notNull().default(1), expiryDate: date('expiry_date'),
  checked: boolean('checked').notNull().default(false), archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('items_room_idx').on(t.houseId, t.roomId), index('items_house_idx').on(t.houseId), index('items_house_archived_idx').on(t.houseId, t.archived)]);
export const itemBatches = pgTable('item_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  expiryDate: date('expiry_date'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('item_batches_item_idx').on(t.itemId), check('item_batches_quantity_check', sql`${t.quantity} >= 0 AND ${t.quantity} <= 999999`)]);

export const stockEvents = pgTable('stock_events', {
  id: uuid('id').primaryKey().defaultRandom(), itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id), delta: integer('delta').notNull(),
  quantityAfter: integer('quantity_after').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('stock_events_item_idx').on(t.itemId)]);

export const shoppingEntries = pgTable('shopping_entries', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  houseId: uuid('house_id').notNull().references(() => houses.id, { onDelete: 'cascade' }),
  checked: boolean('checked').notNull().default(false),
  quantity: integer('quantity').notNull(), expiryDate: date('expiry_date'),
}, t => [index('shopping_house_idx').on(t.houseId), check('shopping_quantity_check', sql`${t.quantity} > 0 AND ${t.quantity} <= 999999`)]);
export const shoppingReceipts = pgTable('shopping_receipts', {
  houseId: uuid('house_id').notNull().references(() => houses.id, { onDelete: 'cascade' }),
  requestId: uuid('request_id').notNull(), count: integer('count').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.houseId, t.requestId] })]);
