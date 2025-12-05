import { useState, useEffect } from 'react'
import './App.css'
import axios from "axios";

function App() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscarId, setBuscarId] = useState("");
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [productoActual, setProductoActual] = useState({
    PRODUCTO_ID: null,
    NOMBRE: '',
    DESCRIPCION: '',
    PRECIO: '',
    STOCK: ''
  });

  // ===== ESTADOS DEL CARRITO =====
  const [carrito, setCarrito] = useState([]);
  const [showCarrito, setShowCarrito] = useState(false);
  const [totalCarrito, setTotalCarrito] = useState(0);

  const API_URL = 'http://localhost:4000/productos';
  const CARRITO_URL = 'http://localhost:4000/carrito';

  useEffect(() => {
    fetchProductos();
    fetchCarrito();
  }, []);

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

  // ===== FUNCIONES DEL CARRITO =====
  const fetchCarrito = async () => {
    try {
      const response = await axios.get(CARRITO_URL);
      if (response.data.success) {
        setCarrito(response.data.data);
        setTotalCarrito(response.data.total);
      }
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    }
  };

  const agregarAlCarrito = async (productoId, cantidad = 1) => {
    try {
      const response = await axios.post(CARRITO_URL, {
        producto_id: productoId,
        cantidad: cantidad
      });

      if (response.data.success) {
        alert(response.data.message);
        fetchCarrito();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Error al agregar al carrito');
    }
  };

  const actualizarCantidadCarrito = async (carritoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;

    try {
      const response = await axios.put(`${CARRITO_URL}/${carritoId}`, {
        cantidad: nuevaCantidad
      });

      if (response.data.success) {
        fetchCarrito();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      alert('Error al actualizar cantidad');
    }
  };

  const eliminarDelCarrito = async (carritoId) => {
    try {
      const response = await axios.delete(`${CARRITO_URL}/${carritoId}`);
      if (response.data.success) {
        alert(response.data.message);
        fetchCarrito();
      }
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      alert('Error al eliminar del carrito');
    }
  };

  const vaciarCarrito = async () => {
    if (!window.confirm('¿Estás seguro de vaciar el carrito?')) return;

    try {
      const response = await axios.delete(CARRITO_URL);
      if (response.data.success) {
        alert(response.data.message);
        fetchCarrito();
      }
    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      alert('Error al vaciar carrito');
    }
  };

  const buscarProducto = async () => {
    if (!buscarId) return alert("Ingresa un ID");

    setLoading(true);
    setResultadoBusqueda(null);

    try {
      const response = await axios.get(`${API_URL}/${buscarId}`);

      if (response.data.success && response.data.data) {
        setResultadoBusqueda(response.data.data);
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

  const abrirModalEditar = (producto) => {
    setModalMode('editar');
    setProductoActual(producto);
    setShowModal(true);
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductoActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const contarItemsCarrito = () => {
    return carrito.reduce((total, item) => total + item.CANTIDAD, 0);
  };

  return (
    <div className="container">
      <h1>🛒 Mercado de Productos</h1>

      <div className="header-actions">
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

        {/* Botón del carrito */}
        <button
          className="btn btn-cart"
          onClick={() => setShowCarrito(!showCarrito)}
        >
          🛒 Carrito ({contarItemsCarrito()})
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

          <div className="producto-actions">
            <button
              className="btn btn-add-cart"
              onClick={() => agregarAlCarrito(resultadoBusqueda.PRODUCTO_ID)}
            >
              Agregar al Carrito
            </button>
            <button
              className="btn btn-edit"
              onClick={() => abrirModalEditar(resultadoBusqueda)}
            >
              Editar
            </button>
          </div>
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
                className="btn btn-add-cart"
                onClick={() => agregarAlCarrito(producto.PRODUCTO_ID)}
                disabled={loading || producto.STOCK === 0}
              >
                🛒 Agregar
              </button>
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

      {/* Modal de Producto */}
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

      {/* Modal del Carrito */}
      {showCarrito && (
        <div className="modal-overlay" onClick={() => setShowCarrito(false)}>
          <div className="modal modal-carrito" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🛒 Mi Carrito ({contarItemsCarrito()} items)</h2>
              <button className="modal-close" onClick={() => setShowCarrito(false)}>✕</button>
            </div>

            <div className="carrito-content">
              {carrito.length === 0 ? (
                <div className="carrito-vacio">
                  <p>Tu carrito está vacío</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowCarrito(false)}
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <>
                  <div className="carrito-items">
                    {carrito.map(item => (
                      <div key={item.CARRITO_ID} className="carrito-item">
                        <div className="item-info">
                          <h4>{item.NOMBRE}</h4>
                          <p className="item-descripcion">{item.DESCRIPCION}</p>
                          <p className="item-precio">
                            ${parseFloat(item.PRECIO).toFixed(2)} c/u
                          </p>
                        </div>

                        <div className="item-cantidad">
                          <button 
                            className="btn-cantidad"
                            onClick={() => actualizarCantidadCarrito(item.CARRITO_ID, item.CANTIDAD - 1)}
                            disabled={item.CANTIDAD <= 1}
                          >
                            -
                          </button>
                          <span className="cantidad-valor">{item.CANTIDAD}</span>
                          <button 
                            className="btn-cantidad"
                            onClick={() => actualizarCantidadCarrito(item.CARRITO_ID, item.CANTIDAD + 1)}
                            disabled={item.CANTIDAD >= item.STOCK}
                          >
                            +
                          </button>
                        </div>

                        <div className="item-subtotal">
                          <p className="subtotal-label">Subtotal:</p>
                          <p className="subtotal-valor">
                            ${parseFloat(item.SUBTOTAL).toFixed(2)}
                          </p>
                        </div>

                        <button 
                          className="btn-eliminar"
                          onClick={() => eliminarDelCarrito(item.CARRITO_ID)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="carrito-footer">
                    <div className="carrito-total">
                      <h3>Total:</h3>
                      <h2 className="total-valor">${parseFloat(totalCarrito).toFixed(2)}</h2>
                    </div>

                    <div className="carrito-acciones">
                      <button 
                        className="btn btn-secondary"
                        onClick={vaciarCarrito}
                      >
                        Vaciar Carrito
                      </button>
                      <button 
                        className="btn btn-primary btn-finalizar"
                        onClick={() => alert('Función de compra no implementada aún')}
                      >
                        Finalizar Compra
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App