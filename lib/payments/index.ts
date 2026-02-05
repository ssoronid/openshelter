// Payment providers index
// Re-export all payment providers for easy access

// MercadoPago (Argentina, Paraguay, etc.)
export * from './mercadopago'

// Pagopar (Paraguay)
export * from './pagopar'

// Types
export type PaymentProvider = 'mercadopago' | 'pagopar'

export interface PaymentProviderInfo {
  id: PaymentProvider
  name: string
  countries: string[]
  currencies: string[]
  logo?: string
}

export const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    countries: ['AR', 'PY', 'BR', 'MX', 'CL', 'CO', 'PE', 'UY'],
    currencies: ['ARS', 'PYG', 'BRL', 'MXN', 'CLP', 'COP', 'PEN', 'UYU'],
  },
  {
    id: 'pagopar',
    name: 'Pagopar',
    countries: ['PY'],
    currencies: ['PYG', 'USD'],
  },
]

export function getProvidersByCountry(countryCode: string): PaymentProviderInfo[] {
  return PAYMENT_PROVIDERS.filter((p) => p.countries.includes(countryCode))
}

