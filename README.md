# Aplicación Web con Docker

Proyecto web desarrollado con un frontend en React, un backend en Node.js y una base de datos PostgreSQL.  
La aplicación se ejecuta mediante Docker y Docker Compose.

## Tecnologías utilizadas

- **React** — Frontend de la aplicación.
- **Vite** — Entorno de desarrollo para React.
- **Node.js** — Ejecución del backend.
- **Express** — API REST del backend.
- **PostgreSQL** — Base de datos.
- **Nginx** — Servidor web para producción.
- **Docker** — Contenedores de la aplicación.
- **Docker Compose** — Administración de los servicios.
- **Nodemon** — Reinicio automático del backend durante desarrollo.
- **Axios** — Comunicación entre frontend y backend.

## Arquitectura

```text
Frontend
React + Vite / Nginx
        |
        v
Backend
Node.js + Express
        |
        v
Base de datos
PostgreSQL
```

Los servicios se ejecutan en contenedores independientes mediante Docker Compose.

## Modo desarrollo

Levantar la aplicación:

```bash
docker compose --profile dev up -d
```

Abrir:

```text
http://localhost:5173
```

En este modo, React utiliza Vite con actualización automática y el backend utiliza Nodemon.

Para detenerla:

```bash
docker compose --profile dev down
```

## Modo producción

Levantar la aplicación:

```bash
docker compose --profile prod up -d --build
```

Abrir:

```text
http://localhost:8080
```

En producción, Nginx sirve el frontend compilado y funciona como proxy hacia el backend.

Para detenerla:

```bash
docker compose --profile prod down
```

## Base de datos

La aplicación utiliza PostgreSQL dentro de Docker.

Base de datos utilizada:

```text
mercado
```

Tablas principales:

- `productos`
- `carrito`

Los datos se almacenan en un volumen de Docker para conservarse aunque los contenedores se eliminen.

## Variables de entorno

Las credenciales de la base de datos se encuentran en un archivo `.env`.

Ejemplo:

```env
POSTGRES_USER=appuser
POSTGRES_PASSWORD=tu_contraseña
POSTGRES_DB=mercado

DB_USER=appuser
DB_PASSWORD=tu_contraseña
DB_HOST=db
DB_PORT=5432
DB_NAME=mercado
```

El archivo `.env` no se incluye en GitHub porque está agregado al `.gitignore`.

## Funcionalidades

- Mostrar productos.
- Crear productos.
- Editar productos.
- Eliminar productos.
- Agregar productos al carrito.
- Modificar cantidades.
- Eliminar productos del carrito.
- Vaciar el carrito.

## Autor

Nolan Fernández
