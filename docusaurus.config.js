const versions = require("./versions.json");

module.exports = {
  title: "Console Table Printer", // Title for your website.
  tagline: "A tool to print colorful table on your console",
  url: "https://console-table.netlify.app", // Your website URL
  baseUrl: "/", // Base URL for your project */

  favicon: "img/favicon.ico",
  organizationName: "facebook", // Usually your GitHub org/user name.
  projectName: "docusaurus", // Usually your repo name.
  themeConfig: {
    sidebarCollapsible: false,
    announcementBar: {
      id: "support",
      content:
        '⭐️ If you like Console Table Printer, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/ayonious/console-table-printer">GitHub</a>! ⭐️',
    },
    navbar: {
      title: "Console Table Printer",
      logo: {
        alt: "CTP",
        src: "img/logo.ico",
      },
      links: [
        /*{
          label: "Docs",
          to: "docs/introduction", // "fake" link
          position: "left",
          activeBasePath: "docs",
          items: [
            {
              label: versions[0],
              to: "docs/",
              exact: true,
            },
            ...versions.slice(1).map((version) => ({
              label: version,
              to: `docs/${version}/`,
            })),
            {
              label: "Master/latest",
              to: "docs/next/",
            },
          ],
        },
        {
          to: "versions",
          label: `${versions && versions[0 || ""]}`,
          position: "right",
        },*/
        {
          href: "https://github.com/ayonious/console-table-printer",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://www.npmjs.com/package/console-table-printer",
          label: "Npmjs",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Learn",
          items: [
            {
              label: "Quick Start",
              to: "docs/doc-install-quick-start",
            },
            {
              label: "Getting Started With CLI",
              to: "docs/doc-cli-install-quick-start",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://www.npmjs.com/package/console-table-printer",
            },
            {
              label: "Npmjs",
              href: "https://www.npmjs.com/package/console-table-printer",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Nahiyan. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          homePageId: "doc-install-quick-start",
          path: "docs",
          sidebarPath: require.resolve("./sidebars.js"),
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          // this enabled the edit button for documentation
          editUrl:
            "https://github.com/ayonious/console-table-docu/blob/master/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
