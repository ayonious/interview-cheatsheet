import React from "react";
import classnames from "classnames";
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
      <div className={styles.headlineSub}>
        <h1 className={styles.headlineText}>
          <img
            alt="CTP Logo"
            className={styles.productLogoHomePage}
            src={useBaseUrl("img/logo.ico")}
          />
          Print <span className={styles.coloredWords}>colorful Tables</span> on
          Console, directly from{" "}
          <span className={styles.coloredWords}>JSON string</span>
        </h1>
        <Link
          className={styles.getStartButton}
          to={useBaseUrl("docs/doc-install-quick-start")}
        >
          GET STARTED
        </Link>
      </div>
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
