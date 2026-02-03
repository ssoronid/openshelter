'use client'

import { useState, useEffect } from 'react'

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
      if (filter) {
        params.append('status', filter)
      }

      const response = await fetch(`/api/adoptions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setApplications(data.data)
      } else {
        console.error('Error fetching applications:', data.error)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(`¿Estás seguro de ${status === 'approved' ? 'aprobar' : 'rechazar'} esta solicitud?`)) {
      return
    }

    try {
      const response = await fetch(`/api/adoptions/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchApplications()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al procesar solicitud')
      }
    } catch (error) {
      console.error('Error reviewing application:', error)
      alert('Error al procesar solicitud')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando solicitudes...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todas las solicitudes</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron solicitudes
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Animal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.animalName || app.animalId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.applicantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div>{app.applicantEmail}</div>
                      <div className="text-gray-500">{app.applicantPhone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        app.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {app.status === 'approved'
                        ? 'Aprobada'
                        : app.status === 'rejected'
                        ? 'Rechazada'
                        : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(app.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReview(app.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

