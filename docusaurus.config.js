module.exports = {
  title: "Interview Cheatsheet", // Title for your website.
  tagline: "Collection of my interview questions for interview",
  url: "https://interview-cheatsheet.netlify.app", // Your website URL
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
        src: "img/favicon.ico",
      },
      items: [
        {
          type: 'doc',
          position: 'left',
          docId: 'behavior/Introduction',
          label: '🧙‍♂️ Behavior',
        },
        {
          type: 'doc',
          position: 'left',
          docId: 'backend/Databases',
          label: '🏋️‍♀️  Backend',
        },
        {
          type: 'doc',
          position: 'left',
          docId: 'frontend/Promise',
          label: '💄 Frontend',
        },
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
              to: "docs/backend/Databases",
            },
          ],
        },
        {
          title: "JS",
          items: [
            {
              label: "Eventloop",
              to: "docs/backend/Eventloop",
            },
            {
              label: "jQuery",
              to: "docs/frontend/jQuery",
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
          path: "docs",
          sidebarPath: require.resolve("./sidebars.js"),
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          // this enabled the edit button for documentation
          editUrl:
            "https://github.com/ayonious/interview-cheatsheet/blob/master/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
