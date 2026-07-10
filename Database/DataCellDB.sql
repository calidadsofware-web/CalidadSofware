/*=========================================================
  PROYECTO : DATACELL
  BD       : DataCellDB
  MOTOR    : MySQL 8+

  ADVERTENCIA: este script reinicia la base DataCellDB.

  DICCIONARIO BREVE DE TABLAS:
  - Rol: perfiles de acceso del sistema.
  - Usuario: responsables que registran ventas, compras, ingresos y reclamos.
  - Cliente: datos comerciales usados en CDP, busqueda de clientes y reclamos.
  - Proveedor: datos de abastecimiento usados en cotizaciones, compras e ingresos.
  - Categoria: clasificacion para buscar y ordenar productos.
  - Marca: marca comercial del producto.
  - Producto: catalogo, precios, stock y codigo de barras.
  - Venta: cabecera del CDP, pago y totales de la operacion.
  - DetalleVenta: productos vendidos dentro de cada CDP.
  - ReclamoCliente: reclamos asociados a cliente, CDP y producto.
  - Compra: orden/compra usada como base para recibir mercaderia.
  - DetalleCompra: productos y cantidades de la compra.
  - SolicitudCotizacion: solicitud enviada a proveedor para obtener precios.
  - DetalleSolicitudCotizacion: productos solicitados en la cotizacion.
  - SolicitudCompra: pedido interno para reponer stock.
  - DetalleSolicitudCompra: productos requeridos en la solicitud de compra.
  - Recepcion: ingreso fisico de productos desde una compra.
  - DetalleRecepcion: cantidades recibidas por producto.
  - MovimientoInventario: trazabilidad de entradas, salidas y ajustes de stock.

  TABLAS QUE PODRIAN QUITARSE SOLO SI SE RECORTA EL ALCANCE:
  - Compra y DetalleCompra: solo si el ingreso de productos ya no dependera de una compra.
  - Recepcion y DetalleRecepcion: solo si se actualizara stock directo sin registrar ingresos.
  - MovimientoInventario: solo si no se necesita auditoria de stock.
  - Rol y Usuario: solo si la autenticacion queda siempre como demo y sin responsables en BD.
  Para las ECUs actuales se conservan porque sostienen trazabilidad y responsables.
==========================================================*/

DROP DATABASE IF EXISTS DataCellDB;
CREATE DATABASE DataCellDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE DataCellDB;

CREATE TABLE Rol(
    idRol INT AUTO_INCREMENT PRIMARY KEY,
    nombreRol VARCHAR(50) NOT NULL,
    CONSTRAINT UK_Rol UNIQUE(nombreRol)
);

