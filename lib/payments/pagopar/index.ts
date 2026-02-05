import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { shelterPagoparCredentials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const PAGOPAR_API_URL = 'https://api.pagopar.com/api'

/**
 * Generate SHA1 token for Pagopar API authentication
 */
function generateToken(privateKey: string, ...values: string[]): string {
  const data = privateKey + values.join('')
  return createHash('sha1').update(data).digest('hex')
}

/**
 * Get Pagopar credentials for a specific shelter
 */
export async function getShelterPagoparCredentials(shelterId: string) {
  const [credentials] = await db
    .select()
    .from(shelterPagoparCredentials)
    .where(eq(shelterPagoparCredentials.shelterId, shelterId))
    .limit(1)

  return credentials || null
}

export interface PagoparBuyer {
  ruc?: string
  email: string
  ciudad?: string
  nombre: string
  telefono: string
  direccion?: string
  documento: string
  coordenadas?: string
  razon_social?: string
  tipo_documento?: string
  direccion_referencia?: string
}

export interface PagoparItem {
  ciudad?: string
  nombre: string
  cantidad: number
  categoria?: string
  public_key: string
  url_imagen?: string
  descripcion: string
  id_producto: string
  precio_total: number
  vendedor_telefono?: string
  vendedor_direccion?: string
  vendedor_direccion_referencia?: string
  vendedor_direccion_coordenadas?: string
}

export interface CreatePagoparTransactionParams {
  shelterId: string
  orderId: string
  amount: number
  description: string
  buyer: PagoparBuyer
  items?: PagoparItem[]
  maxPaymentDate?: Date
  paymentMethod?: number // forma_pago ID
}

export interface PagoparTransactionResponse {
  respuesta: boolean
  resultado: {
    data: string // hash_pedido
    pedido: string
  }[]
}

/**
 * Create a Pagopar transaction (Paso #1)
 * Returns the hash to redirect user to checkout
 */
export async function createPagoparTransaction(
  params: CreatePagoparTransactionParams
): Promise<{ hash: string; orderId: string } | null> {
  const credentials = await getShelterPagoparCredentials(params.shelterId)

  if (!credentials) {
    throw new Error('Pagopar not configured for this shelter')
  }

  const { publicKey, privateKey } = credentials

  // Generate token: sha1(private_key + orderId + amount)
  const token = generateToken(privateKey, params.orderId, params.amount.toString())

  // Default max payment date: 7 days from now
  const maxPaymentDate =
    params.maxPaymentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const formattedDate = maxPaymentDate.toISOString().replace('T', ' ').slice(0, 19)

  // Build items array
  const items: PagoparItem[] = params.items || [
    {
      ciudad: '1',
      nombre: params.description,
      cantidad: 1,
      categoria: '909', // Default category for non-physical products
      public_key: publicKey,
      url_imagen: '',
      descripcion: params.description,
      id_producto: `donation-${params.shelterId}`,
      precio_total: params.amount,
      vendedor_telefono: '',
      vendedor_direccion: '',
      vendedor_direccion_referencia: '',
      vendedor_direccion_coordenadas: '',
    },
  ]

  const requestBody = {
    token,
    comprador: {
      ruc: params.buyer.ruc || '',
      email: params.buyer.email,
      ciudad: params.buyer.ciudad || '1',
      nombre: params.buyer.nombre,
      telefono: params.buyer.telefono,
      direccion: params.buyer.direccion || '',
      documento: params.buyer.documento,
      coordenadas: params.buyer.coordenadas || '',
      razon_social: params.buyer.razon_social || params.buyer.nombre,
      tipo_documento: params.buyer.tipo_documento || 'CI',
      direccion_referencia: params.buyer.direccion_referencia || null,
    },
    public_key: publicKey,
    monto_total: params.amount,
    tipo_pedido: 'VENTA-COMERCIO',
    compras_items: items,
    fecha_maxima_pago: formattedDate,
    id_pedido_comercio: params.orderId,
    descripcion_resumen: params.description,
    forma_pago: params.paymentMethod || 9, // Default: credit card (Bancard)
  }

  try {
    const response = await fetch(`${PAGOPAR_API_URL}/comercios/2.0/iniciar-transaccion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data: PagoparTransactionResponse = await response.json()

    if (!data.respuesta || !data.resultado?.[0]?.data) {
      console.error('Pagopar transaction error:', data)
      return null
    }

    return {
      hash: data.resultado[0].data,
      orderId: data.resultado[0].pedido,
    }
  } catch (error) {
    console.error('Error creating Pagopar transaction:', error)
    return null
  }
}

/**
 * Get Pagopar checkout URL
 */
export function getPagoparCheckoutUrl(hash: string, paymentMethod?: number): string {
  const baseUrl = `https://www.pagopar.com/pagos/${hash}`
  if (paymentMethod) {
    return `${baseUrl}?forma_pago=${paymentMethod}`
  }
  return baseUrl
}

export interface PagoparWebhookPayload {
  resultado: {
    pagado: boolean
    numero_comprobante_interno: string
    ultimo_mensaje_error: string | null
    forma_pago: string
    fecha_pago: string | null
    monto: string
    fecha_maxima_pago: string
    hash_pedido: string
    numero_pedido: string
    cancelado: boolean
    forma_pago_identificador: string
    token: string
  }[]
  respuesta: boolean
}

/**
 * Validate Pagopar webhook token
 */
export function validatePagoparWebhookToken(
  privateKey: string,
  hashPedido: string,
  receivedToken: string
): boolean {
  const expectedToken = generateToken(privateKey, hashPedido)
  return expectedToken === receivedToken
}

export interface PagoparOrderStatus {
  pagado: boolean
  forma_pago: string
  fecha_pago: string | null
  monto: string
  fecha_maxima_pago: string
  hash_pedido: string
  numero_pedido: string
  cancelado: boolean
  forma_pago_identificador: string
  token: string
  mensaje_resultado_pago?: {
    titulo: string
    descripcion: string
  }
}

/**
 * Get order status from Pagopar (Paso #4)
 */
export async function getPagoparOrderStatus(
  shelterId: string,
  hashPedido: string
): Promise<PagoparOrderStatus | null> {
  const credentials = await getShelterPagoparCredentials(shelterId)

  if (!credentials) {
    throw new Error('Pagopar not configured for this shelter')
  }

  const { publicKey, privateKey } = credentials

  // Token for query: sha1(private_key + "CONSULTA")
  const token = generateToken(privateKey, 'CONSULTA')

  try {
    const response = await fetch(`${PAGOPAR_API_URL}/pedidos/1.1/traer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hash_pedido: hashPedido,
        token,
        token_publico: publicKey,
      }),
    })

    const data = await response.json()

    if (!data.respuesta || !data.resultado?.[0]) {
      console.error('Pagopar order status error:', data)
      return null
    }

    return data.resultado[0]
  } catch (error) {
    console.error('Error getting Pagopar order status:', error)
    return null
  }
}

/**
 * Available Pagopar payment methods
 */
export const PAGOPAR_PAYMENT_METHODS = [
  { id: 9, name: 'Tarjetas de crédito/débito (Bancard)', icon: 'credit-card' },
  { id: 10, name: 'Tigo Money', icon: 'smartphone' },
  { id: 12, name: 'Billetera Personal', icon: 'wallet' },
  { id: 18, name: 'Zimple', icon: 'zap' },
  { id: 20, name: 'Wally', icon: 'wallet' },
  { id: 24, name: 'Pago QR', icon: 'qr-code' },
  { id: 11, name: 'Transferencia Bancaria', icon: 'building' },
  { id: 2, name: 'Aqui Pago', icon: 'store' },
  { id: 3, name: 'Pago Express', icon: 'store' },
  { id: 25, name: 'PIX', icon: 'qr-code' },
] as const

