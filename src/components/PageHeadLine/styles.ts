import styled from "styled-components";
import { ColorPrimary } from "../../css/variables";

export const Headline = styled.div`
  background-color: #2b3137;
  padding: 50px;
  text-align: center;
`;

export const HeadlineSub = styled.div`
  margin: 0 auto;
  max-width: 1100px;
`;

export const HeadlineText = styled.h1`
  font-size: 60px;
  color: white;
`;

export const ColoredWords = styled.span`
  color: ${ColorPrimary};
`;

export const GetStartButton = styled.div`
  a {
    padding: 20px 40px;
    border: 2px solid ${ColorPrimary};
    display: inline-block;
    border-radius: 6px;
    color: white;
    font-size: 30px;
    font-weight: bold;
  }
`;

export const ProductLogoHomePage = styled.img`
  float: right;
  width: 200px;
`;
