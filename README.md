# OpenShelter

Sistema open-source para gestión de refugios de animales en Latinoamérica. Diseñado para ser self-hosted o desplegado en Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ssoronid/openshelter)

## Características

- 🐾 Gestión completa de animales (CRUD, estados, fotos)
- 👥 Sistema de usuarios y roles (admin, voluntario)
- 📊 Dashboard intuitivo
- 🔐 Autenticación segura con NextAuth.js
- 🐳 Self-hosting con Docker
- ☁️ Deployment en Vercel
- 📱 Responsive y accesible

## Stack Tecnológico

- **Frontend + Backend**: Next.js 14+ (App Router)
- **ORM**: Drizzle ORM
- **Base de datos**: PostgreSQL
- **Autenticación**: NextAuth.js (Auth.js)
- **Deployment**: Docker Compose (self-hosting) o Vercel (cloud)

## Requisitos Previos

- Node.js 20+
- npm o yarn
- PostgreSQL 16+ (para desarrollo local)
- Docker y Docker Compose (para self-hosting)

## Instalación Local

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/openshelter.git
cd openshelter
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus configuraciones:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/openshelter
NEXTAUTH_SECRET=tu-secret-key-aqui
NEXTAUTH_URL=http://localhost:3000
```

4. Genera y ejecuta las migraciones:

```bash
npm run db:generate
npm run db:push
```

5. Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Self-Hosting con Docker

Para instalar OpenShelter en tu propio servidor, consulta la [guía de self-hosting](SELFHOST.md).

**Inicio rápido:**
```bash
git clone https://github.com/ssoronid/openshelter.git
cd openshelter
cp .env.example .env
# Edita .env con tus configuraciones
docker-compose up -d
docker-compose exec app npm run db:push
```

La aplicación estará disponible en `http://tu-servidor:3000`

Para más detalles, configuración avanzada y troubleshooting, ve a [SELFHOST.md](SELFHOST.md).

## Deployment en Vercel

### Opción 1: Deploy con un clic

Haz clic en el botón de arriba o ve a [vercel.com/new](https://vercel.com/new) y:

1. Conecta tu cuenta de GitHub
2. Selecciona el repositorio `ssoronid/openshelter`
3. Vercel detectará automáticamente Next.js
4. Configura las variables de entorno (ver abajo)
5. Haz clic en **Deploy**

### Opción 2: Desde el Dashboard

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Haz clic en **Add New Project**
3. Selecciona el repositorio `openshelter`
4. Configura las variables de entorno
5. Haz clic en **Deploy**

### Variables de Entorno Requeridas

Configura estas variables en **Settings > Environment Variables**:

- `DATABASE_URL` - Connection string de Neon PostgreSQL (recomendado) o Vercel Postgres
- `NEXTAUTH_SECRET` - Genera con: `openssl rand -base64 32`
- `NEXTAUTH_URL` - URL de tu deployment (ej: `https://tu-proyecto.vercel.app`)
- `BLOB_READ_WRITE_TOKEN` - Se configura automáticamente al crear Blob Store en Vercel

**Nota:** Después del primer deploy, ejecuta las migraciones:
```bash
vercel env pull .env.local
npm run db:push
```

Para más detalles, consulta [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta ESLint
- `npm run type-check` - Verifica tipos de TypeScript
- `npm run db:generate` - Genera migraciones de Drizzle
- `npm run db:push` - Aplica migraciones a la base de datos
- `npm run db:studio` - Abre Drizzle Studio (UI para la base de datos)

## Estructura del Proyecto

```
openshelter/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Dashboard protegido
│   ├── api/               # API Routes
│   └── [public]/          # Páginas públicas
├── components/            # Componentes React
├── lib/                   # Utilidades
│   ├── db/               # Drizzle setup y schemas
│   ├── auth/             # NextAuth config
│   └── utils/            # Helpers
├── docker/               # Dockerfiles y configs
├── docker-compose.yml    # Self-hosting setup
└── vercel.json           # Config Vercel
```

## Desarrollo

Consulta [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) para guías de desarrollo, contribución y mejores prácticas.

## Licencia

MIT o Apache 2.0 (a definir)

## Contribuir

Las contribuciones son bienvenidas. Por favor, lee nuestras guías de contribución antes de enviar un PR.

## Roadmap

- [x] Fase 0: Setup inicial
- [ ] Fase 1: MVP - Gestión básica
- [ ] Fase 2: Adopciones y comunicación
- [ ] Fase 3: Salud y voluntariado
- [ ] Fase 4: Donaciones y financiamiento
- [ ] Fase 5: Expansión y productividad

Para más detalles, consulta el [roadmap completo](.cursor/plans/openshelter_roadmap_83bc1264.plan.md).

