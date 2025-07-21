/// <reference types="cypress" />

describe('Content Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Backend Documentation', () => {
    it('should display comprehensive database content', () => {
      cy.visit('/backend/Databases')
      cy.get('h1').should('contain.text', 'Database')
      cy.get('main').should('contain.text', 'SQL')
      cy.get('main').should('contain.text', 'NoSQL')
      cy.get('main').should('contain.text', 'MongoDB')
      cy.get('main').should('contain.text', 'PostgreSQL')
    })

    it('should display programming language types content', () => {
      cy.visit('/backend/ProgrammingLanguageTypes')
      cy.get('h1').should('contain.text', 'Programming Language Types')
      cy.get('main').should('contain.text', 'JavaScript')
      cy.get('main').should('contain.text', 'TypeScript')
      cy.get('main').should('contain.text', 'Java')
      cy.get('main').should('contain.text', 'Compiled')
      cy.get('main').should('contain.text', 'Interpreted')
    })

    it('should display object-oriented programming content', () => {
      cy.visit('/backend/ObjectOrientedProgramming')
      cy.get('h1').should('contain.text', 'Object-Oriented Programming')
      cy.get('main').should('contain.text', 'Encapsulation')
      cy.get('main').should('contain.text', 'Inheritance')
      cy.get('main').should('contain.text', 'Polymorphism')
      cy.get('main').should('contain.text', 'Abstraction')
    })

    it('should display statelessness content', () => {
      cy.visit('/backend/Statelessness')
      cy.get('h1').should('contain.text', 'Statelessness')
      cy.get('main').should('contain.text', 'JWT')
      cy.get('main').should('contain.text', 'session')
      cy.get('main').should('contain.text', 'REST')
    })

    it('should display message queue content', () => {
      cy.visit('/backend/MessageQueue')
      cy.get('h1').should('contain.text', 'Message')
      cy.get('main').should('contain.text', 'RabbitMQ')
      cy.get('main').should('contain.text', 'Kafka')
      cy.get('main').should('contain.text', 'Producer')
      cy.get('main').should('contain.text', 'Consumer')
    })

    it('should display event loop content', () => {
      cy.visit('/backend/Eventloop')
      cy.get('h1').should('contain.text', 'Event Loop')
      cy.get('main').should('contain.text', 'JavaScript')
      cy.get('main').should('contain.text', 'Call Stack')
      cy.get('main').should('contain.text', 'Callback Queue')
    })

    it('should display locks and synchronization content', () => {
      cy.visit('/backend/Lock')
      cy.get('h1').should('contain.text', 'Locks')
      cy.get('main').should('contain.text', 'Deadlock')
      cy.get('main').should('contain.text', 'Race condition')
      cy.get('main').should('contain.text', 'Mutex')
    })
  })

  describe('Behavior Documentation', () => {
    it('should display STAR method content', () => {
      cy.visit('/behavior/StarMethod')
      cy.get('h1').should('contain.text', 'STAR Method')
      cy.get('main').should('contain.text', 'STAR')
      cy.get('main').should('contain.text', 'Situation')
      cy.get('main').should('contain.text', 'Task')
      cy.get('main').should('contain.text', 'Action')
      cy.get('main').should('contain.text', 'Result')
    })

    it('should display common questions content', () => {
      cy.visit('/behavior/CommonQuestions')
      cy.get('h1').should('contain.text', 'Common Behavioral Questions')
      cy.get('main').should('contain.text', 'deadline')
      cy.get('main').should('contain.text', 'ownership')
      cy.get('main').should('contain.text', 'Alternative Variations')
    })

    it('should display interview tips content', () => {
      cy.visit('/behavior/InterviewTips')
      cy.get('h1').should('contain.text', 'Interview Tips')
      cy.get('main').should('contain.text', 'Story Bank')
      cy.get('main').should('contain.text', 'preparation')
    })
  })

  describe('Code Examples', () => {
    it('should display properly formatted code blocks', () => {
      cy.visit('/backend/ProgrammingLanguageTypes')
      
      // Check for code blocks
      cy.get('pre').should('have.length.greaterThan', 0)
      cy.get('code').should('have.length.greaterThan', 0)
      
      // Check for syntax highlighting
      cy.get('pre code').should('be.visible')
      cy.get('pre').first().should('have.class', 'prism-code')
    })

    it('should have copy buttons for code blocks', () => {
      cy.visit('/backend/ObjectOrientedProgramming')
      
      // Check if copy buttons exist (may vary based on Docusaurus theme)
      cy.get('pre').then(($pre) => {
        if ($pre.find('.clean-btn').length > 0) {
          cy.get('.clean-btn').first().should('be.visible')
        }
      })
    })
  })

  describe('Content Structure', () => {
    it('should have proper heading hierarchy', () => {
      cy.visit('/backend/ObjectOrientedProgramming')
      
      // Check heading structure
      cy.get('h1').should('have.length', 1)
      cy.get('h2').should('have.length.greaterThan', 0)
      cy.get('h3').should('have.length.greaterThan', 0)
    })

    it('should have table of contents navigation', () => {
      cy.visit('/backend/ObjectOrientedProgramming')
      
      // Check for table of contents
      cy.get('.table-of-contents').should('be.visible')
      cy.get('.table-of-contents a').should('have.length.greaterThan', 0)
      
      // Test TOC navigation
      cy.get('.table-of-contents a').first().click()
      cy.url().should('include', '#')
    })

    it('should display comparison tables correctly', () => {
      cy.visit('/backend/ObjectOrientedProgramming')
      
      // Check for tables
      cy.get('table').should('have.length.greaterThan', 0)
      cy.get('table th').should('be.visible')
      cy.get('table td').should('be.visible')
    })
  })

  describe('Links and References', () => {
    it('should have working internal links', () => {
      cy.visit('/backend/Databases')
      
      // Test internal links if they exist
      cy.get('main a[href^="/"]').then(($links) => {
        if ($links.length > 0) {
          cy.wrap($links).first().click()
          cy.url().should('not.equal', Cypress.config().baseUrl + '/backend/Databases')
        }
      })
    })

    it('should have proper external link handling', () => {
      cy.visit('/backend/Eventloop')
      
      // Check external links (should open in new tab)
      cy.get('main a[href^="http"]').then(($links) => {
        if ($links.length > 0) {
          cy.wrap($links).first().should('have.attr', 'target', '_blank')
          cy.wrap($links).first().should('have.attr', 'rel').and('include', 'noopener')
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure for screen readers', () => {
      cy.visit('/backend/ObjectOrientedProgramming')
      
      // Check heading hierarchy (should not skip levels)
      cy.get('h1, h2, h3, h4, h5, h6').each(($heading, index) => {
        const tagName = $heading.prop('tagName').toLowerCase()
        const level = parseInt(tagName.charAt(1))
        
        if (index > 0) {
          cy.get('h1, h2, h3, h4, h5, h6').eq(index - 1).then(($prevHeading) => {
            const prevLevel = parseInt($prevHeading.prop('tagName').toLowerCase().charAt(1))
            expect(level).to.be.at.most(prevLevel + 1)
          })
        }
      })
    })

    it('should have alt text for images', () => {
      cy.visit('/')
      
      // Check images have alt text
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt')
      })
    })
  })
}) 