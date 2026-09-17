import { homePage } from '@pageObjects/HomePage';
import { categoryPage } from '@pageObjects/CategoryPage';
import { productDetailPage } from '@pageObjects/ProductDetailPage';
import { cartPage } from '@pageObjects/CartPage';
import { headerComponent } from '@pageObjects/HeaderComponent';
import { alertComponent } from '@pageObjects/AlertComponent';
import type { ProductVariables } from '@support/types';

describe('Should be able to add two items and validate the total price in the cart', () => {
  let productVariables: ProductVariables;

  beforeEach(() => {
    cy.fixture<ProductVariables>('productVariables/productTexts').then((fixtureData) => {
      productVariables = fixtureData;

      cy.section('Setup: clean up the cart before starting the test');
      cartPage.watchForCartLoad();
      homePage.visit();
      headerComponent.selectHeaderOption(productVariables.navigation.cart);
      cartPage.waitForCartToLoad();
      cartPage.removeAllProducts();
      cartPage.assertCartIsEmpty();
      headerComponent.selectHeaderOption(productVariables.navigation.home);
      homePage.assertIsLoaded();
    });
  });

  it('should add the first phone and the second laptop to the cart and validate prices and total', () => {
    let firstPhoneName = '';
    let firstPhonePrice = 0;
    let secondLaptopName = '';
    let secondLaptopPrice = 0;

    cy.step('Open from the Phones category');
    homePage.navigateToCategory(productVariables.categories.phones);
    categoryPage.waitForProductListToLoad();

    cy.step('Selecting first phone');
    categoryPage.openProductByIndex(productVariables.productIndexes.firstPhone);

    cy.step('Capture the phone name and price');
    productDetailPage.assertIsLoaded();
    productDetailPage.getProductName().then((name) => {
      firstPhoneName = name;
    });
    productDetailPage.getProductPrice().then((price) => {
      firstPhonePrice = price;
    });

    cy.step('Adding first phone to the cart')
    alertComponent.registerAlertListener();
    productDetailPage.addToCart();
    alertComponent.assertAlertMessageEquals(productVariables.alerts.productAdded);

    cy.step('Go to Home page');
    headerComponent.selectHeaderOption(productVariables.navigation.home);
    homePage.assertIsLoaded();

    cy.step('Go to laptops category');
    homePage.navigateToCategory(productVariables.categories.laptops);
    categoryPage.waitForProductListToLoad();

    cy.step('Selecting first laptop');
    categoryPage.openProductByIndex(productVariables.productIndexes.secondLaptop);

    cy.step('Capture laptop name and price');
    productDetailPage.assertIsLoaded();
    productDetailPage.getProductName().then((name) => {
      secondLaptopName = name;
    });
    productDetailPage.getProductPrice().then((price) => {
      secondLaptopPrice = price;
    });

    alertComponent.registerAlertListener();

    cy.step('Adding laptop to the cart')
    productDetailPage.addToCart();
    alertComponent.assertAlertMessageEquals(productVariables.alerts.productAdded);

    cy.step('Go to the cart');
    headerComponent.selectHeaderOption(productVariables.navigation.cart);
    cartPage.waitForCartToLoad();

    cy.step('Validate that the 2 product are in the cart');
    cartPage.getCartRows().should('have.length', 2);

    cy.then(() => {
      cy.step('Validate the name and price for individual item');
      const expectedProducts = [
        { name: firstPhoneName, price: firstPhonePrice },
        { name: secondLaptopName, price: secondLaptopPrice },
      ];

      cartPage.getCartRows().then(($cartRows) => {
        const actualProducts = Array.from($cartRows).map((cartRow) => {
          const $cartRow = Cypress.$(cartRow);
          return {
            name: cartPage.getProductNameFromRow($cartRow),
            price: cartPage.getProductPriceFromRow($cartRow),
          };
        });

        expectedProducts.forEach((expectedProduct) => {
          const matchingCartRow = actualProducts.find(
            (actualProduct) =>
              actualProduct.name === expectedProduct.name && actualProduct.price === expectedProduct.price,
          );

          expect(matchingCartRow, `cart row matching "${expectedProduct.name}" ($${expectedProduct.price})`).to
            .exist;
        });
      });

      cy.step('Validate that the total is correct');
      const expectedTotal = firstPhonePrice + secondLaptopPrice;
      cartPage.getTotal().should('equal', expectedTotal);
    });
  });
});
