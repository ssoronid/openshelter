'use client'

import { useState, useEffect } from 'react'
import { Loader2, UserMinus, Shield } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface User {
  id: string
  name: string
  email: string
  image?: string
  role: string
  createdAt: string
}

interface Props {
  shelterId: string
  currentUserId: string
  isAdmin: boolean
}

export default function UserList({ shelterId, currentUserId, isAdmin }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [shelterId])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users?shelterId=${shelterId}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, shelterId }),
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al cambiar rol')
      }
    } catch (error) {
      console.error('Error changing role:', error)
      alert('Error al cambiar rol')
    }
  }

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar a "${userName}" del refugio?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}?shelterId=${shelterId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Error al eliminar usuario')
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando usuarios...</span>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay usuarios en este refugio
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    {user.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">(Tú)</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                {isAdmin && user.id !== currentUserId ? (
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="volunteer">Voluntario</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={roleVariants[user.role] || 'outline'}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                )}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  {user.id !== currentUserId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(user.id, user.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

