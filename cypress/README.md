# Cypress E2E Tests

This directory contains end-to-end tests for the Interview Cheatsheet application using Cypress with TypeScript.

## Test Structure

```
cypress/
├── e2e/                 # Test files
│   ├── homepage.cy.ts   # Homepage functionality tests
│   ├── navigation.cy.ts # Navigation and routing tests
│   └── content.cy.ts    # Content validation tests
├── support/             # Support files and custom commands
│   ├── e2e.ts          # Main support file
│   └── commands.ts     # Custom Cypress commands
├── fixtures/           # Test data files
└── tsconfig.json       # TypeScript configuration for tests
```

## Running Tests

### Local Development

1. **Interactive Mode** (opens Cypress Test Runner):
   ```bash
   yarn cy:open
   ```

2. **Headless Mode** (runs all tests in terminal):
   ```bash
   yarn cy:run
   ```

3. **With Development Server** (starts app and runs tests):
   ```bash
   yarn test:e2e:dev  # Interactive mode
   yarn test:e2e      # Headless mode
   ```

### CI/CD

Tests automatically run on:
- Pull requests to `main`/`master` branches
- Pushes to `main`/`master` branches

## Test Categories

### 1. Homepage Tests (`homepage.cy.ts`)
- Page loading and basic functionality
- Navigation menu presence
- Hero section content
- Responsive design validation
- SEO meta tags verification

### 2. Navigation Tests (`navigation.cy.ts`)
- Section navigation (Backend, Frontend, Behavior)
- Sidebar navigation in documentation pages
- Breadcrumb functionality
- Direct URL navigation
- Mobile navigation (responsive)

### 3. Content Tests (`content.cy.ts`)
- Documentation content validation
- Code syntax highlighting
- Table of contents functionality
- Link validation (internal/external)
- Accessibility checks

## Custom Commands

The test suite includes custom Cypress commands for common operations:

### `cy.dataCy(value)`
Selects elements by `data-cy` attribute:
```typescript
cy.dataCy('submit-button').click()
```

### `cy.shouldBeVisibleAndContain(text)`
Checks element visibility and text content:
```typescript
cy.get('.hero').shouldBeVisibleAndContain('Interview Cheatsheet')
```

### `cy.navigateToSection(sectionName)`
Navigates to a documentation section:
```typescript
cy.navigateToSection('Backend')
```

### `cy.testResponsive(breakpoints?)`
Tests responsive design across different screen sizes:
```typescript
cy.testResponsive([[1920, 1080], [768, 1024], [375, 812]])
```

## Configuration

### Cypress Configuration (`cypress.config.ts`)
- **Base URL**: `http://localhost:3000`
- **Viewport**: 1280x720 (default)
- **Timeouts**: 10 seconds for commands/requests
- **Screenshots**: On failure only
- **Videos**: Disabled for performance

### TypeScript Configuration (`cypress/tsconfig.json`)
- **Target**: ES2018
- **Types**: Cypress, Node
- **Strict mode**: Enabled

## Best Practices

1. **Use Page Objects**: For complex pages, consider using page object pattern
2. **Data Attributes**: Use `data-cy` attributes for reliable element selection
3. **Wait Strategies**: Use proper waiting strategies instead of hard waits
4. **Test Independence**: Each test should be independent and not rely on others
5. **Clean State**: Use `beforeEach` to ensure clean state for each test

## Debugging

### Local Debugging
- Use `cy.debug()` to pause execution
- Use `cy.pause()` to pause test execution
- Check Cypress Test Runner for detailed logs and DOM snapshots

### CI Debugging
- Failed tests upload screenshots and videos as artifacts
- Check GitHub Actions logs for detailed error messages
- Review uploaded artifacts for visual debugging

## Adding New Tests

1. Create new test files in `cypress/e2e/` with `.cy.ts` extension
2. Follow existing patterns and use custom commands
3. Include proper TypeScript types and JSDoc comments
4. Test both positive and negative scenarios
5. Consider accessibility and responsive design

## Maintenance

- **Update Dependencies**: Keep Cypress and related packages updated
- **Review Tests**: Regularly review and update tests as application changes
- **Performance**: Monitor test execution time and optimize slow tests
- **Coverage**: Ensure critical user journeys are covered 