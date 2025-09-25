import * as cron from "node-cron";
import { ExtractionService } from "../services/extraction.service";

/**
 * Scheduler para la ejecución automática de tareas
 * Programa la extracción diaria de ofertas y tareas de mantenimiento
 */
export class TaskScheduler {
    private extractionService: ExtractionService;
    private dailyExtractionTask: cron.ScheduledTask | null = null;
    private cleanupTask: cron.ScheduledTask | null = null;
    private isRunning: boolean = false;

    constructor(extractionService: ExtractionService) {
        this.extractionService = extractionService;
    }

    /**
     * Inicia todas las tareas programadas
     */
    startAllTasks(): void {
        this.startDailyExtraction();
        this.startWeeklyCleanup();
        this.isRunning = true;
        console.log("✅ Todas las tareas programadas han sido iniciadas");
    }

    /**
     * Detiene todas las tareas programadas
     */
    stopAllTasks(): void {
        if (this.dailyExtractionTask) {
            this.dailyExtractionTask.stop();
            this.dailyExtractionTask = null;
        }

        if (this.cleanupTask) {
            this.cleanupTask.stop();
            this.cleanupTask = null;
        }

        this.isRunning = false;
        console.log("⏹️ Todas las tareas programadas han sido detenidas");
    }

    /**
     * Programa la extracción diaria de ofertas
     * Por defecto se ejecuta todos los días a las 20:00 hrs
     */
    startDailyExtraction(): void {
        // Obtener horario desde variables de entorno o usar default
        const cronSchedule = process.env.CRON_SCHEDULE || "0 20 * * *"; // 20:00 todos los días

        console.log(`📅 Programando extracción diaria con horario: ${cronSchedule}`);

        this.dailyExtractionTask = cron.schedule(
            cronSchedule,
            async () => {
                console.log("\n🕐 Iniciando extracción diaria programada...");
                console.log(`⏰ Hora de ejecución: ${new Date().toLocaleString("es-CL")}`);

                try {
                    const summaries = await this.extractionService.runDailyExtraction();

                    console.log("✅ Extracción diaria completada exitosamente");
                    this.logExtractionSummary(summaries);
                } catch (error: any) {
                    console.error("❌ Error en extracción diaria programada:", error.message);
                }
            },
            {
                scheduled: false, // No iniciar automáticamente
                timezone: "America/Santiago", // Zona horaria de Chile
            }
        );

        // Mostrar información sobre la próxima ejecución
        const nextExecution = this.getNextExecutionTime(cronSchedule);
        console.log(`⏰ Próxima extracción programada: ${nextExecution}`);
    }

    /**
     * Programa la limpieza semanal de ofertas antiguas
     * Se ejecuta todos los domingos a las 02:00 hrs
     */
    startWeeklyCleanup(): void {
        const cleanupSchedule = "0 2 * * 0"; // Domingos a las 02:00

        console.log(`🧹 Programando limpieza semanal: ${cleanupSchedule}`);

        this.cleanupTask = cron.schedule(
            cleanupSchedule,
            async () => {
                console.log("\n🧹 Iniciando limpieza semanal de ofertas antiguas...");
                console.log(`⏰ Hora de ejecución: ${new Date().toLocaleString("es-CL")}`);

                try {
                    // Limpiar ofertas más antiguas de 90 días
                    const deletedCount = await this.extractionService.cleanupOldOffers(90);
                    console.log(`✅ Limpieza completada: ${deletedCount} ofertas antiguas eliminadas`);
                } catch (error: any) {
                    console.error("❌ Error en limpieza semanal:", error.message);
                }
            },
            {
                scheduled: false,
                timezone: "America/Santiago",
            }
        );
    }

    /**
     * Inicia las tareas programadas
     */
    start(): void {
        if (this.dailyExtractionTask && !this.dailyExtractionTask.getStatus()) {
            this.dailyExtractionTask.start();
            console.log("▶️ Extracción diaria iniciada");
        }

        if (this.cleanupTask && !this.cleanupTask.getStatus()) {
            this.cleanupTask.start();
            console.log("▶️ Limpieza semanal iniciada");
        }
    }

    /**
     * Ejecuta manualmente la extracción diaria
     * Útil para pruebas o ejecuciones ad-hoc
     */
    async runManualExtraction(): Promise<void> {
        console.log("\n🔧 Ejecutando extracción manual...");

        try {
            const summaries = await this.extractionService.runDailyExtraction();
            console.log("✅ Extracción manual completada exitosamente");
            this.logExtractionSummary(summaries);
        } catch (error: any) {
            console.error("❌ Error en extracción manual:", error.message);
            throw error;
        }
    }

