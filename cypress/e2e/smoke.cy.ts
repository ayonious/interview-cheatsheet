/// <reference types="cypress" />

describe('Smoke Tests', () => {
  it('should load the application successfully', () => {
    cy.visit('/')
    cy.get('h1').should('be.visible')
    cy.title().should('include', 'Interview Cheatsheet')
  })

  it('should have working navigation', () => {
    cy.visit('/')
    cy.get('nav').should('be.visible')
    cy.get('nav').should('contain.text', 'Backend')
  })

  it('should load a backend page', () => {
    cy.visit('/backend/Databases')
    cy.get('h1').should('be.visible')
    cy.get('main').should('be.visible')
  })
})