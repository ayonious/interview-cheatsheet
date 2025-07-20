/// <reference types="cypress" />

describe('Homepage Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the homepage successfully', () => {
    cy.get('h1').should('be.visible')
    cy.title().should('include', 'Interview Cheatsheet')
    cy.get('body').should('be.visible')
  })

  it('should display the main navigation', () => {
    cy.get('nav').should('be.visible')
    
    // Check for main navigation items
    cy.get('nav').should('contain.text', 'Behavior')
    cy.get('nav').should('contain.text', 'Backend')
    cy.get('nav').should('contain.text', 'Frontend')
  })

  it('should have a functional GitHub link', () => {
    cy.get('nav')
      .contains('GitHub')
      .should('have.attr', 'href')
      .and('include', 'github.com')
  })

  it('should display the hero section with correct content', () => {
    cy.get('.hero').should('be.visible')
    cy.get('.hero').should('contain.text', 'Interview Cheatsheet')
    cy.get('.hero').should('contain.text', 'Collection of my interview questions for interview')
  })

  it('should be responsive across different screen sizes', () => {
    const viewports: Array<[number, number]> = [
      [1920, 1080], // Desktop
      [1024, 768],  // Tablet
      [375, 667],   // Mobile
    ]

    viewports.forEach(([width, height]) => {
      cy.viewport(width, height)
      cy.get('nav').should('be.visible')
      cy.get('.hero').should('be.visible')
      cy.wait(500) // Allow time for responsive changes
    })
  })

  it('should have proper meta tags for SEO', () => {
    cy.document().then((doc) => {
      const metaDescription = doc.querySelector('meta[name="description"]')
      expect(metaDescription).to.exist
      
      const ogTitle = doc.querySelector('meta[property="og:title"]')
      expect(ogTitle).to.exist
    })
  })
}) 