    /**
     * Ejecuta manualmente la extracción inicial (rango amplio)
     */
    async runManualInitialExtraction(): Promise<void> {
        console.log("\n🔧 Ejecutando extracción inicial manual...");

        try {
            const summaries = await this.extractionService.runInitialExtraction();
            console.log("✅ Extracción inicial manual completada exitosamente");
            this.logExtractionSummary(summaries);
        } catch (error: any) {
            console.error("❌ Error en extracción inicial manual:", error.message);
            throw error;
        }
    }

    /**
     * Ejecuta manualmente la limpieza de ofertas antiguas
     * @param days - Días de antigüedad (default: 90)
     */
    async runManualCleanup(days: number = 90): Promise<void> {
        console.log(`\n🔧 Ejecutando limpieza manual (ofertas > ${days} días)...`);

        try {
            const deletedCount = await this.extractionService.cleanupOldOffers(days);
            console.log(`✅ Limpieza manual completada: ${deletedCount} ofertas eliminadas`);
        } catch (error: any) {
            console.error("❌ Error en limpieza manual:", error.message);
            throw error;
        }
    }

    /**
     * Obtiene el estado actual del scheduler
     */
    getStatus(): {
        isRunning: boolean;
        dailyTaskActive: boolean;
        cleanupTaskActive: boolean;
        nextDailyExecution: string | null;
    } {
        return {
            isRunning: this.isRunning,
            dailyTaskActive: this.dailyExtractionTask?.getStatus() || false,
            cleanupTaskActive: this.cleanupTask?.getStatus() || false,
            nextDailyExecution: this.getNextExecutionTime(process.env.CRON_SCHEDULE || "0 20 * * *"),
        };
    }

    /**
     * Calcula la próxima hora de ejecución basada en el cron schedule
     * @param cronExpression - Expresión cron
     * @returns string - Fecha y hora de la próxima ejecución
     */
    private getNextExecutionTime(cronExpression: string): string {
        try {
            // Esta es una implementación simple, node-cron no expone directamente la próxima ejecución
            // En un entorno de producción, podrías usar librerías como 'cron-parser' para esto
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Para el horario default (20:00), calcular la próxima ejecución
            if (cronExpression === "0 20 * * *") {
                const nextExecution = new Date(now);
                nextExecution.setHours(20, 0, 0, 0);

                // Si ya pasó la hora de hoy, programar para mañana
                if (nextExecution <= now) {
                    nextExecution.setDate(nextExecution.getDate() + 1);
                }

                return nextExecution.toLocaleString("es-CL");
            }

            return "Calculando...";
        } catch (error: any) {
            return "Error calculando próxima ejecución";
        }
    }

    /**
     * Registra un resumen de la extracción en los logs
     * @param summaries - Array de resúmenes de extracción
     */
    private logExtractionSummary(summaries: any[]): void {
        console.log("\n📊 Resumen de extracción:");
        summaries.forEach((summary) => {
            console.log(`   • ${summary.emprendimiento}: ${summary.nuevas_ofertas} nuevas ofertas`);
        });

        const totalNuevas = summaries.reduce((sum, s) => sum + s.nuevas_ofertas, 0);
        console.log(`📈 Total de ofertas nuevas: ${totalNuevas}`);
    }

    /**
     * Programa una ejecución única en una fecha/hora específica
     * @param dateTime - Fecha y hora de ejecución
     * @param isInitial - Si es extracción inicial o diaria
     */
    scheduleOneTimeExecution(dateTime: Date, isInitial: boolean = false): void {
        const now = new Date();
        if (dateTime <= now) {
            throw new Error("La fecha/hora debe ser futura");
        }

        const delay = dateTime.getTime() - now.getTime();

        console.log(`⏰ Programando ejecución única para: ${dateTime.toLocaleString("es-CL")}`);

        setTimeout(async () => {
            console.log("\n⚡ Ejecutando tarea programada única...");

            try {
                if (isInitial) {
                    await this.runManualInitialExtraction();
                } else {
                    await this.runManualExtraction();
                }
            } catch (error: any) {
                console.error("❌ Error en ejecución programada única:", error.message);
            }
        }, delay);
    }
}
