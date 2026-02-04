'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2, Receipt } from 'lucide-react'
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

interface Expense {
  id: string
  shelterId: string
  shelterName?: string
  animalId?: string
  animalName?: string
  category: string
  description: string
  amount: string
  currency: string
  date: string
  receipt?: string
  createdBy: string
  createdAt: string
}

interface Props {
  shelterId?: string
}

export default function ExpenseList({ shelterId }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [categoryFilter, shelterId])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter) params.append('category', categoryFilter)
      if (shelterId) params.append('shelterId', shelterId)

      const response = await fetch(`/api/expenses?${params}`)
      const data = await response.json()

      if (response.ok) {
        setExpenses(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchExpenses()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar gasto')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const categoryLabels: Record<string, string> = {
    food: 'Alimentación',
    medical: 'Médico/Veterinario',
    shelter: 'Mantenimiento',
    supplies: 'Suministros',
    transport: 'Transporte',
    utilities: 'Servicios',
    salary: 'Salarios',
    other: 'Otro',
  }

  const categoryVariants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    food: 'default',
    medical: 'destructive',
    shelter: 'secondary',
    supplies: 'outline',
    transport: 'outline',
    utilities: 'secondary',
    salary: 'default',
    other: 'outline',
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
        <span className="ml-2 text-muted-foreground">Cargando gastos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={categoryFilter || 'all'}
          onValueChange={(value) =>
            setCategoryFilter(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="food">Alimentación</SelectItem>
            <SelectItem value="medical">Médico/Veterinario</SelectItem>
            <SelectItem value="shelter">Mantenimiento</SelectItem>
            <SelectItem value="supplies">Suministros</SelectItem>
            <SelectItem value="transport">Transporte</SelectItem>
            <SelectItem value="utilities">Servicios</SelectItem>
            <SelectItem value="salary">Salarios</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron gastos
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead>Recibo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate font-medium">
                      {expense.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={categoryVariants[expense.category] || 'outline'}
                    >
                      {categoryLabels[expense.category] || expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-red-600">
                    -{formatAmount(expense.amount, expense.currency)}
                  </TableCell>
                  <TableCell>
                    {expense.animalName ? (
                      <span className="text-sm">{expense.animalName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {expense.receipt ? (
                      <a
                        href={expense.receipt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Receipt className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
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
                            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará
                              permanentemente el registro de este gasto.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(expense.id)}
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

