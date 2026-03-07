# AGENTS.md - Guías de Agentes y Convenciones de Código

Este documento contiene las reglas, directrices de estilo y convenciones arquitectónicas para todos los agentes autónomos de codificación que operen en este repositorio (`seguimiento-chile-compra`). Cualquier IA (como opencode, Cursor AI, o GitHub Copilot) debe apegarse estrictamente a estas normas para mantener un código unificado, seguro y predecible.

## 1. Instrucciones Generales para Agentes

- **Idioma**: Siempre responde, documenta, e interactúa en **español**. Los mensajes de commits, PRs y la documentación principal deben estar en español, de acuerdo al contexto de dominio (Chile Compra).
- **Proactividad y Claridad**: Prioriza respuestas claras, técnicas y estructuradas. Evita explicaciones largas innecesarias. Ve directamente a la solución o refactorización.
- **Comprensión del Contexto**: Antes de crear o editar código, analiza profundamente el repositorio, prestando especial atención a `src/services`, `src/config`, `src/models` y `src/schedulers`. Imita el estilo de las implementaciones existentes.
- **Evitar Roturas**: Cuando hagas refactorizaciones, asegúrate de no quebrar el CRON o la integración con bases de datos. Si introduces cambios, explica brevemente el motivo.

---

## 2. Comandos de Entorno (Build, Lint, Test)

### Build y Desarrollo Local
El proyecto es un servicio y API basado en Node.js usando TypeScript. Nunca uses comandos obsoletos y respeta los scripts de `package.json`.

- **Modo Desarrollo**: Inicia la aplicación usando `nodemon` y `ts-node` para refresco automático:
  ```bash
  npm run dev
  ```
- **Build de Producción**: Compila el código TypeScript fuertemente tipado a JavaScript puro en la carpeta `dist/`:
  ```bash
  npm run build
  ```
- **Ejecución en Producción**: 
  ```bash
  npm start
  ```

### Pruebas (Testing) y Single Test Runs
En caso de que se te asigne la tarea de probar lógica o debas usar el test-runner (Ej: `jest` con `ts-jest`):

- **Ejecutar todos los tests**: 
  ```bash
  npx jest
  ```
- **Ejecutar un solo archivo de prueba**: Para asegurar la rapidez y menor uso de memoria, prioriza probar sólo los archivos que acabas de modificar.
  ```bash
  npx jest src/services/extraction.service.test.ts
  ```
- **Ejecutar un caso de prueba específico (Single Test)**: Si un test puntual falla, filtra usando el flag `-t`:
  ```bash
  npx jest src/services/extraction.service.test.ts -t "debe retornar los datos correctos de chile compra"
  ```
- **Verificación Continua**: Escribe aserciones sólidas cuando trates con la API de Chile Compra o la base de datos (MongoDB). Moquea siempre llamadas de red a `axios` y correos en `resend`.

### Linter & Análisis Estático
El proyecto delega la verificación de tipos a TypeScript de forma estricta.

- **Verificación de Tipos (Type Checking)**: Usa el compilador de TypeScript para auditar errores sin emitir código. Esto es obligatorio antes de declarar una tarea terminada:
  ```bash
  npx tsc --noEmit
  ```

---

## 3. Estilo de Código y Guías Generales

