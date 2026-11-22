# Pruebas E2E – Flujo crítico "Registrar venta" (Actividad 08)

Automatización con **Playwright 1.56** del flujo principal de DataCell: inicio de sesión del cajero y registro de una venta en mostrador.

## Estructura

```
e2e/
├── playwright.config.ts      # Configuración (navegador, reportes, servidor local)
├── package.json              # Scripts: test:e2e, test:e2e:headed, report
├── data/venta.data.ts        # Entradas de prueba y resultados esperados
├── pages/                    # Page Objects (selectores y acciones por pantalla)
│   ├── LoginPage.ts
│   ├── SalePage.ts
│   └── PaymentsPage.ts
├── tests/flujo-venta.spec.ts # Casos CP01–CP05 con pasos y validaciones
├── utils/evidence.ts         # Captura y numeración de evidencias
├── evidencias/               # Capturas por caso (generadas al ejecutar)
└── reports/                  # Reporte HTML, JSON y salida de consola
```

## Ejecución

```bash
cd web && npm install          # dependencias de la aplicación (una vez)
cd ../e2e && npm install
npx playwright install chromium
npm run test:e2e               # levanta "npm run dev:local" automáticamente
npm run report                 # abre el reporte HTML
```

El servidor local usa PGlite con las cuentas de demostración (`caja@local.test`). No toca Supabase ni datos de producción. Para repetir la ejecución con el stock inicial de las semillas, borrar `web/.local-data/`.

## Casos

| ID | Caso | Tipo |
|---|---|---|
| CP01 | Login con contraseña incorrecta | Negativo |
| CP02 | Login exitoso del cajero y menú por rol | Positivo |
| CP03 | Venta completa en efectivo (totales, stock, historial) | Positivo – flujo principal |
| CP04 | Efectivo insuficiente | Negativo |
| CP05 | Cantidad mayor al stock disponible | Límite |
