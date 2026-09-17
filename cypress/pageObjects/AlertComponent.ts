export class AlertComponent {
  private alertStub: ReturnType<typeof cy.stub> | null = null;

  registerAlertListener(): void {
    this.alertStub = cy.stub();
    cy.on('window:alert', this.alertStub);
  }

  assertAlertMessageEquals(expectedMessage: string): void {
    cy.wrap(this.alertStub).should('have.been.calledWith', expectedMessage);
  }
}

export const alertComponent = new AlertComponent();
