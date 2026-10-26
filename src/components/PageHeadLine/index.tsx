import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import React from "react";

import styles from "./styles.module.css";

const ColoredText = ({ text }: { text: string }) => (
  <span className={styles.ColoredWords}>{text}</span>
);
const UnColoredText = ({ text }: { text: string }) => <span>{text}</span>;

const NavigationButtons = () => (
  <div className={styles.ButtonsContainer}>
    <div className={styles.GetStartButton}>
      <Link to={useBaseUrl("docs/")}>🧙‍♂️ Behavior</Link>
    </div>
    <div className={styles.GetStartButton}>
      <Link to={useBaseUrl("docs/backend/Databases")}>🏋️‍♀️ Backend</Link>
    </div>
    <div className={styles.GetStartButton}>
      <Link to={useBaseUrl("docs/frontend/Promise")}>💄 Frontend</Link>
    </div>
  </div>
);

const ProductLogo = () => (
  <img
    className={styles.ProductLogoHomePage}
    width={200}
    alt="CheatSheet logo"
    src={useBaseUrl("img/logo.png")}
  />
);

const PageHeadLine = () => {
  return (
    <div className={styles.Headline}>
      <div className={styles.HeadlineSub}>
        <h1 className={styles.HeadlineText}>
          <ProductLogo />
          <ColoredText text="Collection" />
          <UnColoredText text=" of" />
          <ColoredText text=" Tech Interviews" />
          <UnColoredText text="cheat sheet" />
        </h1>
        <NavigationButtons />
      </div>
    </div>
  );
};

export default PageHeadLine;
