describe('Home page visual snapshot', () => {
  it('home-page', () => {
    cy.visit('/');
    cy.get('#tbodyid .card').should('have.length.greaterThan', 0);
    cy.screenshot('home-page', { capture: 'fullPage' });
  });
});
