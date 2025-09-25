# Sistema de Monitoreo Chile Compra

Sistema automatizado para el monitoreo diario de solicitudes de cotización de Chile Compra, diseñado para emprendimientos de transporte y software.

## 🚀 Características

- **Extracción Automática**: Monitoreo diario de ofertas desde la API de Chile Compra
- **Múltiples Emprendimientos**: Soporte configurable para diferentes tipos de negocio
- **Base de Datos MongoDB**: Almacenamiento persistente con prevención de duplicados
- **Notificaciones por Email**: Reportes HTML automáticos con enlaces directos
- **API REST**: Endpoints para control manual y monitoreo del sistema
- **Programación Flexible**: Ejecución automática con node-cron
- **Comportamiento Humano**: Control de concurrencia para evitar sobrecarga de la API

## 📋 Emprendimientos Configurados

### 🚌 Transporte

- Servicios de transporte general
- Turismo y viajes
- Transporte de pasajeros
- Servicios específicos de la Región V

### 💻 Software y Tecnología

- Desarrollo de software
- Servicios de informática
- Inteligencia artificial
- Consultoría TI
- Bases de datos
- Software de aplicación y sistema

## 🛠️ Instalación

### Requisitos Previos

- Node.js 18+
- MongoDB 4.4+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd seguimiento-chile-compra
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/chile-compra
MONGODB_DB_NAME=chile-compra

# Servidor
PORT=3000
NODE_ENV=development

# API de Chile Compra
CHILE_COMPRA_API_URL=https://api.buscador.mercadopublico.cl
CHILE_COMPRA_API_KEY=e93089e4-437c-4723-b343-4fa20045e3bc

# Email
EMAIL_SERVICE_URL=http://noreply.neurox.cl/api/email/send
EMAIL_FROM=ofertas@chilecompra.local
EMAIL_TO=tu-email@ejemplo.com

# Programación
CRON_SCHEDULE=0 20 * * *
```

4. **Compilar TypeScript**

```bash
npm run build
```

5. **Iniciar la aplicación**

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🔧 Configuración

### Variables de Entorno

| Variable               | Descripción                 | Requerida | Default       |
| ---------------------- | --------------------------- | --------- | ------------- |
| `MONGODB_URI`          | URI de conexión a MongoDB   | ✅        | -             |
| `MONGODB_DB_NAME`      | Nombre de la base de datos  | ✅        | chile-compra  |
| `PORT`                 | Puerto del servidor         | ❌        | 3000          |
| `CHILE_COMPRA_API_KEY` | API Key de Chile Compra     | ✅        | -             |
| `EMAIL_SERVICE_URL`    | URL del servicio de email   | ✅        | -             |
| `EMAIL_TO`             | Email de destino            | ✅        | -             |
| `CRON_SCHEDULE`        | Horario de ejecución (cron) | ❌        | 0 20 \* \* \* |

### Horarios de Ejecución

- **Extracción diaria**: 20:00 hrs (configurable)
- **Limpieza semanal**: Domingos a las 02:00 hrs
- **Zona horaria**: America/Santiago

## 📡 API REST

### Endpoints Principales

#### Salud del Sistema

```bash
GET /health              # Estado básico
GET /health/detailed     # Estado detallado
```

#### Control de Extracción

```bash
POST /api/extraction/run-daily     # Ejecutar extracción diaria
POST /api/extraction/run-initial   # Ejecutar extracción inicial
POST /api/extraction/cleanup       # Limpiar ofertas antiguas
POST /api/extraction/schedule-start # Iniciar tareas programadas
POST /api/extraction/schedule-stop  # Detener tareas programadas
GET  /api/extraction/status        # Estado del sistema
GET  /api/extraction/emprendimientos # Listar emprendimientos
```

#### Estadísticas

```bash
GET /api/stats/general   # Estadísticas generales
```

### Ejemplos de Uso

**Ejecutar extracción manual:**

```bash
curl -X POST http://localhost:3000/api/extraction/run-daily
```

**Obtener estado del sistema:**

```bash
curl http://localhost:3000/api/extraction/status
```

**Limpiar ofertas antiguas (60 días):**

```bash
curl -X POST http://localhost:3000/api/extraction/cleanup \
  -H "Content-Type: application/json" \
  -d '{"days": 60}'
```

## 🗂️ Estructura del Proyecto

```
src/
├── config/
│   ├── config.ts              # Configuración centralizada
│   └── emprendimientos.ts     # Configuración de emprendimientos
├── models/
│   └── types.ts              # Interfaces y tipos TypeScript
├── services/
│   ├── chile-compra-api.service.ts  # Cliente API Chile Compra
│   ├── database.service.ts          # Servicio de MongoDB
│   ├── email.service.ts             # Servicio de email
│   └── extraction.service.ts        # Lógica principal
├── schedulers/
│   └── task-scheduler.ts      # Programación de tareas
├── routes/
│   └── api.routes.ts         # Rutas de la API REST
└── index.ts                  # Servidor principal
```

## ➕ Agregar Nuevo Emprendimiento

1. **Editar `src/config/emprendimientos.ts`**:

```typescript
const nuevoEmprendimiento: EmprendimientoConfig = {
    id: "nuevo-emprendimiento",
    name: "Nombre del Emprendimiento",
    description: "Descripción del emprendimiento",
    emailRecipients: ["email@ejemplo.com"],
    endpoints: [
        {
            name: "Endpoint Descriptivo",
            description: "Descripción del endpoint",
            params: {
                category: "12345678",
                status: 2,
                order_by: "recent",
            },
        },
    ],
};

