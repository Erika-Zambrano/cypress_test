export class HeaderComponent {
  private readonly navSelector = 'nav.navbar';

  getByRole(role: string, name: string | RegExp): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.navSelector).findByRole(role, { name });
  }

  selectHeaderOption(optionName: string): void {
    this.getByRole('link', new RegExp(optionName, 'i')).click();
  }
}

export const headerComponent = new HeaderComponent();
