
// Página de emergencia para confirmar que el servidor se ha estabilizado.
export default function RootPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Servidor Estabilizado</h1>
      <p>
        El error "Internal Server Error" ha sido resuelto. La aplicación ha sido simplificada al mínimo para asegurar una compilación limpia.
      </p>
      <p style={{ marginTop: '1rem' }}>
        Por favor, avísame para que podamos proceder con el siguiente paso: restaurar la estructura visual y la navegación de la aplicación de forma segura.
      </p>
    </div>
  );
}
