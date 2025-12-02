import { useState, useEffect } from 'react'
import './App.css'
import axios from "axios";

function App() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscarId, setBuscarId] = useState("");
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear'); // 'crear' o 'editar'
  const [productoActual, setProductoActual] = useState({
    PRODUCTO_ID: null,
    NOMBRE: '',
    DESCRIPCION: '',
    PRECIO: '',
    STOCK: ''
  });


  const API_URL = 'http://localhost:4000/productos';

  // Cargar productos al iniciar
  useEffect(() => {
    fetchProductos();
  }, []);

  // Obtener todos los productos
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      if (response.data.success) {
        setProductos(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const buscarProducto = async () => {
    if (!buscarId) return alert("Ingresa un ID");

    setLoading(true);
    setResultadoBusqueda(null);

    try {
      const response = await axios.get(`${API_URL}/${buscarId}`);

      if (response.data.success && response.data.data) {
        setResultadoBusqueda(response.data.data);  // ya no es array
      } else {
        alert("Producto no encontrado");
      }
    } catch (error) {
      console.error("Error al buscar producto:", error);
      alert("Error al buscar producto");
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setModalMode('crear');
    setProductoActual({
      PRODUCTO_ID: null,
      NOMBRE: '',
      DESCRIPCION: '',
      PRECIO: '',
      STOCK: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (producto) => {
    setModalMode('editar');
    setProductoActual(producto);
    setShowModal(true);
  };

  // Cerrar modal
  const cerrarModal = () => {
    setShowModal(false);
    setProductoActual({
      PRODUCTO_ID: null,
      NOMBRE: '',
      DESCRIPCION: '',
      PRECIO: '',
      STOCK: ''
    });
  };

  // Guardar producto (crear o actualizar)
  const guardarProducto = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const datos = {
        nombre: productoActual.NOMBRE,
        descripcion: productoActual.DESCRIPCION,
        precio: parseFloat(productoActual.PRECIO),
        stock: parseInt(productoActual.STOCK) || 0
      };

      let response;
      if (modalMode === 'crear') {
        response = await axios.post(API_URL, datos);
      } else {
        response = await axios.put(`${API_URL}/${productoActual.PRODUCTO_ID}`, datos);
      }

      if (response.data.success) {
        alert(response.data.message);
        cerrarModal();
        fetchProductos();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto
  const eliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      if (response.data.success) {
        alert(response.data.message);
        fetchProductos();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar producto');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductoActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container">
      <h1>Mercado de Productos</h1>

      <div className="header-actions">
        <div className="search-bar">
          <input
            type="number"
            placeholder="Buscar por ID..."
            value={buscarId}
            onChange={(e) => setBuscarId(e.target.value)}
          />
          <button className="btn btn-primary" onClick={buscarProducto} disabled={loading}>
            Buscar
          </button>

          {resultadoBusqueda && (
            <button
              className="btn btn-secondary"
              onClick={() => setResultadoBusqueda(null)}
            >
              Limpiar
            </button>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={abrirModalCrear}
          disabled={loading}
        >
          Nuevo Producto
        </button>
        <button
          className="btn btn-secondary"
          onClick={fetchProductos}
          disabled={loading}
        >
          Actualizar
        </button>
      </div>

      {loading && <div className="loading">Cargando...</div>}

      {resultadoBusqueda && (
        <div className="producto-card highlight">
          <h3>Resultado de búsqueda</h3>

          <h4>{resultadoBusqueda.NOMBRE}</h4>
          <p>{resultadoBusqueda.DESCRIPCION}</p>

          <div className="producto-info">
            <p>Precio: ${Number(resultadoBusqueda.PRECIO).toFixed(2)}</p>
            <p>Stock: {resultadoBusqueda.STOCK}</p>
          </div>

          <button
            className="btn btn-edit"
            onClick={() => abrirModalEditar(resultadoBusqueda)}
          >
            Editar
          </button>
        </div>
      )}


      <div className="productos-grid">
        {productos.map(producto => (
          <div key={producto.PRODUCTO_ID} className="producto-card">
            <div className="producto-header">
              <h3>{producto.NOMBRE}</h3>
              <span className="producto-id">ID: {producto.PRODUCTO_ID}</span>
            </div>

            <p className="producto-descripcion">{producto.DESCRIPCION}</p>

            <div className="producto-info">
              <div className="precio">
                <span className="label">Precio: </span>
                <span className="value">${parseFloat(producto.PRECIO).toFixed(2)}</span>
              </div>
              <div className="stock">
                <span className="label">Cant: </span>
                <span className={`value ${producto.STOCK < 10 ? 'stock-bajo' : ''}`}>
                  {producto.STOCK} unidades
                </span>
              </div>
            </div>

            <div className="producto-footer">
              <small>Actualizado: {new Date(producto.FECHA_ACTUALIZACION).toLocaleDateString()}</small>
            </div>

            <div className="producto-actions">
              <button
                className="btn btn-edit"
                onClick={() => abrirModalEditar(producto)}
                disabled={loading}
              >
                Editar
              </button>
              <button
                className="btn btn-delete"
                onClick={() => eliminarProducto(producto.PRODUCTO_ID, producto.NOMBRE)}
                disabled={loading}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {productos.length === 0 && !loading && (
        <div className="empty-state">
          <p>No hay productos disponibles</p>
          <button className="btn btn-primary" onClick={abrirModalCrear}>
            Crear primer producto
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'crear' ? '➕ Nuevo Producto' : '✏️ Editar Producto'}</h2>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>

            <form onSubmit={guardarProducto}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="NOMBRE"
                  value={productoActual.NOMBRE}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre del producto"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="DESCRIPCION"
                  value={productoActual.DESCRIPCION}
                  onChange={handleInputChange}
                  placeholder="Descripción del producto"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="PRECIO"
                    value={productoActual.PRECIO}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    name="STOCK"
                    value={productoActual.STOCK}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App