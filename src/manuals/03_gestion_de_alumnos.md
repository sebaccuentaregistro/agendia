# 3. Gestión de Alumnos y Pagos

La sección de **Personas** es donde gestionas el activo más importante de tu estudio: tus alumnos. Este manual cubre todo el ciclo de vida de un cliente, desde su alta hasta la gestión de sus pagos y asistencias.

---

### 3.1. Añadir y Editar una Persona

*   **Para añadir:** Ve a la sección `Personas` y haz clic en el botón **"Añadir Persona"**.
*   **Para editar:** En la tarjeta de cada persona, haz clic en el menú de tres puntos (⋮) y selecciona "Editar Persona".

**Campos del Perfil:**
*   **Nombre y Teléfono:** Datos básicos de contacto.
*   **Arancel:** Asigna el plan de precios que pagará el alumno. Es un campo obligatorio.
*   **Nivel (Opcional):** Asigna el nivel de práctica del alumno.
*   **Fecha de Ingreso:** Por defecto es el día actual.
*   **Próximo Vencimiento (Opcional):** Si estableces una fecha aquí, el sistema calculará los vencimientos a partir de ella. Si lo dejas en blanco, el alumno aparecerá con estado "Pendiente de Pago" hasta que registres su primer abono.
*   **Info de Salud y Notas (Opcional):** Campos para información relevante que solo tú y tus operadores podrán ver.

---

### 3.2. Gestión de Pagos

El sistema automatiza gran parte de la gestión de pagos.

*   **Para Registrar un Pago:** En la tarjeta de la persona, haz clic en el botón **"Registrar Pago"**.
    *   Automáticamente, el sistema calculará la **próxima fecha de vencimiento** según el ciclo de pago de su arancel (mensual, semanal, etc.).
    *   El estado del alumno se actualizará a **"Al día"**.

*   **Estados de Pago:**
    *   **Al día (Verde):** El pago está vigente.
    *   **Atrasado (Rojo):** La fecha de vencimiento ya pasó. El sistema te mostrará cuántos días de atraso tiene.
    *   **Pendiente de Pago (Azul):** Ocurre cuando se crea un alumno sin una fecha de vencimiento inicial. Se resuelve al registrar el primer pago.

*   **Revertir Pago:** Si cometes un error, puedes ir al menú (⋮) y seleccionar "Volver atrás último pago" para anular el registro más reciente.

*   **Historial de Pagos:** En el mismo menú, puedes consultar todos los pagos históricos de la persona.

---

### 3.3. Gestión de Horarios del Alumno

*   **Inscripción a Clases:** En la tarjeta de la persona, haz clic en "Horarios". Se abrirá un panel donde podrás seleccionar todas las clases a las que asistirá de forma fija.
    *   **Alerta de Límite de Plan:** Si el arancel de la persona tiene un límite de clases semanales, el sistema te mostrará una advertencia si intentas superar ese límite.

*   **Gestión de Ausencias:**
    *   **Justificar Ausencia:** En el menú (⋮) de la persona, selecciona "Notificar Ausencia". Elige la fecha de la clase a la que faltará. Esto le generará automáticamente un **crédito de recupero**.
    *   **Usar un Recupero:** Para usar un crédito, ve a `Horarios`, busca la clase a la que quieres que asista puntualmente y, en su menú de opciones, selecciona "Inscripción de Recupero".

*   **Gestión de Vacaciones:** En el menú (⋮), puedes definir períodos de vacaciones. Durante esas fechas, el alumno no aparecerá en las listas de asistencia y se liberará su cupo temporalmente.

---

### 3.4. Desactivar y Reactivar un Alumno

*   **Para desactivar:** Si un alumno deja el estudio, ve al menú (⋮) y selecciona "Desactivar Persona". Esto lo eliminará de todas sus clases y lo moverá a la pestaña de "Inactivos", pero conservará todo su historial.
*   **Para reactivar:** Ve a la pestaña "Inactivos", busca a la persona y haz clic en el botón "Reactivar". La persona volverá a la lista de activos, pero deberás inscribirla manualmente a sus clases de nuevo.
