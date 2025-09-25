import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config, validateConfig, showConfig } from "./config/config";
import { DatabaseService } from "./services/database.service";
import { ChileCompraApiService } from "./services/chile-compra-api.service";
import { EmailService } from "./services/email.service";
import { ExtractionService } from "./services/extraction.service";
import { TaskScheduler } from "./schedulers/task-scheduler";
import { createExtractionRoutes, createStatsRoutes, createHealthRoutes } from "./routes/api.routes";

/**
 * Clase principal de la aplicación
 * Configura y coordina todos los servicios
 */
class ChileCompraMonitorApp {
    private app: express.Application;
    private databaseService: DatabaseService;
    private apiService: ChileCompraApiService;
    private emailService: EmailService;
    private extractionService: ExtractionService;
    private taskScheduler: TaskScheduler;

    constructor() {
        this.app = express();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Inicializa todos los servicios de la aplicación
     */
    private initializeServices(): void {
        console.log("🔧 Inicializando servicios...");

        // Servicio de base de datos
        this.databaseService = new DatabaseService(config.database.uri, config.database.name);

        // Servicio de API de Chile Compra
        this.apiService = new ChileCompraApiService(config.chileCompraApi.baseUrl, config.chileCompraApi.apiKey, config.chileCompraApi.delayBetweenRequests);

        // Servicio de email
        this.emailService = new EmailService(config.email.serviceUrl);

        // Servicio de extracción principal
        this.extractionService = new ExtractionService(this.apiService, this.databaseService, this.emailService);

        // Programador de tareas
        this.taskScheduler = new TaskScheduler(this.extractionService);

        console.log("✅ Servicios inicializados");
    }

    /**
     * Configura el middleware de Express
     */
    private setupMiddleware(): void {
        console.log("🔧 Configurando middleware...");

        // Seguridad básica
        this.app.use(helmet());

        // CORS
        this.app.use(
            cors({
                origin:
                    config.server.nodeEnv === "production"
                        ? false // En producción, especificar dominios permitidos
                        : true, // En desarrollo, permitir todos
                credentials: true,
            })
        );

        // Parsing de JSON
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

        // Logging middleware
        if (config.server.nodeEnv === "development") {
            this.app.use((req, res, next) => {
                console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
                next();
            });
        }

        console.log("✅ Middleware configurado");
    }

    /**
     * Configura las rutas de la API
     */
    private setupRoutes(): void {
        console.log("🔧 Configurando rutas...");

        // Ruta raíz
        this.app.get("/", (req, res) => {
            res.json({
                message: "Sistema de Monitoreo de Ofertas Chile Compra",
                version: "1.0.0",
                status: "running",
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: "/health",
                    extraction: "/api/extraction",
                    stats: "/api/stats",
                },
            });
        });

        // Rutas de salud
        this.app.use("/health", createHealthRoutes());

        // Rutas de extracción
        this.app.use("/api/extraction", createExtractionRoutes(this.extractionService, this.taskScheduler));

        // Rutas de estadísticas
        this.app.use("/api/stats", createStatsRoutes(this.extractionService));

        console.log("✅ Rutas configuradas");
    }

