export class CategoryPage {
  private readonly productCardSelector = '#tbodyid .card';
  private readonly productNameLinkSelector = '.card-title a.hrefch';

  waitForProductListToLoad(): void {
    cy.get(this.productCardSelector).should('have.length.greaterThan', 0);
  }

  openProductByIndex(productIndex: number): void {
    this.getProductCards().eq(productIndex).find(this.productNameLinkSelector).click();
  }

  private getProductCards(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.productCardSelector);
  }
}

export const categoryPage = new CategoryPage();
