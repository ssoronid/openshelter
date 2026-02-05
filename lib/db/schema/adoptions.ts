import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { animals } from './animals'

export const applicationStatusEnum = pgEnum('application_status', [
  'pending',
  'approved',
  'rejected',
])

export const adoptionApplications = pgTable('adoption_applications', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  animalId: text('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  applicantName: text('applicant_name').notNull(),
  applicantEmail: text('applicant_email').notNull(),
  applicantPhone: text('applicant_phone').notNull(),
  applicantAddress: text('applicant_address'),
  applicantCity: text('applicant_city'),
  applicantCountry: text('applicant_country'),
  reason: text('reason'),
  status: applicationStatusEnum('status').notNull().default('pending'),
  notes: text('notes'), // Internal notes from shelter staff
  reviewedBy: text('reviewed_by'), // User ID who reviewed
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})




