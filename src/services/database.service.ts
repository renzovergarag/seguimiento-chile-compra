import { MongoClient, Db, Collection } from "mongodb";
import { OfertaDocument } from "../models/types";

/**
 * Servicio de base de datos MongoDB
 * Maneja la conexión, inserción y consulta de ofertas
 */
export class DatabaseService {
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private isConnected: boolean = false;

    constructor(
        private readonly connectionString: string,
        private readonly databaseName: string
    ) {}

    /**
     * Establece la conexión con MongoDB
     * @returns Promise<void>
     */
    async connect(): Promise<void> {
        try {
            console.log("Conectando a MongoDB...");
            this.client = new MongoClient(this.connectionString);
            await this.client.connect();
            this.db = this.client.db(this.databaseName);
            this.isConnected = true;
            console.log(`✅ Conectado exitosamente a MongoDB: ${this.databaseName}`);

            // Crear índices únicos para evitar duplicados
            await this.createIndexes();
        } catch (error) {
            console.error("❌ Error conectando a MongoDB:", error);
            throw error;
        }
    }

    /**
     * Cierra la conexión con MongoDB
     * @returns Promise<void>
     */
    async disconnect(): Promise<void> {
        try {
            if (this.client) {
                await this.client.close();
                this.isConnected = false;
                console.log("✅ Desconectado de MongoDB");
            }
        } catch (error) {
            console.error("❌ Error desconectando de MongoDB:", error);
            throw error;
        }
    }

    /**
     * Verifica si la conexión está activa
     * @returns boolean
     */
    isConnectionActive(): boolean {
        return this.isConnected && this.client !== null;
    }

    /**
     * Crea índices únicos en la colección de ofertas para evitar duplicados
     * @returns Promise<void>
     */
    private async createIndexes(): Promise<void> {
        try {
            const collection = this.getOfertasCollection();

            // Índice único compuesto para evitar duplicados por ID y emprendimiento
            await collection.createIndex({ id: 1, emprendimiento: 1 }, { unique: true, name: "unique_oferta_emprendimiento" });

            // Índice para búsquedas por fecha de extracción
            await collection.createIndex({ fecha_extraccion: -1 }, { name: "fecha_extraccion_desc" });

            // Índice para búsquedas por emprendimiento
            await collection.createIndex({ emprendimiento: 1 }, { name: "emprendimiento_index" });

            console.log("✅ Índices creados exitosamente");
        } catch (error) {
            console.error("❌ Error creando índices:", error);
            throw error;
        }
    }

    /**
     * Obtiene la colección de ofertas
     * @returns Collection<OfertaDocument>
     */
    private getOfertasCollection(): Collection<OfertaDocument> {
        if (!this.db) {
            throw new Error("Base de datos no conectada");
        }
        return this.db.collection<OfertaDocument>("ofertas");
    }

    /**
     * Inserta múltiples ofertas en la base de datos, ignorando duplicados
     * @param ofertas - Array de ofertas a insertar
     * @returns Promise<{ insertedCount: number; duplicateCount: number }>
     */
    async insertOfertas(ofertas: OfertaDocument[]): Promise<{ insertedCount: number; duplicateCount: number }> {
        if (!this.isConnectionActive()) {
            throw new Error("Base de datos no conectada");
        }

        if (ofertas.length === 0) {
            return { insertedCount: 0, duplicateCount: 0 };
        }

        const collection = this.getOfertasCollection();
        let insertedCount = 0;
        let duplicateCount = 0;

        // Insertar ofertas una por una para manejar duplicados
        for (const oferta of ofertas) {
            try {
                await collection.insertOne(oferta);
                insertedCount++;
            } catch (error: any) {
                if (error.code === 11000) {
                    // Error de duplicado - es esperado
                    duplicateCount++;
                } else {
                    console.error("❌ Error insertando oferta:", error);
                    throw error;
                }
            }
        }

        console.log(`📊 Inserción completada: ${insertedCount} nuevas, ${duplicateCount} duplicadas`);
        return { insertedCount, duplicateCount };
    }

    /**
     * Obtiene ofertas por emprendimiento y rango de fechas
     * @param emprendimiento - ID del emprendimiento
     * @param fechaDesde - Fecha desde (opcional)
     * @param fechaHasta - Fecha hasta (opcional)
     * @returns Promise<OfertaDocument[]>
     */
    async getOfertasByEmprendimiento(emprendimiento: string, fechaDesde?: Date, fechaHasta?: Date): Promise<OfertaDocument[]> {
        if (!this.isConnectionActive()) {
            throw new Error("Base de datos no conectada");
        }

        const collection = this.getOfertasCollection();
        const filter: any = { emprendimiento };

        if (fechaDesde || fechaHasta) {
            filter.fecha_extraccion = {};
            if (fechaDesde) filter.fecha_extraccion.$gte = fechaDesde;
            if (fechaHasta) filter.fecha_extraccion.$lte = fechaHasta;
        }

        return await collection.find(filter).sort({ fecha_extraccion: -1, fecha_publicacion: -1 }).toArray();
    }

    /**
     * Obtiene estadísticas de ofertas por emprendimiento
     * @param emprendimiento - ID del emprendimiento
     * @returns Promise<{ total: number; hoy: number; ultima_extraccion: Date | null }>
     */
    async getEstadisticasEmprendimiento(emprendimiento: string): Promise<{
        total: number;
        hoy: number;
        ultima_extraccion: Date | null;
    }> {
        if (!this.isConnectionActive()) {
            throw new Error("Base de datos no conectada");
        }

        const collection = this.getOfertasCollection();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const [totalResult, hoyResult, ultimaExtraccionResult] = await Promise.all([
            collection.countDocuments({ emprendimiento }),
            collection.countDocuments({
                emprendimiento,
                fecha_extraccion: { $gte: hoy },
            }),
            collection.findOne({ emprendimiento }, { sort: { fecha_extraccion: -1 }, projection: { fecha_extraccion: 1 } }),
        ]);

        return {
            total: totalResult,
            hoy: hoyResult,
            ultima_extraccion: ultimaExtraccionResult?.fecha_extraccion || null,
        };
    }

    /**
     * Limpia ofertas antiguas (más de X días)
     * @param diasAntiguedad - Número de días de antigüedad
     * @returns Promise<number> - Número de documentos eliminados
     */
    async limpiarOfertasAntiguas(diasAntiguedad: number = 90): Promise<number> {
        if (!this.isConnectionActive()) {
            throw new Error("Base de datos no conectada");
        }

        const collection = this.getOfertasCollection();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

        const resultado = await collection.deleteMany({
            fecha_extraccion: { $lt: fechaLimite },
        });

        console.log(`🧹 Limpieza completada: ${resultado.deletedCount} ofertas antiguas eliminadas`);
        return resultado.deletedCount;
    }
}
