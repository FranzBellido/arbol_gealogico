# GeneaTree - Aplicación de Árbol Genealógico Interactivo

Este proyecto consiste en una aplicación web interactiva para construir, visualizar y gestionar árboles genealógicos con soporte para relaciones complejas, matrimonios (uniones), detalles biográficos y permisos de visualización.

El proyecto está dividido en dos partes principales:
1. **Backend (NestJS):** API REST construida con TypeScript, Prisma ORM y PostgreSQL.
2. **Frontend (Nuxt 4):** Interfaz SPA moderna construida con Nuxt UI (TailwindCSS) y renderizado interactivo mediante `@vue-flow/core`.

---

## 🛠️ Requisitos Previos

- **Node.js** v18+ o v20+ instalado.
- **PostgreSQL** instalado y en ejecución.

---

## 🚀 Guía de Inicio Rápido

### 1. Configuración del Backend

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en el directorio `backend/` con las siguientes variables:
   ```env
   DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/geneatree?schema=public"
   JWT_SECRET="mi_clave_secreta_super_segura_12345"
   PORT=3001
   ```
   *(Asegúrate de reemplazar `USUARIO` y `CONTRASEÑA` con tus credenciales de PostgreSQL)*

4. Genera el cliente de Prisma y aplica las migraciones para crear la base de datos:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Inicia el servidor de desarrollo del backend:
   ```bash
   npm run start:dev
   ```
   El backend se ejecutará en: `http://localhost:3001`

---

### 2. Configuración del Frontend

1. Abre una nueva terminal y navega al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo del frontend:
   ```bash
   npm run dev
   ```
   La aplicación Nuxt 4 se ejecutará en: `http://localhost:3000`

---

## 🔑 Autenticación en Desarrollo (Dev Mode)

Para facilitar las pruebas rápidas sin necesidad de configurar OAuth de Google o Facebook inmediatamente:
1. Ingresa a `http://localhost:3000/login`.
2. Introduce un correo electrónico y nombre cualquiera.
3. El sistema te registrará automáticamente y te dará un token JWT válido de sesión.

---

## 🗺️ Funcionalidades Implementadas

- **Visualización en Red Canvas:** Movimiento libre, zoom, controles de cuadrícula y acomodación de nodos.
- **Relaciones de Unión (Matrimonios):** Permite conectar parejas directamente mediante nodos "Unión" y asociar hijos a dicha unión.
- **Líneas de Relación Inteligentes:**
  - Líneas sólidas rosas para enlaces de pareja.
  - Líneas sólidas verdes para conectar padres con sus hijos.
  - Líneas punteadas si no se ha declarado explícitamente una unión pero se conocen los padres.
- **Permisos del Árbol (Tree Sharing):** Puedes compartir tu árbol con otros usuarios registrados indicando su correo y asignándoles rol de `Lectura` (READ), `Escritura` (WRITE) o `Administrador` (ADMIN).
