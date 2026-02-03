'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, PawPrint, Building2, User, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  // Admin form data
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Shelter form data
  const [shelterData, setShelterData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  })

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()

      if (!data.needsSetup) {
        router.push('/signin')
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking setup status:', error)
      setError('Error al verificar el estado del sistema')
      setLoading(false)
    }
  }

  const validateStep1 = () => {
    if (!adminData.name || !adminData.email || !adminData.password) {
      setError('Todos los campos son requeridos')
      return false
    }
    if (adminData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    if (adminData.password !== adminData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (!shelterData.name) {
      setError('El nombre del refugio es requerido')
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: adminData.name,
          adminEmail: adminData.email,
          adminPassword: adminData.password,
          shelterName: shelterData.name,
          shelterDescription: shelterData.description,
          shelterAddress: shelterData.address,
          shelterPhone: shelterData.phone,
          shelterEmail: shelterData.email,
          shelterWebsite: shelterData.website,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al configurar el sistema')
        setSubmitting(false)
        return
      }

      // Auto sign in
      const signInResult = await signIn('credentials', {
        email: adminData.email,
        password: adminData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push('/signin')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Setup error:', error)
      setError('Error al configurar el sistema')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary p-3">
              <PawPrint className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Configuración Inicial</CardTitle>
          <CardDescription>
            Configura tu cuenta de administrador y tu primer refugio
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`w-12 h-1 ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Building2 className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <>
                <div className="text-center mb-4">
                  <h3 className="font-semibold">Paso 1: Tu cuenta de administrador</h3>
                  <p className="text-sm text-muted-foreground">
                    Crea tu cuenta para gestionar el sistema
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminName">Nombre completo</Label>
                  <Input
                    id="adminName"
                    placeholder="Tu nombre"
                    value={adminData.name}
                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="tu@email.com"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Contraseña</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={adminData.confirmPassword}
                    onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleNext}
                  disabled={submitting}
                >
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-4">
                  <h3 className="font-semibold">Paso 2: Tu refugio</h3>
                  <p className="text-sm text-muted-foreground">
                    Configura la información de tu refugio
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelterName">Nombre del refugio *</Label>
                  <Input
                    id="shelterName"
                    placeholder="Nombre de tu refugio"
                    value={shelterData.name}
                    onChange={(e) => setShelterData({ ...shelterData, name: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelterDescription">Descripción</Label>
                  <Textarea
                    id="shelterDescription"
                    placeholder="Breve descripción del refugio"
                    rows={3}
                    value={shelterData.description}
                    onChange={(e) => setShelterData({ ...shelterData, description: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shelterPhone">Teléfono</Label>
                    <Input
                      id="shelterPhone"
                      placeholder="+54 11 1234-5678"
                      value={shelterData.phone}
                      onChange={(e) => setShelterData({ ...shelterData, phone: e.target.value })}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shelterEmail">Email del refugio</Label>
                    <Input
                      id="shelterEmail"
                      type="email"
                      placeholder="refugio@email.com"
                      value={shelterData.email}
                      onChange={(e) => setShelterData({ ...shelterData, email: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelterAddress">Dirección</Label>
                  <Input
                    id="shelterAddress"
                    placeholder="Dirección del refugio"
                    value={shelterData.address}
                    onChange={(e) => setShelterData({ ...shelterData, address: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelterWebsite">Sitio web</Label>
                  <Input
                    id="shelterWebsite"
                    placeholder="https://mirefugio.com"
                    value={shelterData.website}
                    onChange={(e) => setShelterData({ ...shelterData, website: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleBack}
                    disabled={submitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        Completar
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

