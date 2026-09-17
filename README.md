# Demoblaze E2E Automation

## Objective

This repository automates a single critical E2E scenario against the public
Demoblaze demo store: add the first phone from the `Phones` category and the
second laptop from the `Laptops` category to the cart, then validate that both
product names, both product prices, and the cart total shown on the cart page
match what was captured live from the UI during the run.

## Application Under Test

- URL: https://www.demoblaze.com/

## Tech Stack

- Cypress
- TypeScript
- Classic Page Object Model
- GitHub Actions (CI)
- Google Chrome (local and CI execution)
- Slack Incoming Webhooks (CI failure notifications)

## Project Structure

```text
cypress/
  e2e/
    add-products-to-cart.cy.ts       Main functional E2E scenario
    visual/
      home-page-visual.cy.ts         Independent visual snapshot test
  fixtures/
    productVariables/
      productTexts.json              Stable text/index fixtures (no product data)
  pageObjects/
    HomePage.ts                      Home page navigation and load state
    CategoryPage.ts                  Category product listing
    ProductDetailPage.ts             Product detail page
    CartPage.ts                      Cart page state and content
    HeaderComponent.ts               Shared header navigation (Cart / Home)
    AlertComponent.ts                Native browser alert handling
  support/
    commands.ts                      Reserved for custom Cypress commands
    e2e.ts                           Cypress support entry point
    priceUtils.ts                    Typed helper to parse UI price labels
    types.ts                         Shared TypeScript types (fixture shape)
.github/
  workflows/
    cypress.yml                      CI pipeline definition
.claude/
  skills/
    dev-workflow/SKILL.md            This repo's branch/commit/approval workflow
    add-e2e-scenario/SKILL.md        Checklist for adding a new E2E scenario
    open-pr/SKILL.md                 Opens a GitHub PR from the real diff (gh, not glab)
  agents/
    e2e-verifier.md                  Agent that runs specs for real before calling anything "done"
cypress.config.ts
package.json
tsconfig.json
README.md
.gitignore
```

`cypress/support/priceUtils.ts` and `cypress/support/types.ts` are small,
minimal additions beyond the required file list: they keep price-parsing
logic and the fixture's TypeScript shape out of the page objects and the
spec, without introducing a new dependency.

## Prerequisites

- Node.js 18+ (Node 20 is used in CI)
- Google Chrome installed locally

## Installation

```bash
npm install
```

## Available Scripts

| Script                 | Description                                              |
| ----------------------- | --------------------------------------------------------- |
| `npm run cy:open`       | Open the Cypress interactive runner                       |
| `npm run cy:run`        | Run all specs headlessly with the default browser         |
| `npm run cy:run:chrome` | Run all specs headlessly in Chrome                        |
| `npm run test:e2e`      | Run the main functional scenario in Chrome                |
| `npm run test:visual`   | Run the visual snapshot test in Chrome                    |

## Running Tests Locally

```bash
npm install
npm run cy:open
```

## Running Tests in Chrome

```bash
npm run test:e2e
npm run test:visual
```

## Test Scenario

File: `cypress/e2e/add-products-to-cart.cy.ts`

1. Visit the home page.
2. Clean up the cart defensively (see Test Stability).
3. Navigate to `Phones`, open the first product, capture its name and price.
4. Add it to the cart and validate the native "Product added" alert.
5. Return to the home page, navigate to `Laptops`, open the second product,
   capture its name and price.
6. Add it to the cart and validate the alert again.
7. Open the cart and validate: two rows exist, each row's name and price
   match what was captured on the corresponding product detail page, and the
   displayed total equals the sum of both captured prices.

## Test Data Strategy

- Category names, the expected alert text, and the product indexes used by
  the scenario live in `cypress/fixtures/productVariables/productTexts.json`.
  These are stable, catalog-independent values.
- Product names and prices are never hardcoded. They are read from the UI at
  runtime (product detail page and cart rows) and compared against each
  other, so the test does not depend on the current contents of the public
  demo catalog.
- `parsePriceLabelToNumber` (in `cypress/support/priceUtils.ts`) safely
  converts UI price labels (e.g. `"$360 *includes tax"` or `"360"`) into
  numbers for arithmetic and comparison.

