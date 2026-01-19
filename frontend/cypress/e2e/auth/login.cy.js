describe('Autenticação (The Gate)', () => {
  beforeEach(() => {
    // Limpa cookies e localStorage antes de cada teste
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('Deve exibir erro com credenciais inválidas', () => {
    cy.get('input[type="email"]').type('hacker@errado.com');
    cy.get('input[type="password"]').type('senhaerrada123');
    cy.get('button[type="submit"]').click();

    // Verifica se mensagens de erro aparecem (ajuste o seletor conforme sua UI)
    cy.contains('Erro ao realizar login').should('be.visible');
  });

  it('Deve realizar login com sucesso e definir Cookie HttpOnly', () => {
    // Usando o seed user
    cy.get('input[type="email"]').type('admin@neonorte.com');
    cy.get('input[type="password"]').type('neonorte123');
    cy.get('button[type="submit"]').click();

    // Deve redirecionar para /kanban
    cy.url().should('include', '/kanban');

    // Verifica se o cookie 'token' existe (Cypress pode ver cookies HttpOnly)
    cy.getCookie('token').should('exist');
  });

  it('Deve redirecionar para login ao acessar rota protegida sem sessão', () => {
    cy.clearCookies();
    cy.visit('/kanban');
    cy.url().should('include', '/login');
  });
});