// Agregar al array de emprendimientos
export const emprendimientos: EmprendimientoConfig[] = [
    transporteConfig,
    softwareConfig,
    nuevoEmprendimiento, // ← Agregar aquí
];
```

2. **Reiniciar la aplicación** para aplicar los cambios.

## 📊 Base de Datos

### Colección: `ofertas`

Estructura del documento:

```javascript
{
  _id: ObjectId,
  id: Number,                    // ID único de la oferta
  codigo: String,               // Código de la licitación
  nombre: String,               // Nombre de la oferta
  fecha_publicacion: String,    // Fecha de publicación
  fecha_cierre: String,         // Fecha de cierre
  organismo: String,            // Organismo público
  unidad: String,               // Unidad responsable
  estado: String,               // Estado actual
  monto_disponible_CLP: Number, // Monto en pesos chilenos
  emprendimiento: String,       // ID del emprendimiento
  endpoint_name: String,        // Nombre del endpoint
  fecha_extraccion: Date,       // Fecha de extracción
  enlace_ficha: String         // URL a la ficha completa
}
```

### Índices Automáticos

- `id` (único) - Prevención de duplicados
- `emprendimiento` - Consultas por emprendimiento
- `fecha_extraccion` - Ordenación temporal
- `{emprendimiento, fecha_extraccion}` - Consultas compuestas

## 📧 Sistema de Email

### Formato de Reporte

Los emails incluyen:

- **Resumen estadístico** (cantidad de ofertas, monto total)
- **Lista detallada** de ofertas con:
    - Nombre con enlace directo a la ficha
    - Código de licitación
    - Organismo y unidad
    - Monto disponible
    - Fechas de publicación y cierre
    - Cantidad de proveedores cotizando

### Enlaces Directos

Cada oferta incluye un enlace directo:

```
https://buscador.mercadopublico.cl/ficha?code=[CODIGO_OFERTA]
```

## 🔄 Mantenimiento

### Limpieza Automática

- **Frecuencia**: Semanal (domingos 02:00)
- **Criterio**: Ofertas > 90 días
- **Manual**: `POST /api/extraction/cleanup`

### Monitoreo de Logs

La aplicación proporciona logs detallados:

- ✅ Operaciones exitosas
- ⚠️ Advertencias
- ❌ Errores
- 📊 Estadísticas de extracción

### Verificación de Salud

```bash
# Estado básico
curl http://localhost:3000/health

# Estado detallado con métricas
curl http://localhost:3000/health/detailed
```

## 🚨 Solución de Problemas

### Problemas Comunes

**Error de conexión a MongoDB:**

```bash
# Verificar que MongoDB esté ejecutándose
sudo systemctl status mongod

# Verificar URI en .env
echo $MONGODB_URI
```

**API de Chile Compra no responde:**

- Verificar conectividad a internet
- Confirmar que la API key sea válida
- Revisar límites de la API

**Emails no se envían:**

- Verificar URL del servicio de email
- Confirmar que EMAIL_TO sea válido
- Revisar logs del servicio

### Logs de Depuración

```bash
# Ver logs en tiempo real (desarrollo)
npm run dev

# Ver logs de base de datos
tail -f /var/log/mongodb/mongod.log
```

## 📈 Escalabilidad

### Agregar Más Endpoints

Editar la configuración del emprendimiento:

```typescript
endpoints: [
    // ... endpoints existentes
    {
        name: "Nuevo Endpoint",
        description: "Descripción",
        params: {
            keywords: "nueva-busqueda",
            region: "13",
            status: 2,
        },
    },
];
```

### Optimización de Performance

- **Control de concurrencia**: 2 segundos entre requests
- **Índices de BD**: Optimización automática de consultas
- **Paginación**: Manejo automático de múltiples páginas
- **Deduplicación**: Prevención automática de duplicados

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Scripts Disponibles

```bash
npm run build    # Compilar TypeScript
npm run start    # Ejecutar en producción
npm run dev      # Ejecutar en desarrollo con auto-reload
```

## 🔒 Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de origen cruzado
- **Variables de entorno**: Datos sensibles protegidos
- **Validación de entrada**: Sanitización de parámetros

## 📞 Soporte

Para soporte técnico o preguntas:

1. Revisar la documentación
2. Verificar logs de la aplicación
3. Consultar endpoints de salud
4. Revisar configuración de variables de entorno

---

**Versión**: 1.0.0  
**Última actualización**: Septiembre 2025  
**Compatibilidad**: Node.js 18+, MongoDB 4.4+
