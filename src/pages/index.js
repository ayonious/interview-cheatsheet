import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

const features = [
  {
    title: <>Light and Fast</>,
    imageUrl: "img/undraw_floating_61u6.svg",
    description: (
      <>
        As light as just 25kb. Install it in no time and its balzing fast as
        well{" "}
      </>
    ),
  },
  {
    title: <>Free</>,
    imageUrl: "img/undraw_gift1_sgf8.svg",
    description: (
      <>
        Console Table Printer is free and open source under MIT license. It has
        very minimal dependencies
      </>
    ),
  },
  {
    title: <>Typed</>,
    imageUrl: "img/undraw_powerful_26ry.svg",
    description: <>Use it happily with typescript and Javascript</>,
  },
];

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames("col col--4", styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

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
        <Features />
      </main>
    </Layout>
  );
}

export default Home;
