import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const shelters = pgTable('shelters', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// MercadoPago OAuth credentials per shelter
export const shelterMercadopagoCredentials = pgTable('shelter_mercadopago_credentials', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  shelterId: text('shelter_id')
    .notNull()
    .unique()
    .references(() => shelters.id, { onDelete: 'cascade' }),
  mpUserId: text('mp_user_id').notNull(),
  mpNickname: text('mp_nickname'),
  mpEmail: text('mp_email'),
  mpSiteId: text('mp_site_id'),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  publicKey: text('public_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})


