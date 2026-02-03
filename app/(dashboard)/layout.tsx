import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-gray-800 text-white">
          <div className="p-4">
            <h1 className="text-xl font-bold">OpenShelter</h1>
          </div>
          <nav className="mt-4">
            <a
              href="/dashboard"
              className="block px-4 py-2 hover:bg-gray-700"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/animals"
              className="block px-4 py-2 hover:bg-gray-700"
            >
              Animales
            </a>
            <a
              href="/dashboard/shelters"
              className="block px-4 py-2 hover:bg-gray-700"
            >
              Refugios
            </a>
            <a
              href="/dashboard/users"
              className="block px-4 py-2 hover:bg-gray-700"
            >
              Usuarios
            </a>
            <a
              href="/dashboard/adoptions"
              className="block px-4 py-2 hover:bg-gray-700"
            >
              Adopciones
            </a>
          </nav>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b p-4">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="flex gap-4 items-center">
                <span className="text-gray-700">{session.user?.email}</span>
                <a
                  href="/api/auth/signout"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Salir
                </a>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

