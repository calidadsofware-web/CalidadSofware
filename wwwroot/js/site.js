(function () {
  const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function notify(message, type = "success") {
    const alert = document.createElement("div");
    alert.className = `toast-message toast-${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.classList.add("show"), 10);
    setTimeout(() => {
      alert.classList.remove("show");
      setTimeout(() => alert.remove(), 250);
    }, 2600);
  }

  function rowText(row) {
    return row.textContent.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  function normalize(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  function filterTable(scope) {
    const target = scope.dataset.target || "table";
    const table = document.querySelector(target);
    if (!table) return;

    const filters = Array.from(scope.querySelectorAll("[data-filter-field]"))
      .map((input) => normalize(input.value))
      .filter((value) => value && value !== "todos" && value !== "todas");

    Array.from(table.querySelectorAll("tbody tr")).forEach((row) => {
      const visible = filters.every((filter) => rowText(row).includes(filter));
      row.hidden = !visible;
    });
  }

  function clearFilters(scope) {
    scope.querySelectorAll("input, select").forEach((field) => {
      if (field.tagName === "SELECT") {
        field.selectedIndex = 0;
      } else {
        field.value = "";
      }
    });
    filterTable(scope);
  }

  function getProductFromButton(button) {
    return {
      code: button.dataset.code,
      name: button.dataset.name,
      description: button.dataset.description,
      stock: Number.parseInt(button.dataset.stock || "0", 10),
      price: Number.parseFloat(button.dataset.price || "0"),
      category: button.dataset.category || "",
      brand: button.dataset.brand || ""
    };
  }

  function operationTable() {
    return document.querySelector("[data-operation-table] tbody");
  }

  function addProductToOperation(product, quantity = 1) {
    const tbody = operationTable();
    if (!tbody) return;

    const existing = Array.from(tbody.rows).find((row) => row.dataset.productCode === product.code);
    if (existing) {
      const input = existing.querySelector("[data-quantity]");
      input.value = Math.min(10000, Number.parseInt(input.value || "0", 10) + quantity);
      recalcOperationTotals();
      notify(`${product.name} actualizado en la lista.`);
      return;
    }

    const mode = tbody.closest("[data-operation-table]").dataset.operationTable;
    const row = document.createElement("tr");
    row.dataset.productCode = product.code;
    row.dataset.productName = product.name;
    row.dataset.price = String(product.price);

    const code = escapeHtml(product.code);
    const name = escapeHtml(product.name);
    const safeQuantity = Math.min(10000, Math.max(1, Number.parseInt(quantity, 10) || 1));
    const stock = Math.max(0, Number.parseInt(product.stock, 10) || 0);

    if (mode === "cdp") {
      row.innerHTML = `
        <td class="fw-semibold">${code}</td>
        <td>${name}</td>
        <td class="text-end"><input class="form-control table-input" name="qty_${code}" data-quantity value="${safeQuantity}" min="1" max="10000" type="number" /></td>
        <td class="text-end">${money.format(product.price)}</td>
        <td class="text-end" data-line-total>${money.format(product.price * safeQuantity)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger" type="button" data-action="remove-row">Quitar</button></td>`;
    } else if (mode === "entry") {
      row.innerHTML = `
        <td>${name}</td>
        <td class="text-end">0</td>
        <td class="text-end"><input class="form-control table-input" name="received_${code}" data-quantity value="10" min="1" max="10000" type="number" /></td>
        <td><span class="status-pill status-warn">Nuevo</span></td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger" type="button" data-action="remove-row">Quitar</button></td>`;
    } else {
      row.innerHTML = `
        <td>${name}</td>
        <td class="text-end">${stock}</td>
        <td class="text-end">${Math.max(5, Math.round(stock * .15))}</td>
        <td class="text-end"><input class="form-control table-input" name="request_${code}" data-quantity value="10" min="1" max="10000" type="number" /></td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger" type="button" data-action="remove-row">Quitar</button></td>`;
    }

    tbody.appendChild(row);
    recalcOperationTotals();
    notify(`${product.name} agregado a la lista.`);
  }

  function recalcOperationTotals() {
    const table = document.querySelector('[data-operation-table="cdp"]');
    if (!table) return;

    let subtotal = 0;
    table.querySelectorAll("tbody tr").forEach((row) => {
      const price = Number.parseFloat(row.dataset.price || "0");
      const input = row.querySelector("[data-quantity]");
      const quantity = Math.min(10000, Math.max(1, Number.parseInt(input?.value || "1", 10) || 1));
      if (input) input.value = quantity;
      const lineTotal = price * quantity;
      subtotal += lineTotal;
      const totalCell = row.querySelector("[data-line-total]");
      if (totalCell) totalCell.textContent = money.format(lineTotal);
    });

    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    document.querySelectorAll("[data-subtotal]").forEach((el) => el.textContent = money.format(subtotal));
    document.querySelectorAll("[data-igv]").forEach((el) => el.textContent = money.format(igv));
    document.querySelectorAll("[data-total]").forEach((el) => el.textContent = money.format(total));
  }

  function openPreview() {
    const rows = Array.from(document.querySelectorAll("[data-operation-table] tbody tr"));
    const lines = rows.map((row) => {
      const name = row.dataset.productName || row.children[1]?.textContent || row.children[0]?.textContent;
      const qty = row.querySelector("[data-quantity]")?.value || "1";
      return `<li>${escapeHtml(name)} x ${escapeHtml(qty)}</li>`;
    }).join("");
    const total = document.querySelector("[data-total]")?.textContent || "";
    showDialog("Vista previa de la operacion", `<ul class="preview-list">${lines}</ul><strong>Total: ${total || "Segun evaluacion"}</strong>`);
  }

  function showDetailFromRow(button) {
    const row = button.closest("tr");
    if (!row) return;

    const table = row.closest("table");
    const headers = table
      ? Array.from(table.querySelectorAll("thead th")).map((header) => header.textContent.trim()).filter(Boolean)
      : [];
    const cells = Array.from(row.children)
      .map((cell) => cell.textContent.trim())
      .filter((cell) => cell && cell !== "Ver detalle" && cell !== "Seleccionar");
    const fields = cells.map((cell, index) => ({
      label: headers[index] && headers[index] !== "Accion" ? headers[index] : `Campo ${index + 1}`,
      value: cell
    }));

    showDialog("Detalle del registro", `
      <div class="record-detail">
        ${fields.map((field) => `
          <div class="record-detail-item">
            <span>${escapeHtml(field.label)}</span>
            <strong>${escapeHtml(field.value)}</strong>
          </div>`).join("")}
      </div>`);
  }

  function showDialog(title, html) {
    let modal = document.getElementById("actionDialog");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "actionDialog";
      modal.className = "modal fade";
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content search-modal">
            <div class="modal-header">
              <h2 class="modal-title fs-5" data-dialog-title></h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body" data-dialog-body></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Aceptar</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }

    modal.querySelector("[data-dialog-title]").textContent = title;
    modal.querySelector("[data-dialog-body]").innerHTML = html;
    modal.querySelector(".modal-footer").innerHTML = '<button type="button" class="btn btn-primary" data-bs-dismiss="modal">Aceptar</button>';
    bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  function quickCreate(type) {
    const title = {
      product: "Nuevo producto",
      supplier: "Nuevo proveedor",
      client: "Nuevo cliente"
    }[type] || "Nuevo registro";

    const body = {
      product: `
        <div class="quick-create-intro">Registre los datos principales del producto para incorporarlo al flujo actual.</div>
        <div class="form-grid quick-form">
          <div><label class="form-label">Codigo</label><input class="form-control" data-quick-code placeholder="Ej. PROD-007"></div>
          <div><label class="form-label">Nombre del producto</label><input class="form-control" data-quick-name placeholder="Ej. Cable USB-C reforzado"></div>
          <div><label class="form-label">Categoria</label><input class="form-control" data-quick-category placeholder="Ej. Cables"></div>
          <div><label class="form-label">Marca</label><input class="form-control" data-quick-brand placeholder="Ej. Generico"></div>
          <div><label class="form-label">Precio referencial</label><input class="form-control" data-quick-price type="number" min="0" step="0.01" placeholder="0.00"></div>
          <div><label class="form-label">Stock inicial</label><input class="form-control" data-quick-stock type="number" min="0" placeholder="0"></div>
          <div class="span-2"><label class="form-label">Descripcion</label><textarea class="form-control" data-quick-description rows="3" placeholder="Caracteristicas relevantes del producto"></textarea></div>
        </div>`,
      supplier: `
        <div class="quick-create-intro">Registre un proveedor para compras, cotizaciones y recepcion de mercaderia.</div>
        <div class="form-grid quick-form">
          <div><label class="form-label">RUC</label><input class="form-control" data-quick-code placeholder="Ej. 20123456789"></div>
          <div><label class="form-label">Razon social</label><input class="form-control" data-quick-name placeholder="Ej. Tecnologia Peru S.A.C."></div>
          <div><label class="form-label">Contacto</label><input class="form-control" data-quick-contact placeholder="Nombre del contacto"></div>
          <div><label class="form-label">Telefono</label><input class="form-control" data-quick-phone placeholder="Ej. 014478899"></div>
          <div class="span-2"><label class="form-label">Correo</label><input class="form-control" data-quick-email type="email" placeholder="ventas@proveedor.com"></div>
        </div>`,
      client: `
        <div class="quick-create-intro">Registre al cliente para ventas, reclamos e historial de atencion.</div>
        <div class="form-grid quick-form">
          <div><label class="form-label">Documento</label><input class="form-control" data-quick-code placeholder="DNI o RUC"></div>
          <div><label class="form-label">Nombres y apellidos</label><input class="form-control" data-quick-name placeholder="Nombre completo"></div>
          <div><label class="form-label">Telefono</label><input class="form-control" data-quick-phone placeholder="Ej. 987654321"></div>
          <div><label class="form-label">Correo</label><input class="form-control" data-quick-email type="email" placeholder="cliente@correo.com"></div>
          <div class="span-2"><label class="form-label">Direccion</label><input class="form-control" data-quick-description placeholder="Direccion referencial"></div>
        </div>`
    }[type] || `
      <div class="form-grid quick-form">
        <div><label class="form-label">Codigo</label><input class="form-control" data-quick-code></div>
        <div><label class="form-label">Nombre</label><input class="form-control" data-quick-name></div>
      </div>`;

    showDialog(title, body);
    const modal = document.getElementById("actionDialog");
    const footer = modal.querySelector(".modal-footer");
    footer.innerHTML = `
      <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
      <button type="button" class="btn btn-primary" data-action="confirm-quick-create" data-type="${type}">Guardar</button>`;
  }

  function confirmQuickCreate(button) {
    const type = button.dataset.type;
    const modal = document.getElementById("actionDialog");
    const code = modal.querySelector("[data-quick-code]").value;
    const name = modal.querySelector("[data-quick-name]").value;
    const description = modal.querySelector("[data-quick-description]")?.value || "";
    const category = modal.querySelector("[data-quick-category]")?.value || "Nuevo";
    const brand = modal.querySelector("[data-quick-brand]")?.value || "Generico";
    const price = Number.parseFloat(modal.querySelector("[data-quick-price]")?.value || "0") || 0;
    const stock = Number.parseInt(modal.querySelector("[data-quick-stock]")?.value || "0", 10) || 0;
    const contact = modal.querySelector("[data-quick-contact]")?.value || "Sin contacto";
    const phone = modal.querySelector("[data-quick-phone]")?.value || "---";
    const email = modal.querySelector("[data-quick-email]")?.value || "---";
    const recordLabel = {
      product: "Producto",
      supplier: "Proveedor",
      client: "Cliente"
    }[type] || "Registro";

    if (!code.trim() || !name.trim()) {
      notify("Complete los campos obligatorios antes de guardar.", "error");
      return;
    }

    if (type === "product") {
      if (document.querySelector("[data-operation-table]")) {
        addProductToOperation({
          code,
          name,
          description,
          stock,
          price,
          category,
          brand
        });
      }

      const tbody = document.querySelector("[data-search-table='products'] tbody");
      if (tbody) {
        tbody.insertAdjacentHTML("afterbegin", `
          <tr>
            <td class="fw-semibold">${escapeHtml(code)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(category)}</td><td>${escapeHtml(brand)}</td>
            <td class="text-end">${stock}</td><td class="text-end">${money.format(price)}</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-primary" type="button" data-action="show-row-detail">Ver detalle</button></td>
          </tr>`);
      }
    }

    if (type === "supplier") {
      const list = document.querySelector("[data-supplier-list]");
      if (list) {
        list.insertAdjacentHTML("beforeend", `<div><span>${escapeHtml(name)}</span><input type="hidden" name="proveedor" value="${escapeHtml(name)}"><button class="btn btn-sm btn-link" type="button" data-action="remove-row">Quitar</button></div>`);
      }
      const tbody = document.querySelector("[data-search-table='suppliers'] tbody");
      if (tbody) {
        tbody.insertAdjacentHTML("afterbegin", `<tr><td class="fw-semibold">${escapeHtml(code)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(contact)}</td><td>${escapeHtml(phone)}</td><td>${escapeHtml(email)}</td><td>Activo</td><td class="text-end"><button class="btn btn-sm btn-outline-primary" type="button" data-action="select-supplier">Seleccionar</button></td></tr>`);
      }
    }

    if (type === "client") {
      const tbody = document.querySelector("[data-search-table='clients'] tbody");
      if (tbody) {
        tbody.insertAdjacentHTML("afterbegin", `<tr><td class="fw-semibold">${escapeHtml(code)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(phone)}</td><td>${escapeHtml(email)}</td><td>Sin compras</td><td>Activo</td><td class="text-end"><button class="btn btn-sm btn-outline-primary" type="button" data-action="select-client">Seleccionar</button></td></tr>`);
      }
      const clientInput = document.querySelector("input[name='cliente']");
      if (clientInput) clientInput.value = name;
    }

    bootstrap.Modal.getOrCreateInstance(modal).hide();
    notify(`${recordLabel} guardado en el prototipo.`);
  }

  function exportTable(format) {
    const table = document.querySelector("[data-export-table]") || document.querySelector("table");
    if (!table) return;

    if (format === "pdf") {
      window.print();
      notify("Use la opcion Guardar como PDF del cuadro de impresion.");
      return;
    }

    const rows = Array.from(table.querySelectorAll("tr"))
      .map((row) => Array.from(row.children).map((cell) => `"${cell.textContent.trim().replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "datacell-reporte.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Reporte exportado en CSV compatible con Excel.");
  }

  document.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;

    if (action === "filter") {
      event.preventDefault();
      const scope = actionButton.closest("[data-filter-scope]") || document.querySelector("[data-filter-scope]");
      if (scope) filterTable(scope);
    }

    if (action === "clear-filter") {
      event.preventDefault();
      const scope = actionButton.closest("[data-filter-scope]") || document.querySelector("[data-filter-scope]");
      if (scope) clearFilters(scope);
    }

    if (action === "select-product") {
      addProductToOperation(getProductFromButton(actionButton));
      const modal = actionButton.closest(".modal");
      if (modal) bootstrap.Modal.getOrCreateInstance(modal).hide();
    }

    if (action === "add-first-product") {
      const selected = Array.from(document.querySelectorAll("#productSearchModal [data-action='select-product']"))
        .find((button) => !button.closest("tr")?.hidden);
      if (selected) addProductToOperation(getProductFromButton(selected));
      const modal = document.getElementById("productSearchModal");
      if (modal) bootstrap.Modal.getOrCreateInstance(modal).hide();
    }

    if (action === "remove-row") {
      actionButton.closest("tr, div")?.remove();
      recalcOperationTotals();
      notify("Elemento retirado.");
    }

    if (action === "preview") {
      openPreview();
    }

    if (action === "show-row-detail") {
      showDetailFromRow(actionButton);
    }

    if (action === "select-supplier" || action === "select-client") {
      showDetailFromRow(actionButton);
      notify(action === "select-supplier" ? "Proveedor seleccionado." : "Cliente seleccionado.");
    }

    if (action === "quick-create") {
      quickCreate(actionButton.dataset.type);
    }

    if (action === "confirm-quick-create") {
      confirmQuickCreate(actionButton);
    }

    if (action === "export") {
      exportTable(actionButton.dataset.format);
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-quantity]")) {
      recalcOperationTotals();
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-filter-scope]");
    if (form && form.matches("form[method='get']")) {
      event.preventDefault();
      filterTable(form);
    }
  });

  document.addEventListener("reset", () => {
    setTimeout(recalcOperationTotals, 0);
  });

  recalcOperationTotals();
})();
