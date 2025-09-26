/**
 * Interfaces y tipos para el sistema de monitoreo de Chile Compra
 */

/**
 * Estructura de una oferta/cotización individual
 */
export interface Oferta {
    id: number;
    codigo: string;
    nombre: string;
    fecha_publicacion: string;
    fecha_cierre: string;
    organismo: string;
    unidad: string;
    id_estado: number;
    estado: string;
    monto_disponible: number;
    moneda: string;
    monto_disponible_CLP: number;
    fecha_cambio: string | null;
    valor_cambio_moneda: number | null;
    cantidad_proveedores_cotizando: number;
    estado_convocatoria: number;
}

/**
 * Respuesta de la API de Chile Compra
 */
export interface ApiResponse {
    success: string;
    trace: any;
    payload: {
        resultCount: number;
        pageCount: number;
        page: number;
        pageSize: number;
        resultados: Oferta[];
    };
    errores: any;
}

/**
 * Parámetros para consultar la API
 */
export interface ApiQueryParams {
    date_from: string;
    date_to: string;
    order_by: string;
    page_number: number;
    status: number;
    category?: string;
    region?: string;
    keywords?: string;
}

/**
 * Configuración de un endpoint específico para un emprendimiento
 */
export interface EndpointConfig {
    name: string;
    description: string;
    params: Partial<ApiQueryParams>;
}

/**
 * Configuración de un emprendimiento
 */
export interface EmprendimientoConfig {
    id: string;
    name: string;
    description: string;
    endpoints: EndpointConfig[];
    emailRecipients: string[];
}

/**
 * Documento de oferta para almacenar en MongoDB (incluye metadata)
 */
export interface OfertaDocument extends Oferta {
    _id?: string;
    emprendimiento: string;
    endpoint_name: string;
    fecha_extraccion: Date;
    enlace_ficha: string;
}

/**
 * Resumen de extracción para reportes
 */
export interface ExtraccionSummary {
    emprendimiento: string;
    total_ofertas: number;
    nuevas_ofertas: number;
    fecha_extraccion: Date;
    endpoints_consultados: string[];
}

/**
 * Configuración de email
 */
export interface EmailConfig {
    from?: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string;
    bcc?: string;
    replyTo?: string;
}

/**
 * Tipo para definir el rango de fechas de extracción
 */
export type DateRange = {
    from: string;
    to: string;
};

/**
 * Estados de la aplicación para logging
 */
export enum AppStatus {
    IDLE = "idle",
    EXTRACTING = "extracting",
    SAVING = "saving",
    SENDING_EMAIL = "sending_email",
    ERROR = "error",
}
