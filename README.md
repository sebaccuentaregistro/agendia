# Agendia

Agendia es una aplicación web moderna construida con Next.js y diseñada para la gestión integral de centros de bienestar, como estudios de yoga o gimnasios.

## ✨ Características Principales

- Gestión de Clases y Horarios
- Registro y Seguimiento de Alumnos
- Administración de Especialistas y Espacios
- Asistente de IA para optimización de horarios

## 🛠️ Stack Tecnológico

- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript
- **UI**: React, ShadCN UI
- **Estilos**: Tailwind CSS
- **Inteligencia Artificial**: Genkit
- **Tipografía**: Poppins
- **Iconos**: Lucide-react

---

## 🚀 Despliegue Final en Producción

¡Has llegado al último paso! Para poner tu aplicación en línea, sigue estas instrucciones en la **Terminal** de Firebase Studio.

**Paso 1: Limpieza del Proyecto**

Ejecuta el siguiente comando para eliminar la carpeta `workspace`, que contiene código experimental y fue la causa de errores de compilación anteriores. Esto asegura un despliegue limpio y seguro.

```bash
rm -rf workspace/
```

**Paso 2: Despliegue a Internet**

Ahora, ejecuta el comando principal. Firebase construirá tu aplicación y, si todo está correcto, la publicará en la web.

```bash
firebase deploy
```

Al finalizar, la terminal te mostrará la URL pública de tu aplicación (normalmente `https://[tu-id-de-proyecto].web.app`).

¡Felicitaciones! Tu aplicación estará en producción.
