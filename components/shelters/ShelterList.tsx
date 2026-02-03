'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Building2, Edit, Trash2, Users, Dog } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Shelter {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  role?: string
  createdAt: string
}

export default function ShelterList() {
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShelters()
  }, [])

  const fetchShelters = async () => {
    try {
      const response = await fetch('/api/shelters')
      const data = await response.json()

      if (response.ok) {
        setShelters(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching shelters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el refugio "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/shelters/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchShelters()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar refugio')
      }
    } catch (error) {
      console.error('Error deleting shelter:', error)
      alert('Error al eliminar refugio')
    }
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    volunteer: 'Voluntario',
    viewer: 'Visualizador',
  }

  const roleVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    volunteer: 'secondary',
    viewer: 'outline',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando refugios...</span>
      </div>
    )
  }

  if (shelters.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tienes refugios</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer refugio para comenzar a gestionar animales
          </p>
          <Button asChild>
            <Link href="/dashboard/shelters/new">Crear Refugio</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Refugio</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Tu rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shelters.map((shelter) => (
            <TableRow key={shelter.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{shelter.name}</div>
                  {shelter.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {shelter.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {shelter.email && <div>{shelter.email}</div>}
                  {shelter.phone && (
                    <div className="text-muted-foreground">{shelter.phone}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={roleVariants[shelter.role || 'viewer'] || 'outline'}>
                  {roleLabels[shelter.role || 'viewer'] || shelter.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/dashboard/shelters/${shelter.id}`}>
                      <Dog className="h-4 w-4" />
                    </Link>
                  </Button>
                  {shelter.role === 'admin' && (
                    <>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/dashboard/shelters/${shelter.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(shelter.id, shelter.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

