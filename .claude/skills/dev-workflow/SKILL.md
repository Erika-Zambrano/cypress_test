---
name: dev-workflow
description: Recuerda y aplica el workflow de desarrollo de este repo (Cypress + TypeScript) — branch, implementación, mostrar cambios, esperar aprobación, commit. Sin Jira ni sistema de docs con IDs/fases, adaptado a un repo chico de un solo escenario E2E principal.
user-invocable: true
---

# dev-workflow — Proceso de desarrollo de este repo

Versión simplificada, hecha a medida de este repo específico. No asume Jira,
ticket IDs, ni un sistema de documentos de implementación con fases — este es
un repo de un escenario E2E principal, no una migración multi-tarea.

## Cuándo usarla

Al empezar cualquier cambio no trivial (nuevo Page Object, nuevo escenario,
cambio de CI, nueva dependencia) o si se va a hacer un commit sin haber
mostrado antes los cambios y sin aprobación explícita.

## El flujo

1. **Branch** — un branch por cambio, nombre corto en kebab-case describiendo
   el cambio (ej. `add-negative-cart-scenario`, `fix-alert-race`). Sin
   prefijo numérico de ticket — este repo no tiene sistema de tickets.
2. **Implementar** — seguir las convenciones ya establecidas en el README
   (secciones "Page Object Model" y "Test Stability"): sin `cy.wait()` fijo,
   sin XPath, sin selectores basados en estilos, datos dinámicos desde la UI
   o desde `productTexts.json`, nunca hardcodeados.
3. **Verificar antes de mostrar cambios como terminados**:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run format:check
   npx cypress run --browser chrome --spec "<spec afectado>"
   ```
   No reportar algo como "listo" solo porque compila o porque el lint pasa —
   tiene que correr de verdad contra `https://www.demoblaze.com` y mostrar
   `All specs passed!`. Si `format:check` falla, correr `npm run format`
   antes de mostrar el diff final (no dejar código sin formatear).
4. **Mostrar cambios y ESPERAR APROBACIÓN** — resumen de qué cambió, archivos
   tocados, evidencia real de que corrió en verde. Preguntar explícitamente
   antes de hacer el commit. Nunca commitear automáticamente, aunque se pida
   "hazlo tú".
5. **Commit** — mensaje en inglés, formato `tipo: descripción breve`
   (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`), sin cuerpo
   salvo que agregue contexto real que no esté en el diff.
6. **README** — si el cambio afecta comandos, estructura de carpetas, CI, o
   agrega una decisión de arquitectura, actualizar el README en el mismo
   commit del código (este repo no separa commits de código y de docs).

## Reglas duras

- Nunca commitear sin aprobación explícita.
- Nunca dar un cambio por terminado sin haberlo corrido contra el sitio real,
  no basta con que compile o con que "se vea bien".
- No agregar una dependencia nueva sin decirlo explícitamente y justificar
  por qué lo nativo de Cypress no alcanza (ver README → Tech Stack:
  dependencias al mínimo).
- Limpiar `cypress/videos/` y `cypress/screenshots/` generados durante la
  verificación antes de dar el cambio por terminado — son artifacts
  gitignorados, no parte del entregable.
