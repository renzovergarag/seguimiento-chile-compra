import { EmprendimientoConfig } from "../models/types";

/**
 * Configuración de emprendimientos con sus respectivos endpoints de consulta
 * Este archivo permite agregar fácilmente nuevos emprendimientos o modificar los existentes
 */

/**
 * Configuración para el emprendimiento de Transporte
 */
const transporteConfig: EmprendimientoConfig = {
    id: "alfaTour",
    name: "Alta Tour",
    description: "Emprendimiento de transporte con bus para 15 personas",
    emailRecipients: ["renzovergarag@gmail.com", "loretobarrera.tts@gmail.com", "rodrigorojasreyes2802@gmail.com"],
    endpoints: [
        {
            name: "Vehículos para turismo",
            description: "Servicios de Vehículos para turismo",
            params: {
                category: "25101500",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Transporte de carga por carretera",
            description: "Servicios de transporte de carga por carretera",
            params: {
                category: "78101800",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Transporte de equipo médico y traslado de productos",
            description: "Servicios de Transporte de equipo médico y traslado de productos",
            params: {
                category: "42192400",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Transporte de pasajeros por carretera",
            description: "Servicios de Transporte de pasajeros por carretera",
            params: {
                category: "78111800",
                // region: "5",
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
    id: "neurox",
    name: "Neuro-X",
    description: "Emprendimiento de software, asesorías y venta de licencias",
    emailRecipients: ["renzovergarag@gmail.com", "anibal.lufi.a@gmail.com", "ptudela@neurox.cl"],
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
            name: "Búsqueda por Inteligencia Artificial",
            description: 'Ofertas que contienen la palabra "artificial"',
            params: {
                keywords: "artificial",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Sistemas de extracción de información",
            description: "Servicios de Sistemas de extracción de información",
            params: {
                category: "81111900",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Ingeniería en computación e informática",
            description: "Servicios de Ingeniería en computación e informática",
            params: {
                category: "81111500",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Programadores informáticos",
            description: "Servicios de programación informática",
            params: {
                category: "81111600",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Software de intercambio de información",
            description: "Servicio de Software de intercambio de información",
            params: {
                category: "43233500",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Sistemas de información",
            description: "Servicios de Sistemas de información",
            params: {
                category: "81111700",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Contratistas en tecnologías de la información",
            description: "Servicios de Contratistas en tecnologías de la información",
            params: {
                category: "80111800",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Software de edición y creación de contenidos",
            description: "Software de edición y creación de contenidos",
            params: {
                category: "43232100",
                status: 2,
                order_by: "recent",
            },
        },
        {
            name: "Software de planificación de recursos empresariales (ERP) y contabilidad financiera",
            description: "Software de planificación de recursos empresariales (ERP) y contabilidad financiera",
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
