-- ==============================================================================
-- BASE DE DATOS COMPLETA Y LIMPIA PARA LARAGON: inventario_pwa_db
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `inventario_pwa_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `inventario_pwa_db`;

-- ------------------------------------------------------------------------------
-- 1. ESTRUCTURA DE TABLAS
-- ------------------------------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `auditoria_movimientos`;
DROP TABLE IF EXISTS `detalle_ventas`;
DROP TABLE IF EXISTS `ventas`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `categorias`;
DROP TABLE IF EXISTS `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- Tabla Usuarios (RBAC: ADMIN / TRABAJADOR)
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('ADMIN', 'TRABAJADOR') NOT NULL DEFAULT 'TRABAJADOR',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Categorias
CREATE TABLE `categorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `descripcion` TEXT,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Productos con Ruta de Fotografías
CREATE TABLE `productos` (
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

-- Tabla Ventas (Encabezado)
CREATE TABLE `ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` ENUM('EFECTIVO', 'TRANSFERENCIA', 'PUNTO_VENTA') NOT NULL DEFAULT 'EFECTIVO',
  `fecha_venta` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Detalle de Ventas
CREATE TABLE `detalle_ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `venta_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Auditoria Movimientos (Bitácora)
CREATE TABLE `auditoria_movimientos` (
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

-- ------------------------------------------------------------------------------
-- 2. DATOS DE INICIALIZACIÓN
-- ------------------------------------------------------------------------------

-- Cuentas Iniciales
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `activo`) VALUES
(1, 'Administrador General', 'admin@inventario.com', '$2b$10$l1GKJ3NGtP9xY7cQRqgF..bak.4vNwgVPLm31WiK/TJa96Cbu.ozK', 'ADMIN', 1),
(2, 'Carlos Ruiz (Vendedor)', 'trabajador@inventario.com', '$2b$10$eWuNFWCrk1H26ZELgYLoA.iSIqvQlJORNhb.eua8K5Wf1F2dlPL/m', 'TRABAJADOR', 1);
