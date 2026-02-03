# Guía de Deployment en Vercel

Esta guía te ayudará a desplegar OpenShelter en Vercel con Neon PostgreSQL y Vercel Blob Storage.

## Requisitos Previos

- Cuenta en Vercel (gratuita)
- Cuenta en [Neon](https://neon.tech) (gratuita)
- Repositorio en GitHub, GitLab o Bitbucket

## Configuración Paso a Paso

### 1. Crear Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) y conecta tu repositorio
2. Vercel detectará automáticamente Next.js
3. Haz clic en **Deploy** (puedes configurar las variables de entorno después)

### 2. Configurar Neon PostgreSQL (Recomendado para Drizzle)

Neon es optimizado para Drizzle ORM y ofrece connection pooling automático.

#### 2.1. Crear Base de Datos en Neon

1. Ve a [console.neon.tech](https://console.neon.tech) y crea una cuenta
2. Crea un nuevo proyecto
3. Selecciona la región más cercana a tus usuarios
4. Una vez creado, Neon te mostrará la **Connection String**

#### 2.2. Configurar Connection String en Vercel

1. En el dashboard de Vercel, ve a tu proyecto
2. Navega a **Settings > Environment Variables**
3. Agrega la siguiente variable:

```
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Importante**: 
- Copia la connection string completa de Neon (incluye `?sslmode=require`)
- Selecciona los entornos donde aplicará: **Production**, **Preview**, y **Development**
- Neon permite conexiones desde cualquier IP, no necesitas whitelist

### 3. Configurar Vercel Blob Storage

Vercel Blob Storage es la opción más simple para almacenar imágenes de animales.

#### 3.1. Crear Blob Store

1. En el dashboard de Vercel, ve a tu proyecto
2. Navega a **Storage** (en el menú lateral)
3. Haz clic en **Create Database** o **Add Storage**
4. Selecciona **Blob**
5. Dale un nombre (ej: `openshelter-blob`)
6. Haz clic en **Create**

#### 3.2. Variables Automáticas

Vercel configurará automáticamente las siguientes variables de entorno:
- `BLOB_READ_WRITE_TOKEN` - Token para leer y escribir archivos

**No necesitas hacer nada más** - estas variables estarán disponibles automáticamente en todos tus deployments.

### 4. Configurar Variables de Entorno Restantes

En **Settings > Environment Variables**, agrega:

```
NEXTAUTH_SECRET=tu-secret-generado-con-openssl-rand-base64-32
NEXTAUTH_URL=https://tu-proyecto.vercel.app
```

**Para generar NEXTAUTH_SECRET**:

```bash
openssl rand -base64 32
```

**Nota**: 
- Para producción, actualiza `NEXTAUTH_URL` con tu dominio personalizado
- Selecciona los entornos apropiados para cada variable

### 5. Verificar Variables de Entorno

Puedes usar el script de validación incluido:

```bash
npm run setup:check-env
```

Este script verifica que todas las variables necesarias estén configuradas.

### 6. Ejecutar Migraciones

Después del primer deployment, ejecuta las migraciones:

```bash
# Instala Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Descarga variables de entorno localmente
vercel env pull .env.local

# Ejecuta migraciones
npm run db:push
```

**Alternativa**: Puedes ejecutar comandos desde el dashboard de Vercel:
1. Ve a **Deployments**
2. Selecciona tu último deployment
3. Abre la terminal y ejecuta `npm run db:push`

### 7. Variables de Entorno Completas

Tu proyecto debería tener estas variables configuradas:

| Variable | Descripción | Fuente |
|----------|-------------|--------|
| `DATABASE_URL` | Connection string de Neon | Manual (desde Neon dashboard) |
| `NEXTAUTH_SECRET` | Secret para NextAuth | Manual (generado) |
| `NEXTAUTH_URL` | URL de la aplicación | Manual |
| `BLOB_READ_WRITE_TOKEN` | Token para Vercel Blob | Automático (al crear Blob Store) |

## Alternativas

### Base de Datos: Vercel Postgres

Si prefieres usar Vercel Postgres en lugar de Neon:

1. En el dashboard de Vercel, ve a **Storage**
2. Crea una nueva base de datos **Postgres**
3. Vercel creará automáticamente `POSTGRES_URL`
4. Configura `DATABASE_URL=$POSTGRES_URL` en variables de entorno

**Nota**: Neon es recomendado para Drizzle porque ofrece mejor connection pooling y es más económico en el plan gratuito.

### Storage: S3 o Compatible

Si prefieres usar S3 o un servicio compatible:

Configura estas variables de entorno:

```
STORAGE_TYPE=s3
S3_BUCKET=tu-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=tu-access-key
S3_SECRET_ACCESS_KEY=tu-secret-key
```

**Nota**: Vercel Blob Storage es más simple y no requiere configuración adicional.

## Dominio Personalizado

1. En el dashboard de Vercel, ve a **Settings > Domains**
2. Agrega tu dominio
3. Sigue las instrucciones para configurar DNS
4. Actualiza `NEXTAUTH_URL` con tu dominio personalizado

## Variables de Entorno por Entorno

Puedes configurar variables diferentes para:
- **Production**: Producción
- **Preview**: Pull requests y branches
- **Development**: Desarrollo local

En **Settings > Environment Variables**, selecciona el entorno para cada variable.

## Monitoreo y Logs

### Ver Logs

```bash
vercel logs
```

O en el dashboard: **Deployments > [tu-deployment] > Logs**

### Analytics

Vercel Analytics está disponible en el dashboard para monitorear performance.

## Actualizaciones

Cada push a la rama principal desplegará automáticamente. Para otros branches, Vercel crea preview deployments.

## Rollback

Si necesitas revertir a una versión anterior:

1. Ve a **Deployments**
2. Encuentra el deployment anterior
3. Haz clic en los tres puntos y selecciona **Promote to Production**

## Límites de Vercel

- **Hobby Plan (Gratis)**:
  - 100GB bandwidth/mes
  - Serverless Functions: 10s timeout
  - Edge Functions: 50ms CPU time

- **Pro Plan**:
  - Bandwidth ilimitado
  - Serverless Functions: 60s timeout
  - Edge Functions: 50ms CPU time

Para más detalles, consulta [Vercel Pricing](https://vercel.com/pricing).

## Solución de Problemas

### Error: "Module not found"

Asegúrate de que todas las dependencias estén en `package.json` y no en `devDependencies` si se usan en runtime.

### Error: "Database connection failed"

Verifica que:
1. La `DATABASE_URL` esté correctamente configurada
2. La base de datos permita conexiones desde Vercel IPs
3. Las credenciales sean correctas

### Build falla

Revisa los logs de build en el dashboard. Problemas comunes:
- Variables de entorno faltantes
- Errores de TypeScript
- Dependencias faltantes

## Mejores Prácticas

1. **Nunca commitees `.env`** - Usa variables de entorno de Vercel
2. **Usa secrets para datos sensibles** - NEXTAUTH_SECRET, API keys, etc.
3. **Configura dominios personalizados** - Mejor para SEO y branding
4. **Monitorea los logs** - Detecta problemas temprano
5. **Usa preview deployments** - Prueba antes de producción

## Automatización de Variables de Entorno

Las variables de entorno configuradas en Vercel se propagan automáticamente a:
- **Production**: Todos los deployments de la rama principal
- **Preview**: Deployments de pull requests y branches
- **Development**: Desarrollo local (cuando usas `vercel env pull`)

**Ventaja**: Solo necesitas configurar las variables una vez en el dashboard, y estarán disponibles en todos los entornos.

## Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Drizzle ORM con Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon)

