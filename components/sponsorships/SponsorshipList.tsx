'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2, UserCheck, UserX } from 'lucide-react'
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

interface Sponsorship {
    id: string
    animalId: string
    animalName?: string
    animalSpecies?: string
    shelterId?: string
    sponsorName: string
    sponsorEmail: string
    amount: string
    frequency: string
    startDate: string
    endDate?: string
    isActive: string
    paymentMethod: string
    createdAt: string
}

export default function SponsorshipList() {
    const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        fetchSponsorships()
    }, [statusFilter])

    const fetchSponsorships = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter) params.append('isActive', statusFilter)

            const response = await fetch(`/api/sponsorships?${params}`)
            const data = await response.json()

            if (response.ok) {
                setSponsorships(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching sponsorships:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'true' ? 'false' : 'true'
            const response = await fetch(`/api/sponsorships/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus }),
            })

            if (response.ok) {
                fetchSponsorships()
            } else {
                const data = await response.json()
                alert(data.error || 'Error al actualizar apadrinamiento')
            }
        } catch (error) {
            console.error('Error updating sponsorship:', error)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/sponsorships/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchSponsorships()
            } else {
                const data = await response.json()
                alert(data.error || 'Error al eliminar apadrinamiento')
            }
        } catch (error) {
            console.error('Error deleting sponsorship:', error)
        }
    }

    const frequencyLabels: Record<string, string> = {
        monthly: 'Mensual',
        yearly: 'Anual',
    }

    const paymentMethodLabels: Record<string, string> = {
        mercadopago: 'MercadoPago',
        pix: 'PIX',
        paypal: 'PayPal',
        bank_transfer: 'Transferencia',
        cash: 'Efectivo',
        other: 'Otro',
    }

    const speciesLabels: Record<string, string> = {
        dog: '🐕',
        cat: '🐱',
        other: '🐾',
    }

    const formatAmount = (amount: string) => {
        const num = parseFloat(amount)
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(num)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                    Cargando apadrinamientos...
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
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Activos</SelectItem>
                        <SelectItem value="false">Inactivos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {sponsorships.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No se encontraron apadrinamientos
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Animal</TableHead>
                                <TableHead>Padrino</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Frecuencia</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Inicio</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sponsorships.map((sponsorship) => (
                                <TableRow key={sponsorship.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span>
                                                {speciesLabels[sponsorship.animalSpecies || ''] || '🐾'}
                                            </span>
                                            <span className="font-medium">
                                                {sponsorship.animalName || sponsorship.animalId}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{sponsorship.sponsorName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {sponsorship.sponsorEmail}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-green-600">
                                        {formatAmount(sponsorship.amount)}
                                    </TableCell>
                                    <TableCell>
                                        {frequencyLabels[sponsorship.frequency] || sponsorship.frequency}
                                    </TableCell>
                                    <TableCell>
                                        {paymentMethodLabels[sponsorship.paymentMethod] || sponsorship.paymentMethod}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={sponsorship.isActive === 'true' ? 'default' : 'secondary'}
                                        >
                                            {sponsorship.isActive === 'true' ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(sponsorship.startDate).toLocaleDateString('es-ES')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleToggleActive(sponsorship.id, sponsorship.isActive)
                                                }
                                                title={
                                                    sponsorship.isActive === 'true' ? 'Desactivar' : 'Activar'
                                                }
                                            >
                                                {sponsorship.isActive === 'true' ? (
                                                    <UserX className="h-4 w-4" />
                                                ) : (
                                                    <UserCheck className="h-4 w-4" />
                                                )}
                                            </Button>
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
                                                        <AlertDialogTitle>
                                                            ¿Eliminar apadrinamiento?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Se eliminará
                                                            permanentemente el registro de este apadrinamiento.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(sponsorship.id)}
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

