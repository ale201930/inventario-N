'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { showToast, showConfirm } from '@/components/CustomNotification';

export default function AdminProductosPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bcvData, setBcvData] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'CARDS'

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showBcvModal, setShowBcvModal] = useState(false);
  const [newBcvInput, setNewBcvInput] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    precio_costo: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '5'
  });

  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [adjustmentModal, setAdjustmentModal] = useState({ open: false, product: null, type: 'ENTRADA' });
  const [adjAmount, setAdjAmount] = useState('');
  const [adjJustification, setAdjJustification] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);
  const [selectedProductView, setSelectedProductView] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBcv();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      showToast('Error al cargar la lista de productos', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categorias');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      showToast('Error al cargar categorías', 'error');
    }
  };

  const fetchBcv = async () => {
    try {
      const res = await fetch('/api/bcv');
      const data = await res.json();
      if (data && data.promedio) {
        setBcvData(data);
        setNewBcvInput(String(data.promedio));
      }
    } catch (err) {}
  };

  const handleUpdateBcv = async (e) => {
    e.preventDefault();
    if (!newBcvInput || isNaN(newBcvInput) || Number(newBcvInput) <= 0) return;
    try {
      const res = await fetch('/api/bcv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasa: Number(newBcvInput) })
      });
      const data = await res.json();
      if (data.promedio) {
        setBcvData(data);
        setShowBcvModal(false);
        showToast(`Tasa BCV actualizada a Bs. ${Number(data.promedio).toFixed(2)} / $`, 'success');
      }
    } catch (err) {
      showToast('Error actualizando tasa BCV', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCategory(true);

    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newCatName.trim(), descripcion: newCatDesc.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear categoría');

      showToast('Categoría creada exitosamente', 'success');
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
      if (data.id) setFormData(prev => ({ ...prev, categoria_id: data.id }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = (catId, catName) => {
    showConfirm({
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de eliminar la categoría "${catName}"? Los productos asignados a ella quedarán clasificados como "Sin categoría".`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/categorias/${catId}`, { method: 'DELETE' });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Error al eliminar categoría');
          }
          showToast(`Categoría "${catName}" eliminada correctamente`, 'success');
          fetchCategories();
          fetchProducts();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      codigo_barras: '',
      nombre: '',
      descripcion: '',
      categoria_id: categories.length > 0 ? categories[0].id : '',
      precio_costo: '',
      precio_venta: '',
      stock_actual: '',
      stock_minimo: '5'
    });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      codigo_barras: p.codigo_barras || '',
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      categoria_id: p.categoria_id || '',
      precio_costo: p.precio_costo || '',
      precio_venta: p.precio_venta || '',
      stock_actual: p.stock_actual || '0',
      stock_minimo: p.stock_minimo || '5'
    });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = null;
      if (imageFile) {
        const formDataImg = new FormData();
        formDataImg.append('file', imageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataImg
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.url;
        }
      }

      const payload = {
        ...formData,
        imagen_url: finalImageUrl
      };

      const url = editingId ? `/api/productos/${editingId}` : '/api/productos';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el producto');

      showToast(editingId ? 'Producto actualizado correctamente' : 'Producto creado exitosamente', 'success');
      setIsFormOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p) => {
    showConfirm({
      title: 'Eliminar Producto',
      message: `¿Estás seguro de eliminar "${p.nombre}"? Esta acción deshabilitará el ítem del catálogo.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/productos/${p.id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Producto eliminado del sistema', 'success');
            fetchProducts();
          } else {
            showToast('Error al eliminar producto', 'error');
          }
        } catch (err) {
          showToast('Error eliminando producto', 'error');
        }
      }
    });
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjAmount || Number(adjAmount) <= 0) return;
    setAdjSaving(true);

    try {
      const res = await fetch(`/api/productos/${adjustmentModal.product.id}/ajuste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_movimiento: adjustmentModal.type,
          cantidad: adjAmount,
          justificacion: adjJustification
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar ajuste');

      setAdjustmentModal({ open: false, product: null, type: 'ENTRADA' });
      setAdjAmount('');
      setAdjJustification('');
      fetchProducts();
      showToast('Ajuste de inventario registrado correctamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAdjSaving(false);
    }
  };

  const tasaBcv = bcvData?.promedio || 737.23;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || 
                          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || String(p.categoria_id) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e1b4b' }}>Administración de Productos & Precios</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Gestión centralizada de catálogo, actualización de precios en USD/Bs. y control de stock.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowBcvModal(true)} className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', border: '1px solid #ddd6fe', color: '#7c3aed', background: '#f3e8ff' }}>
              Tasa BCV ({bcvData?.fechaFormatted || new Date().toLocaleDateString('es-VE')}): Bs. {Number(tasaBcv).toFixed(2)}
            </button>

            <button onClick={() => setIsCategoryModalOpen(true)} className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
              🏷️ Gestionar Categorías
            </button>
            
            <button onClick={handleOpenCreate} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>
              + Cargar Producto
            </button>
          </div>
        </div>

        {/* Filter Toolbar & View Switcher */}
        <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código de barras..."
            className="input-field"
            style={{ flex: 1, minWidth: '220px' }}
          />

          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          {/* View Mode Toggle Buttons */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', border: '1px solid #cbd5e1' }}>
            <button 
              onClick={() => setViewMode('TABLE')}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TABLE' ? '#1e1b4b' : '#64748b',
                boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              📋 Tabla Lista
            </button>
            <button 
              onClick={() => setViewMode('CARDS')}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                color: viewMode === 'CARDS' ? '#1e1b4b' : '#64748b',
                boxShadow: viewMode === 'CARDS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🎴 Tarjetas Catálogo
            </button>
          </div>
        </div>

        {/* MODE A: HIGH-DENSITY ADMIN TABLE LIST VIEW */}
        {viewMode === 'TABLE' && (
          <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #dbeafe', color: '#1e40af', background: '#eff6ff' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Foto</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Código</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Producto & Categoría</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Precio Costo ($)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Precio Venta ($ / Bs.)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Stock</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones & Edición</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const pCostoUsd = Number(p.precio_costo || 0);
                  const pVentaUsd = Number(p.precio_venta || 0);
                  const pVentaBs = pVentaUsd * tasaBcv;

                  const isCritical = Number(p.stock_actual) <= Number(p.stock_minimo);
                  const isOut = Number(p.stock_actual) <= 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', background: '#f3e8ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.imagen_url ? (
                            <img src={p.imagen_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7c3aed' }}>PROD</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>
                        {p.codigo_barras}
                      </td>

                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{p.nombre}</div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '2px', alignItems: 'center' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                            {p.categoria_nombre || 'Sin categoría'}
                          </span>
                          {p.descripcion && <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.descripcion}</span>}
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 1rem', color: '#475569', fontWeight: 600 }}>
                        ${pCostoUsd.toFixed(2)}
                      </td>

                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                          ${pVentaUsd.toFixed(2)} USD
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed' }}>
                          Bs. {pVentaBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span className={`badge ${isOut ? 'badge-danger' : isCritical ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.75rem' }}>
                          {p.stock_actual} unid.
                        </span>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>Mín: {p.stock_minimo}</div>
                      </td>

                      <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleEdit(p)}
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}
                            title="Editar precio o datos"
                          >
                            ✏️ Editar Precio
                          </button>

                          <button 
                            onClick={() => setAdjustmentModal({ open: true, product: p, type: 'ENTRADA' })}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                            title="Registrar ingreso de stock"
                          >
                            📦 +Stock
                          </button>

                          <button 
                            onClick={() => setAdjustmentModal({ open: true, product: p, type: 'PERDIDA' })}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: '#d97706', borderColor: '#fef3c7', background: '#fffbe6' }}
                            title="Registrar merma o pérdida"
                          >
                            ⚠️ Merma
                          </button>

                          <button 
                            onClick={() => handleDelete(p)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}
                            title="Eliminar producto"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No se encontraron productos registrados coincidentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE B: CATALOG CARDS GRID VIEW */}
        {viewMode === 'CARDS' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  bcvRate={tasaBcv}
                  onSelect={(p) => setSelectedProductView(p)}
                  onEdit={(p) => handleEdit(p)}
                  onDelete={(p) => handleDelete(p)}
                  onAddStock={(p) => setAdjustmentModal({ open: true, product: p, type: 'ENTRADA' })}
                  onAddLoss={(p) => setAdjustmentModal({ open: true, product: p, type: 'PERDIDA' })}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                No se encontraron productos registrados coincidentes.
              </div>
            )}
          </div>
        )}

      </div>

      {/* BCV Manual Rate Modal */}
      {showBcvModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(30, 27, 75, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '1.5rem', background: '#ffffff', border: '1px solid #e9d5ff' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1e1b4b' }}>Ajustar Tasa Oficial BCV</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Modifica la tasa del dólar en Bolívares para recalcular instantáneamente todos los precios en moneda nacional.
            </p>

            <form onSubmit={handleUpdateBcv} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Tasa de Cambio (Bs. por 1 USD) *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={newBcvInput}
                  onChange={(e) => setNewBcvInput(e.target.value)}
                  placeholder="Ej. 737.88"
                  className="input-field"
                  style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7c3aed' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowBcvModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Actualizar Tasa BCV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager & Creator Modal */}
      {isCategoryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '1.5rem', background: '#ffffff', border: '1px solid #e9d5ff', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#1e1b4b', fontWeight: 800 }}>Gestión de Categorías</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Form to create new category */}
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', background: '#faf9ff', border: '1px solid #e9d5ff', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed' }}>+ Crear Nueva Categoría</div>
              <div>
                <input 
                  type="text" 
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nombre de categoría (Ej. Alimentos, Repuestos)"
                  className="input-field"
                />
              </div>

              <div>
                <input 
                  type="text" 
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Descripción (Opcional)"
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={savingCategory} className="btn btn-primary" style={{ padding: '0.65rem', fontWeight: 700 }}>
                {savingCategory ? 'Guardando...' : 'Guardar Categoría'}
              </button>
            </form>

            {/* List of Existing Categories with Delete Action */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '0.65rem' }}>
                Categorías Existentes ({categories.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                {categories.map(c => (
                  <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{c.nombre}</div>
                      {c.descripcion && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.descripcion}</div>}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleDeleteCategory(c.id, c.nombre)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2', fontWeight: 700 }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ))}

                {categories.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                    No hay categorías registradas.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn btn-secondary" style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {isFormOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(30, 27, 75, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #e9d5ff' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', color: '#1e1b4b' }}>{editingId ? 'Editar Producto & Precios en Bs.' : 'Cargar Nuevo Producto'}</h2>

            <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Código de Barras *</label>
                <input type="text" required value={formData.codigo_barras} onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })} placeholder="Ej. 7501000123" className="input-field" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre del Producto *</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Aceite de Motor 20W50 1L" className="input-field" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Categoría *</label>
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                    🏷️ Gestionar Categorías
                  </button>
                </div>
                <select value={formData.categoria_id} onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })} className="input-field" required>
                  <option value="">-- Selecciona Categoría --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Precio Costo ($ USD) *</label>
                <input 
                  type="number" step="0.01" required 
                  value={formData.precio_costo} 
                  onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })} 
                  placeholder="0.00" 
                  className="input-field" 
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
                  Equivalente: <span style={{ color: '#1e1b4b' }}>Bs. {(Number(formData.precio_costo || 0) * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Precio Venta ($ USD) *</label>
                <input 
                  type="number" step="0.01" required 
                  value={formData.precio_venta} 
                  onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })} 
                  placeholder="0.00" 
                  className="input-field" 
                />
                <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '4px', fontWeight: 700 }}>
                  Total en Bolívares (BCV): <span style={{ color: '#059669', fontSize: '0.85rem' }}>Bs. {(Number(formData.precio_venta || 0) * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {!editingId && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Stock Inicial</label>
                  <input type="number" value={formData.stock_actual} onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })} placeholder="0" className="input-field" />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Stock Mínimo Alerta</label>
                <input type="number" required value={formData.stock_minimo} onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })} className="input-field" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Fotografía del Producto</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} className="input-field" style={{ padding: '0.4rem' }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Descripción / Especificaciones</label>
                <textarea rows={2} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Ej. Aceite mineral multigrado para motor a gasolina" className="input-field" />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustmentModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(30, 27, 75, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', background: '#ffffff', border: '1px solid #e9d5ff' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#1e1b4b' }}>
              {adjustmentModal.type === 'ENTRADA' ? 'Registro de Ingreso' : 'Registro de Merma'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Producto: <strong style={{ color: '#1e1b4b' }}>{adjustmentModal.product?.nombre}</strong>
            </div>

            <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Cantidad *</label>
                <input type="number" required min="1" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className="input-field" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Justificación {adjustmentModal.type === 'PERDIDA' ? '(Obligatoria *)' : ''}</label>
                <input type="text" required={adjustmentModal.type === 'PERDIDA'} value={adjJustification} onChange={(e) => setAdjJustification(e.target.value)} className="input-field" />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setAdjustmentModal({ open: false, product: null, type: 'ENTRADA' })} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={adjSaving} className={adjustmentModal.type === 'ENTRADA' ? 'btn btn-success' : 'btn btn-danger'} style={{ flex: 1 }}>
                  {adjSaving ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProductView && <ProductModal product={selectedProductView} onClose={() => setSelectedProductView(null)} bcvRate={tasaBcv} />}
    </DashboardLayout>
  );
}
