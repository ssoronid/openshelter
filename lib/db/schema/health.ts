import { pgTable, text, timestamp, date } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { animals } from './animals'

export const medicalRecords = pgTable('medical_records', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  animalId: text('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  recordType: text('record_type').notNull(), // 'vaccination', 'treatment', 'checkup', etc.
  description: text('description'),
  veterinarian: text('veterinarian'),
  date: date('date').notNull(),
  nextDate: date('next_date'), // For recurring treatments/vaccinations
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const vaccinations = pgTable('vaccinations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  animalId: text('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  vaccineType: text('vaccine_type').notNull(),
  date: date('date').notNull(),
  nextDate: date('next_date'), // Next vaccination due date
  veterinarian: text('veterinarian'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const treatments = pgTable('treatments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  animalId: text('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  treatmentType: text('treatment_type').notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  medication: text('medication'),
  dosage: text('dosage'),
  veterinarian: text('veterinarian'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})



