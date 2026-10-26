/// <reference types="cypress" />

describe("Homepage before hydration", () => {
  it("loads the layout and image sizes without application JavaScript", () => {
    cy.intercept("GET", "**/assets/js/*.js", {
      statusCode: 200,
      headers: { "content-type": "application/javascript" },
      body: "",
    });
    cy.visit("/");

    cy.get('main img[src$=".svg"]')
      .should("have.length", 3)
      .each(($image) => {
        cy.wrap($image)
          .should("have.css", "width", "200px")
          .and("have.css", "height", "200px");
      });
    cy.get('main img[alt="CheatSheet logo"]').should(
      "have.css",
      "width",
      "200px",
    );
    cy.get("main h1")
      .should("have.css", "font-size", "60px")
      .and("have.css", "color", "rgb(255, 255, 255)");
    cy.get("main")
      .contains("a", "Backend")
      .should("have.css", "border-top-width", "2px");
  });
});
