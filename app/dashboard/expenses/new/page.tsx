import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExpenseForm from '@/components/expenses/ExpenseForm'

export default async function NewExpensePage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Gasto</h1>
        <p className="text-muted-foreground">
          Registra un gasto o egreso del refugio
        </p>
      </div>

      <ExpenseForm />
    </div>
  )
}



