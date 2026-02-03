'use client'

import { useState } from 'react'

interface AdoptionFormProps {
  animalId: string
}

export default function AdoptionForm({ animalId }: AdoptionFormProps) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    applicantAddress: '',
    applicantCity: '',
    applicantCountry: '',
    reason: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/adoptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          animalId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert(data.error || 'Error al enviar solicitud')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Error al enviar solicitud')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-xl font-bold mb-2">
          ¡Solicitud enviada!
        </div>
        <p className="text-gray-600">
          Tu solicitud de adopción ha sido enviada. El refugio se pondrá en
          contacto contigo pronto.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="applicantName" className="block text-sm font-medium mb-1">
          Nombre completo *
        </label>
        <input
          type="text"
          id="applicantName"
          value={formData.applicantName}
          onChange={(e) =>
            setFormData({ ...formData, applicantName: e.target.value })
          }
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="applicantEmail"
            className="block text-sm font-medium mb-1"
          >
            Email *
          </label>
          <input
            type="email"
            id="applicantEmail"
            value={formData.applicantEmail}
            onChange={(e) =>
              setFormData({ ...formData, applicantEmail: e.target.value })
            }
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="applicantPhone"
            className="block text-sm font-medium mb-1"
          >
            Teléfono *
          </label>
          <input
            type="tel"
            id="applicantPhone"
            value={formData.applicantPhone}
            onChange={(e) =>
              setFormData({ ...formData, applicantPhone: e.target.value })
            }
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="applicantAddress"
          className="block text-sm font-medium mb-1"
        >
          Dirección
        </label>
        <input
          type="text"
          id="applicantAddress"
          value={formData.applicantAddress}
          onChange={(e) =>
            setFormData({ ...formData, applicantAddress: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="applicantCity"
            className="block text-sm font-medium mb-1"
          >
            Ciudad
          </label>
          <input
            type="text"
            id="applicantCity"
            value={formData.applicantCity}
            onChange={(e) =>
              setFormData({ ...formData, applicantCity: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="applicantCountry"
            className="block text-sm font-medium mb-1"
          >
            País
          </label>
          <input
            type="text"
            id="applicantCountry"
            value={formData.applicantCountry}
            onChange={(e) =>
              setFormData({ ...formData, applicantCountry: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium mb-1">
          ¿Por qué quieres adoptar?
        </label>
        <textarea
          id="reason"
          value={formData.reason}
          onChange={(e) =>
            setFormData({ ...formData, reason: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar Solicitud'}
      </button>
    </form>
  )
}

