'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, X } from 'lucide-react'
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

interface AdoptionApplication {
  id: string
  animalId: string
  animalName?: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  status: string
  createdAt: string
}

export default function AdoptionList() {
  const [applications, setApplications] = useState<AdoptionApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)

      const response = await fetch(`/api/adoptions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setApplications(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    if (
      !confirm(
        `¿Estás seguro de ${status === 'approved' ? 'aprobar' : 'rechazar'} esta solicitud?`
      )
    )
      return

    try {
      const response = await fetch(`/api/adoptions/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchApplications()
      }
    } catch (error) {
      console.error('Error reviewing application:', error)
    }
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  }

  const statusVariants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    pending: 'outline',
    approved: 'default',
    rejected: 'destructive',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Cargando solicitudes...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div>
        <Select
          value={filter || 'all'}
          onValueChange={(value) => setFilter(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las solicitudes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las solicitudes</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Aprobadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron solicitudes
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Animal</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.animalName || app.animalId}
                  </TableCell>
                  <TableCell>{app.applicantName}</TableCell>
                  <TableCell>
                    <div className="text-sm">{app.applicantEmail}</div>
                    <div className="text-xs text-muted-foreground">
                      {app.applicantPhone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[app.status] || 'outline'}>
                      {statusLabels[app.status] || app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(app.id, 'approved')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(app.id, 'rejected')}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Rechazar
                        </Button>
                      </div>
                    )}
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
