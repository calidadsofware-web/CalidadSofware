import type { AppUser } from "../auth.js";
import { POLICIES, requireRole } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import {
  documentField,
  emailField,
  moneyField,
  numberField,
  optionField,
  phoneField,
  textField,
  type Fields,
} from "./fields.js";

export async function saveClient(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.sales);
  const values = [
    textField(input.firstName, "Nombres o razón social", 80, true),
    textField(input.lastName, "Apellidos", 80, input.documentType !== "RUC"),
    documentField(input.document, input.documentType),
    textField(input.address, "Dirección", 150, input.documentType === "RUC"),
    phoneField(input.phone),
    emailField(input.email),
    optionField(input.status ?? "ACTIVO", ["ACTIVO", "INACTIVO"], "Estado"),
  ];
  return withTransaction(async (client) => {
    if (input.id) {
      const result = await client.query(
        "update public.clientes set nombres=$1, apellidos=$2, documento=$3, direccion=$4, telefono=$5, correo=$6, estado=$7 where id_cliente=$8 returning id_cliente",
        [...values, numberField(input.id, "Cliente", 1, true)],
      );
      if (!result.rowCount) throw new HttpError(404, "El cliente ya no existe.");
    } else {
      await client.query(
        "insert into public.clientes(nombres,apellidos,documento,direccion,telefono,correo,estado) values($1,$2,$3,$4,$5,$6,$7)",
        values,
      );
    }
    return input.id ? "Cliente actualizado." : "Cliente registrado.";
  });
}

export async function saveSupplier(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.quotations);
  const values = [
    documentField(input.ruc, "RUC"),
    textField(input.businessName, "Razón social", 150, true),
    textField(input.contact, "Contacto", 100, true),
    phoneField(input.phone),
    emailField(input.email),
    textField(input.address, "Dirección", 150, true),
    optionField(input.status ?? "ACTIVO", ["ACTIVO", "INACTIVO"], "Estado"),
  ];
  return withTransaction(async (client) => {
    if (input.id) {
      const result = await client.query(
        "update public.proveedores set ruc=$1, razon_social=$2, contacto=$3, telefono=$4, correo=$5, direccion=$6, estado=$7 where id_proveedor=$8 returning id_proveedor",
        [...values, numberField(input.id, "Proveedor", 1, true)],
      );
      if (!result.rowCount) throw new HttpError(404, "El proveedor ya no existe.");
    } else
      await client.query(
        "insert into public.proveedores(ruc,razon_social,contacto,telefono,correo,direccion,estado) values($1,$2,$3,$4,$5,$6,$7)",
        values,
      );
    return input.id ? "Proveedor actualizado." : "Proveedor registrado.";
  });
}

export async function saveProduct(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.warehouse);
  const code = textField(input.code, "SKU", 30, true).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(code))
    throw new HttpError(400, "El SKU admite letras, números, guiones y guiones bajos.");
  const name = textField(input.name, "Producto", 120, true);
  const category = textField(input.category, "Categoría", 80, true);
  const brand = textField(input.brand, "Marca", 80, true);
  const price = moneyField(input.price, "Precio de venta", 0.01);
  const cost = moneyField(input.cost, "Costo de compra");
  const initialStock = input.originalCode
    ? 0
    : numberField(input.initialStock ?? 0, "Stock inicial", 0, true);
  const minStock = numberField(input.minStock, "Stock mínimo", 0, true);
  const status = optionField(input.status ?? "ACTIVO", ["ACTIVO", "INACTIVO"], "Estado");
  const barcode = textField(input.barcode, "Código de barras", 50) || null;
  const description = textField(input.description, "Descripción", 250);
  return withTransaction(async (client) => {
    const categoryId = (
      await client.query<{ id_categoria: number }>(
        "insert into public.categorias(nombre) values($1) on conflict(nombre) do update set nombre=excluded.nombre returning id_categoria",
        [category],
      )
    ).rows[0].id_categoria;
    const brandId = (
      await client.query<{ id_marca: number }>(
        "insert into public.marcas(nombre) values($1) on conflict(nombre) do update set nombre=excluded.nombre returning id_marca",
        [brand],
      )
    ).rows[0].id_marca;
    const values = [code, name, barcode, description, cost, price, minStock, status, categoryId, brandId];
    if (input.originalCode) {
      if (status === "INACTIVO") {
        const original = (
          await client.query<{ id_producto: number }>(
            "select id_producto from public.productos where codigo=$1 for update",
            [textField(input.originalCode, "SKU original", 30, true)],
          )
        ).rows[0];
        if (original) {
          const pending = await client.query(
            "select 1 from public.detalles_compra dc join public.compras c on c.id_compra=dc.id_compra where dc.id_producto=$1 and c.estado in ('PENDIENTE','PARCIAL') limit 1",
            [original.id_producto],
          );
          if (pending.rowCount)
            throw new HttpError(
              409,
              "El producto tiene órdenes de compra pendientes. Completa su recepción antes de inactivarlo.",
            );
        }
      }
      const result = await client.query(
        "update public.productos set codigo=$1,nombre=$2,codigo_barras=$3,descripcion=$4,precio_compra=$5,precio_venta=$6,stock_minimo=$7,estado=$8,id_categoria=$9,id_marca=$10 where codigo=$11 returning id_producto",
        [...values, textField(input.originalCode, "SKU original", 30, true)],
      );
      if (!result.rowCount) throw new HttpError(404, "El producto ya no existe.");
    } else {
      const row = (
        await client.query<{ id_producto: number }>(
          "insert into public.productos(codigo,nombre,codigo_barras,descripcion,precio_compra,precio_venta,stock_minimo,estado,id_categoria,id_marca,stock) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id_producto",
          [...values, initialStock],
        )
      ).rows[0];
      if (initialStock)
        await client.query(
          "insert into public.movimientos_inventario(id_producto,tipo_movimiento,cantidad,stock_anterior,stock_nuevo,observacion,id_usuario) values($1,'AJUSTE',$2,0,$2,'Carga de inventario inicial',$3)",
          [row.id_producto, initialStock, user.id],
        );
    }
    return input.originalCode ? "Producto actualizado." : "Producto registrado con su inventario inicial.";
  });
}

export async function adjustStock(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.warehouse);
  const code = textField(input.code, "Producto", 30, true);
  const stock = numberField(input.stock, "Stock contado", 0, true);
  const expected = numberField(input.expectedStock, "Stock anterior", 0, true);
  const notes = textField(input.notes, "Motivo del ajuste", 500, true);
  return withTransaction(async (client) => {
    const row = (
      await client.query<{ id_producto: number; stock: number }>(
        "select id_producto,stock from public.productos where codigo=$1 and estado='ACTIVO' for update",
        [code],
      )
    ).rows[0];
    if (!row) throw new HttpError(404, "Producto no disponible.");
    if (row.stock !== expected)
      throw new HttpError(
        409,
        "El stock cambió desde que abriste el formulario. Actualiza y vuelve a contar.",
      );
    if (row.stock === stock)
      throw new HttpError(400, "El conteo coincide con el stock actual; no se necesita un ajuste.");
    await client.query("update public.productos set stock=$1 where id_producto=$2", [stock, row.id_producto]);
    await client.query(
      "insert into public.movimientos_inventario(id_producto,tipo_movimiento,cantidad,stock_anterior,stock_nuevo,observacion,id_usuario) values($1,'AJUSTE',$2,$3,$4,$5,$6)",
      [row.id_producto, Math.abs(stock - row.stock), row.stock, stock, notes, user.id],
    );
    return "Ajuste de inventario registrado con su motivo y responsable.";
  });
}
