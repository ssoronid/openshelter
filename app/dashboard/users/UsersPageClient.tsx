'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import UserList from '@/components/users/UserList'
import InviteUserForm from '@/components/users/InviteUserForm'

interface Shelter {
  id: string
  name: string
  role: string
}

interface Props {
  shelters: Shelter[]
  currentShelterId: string
  currentUserId: string
  isAdmin: boolean
}

export default function UsersPageClient({
  shelters,
  currentShelterId,
  currentUserId,
  isAdmin,
}: Props) {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleShelterChange = (shelterId: string) => {
    router.push(`/dashboard/users?shelterId=${shelterId}`)
  }

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios y sus permisos
          </p>
        </div>
        {isAdmin && (
          <InviteUserForm shelterId={currentShelterId} onSuccess={handleUserAdded} />
        )}
      </div>

      {shelters.length > 1 && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Refugio:</span>
          <Select value={currentShelterId} onValueChange={handleShelterChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {shelters.map((shelter) => (
                <SelectItem key={shelter.id} value={shelter.id}>
                  {shelter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <UserList
        key={refreshKey}
        shelterId={currentShelterId}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  )
}


