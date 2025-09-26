import * as dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración centralizada de la aplicación
 * Todas las variables de entorno y configuraciones importantes se manejan aquí
 */
export const config = {
    // Configuración del servidor
    server: {
        port: parseInt(process.env.PORT || "3000", 10),
        nodeEnv: process.env.NODE_ENV || "development",
    },

    // Configuración de MongoDB
    database: {
        uri: process.env.MONGODB_URI || "mongodb://localhost:27017/chile-compra",
        name: process.env.MONGODB_DB_NAME || "chile-compra",
    },

    // Configuración de la API de Chile Compra
    chileCompraApi: {
        baseUrl: process.env.CHILE_COMPRA_API_URL || "https://api.buscador.mercadopublico.cl",
        apiKey: process.env.CHILE_COMPRA_API_KEY || "e93089e4-437c-4723-b343-4fa20045e3bc",
        delayBetweenRequests: parseInt(process.env.API_DELAY_MS || "2000", 10),
    },

    // Configuración de email
    email: {
        serviceUrl: process.env.EMAIL_SERVICE_URL || "https://noreply.neurox.cl/api/email/send",
        to: process.env.EMAIL_TO || "usuario@ejemplo.com",
    },

    // Configuración de scheduler
    scheduler: {
        cronSchedule: process.env.CRON_SCHEDULE || "0 20 * * *", // 20:00 todos los días
        timezone: "America/Santiago",
        cleanupDays: parseInt(process.env.CLEANUP_DAYS || "90", 10),
    },

    // URLs base para los enlaces
    urls: {
        fichaBase: "https://buscador.mercadopublico.cl/ficha?code=",
    },
};

/**
 * Valida que todas las configuraciones requeridas estén presentes
 * @throws Error si alguna configuración crítica está faltando
 */
export function validateConfig(): void {
    const requiredEnvVars = ["MONGODB_URI", "CHILE_COMPRA_API_KEY", "EMAIL_SERVICE_URL", "EMAIL_TO"];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(
            `Las siguientes variables de entorno son requeridas pero están faltando: ${missingVars.join(", ")}\n` +
                "Por favor, crea un archivo .env basado en .env.example y configura estas variables."
        );
    }

    // Validar formato de URI de MongoDB
    if (!config.database.uri.startsWith("mongodb://") && !config.database.uri.startsWith("mongodb+srv://")) {
        throw new Error("MONGODB_URI debe ser una URI válida de MongoDB");
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.email.to)) {
        throw new Error("EMAIL_TO debe ser una dirección de email válida");
    }

    console.log("✅ Configuración validada exitosamente");
}

/**
 * Muestra la configuración actual (sin datos sensibles)
 */
export function showConfig(): void {
    console.log("📋 Configuración actual:");
    console.log(`   🖥️  Servidor: puerto ${config.server.port}, entorno ${config.server.nodeEnv}`);
    console.log(`   🗄️  Base de datos: ${config.database.name}`);
    console.log(`   🌐 API Chile Compra: ${config.chileCompraApi.baseUrl}`);
    console.log(`   📧 Email service: ${config.email.serviceUrl}`);
    console.log(`   📅 Horario programado: ${config.scheduler.cronSchedule}`);
    console.log(`   ⏱️  Delay entre requests: ${config.chileCompraApi.delayBetweenRequests}ms`);
}
