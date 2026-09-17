---
name: open-pr
description: Abre un Pull Request en GitHub con gh CLI para este repo, armando título y descripción desde el diff real de la branch actual vs main. Adaptación a GitHub del skill personal open-mr (GitLab) del usuario.
user-invocable: true
---

# open-pr — Abrir Pull Request en GitHub

Adaptación a este repo (GitHub, no GitLab) del skill personal `open-mr` del
usuario. Este repo no usa `glab`, no tiene el label fijo `qa::review` de
Nearpod, y no tiene tickets de Jira — esas partes del skill original no se
tradujeron 1:1 porque no aplican, se quitaron.

## Cuándo usarla

Se pide abrir/crear un Pull Request para la branch en la que se está
trabajando, **después** de que los commits ya fueron aprobados y pusheados
(ver skill `dev-workflow` — nunca abrir un PR con cambios sin aprobar).

## Inputs

- **Branch actual (source)** — normalmente ya se sabe por el contexto.
- **Target branch** — default `main` (es la rama que dispara el CI de este
  repo, ver `.github/workflows/cypress.yml`), salvo que se indique otra.
- **Labels** — no hay un label fijo obligatorio en este repo (a diferencia
  del `qa::review` del skill original de GitLab). Si se pide un label
  específico, se agrega; si no, no se agrega ninguno.

## Pasos

1. **Verificar `gh`**
   ```bash
   gh auth status
   ```
   Si no está autenticado, avisar y detenerse — no intentar loguear.

2. **Verificar que no hay trabajo pendiente sin subir**
   ```bash
   git status
   git log origin/<source>..<source> --oneline   # commits sin pushear
   ```
   Si hay commits locales sin push o cambios sin commitear, avisar y
   confirmar antes de pushear.

3. **Determinar el target branch**
   ```bash
   git branch -a | grep -E "main|master"
   ```
   Default `main`.

4. **Armar título y descripción desde el diff real — nunca genérico**
   ```bash
   git log <target>..<source> --oneline
   git diff <target>...<source> --stat
   ```
   - Un solo commit → el título del PR puede basarse directamente en su
     mensaje.
   - Varios commits → sintetizar un título corto (menos de 70 caracteres)
     que resuma el conjunto.
   - Sin prefijo de ticket — este repo no tiene sistema de tickets.
   - Descripción con este formato:
     ```markdown
     ## Summary
     - <bullet basado en el diff real, no relleno genérico>

     ## Test plan
     - [x] `npx tsc --noEmit` pasa
     - [x] `npx cypress run --browser chrome --spec "<spec afectado>"` pasa
       (ver skill/agente `e2e-verifier` — no marcar esto sin haberlo corrido)
     ```

5. **Crear el PR**
   ```bash
   gh pr create \
     --base <target> \
     --head <source> \
     --title "<título>" \
     --body "<descripción con heredoc>" \
     [--label "<label>"]   # solo si se pidió uno explícitamente
   ```

6. **Devolver el link** que imprime `gh pr create` — eso es lo que importa,
   no el output crudo del comando.

## Criterios de éxito

- El PR queda creado en GitHub con una URL devuelta.
- Título y descripción reflejan los cambios reales del diff.
- El "Test plan" de la descripción refleja verificación real (`tsc` +
  `cypress run` ya corridos), no una casilla marcada sin haber corrido nada.

## Pitfalls / reglas duras

- Nunca pushear código sin avisar primero si hay cambios sin subir.
- No inventar contexto de negocio (ticket, motivo) que no esté en los
  commits o en lo que se dijo en la conversación.
- Este flujo es para GitHub (`gh`). Si el remoto de este repo alguna vez
  cambia a GitLab, usar el skill personal `open-mr` original en su lugar,
  no este.
