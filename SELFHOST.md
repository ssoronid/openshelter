# Self-Hosting OpenShelter

Guía rápida para instalar OpenShelter en tu propio servidor usando Docker.

## 🚀 Inicio Rápido

### Requisitos

- Docker y Docker Compose
- 2GB RAM mínimo
- 10GB espacio en disco

### Instalación en 5 Pasos

1. **Clona el repositorio:**
```bash
git clone https://github.com/ssoronid/openshelter.git
cd openshelter
```

2. **Configura las variables de entorno:**
```bash
cp .env.example .env
nano .env  # o tu editor preferido
```

Configura estas variables mínimas:
```env
POSTGRES_USER=openshelter
POSTGRES_PASSWORD=tu-password-segura
POSTGRES_DB=openshelter
DATABASE_URL=postgresql://openshelter:tu-password-segura@postgres:5432/openshelter
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://tu-servidor-ip:3000
```

3. **Inicia los servicios:**
```bash
docker-compose up -d
```

4. **Ejecuta las migraciones:**
```bash
docker-compose exec app npm run db:push
```

5. **¡Listo!** Accede a `http://tu-servidor-ip:3000`

## 📋 Comandos Útiles

### Ver logs
```bash
docker-compose logs -f app
```

### Detener servicios
```bash
docker-compose down
```

### Actualizar la aplicación
```bash
git pull
docker-compose up -d --build
docker-compose exec app npm run db:push
```

### Backup de base de datos
```bash
docker-compose exec postgres pg_dump -U openshelter openshelter > backup.sql
```

### Restaurar backup
```bash
docker-compose exec -T postgres psql -U openshelter openshelter < backup.sql
```

## 🌐 Configurar Dominio y SSL

### Con Nginx

1. Instala Nginx y Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

2. Crea configuración en `/etc/nginx/sites-available/openshelter`:
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

3. Habilita el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/openshelter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Obtén certificado SSL:
```bash
sudo certbot --nginx -d tu-dominio.com
```

5. Actualiza `NEXTAUTH_URL` en `.env`:
```env
NEXTAUTH_URL=https://tu-dominio.com
```

6. Reinicia los contenedores:
```bash
docker-compose restart
```

### Con Caddy (más simple)

1. Instala Caddy
2. Crea `Caddyfile`:
```
tu-dominio.com {
    reverse_proxy localhost:3000
}
```

3. Inicia Caddy: `caddy run`

## 🔧 Solución de Problemas

### El contenedor no inicia
```bash
docker-compose logs app
```

### Error de conexión a base de datos
- Verifica que PostgreSQL esté corriendo: `docker-compose ps`
- Revisa `DATABASE_URL` en `.env`

### Puerto 3000 ocupado
Edita `docker-compose.yml`:
```yaml
ports:
  - '8080:3000'  # Usa puerto 8080
```

## 📚 Documentación Completa

Para más detalles, configuración avanzada y troubleshooting, consulta:
- [Guía completa de Self-Hosting](docs/SELF_HOSTING.md)
- [Guía de Desarrollo](docs/DEVELOPMENT.md)
- [Guía de Deployment](docs/DEPLOYMENT.md)

## 🆘 Soporte

- [Issues en GitHub](https://github.com/ssoronid/openshelter/issues)
- [Documentación completa](docs/)

