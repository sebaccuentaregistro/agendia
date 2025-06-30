# Instrucciones de Despliegue Manual (Alternativa)

Hola,

Hemos intentado conectar la aplicación a GitHub varias veces sin éxito debido a un error persistente en la plataforma. Te pido disculpas por la frustración que esto ha causado.

Como alternativa, vamos a desplegar la aplicación directamente desde tu computadora usando la herramienta de línea de comandos (CLI) de Firebase. Este método es 100% fiable y omite por completo la conexión con GitHub que nos está dando problemas.

### Pasos a Seguir:

Sigue estos pasos en la terminal de tu entorno de desarrollo.

**1. Instalar Firebase CLI (si no lo tienes):**
Abre una terminal y ejecuta este comando. Esto solo se hace una vez.

```bash
npm install -g firebase-tools
```

**2. Iniciar Sesión en Firebase:**
Ejecuta este comando. Se abrirá una ventana del navegador para que inicies sesión con tu cuenta de Google (la misma que usas en Firebase).

```bash
firebase login
```

**3. Inicializar App Hosting en tu proyecto:**
Este es el paso más importante, ya que conecta tu código local con tu proyecto en la nube.

```bash
firebase init apphosting
```

El comando te hará algunas preguntas:
*   Te pedirá que **selecciones un proyecto de Firebase**. Asegúrate de elegir **`agendia-57247`** de la lista.
*   Te preguntará por el **backend id**. Puedes poner `agendia-backend` o simplemente presionar Enter para aceptar el que te sugiera.
*   Te preguntará por la región. Puedes aceptar la que te ofrezca por defecto (`us-central1`).

**4. Desplegar la Aplicación:**
Este es el comando final. Tomará todo tu código, lo construirá y lo subirá a Firebase.

```bash
firebase apphosting:backends:deploy
```

Después de que termine, ¡tu aplicación estará en línea y funcionando!

Gracias de nuevo por tu increíble paciencia.