    /**
     * Configura el manejo de errores
     */
    private setupErrorHandling(): void {
        // Manejo de rutas no encontradas
        this.app.use("*", (req, res) => {
            res.status(404).json({
                success: false,
                message: "Endpoint no encontrado",
                path: req.originalUrl,
            });
        });

        // Manejo global de errores
        this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error("❌ Error no manejado:", error);

            res.status(error.status || 500).json({
                success: false,
                message: config.server.nodeEnv === "production" ? "Error interno del servidor" : error.message,
                ...(config.server.nodeEnv === "development" && { stack: error.stack }),
            });
        });
    }

    /**
     * Inicializa la conexión a la base de datos
     */
    private async initializeDatabase(): Promise<void> {
        try {
            console.log("🔌 Conectando a la base de datos...");
            await this.databaseService.connect();
            console.log("✅ Base de datos conectada");
        } catch (error: any) {
            console.error("❌ Error conectando a la base de datos:", error.message);
            throw error;
        }
    }

    /**
     * Prueba la conectividad con servicios externos
     */
    private async testExternalServices(): Promise<void> {
        console.log("🧪 Probando servicios externos...");

        try {
            // Probar API de Chile Compra
            const apiConnected = await this.apiService.testConnection();
            if (apiConnected) {
                console.log("✅ API de Chile Compra: Conectada");
            } else {
                console.warn("⚠️ API de Chile Compra: No disponible");
            }

            // Probar servicio de email (opcional)
            // const emailWorking = await this.emailService.testEmailService(config.email.to);
            // if (emailWorking) {
            //   console.log('✅ Servicio de email: Funcionando');
            // } else {
            //   console.warn('⚠️ Servicio de email: No disponible');
            // }
        } catch (error: any) {
            console.warn("⚠️ Algunos servicios externos no están disponibles:", error.message);
        }
    }

    /**
     * Inicia el servidor y todos los servicios
     */
    async start(): Promise<void> {
        try {
            console.log("\n🚀 Iniciando Sistema de Monitoreo Chile Compra...\n");

            // Validar configuración
            validateConfig();
            showConfig();

            // Inicializar base de datos
            await this.initializeDatabase();

            // Probar servicios externos
            await this.testExternalServices();

            // Inicializar programador de tareas
            console.log("📅 Inicializando programador de tareas...");
            this.taskScheduler.startAllTasks();
            this.taskScheduler.start();
            console.log("✅ Programador de tareas iniciado");

            // Iniciar servidor HTTP
            const server = this.app.listen(config.server.port, () => {
                console.log(`\n🌐 Servidor iniciado en puerto ${config.server.port}`);
                console.log(`📍 URL base: http://localhost:${config.server.port}`);
                console.log(`🏥 Health check: http://localhost:${config.server.port}/health`);
                console.log(`📊 API: http://localhost:${config.server.port}/api`);
                console.log("\n✅ Sistema completamente inicializado y listo para usar\n");
            });

            // Manejo de cierre graceful
            this.setupGracefulShutdown(server);
        } catch (error: any) {
            console.error("❌ Error iniciando la aplicación:", error.message);
            process.exit(1);
        }
    }

    /**
     * Configura el cierre graceful de la aplicación
     */
    private setupGracefulShutdown(server: any): void {
        const shutdown = async (signal: string) => {
            console.log(`\n📡 Recibida señal ${signal}, iniciando cierre graceful...`);

            try {
                // Detener tareas programadas
                console.log("⏹️ Deteniendo tareas programadas...");
                this.taskScheduler.stopAllTasks();

                // Cerrar servidor HTTP
                console.log("🌐 Cerrando servidor HTTP...");
                server.close(() => {
                    console.log("✅ Servidor HTTP cerrado");
                });

                // Cerrar conexión a base de datos
                console.log("🔌 Cerrando conexión a base de datos...");
                await this.databaseService.disconnect();

                console.log("✅ Aplicación cerrada exitosamente");
                process.exit(0);
            } catch (error: any) {
                console.error("❌ Error durante el cierre:", error.message);
                process.exit(1);
            }
        };

        // Manejar señales de cierre
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        // Manejar errores no capturados
        process.on("uncaughtException", (error) => {
            console.error("❌ Error no capturado:", error);
            shutdown("UNCAUGHT_EXCEPTION");
        });

        process.on("unhandledRejection", (reason, promise) => {
            console.error("❌ Promesa rechazada no manejada:", reason);
            shutdown("UNHANDLED_REJECTION");
        });
    }
}

// Ejecutar la aplicación si este archivo se ejecuta directamente
if (require.main === module) {
    const app = new ChileCompraMonitorApp();
    app.start().catch((error) => {
        console.error("❌ Error fatal iniciando la aplicación:", error);
        process.exit(1);
    });
}

export default ChileCompraMonitorApp;
