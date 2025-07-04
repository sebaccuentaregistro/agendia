# Cómo Exportar y Ejecutar este Proyecto en Otro Lugar

Este es un proyecto estándar de Next.js. Puedes descargarlo y ejecutarlo en tu propia computadora o en otro servicio de hosting.

## Paso 1: Descargar el Código

Busca en la interfaz de Firebase Studio una opción para **"Descargar Código"**, **"Exportar Proyecto"** o similar. Esto te dará un archivo ZIP con todos los archivos de tu aplicación.

## Paso 2: Configurar tu Entorno Local

Una vez que hayas descomprimido el archivo en tu computadora, sigue estos pasos:

1.  **Abre una terminal** en la carpeta raíz de tu proyecto (la carpeta que contiene `package.json`).

2.  **Instala las dependencias:** Ejecuta el siguiente comando. Esto descargará todas las librerías que la aplicación necesita.
    ```bash
    npm install
    ```

3.  **Configura tus credenciales de Firebase:**
    *   En la carpeta raíz del proyecto, encontrarás un archivo llamado `.env.local.example`.
    *   Haz una copia de este archivo y renómbrala a `.env.local`.
    *   Abre el nuevo archivo `.env.local` y rellena los valores con tus propias credenciales de Firebase. Las puedes encontrar en la configuración de tu proyecto en la consola de Firebase.

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="TU_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="TU_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="TU_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="TU_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="TU_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="TU_APP_ID"
    ```

## Paso 3: Ejecutar la Aplicación

Una vez instaladas las dependencias y configuradas las credenciales, puedes iniciar el servidor de desarrollo local con este comando:

```bash
npm run dev
```

Abre tu navegador y ve a `http://localhost:3000`. ¡Deberías ver tu aplicación funcionando!
