import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white">
          <div className="p-6">
            <Link href="/dashboard" className="text-xl font-bold">
              🐾 OpenShelter
            </Link>
          </div>
          <nav className="mt-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/dashboard/animals"
              className="flex items-center px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              🐕 Animales
            </Link>
            <Link
              href="/dashboard/shelters"
              className="flex items-center px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              🏠 Refugios
            </Link>
            <Link
              href="/dashboard/adoptions"
              className="flex items-center px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              ❤️ Adopciones
            </Link>
            <Link
              href="/dashboard/users"
              className="flex items-center px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              👥 Usuarios
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div />
              <div className="flex gap-4 items-center">
                <span className="text-gray-700">{session.user?.email}</span>
                <Link
                  href="/api/auth/signout"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Salir
                </Link>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
