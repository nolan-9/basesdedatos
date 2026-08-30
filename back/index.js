const express = require('express');
const app = express();
const PORT = 4000;
const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173",
            "http://localhost:8080",
    ],
};
const { Pool } = require('pg');


app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hola desde el backendo' });
});

app.listen(PORT, () => {
  console.log("BACKEND actualizandose automaticamente");
});

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

app.get('/test-db', async (req, res) => {
    let connection;
    try {
        const result = await pool.query(
            `SELECT 
                'Conexión exitosa!' AS mensaje,
                current_user AS usuario_conectado,
                current_database() AS nombre_bd,
                NOW() AS fecha_servidor
        `);
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error al conectar con la BD:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


app.get('/productos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                producto_id AS "PRODUCTO_ID",
                nombre AS "NOMBRE",
                descripcion AS "DESCRIPCION",
                precio AS "PRECIO",
                stock AS "STOCK",
                fecha_creacion AS "FECHA_CREACION",
                fecha_actualizacion AS "FECHA_ACTUALIZACION"
            FROM productos
            WHERE activo = true
            ORDER BY producto_id DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error('Error al consultar productos:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Obtenemos un producto por ID
app.get('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                producto_id AS "PRODUCTO_ID",
                nombre AS "NOMBRE",
                descripcion AS "DESCRIPCION",
                precio AS "PRECIO",
                stock AS "STOCK"
            FROM productos
            WHERE producto_id = $1
              AND activo = true
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Error al obtener producto:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Creamos nuevos producto usando procedimiento almacenado 
app.post('/productos', async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock } = req.body;

        if (!nombre || !precio) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y precio son obligatorios'
            });
        }

        const result = await pool.query(
            `
            INSERT INTO productos
            (nombre, descripcion, precio, stock)
            VALUES ($1, $2, $3, $4)
            RETURNING producto_id
            `,
            [
                nombre,
                descripcion || '',
                parseFloat(precio),
                parseInt(stock) || 0
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Producto creado correctamente',
            productoId: result.rows[0].producto_id
        });

    } catch (err) {
        console.error('Error al crear producto:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Actualizamos producto usando procedimiento almacenado UPDATE
app.put('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock } = req.body;

        const result = await pool.query(
            `
            UPDATE productos
            SET
                nombre = $1,
                descripcion = $2,
                precio = $3,
                stock = $4,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE producto_id = $5
              AND activo = true
            RETURNING producto_id
            `,
            [
                nombre,
                descripcion || '',
                parseFloat(precio),
                parseInt(stock) || 0,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Producto actualizado correctamente'
        });

    } catch (err) {
        console.error('Error al actualizar producto:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Eliminamos el producto usando procedimiento almacenado DELETE
app.delete('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            UPDATE productos
            SET
                activo = false,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE producto_id = $1
              AND activo = true
            RETURNING producto_id
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Producto eliminado correctamente'
        });

    } catch (err) {
        console.error('Error al eliminar producto:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.get('/carrito', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.carrito_id AS "CARRITO_ID",
                c.producto_id AS "PRODUCTO_ID",
                c.cantidad AS "CANTIDAD",
                p.nombre AS "NOMBRE",
                p.descripcion AS "DESCRIPCION",
                p.precio AS "PRECIO",
                p.stock AS "STOCK",
                (p.precio * c.cantidad) AS "SUBTOTAL"
            FROM carrito c
            INNER JOIN productos p
                ON c.producto_id = p.producto_id
            WHERE c.usuario_id = 1
            ORDER BY c.fecha_agregado DESC
        `);

        const totalResult = await pool.query(`
            SELECT COALESCE(
                SUM(p.precio * c.cantidad),
                0
            ) AS total
            FROM carrito c
            INNER JOIN productos p
                ON c.producto_id = p.producto_id
            WHERE c.usuario_id = 1
        `);

        res.json({
            success: true,
            data: result.rows,
            total: totalResult.rows[0].total
        });

    } catch (err) {
        console.error('Error al obtener carrito:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Agregar producto al carrito
app.post('/carrito', async (req, res) => {
    try {
        const { producto_id, cantidad } = req.body;

        const cantidadNumerica = parseInt(cantidad);

        if (!producto_id || !cantidadNumerica || cantidadNumerica < 1) {
            return res.status(400).json({
                success: false,
                message: 'Producto ID y cantidad son obligatorios'
            });
        }

        // Comprobar que el producto existe y obtener su stock
        const productoResult = await pool.query(
            `
            SELECT stock
            FROM productos
            WHERE producto_id = $1
              AND activo = true
            `,
            [producto_id]
        );

        if (productoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const stock = productoResult.rows[0].stock;

        // Comprobar si ese producto ya está en el carrito
        const carritoResult = await pool.query(
            `
            SELECT carrito_id, cantidad
            FROM carrito
            WHERE usuario_id = 1
              AND producto_id = $1
            `,
            [producto_id]
        );

        if (carritoResult.rows.length > 0) {

            const cantidadActual = carritoResult.rows[0].cantidad;
            const nuevaCantidad = cantidadActual + cantidadNumerica;

            if (nuevaCantidad > stock) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay suficiente stock disponible'
                });
            }

            await pool.query(
                `
                UPDATE carrito
                SET cantidad = $1
                WHERE carrito_id = $2
                `,
                [
                    nuevaCantidad,
                    carritoResult.rows[0].carrito_id
                ]
            );

        } else {

            if (cantidadNumerica > stock) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay suficiente stock disponible'
                });
            }

            await pool.query(
                `
                INSERT INTO carrito
                    (producto_id, usuario_id, cantidad)
                VALUES
                    ($1, 1, $2)
                `,
                [producto_id, cantidadNumerica]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito'
        });

    } catch (err) {
        console.error('Error al agregar al carrito:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Actualizar cantidad en el carrito
app.put('/carrito/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        const cantidadNumerica = parseInt(cantidad);

        if (!cantidadNumerica || cantidadNumerica < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor a 0'
            });
        }

        // Obtener producto y stock asociado al elemento del carrito
        const itemResult = await pool.query(
            `
            SELECT
                c.carrito_id,
                c.producto_id,
                p.stock
            FROM carrito c
            INNER JOIN productos p
                ON c.producto_id = p.producto_id
            WHERE c.carrito_id = $1
              AND c.usuario_id = 1
            `,
            [id]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado en el carrito'
            });
        }

        const stockDisponible = itemResult.rows[0].stock;

        if (cantidadNumerica > stockDisponible) {
            return res.status(400).json({
                success: false,
                message: 'No hay suficiente stock disponible'
            });
        }

        await pool.query(
            `
            UPDATE carrito
            SET cantidad = $1
            WHERE carrito_id = $2
              AND usuario_id = 1
            `,
            [cantidadNumerica, id]
        );

        res.json({
            success: true,
            message: 'Cantidad actualizada correctamente'
        });

    } catch (err) {
        console.error('Error al actualizar carrito:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Eliminar item del carrito
app.delete('/carrito/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM carrito
            WHERE carrito_id = $1
              AND usuario_id = 1
            RETURNING carrito_id
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado en el carrito'
            });
        }

        res.json({
            success: true,
            message: 'Producto eliminado del carrito'
        });

    } catch (err) {
        console.error('Error al eliminar del carrito:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Vaciar carrito
// Vaciar carrito
app.delete('/carrito', async (req, res) => {
    try {
        const result = await pool.query(
            `
            DELETE FROM carrito
            WHERE usuario_id = 1
            RETURNING carrito_id
            `
        );

        res.json({
            success: true,
            message: 'Carrito vaciado correctamente',
            eliminados: result.rowCount
        });

    } catch (err) {
        console.error('Error al vaciar carrito:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});
