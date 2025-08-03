import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Interview Cheatsheet',
  tagline: 'Collection of my interview questions for interview',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://interview-cheatsheet.netlify.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ayonious', // Usually your GitHub org/user name.
  projectName: 'interview-cheatsheet', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          sidebarCollapsible: false,
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          // this enabled the edit button for documentation
          editUrl: 'https://github.com/ayonious/interview-cheatsheet/blob/master/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/logo.png',
    announcementBar: {
      id: 'support',
      content:
        '⭐️ If you like Interview Cheatsheet, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/ayonious/interview-cheatsheet">GitHub</a>! ⭐️',
    },
    navbar: {
      title: 'Interview Cheatsheet',
      logo: {
        alt: 'Interview Cheatsheet',
        src: 'img/favicon.ico',
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
          href: 'https://github.com/ayonious/interview-cheatsheet',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Backend',
          items: [
            {
              label: 'Databases',
              to: 'docs/backend/Databases',
            },
          ],
        },
        {
          title: 'JS',
          items: [
            {
              label: 'Eventloop',
              to: 'docs/backend/Eventloop',
            },
            {
              label: 'jQuery',
              to: 'docs/frontend/jQuery',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Nahiyan. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;