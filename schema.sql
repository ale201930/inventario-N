-- Schema for inventario_pwa_db
CREATE DATABASE IF NOT EXISTS `inventario_pwa_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `inventario_pwa_db`;

-- 1. Tabla Usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('ADMIN', 'TRABAJADOR') NOT NULL DEFAULT 'TRABAJADOR',
  `permisos` TEXT DEFAULT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla Categorias
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `descripcion` TEXT,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla Productos
CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_barras` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `categoria_id` INT,
  `imagen_url` VARCHAR(255) DEFAULT NULL,
  `precio_costo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `precio_venta` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_actual` INT NOT NULL DEFAULT 0,
  `stock_minimo` INT NOT NULL DEFAULT 5,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla Proveedores
CREATE TABLE IF NOT EXISTS `proveedores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rif_identificacion` VARCHAR(50) NOT NULL UNIQUE,
  `razon_social` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(50),
  `email` VARCHAR(100),
  `direccion` TEXT,
  `estado` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabla Compras
CREATE TABLE IF NOT EXISTS `compras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proveedor_id` INT NOT NULL,
  `numero_factura_proveedor` VARCHAR(100),
  `fecha_compra` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `monto_total_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tasa_bcv_momento` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `estado_pago` ENUM('PAGADO', 'PENDIENTE', 'PARCIAL') NOT NULL DEFAULT 'PENDIENTE',
  FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabla Compras Detalle / Lotes
CREATE TABLE IF NOT EXISTS `compras_detalle_lotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `compra_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `codigo_lote` VARCHAR(100) NOT NULL,
  `cantidad_ingresada` INT NOT NULL,
  `cantidad_disponible` INT NOT NULL,
  `precio_costo_unitario` DECIMAL(10,2) NOT NULL,
  `fecha_vencimiento` DATE DEFAULT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabla Clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cedula_rif` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(50),
  `email` VARCHAR(100),
  `direccion` TEXT,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabla Ventas
CREATE TABLE IF NOT EXISTS `ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `cliente_id` INT DEFAULT NULL,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `fecha_venta` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`),
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabla Detalle de Ventas
CREATE TABLE IF NOT EXISTS `detalle_ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `venta_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `lote_id` INT DEFAULT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`),
  FOREIGN KEY (`lote_id`) REFERENCES `compras_detalle_lotes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabla Créditos Venta (Cuentas por Cobrar)
CREATE TABLE IF NOT EXISTS `creditos_venta` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `venta_id` INT NOT NULL UNIQUE,
  `cliente_id` INT NOT NULL,
  `monto_total` DECIMAL(10,2) NOT NULL,
  `monto_pendiente` DECIMAL(10,2) NOT NULL,
  `estado` ENUM('ACTIVO', 'CANCELADO', 'EN_MORA') NOT NULL DEFAULT 'ACTIVO',
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Tabla Abonos Crédito
CREATE TABLE IF NOT EXISTS `abonos_credito` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `credito_id` INT NOT NULL,
  `monto_abonado` DECIMAL(10,2) NOT NULL,
  `metodo_pago` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `tasa_bcv` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `observaciones` VARCHAR(255) DEFAULT NULL,
  `fecha_abono` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`credito_id`) REFERENCES `creditos_venta`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Tabla Pagos Proveedores (Cuentas por Pagar)
CREATE TABLE IF NOT EXISTS `pagos_proveedores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `compra_id` INT NOT NULL,
  `monto_pagado` DECIMAL(10,2) NOT NULL,
  `metodo_pago` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `fecha_pago` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `observaciones` TEXT,
  FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Tabla Auditoría / Movimientos
CREATE TABLE IF NOT EXISTS `auditoria_movimientos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `producto_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `tipo_movimiento` ENUM('ENTRADA', 'SALIDA', 'PERDIDA') NOT NULL,
  `cantidad` INT NOT NULL,
  `justificacion` VARCHAR(255) DEFAULT NULL,
  `fecha_movimiento` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