## Page Object Model

- One Page Object per page (`HomePage`, `CategoryPage`, `ProductDetailPage`,
  `CartPage`) and one per shared component (`HeaderComponent`,
  `AlertComponent`), each with a single, focused responsibility.
- Locators are centralized as private fields inside each Page Object.
- Page Objects expose UI actions and small query helpers named after business
  behavior (e.g. `navigateToCategory`, `addToCart`, `removeAllProducts`).
- Business assertions (matching names/prices, counting cart rows, validating
  the total) live in the spec file. Page Objects only assert basic load
  state (e.g. the product list or the cart total element is present).

## Test Stability

- `beforeEach` visits the app, opens the cart, removes any pre-existing
  products one at a time, waits for each removal to be reflected in the DOM,
  and asserts the cart is empty before returning home. This is defensive: it
  does not fail when the cart is already empty, and it does not assume the
  shared public demo environment starts clean.
- No fixed-time `cy.wait()` is used anywhere in the suite.
- Category navigation (`Phones`/`Laptops`) swaps the product list in place
  via an AJAX call (`POST **/bycat`) without a page navigation. To avoid a
  race where a retry-able assertion could pass against stale, pre-swap
  content, `HomePage.navigateToCategory` intercepts that request and waits
  for it (`cy.wait('@categoryProductsRequest')`) before continuing.
- Removing a cart item (`POST **/deleteitem`) triggers a full page reload on
  success. `CartPage` waits for that request and then asserts the row count
  decreased, which is safe against the reload because Cypress requeries the
  DOM.
- Opening the cart (`POST **/viewcart`) is also awaited before reading cart
  content.
- All other assertions use Cypress's built-in retry-ability (`cy.get(...).should(...)`)
  instead of manual waits.
- The native "Product added" alert is validated with a `cy.stub()` registered
  on `window:alert` and asserted with a retry-able `cy.wrap(stub).should('have.been.calledWith', ...)`,
  rather than a plain HTML modal Page Object.

## Visual Test

File: `cypress/e2e/visual/home-page-visual.cy.ts`

An independent visual test visits the home page, waits for the product list
to be visible, and captures a full-page screenshot named `home-page` with
`cy.screenshot()`. It is intentionally separate from the functional flow.
This is a first step toward a future visual regression strategy: Cypress
already stores screenshots under `cypress/screenshots` and automatically
captures a screenshot on failure when running with `cypress run`, so no
additional visual regression library is introduced yet.

## CI Pipeline

File: `.github/workflows/cypress.yml`

- Triggers on `push` to the `main` branch only. Merging a pull request into
  `main` produces a push event on that branch, so the pipeline runs right
  after a merge lands. It intentionally does not run on pull request
  open/update events or on pushes to other branches, so pull requests are not
  validated before merge; the pipeline is a post-merge safety net.
- Runs on `ubuntu-latest` with a reproducible `npm ci` install.
- Two independent jobs, `e2e-tests` and `visual-tests`, each run their own
  spec in Chrome (`--browser chrome`), so a failure in either job is clearly
  attributable to that job in the GitHub Actions UI.
- Screenshots and videos are uploaded as artifacts only when a job fails
  (`if: failure()`), keeping successful runs free of unnecessary artifacts.

## Slack Notifications

A third job, `notify-on-failure`, depends on both test jobs and only runs
when one of them fails (`if: failure()`). It posts a message to a Slack
Incoming Webhook containing the failure status, the configured owner
mention, the repository, branch, short commit SHA, workflow name, and a
direct link to the failed run.

## GitHub Secrets Configuration

Configure the following in the repository (Settings → Secrets and variables → Actions):

- `SLACK_WEBHOOK_URL` (**Secret**): the Slack Incoming Webhook URL used to
  post failure notifications. Never commit a real webhook URL to the
  repository.
- `TEST_OWNER_TAG` (**Variable**): the Slack mention (e.g. `@qa-team` or a
  user/group ID) used to tag the test owner in failure notifications. It is
  configured as a repository variable rather than a secret because it does
  not need to be kept confidential.

