/// <reference types="cypress" />

describe('Navigation Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should navigate to Backend section', () => {
    cy.get('nav').contains('Backend').click()
    cy.url().should('include', '/backend/')
    cy.get('h1').should('contain.text', 'Database')
  })

  it('should navigate to Frontend section', () => {
    cy.get('nav').contains('Frontend').click()
    cy.url().should('include', '/frontend/')
    cy.get('h1').should('contain.text', 'Promise')
  })

  it('should navigate to Behavior section', () => {
    cy.get('nav').contains('Behavior').click()
    cy.url().should('include', '/behavior/')
    cy.get('h1').should('contain.text', 'Introduction')
  })

  it('should display sidebar navigation in document pages', () => {
    cy.get('nav').contains('Backend').click()
    
    // Check for sidebar
    cy.get('.theme-doc-sidebar-container').should('be.visible')
    
    // Check for sidebar categories
    cy.get('.theme-doc-sidebar-container').should('contain.text', 'Databases')
    cy.get('.theme-doc-sidebar-container').should('contain.text', 'Programming Languages')
    cy.get('.theme-doc-sidebar-container').should('contain.text', 'Message Systems')
  })

  it('should navigate between different backend topics', () => {
    cy.get('nav').contains('Backend').click()
    
    // Navigate to Programming Languages section
    cy.get('.theme-doc-sidebar-container').contains('Programming Languages').click()
    cy.get('.theme-doc-sidebar-container').contains('Object-Oriented Programming').click()
    
    cy.url().should('include', '/ObjectOrientedProgramming')
    cy.get('h1').should('contain.text', 'Object-Oriented Programming')
    
    // Check content is loaded
    cy.get('main').should('contain.text', 'OOP')
    cy.get('main').should('contain.text', 'Encapsulation')
  })

  it('should have working breadcrumb navigation', () => {
    cy.get('nav').contains('Backend').click()
    
    // Check if breadcrumbs exist and are functional
    cy.get('nav[aria-label="Breadcrumbs"]').should('be.visible')
    cy.get('nav[aria-label="Breadcrumbs"]').should('contain.text', 'Backend')
  })

  it('should handle direct URL navigation', () => {
    // Test direct navigation to specific pages
    cy.visit('/backend/Statelessness')
    cy.get('h1').should('contain.text', 'Statelessness')
    cy.get('main').should('contain.text', 'Distributed Systems')
    
    cy.visit('/backend/MessageQueue')
    cy.get('h1').should('contain.text', 'Message')
    cy.get('main').should('contain.text', 'RabbitMQ')
  })

  it('should maintain navigation state across page loads', () => {
    cy.get('nav').contains('Backend').click()
    cy.reload()
    cy.url().should('include', '/backend/')
    cy.get('.theme-doc-sidebar-container').should('be.visible')
  })

  it('should have working search functionality if present', () => {
    // Check if search button exists
    cy.get('body').then(($body) => {
      if ($body.find('.DocSearch').length > 0) {
        cy.get('.DocSearch').should('be.visible')
        cy.get('.DocSearch').click()
        cy.get('.DocSearch-Modal').should('be.visible')
      }
    })
  })

  it('should handle mobile navigation toggle', () => {
    cy.viewport(375, 667) // Mobile viewport
    
    // Check if mobile menu toggle exists
    cy.get('body').then(($body) => {
      if ($body.find('.navbar__toggle').length > 0) {
        cy.get('.navbar__toggle').should('be.visible')
        cy.get('.navbar__toggle').click()
        cy.get('.navbar-sidebar').should('be.visible')
      }
    })
  })
}) 