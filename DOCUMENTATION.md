
# Documentación Integral de Agendia

Este documento describe la arquitectura completa, el flujo de datos, la lógica de negocio y el sistema de diseño de la aplicación Agendia. Está diseñado para que cualquier desarrollador pueda entender, mantener y replicar la aplicación.

## 1. Propósito de la Aplicación

Agendia es una aplicación web de gestión integral (Software as a Service - SaaS) para centros de bienestar, como estudios de yoga o gimnasios. Permite administrar clases, horarios, alumnos, especialistas, pagos, asistencias y más.

## 2. Stack Tecnológico

- **Framework**: Next.js 14 (con App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: Google Firestore (NoSQL)
- **Autenticación**: Firebase Authentication
- **Despliegue**: Firebase App Hosting
- **UI Components**: ShadCN UI
- **Estilos**: Tailwind CSS
- **Iconos**: `lucide-react`
- **Inteligencia Artificial (Deshabilitado)**: Genkit

## 3. Arquitectura y Estructura de Datos

### 3.1. Modelo de Datos y Relaciones

La base de datos en Firestore está estructurada bajo una colección principal `institutes`. Cada documento en esta colección representa un estudio o centro de bienestar, y dentro de cada instituto, se anidan las colecciones de datos correspondientes.

**Ruta base:** `/institutes/{instituteId}/{collectionName}/{documentId}`

A continuación se detallan las colecciones y sus relaciones:

---

#### **`users` (Colección a nivel raíz)**
- **Propósito**: Gestiona los usuarios que pueden acceder a la aplicación. No contiene datos del negocio, solo de autenticación y permisos.
- **Campos**:
  - `email`: (string) El correo del usuario.
  - `status`: (string) 'pending' (recién registrado, necesita aprobación) o 'active' (aprobado).
  - `instituteId`: (string | null) El ID del instituto al que pertenece el usuario. Si es `null`, no puede acceder a los datos de ningún centro.

---

#### **`people` (Alumnos/Clientes)**
- **Propósito**: Almacena la información de cada alumno.
- **Ruta**: `/institutes/{instituteId}/people/{personId}`
- **Campos**:
  - `name`, `phone`, `avatar`: (string) Datos básicos.
  - `joinDate`: (Timestamp) Fecha de alta.
  - `lastPaymentDate`: (Timestamp) Fecha del último pago registrado. Usada para calcular el próximo vencimiento.
  - `membershipType`: (string) 'Mensual' o 'Diario'.
  - `status`: (string) 'active' o 'inactive'.
  - `levelId`: (string, opcional) ID del nivel de práctica del alumno.
  - `healthInfo`, `notes`: (string, opcional) Información adicional.
  - `vacationPeriods`: (array, opcional) Arreglo de objetos `{ id, startDate, endDate }` para gestionar ausencias largas.

---

#### **`specialists` (Especialistas/Instructores)**
- **Propósito**: Gestiona a los instructores.
- **Ruta**: `/institutes/{instituteId}/specialists/{specialistId}`
- **Campos**:
  - `name`, `phone`, `avatar`: (string) Datos básicos.
  - `actividadIds`: (array de strings) **Relación M-a-M con `actividades`**. Contiene los IDs de las actividades que este especialista puede impartir.

---

#### **`actividades` (Actividades/Tipos de Clase)**
- **Propósito**: Define los tipos de clases o servicios que ofrece el estudio.
- **Ruta**: `/institutes/{instituteId}/actividades/{actividadId}`
- **Campos**: `name`: (string).

---

#### **`spaces` (Espacios/Salas)**
- **Propósito**: Define las salas físicas donde se imparten las clases.
- **Ruta**: `/institutes/{instituteId}/spaces/{spaceId}`
- **Campos**:
  - `name`: (string).
  - `capacity`: (number) Capacidad máxima de la sala.
  - `operatingHoursStart`/`End`: (string, opcional) 'HH:mm'.

---

#### **`sessions` (Sesiones/Clases en el Horario)**
- **Propósito**: El corazón de la aplicación. Representa una clase recurrente en un día y hora específicos.
- **Ruta**: `/institutes/{instituteId}/sessions/{sessionId}`
- **Campos**:
  - `dayOfWeek`: (string) 'Lunes', 'Martes', etc.
  - `time`: (string) 'HH:mm'.
  - `instructorId`: (string) **Relación N-a-1 con `specialists`**.
  - `actividadId`: (string) **Relación N-a-1 con `actividades`**.
  - `spaceId`: (string) **Relación N-a-1 con `spaces`**.
  - `levelId`: (string, opcional) **Relación N-a-1 con `levels`**.
  - `personIds`: (array de strings) **Relación M-a-M con `people`**. IDs de los alumnos inscritos de forma fija.
  - `waitlistPersonIds`: (array de strings, opcional) Alumnos en lista de espera.

---

#### **`attendance` (Asistencias)**
- **Propósito**: Registra la asistencia para una sesión en una fecha concreta. Se crea un documento por cada día que se pasa lista para una clase.
- **Ruta**: `/institutes/{instituteId}/attendance/{attendanceId}`
- **Campos**:
  - `sessionId`: (string) **Relación con `sessions`**.
  - `date`: (string) 'YYYY-MM-DD'.
  - `presentIds`, `absentIds`, `justifiedAbsenceIds`: (array de strings) **Relación con `people`**.
  - `oneTimeAttendees`: (array de strings, opcional) Alumnos que asisten solo ese día (ej. para recuperar una clase).

---

#### **`payments` (Pagos)**
- **Propósito**: Un registro histórico de cada pago realizado.
- **Ruta**: `/institutes/{instituteId}/payments/{paymentId}`
- **Campos**:
  - `personId`: (string) **Relación con `people`**.
  - `date`: (Timestamp) Fecha del pago.
  - `months`: (number) Cantidad de meses pagados.

---

#### **`tariffs` (Aranceles/Planes)**
- **Propósito**: Define los planes de precios.
- **Ruta**: `/institutes/{instituteId}/tariffs/{tariffId}`
- **Campos**:
  - `name`, `description`: (string).
  - `price`: (number).
  - `frequency`: (number, opcional) Frecuencia semanal (ej. 2 para "2 veces por semana").
  - `isIndividual`: (boolean, opcional) Si es para clases individuales/diarias.

---

#### **`levels` (Niveles de Práctica)**
- **Propósito**: Define los niveles de dificultad (Principiante, Avanzado, etc.).
- **Ruta**: `/institutes/{instituteId}/levels/{levelId}`
- **Campos**: `name`: (string).

## 4. Lógica de la Aplicación

### 4.1. `StudioContext.tsx` - El Cerebro de la App

Este contexto de React es el punto central para toda la lógica de negocio y la interacción con Firestore.
- **Fetching de Datos**: Utiliza `onSnapshot` de Firestore para escuchar cambios en tiempo real en todas las colecciones del instituto y actualizar el estado de la aplicación.
- **Operaciones CRUD**: Contiene todas las funciones para `Añadir`, `Actualizar` y `Eliminar` documentos en cada colección (ej: `addPerson`, `updateSession`, `deleteSpecialist`).
- **Lógica de Negocio Compleja**:
  - `enrollPersonInSessions`: Gestiona la inscripción de un alumno en múltiples clases, actualizando todos los documentos de sesión necesarios en una sola operación (batch).
  - `recordPayment`: Crea un nuevo documento de pago y actualiza el campo `lastPaymentDate` en el documento de la persona.
  - `saveAttendance`: Crea o actualiza el registro de asistencia para una clase en el día actual.
  - `deactivatePerson`: Cambia el estado de una persona a 'inactive' y la desinscribe de todas sus clases.

### 4.2. `AuthContext.tsx` - Gestión de Autenticación

Este contexto gestiona el ciclo de vida del usuario.
- **Login/Signup**: Envuelve las funciones de Firebase `signInWithEmailAndPassword` y `createUserWithEmailAndPassword`, añadiendo manejo de errores y notificaciones (toasts).
- **Creación de Perfil de Usuario**: Al registrar un nuevo usuario, crea un documento asociado en la colección `users` con `status: 'pending'` y `instituteId: null`.
- **Protección de Rutas**: El componente `AppShell.tsx` utiliza este contexto para redirigir a los usuarios:
  - Si no está logueado -> a `/login`.
  - Si está logueado pero su perfil es `pending` o no tiene `instituteId` -> a pantallas de espera/error.
  - Si está logueado y activo -> a `/dashboard`.

### 4.3. `lib/utils.ts` - Lógica de Cálculo

- **`getStudentPaymentStatus`**: Determina si un alumno está 'Al día' o 'Atrasado'.
- **`getNextPaymentDate`**: Calcula la fecha del próximo vencimiento basándose en la `lastPaymentDate` y el `joinDate` del alumno, y teniendo en cuenta los períodos de vacaciones.

## 5. UI y Sistema de Diseño

### 5.1. Paleta de Colores (`globals.css`)

El diseño se basa en un sistema de variables CSS con HSL, lo que permite un theming fácil para modo claro y oscuro.

- **`--primary`**: `hsl(269 35% 62%)` - Un púrpura apagado, usado para elementos principales, botones y acentos.
- **`--secondary`**: Usado para elementos de apoyo como badges.
- **`--accent`**: `hsl(275 29% 85%)` - Un lavanda suave, usado para fondos sutiles o estados "hover".
- **`--background`**:
  - **Claro**: `hsl(260 20% 96.1%)` - Un gris muy claro con un toque violáceo.
  - **Oscuro**: `hsl(260 10% 10%)` - Un gris oscuro profundo.
- **`--destructive`**: Rojo estándar para acciones de eliminación o peligro.

### 5.2. Estética General

- **Componentes**: Se utilizan los componentes pre-construidos de `ShadCN UI` (`Card`, `Button`, `Dialog`, `Select`, etc.).
- **Estilos**:
  - **Bordes redondeados**: Se usa un radio grande (`--radius: 1rem`), visible en tarjetas y diálogos, para una apariencia suave y moderna.
  - **Sombras**: Las tarjetas tienen `shadow-lg` para darles profundidad y hacerlas "flotar" sobre el fondo.
  - **Fondos con Gradiente**: El `body` de la página tiene un gradiente sutil (`from-blue-100 via-purple-200 to-violet-200`) para un look más dinámico y agradable.
  - **Efecto "Glassmorphism"**: Muchas tarjetas usan `bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl`, lo que les da una apariencia de vidrio esmerilado translúcido, dejando ver el gradiente del fondo.

## 6. Flujos Clave

- **Alta de un Alumno**:
  1. Admin hace clic en "Añadir Persona".
  2. Se abre un diálogo (`Dialog`) para introducir los datos.
  3. `StudioContext.addPerson` crea el documento en Firestore con `status: 'active'`.
  4. La lista de alumnos se actualiza en tiempo real.

- **Programar una Clase**:
  1. Admin va a "Horarios" y hace clic en "Añadir Sesión".
  2. Un diálogo pide `Actividad`, `Especialista`, `Espacio`, `Día` y `Hora`.
  3. El formulario tiene validación en tiempo real para evitar conflictos de horario para un mismo especialista o un mismo espacio.
  4. `StudioContext.addSession` crea el documento de la sesión.

- **Pasar Lista**:
  1. Admin va al "Dashboard" o "Horarios" y busca la clase del día.
  2. Hace clic en "Asistencia". Se abre un `Sheet` (panel lateral).
  3. Muestra la lista de alumnos inscritos para ese día (incluyendo recuperos).
  4. El admin marca 'Presente', 'Ausente' o 'Justificado'.
  5. `StudioContext.saveAttendance` guarda el registro para esa sesión y esa fecha. Si un alumno justifica, se incrementa su saldo de clases a recuperar.

## 7. Despliegue

- La aplicación está configurada para **Firebase App Hosting**.
- El archivo `apphosting.yaml` define los comandos de construcción (`npm run build`) y ejecución (`npm run start`).
- El proceso de despliegue empaqueta la aplicación Next.js en un contenedor optimizado que Firebase gestiona automáticamente.
- **Importante:** Para que el despliegue en Firebase App Hosting funcione, la cuenta de Firebase debe tener la facturación activada.
