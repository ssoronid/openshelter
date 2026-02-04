import { pgTable, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { users } from './users'
import { shelters } from './shelters'

export const notificationTypeEnum = pgEnum('notification_type', [
  'new_application',
  'application_approved',
  'application_rejected',
  'animal_adopted',
  'system',
])

export const notifications = pgTable('notifications', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  shelterId: text('shelter_id')
    .references(() => shelters.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})