## Technical Decisions

- Selectors are based on the real markup of Demoblaze (ids and classes such
  as `#tbodyid`, `.card-title a.hrefch`, `h3.price-container`,
  `a[onclick^="addToCart("]`, `#totalp`), inspected directly against the live
  site. No XPath and no selectors based on inline styles are used.
- The public demo app exposes no `data-testid` attributes, so the most
  stable available selectors are structural ids/classes and functional
  `onclick` attribute prefixes (e.g. `addToCart(`, `deleteItem(`), which are
  tied to behavior rather than visual styling. The main residual risk is that
  Demoblaze could rename these ids/classes in a future redesign; if that
  happens, only the affected Page Object needs to change.
- Category links share a non-unique `id="itemc"` in the live markup, so they
  are targeted by their visible text (`cy.contains('.list-group-item', name)`)
  instead of that id.
- The classic Page Object Model uses plain TypeScript classes, each exported
  together with a single ready-to-use instance, so specs import and use them
  directly without re-instantiating.
- Imports for Page Objects and support helpers use TypeScript path aliases
  (`@pageObjects/*`, `@support/*`), configured via `baseUrl` + `paths` in
  `tsconfig.json`. Cypress's built-in bundler resolves the same
  `tsconfig.json` fields at test-run time (through the bundled
  `tsconfig-paths-webpack-plugin`), so the aliases work both for
  type-checking (`tsc --noEmit`) and when actually running a spec, with no
  extra dependency or `cypress.config.ts` change required.

## AI

This repository ships project-scoped Claude Code skills and an agent under
`.claude/`, so anyone using Claude Code on this repo gets the same
conventions without having to restate them. They are checked into the repo
(not personal, not gitignored) so they travel with the code.

### Skills (`.claude/skills/`)

- **`dev-workflow`** — the branch → implement → verify → show changes →
  wait for approval → commit loop for this repo specifically. No ticket
  system, no phased implementation-doc tracking — just what this repo
  actually needs.
- **`add-e2e-scenario`** — the checklist for adding a new E2E scenario or
  extending the existing one: reuse the Page Objects instead of duplicating
  header/cart/category logic, never hardcode product data, reuse the
  already-solved `cy.intercept` waits for Demoblaze's known race conditions
  (category switch, cart item deletion, cart load), use the `@pageObjects/*`
  /`@support/*` aliases, and mark steps with `cy.step()`/`cy.section()`.
- **`open-pr`** — opens a GitHub Pull Request with `gh`, building the title
  and description from the real diff against `main`. It is the GitHub
  adaptation of a personal `open-mr` skill originally written for GitLab
  (`glab`); the GitLab-specific parts (a fixed label, a Jira ticket prefix)
  were dropped rather than translated, since this repo has neither.

### Agent (`.claude/agents/`)

- **`e2e-verifier`** — runs `tsc --noEmit` plus the actual affected Cypress
  spec(s) against Chrome and the real site, then cleans up
  `cypress/videos`/`cypress/screenshots`. Exists so "done" always means
  "ran green just now," not "compiles" or "looks right."

## Scalability Approach

This repository currently ships one critical flow, run on every push. As
coverage grows, the recommended approach is to split execution by intent
rather than growing a single suite:

- **Smoke**: a minimal set of critical-path checks on every pull request or
  deployment.
- **Sanity**: a slightly broader set after a deployment or a scoped change.
- **Regression**: a scheduled run (e.g. nightly or before a release) covering
  the full suite.

These suites can be organized with dedicated folders, npm scripts, or
Cypress spec patterns/tags without changing the Page Object layer.

## Future Improvements

- Parallel execution across multiple CI machines.
- A dedicated visual regression platform/service.
- Structured test reporting (e.g. HTML/JUnit reports published as artifacts).
- Integration with a test management tool.
- Additional negative scenarios for the cart (e.g. removing all items,
  attempting checkout with an empty cart).
- API-level setup/cleanup for the cart, if the application exposes a stable
  API for it.
- Test tagging and suite segmentation (smoke/sanity/regression).
