# Guía de Self-Hosting

Esta guía te ayudará a instalar y configurar OpenShelter en tu propio servidor usando Docker.

## Requisitos

- Servidor con Docker y Docker Compose instalados
- Mínimo 2GB de RAM
- 10GB de espacio en disco (más para fotos de animales)
- Dominio opcional (recomendado para producción)

## Instalación Paso a Paso

### 1. Preparar el Servidor

Asegúrate de tener Docker y Docker Compose instalados:

```bash
# Verificar Docker
docker --version
docker-compose --version
```

Si no están instalados, consulta la [documentación oficial de Docker](https://docs.docker.com/get-docker/).

### 2. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/openshelter.git
cd openshelter
```

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
nano .env  # o usa tu editor preferido
```

Configura las siguientes variables:

```env
# Base de datos (usado por docker-compose)
POSTGRES_USER=openshelter
POSTGRES_PASSWORD=tu-password-segura-aqui
POSTGRES_DB=openshelter

# URL de conexión a la base de datos
DATABASE_URL=postgresql://openshelter:tu-password-segura-aqui@postgres:5432/openshelter

# NextAuth
NEXTAUTH_SECRET=genera-un-secret-con-openssl-rand-base64-32
NEXTAUTH_URL=https://tu-dominio.com  # o http://tu-ip:3000 para desarrollo

# Storage (opcional - para fotos)
STORAGE_TYPE=local  # o 's3' para usar S3-compatible storage
```

**Importante**: Genera un `NEXTAUTH_SECRET` seguro:

```bash
openssl rand -base64 32
```

### 4. Construir y Iniciar los Contenedores

```bash
docker-compose up -d
```

Esto construirá la imagen de la aplicación e iniciará los contenedores de PostgreSQL y la app.

### 5. Ejecutar Migraciones

Una vez que los contenedores estén corriendo, ejecuta las migraciones:

```bash
docker-compose exec app npm run db:generate
docker-compose exec app npm run db:push
```

### 6. Verificar la Instalación

Abre tu navegador y visita:
- `http://tu-servidor-ip:3000` (si no tienes dominio)
- `https://tu-dominio.com` (si configuraste un dominio)

## Configuración Avanzada

### Usar un Dominio Personalizado

1. Configura un registro DNS apuntando a la IP de tu servidor
2. Configura un reverse proxy (Nginx o Caddy) para manejar SSL
3. Actualiza `NEXTAUTH_URL` en `.env` con tu dominio

Ejemplo de configuración Nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Configurar SSL con Let's Encrypt

Usa Certbot con Nginx o Caddy para obtener certificados SSL gratuitos.

### Backup de la Base de Datos

Para hacer backup de PostgreSQL:

```bash
docker-compose exec postgres pg_dump -U openshelter openshelter > backup.sql
```

Para restaurar:

```bash
docker-compose exec -T postgres psql -U openshelter openshelter < backup.sql
```

### Actualizar la Aplicación

```bash
# Detener los contenedores
docker-compose down

# Actualizar el código
git pull

# Reconstruir y reiniciar
docker-compose up -d --build

# Ejecutar nuevas migraciones si las hay
docker-compose exec app npm run db:push
```

### Ver Logs

```bash
# Logs de la aplicación
docker-compose logs -f app

# Logs de PostgreSQL
docker-compose logs -f postgres

# Todos los logs
docker-compose logs -f
```

## Solución de Problemas

### El contenedor no inicia

Verifica los logs:

```bash
docker-compose logs app
```

### Error de conexión a la base de datos

Asegúrate de que:
1. PostgreSQL esté corriendo: `docker-compose ps`
2. La `DATABASE_URL` en `.env` sea correcta
3. Los volúmenes estén montados: `docker-compose ps`

### Puerto 3000 ya está en uso

Cambia el puerto en `docker-compose.yml`:

```yaml
ports:
  - '8080:3000'  # Usa el puerto 8080 en lugar de 3000
```

### Problemas de permisos

Si tienes problemas con permisos de archivos:

```bash
sudo chown -R $USER:$USER .
```

## Mantenimiento

### Limpiar Imágenes Antiguas

```bash
docker system prune -a
```

### Ver Uso de Recursos

```bash
docker stats
```

## Soporte

Para más ayuda, consulta:
- [Documentación de desarrollo](DEVELOPMENT.md)
- [Issues en GitHub](https://github.com/tu-usuario/openshelter/issues)



