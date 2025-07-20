# Interview Cheatsheet

[![Cypress E2E Tests](https://github.com/ayonious/interview-cheatsheet/actions/workflows/cypress-tests.yml/badge.svg)](https://github.com/ayonious/interview-cheatsheet/actions/workflows/cypress-tests.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_SITE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_NETLIFY_SITE_NAME/deploys)

> My interview Preparation Guide. Having Interview preparation guide is against my will but still better prepare and be confident than not preparing at all

## 🤷 But Why another Guide?

This one is my personal one. So only contains things that I need to learn or just take a look. For example I dont really have interest much on Java or Python so those are not included here. But this has very detailed discussions on Nodejs async operations / Event-loopy-doopy.

Another reason Why I wrote it is because I was forgetting many basic things without much Practice. For example when is SQL better than noSQL. I know the reason but its better to read it once before Interveiw than trying to hard remember and then timing out

Another reason is getting ready for communication related questions that can really catch you in the act if you are not prepared.

## 🔍 Topics

1. JS
2. Fullstack
3. Backend
4. Frontend

# 🎁 See Deployed

https://interview-cheatsheet.netlify.app

## 🧪 Testing & Quality Assurance

This project includes comprehensive testing and quality assurance measures:

- **🔧 Build Verification**: Automated build checks on every PR
- **🎯 E2E Testing**: Cypress tests covering critical user journeys
- **📱 Responsive Testing**: Cross-device compatibility validation
- **♿ Accessibility**: Basic accessibility compliance checks
- **🔗 Link Validation**: Internal and external link verification

### Running Tests Locally

```bash
# Install dependencies
yarn install

# Run build verification
yarn build

# Run Cypress tests (interactive)
yarn test:e2e:dev

# Run Cypress tests (headless)
yarn test:e2e
```

## 🚀 Tech Stack

- **Framework**: [Docusaurus 3.8.1](https://docusaurus.io/)
- **Language**: [TypeScript 5.8.3](https://www.typescriptlang.org/)
- **Runtime**: [Node.js 22](https://nodejs.org/)
- **Testing**: [Cypress 14.5.2](https://www.cypress.io/)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Deployment**: [Netlify](https://www.netlify.com/)
