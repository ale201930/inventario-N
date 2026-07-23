import mysql from 'mysql2/promise';

let pool;

try {
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'inventario_pwa_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Auto-create missing tables and auto-heal schema updates in MySQL DB if needed
  (async () => {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS \`clientes\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`cedula_rif\` VARCHAR(50) NOT NULL UNIQUE,
          \`nombre\` VARCHAR(150) NOT NULL,
          \`telefono\` VARCHAR(50),
          \`email\` VARCHAR(100),
          \`direccion\` TEXT,
          \`fecha_creacion\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {}

    try { await pool.execute("ALTER TABLE usuarios ADD COLUMN permisos TEXT NULL"); } catch (e) {}
    try { await pool.execute("ALTER TABLE ventas ADD COLUMN cliente_id INT NULL"); } catch (e) {}
    try { await pool.execute("ALTER TABLE detalle_ventas ADD COLUMN lote_id INT NULL"); } catch (e) {}
    try { await pool.execute("ALTER TABLE ventas MODIFY COLUMN metodo_pago VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO'"); } catch (e) {}
    try { await pool.execute("UPDATE detalle_ventas dv JOIN productos p ON dv.producto_id = p.id SET dv.precio_unitario = p.precio_venta, dv.subtotal = dv.cantidad * p.precio_venta WHERE dv.precio_unitario = 0 OR dv.precio_unitario IS NULL"); } catch (e) {}
  })();
} catch (err) {
  console.warn('Error inicializando Pool MySQL:', err.message);
}

export function resetMemoryStore() {
  if (!memoryStore) return;
  memoryStore.compras = [];
  memoryStore.compras_detalle_lotes = [];
  memoryStore.ventas = [];
  memoryStore.detalle_ventas = [];
  memoryStore.creditos_venta = [];
  memoryStore.abonos_credito = [];
  memoryStore.pagos_proveedores = [];
  memoryStore.auditoria_movimientos = [];
}

// Memory store initialized for business setup
let memoryStore = {
  usuarios: [
    { 
      id: 1, 
      nombre: 'Administrador General', 
      email: 'admin@inventario.com', 
      password_hash: '$2b$10$l1GKJ3NGtP9xY7cQRqgF..bak.4vNwgVPLm31WiK/TJa96Cbu.ozK', 
      rol: 'ADMIN', 
      permisos: JSON.stringify(['inicio', 'perfil', 'proveedores', 'compras', 'lotes', 'pos', 'inventario', 'creditos', 'productos', 'pagos_proveedores', 'reportes', 'auditoria', 'usuarios']),
      activo: 1 
    },
    { 
      id: 2, 
      nombre: 'Carlos Ruiz (Vendedor)', 
      email: 'trabajador@inventario.com', 
      password_hash: '$2b$10$eWuNFWCrk1H26ZELgYLoA.iSIqvQlJORNhb.eua8K5Wf1F2dlPL/m', 
      rol: 'TRABAJADOR', 
      permisos: JSON.stringify(['inicio', 'perfil', 'pos', 'inventario', 'creditos']),
      activo: 1 
    }
  ],
  categorias: [],
  productos: [],
  proveedores: [],
  compras: [],
  compras_detalle_lotes: [],
  clientes: [],
  ventas: [],
  detalle_ventas: [],
  creditos_venta: [],
  abonos_credito: [],
  pagos_proveedores: [],
  auditoria_movimientos: []
};

export async function query(sql, params = []) {
  if (pool) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.warn('Servidor MySQL desconectado o en mantenimiento, usando almacenamiento local temporal.');
      } else {
        console.warn('Aviso consulta MySQL:', err.message);
      }
    }
  }

  return handleMemoryQuery(sql, params);
}

function handleMemoryQuery(sql, params) {
  const normalizedSql = sql.trim().toLowerCase();

  // 1. USUARIOS
  if (normalizedSql.includes('select') && normalizedSql.includes('from usuarios') && normalizedSql.includes('email =')) {
    const email = params[0];
    const user = memoryStore.usuarios.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    return user ? [user] : [];
  }
  if (normalizedSql.includes('select') && normalizedSql.includes('from usuarios')) {
    return memoryStore.usuarios;
  }
  if (normalizedSql.includes('insert into usuarios')) {
    const newUser = {
      id: memoryStore.usuarios.length + 1,
      nombre: params[0],
      email: params[1],
      password_hash: params[2],
      rol: params[3] || 'TRABAJADOR',
      permisos: params[4] || JSON.stringify(['inicio', 'perfil', 'pos', 'inventario', 'creditos']),
      activo: 1,
      fecha_creacion: new Date().toISOString()
    };
    memoryStore.usuarios.push(newUser);
    return { insertId: newUser.id };
  }
  if (normalizedSql.includes('update usuarios')) {
    const id = params[params.length - 1];
    const user = memoryStore.usuarios.find(u => u.id === Number(id));
    if (user) {
      if (normalizedSql.includes('activo =')) user.activo = params[0];
      if (normalizedSql.includes('rol =')) user.rol = params[0];
      if (normalizedSql.includes('nombre =')) user.nombre = params[0];
      if (normalizedSql.includes('email =')) user.email = params[0];
      if (normalizedSql.includes('permisos =')) user.permisos = params[0];
      if (normalizedSql.includes('password_hash =')) user.password_hash = params[0];
    }
    return { affectedRows: user ? 1 : 0 };
  }

  // 2. CATEGORIAS
  if (normalizedSql.includes('select') && normalizedSql.includes('from categorias')) {
    return memoryStore.categorias;
  }
  if (normalizedSql.includes('insert into categorias')) {
    const newCat = {
      id: memoryStore.categorias.length + 1,
      nombre: params[0],
      descripcion: params[1] || ''
    };
    memoryStore.categorias.push(newCat);
    return { insertId: newCat.id };
  }

  // 3. PRODUCTOS
  if (normalizedSql.includes('select') && normalizedSql.includes('from productos')) {
    let prods = memoryStore.productos.map(p => {
      const cat = memoryStore.categorias.find(c => c.id === Number(p.categoria_id));
      return { ...p, categoria_nombre: cat ? cat.nombre : 'Sin categoría' };
    });

    if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
      const term = params[0].replace(/%/g, '').toLowerCase();
      prods = prods.filter(p => 
        p.nombre.toLowerCase().includes(term) || 
        p.codigo_barras.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term))
      );
    }
    return prods;
  }

  if (normalizedSql.includes('insert into productos')) {
    const newProd = {
      id: memoryStore.productos.length + 1,
      codigo_barras: params[0],
      nombre: params[1],
      descripcion: params[2],
      categoria_id: Number(params[3]),
      imagen_url: params[4] || null,
      precio_costo: Number(params[5]),
      precio_venta: Number(params[6]),
      stock_actual: Number(params[7]),
      stock_minimo: Number(params[8]),
      fecha_creacion: new Date().toISOString()
    };
    memoryStore.productos.push(newProd);

    if (newProd.stock_actual > 0) {
      memoryStore.auditoria_movimientos.push({
        id: memoryStore.auditoria_movimientos.length + 1,
        producto_id: newProd.id,
        usuario_id: 1,
        tipo_movimiento: 'ENTRADA',
        cantidad: newProd.stock_actual,
        justificacion: 'Inventario inicial de creación de producto',
        fecha_movimiento: new Date().toISOString()
      });
    }

    return { insertId: newProd.id };
  }

  if (normalizedSql.includes('update productos')) {
    if (normalizedSql.includes('stock_actual = stock_actual -')) {
      const qty = Number(params[0]);
      const id = Number(params[1]);
      const prod = memoryStore.productos.find(p => p.id === id);
      if (prod) prod.stock_actual = Math.max(0, prod.stock_actual - qty);
      return { affectedRows: prod ? 1 : 0 };
    }
    if (normalizedSql.includes('stock_actual = stock_actual +')) {
      const qty = Number(params[0]);
      const id = Number(params[1]);
      const prod = memoryStore.productos.find(p => p.id === id);
      if (prod) prod.stock_actual += qty;
      return { affectedRows: prod ? 1 : 0 };
    }
    if (normalizedSql.includes('set codigo_barras =')) {
      const id = Number(params[params.length - 1]);
      const prod = memoryStore.productos.find(p => p.id === id);
      if (prod) {
        prod.codigo_barras = params[0];
        prod.nombre = params[1];
        prod.descripcion = params[2];
        prod.categoria_id = Number(params[3]);
        prod.imagen_url = params[4];
        prod.precio_costo = Number(params[5]);
        prod.precio_venta = Number(params[6]);
        prod.stock_minimo = Number(params[7]);
      }
      return { affectedRows: prod ? 1 : 0 };
    }
  }

  if (normalizedSql.includes('delete from auditoria_movimientos')) {
    const prodId = Number(params[0]);
    memoryStore.auditoria_movimientos = memoryStore.auditoria_movimientos.filter(m => m.producto_id !== prodId);
    return { affectedRows: 1 };
  }

  if (normalizedSql.includes('delete from detalle_ventas')) {
    if (normalizedSql.includes('producto_id =')) {
      const prodId = Number(params[0]);
      memoryStore.detalle_ventas = memoryStore.detalle_ventas.filter(d => d.producto_id !== prodId);
    } else if (normalizedSql.includes('venta_id =')) {
      const vId = Number(params[0]);
      memoryStore.detalle_ventas = memoryStore.detalle_ventas.filter(d => d.venta_id !== vId);
    }
    return { affectedRows: 1 };
  }

  if (normalizedSql.includes('delete from productos')) {
    const id = Number(params[0]);
    memoryStore.productos = memoryStore.productos.filter(p => p.id !== id);
    return { affectedRows: 1 };
  }

  // 4. PROVEEDORES
  if (normalizedSql.includes('from proveedores')) {
    if (normalizedSql.includes('where id =')) {
      const id = Number(params[0]);
      return memoryStore.proveedores.filter(p => p.id === id);
    }
    return memoryStore.proveedores;
  }
  if (normalizedSql.includes('insert into proveedores')) {
    const newProv = {
      id: memoryStore.proveedores.length + 1,
      rif_identificacion: params[0],
      razon_social: params[1],
      telefono: params[2] || '',
      email: params[3] || '',
      direccion: params[4] || '',
      estado: 1,
      fecha_creacion: new Date().toISOString()
    };
    memoryStore.proveedores.push(newProv);
    return { insertId: newProv.id };
  }
  if (normalizedSql.includes('update proveedores')) {
    const id = Number(params[params.length - 1]);
    const prov = memoryStore.proveedores.find(p => p.id === id);
    if (prov) {
      prov.rif_identificacion = params[0];
      prov.razon_social = params[1];
      prov.telefono = params[2];
      prov.email = params[3];
      prov.direccion = params[4];
      prov.estado = Number(params[5]);
    }
    return { affectedRows: prov ? 1 : 0 };
  }
  if (normalizedSql.includes('delete from proveedores')) {
    const id = Number(params[0]);
    memoryStore.proveedores = memoryStore.proveedores.filter(p => p.id !== id);
    return { affectedRows: 1 };
  }

  // 5. COMPRAS & LOTES
  if (normalizedSql.includes('from compras_detalle_lotes') || normalizedSql.includes('from compras_detalle_lotes l')) {
    return memoryStore.compras_detalle_lotes.map(l => {
      const p = memoryStore.productos.find(prod => prod.id === Number(l.producto_id));
      const c = memoryStore.compras.find(comp => comp.id === Number(l.compra_id));
      const prov = c ? memoryStore.proveedores.find(pr => pr.id === Number(c.proveedor_id)) : null;
      return {
        ...l,
        producto_nombre: p ? p.nombre : 'Producto #' + l.producto_id,
        producto_codigo: p ? p.codigo_barras : '',
        proveedor_nombre: prov ? prov.razon_social : 'Sin Proveedor'
      };
    });
  }

  if (normalizedSql.includes('insert into compras_detalle_lotes')) {
    const newLote = {
      id: memoryStore.compras_detalle_lotes.length + 1,
      compra_id: Number(params[0]),
      producto_id: Number(params[1]),
      codigo_lote: params[2],
      cantidad_ingresada: Number(params[3]),
      cantidad_disponible: Number(params[3]),
      precio_costo_unitario: Number(params[4]),
      fecha_vencimiento: params[5] || null,
      fecha_creacion: new Date().toISOString()
    };
    memoryStore.compras_detalle_lotes.push(newLote);
    return { insertId: newLote.id };
  }

  if (normalizedSql.includes('update compras_detalle_lotes')) {
    const qty = Number(params[0]);
    const id = Number(params[1]);
    const lote = memoryStore.compras_detalle_lotes.find(l => l.id === id);
    if (lote) lote.cantidad_disponible = Math.max(0, lote.cantidad_disponible - qty);
    return { affectedRows: lote ? 1 : 0 };
  }

  if (normalizedSql.includes('from compras') || normalizedSql.includes('from compras c')) {
    return memoryStore.compras.map(c => {
      const prov = memoryStore.proveedores.find(p => p.id === Number(c.proveedor_id));
      const lotes = memoryStore.compras_detalle_lotes.filter(l => l.compra_id === c.id);
      return {
        ...c,
        proveedor_nombre: prov ? prov.razon_social : 'Proveedor Desconocido',
        proveedor_rif: prov ? prov.rif_identificacion : '',
        lotes
      };
    }).reverse();
  }

  if (normalizedSql.includes('insert into compras')) {
    const newCompra = {
      id: memoryStore.compras.length + 1,
      proveedor_id: Number(params[0]),
      numero_factura_proveedor: params[1],
      fecha_compra: new Date().toISOString(),
      monto_total_usd: Number(params[2]),
      tasa_bcv_momento: Number(params[3] || 1),
      estado_pago: params[4] || 'PENDIENTE'
    };
    memoryStore.compras.push(newCompra);
    return { insertId: newCompra.id };
  }

  if (normalizedSql.includes('update compras set estado_pago')) {
    const estado = params[0];
    const id = Number(params[1]);
    const compra = memoryStore.compras.find(c => c.id === id);
    if (compra) compra.estado_pago = estado;
    return { affectedRows: compra ? 1 : 0 };
  }

  // 6. CLIENTES
  if (normalizedSql.includes('from clientes')) {
    if (normalizedSql.includes('where id =')) {
      const id = Number(params[0]);
      return memoryStore.clientes.filter(c => c.id === id);
    }
    if (normalizedSql.includes('where lower(cedula_rif) =') || normalizedSql.includes('cedula_rif like')) {
      const searchVal = (params[0] || '').replace(/%/g, '').toLowerCase();
      const searchDigits = searchVal.replace(/\D/g, '');
      return memoryStore.clientes.filter(c => {
        const cClean = (c.cedula_rif || '').toLowerCase().replace(/[\s-]/g, '');
        const cDigits = (c.cedula_rif || '').replace(/\D/g, '');
        if (cClean === searchVal) return true;
        if (searchDigits.length >= 5 && cDigits === searchDigits) return true;
        if (cClean.includes(searchVal) || (c.nombre || '').toLowerCase().includes(searchVal)) return true;
        return false;
      });
    }
    return memoryStore.clientes;
  }
  if (normalizedSql.includes('insert into clientes')) {
    const existing = memoryStore.clientes.find(c => {
      const clean1 = (c.cedula_rif || '').toLowerCase().replace(/[\s-]/g, '');
      const clean2 = (params[0] || '').toLowerCase().replace(/[\s-]/g, '');
      return clean1 === clean2;
    });

    if (existing) {
      return { insertId: existing.id, cliente: existing };
    }

    const newCli = {
      id: memoryStore.clientes.length + 1,
      cedula_rif: params[0],
      nombre: params[1],
      telefono: params[2] || '',
      email: params[3] || '',
      direccion: params[4] || '',
      fecha_creacion: new Date().toISOString()
    };
    memoryStore.clientes.push(newCli);
    return { insertId: newCli.id, cliente: newCli };
  }

  // 7. VENTAS
  if (normalizedSql.includes('insert into ventas')) {
    const newVenta = {
      id: memoryStore.ventas.length + 1,
      usuario_id: Number(params[0]),
      cliente_id: params[1] ? Number(params[1]) : null,
      total: Number(params[2]),
      metodo_pago: params[3],
      fecha_venta: new Date().toISOString()
    };
    memoryStore.ventas.push(newVenta);
    return { insertId: newVenta.id };
  }

  if (normalizedSql.includes('insert into detalle_ventas')) {
    const detail = {
      id: memoryStore.detalle_ventas.length + 1,
      venta_id: Number(params[0]),
      producto_id: Number(params[1]),
      lote_id: params[2] ? Number(params[2]) : null,
      cantidad: Number(params[3]),
      precio_unitario: Number(params[4]),
      subtotal: Number(params[5])
    };
    memoryStore.detalle_ventas.push(detail);
    return { insertId: detail.id };
  }

  // 8. CREDITOS VENTA & ABONOS
  if (normalizedSql.includes('from creditos_venta') || normalizedSql.includes('from creditos_venta cr')) {
    return memoryStore.creditos_venta.map(cr => {
      const cli = memoryStore.clientes.find(c => c.id === Number(cr.cliente_id));
      const abonos = memoryStore.abonos_credito.filter(a => a.credito_id === cr.id);
      return {
        ...cr,
        cliente_nombre: cli ? cli.nombre : 'Cliente Desconocido',
        cliente_cedula: cli ? cli.cedula_rif : '',
        abonos
      };
    }).reverse();
  }

  if (normalizedSql.includes('insert into creditos_venta')) {
    const newCredito = {
      id: memoryStore.creditos_venta.length + 1,
      venta_id: Number(params[0]),
      cliente_id: Number(params[1]),
      monto_total: Number(params[2]),
      monto_pendiente: Number(params[3]),
      estado: 'ACTIVO',
      fecha_creacion: new Date().toISOString()
    };
    memoryStore.creditos_venta.push(newCredito);
    return { insertId: newCredito.id };
  }

  if (normalizedSql.includes('update creditos_venta')) {
    const id = Number(params[params.length - 1]);
    const credito = memoryStore.creditos_venta.find(c => c.id === id);
    if (credito) {
      if (normalizedSql.includes('monto_pendiente =')) {
        credito.monto_pendiente = Math.max(0, Number(params[0]));
        if (credito.monto_pendiente <= 0) credito.estado = 'CANCELADO';
      }
    }
    return { affectedRows: credito ? 1 : 0 };
  }

  if (normalizedSql.includes('insert into abonos_credito')) {
    const newAbono = {
      id: memoryStore.abonos_credito.length + 1,
      credito_id: Number(params[0]),
      monto_abonado: Number(params[1]),
      metodo_pago: params[2] || 'EFECTIVO',
      tasa_bcv: Number(params[3] || 1),
      observaciones: params[4] || null,
      fecha_abono: new Date().toISOString()
    };
    memoryStore.abonos_credito.push(newAbono);
    return { insertId: newAbono.id };
  }

  // 9. PAGOS PROVEEDORES
  if (normalizedSql.includes('from pagos_proveedores')) {
    return memoryStore.pagos_proveedores;
  }

  if (normalizedSql.includes('insert into pagos_proveedores')) {
    const newPago = {
      id: memoryStore.pagos_proveedores.length + 1,
      compra_id: Number(params[0]),
      monto_pagado: Number(params[1]),
      metodo_pago: params[2] || 'EFECTIVO',
      fecha_pago: new Date().toISOString(),
      observaciones: params[3] || null
    };
    memoryStore.pagos_proveedores.push(newPago);
    return { insertId: newPago.id };
  }

  // 10. AUDITORIA
  if (normalizedSql.includes('insert into auditoria_movimientos')) {
    const log = {
      id: memoryStore.auditoria_movimientos.length + 1,
      producto_id: Number(params[0]),
      usuario_id: Number(params[1]),
      tipo_movimiento: params[2],
      cantidad: Number(params[3]),
      justificacion: params[4] || null,
      fecha_movimiento: new Date().toISOString()
    };
    memoryStore.auditoria_movimientos.push(log);
    return { insertId: log.id };
  }

  if (normalizedSql.includes('from auditoria_movimientos')) {
    return memoryStore.auditoria_movimientos.map(m => {
      const p = memoryStore.productos.find(x => x.id === m.producto_id);
      const u = memoryStore.usuarios.find(x => x.id === m.usuario_id);
      return {
        ...m,
        producto_nombre: p ? p.nombre : 'Producto ' + m.producto_id,
        producto_imagen: p ? p.imagen_url : null,
        codigo_barras: p ? p.codigo_barras : '',
        usuario_nombre: u ? u.nombre : 'Usuario ' + m.usuario_id,
        usuario_rol: u ? u.rol : 'TRABAJADOR'
      };
    }).reverse();
  }

  if (normalizedSql.includes('from ventas')) {
    if (normalizedSql.includes('join detalle_ventas') || normalizedSql.includes('ganancia')) {
      let gananciaTotal = 0;
      memoryStore.detalle_ventas.forEach(dv => {
        const prod = memoryStore.productos.find(p => p.id === dv.producto_id);
        const pu = Number(dv.precio_unitario || (prod ? prod.precio_venta : 0));
        const pc = Number(prod ? prod.precio_costo : 0);
        gananciaTotal += (pu - pc) * Number(dv.cantidad || 1);
      });
      return [{ ganancia_bruta_total: Math.max(0, gananciaTotal) }];
    }
    if (normalizedSql.includes('sum(') || normalizedSql.includes('count(')) {
      const sumTotal = memoryStore.ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
      const countVentas = memoryStore.ventas.length;
      return [{
        total_ventas_brutas: sumTotal,
        total_transacciones: countVentas,
        total: sumTotal
      }];
    }
    return memoryStore.ventas;
  }

  return [];
}
