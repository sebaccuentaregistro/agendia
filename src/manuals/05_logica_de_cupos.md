# 5. Entendiendo la Lógica de Cupos y Asistencia

Este manual explica cómo Agendia gestiona la ocupación de tus clases, diferenciando entre la planificación a largo plazo y la asistencia diaria. Comprender esta lógica es clave para manejar recuperos y vacaciones de forma eficiente.

---

### Dos Vistas, Dos Propósitos: `Inicio` vs. `Horarios`

La principal fuente de confusión suele ser por qué el número de inscriptos puede variar entre la página de **Inicio** y la de **Horarios**. La razón es que responden a dos preguntas diferentes:

1.  **Página de `Horarios` (Planificación a Largo Plazo):**
    *   **Pregunta que responde:** *¿Cuál es la ocupación **fija** y recurrente de esta clase cada semana?*
    *   **Lógica:** Este contador solo mira la lista de alumnos con inscripción permanente. Es tu "plantilla" estructural. Si una clase tiene 8/10 alumnos fijos, siempre mostrará 8/10 aquí, sin importar las ausencias o recuperos del día.

2.  **Página de `Inicio` (Realidad del Día):**
    *   **Pregunta que responde:** *¿Cuántas personas habrá **hoy** físicamente en la sala?*
    *   **Lógica:** Este contador es más dinámico. Su cálculo es:
        `(Inscritos Fijos) - (Alumnos Fijos de Vacaciones Hoy) + (Alumnos de Recupero Hoy) = Ocupación Real del Día`

---

### Escenarios Prácticos

Imaginemos una clase con **Capacidad 10** y **8 alumnos fijos**.

#### Caso 1: Alumno de Recupero

*   **Situación:** La clase tiene 8/10 inscriptos. Un alumno de otra clase quiere usar un crédito para recuperar en este horario.
*   **Acción:** Usas la opción "Recupero" en la tarjeta de la clase para anotarlo *solo para hoy*.
*   **Resultado:**
    *   En `Horarios`, la clase sigue mostrando **8/10** (la estructura no cambió).
    *   En `Inicio`, la clase de hoy muestra **9/10** (los 8 fijos + 1 recupero).

#### Caso 2: Alumno de Vacaciones

*   **Situación:** Uno de los 8 alumnos fijos, "Ana", está de vacaciones esta semana.
*   **Acción:** Has cargado sus vacaciones previamente en su perfil.
*   **Resultado:**
    *   En `Horarios`, la clase sigue mostrando **8/10** (la plaza de Ana sigue siendo suya).
    *   En `Inicio`, la clase de hoy muestra **7/10**, porque el sistema sabe que Ana no vendrá y su cupo está temporalmente libre.

#### Caso 3: Vacaciones + Recupero (La Prueba de Fuego)

*   **Situación:** Ana está de vacaciones (la clase en Inicio muestra 7/10). "Inés" quiere recuperar y ocupar ese lugar.
*   **Acción:** Anotas a Inés para un recupero en la clase de hoy.
*   **Resultado:**
    *   En `Horarios`, la clase se mantiene en **8/10**.
    *   En `Inicio`, la clase de hoy muestra **8/10**. La lógica hizo: `(8 fijos) - (1 de vacaciones) + (1 de recupero) = 8`. El cupo temporal de Ana fue perfectamente cubierto por Inés.

---

### Claves del Sistema

*   **Protección contra Sobreventa:** El sistema no te permitirá realizar una **Inscripción Fija** que supere la capacidad de la sala.
*   **Gestión Inteligente de Cupos:** El sistema diferencia entre un cupo *permanentemente* libre y uno *temporalmente* libre (por vacaciones), permitiendo solo inscripciones puntuales en estos últimos.
*   **Los Recuperos no son Fijos:** Un alumno que recupera solo afecta la asistencia del día y no ocupa una plaza a largo plazo.