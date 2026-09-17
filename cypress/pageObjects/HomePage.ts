export class HomePage {
  private readonly categoryLinkSelector = '.list-group-item';
  private readonly productCardSelector = '#tbodyid .card';

  visit(): void {
    cy.visit('/');
    this.assertIsLoaded();
  }

  assertIsLoaded(): void {
    cy.get(this.productCardSelector, { timeout: 10000 }).should('have.length.greaterThan', 0);
  }

  navigateToCategory(categoryName: string): void {
    cy.intercept('POST', '**/bycat').as('categoryProductsRequest');
    cy.contains(this.categoryLinkSelector, categoryName).click();
    cy.wait('@categoryProductsRequest');
  }
}

export const homePage = new HomePage();
