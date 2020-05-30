const versions = require("./versions.json");

module.exports = {
  title: "Interview Cheatsheet", // Title for your website.
  tagline: "Collection of my interview questions for interview",
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
        '⭐️ If you like Interview Cheatsheet, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/ayonious/interview-cheatsheet">GitHub</a>! ⭐️',
    },
    navbar: {
      title: "Interview Cheatsheet",
      logo: {
        alt: "CTP",
        src: "img/logo.ico",
      },
      links: [
        {
          href: "https://github.com/ayonious/interview-cheatsheet",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Backend",
          items: [
            {
              label: "Databases",
              to: "docs/Databases",
            },
          ],
        },
        {
          title: "JS",
          items: [
            {
              label: "Eventloop",
              to: "docs/Eventloop",
            },
            {
              label: "jQuery",
              to: "docs/jQuery",
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
          homePageId: "Databases",
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
