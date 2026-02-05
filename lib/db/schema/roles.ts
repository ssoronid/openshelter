import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { users } from './users'
import { shelters } from './shelters'

export const roleEnum = pgEnum('role_type', ['admin', 'volunteer', 'viewer'])

export const userRoles = pgTable('user_roles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  shelterId: text('shelter_id')
    .notNull()
    .references(() => shelters.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().default('volunteer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})




