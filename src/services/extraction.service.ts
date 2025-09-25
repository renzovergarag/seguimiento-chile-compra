import { ChileCompraApiService } from "./chile-compra-api.service";
import { DatabaseService } from "./database.service";
import { EmailService } from "./email.service";
import { emprendimientos } from "../config/emprendimientos";
import { OfertaDocument, DateRange, ExtraccionSummary, EmprendimientoConfig, EndpointConfig } from "../models/types";

/**
 * Servicio principal de extracción de ofertas
 * Coordina la extracción, almacenamiento y notificación de ofertas
 */
export class ExtractionService {
    private apiService: ChileCompraApiService;
    private databaseService: DatabaseService;
    private emailService: EmailService;

    constructor(apiService: ChileCompraApiService, databaseService: DatabaseService, emailService: EmailService) {
        this.apiService = apiService;
        this.databaseService = databaseService;
        this.emailService = emailService;
    }

    /**
     * Genera el rango de fechas para la extracción
     * @param isInitialRun - Si es la primera ejecución (rango amplio) o diaria (solo hoy)
     * @returns DateRange
     */
    private generateDateRange(isInitialRun: boolean = false): DateRange {
        const today = new Date();
        const formatDate = (date: Date): string => {
            return date.toISOString().split("T")[0] || ""; // YYYY-MM-DD
        };

        if (isInitialRun) {
            // Primera extracción: desde 01-08-2025 hasta hoy
            const startDate = new Date("2025-08-01");
            return {
                from: formatDate(startDate),
                to: formatDate(today),
            };
        } else {
            // Extracción diaria: solo el día actual
            return {
                from: formatDate(today),
                to: formatDate(today),
            };
        }
    }

    /**
     * Extrae ofertas para un endpoint específico de un emprendimiento
     * @param emprendimiento - Configuración del emprendimiento
     * @param endpoint - Configuración del endpoint
     * @param dateRange - Rango de fechas
     * @returns Promise<OfertaDocument[]>
     */
    private async extractOffersForEndpoint(emprendimiento: EmprendimientoConfig, endpoint: EndpointConfig, dateRange: DateRange): Promise<OfertaDocument[]> {
        console.log(`🔍 Extrayendo ofertas para ${emprendimiento.name} - ${endpoint.name}`);

        try {
            // Construir parámetros de consulta
            const queryParams = {
                ...endpoint.params,
                date_from: dateRange.from,
                date_to: dateRange.to,
            };

            // Obtener ofertas de la API
            const ofertas = await this.apiService.getOfertasWithParams(queryParams);

            // Convertir a documentos para almacenar en BD
            const ofertasDocuments: OfertaDocument[] = ofertas.map((oferta) => ({
                ...oferta,
                emprendimiento: emprendimiento.id,
                endpoint_name: endpoint.name,
                fecha_extraccion: new Date(),
                enlace_ficha: `https://buscador.mercadopublico.cl/ficha?code=${oferta.codigo}`,
            }));

            console.log(`✅ ${ofertasDocuments.length} ofertas extraídas para ${endpoint.name}`);
            return ofertasDocuments;
        } catch (error: any) {
            console.error(`❌ Error extrayendo ofertas para ${endpoint.name}:`, error.message);
            throw error;
        }
    }

    /**
     * Extrae todas las ofertas para un emprendimiento específico
     * @param emprendimiento - Configuración del emprendimiento
     * @param dateRange - Rango de fechas
     * @returns Promise<OfertaDocument[]>
     */
    private async extractOffersForEmprendimiento(emprendimiento: EmprendimientoConfig, dateRange: DateRange): Promise<OfertaDocument[]> {
        console.log(`🚀 Iniciando extracción para emprendimiento: ${emprendimiento.name}`);

        const allOfertas: OfertaDocument[] = [];

        for (const endpoint of emprendimiento.endpoints) {
            try {
                const ofertas = await this.extractOffersForEndpoint(emprendimiento, endpoint, dateRange);
                allOfertas.push(...ofertas);

                // Pequeña pausa entre endpoints para ser menos agresivo con la API
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error: any) {
                console.error(`⚠️ Error en endpoint ${endpoint.name}, continuando con el siguiente...`);
                // Continuar con el siguiente endpoint en caso de error
            }
        }

        console.log(`📊 Total de ofertas para ${emprendimiento.name}: ${allOfertas.length}`);
        return allOfertas;
    }

    /**
     * Filtra ofertas duplicadas basándose en el ID
     * @param ofertas - Array de ofertas
     * @returns OfertaDocument[] - Ofertas sin duplicados
     */
    private removeDuplicateOffers(ofertas: OfertaDocument[]): OfertaDocument[] {
        const seen = new Set<number>();
        return ofertas.filter((oferta) => {
            if (seen.has(oferta.id)) {
                return false;
            }
            seen.add(oferta.id);
            return true;
        });
    }

