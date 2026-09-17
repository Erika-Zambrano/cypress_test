# Repo roadmap — recommendations by priority

Análisis del repo completo hecho el 2026-09-18. Todo lo de abajo es una
recomendación para evaluar, no algo implementado. Los hallazgos marcados
como "evidencia" se verificaron corriendo comandos reales contra este repo,
no son suposiciones.

No repite lo que ya está en `README.md` → "Future Improvements" o
"AI → Future AI ideas" — esos ya existen, esto es un análisis nuevo y más
concreto, con evidencia.

---

## P0 — Seguridad y correctitud (hacer primero)

### 1. Vulnerabilidades reales en dependencias transitivas de Cypress

**Evidencia** (`npm audit`, corrido en este repo):
```
5 vulnerabilities (3 moderate, 2 high)
- extract-zip (HIGH) — symlink path traversal / arbitrary file write
- @cypress/request → uuid (MODERATE) — buffer bounds check
- qs (MODERATE) — DoS vía qs.stringify
```
Las 4 vienen empaquetadas dentro de `cypress@13.17.0` (la versión que
tenemos pineada con `^13.6.0`), no de algo que agregamos nosotros. La
versión más nueva de Cypress en npm hoy es **16.1.0** — tres majors por
delante.

**Recomendación**: evaluar el upgrade a Cypress 16.x. **No** correr
`npm audit fix --force` a ciegas — es un cambio de major version, puede
romper el `specPattern`/config actual o algún comportamiento de
`cy.intercept`/`findByRole`. Requiere: actualizar `package.json`, correr
`npx tsc --noEmit`, correr los 2 specs reales en Chrome, y revisar el
changelog de Cypress 14/15/16 por breaking changes antes de mergear.

### 2. Los secrets de Slack todavía no están configurados en GitHub

Ya lo mencioné al terminar el CI, sigue pendiente: `SLACK_WEBHOOK_URL`
(Secret) y `TEST_OWNER_TAG` (Variable) en
Settings → Secrets and variables → Actions. Sin esto, si el job
`notify-on-failure` llega a correr, el `curl` va a fallar por falta del
webhook — es decir, hoy el camino de notificación de fallo está sin probar
en producción.

### 3. Inconsistencia real entre el trigger de CI y "protección de main"

El CI corre **solo** post-merge (`push` a `main`), decisión explícita que
tomamos. Consecuencia real: si alguien configura "branch protection" en
GitHub pidiendo que los checks de CI pasen antes de mergear, **no va a
encontrar ningún check corriendo en el PR** — porque no hay ningún workflow
que dispare con `pull_request`. Si en algún momento se quiere un gate real
antes de mergear, hay que agregar un trigger `pull_request` aparte (ver
`README.md` → CI Pipeline para el razonamiento de por qué se decidió así).

---

## P1 — Cobertura de test (corto plazo)

### 4. Cero escenarios negativos — solo existe el camino feliz

El único spec funcional agrega 2 productos y valida el total. No hay ningún
test que:
- Elimine un producto del carrito y confirme que el total se recalcula.
- Deje el carrito vacío y confirme el estado/mensaje correspondiente.
- Intente "Place Order" (el modal de checkout) — ese flujo no se toca en
  ningún test hoy.

`CartPage.removeAllProducts()`/`assertCartIsEmpty()` ya existen y se usan
en el cleanup del `beforeEach` — reusarlos como base de un test negativo es
casi gratis, la lógica ya está escrita.

### 5. Lint que ya hubiera atrapado un typo real

**Evidencia**: en `cypress/e2e/add-products-to-cart.cy.ts`, líneas 50 y 77:
```ts
cy.step('Adding first phone to the cart')   // falta punto y coma
...
cy.step('Adding laptop to the cart')        // falta punto y coma
```
Funciona por ASI (automatic semicolon insertion), pero es inconsistente con
el resto del archivo. Sin ESLint/Prettier corriendo, este tipo de cosas no
se detecta sola — ver punto 7.

---

## P1 — Tooling / DX

### 6. Sin Node pineado localmente

No hay `.nvmrc` ni `"engines"` en `package.json`. El CI usa Node 20
explícito (`actions/setup-node@v4` con `node-version: 20`); localmente
cualquiera puede estar en otra versión sin enterarse hasta que algo falle
distinto en CI que en su máquina.

### 7. ~~Sin ESLint ni Prettier~~ — IMPLEMENTADO

`eslint.config.js` (flat config) con `@typescript-eslint` recomendado (sin
type-checking, para no requerir `parserOptions.project`),
`eslint-plugin-cypress`, `eslint-plugin-chai-friendly` (para que
`expect(x).to.exist` no dispare `no-unused-expressions`), y
`eslint-config-prettier` al final para no chocar con Prettier. Scripts:
`npm run lint` / `lint:fix` / `format` / `format:check`. El typo del punto 5
ya está corregido — se detectó y arregló corriendo `npm run format` con
este mismo setup.

### 8. CI no cachea el binario de Cypress

Cada corrida de `.github/workflows/cypress.yml` reinstala el binario de
Cypress desde cero (~200MB) porque no hay `actions/cache` sobre
`~/.cache/Cypress`, solo se cachea `npm` vía `setup-node`. Es la causa más
común de que un CI de Cypress tarde más de lo necesario.

### 9. Sin `timeout-minutes` ni `concurrency` en el workflow

Si alguien pushea dos veces seguido a `main`, ambos runs completos corren
en paralelo sin cancelarse entre sí (gasta minutos de CI). Y ningún job
tiene `timeout-minutes`, así que un hang silencioso consumiría el máximo
default de GitHub (6 horas) antes de fallar.

---

## P2 — Pulido / nice-to-have

### 10. Sin LICENSE

El repo no tiene archivo de licencia. Importa si en algún momento se
comparte o se hace público de verdad (ya está pusheado a GitHub).

### 11. Sin badge de estado de CI en el README

Un badge (`![Cypress E2E](.../actions/workflows/cypress.yml/badge.svg)`) al
tope del README es gratis y comunica el estado sin tener que entrar a
Actions.

### 12. Sin reporte estructurado de test (aunque pase)

Hoy, si todo pasa, la única evidencia es el log crudo de la terminal. Un
reporter (Mochawesome/JUnit) publicado como artifact en cada corrida —no
solo en fallos— daría un historial navegable sin depender de los logs de
GitHub Actions.

### 13. Sin Dependabot/Renovate

Nada avisa automáticamente cuando `cypress`, `typescript`, etc. tienen una
versión nueva. El drift de versión que causó el punto 1 (Cypress 13.x vs
16.x actual) se hubiera visto venir con un PR automático de Dependabot en
vez de descubrirse recién en este análisis.

### 14. Cross-browser testing

No está en el `README.md` → "Future Improvements" actual (se enfoca en
paralelización, reporting, tagging). Correr también en Firefox/Edge en CI
sería un paso natural si el proyecto crece más allá de la validación en
Chrome que pide el alcance actual.

---

## Ya documentado en otro lado — no repetido acá

- Escenarios negativos adicionales, reporting estructurado, tagging de
  suites (smoke/sanity/regression), plataforma de visual regression,
  integración con test management tool → `README.md` → "Future
  Improvements".
- Skill `full-code-review`, agentes acotados por archivo (ej.
  `productVariables`), bot de review de PRs en GitHub → `README.md` → "AI →
  Future AI ideas".
