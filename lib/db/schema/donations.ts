import { pgTable, text, timestamp, decimal, pgEnum, date } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { shelters } from './shelters'
import { animals } from './animals'

export const paymentMethodEnum = pgEnum('payment_method', [
  'mercadopago',
  'pix',
  'paypal',
  'bank_transfer',
  'cash',
  'other',
])

export const donationStatusEnum = pgEnum('donation_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
])

export const donations = pgTable('donations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  shelterId: text('shelter_id')
    .notNull()
    .references(() => shelters.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').references(() => animals.id, {
    onDelete: 'set null',
  }), // Optional: for animal-specific donations
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status: donationStatusEnum('status').notNull().default('pending'),
  donorName: text('donor_name'),
  donorEmail: text('donor_email'),
  donorPhone: text('donor_phone'),
  message: text('message'),
  paymentId: text('payment_id'), // External payment provider ID
  transactionId: text('transaction_id'),
  date: date('date').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sponsorships = pgTable('sponsorships', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  animalId: text('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  sponsorName: text('sponsor_name').notNull(),
  sponsorEmail: text('sponsor_email').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: text('frequency').notNull().default('monthly'), // 'monthly', 'yearly'
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  isActive: text('is_active').default('true'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const expenses = pgTable('expenses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  shelterId: text('shelter_id')
    .notNull()
    .references(() => shelters.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').references(() => animals.id, {
    onDelete: 'set null',
  }), // Optional: for animal-specific expenses
  category: text('category').notNull(), // 'food', 'medical', 'shelter', 'other'
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  date: date('date').notNull(),
  receipt: text('receipt'), // URL to receipt image
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})



