#!/usr/bin/env node

/**
 * Script de prueba para verificar que el servidor Express esté funcionando correctamente
 * Ejecutar con: node test-server.js
 */

const axios = require("axios").default;

const BASE_URL = "http://localhost:3000";

async function testServer() {
    console.log("🧪 Iniciando pruebas del servidor...\n");

    const tests = [
        {
            name: "Ruta raíz",
            endpoint: "/",
            method: "GET",
        },
        {
            name: "Health check básico",
            endpoint: "/health",
            method: "GET",
        },
        {
            name: "Health check detallado",
            endpoint: "/health/detailed",
            method: "GET",
        },
        {
            name: "Estado de extracción",
            endpoint: "/api/extraction/status",
            method: "GET",
        },
        {
            name: "Lista de emprendimientos",
            endpoint: "/api/extraction/emprendimientos",
            method: "GET",
        },
        {
            name: "Estadísticas generales",
            endpoint: "/api/stats/general",
            method: "GET",
        },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`📡 Probando: ${test.name} (${test.method} ${test.endpoint})`);

            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${test.endpoint}`,
                timeout: 10000,
            });

            if (response.status === 200) {
                console.log(`✅ ${test.name}: OK (${response.status})`);
                passed++;
            } else {
                console.log(`⚠️ ${test.name}: ${response.status} ${response.statusText}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
            failed++;
        }

        console.log(""); // Línea en blanco
    }

    // Resumen
    console.log("📊 Resumen de pruebas:");
    console.log(`✅ Exitosas: ${passed}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);

    if (failed === 0) {
        console.log("\n🎉 ¡Todas las pruebas pasaron! El servidor está funcionando correctamente.");
    } else {
        console.log("\n⚠️ Algunas pruebas fallaron. Revisar la configuración del servidor.");
    }
}

// Función para verificar si el servidor está ejecutándose
async function checkServerStatus() {
    try {
        const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// Ejecutar pruebas
async function main() {
    console.log("🔍 Verificando si el servidor está ejecutándose...");

    const isRunning = await checkServerStatus();

    if (!isRunning) {
        console.log("❌ El servidor no está ejecutándose en " + BASE_URL);
        console.log("💡 Para iniciar el servidor, ejecuta:");
        console.log("   npm run dev   # Para desarrollo");
        console.log("   npm start     # Para producción");
        process.exit(1);
    }

    console.log("✅ Servidor detectado, iniciando pruebas...\n");
    await testServer();
}

if (require.main === module) {
    main().catch((error) => {
        console.error("❌ Error ejecutando pruebas:", error.message);
        process.exit(1);
    });
}
