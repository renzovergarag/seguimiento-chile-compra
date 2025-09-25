import { EmprendimientoConfig } from "../models/types";

/**
 * Configuración de emprendimientos con sus respectivos endpoints de consulta
 * Este archivo permite agregar fácilmente nuevos emprendimientos o modificar los existentes
 */

/**
 * Configuración para el emprendimiento de Transporte
 */
const transporteConfig: EmprendimientoConfig = {
    id: "transporte",
    name: "Servicios de Transporte",
    description: "Emprendimiento de transporte con bus para 15 personas",
    emailRecipients: [process.env.EMAIL_TO || "usuario@ejemplo.com"],
    endpoints: [
        {
            name: "Servicios de Transporte General",
            description: "Servicios de transporte en general",
            params: {
                category: "25101500",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Servicios de Turismo y Viajes",
            description: "Servicios relacionados con turismo y viajes",
            params: {
                category: "78101800",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Transporte de Pasajeros",
            description: "Servicios específicos de transporte de pasajeros",
            params: {
                category: "42192400",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Servicios de Transporte Región V",
            description: "Servicios de transporte en la Región de Valparaíso",
            params: {
                category: "78111800",
                region: "5",
                status: 2,
                order_by: "recent",
            },
        },
    ],
};

/**
 * Configuración para el emprendimiento de Software
 */
const softwareConfig: EmprendimientoConfig = {
    id: "software",
    name: "Servicios de Software y Tecnología",
    description: "Emprendimiento de software, asesorías y venta de licencias",
    emailRecipients: [process.env.EMAIL_TO || "usuario@ejemplo.com"],
    endpoints: [
        {
            name: "Búsqueda por Software",
            description: 'Ofertas que contienen la palabra "software"',
            params: {
                keywords: "software",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Inteligencia Artificial",
            description: "Ofertas relacionadas con inteligencia artificial",
            params: {
                keywords: "artificial",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Desarrollo de Software",
            description: "Servicios de desarrollo de software",
            params: {
                category: "81111900",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Servicios de Informática",
            description: "Servicios generales de informática",
            params: {
                category: "81111500",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Servicios de Sistemas",
            description: "Servicios de sistemas informáticos",
            params: {
                category: "81111600",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Software de Aplicación",
            description: "Software de aplicaciones específicas",
            params: {
                category: "43233500",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Servicios de Base de Datos",
            description: "Servicios relacionados con bases de datos",
            params: {
                category: "81111700",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Servicios de Consultoría TI",
            description: "Servicios de consultoría en tecnologías de información",
            params: {
                category: "80111800",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Software de Sistema",
            description: "Software de sistema y utilidades",
            params: {
                category: "43232100",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Software de Desarrollo",
            description: "Herramientas de desarrollo de software",
            params: {
                category: "43231600",
                status: 2,
                order_by: "recent",
            },
        },
    ],
};

/**
 * Array con todas las configuraciones de emprendimientos
 * Para agregar un nuevo emprendimiento, simplemente añadir un nuevo objeto aquí
 */
export const emprendimientos: EmprendimientoConfig[] = [transporteConfig, softwareConfig];

/**
 * Función para obtener la configuración de un emprendimiento por ID
 * @param id - ID del emprendimiento
 * @returns Configuración del emprendimiento o undefined si no existe
 */
export function getEmprendimientoById(id: string): EmprendimientoConfig | undefined {
    return emprendimientos.find((emp) => emp.id === id);
}

/**
 * Función para obtener todos los IDs de emprendimientos disponibles
 * @returns Array con los IDs de todos los emprendimientos
 */
export function getAllEmprendimientoIds(): string[] {
    return emprendimientos.map((emp) => emp.id);
}
