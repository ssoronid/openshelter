import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="z-10 max-w-5xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          🐾 OpenShelter
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema open-source para gestión de refugios de animales
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signin"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
