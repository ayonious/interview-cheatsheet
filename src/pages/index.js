import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

function Features() {
  return (
    <div>
      {features && features.length > 0 && (
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function PageHeadLine() {
  return (
    <div className={styles.headline}>
      <div>
        <img
          className={styles.headlineText}
          alt="CheatSheet logo"
          className={styles.productLogoHomePage}
          src={useBaseUrl("img/logo.png")}
        />
      </div>
      <Link className={styles.getStartButton} to={useBaseUrl("docs/Databases")}>
        GET STARTED
      </Link>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={`${siteConfig.title}`} description={`${siteConfig.tagline}`}>
      <main>
        <PageHeadLine />
      </main>
    </Layout>
  );
}

export default Home;
