import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import React from "react";

import {
  ColoredWords,
  GetStartButton,
  ButtonsContainer,
  Headline,
  HeadlineSub,
  HeadlineText,
  ProductLogoHomePage,
} from "./styles";

const ColoredText = ({ text }: { text: string }) => (
  <ColoredWords>{text}</ColoredWords>
);
const UnColoredText = ({ text }: { text: string }) => <span>{text}</span>;

const NavigationButtons = () => (
  <ButtonsContainer>
    <GetStartButton>
      <Link to={useBaseUrl("docs/")}>🧙‍♂️ Behavior</Link>
    </GetStartButton>
    <GetStartButton>
      <Link to={useBaseUrl("docs/backend/Databases")}>🏋️‍♀️ Backend</Link>
    </GetStartButton>
    <GetStartButton>
      <Link to={useBaseUrl("docs/frontend/Promise")}>💄 Frontend</Link>
    </GetStartButton>
  </ButtonsContainer>
);

const ProductLogo = () => (
  <ProductLogoHomePage alt="CheatSheet logo" src={useBaseUrl("img/logo.png")} />
);

const PageHeadLine = () => {
  return (
    <Headline>
      <HeadlineSub>
        <HeadlineText>
          <ProductLogo />
          <ColoredText text="Collection" />
          <UnColoredText text=" of" />
          <ColoredText text=" Tech Interviews" />
          <UnColoredText text="cheat sheet" />
        </HeadlineText>
        <NavigationButtons />
      </HeadlineSub>
    </Headline>
  );
};

export default PageHeadLine;
