describe('App smoke test', () => {
  it('loads the app', () => {
    cy.visit('/');
    cy.get('main').should('exist');
  });
});
