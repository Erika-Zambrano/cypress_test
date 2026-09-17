---
name: add-e2e-scenario
description: Agrega un nuevo escenario E2E a este repo de Cypress + TypeScript siguiendo las convenciones ya establecidas (POM clásico, fixtures sin hardcode, cy.intercept en vez de cy.wait fijo, cy.step/cy.section, alias de import). Úsala cuando se pida un spec nuevo o extender el flujo existente con más casos.
user-invocable: true
---

# add-e2e-scenario — Agregar un nuevo escenario E2E a este repo

Este repo tiene convenciones ya decididas a lo largo de varias iteraciones,
varias descubiertas inspeccionando el comportamiento real de
demoblaze.com. Esta skill existe para que un escenario nuevo las siga
automáticamente en vez de tener que redescubrirlas o repetirlas.

## Reglas duras del repo (no negociables sin confirmar antes)

- **Sin XPath, sin selectores basados en estilos/clases visuales.** Preferir,
  en este orden: rol accesible (`cy.findByRole(role, { name })`, vía
  `@testing-library/cypress`) cuando el elemento tiene semántica real (link,
  button); si no aplica, atributos funcionales (`onclick^="algo("`, ids
  estructurales del markup real) — nunca inventados, siempre verificados
  contra el DOM real del sitio antes de usarlos.
- **Sin `cy.wait(<ms>)` fijo, nunca.** Este sitio tiene condiciones de
  carrera conocidas y ya resueltas con `cy.intercept` + `cy.wait('@alias')`:
  - **Cambio de categoría** (`byCat`): hace `$('#tbodyid').empty()` y luego
    reinserta vía `POST **/bycat`. Una `cy.get().should(...)` sola puede
    pasar en falso contra el contenido viejo antes del swap. Reusar
    `HomePage.navigateToCategory` en vez de reimplementar el click.
  - **Borrar del carrito** (`deleteItem`): hace `location.reload()` tras
    `POST **/deleteitem`. Reusar la lógica interna de `CartPage`, no asumir
    que un simple `.click()` + assertion alcanza.
  - **Cargar el carrito**: depende de `POST **/viewcart`. Usar
    `cartPage.watchForCartLoad()` (antes de navegar) y
    `cartPage.waitForCartToLoad()` (después), en ese orden.
- **Nada de nombres o precios de producto hardcodeados.** Se capturan en
  runtime desde `ProductDetailPage`/`CartPage` y se comparan entre sí — el
  catálogo público puede cambiar. Los únicos valores fijos van en
  `cypress/fixtures/productVariables/productTexts.json` (categorías,
  índices, textos de alert/navegación), nunca un nombre o precio real.
- **El orden de las filas del carrito no está garantizado.** Si el escenario
  valida más de un producto, comparar por nombre+precio contra el set
  esperado, no por índice de fila fijo (ver el `cy.then()` final de
  `add-products-to-cart.cy.ts` como referencia).
- **Alertas nativas del browser** se validan con `alertComponent` (`cy.stub()`
  sobre `window:alert` + `cy.wrap(stub).should('have.been.calledWith', ...)`),
  nunca con un Page Object de modal HTML.

## Estructura a seguir

1. **¿El flujo toca una pantalla nueva?** Crear un Page Object en
   `cypress/pageObjects/`, una responsabilidad por archivo, exportando la
   clase + una instancia lista (`export const xPage = new XPage();`), igual
   que los ya existentes (`HomePage`, `CategoryPage`, `ProductDetailPage`,
   `CartPage`, `HeaderComponent`, `AlertComponent`). Si reusa pantallas
   existentes, no crear nada nuevo.
2. **Datos estables nuevos** (nombres de categoría, textos, índices) van al
   fixture `productTexts.json` + su tipo correspondiente en
   `cypress/support/types.ts`. Nunca hardcodeados directamente en el spec.
3. **Imports** usan los alias configurados en `tsconfig.json`
   (`@pageObjects/*`, `@support/*`), no rutas relativas del estilo
   `../pageObjects/X`.
4. **Marcar el flujo con `cy.step('...')`** por cada bloque lógico, y
   `cy.section('...')` si hay una fase de setup separada del flujo
   principal — mismo patrón que `add-products-to-cart.cy.ts`.
5. **Las assertions de negocio van en el spec**, no en el Page Object. El
   Page Object solo expone acciones y queries, y a lo sumo un
   `assertIsLoaded()` básico de disponibilidad de pantalla.
6. **Verificar de verdad antes de reportar terminado**:
   ```bash
   npx tsc --noEmit
   npx cypress run --browser chrome --spec "<ruta del spec nuevo o afectado>"
   ```
   No basta con que compile — tiene que correr contra el sitio real.

## Qué NO hacer

- No agregar una dependencia nueva sin justificarlo explícitamente (el repo
  ya tiene la mínima necesaria: `cypress`, `typescript`,
  `@testing-library/cypress`, `cypress-plugin-steps`).
- No crear un segundo spec funcional sin necesidad real — el repo está
  pensado para un escenario principal por archivo. Si el caso nuevo es una
  variante del mismo flujo, evaluar si va como `it()` adicional en el mismo
  `describe` antes de crear un archivo separado (ver "Scalability Approach"
  del README para el criterio smoke/sanity/regression).
- No reintroducir un método que duplique una acción que ya vive en otro Page
  Object — por ejemplo, cualquier click al header va solo en
  `HeaderComponent`, nunca envuelto de nuevo en otro Page Object.
