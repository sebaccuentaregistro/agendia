#!/bin/bash
# Script de Reseteo de Emergencia

# Mensaje de Advertencia
echo "🛑 ¡ATENCIÓN! Este script es una medida de emergencia."
echo "Se eliminarán todos los cambios locales no guardados en tu repositorio de GitHub."
echo "Esto incluye archivos nuevos o modificados que no hayas 'commiteado'."
echo "El objetivo es restaurar el proyecto a un estado limpio y conocido."
echo ""
read -p "¿Estás completamente seguro de que quieres continuar? (s/n): " confirmacion

if [[ "$confirmacion" != "s" && "$confirmacion" != "S" ]]; then
    echo "Operación cancelada."
    exit 0
fi

echo "✅ Confirmación recibida. Iniciando reseteo..."

# 1. Descartar todos los cambios locales.
# - 'git reset --hard' fuerza la restauración de todos los archivos al último commit.
echo "🔄 Descartando todos los cambios locales y volviendo al último commit..."
git reset --hard HEAD

# 2. Limpiar archivos no rastreados.
# - 'git clean -fd' elimina forzosamente todos los archivos y directorios que no están en el repositorio.
# Esto es crucial para eliminar archivos de caché o compilaciones rotas.
echo "🧹 Limpiando archivos y carpetas no rastreados (como node_modules y builds fallidos)..."
git clean -fd

# 3. Forzar la reinstalación de las dependencias.
# Al haber eliminado node_modules, este comando es esencial.
echo "📦 Forzando la reinstalación de todas las dependencias desde package.json..."
npm install

echo "✅ ¡Reseteo completado! El proyecto ha sido restaurado."
echo "El servidor de desarrollo se reiniciará automáticamente. Por favor, espera un momento..."
