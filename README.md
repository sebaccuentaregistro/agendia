# Agendia

Agendia es una aplicación web moderna construida con Next.js y diseñada para la gestión integral de centros de bienestar, como estudios de yoga o   gimnasios.

## 🛠️ Stack Tecnológico

- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: Google Firestore
- **UI**: React, ShadCN UI
- **Estilos**: Tailwind CSS
- **Inteligencia Artificial**: Genkit
- **Tipografía**: Poppins
- **Iconos**: Lucide-react

## 💾 ¿Dónde se guardan los datos?

La aplicación utiliza **Google Firestore**, una base de datos en la nube en tiempo real proporcionada por Firebase. Esto significa que tus datos están seguros y respaldados en la infraestructura de Google.

- **Archivo de Configuración**: La conexión se establece en `src/lib/firebase.ts`.
- **Lógica de Datos**: Todas las operaciones de lectura y escritura se gestionan a través de las funciones en `src/lib/firestore-actions.ts`.
- **Documentación Detallada**: Puedes encontrar un desglose completo de la arquitectura y el modelo de datos en el archivo [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 🚀 Despliegue Final en Producción

¡Has llegado al último paso! Para poner tu aplicación en línea, sigue estas instrucciones en la **Terminal** de Firebase Studio.

**Paso 1: Limpieza del Proyecto (Opcional pero recomendado)**

Si has experimentado errores graves, ejecuta el siguiente comando para asegurar un despliegue limpio y seguro.

```bash
rm -f reset_project.sh GARANTIA.md
```

**Paso 2: Despliegue a Internet**

Ahora, ejecuta el comando principal. Firebase construirá tu aplicación y, si todo está correcto, la publicará en la web.

```bash
firebase deploy
```

Al finalizar, la terminal te mostrará la URL pública de tu aplicación (normalmente `https://[tu-id-de-proyecto].web.app`).

¡Felicitaciones! Tu aplicación estará de  producción.

---
**Nota de prueba:** Este cambio se hizo en la rama `proximas-mejoras` para probar el flujo de Git.