CREATE TABLE Usuario(
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    correo VARCHAR(120) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    estado ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    idRol INT NOT NULL,
    CONSTRAINT UK_UsuarioCorreo UNIQUE(correo),
    CONSTRAINT FK_UsuarioRol FOREIGN KEY(idRol)
        REFERENCES Rol(idRol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE Cliente(
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80),
    documento VARCHAR(20),
    direccion VARCHAR(150),
    telefono VARCHAR(20),
    correo VARCHAR(120),
    estado ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UK_ClienteDocumento UNIQUE(documento),
    CONSTRAINT UK_ClienteCorreo UNIQUE(correo)
);

CREATE TABLE Proveedor(
    idProveedor INT AUTO_INCREMENT PRIMARY KEY,
    ruc VARCHAR(11) NOT NULL,
    razonSocial VARCHAR(150) NOT NULL,
    direccion VARCHAR(150),
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    correo VARCHAR(120),
    estado ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
    CONSTRAINT UK_ProveedorRUC UNIQUE(ruc),
    CONSTRAINT UK_ProveedorCorreo UNIQUE(correo)
);

CREATE TABLE Categoria(
    idCategoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    CONSTRAINT UK_Categoria UNIQUE(nombre)
);

CREATE TABLE Marca(
    idMarca INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    CONSTRAINT UK_Marca UNIQUE(nombre)
);

CREATE TABLE Producto(
    idProducto INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL,
    codigoBarras VARCHAR(50),
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(250),
    precioCompra DECIMAL(10,2) NOT NULL,
    precioVenta DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    stockMinimo INT DEFAULT 5,
    estado ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
    idCategoria INT NOT NULL,
    idMarca INT NOT NULL,
    CONSTRAINT UK_ProductoCodigo UNIQUE(codigo),
    CONSTRAINT UK_ProductoCodigoBarras UNIQUE(codigoBarras),
    CONSTRAINT CHK_PrecioCompra CHECK(precioCompra >= 0),
    CONSTRAINT CHK_PrecioVenta CHECK(precioVenta >= 0),
    CONSTRAINT CHK_Stock CHECK(stock >= 0),
    CONSTRAINT FK_ProductoCategoria FOREIGN KEY(idCategoria)
        REFERENCES Categoria(idCategoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_ProductoMarca FOREIGN KEY(idMarca)
        REFERENCES Marca(idMarca)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IDX_PRODUCTO_NOMBRE ON Producto(nombre);
CREATE INDEX IDX_PRODUCTO_CATEGORIA ON Producto(idCategoria);
CREATE INDEX IDX_PRODUCTO_MARCA ON Producto(idMarca);
CREATE INDEX IDX_CLIENTE_NOMBRE ON Cliente(nombres);
CREATE INDEX IDX_PROVEEDOR_RS ON Proveedor(razonSocial);
CREATE INDEX IDX_USUARIO_CORREO ON Usuario(correo);

CREATE TABLE Venta(
    idVenta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idCliente INT NOT NULL,
    idUsuario INT NOT NULL,
    tipoComprobante ENUM('BOLETA','FACTURA') NOT NULL DEFAULT 'BOLETA',
    serie VARCHAR(4),
    numero VARCHAR(8),
    metodoPago ENUM('EFECTIVO','TARJETA','YAPE','TRANSFERENCIA') NOT NULL DEFAULT 'EFECTIVO',
    estadoPago ENUM('PENDIENTE','PAGADO','OBSERVADO') NOT NULL DEFAULT 'PAGADO',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    igv DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado ENUM('REGISTRADA','ANULADA') DEFAULT 'REGISTRADA',
    observacion VARCHAR(250),
    CONSTRAINT UK_VentaComprobante UNIQUE(tipoComprobante, serie, numero),
    CONSTRAINT FK_VentaCliente FOREIGN KEY(idCliente)
        REFERENCES Cliente(idCliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_VentaUsuario FOREIGN KEY(idUsuario)
        REFERENCES Usuario(idUsuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IDX_VENTA_FECHA ON Venta(fecha);
CREATE INDEX IDX_VENTA_CLIENTE ON Venta(idCliente);
CREATE INDEX IDX_VENTA_PAGO ON Venta(metodoPago, estadoPago);

CREATE TABLE DetalleVenta(
    idDetalleVenta INT AUTO_INCREMENT PRIMARY KEY,
    idVenta INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT CHK_DV_CANTIDAD CHECK(cantidad > 0),
    CONSTRAINT FK_DetVentaVenta FOREIGN KEY(idVenta)
        REFERENCES Venta(idVenta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT FK_DetVentaProducto FOREIGN KEY(idProducto)
        REFERENCES Producto(idProducto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE ReclamoCliente(
    idReclamo INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idCliente INT NOT NULL,
    idVenta INT,
    idProducto INT,
    motivo VARCHAR(120) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    estado ENUM('REGISTRADO','EN_REVISION','ATENDIDO','CERRADO') NOT NULL DEFAULT 'REGISTRADO',
    idUsuario INT NOT NULL,
    observacion VARCHAR(250),
    CONSTRAINT FK_ReclamoCliente FOREIGN KEY(idCliente)
        REFERENCES Cliente(idCliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_ReclamoVenta FOREIGN KEY(idVenta)
        REFERENCES Venta(idVenta)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT FK_ReclamoProducto FOREIGN KEY(idProducto)
        REFERENCES Producto(idProducto)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT FK_ReclamoUsuario FOREIGN KEY(idUsuario)
        REFERENCES Usuario(idUsuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IDX_RECLAMO_CLIENTE ON ReclamoCliente(idCliente);
CREATE INDEX IDX_RECLAMO_FECHA ON ReclamoCliente(fecha);

CREATE TABLE Compra(
    idCompra INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    idProveedor INT NOT NULL,
    idUsuario INT NOT NULL,
    subtotal DECIMAL(10,2) DEFAULT 0,
    igv DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    estado ENUM('PENDIENTE','RECIBIDA','ANULADA') DEFAULT 'PENDIENTE',
    observacion VARCHAR(250),
    CONSTRAINT FK_CompraProveedor FOREIGN KEY(idProveedor)
        REFERENCES Proveedor(idProveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_CompraUsuario FOREIGN KEY(idUsuario)
        REFERENCES Usuario(idUsuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IDX_COMPRA_FECHA ON Compra(fecha);

CREATE TABLE DetalleCompra(
    idDetalleCompra INT AUTO_INCREMENT PRIMARY KEY,
    idCompra INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioCompra DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT CHK_DC_CANTIDAD CHECK(cantidad > 0),
    CONSTRAINT FK_DetCompraCompra FOREIGN KEY(idCompra)
        REFERENCES Compra(idCompra)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT FK_DetCompraProducto FOREIGN KEY(idProducto)
        REFERENCES Producto(idProducto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE SolicitudCotizacion(
    idSolicitudCotizacion INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    idProveedor INT NOT NULL,
    idUsuario INT NOT NULL,
    estado ENUM('PENDIENTE','RESPONDIDA','CANCELADA') DEFAULT 'PENDIENTE',
    observacion VARCHAR(250),
    CONSTRAINT FK_SCProveedor FOREIGN KEY(idProveedor)
        REFERENCES Proveedor(idProveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_SCUsuario FOREIGN KEY(idUsuario)
        REFERENCES Usuario(idUsuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE DetalleSolicitudCotizacion(
    idDetalleCotizacion INT AUTO_INCREMENT PRIMARY KEY,
    idSolicitudCotizacion INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2),
    CONSTRAINT FK_DSC FOREIGN KEY(idSolicitudCotizacion)
        REFERENCES SolicitudCotizacion(idSolicitudCotizacion)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_DSCProducto FOREIGN KEY(idProducto)
        REFERENCES Producto(idProducto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE SolicitudCompra(
    idSolicitudCompra INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    idProveedor INT NOT NULL,
    idUsuario INT NOT NULL,
    estado ENUM('PENDIENTE','APROBADA','RECHAZADA') DEFAULT 'PENDIENTE',
    observacion VARCHAR(250),
    CONSTRAINT FK_SCOMPProveedor FOREIGN KEY(idProveedor)
        REFERENCES Proveedor(idProveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_SCOMPUsuario FOREIGN KEY(idUsuario)
        REFERENCES Usuario(idUsuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE DetalleSolicitudCompra(
    idDetalleSolicitud INT AUTO_INCREMENT PRIMARY KEY,
    idSolicitudCompra INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT FK_DSCOMP FOREIGN KEY(idSolicitudCompra)
        REFERENCES SolicitudCompra(idSolicitudCompra)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_DSCOMPProducto FOREIGN KEY(idProducto)
        REFERENCES Producto(idProducto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE Recepcion(
    idRecepcion INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    idCompra INT NOT NULL,
    observacion VARCHAR(250),
    CONSTRAINT FK_RecepcionCompra FOREIGN KEY(idCompra)
        REFERENCES Compra(idCompra)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE DetalleRecepcion(
    idDetalleRecepcion INT AUTO_INCREMENT PRIMARY KEY,
    idRecepcion INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT FK_DRRecepcion FOREIGN KEY(idRecepcion)
        REFERENCES Recepcion(idRecepcion)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT FK_DRProducto FOREIGN KEY(idProducto)
        REFERENCES Producto(idProducto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE MovimientoInventario(
    idMovimiento INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    idProducto INT NOT NULL,
    tipoMovimiento ENUM('COMPRA','VENTA','AJUSTE','DEVOLUCION_COMPRA','DEVOLUCION_VENTA') NOT NULL,
    cantidad INT NOT NULL,
    stockAnterior INT NOT NULL,
    stockNuevo INT NOT NULL,
    referencia VARCHAR(50),
    observacion VARCHAR(250),
    idUsuario INT NOT NULL,
    CONSTRAINT FK_MIProducto FOREIGN KEY(idProducto)
        REFERENCES Producto(idProducto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_MIUsuario FOREIGN KEY(idUsuario)
        REFERENCES Usuario(idUsuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

INSERT INTO Rol(nombreRol) VALUES
('ADMINISTRADOR'),
('CAJERO'),
('ALMACEN'),
('ASISTENTE_COMPRAS');

INSERT INTO Usuario(nombres, apellidos, correo, passwordHash, idRol) VALUES
('Daniel Francisco', 'Aguirre Espinoza', 'daniel@datacell.local', 'Daniel123!', 1),
('Joel Alexander', 'Diaz Gutierrez', 'joel@datacell.local', 'Joel123!', 4),
('Luis Fabricio', 'Durand Durand', 'luis@datacell.local', 'Luis123!', 3),
('Stefano Jose', 'Gomez Medina', 'stefano@datacell.local', 'Stefano123!', 2),
('Gerardo Favian', 'Palacios Bazan', 'gerardo@datacell.local', 'Gerardo123!', 1);

INSERT INTO Cliente(nombres, apellidos, documento, direccion, telefono, correo) VALUES
('Cliente', 'Demo', '00000001', 'Lima', '900000001', 'cliente@datacell.local');

INSERT INTO Proveedor(ruc, razonSocial, direccion, contacto, telefono, correo) VALUES
('20123456789', 'Proveedor Demo SAC', 'Av. Tecnologia 123, Lima', 'Contacto Demo', '900000002', 'proveedor@datacell.local');

INSERT INTO Categoria(nombre) VALUES
('Cargadores'),
('Protectores');

INSERT INTO Marca(nombre) VALUES
('Samsung'),
('Apple'),
('Generico');

INSERT INTO Producto(codigo, codigoBarras, nombre, descripcion, precioCompra, precioVenta, stock, stockMinimo, idCategoria, idMarca) VALUES
('PROD-001', '7750001000012', 'Cargador USB-C 25W', 'Cargador rapido compatible', 35.00, 59.90, 20, 5, 1, 3),
('PROD-002', '7750001000029', 'Mica templada Galaxy A55', 'Protector de pantalla', 5.00, 14.90, 8, 10, 2, 1);
