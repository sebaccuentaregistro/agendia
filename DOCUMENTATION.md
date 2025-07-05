# Documentación del Proyecto Agendia

Este documento describe la arquitectura, el modelo de datos y las instrucciones de despliegue para la aplicación Agendia.

## 1. Propósito de la Aplicación

Agendia es una aplicación web (SaaS) para la gestión integral de centros de bienestar (estudios de yoga, gimnasios, etc.). Permite administrar clases, horarios, alumnos, especialistas, pagos y asistencias.

## 2. Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: Google Firestore
- **Autenticación**: Firebase Authentication
- **Despliegue**: Firebase App Hosting
- **UI**: ShadCN UI & Tailwind CSS
- **Iconos**: `lucide-react`

## 3. Arquitectura y Modelo de Datos

La base de datos en Firestore se organiza bajo una colección principal `institutes`. Cada documento en esta colección representa un centro, y dentro de él se anidan las colecciones de datos del negocio.

**Ruta base de datos:** `/institutes/{instituteId}/{collectionName}/{documentId}`

### Colecciones Principales:

-   **`users` (Raíz)**: Gestiona las cuentas de usuario de la app (administradores), su estado (`pending`, `active`) y a qué `instituteId` pertenecen.
-   **`people`**: Almacena la información de los alumnos/clientes.
-   **`specialists`**: Gestiona a los instructores.
-   **`actividades`**: Define los tipos de clases o servicios ofrecidos.
-   **`spaces`**: Define las salas físicas donde se imparten las clases.
-   **`sessions`**: Representa una clase recurrente en un día y hora específicos. Es el núcleo del horario.
-   **`attendance`**: Registra la asistencia para una sesión en una fecha concreta.
-   **`payments`**: Historial de todos los pagos realizados.
-   **`tariffs`**: Define los planes de precios.
-   **`levels`**: Define los niveles de práctica (Principiante, Avanzado, etc.).

## 4. Lógica de la Aplicación

-   **`src/context/AuthContext.tsx`**: Gestiona el ciclo de vida de la autenticación del usuario (login, signup, logout) y su perfil.
-   **`src/context/StudioContext.tsx`**: Es el cerebro de la aplicación. Centraliza toda la lógica de negocio y la interacción con Firestore, como añadir/modificar/eliminar datos, inscribir alumnos, registrar pagos, etc.
-   **`src/lib/firestore-actions.ts`**: Contiene las funciones puras que ejecutan las operaciones de base de datos, separadas de la lógica del contexto.

## 5. Cómo Exportar y Ejecutar en Otro Lugar

Puedes descargar el código y ejecutarlo en tu computadora o en otro servicio de hosting.

1.  **Descargar el Código**: Usa la opción "Descargar Código" en la interfaz de Firebase Studio para obtener un archivo ZIP.

2.  **Configurar el Entorno**:
    *   Descomprime el archivo.
    *   Abre una terminal en la carpeta raíz del proyecto (donde está `package.json`).
    *   Instala las dependencias: `npm install`

3.  **Configurar Credenciales**:
    *   En la raíz del proyecto, copia el archivo `.env.local.example` y renómbralo a `.env.local`.
    *   Abre el nuevo `.env.local` y rellena las variables con tus credenciales de Firebase. Las encontrarás en la configuración de tu proyecto en la consola de Firebase.

4.  **Ejecutar la Aplicación**:
    *   Inicia el servidor de desarrollo: `npm run dev`
    *   Abre tu navegador y ve a `http://localhost:3000`.

## 6. Despliegue en Firebase App Hosting

-   El archivo `apphosting.yaml` configura el proceso de construcción y ejecución para el despliegue.
-   **Requisito de Facturación**: Para que el despliegue en Firebase App Hosting funcione, la cuenta de Firebase asociada al proyecto debe tener la facturación activada. Este es un requisito de Google Cloud, sobre el cual esta aplicación no tiene control.