    /**
     * Procesa un emprendimiento completo: extrae, guarda y envía email
     * @param emprendimiento - Configuración del emprendimiento
     * @param dateRange - Rango de fechas
     * @returns Promise<ExtraccionSummary>
     */
    private async processEmprendimiento(emprendimiento: EmprendimientoConfig, dateRange: DateRange): Promise<ExtraccionSummary> {
        console.log(`\n🏢 Procesando emprendimiento: ${emprendimiento.name}`);

        try {
            // 1. Extraer ofertas
            const ofertas = await this.extractOffersForEmprendimiento(emprendimiento, dateRange);

            // 2. Eliminar duplicados internos
            const ofertasUnicas = this.removeDuplicateOffers(ofertas);
            console.log(`🔄 Ofertas después de eliminar duplicados: ${ofertasUnicas.length}`);

            // 3. Guardar en base de datos
            const { insertedCount, duplicateCount } = await this.databaseService.insertOfertas(ofertasUnicas);

            // 4. Obtener solo las ofertas nuevas para el email (las que se insertaron)
            const ofertasNuevas = ofertasUnicas.slice(0, insertedCount);

            // 5. Enviar email con el reporte
            if (emprendimiento.emailRecipients && emprendimiento.emailRecipients.length > 0) {
                const emailSent = await this.emailService.sendOfertasReport(ofertasNuevas, emprendimiento.name, emprendimiento.emailRecipients, `${dateRange.from} - ${dateRange.to}`);

                if (!emailSent) {
                    console.warn(`⚠️ No se pudo enviar el email para ${emprendimiento.name}`);
                }
            }

            // 6. Generar resumen
            const summary: ExtraccionSummary = {
                emprendimiento: emprendimiento.name,
                total_ofertas: ofertasUnicas.length,
                nuevas_ofertas: insertedCount,
                fecha_extraccion: new Date(),
                endpoints_consultados: emprendimiento.endpoints.map((e) => e.name),
            };

            console.log(`✅ Emprendimiento ${emprendimiento.name} procesado exitosamente`);
            console.log(`   📊 Total: ${summary.total_ofertas}, Nuevas: ${summary.nuevas_ofertas}`);

            return summary;
        } catch (error: any) {
            console.error(`❌ Error procesando emprendimiento ${emprendimiento.name}:`, error.message);

            // Enviar notificación de error por email
            if (emprendimiento.emailRecipients && emprendimiento.emailRecipients.length > 0) {
                await this.emailService.sendErrorNotification(error, emprendimiento.name, emprendimiento.emailRecipients);
            }

            throw error;
        }
    }

    /**
     * Ejecuta la extracción completa para todos los emprendimientos
     * @param isInitialRun - Si es la primera ejecución
     * @returns Promise<ExtraccionSummary[]>
     */
    async runCompleteExtraction(isInitialRun: boolean = false): Promise<ExtraccionSummary[]> {
        console.log("🚀 Iniciando extracción completa de ofertas");
        console.log(`📅 Tipo de ejecución: ${isInitialRun ? "Inicial (rango amplio)" : "Diaria"}`);

        const startTime = Date.now();
        const dateRange = this.generateDateRange(isInitialRun);
        const summaries: ExtraccionSummary[] = [];

        console.log(`📅 Rango de fechas: ${dateRange.from} a ${dateRange.to}`);

        // Verificar conexión a la base de datos
        if (!this.databaseService.isConnectionActive()) {
            console.log("🔌 Conectando a la base de datos...");
            await this.databaseService.connect();
        }

        // Procesar cada emprendimiento
        for (const emprendimiento of emprendimientos) {
            try {
                const summary = await this.processEmprendimiento(emprendimiento, dateRange);
                summaries.push(summary);
            } catch (error: any) {
                console.error(`⚠️ Error procesando ${emprendimiento.name}, continuando con el siguiente...`);

                // Crear un resumen de error
                summaries.push({
                    emprendimiento: emprendimiento.name,
                    total_ofertas: 0,
                    nuevas_ofertas: 0,
                    fecha_extraccion: new Date(),
                    endpoints_consultados: [],
                });
            }
        }

        const totalTime = (Date.now() - startTime) / 1000;
        const totalOfertas = summaries.reduce((sum, s) => sum + s.total_ofertas, 0);
        const totalNuevas = summaries.reduce((sum, s) => sum + s.nuevas_ofertas, 0);

        console.log("\n🎉 Extracción completa finalizada");
        console.log(`⏱️  Tiempo total: ${totalTime.toFixed(2)} segundos`);
        console.log(`📊 Total ofertas procesadas: ${totalOfertas}`);
        console.log(`📊 Total ofertas nuevas: ${totalNuevas}`);
        console.log("📋 Resumen por emprendimiento:");

        summaries.forEach((summary) => {
            console.log(`   • ${summary.emprendimiento}: ${summary.nuevas_ofertas}/${summary.total_ofertas} ofertas`);
        });

        return summaries;
    }

    /**
     * Ejecuta la extracción diaria (solo para el día actual)
     * @returns Promise<ExtraccionSummary[]>
     */
    async runDailyExtraction(): Promise<ExtraccionSummary[]> {
        return await this.runCompleteExtraction(false);
    }

    /**
     * Ejecuta la extracción inicial (rango amplio de fechas)
     * @returns Promise<ExtraccionSummary[]>
     */
    async runInitialExtraction(): Promise<ExtraccionSummary[]> {
        return await this.runCompleteExtraction(true);
    }

    /**
     * Obtiene estadísticas generales del sistema
     * @returns Promise<any>
     */
    async getSystemStats(): Promise<any> {
        if (!this.databaseService.isConnectionActive()) {
            throw new Error("Base de datos no conectada");
        }

        const stats: any = {
            fecha_consulta: new Date(),
            emprendimientos: [],
        };

        for (const emprendimiento of emprendimientos) {
            const empStats = await this.databaseService.getEstadisticasEmprendimiento(emprendimiento.id);
            stats.emprendimientos.push({
                id: emprendimiento.id,
                nombre: emprendimiento.name,
                ...empStats,
            });
        }

        return stats;
    }

    /**
     * Limpia ofertas antiguas de la base de datos
     * @param dias - Días de antigüedad (default: 90)
     * @returns Promise<number>
     */
    async cleanupOldOffers(dias: number = 90): Promise<number> {
        if (!this.databaseService.isConnectionActive()) {
            throw new Error("Base de datos no conectada");
        }

        return await this.databaseService.limpiarOfertasAntiguas(dias);
    }
}
