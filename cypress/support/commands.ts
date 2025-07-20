// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to select elements by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`)
})

// Custom command to check visibility and text content
Cypress.Commands.add('shouldBeVisibleAndContain', { prevSubject: true }, (subject, text: string) => {
  return cy.wrap(subject).should('be.visible').and('contain.text', text)
})

// Custom command for navigation testing
Cypress.Commands.add('navigateToSection', (sectionName: string) => {
  cy.get('nav').contains(sectionName).click()
  cy.url().should('include', sectionName.toLowerCase())
})

// Custom command for testing responsive design
Cypress.Commands.add('testResponsive', (breakpoints: Array<[number, number]> = [[1280, 720], [768, 1024], [375, 812]]) => {
  breakpoints.forEach(([width, height]) => {
    cy.viewport(width, height)
    cy.wait(500) // Allow time for responsive changes
  })
}) 