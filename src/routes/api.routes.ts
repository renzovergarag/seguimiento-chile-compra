import { Router, Request, Response } from "express";
import { TaskScheduler } from "../schedulers/task-scheduler";
import { ExtractionService } from "../services/extraction.service";

/**
 * Rutas para operaciones de extracción manual y programada
 */
export function createExtractionRoutes(extractionService: ExtractionService, taskScheduler: TaskScheduler): Router {
    const router = Router();

    /**
     * GET /extraction/status
     * Obtiene el estado actual del sistema
     */
    router.get("/status", async (req: Request, res: Response) => {
        try {
            const schedulerStatus = taskScheduler.getStatus();
            const systemStats = await extractionService.getSystemStats();

            res.json({
                success: true,
                data: {
                    scheduler: schedulerStatus,
                    stats: systemStats,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    /**
     * POST /extraction/run-daily
     * Ejecuta manualmente la extracción diaria
     */
    router.post("/run-daily", async (req: Request, res: Response) => {
        try {
            console.log("🔧 Iniciando extracción diaria manual desde API...");
            const summaries = await extractionService.runDailyExtraction();

            res.json({
                success: true,
                message: "Extracción diaria completada exitosamente",
                data: summaries,
            });
        } catch (error: any) {
            console.error("❌ Error en extracción diaria manual:", error.message);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    /**
     * POST /extraction/run-initial
     * Ejecuta manualmente la extracción inicial (rango amplio)
     */
    router.post("/run-initial", async (req: Request, res: Response) => {
        try {
            console.log("🔧 Iniciando extracción inicial manual desde API...");
            const summaries = await extractionService.runInitialExtraction();

            res.json({
                success: true,
                message: "Extracción inicial completada exitosamente",
                data: summaries,
            });
        } catch (error: any) {
            console.error("❌ Error en extracción inicial manual:", error.message);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    /**
     * POST /extraction/cleanup
     * Ejecuta manualmente la limpieza de ofertas antiguas
     */
    router.post("/cleanup", async (req: Request, res: Response) => {
        try {
            const { days = 90 } = req.body;
            console.log(`🔧 Iniciando limpieza manual desde API (>${days} días)...`);

            const deletedCount = await extractionService.cleanupOldOffers(days);

            res.json({
                success: true,
                message: `Limpieza completada: ${deletedCount} ofertas eliminadas`,
                data: {
                    deletedCount,
                    days,
                },
            });
        } catch (error: any) {
            console.error("❌ Error en limpieza manual:", error.message);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    /**
     * POST /extraction/schedule-start
     * Inicia las tareas programadas
     */
    router.post("/schedule-start", (req: Request, res: Response) => {
        try {
            taskScheduler.start();

            res.json({
                success: true,
                message: "Tareas programadas iniciadas",
                data: taskScheduler.getStatus(),
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    /**
     * POST /extraction/schedule-stop
     * Detiene las tareas programadas
     */
    router.post("/schedule-stop", (req: Request, res: Response) => {
        try {
            taskScheduler.stopAllTasks();

            res.json({
                success: true,
                message: "Tareas programadas detenidas",
                data: taskScheduler.getStatus(),
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    /**
     * GET /extraction/emprendimientos
     * Lista todos los emprendimientos configurados
     */
    router.get("/emprendimientos", (req: Request, res: Response) => {
        try {
            const { emprendimientos } = require("../config/emprendimientos");

            const emprendimientosInfo = emprendimientos.map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                description: emp.description,
                endpoints_count: emp.endpoints.length,
                email_recipients: emp.emailRecipients,
            }));

            res.json({
                success: true,
                data: emprendimientosInfo,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    return router;
}

/**
 * Rutas para obtener estadísticas y datos
 */
export function createStatsRoutes(extractionService: ExtractionService): Router {
    const router = Router();

    /**
     * GET /stats/general
     * Obtiene estadísticas generales del sistema
     */
    router.get("/general", async (req: Request, res: Response) => {
        try {
            const stats = await extractionService.getSystemStats();

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    return router;
}

/**
 * Rutas de salud y diagnóstico
 */
export function createHealthRoutes(): Router {
    const router = Router();

    /**
     * GET /health
     * Endpoint de salud básico
     */
    router.get("/", (req: Request, res: Response) => {
        res.json({
            success: true,
            message: "Sistema de Monitoreo Chile Compra funcionando correctamente",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });

    /**
     * GET /health/detailed
     * Endpoint de salud detallado
     */
    router.get("/detailed", async (req: Request, res: Response) => {
        try {
            const healthData = {
                service: "Chile Compra Monitor",
                status: "healthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                node_version: process.version,
                environment: process.env.NODE_ENV || "development",
            };

            res.json({
                success: true,
                data: healthData,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    return router;
}
