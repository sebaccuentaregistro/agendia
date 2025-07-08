#!/bin/bash
# ADVERTENCIA: Este script borrará permanentemente todos los cambios locales que no estén en GitHub.
# Úsalo para restaurar el proyecto a un estado limpio desde el repositorio.

echo ">>> Paso 1: Obteniendo la última versión de tu código desde GitHub..."
git fetch --all

echo ">>> Paso 2: Forzando la restauración de tus archivos a la versión de GitHub (rama main)..."
# Esto descarta todos los cambios locales (buenos y malos) y hace que tu código sea un espejo exacto de lo que hay en GitHub.
git reset --hard origin/main

echo ">>> Paso 3: Limpiando cualquier archivo extra o basura que se haya creado..."
# Esto elimina cualquier archivo que no esté en tu repositorio de GitHub.
git clean -dfx

echo ""
echo "✅✅✅ ¡Restauración Completa! ✅✅✅"
echo "Tu proyecto ha sido restaurado a la versión de GitHub."
echo "Es posible que necesites recargar la página o reiniciar el servidor si sigue en ejecución."
