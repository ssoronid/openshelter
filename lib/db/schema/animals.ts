import { pgTable, text, timestamp, pgEnum, integer, boolean } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { shelters } from './shelters'

export const animalStatusEnum = pgEnum('animal_status', [
  'available',
  'adopted',
  'deceased',
  'in_treatment',
])

export const animalSpeciesEnum = pgEnum('animal_species', ['dog', 'cat', 'other'])

export const animals = pgTable('animals', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  shelterId: text('shelter_id')
    .notNull()
    .references(() => shelters.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  species: animalSpeciesEnum('species').notNull(),
  breed: text('breed'),
  age: integer('age'), // Age in months
  status: animalStatusEnum('status').notNull().default('available'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const animalPhotos = pgTable('animal_photos', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  animalId: text('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

