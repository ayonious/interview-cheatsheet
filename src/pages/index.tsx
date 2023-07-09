import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import React from "react";

import PageHeadLine from "../components/PageHeadLine";
import Sources from "../components/Sources";

const Home = () => {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`${siteConfig.title}`} description={`${siteConfig.tagline}`}>
      <main>
        <PageHeadLine />
        <Sources />
      </main>
    </Layout>
  );
};

export default Home;
