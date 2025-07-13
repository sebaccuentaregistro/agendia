#!/bin/bash
# Script de Reseteo de Proyecto

# Mensaje de Advertencia
echo "🛑 ¡ATENCIÓN! Este script es para resolver problemas de compilación."
echo "Se eliminará la caché de Next.js y se reinstalarán las dependencias."
echo "Esto restaurará el proyecto a un estado de compilación limpio."
echo ""
read -p "¿Estás seguro de que quieres continuar? (s/n): " confirmacion

if [[ "$confirmacion" != "s" && "$confirmacion" != "S" ]]; then
    echo "Operación cancelada."
    exit 0
fi

echo "✅ Confirmación recibida. Iniciando reseteo..."

# 1. Eliminar la caché de Next.js (¡MUY IMPORTANTE!)
# - La carpeta .next contiene la caché de compilación, que puede corromperse.
echo "🔥 Eliminando la caché de compilación de Next.js (carpeta .next)..."
rm -rf .next

# 2. Forzar la reinstalación de las dependencias.
echo "📦 Forzando la reinstalación de todas las dependencias desde package.json..."
npm install --force

echo "✅ ¡Reseteo completado! El proyecto ha sido restaurado."
echo "El servidor de desarrollo se reiniciará automáticamente. Por favor, espera un momento..."
