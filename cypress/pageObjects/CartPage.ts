import { parsePriceLabelToNumber } from '@support/priceUtils';

export class CartPage {
  private readonly cartRowSelector = '#tbodyid tr.success';
  private readonly deleteLinkSelector = 'a[onclick^="deleteItem("]';
  private readonly totalSelector = '#totalp';

  watchForCartLoad(): void {
    cy.intercept('POST', '**/viewcart').as('viewCartRequest');
  }

  waitForCartToLoad(): void {
    cy.wait('@viewCartRequest');
    this.assertIsLoaded();
  }

  getCartRows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.cartRowSelector);
  }

  getProductNameFromRow(row: JQuery<HTMLElement>): string {
    return row.find('td').eq(1).text().trim();
  }

  getProductPriceFromRow(row: JQuery<HTMLElement>): number {
    return parsePriceLabelToNumber(row.find('td').eq(2).text());
  }

  getTotal(): Cypress.Chainable<number> {
    return cy
      .get(this.totalSelector)
      .invoke('text')
      .then((rawTotalLabel) => parsePriceLabelToNumber(rawTotalLabel));
  }

  assertCartIsEmpty(): void {
    cy.get(this.cartRowSelector).should('have.length', 0);
  }

  removeAllProducts(): void {
    this.getRowCount().then((rowCount) => {
      if (rowCount > 0) {
        this.removeFirstProductAndWaitForRemoval(rowCount);
        this.removeAllProducts();
      }
    });
  }

  private getRowCount(): Cypress.Chainable<number> {
    return cy.get('body').then(() => Cypress.$(this.cartRowSelector).length);
  }

  private removeFirstProductAndWaitForRemoval(rowCountBeforeDelete: number): void {
    cy.intercept('POST', '**/deleteitem').as('deleteItemRequest');
    this.getCartRows().first().find(this.deleteLinkSelector).click();
    cy.wait('@deleteItemRequest');
    cy.get(this.cartRowSelector, { timeout: 15000 }).should('have.length', rowCountBeforeDelete - 1);
  }

  private assertIsLoaded(): void {
    cy.get(this.totalSelector).should('exist');
  }
}

export const cartPage = new CartPage();