### 3.1. Formateo y Sintaxis Básica
- **Indentación**: Utiliza siempre **4 espacios** para la indentación en cualquier archivo TypeScript, JavaScript o JSON. No uses tabulaciones (`\t`).
- **Variables**: Prefiere el uso de `const` sobre `let` siempre que la variable no requiera mutación. **Nunca uses `var`**.
- **Comillas**: Emplea comillas simples (`'`) para strings normales y backticks (`` ` ``) para la interpolación de plantillas.
- **Funciones**: Se prefieren funciones de flecha (`=>`) para callbacks y funciones asíncronas sencillas, manteniendo un enfoque puro donde sea posible.
- **Comentarios**: Mantén el código auto-explicativo. Comenta solo la "razón/por qué" de lógicas de negocio complicadas o peculiaridades en la respuesta de la API de Chile Compra.

### 3.2. TypeScript y Tipado Estricto
- **NO uses `any`**: Está prohibido utilizar `any` en funciones de nuevo desarrollo. Debes mapear todas las respuestas utilizando tipos explícitos y guardarlos en `src/models/types.ts` o en archivos de modelo designados.
- **Promesas**: Toda función asíncrona debe retornar una `Promise<InterfaceCorrespondiente>`.
- **Datos Opcionales**: Protege el acceso a atributos anidados de APIs de terceros usando encadenamiento opcional (`?.`) y coalescencia nula (`??`).

### 3.3. Estructura y Modularidad (Arquitectura)
- **Capa de Controladores/Rutas**: Los archivos bajo `src/routes/` no deben contener lógica de extracción, scrapeo, ni transacciones complejas. Son responsables únicamente de recibir las peticiones HTTP y retornar las respuestas adecuadas delegando el proceso a la capa de Servicios.
- **Capa de Servicios**: Los archivos en `src/services/` (ej: `chile-compra-api.service.ts`, `database.service.ts`) contienen el core lógico de la plataforma. Mantén el principio de responsabilidad única (SRP).
- **Procesos en Segundo Plano**: La automatización y orquestación de cron-jobs deben residir bajo `src/schedulers/` (ej: `task-scheduler.ts`).

### 3.4. Nomenclatura (Naming Conventions)
- **Archivos**: Deben estar en minúsculas y usar formato `kebab-case` o con sufijo de responsabilidad, por ejemplo: `email.service.ts`, `api.routes.ts`.
- **Variables y Métodos**: Emplea `camelCase` (ej: `obtenerCotizaciones`, `fechaActual`).
- **Interfaces, Tipos y Clases**: Emplea `PascalCase` (ej: `CotizacionResponse`, `MongoDbService`).
- **Constantes de Configuración**: Usa mayúsculas con `UPPER_SNAKE_CASE` (ej: `MAX_RETRIES`, `DEFAULT_TIMEOUT`).

### 3.5. Importaciones
- Ordena y agrupa de manera limpia las importaciones al tope de los archivos:
  1. Módulos built-in nativos de Node (`fs`, `path`).
  2. Dependencias externas (`express`, `axios`, `mongodb`).
  3. Módulos internos (`../config/config`, `../services/database.service`).
- Trata de no generar imports circulares, prestando especial atención al interactuar entre distintos servicios.

### 3.6. Manejo de Errores
- **Peticiones HTTP**: En las llamadas de express, asegúrate de retornar estructuras estándar ante errores (ej. `res.status(500).json({ error: "Mensaje interno" })`).
- **Bloques Try/Catch**: Todo consumo de red (MongoDB, Axios, Resend) o invocación programada por cron debe estar encapsulada de manera segura con `try/catch`.
- **Resiliencia Externa**: Dado que se está monitorizando un servicio externo (Chile Compra), las fallas temporales por rate limit o mantenimientos son esperables.
- **Logueo Pragmático**: Los errores capturados deben imprimir el trace original y texto explicativo a través de `console.error` facilitando su depuración:
  ```typescript
  try {
      const datos = await this.chileCompraApi.fetch();
      return datos;
  } catch (error) {
      console.error('[ChileCompraService] Falló la extracción de datos:', error);
      throw error;
  }
  ```

---

## 4. Notas para Entornos AI Específicos (Copilot / Cursor)
- Si estás actuando como **Cursor**, este archivo te suple y emula cualquier requerimiento de un archivo `.cursorrules`. Sigue estas normas sin desviaciones.
- Si estás actuando como **GitHub Copilot**, este archivo consolida las guías que tradicionalmente estarían en `.github/copilot-instructions.md`. Procede de acuerdo a la línea técnica detallada arriba.
- Nunca ofrezcas refactorizaciones destructivas ni alteres credenciales/variables de entorno en los archivos o commits. 
