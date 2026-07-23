-- Seed Data 100% Limpio (Sin categorías ni productos de prueba)
USE `inventario_pwa_db`;

-- Limpiar todas las tablas
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `auditoria_movimientos`;
TRUNCATE TABLE `detalle_ventas`;
TRUNCATE TABLE `ventas`;
TRUNCATE TABLE `productos`;
TRUNCATE TABLE `categorias`;
TRUNCATE TABLE `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insertar Cuentas de Acceso Base
-- Admin: admin@inventario.com / admin123
-- Trabajador: trabajador@inventario.com / worker123
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `activo`) VALUES
(1, 'Administrador General', 'admin@inventario.com', '$2b$10$l1GKJ3NGtP9xY7cQRqgF..bak.4vNwgVPLm31WiK/TJa96Cbu.ozK', 'ADMIN', 1),
(2, 'Carlos Ruiz (Vendedor)', 'trabajador@inventario.com', '$2b$10$eWuNFWCrk1H26ZELgYLoA.iSIqvQlJORNhb.eua8K5Wf1F2dlPL/m', 'TRABAJADOR', 1);
