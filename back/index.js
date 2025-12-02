const express = require('express');
const app = express();
const PORT = 4000;
const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173"],
};
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;


app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hola desde el backend!' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


const dbConfig = {
    user: "hr",
    password: "123",
    connectString: "localhost/xepdb1",
};

app.get('/test-db', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `SELECT 
                'Conexión exitosa!' as mensaje,
                USER as usuario_conectado,
                SYS_CONTEXT('USERENV', 'DB_NAME') as nombre_bd,
                SYS_CONTEXT('USERENV', 'HOST') as host,
                TO_CHAR(SYSDATE, 'DD-MON-YYYY HH24:MI:SS') as fecha_servidor
             FROM DUAL`
        );
        
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
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.get('/productos', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `SELECT 
                PRODUCTO_ID,
                NOMBRE,
                DESCRIPCION,
                PRECIO,
                STOCK,
                TO_CHAR(FECHA_CREACION, 'DD-MON-YYYY') as FECHA_CREACION,
                TO_CHAR(FECHA_ACTUALIZACION, 'DD-MON-YYYY') as FECHA_ACTUALIZACION
             FROM PRODUCTOS
             WHERE ACTIVO = 1
             ORDER BY PRODUCTO_ID DESC`
        );
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar conexión:', err);
            }
        }
    }
});

// Obtenemos un producto por ID
app.get('/productos/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `SELECT * FROM PRODUCTOS WHERE PRODUCTO_ID = :id AND ACTIVO = 1`,
            { id: parseInt(id) }
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
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar conexión:', err);
            }
        }
    }
});

// Creamos nuevos producto usando procedimiento almacenado 
app.post('/productos', async (req, res) => {
    let connection;
    try {
        const { nombre, descripcion, precio, stock } = req.body;
        
        // Validaciones básicas
        if (!nombre || !precio) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y precio son obligatorios'
            });
        }
        
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `BEGIN 
                PKG_PRODUCTOS.CREAR_PRODUCTO(
                    :nombre, 
                    :descripcion, 
                    :precio, 
                    :stock,
                    :producto_id,
                    :resultado, 
                    :mensaje
                ); 
             END;`,
            {
                nombre,
                descripcion: descripcion || '',
                precio: parseFloat(precio),
                stock: parseInt(stock) || 0,
                producto_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                mensaje: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            }
        );
        
        if (result.outBinds.resultado === 1) {
            res.status(201).json({
                success: true,
                message: result.outBinds.mensaje,
                productoId: result.outBinds.producto_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.outBinds.mensaje
            });
        }
    } catch (err) {
        console.error('Error al crear producto:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar conexión:', err);
            }
        }
    }
});

// Actualizamos producto usando procedimiento almacenado UPDATE
app.put('/productos/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock } = req.body;
        
        // Validaciones básicas
        if (!nombre || !precio) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y precio son obligatorios'
            });
        }
        
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `BEGIN 
                PKG_PRODUCTOS.ACTUALIZAR_PRODUCTO(
                    :producto_id, 
                    :nombre, 
                    :descripcion, 
                    :precio, 
                    :stock, 
                    :resultado, 
                    :mensaje
                ); 
             END;`,
            {
                producto_id: parseInt(id),
                nombre,
                descripcion: descripcion || '',
                precio: parseFloat(precio),
                stock: parseInt(stock) || 0,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                mensaje: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            }
        );
        
        if (result.outBinds.resultado === 1) {
            res.json({
                success: true,
                message: result.outBinds.mensaje
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.outBinds.mensaje
            });
        }
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar conexión:', err);
            }
        }
    }
});

// Eliminamos el producto usando procedimiento almacenado DELETE
app.delete('/productos/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `BEGIN 
                PKG_PRODUCTOS.ELIMINAR_PRODUCTO(
                    :producto_id, 
                    :resultado, 
                    :mensaje
                ); 
             END;`,
            {
                producto_id: parseInt(id),
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                mensaje: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            }
        );
        
        if (result.outBinds.resultado === 1) {
            res.json({
                success: true,
                message: result.outBinds.mensaje
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.outBinds.mensaje
            });
        }
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar conexión:', err);
            }
        }
    }
});
