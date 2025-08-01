// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global types for better TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to check if an element is visible and contains text
       * @example cy.shouldBeVisibleAndContain('Hello World')
       */
      shouldBeVisibleAndContain(text: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to navigate to a section
       * @example cy.navigateToSection('Backend')
       */
      navigateToSection(sectionName: string): Chainable<void>
      
      /**
       * Custom command to test responsive design
       * @example cy.testResponsive()
       */
      testResponsive(breakpoints?: Array<[number, number]>): Chainable<void>
    }
  }
}

// Prevent TypeScript errors
export {} 