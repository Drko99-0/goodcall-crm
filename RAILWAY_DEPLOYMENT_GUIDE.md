# Guía de Deploy en Railway - GoodCall CRM

## Preparativos Antes del Deploy

### 1. Instalar Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Autenticarse en Railway
```bash
railway login
```
Esto abrirá el navegador para que te autentiques en tu cuenta de Railway.

### 3. Inicializar el Proyecto Railway

Desde la raíz del proyecto (o desde backend/frontend):

```bash
# Para el backend
cd /media/drko/Drko99/projects/goodcall/crm/backend
railway init

# Para el frontend
cd /media/drko/Drko99/projects/goodcall/crm/frontend
railway init
```

## Configuración del Backend

### 1. Crear servicio de base de datos PostgreSQL
```bash
cd /media/drko/Drko99/projects/goodcall/crm/backend
railway add postgresql
```

### 2. Variables de Entorno Requeridas

En el dashboard de Railway o vía CLI, configura estas variables:

```bash
# Variables obligatorias
railway variables set JWT_SECRET=tu_secreto_jwt_aqui
railway variables set ENCRYPTION_KEY=tu_clave_encriptacion_64_chars_hex
railway variables set CORS_ORIGINS=https://tu-frontend-url.railway.app

# Variables opcionales
railway variables set BCRYPT_ROUNDS=12
railway variables set PORT=3001
```

**NOTA IMPORTANTE:** Para generar una `ENCRYPTION_KEY` válida de 64 caracteres hexadecimales:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Crear servicio de Redis (opcional, para caché mejorado)
```bash
railway add redis
railway variables set REDIS_URL=$REDIS_URL
```

## Configuración del Frontend

### 1. Variables de Entorno
```bash
cd /media/drko/Drko99/projects/goodcall/crm/frontend
railway variables set VITE_API_URL=https://tu-backend-url.railway.app/api
```

## Deploy

### Opción A: Deploy vía CLI

```bash
# Deploy del backend
cd /media/drko/Drko99/projects/goodcall/crm/backend
railway up

# Deploy del frontend
cd /media/drko/Drko99/projects/goodcall/crm/frontend
railway up
```

### Opción B: Deploy desde GitHub (Recomendado)

1. **Sube el código a GitHub** (si aún no lo has hecho):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - GoodCall CRM"
   git remote add origin https://github.com/tu-usuario/goodcall-crm.git
   git push -u origin main
   ```

2. **En Railway**:
   - Ve a railway.app y crea un nuevo proyecto
   - Selecciona "Deploy from GitHub repo"
   - Elige el repositorio
   - Railway detectará automáticamente que es un proyecto Node.js
   - Para el backend, selecciona la carpeta `/backend`
   - Para el frontend, crea otro servicio y selecciona `/frontend`

3. **Añade servicios**:
   - Añade una base de datos PostgreSQL al proyecto backend
   - (Opcional) Añade Redis para caché

## Ejecutar Migraciones

Una vez que el backend esté deployado:

```bash
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

## Verificar Deploy

### Obtener URLs del deploy
```bash
railway domain
```

### Ver logs
```bash
railway logs
```

### Abrir en navegador
```bash
railway open
```

## URLs Finales

Una vez completado el deploy, tendrás:

- **Backend**: `https://tu-backend.railway.app`
- **Frontend**: `https://tu-frontend.railway.app`
- **Database**: disponible como variable `DATABASE_URL`

## Troubleshooting

### Error: "ENCRYPTION_KEY debe tener exactamente 64 caracteres"
```bash
railway variables set ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Error de CORS
Asegúrate de que `CORS_ORIGINS` incluya la URL de tu frontend:
```bash
railway variables set CORS_ORIGINS=https://tu-frontend.railway.app,http://localhost:3000
```

### Error de conexión a base de datos
Verifica que la variable `DATABASE_URL` esté configurada (Railway la inyecta automáticamente cuando añades el servicio PostgreSQL).

## Variables de Entorno - Referencia Completa

### Backend
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL (Railway auto) | `postgresql://...` |
| `JWT_SECRET` | Secreto para JWT | `random-secret-string` |
| `ENCRYPTION_KEY` | 64 chars hex para 2FA | `0123456789abcdef...` |
| `CORS_ORIGINS` | Orígenes permitidos | `https://app.com` |
| `PORT` | Puerto del servidor | `3001` |
| `REDIS_URL` | URL de Redis (opcional) | `redis://...` |
| `BCRYPT_ROUNDS` | Rounds para bcrypt | `12` |
| `NODE_ENV` | Entorno | `production` |

### Frontend
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend | `https://api.railway.app/api` |
| `NODE_ENV` | Entorno | `production` |
