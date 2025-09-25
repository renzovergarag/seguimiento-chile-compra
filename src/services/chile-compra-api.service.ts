import axios, { AxiosResponse } from "axios";
import { ApiResponse, ApiQueryParams, Oferta } from "../models/types";

/**
 * Servicio para interactuar con la API de Chile Compra
 * Maneja la consulta de ofertas con paginación y control de concurrencia
 */
export class ChileCompraApiService {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly delayBetweenRequests: number;

    constructor(
        baseUrl: string,
        apiKey: string,
        delayBetweenRequests: number = 2000 // 2 segundos por defecto para simular comportamiento humano
    ) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.delayBetweenRequests = delayBetweenRequests;
    }

    /**
     * Realiza una consulta a una página específica de la API
     * @param params - Parámetros de consulta
     * @returns Promise<ApiResponse>
     */
    private async fetchPage(params: ApiQueryParams): Promise<ApiResponse> {
        try {
            const url = `${this.baseUrl}/compra-agil`;

            console.log(`🔍 Consultando página ${params.page_number} con parámetros:`, {
                ...params,
                apiKey: "***",
            });

            const response: AxiosResponse<ApiResponse> = await axios.get(url, {
                params,
                headers: {
                    "x-api-key": this.apiKey,
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0",
                },
                timeout: 30000, // 30 segundos de timeout
            });

            if (response.data.success !== "OK") {
                throw new Error(`API respondió con error: ${response.data.success}`);
            }

            console.log(`✅ Página ${params.page_number} obtenida: ${response.data.payload.resultados.length} ofertas`);
            return response.data;
        } catch (error: any) {
            console.error(`❌ Error consultando página ${params.page_number}:`, error.message);
            throw error;
        }
    }

    /**
     * Introduce un delay para simular comportamiento humano
     * @param ms - Milisegundos de delay
     * @returns Promise<void>
     */
    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Obtiene todas las ofertas de un endpoint específico
     * Maneja automáticamente la paginación
     * @param baseParams - Parámetros base (sin page_number)
     * @returns Promise<Oferta[]>
     */
    async getAllOfertas(baseParams: Partial<ApiQueryParams>): Promise<Oferta[]> {
        const allOfertas: Oferta[] = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            // Primera consulta para obtener el número total de páginas
            const firstPageParams: ApiQueryParams = {
                ...baseParams,
                page_number: currentPage,
                date_from: baseParams.date_from || "",
                date_to: baseParams.date_to || "",
                order_by: baseParams.order_by || "recent",
                status: baseParams.status || 2,
            };

            const firstResponse = await this.fetchPage(firstPageParams);
            totalPages = firstResponse.payload.pageCount;

            console.log(`📊 Total de páginas a consultar: ${totalPages}`);
            console.log(`📊 Total de ofertas disponibles: ${firstResponse.payload.resultCount}`);

            // Agregar ofertas de la primera página
            allOfertas.push(...firstResponse.payload.resultados);

            // Consultar páginas restantes si las hay
            for (currentPage = 2; currentPage <= totalPages; currentPage++) {
                // Delay entre requests para simular comportamiento humano
                await this.delay(this.delayBetweenRequests);

                const pageParams: ApiQueryParams = {
                    ...firstPageParams,
                    page_number: currentPage,
                };

                const response = await this.fetchPage(pageParams);
                allOfertas.push(...response.payload.resultados);

                // Progreso cada 10 páginas
                if (currentPage % 10 === 0) {
                    console.log(`📈 Progreso: ${currentPage}/${totalPages} páginas procesadas`);
                }
            }

            console.log(`✅ Extracción completada: ${allOfertas.length} ofertas obtenidas de ${totalPages} páginas`);
            return allOfertas;
        } catch (error: any) {
            console.error(`❌ Error en extracción completa (página ${currentPage}/${totalPages}):`, error.message);

            // Retornar las ofertas obtenidas hasta el momento si hay algún error
            if (allOfertas.length > 0) {
                console.log(`⚠️ Retornando ${allOfertas.length} ofertas obtenidas antes del error`);
                return allOfertas;
            }

            throw error;
        }
    }

    /**
     * Obtiene ofertas con parámetros específicos y validación
     * @param params - Parámetros de consulta
     * @returns Promise<Oferta[]>
     */
    async getOfertasWithParams(params: Partial<ApiQueryParams>): Promise<Oferta[]> {
        // Validar parámetros obligatorios
        if (!params.date_from || !params.date_to) {
            throw new Error("Los parámetros date_from y date_to son obligatorios");
        }

        // Validar formato de fechas (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(params.date_from) || !dateRegex.test(params.date_to)) {
            throw new Error("Las fechas deben estar en formato YYYY-MM-DD");
        }

        // Validar que date_from no sea posterior a date_to
        const dateFrom = new Date(params.date_from);
        const dateTo = new Date(params.date_to);
        if (dateFrom > dateTo) {
            throw new Error("date_from no puede ser posterior a date_to");
        }

        console.log(`🚀 Iniciando extracción de ofertas desde ${params.date_from} hasta ${params.date_to}`);

        return await this.getAllOfertas(params);
    }

    /**
     * Prueba la conectividad con la API
     * @returns Promise<boolean>
     */
    async testConnection(): Promise<boolean> {
        try {
            const testParams: ApiQueryParams = {
                date_from: "2025-09-24",
                date_to: "2025-09-24",
                order_by: "recent",
                page_number: 1,
                status: 2,
            };

            const response = await this.fetchPage(testParams);
            console.log("✅ Conexión con API de Chile Compra exitosa");
            return response.success === "OK";
        } catch (error: any) {
            console.error("❌ Error probando conexión con API:", error.message);
            return false;
        }
    }

    /**
     * Obtiene estadísticas de una consulta sin descargar todas las ofertas
     * @param params - Parámetros de consulta
     * @returns Promise<{ totalOfertas: number; totalPaginas: number; ofertasPorPagina: number }>
     */
    async getEstadisticasConsulta(params: Partial<ApiQueryParams>): Promise<{
        totalOfertas: number;
        totalPaginas: number;
        ofertasPorPagina: number;
    }> {
        const queryParams: ApiQueryParams = {
            ...params,
            page_number: 1,
            date_from: params.date_from || "",
            date_to: params.date_to || "",
            order_by: params.order_by || "recent",
            status: params.status || 2,
        };

        const response = await this.fetchPage(queryParams);

        return {
            totalOfertas: response.payload.resultCount,
            totalPaginas: response.payload.pageCount,
            ofertasPorPagina: response.payload.pageSize,
        };
    }
}
