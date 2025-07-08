// Página de recuperación estática para confirmar que la compilación funciona.
export default function RecoveryPage() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center', lineHeight: '1.6' }}>
      <h1>Modo de Recuperación del Sistema</h1>
      <p>La aplicación ha sido restablecida a su estado más simple posible para corregir los errores críticos de compilación (404 Not Found).</p>
      <p>Si estás viendo este mensaje, significa que el servidor ha vuelto a estar en línea y responde correctamente.</p>
      <p style={{ fontWeight: 'bold', marginTop: '1rem' }}>
        Por favor, confírmame que ves esta pantalla para que podamos proceder a restaurar tu aplicación de forma segura.
      </p>
    </div>
  );
}
