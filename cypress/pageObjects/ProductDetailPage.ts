import { parsePriceLabelToNumber } from '@support/priceUtils';

export class ProductDetailPage {
  private readonly nameSelector = 'h2.name';
  private readonly priceSelector = 'h3.price-container';
  private readonly addToCartSelector = 'a[onclick^="addToCart("]';

  assertIsLoaded(): void {
    cy.get(this.nameSelector).should('be.visible');
    cy.get(this.priceSelector).should('be.visible');
  }

  getProductName(): Cypress.Chainable<string> {
    return cy
      .get(this.nameSelector)
      .invoke('text')
      .then((rawName) => rawName.trim());
  }

  getProductPrice(): Cypress.Chainable<number> {
    return cy
      .get(this.priceSelector)
      .invoke('text')
      .then((rawPriceLabel) => parsePriceLabelToNumber(rawPriceLabel));
  }

  addToCart(): void {
    cy.get(this.addToCartSelector).click();
  }
}

export const productDetailPage = new ProductDetailPage();
