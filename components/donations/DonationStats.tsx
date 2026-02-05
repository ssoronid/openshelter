'use client'

import { Banknote, TrendingUp, Calendar, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface DonationStatsData {
  totalAmount: number
  totalCount: number
  thisMonthAmount: number
  thisMonthCount: number
  currency: string
}

interface Props {
  stats: DonationStatsData
}

export default function DonationStats({ stats }: Props) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Recaudado',
      value: formatAmount(stats.totalAmount, stats.currency),
      icon: Banknote,
      description: `${stats.totalCount} donaciones`,
      valueClass: 'text-green-600',
    },
    {
      title: 'Este Mes',
      value: formatAmount(stats.thisMonthAmount, stats.currency),
      icon: Calendar,
      description: `${stats.thisMonthCount} donaciones`,
      valueClass: 'text-blue-600',
    },
    {
      title: 'Promedio por Donación',
      value: stats.totalCount > 0
        ? formatAmount(stats.totalAmount / stats.totalCount, stats.currency)
        : formatAmount(0, stats.currency),
      icon: TrendingUp,
      description: 'Monto promedio',
      valueClass: '',
    },
    {
      title: 'Donantes Activos',
      value: stats.thisMonthCount.toString(),
      icon: Users,
      description: 'Este mes',
      valueClass: '',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.valueClass}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}



