'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import TicketModal from '@/components/TicketModal';
import { showToast } from '@/components/CustomNotification';

export default function WorkerPOSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [bcvRate, setBcvRate] = useState(737.88);
  const [bcvData, setBcvData] = useState(null);
  
  // Checkout Workflow States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('CLIENT_LOOKUP'); // 'CLIENT_LOOKUP' | 'PAYMENT_SELECTION'
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [selectedClienteObj, setSelectedClienteObj] = useState(null);
  const [clientFound, setClientFound] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ cedula_rif: '', nombre: '', telefono: '', direccion: '' });
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [checkingCedula, setCheckingCedula] = useState(false);

  const [completedSale, setCompletedSale] = useState(null);
  const [selectedProductView, setSelectedProductView] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchClientes();
    fetchBcv();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categorias');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {}
  };

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      if (Array.isArray(data)) setClientes(data);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  };

  const fetchBcv = async () => {
    try {
      const res = await fetch('/api/bcv');
      const data = await res.json();
      if (data && data.promedio) {
        setBcvRate(data.promedio);
        setBcvData(data);
      }
    } catch (err) {}
  };

  const handleAddToCart = (product) => {
    if (product.stock_actual <= 0) {
      showToast('Producto agotado sin existencia en almacén', 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock_actual) {
          showToast(`Límite alcanzado (${product.stock_actual} unidades en inventario)`, 'warning');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.cantidad + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock_actual) {
            showToast(`Stock máximo disponible: ${item.stock_actual} unidades`, 'warning');
            return item;
          }
          return { ...item, cantidad: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartTotalUsd = cart.reduce((sum, item) => sum + (Number(item.precio_venta || 0) * Number(item.cantidad || 0)), 0);
  const cartTotalBs = cartTotalUsd * bcvRate;

  // Open Checkout Modal
  const handleOpenCheckout = async () => {
    if (cart.length === 0) return;
    await fetchClientes(); // Refresh client list from DB
    setCedulaSearch('');
    setSelectedClienteObj(null);
    setClientFound(false);
    setShowNewClientForm(false);
    setNewClientData({ cedula_rif: '', nombre: '', telefono: '', direccion: '' });
    setPaymentMethod('EFECTIVO');
    setCheckoutStep('CLIENT_LOOKUP');
    setIsCheckoutOpen(true);
  };

  // Flexible Cédula Matching Helper
  const isMatchCedula = (client, term) => {
    if (!term || !term.trim()) return false;
    const cleanT = term.trim().toLowerCase().replace(/[\s-]/g, '');
    const digitsT = term.replace(/\D/g, '');

    const cleanC = (client.cedula_rif || '').toLowerCase().replace(/[\s-]/g, '');
    const digitsC = (client.cedula_rif || '').replace(/\D/g, '');

    if (cleanC === cleanT) return true;
    if (digitsT.length >= 5 && digitsC === digitsT) return true;
    if (cleanC.endsWith(cleanT) || cleanT.endsWith(cleanC)) return true;
    return false;
  };

  // Intelligent Search Cédula Function
  const handleSearchCedula = async (term) => {
    const rawVal = term;
    setCedulaSearch(rawVal);

    if (!rawVal || !rawVal.trim()) {
      setSelectedClienteObj(null);
      setClientFound(false);
      setShowNewClientForm(false);
      return;
    }

    setCheckingCedula(true);

    // 1. Search in local state list
    let currentList = clientes;
    let match = currentList.find(c => isMatchCedula(c, rawVal));

    // 2. If not found locally, fetch fresh from DB
    if (!match) {
      const freshList = await fetchClientes();
      match = freshList.find(c => isMatchCedula(c, rawVal));
    }

    // 3. Query API search as fallback
    if (!match && rawVal.trim().length >= 4) {
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(rawVal.trim())}`);
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          match = results[0];
          setClientes(prev => {
            const existsInState = prev.some(c => c.id === match.id);
            return existsInState ? prev : [...prev, match];
          });
        }
      } catch (err) {}
    }

    setCheckingCedula(false);

    if (match) {
      setSelectedClienteObj(match);
      setClientFound(true);
      setShowNewClientForm(false);
    } else {
      setSelectedClienteObj(null);
      setClientFound(false);
      setShowNewClientForm(true);
      setNewClientData({ cedula_rif: rawVal.trim(), nombre: '', telefono: '', direccion: '' });
    }
  };

  // Register New Client during Checkout
  const handleRegisterNewClient = async (e) => {
    e.preventDefault();
    if (!newClientData.nombre || !newClientData.cedula_rif) {
      showToast('Cédula y Nombre son obligatorios', 'error');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar cliente');

      const savedClient = data.cliente || {
        id: data.id,
        cedula_rif: newClientData.cedula_rif,
        nombre: newClientData.nombre,
        telefono: newClientData.telefono,
        direccion: newClientData.direccion
      };

      if (data.alreadyExisted) {
        showToast(`El cliente ${savedClient.nombre} ya estaba registrado en el sistema`, 'info');
      } else {
        showToast('Cliente registrado exitosamente', 'success');
      }

      setClientes(prev => {
        const exists = prev.some(c => c.id === savedClient.id);
        return exists ? prev : [...prev, savedClient];
      });

      setSelectedClienteObj(savedClient);
      fetchClientes();
      setCheckoutStep('PAYMENT_SELECTION');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Confirm Sale & Generate Ticket
  const handleConfirmSale = async () => {
    if (cart.length === 0) return;
    if (!selectedClienteObj) {
      showToast('Debes verificar o registrar un cliente antes de procesar la venta', 'error');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        metodo_pago: paymentMethod,
        cliente_id: Number(selectedClienteObj.id),
        tasa_bcv: bcvRate,
        items: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario_usd: Number(item.precio_venta || 0)
        }))
      };

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error procesando transacción');

      showToast('Venta emitida exitosamente', 'success');
      setCompletedSale({
        venta_id: data.venta_id || 'REGISTRADO',
        total: cartTotalUsd,
        totalBs: cartTotalBs,
        metodo_pago: paymentMethod,
        bcvRate: bcvRate,
        fecha: new Date().toISOString(),
        cliente: selectedClienteObj
      });
      setIsCheckoutOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseTicket = () => {
    setCompletedSale(null);
    setCart([]);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || 
                          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || String(p.categoria_id) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', height: 'calc(100vh - 120px)', minHeight: '650px' }} className="pos-responsive-layout">
        
        {/* Left Column: Product Catalog Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          
          {/* Header & BCV Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e1b4b' }}>Punto de Venta (POS)</h1>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Selecciona productos para armar la orden de venta.</p>
            </div>

            <div style={{ background: '#f3e8ff', border: '1px solid #ddd6fe', padding: '0.4rem 0.85rem', borderRadius: '20px', color: '#7c3aed', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Tasa BCV ({bcvData?.fechaFormatted || new Date().toLocaleDateString('es-VE')}):</span>
              <span style={{ color: '#1e1b4b', fontWeight: 800 }}>Bs. {Number(bcvRate).toFixed(2)} / $</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código de barras..."
              className="input-field"
              style={{ flex: 1, minWidth: '180px' }}
            />

            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
              style={{ width: 'auto', minWidth: '160px' }}
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Catalog Grid */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  isPos={true}
                  bcvRate={bcvRate}
                  onSelect={(product) => setSelectedProductView(product)}
                  onAddToCart={(product) => handleAddToCart(product)}
                />
              ))}
            </div>

            {products.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No se encontraron productos coincidentes.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Cart Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem', overflow: 'hidden' }}>
          
          {/* Cart Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9d5ff', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e1b4b' }}>
              Orden de Venta ({cart.reduce((a, c) => a + c.cantidad, 0)})
            </h2>
            {cart.length > 0 && (
              <button onClick={handleClearCart} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                Vaciar
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '2px' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ background: '#faf9ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', background: '#f3e8ff', flexShrink: 0 }}>
                  {item.imagen_url ? (
                    <img src={item.imagen_url} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700 }}>PROD</div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e1b4b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                    ${(Number(item.precio_venta || 0) * Number(item.cantidad || 0)).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 700 }}>
                    Bs. {(Number(item.precio_venta || 0) * Number(item.cantidad || 0) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#ffffff', border: '1px solid #e9d5ff', padding: '2px 6px', borderRadius: '6px' }}>
                  <button onClick={() => handleUpdateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', padding: '0 4px' }}>-</button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '16px', textAlign: 'center', color: '#1e1b4b' }}>{item.cantidad}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.85rem', cursor: 'pointer', padding: '0 4px' }}>+</button>
                </div>

                <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer', marginLeft: '2px' }}>
                  ✕
                </button>
              </div>
            ))}

            {cart.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                El carrito de venta está vacío.<br />Selecciona productos del catálogo.
              </div>
            )}
          </div>

          {/* Dual Currency Totals & Action */}
          <div style={{ borderTop: '1px solid #e9d5ff', paddingTop: '1rem', marginTop: '0.75rem' }}>
            
            <div style={{ background: '#faf9ff', borderRadius: '10px', padding: '0.85rem', marginBottom: '0.85rem', border: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Total ($ USD):</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>${cartTotalUsd.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>Total (Bs. BCV):</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>
                  Bs. {cartTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button 
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              Procesar Venta (${cartTotalUsd.toFixed(2)})
            </button>
          </div>

        </div>
      </div>

      {/* Checkout Modal Flow */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '460px', width: '100%', padding: '1.5rem', position: 'relative', background: '#ffffff', border: '1px solid #e9d5ff', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}
              title="Cerrar"
            >
              ✕
            </button>

            {/* STEP 1: CLIENT LOOKUP BY CÉDULA */}
            {checkoutStep === 'CLIENT_LOOKUP' && (
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: '#1e1b4b', fontWeight: 800 }}>Identificación del Comprador</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Ingrese la Cédula o RIF para verificar si el cliente ya está registrado.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Cédula / RIF del Cliente *
                  </label>
                  <input 
                    type="text"
                    value={cedulaSearch}
                    onChange={(e) => handleSearchCedula(e.target.value)}
                    placeholder="Ej. 12345678 o V-12345678"
                    className="input-field"
                    style={{ fontSize: '1rem', fontWeight: 600, padding: '0.85rem 1.1rem', width: '100%' }}
                    autoFocus
                  />
                </div>

                {/* CASE A: Client Found */}
                {clientFound && selectedClienteObj && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <span>✓ CLIENTE REGISTRADO ENCONTRADO</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e1b4b' }}>{selectedClienteObj.nombre}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                      <b>Cédula/RIF:</b> {selectedClienteObj.cedula_rif}
                    </div>
                    {selectedClienteObj.telefono && (
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        <b>Teléfono:</b> {selectedClienteObj.telefono}
                      </div>
                    )}
                    {selectedClienteObj.direccion && (
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        <b>Dirección:</b> {selectedClienteObj.direccion}
                      </div>
                    )}

                    <button 
                      onClick={() => setCheckoutStep('PAYMENT_SELECTION')}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                      Confirmar Cliente y Continuar ➔
                    </button>
                  </div>
                )}

                {/* CASE B: Client Not Found -> Show Quick Form */}
                {showNewClientForm && (
                  <form onSubmit={handleRegisterNewClient} style={{ background: '#faf9ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#fffbe6', border: '1px solid #fef3c7', padding: '0.4rem 0.75rem', borderRadius: '8px', color: '#d97706', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                      ⚠️ Cliente no registrado anteriormente. Complete los datos para guardarlo:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 700, marginBottom: '0.2rem' }}>Cédula / RIF *</label>
                        <input 
                          type="text"
                          required
                          value={newClientData.cedula_rif}
                          onChange={(e) => setNewClientData({ ...newClientData, cedula_rif: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 700, marginBottom: '0.2rem' }}>Nombre y Apellido *</label>
                        <input 
                          type="text"
                          required
                          value={newClientData.nombre}
                          onChange={(e) => setNewClientData({ ...newClientData, nombre: e.target.value })}
                          placeholder="Ej. Pedro Pérez"
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 700, marginBottom: '0.2rem' }}>Número de Teléfono (para WhatsApp)</label>
                        <input 
                          type="text"
                          value={newClientData.telefono}
                          onChange={(e) => setNewClientData({ ...newClientData, telefono: e.target.value })}
                          placeholder="Ej. 0412-1234567"
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 700, marginBottom: '0.2rem' }}>Dirección de Habitación / Entrega</label>
                        <input 
                          type="text"
                          value={newClientData.direccion}
                          onChange={(e) => setNewClientData({ ...newClientData, direccion: e.target.value })}
                          placeholder="Ej. Av. Principal, Casa #12"
                          className="input-field"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={processing}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.92rem', fontWeight: 700 }}
                      >
                        {processing ? 'Guardando...' : 'Registrar Cliente y Continuar ➔'}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}

            {/* STEP 2: PAYMENT METHOD & FINAL CONFIRMATION */}
            {checkoutStep === 'PAYMENT_SELECTION' && (
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: '#1e1b4b', fontWeight: 800 }}>Confirmar Venta y Pago</h2>
                
                {/* Client Badge Summary */}
                {selectedClienteObj && (
                  <div style={{ background: '#f3e8ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '0.65rem 0.85rem', margin: '0.85rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Comprador Asignado:</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e1b4b' }}>{selectedClienteObj.nombre} ({selectedClienteObj.cedula_rif})</div>
                    </div>
                    <button 
                      onClick={() => setCheckoutStep('CLIENT_LOOKUP')}
                      style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* Amount Totals */}
                <div style={{ background: '#faf9ff', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>
                    <span>Monto USD:</span>
                    <span>${cartTotalUsd.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#7c3aed' }}>
                    <span>Monto Bolívares:</span>
                    <span>Bs. {cartTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>
                    Tasa BCV ({bcvData?.fechaFormatted || new Date().toLocaleDateString('es-VE')}): Bs. {Number(bcvRate).toFixed(2)}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Método de Pago *
                  </label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    <option value="EFECTIVO">EFECTIVO ($ USD)</option>
                    <option value="EFECTIVO_BS">EFECTIVO (Bolívares)</option>
                    <option value="PAGO_MOVIL">PAGO MÓVIL (Bs.)</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA BANCARIA (Bs.)</option>
                    <option value="PUNTO_VENTA">PUNTO DE VENTA (Bs.)</option>
                    <option value="CREDITO">A CRÉDITO (Cuenta por Cobrar)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setCheckoutStep('CLIENT_LOOKUP')} className="btn btn-secondary" style={{ flex: 1 }}>
                    ← Volver
                  </button>
                  <button onClick={handleConfirmSale} disabled={processing} className="btn btn-primary" style={{ flex: 1.5, fontWeight: 700 }}>
                    {processing ? 'Procesando...' : 'Emitir Venta y Generar Ticket 🧾'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {completedSale && (
        <TicketModal 
          saleData={completedSale} 
          cart={cart} 
          onClose={handleCloseTicket}
          onCancelSale={handleCloseTicket}
        />
      )}

      {selectedProductView && <ProductModal product={selectedProductView} onClose={() => setSelectedProductView(null)} bcvRate={bcvRate} />}

    </DashboardLayout>
  );
}
