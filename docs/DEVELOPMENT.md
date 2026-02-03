# Guía de Desarrollo

Esta guía cubre el setup del entorno de desarrollo, estructura del proyecto, y mejores prácticas.

## Setup del Entorno de Desarrollo

### Requisitos

- Node.js 20+
- PostgreSQL 16+ (o usar Docker)
- Git
- Editor de código (VS Code recomendado)

### Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/openshelter.git
cd openshelter
```

2. Instala dependencias:

```bash
npm install
```

3. Configura variables de entorno:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/openshelter_dev
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000
```

4. Inicia PostgreSQL (si no usas Docker):

```bash
# macOS con Homebrew
brew services start postgresql@16

# Linux
sudo systemctl start postgresql

# O usa Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16
```

5. Ejecuta migraciones:

```bash
npm run db:generate
npm run db:push
```

6. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## Estructura del Proyecto

```
openshelter/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Grupo de rutas de autenticación
│   │   └── signin/          # Página de login
│   ├── (dashboard)/         # Dashboard protegido
│   │   └── animals/         # Gestión de animales
│   ├── api/                 # API Routes
│   │   ├── auth/            # NextAuth endpoints
│   │   └── animals/        # API de animales
│   └── layout.tsx           # Layout raíz
├── components/               # Componentes React
│   ├── animals/             # Componentes de animales
│   ├── adoptions/           # Componentes de adopciones
│   └── shared/              # Componentes compartidos
├── lib/                     # Utilidades y configuraciones
│   ├── db/                  # Base de datos
│   │   ├── index.ts         # Conexión a DB
│   │   └── schema/          # Schemas de Drizzle
│   ├── auth/                # Configuración de NextAuth
│   └── utils/               # Funciones helper
├── types/                   # Definiciones de tipos TypeScript
├── public/                  # Archivos estáticos
├── docs/                    # Documentación
└── docker/                  # Configuraciones de Docker
```

## Convenciones de Código

### Naming

- **Componentes**: PascalCase (`AnimalCard.tsx`)
- **Funciones/Utilidades**: camelCase (`formatDate`, `validateEmail`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Tipos/Interfaces**: PascalCase (`Animal`, `UserRole`)

### Estructura de Componentes

```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/shared/Button'

// 2. Types
interface AnimalCardProps {
  animal: Animal
  onEdit: (id: string) => void
}

// 3. Component
export function AnimalCard({ animal, onEdit }: AnimalCardProps) {
  // 4. Hooks
  const [isLoading, setIsLoading] = useState(false)

  // 5. Handlers
  const handleEdit = () => {
    onEdit(animal.id)
  }

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### API Routes

```typescript
// app/api/animals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { animals } from '@/lib/db/schema'
import { z } from 'zod'

const createAnimalSchema = z.object({
  name: z.string().min(1),
  species: z.enum(['dog', 'cat', 'other']),
  // ...
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Lógica
  return NextResponse.json({ data: [] })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validated = createAnimalSchema.parse(body)

  // Lógica
  return NextResponse.json({ data: {} }, { status: 201 })
}
```

## Base de Datos

### Schemas

Los schemas están en `lib/db/schema/`. Cada dominio tiene su propio archivo:

- `users.ts` - Usuarios y autenticación
- `shelters.ts` - Refugios
- `animals.ts` - Animales y fotos
- `roles.ts` - Roles y permisos

### Migraciones

1. Modifica el schema en `lib/db/schema/`
2. Genera la migración:

```bash
npm run db:generate
```

3. Revisa los archivos generados en `drizzle/`
4. Aplica la migración:

```bash
npm run db:push  # Desarrollo
# o
npm run db:migrate  # Producción
```

### Drizzle Studio

Para inspeccionar la base de datos visualmente:

```bash
npm run db:studio
```

Abre [http://localhost:4983](http://localhost:4983)

## Testing

### Ejecutar Tests

```bash
npm test
```

### Escribir Tests

Los tests van en `__tests__/` o junto a los archivos con `.test.ts`.

## Linting y Formateo

### ESLint

```bash
npm run lint
```

### Prettier

```bash
npx prettier --write .
```

### Type Check

```bash
npm run type-check
```

## Git Workflow

1. Crea una rama desde `main`:

```bash
git checkout -b feature/nombre-de-feature
```

2. Haz commits frecuentes con mensajes descriptivos:

```bash
git commit -m "feat: agregar formulario de creación de animales"
```

3. Push y crea un Pull Request:

```bash
git push origin feature/nombre-de-feature
```

### Convenciones de Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva feature
- `fix:` Bug fix
- `docs:` Documentación
- `style:` Formato, punto y coma, etc.
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Mantenimiento

## Debugging

### VS Code

Configuración de launch.json:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### Logs

Usa `console.log` para desarrollo, pero considera usar un logger en producción.

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

