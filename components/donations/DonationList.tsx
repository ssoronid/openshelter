'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2, Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Donation {
  id: string
  shelterId: string
  shelterName?: string
  animalId?: string
  animalName?: string
  amount: string
  currency: string
  paymentMethod: string
  status: string
  donorName?: string
  donorEmail?: string
  donorPhone?: string
  message?: string
  date: string
  createdAt: string
}

interface Props {
  shelterId?: string
}

export default function DonationList({ shelterId }: Props) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  useEffect(() => {
    fetchDonations()
  }, [statusFilter, methodFilter, shelterId])

  const fetchDonations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (methodFilter) params.append('paymentMethod', methodFilter)
      if (shelterId) params.append('shelterId', shelterId)

      const response = await fetch(`/api/donations?${params}`)
      const data = await response.json()

      if (response.ok) {
        setDonations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching donations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDonations()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar donación')
      }
    } catch (error) {
      console.error('Error deleting donation:', error)
    }
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    completed: 'Completada',
    failed: 'Fallida',
    refunded: 'Reembolsada',
  }

  const statusVariants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    pending: 'outline',
    completed: 'default',
    failed: 'destructive',
    refunded: 'secondary',
  }

  const paymentMethodLabels: Record<string, string> = {
    mercadopago: 'MercadoPago',
    pix: 'PIX',
    paypal: 'PayPal',
    bank_transfer: 'Transferencia',
    cash: 'Efectivo',
    other: 'Otro',
  }

  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Cargando donaciones...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="failed">Fallidas</SelectItem>
            <SelectItem value="refunded">Reembolsadas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={methodFilter || 'all'}
          onValueChange={(value) => setMethodFilter(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los métodos</SelectItem>
            <SelectItem value="mercadopago">MercadoPago</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="bank_transfer">Transferencia</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {donations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron donaciones
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Donante</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Para</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(donation.date).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {donation.donorName || 'Anónimo'}
                    </div>
                    {donation.donorEmail && (
                      <div className="text-xs text-muted-foreground">
                        {donation.donorEmail}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatAmount(donation.amount, donation.currency)}
                  </TableCell>
                  <TableCell>
                    {paymentMethodLabels[donation.paymentMethod] || donation.paymentMethod}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[donation.status] || 'outline'}>
                      {statusLabels[donation.status] || donation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {donation.animalName ? (
                      <span className="text-sm">{donation.animalName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {donation.shelterName || 'Refugio'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar donación?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará
                              permanentemente el registro de esta donación.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(donation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

