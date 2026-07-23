'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';

export default function WorkerInventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bcvRate, setBcvRate] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBcv();
  }, [search, selectedCategory, stockFilter]);

  const fetchBcv = async () => {
    try {
      const res = await fetch('/api/bcv');
      const data = await res.json();
      if (data && data.promedio) setBcvRate(data.promedio);
    } catch (err) {}
  };

  const fetchProducts = async () => {
    try {
      const url = new URL('/api/productos', window.location.origin);
      if (search) url.searchParams.set('q', search);
      if (selectedCategory) url.searchParams.set('categoria', selectedCategory);
      if (stockFilter) url.searchParams.set('stock', stockFilter);

      const res = await fetch(url);
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

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Catálogo de Inventario</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Explora la galería visual de mercancías con fotografías e indicadores de stock.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto, código de barras..."
            className="input-field"
            style={{ flex: 1, minWidth: '220px' }}
          />

          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <select 
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">Todos los Estados</option>
            <option value="disponible">Stock Disponible</option>
            <option value="critico">Stock Crítico</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.85rem' }}>
          {products.map(p => (
            <ProductCard 
              key={p.id}
              product={p}
              onSelect={(prod) => setSelectedProduct(prod)}
              isPos={false}
              bcvRate={bcvRate}
            />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          bcvRate={bcvRate}
        />
      )}
    </DashboardLayout>
  );
}
