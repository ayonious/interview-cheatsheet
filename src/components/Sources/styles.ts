import styled from "styled-components";
import { ColorPrimary } from "../../css/variables";

export const Features = styled.section`
  display: flex;
  align-items: center;
  padding: 2rem 0;
  width: 100%;
`;

export const FeatureImage = styled.img`
  height: 200px;
  width: 200px;
`;

export const FeatureButton = styled.div`
  margin-top: 15px;
  text-align: center;

  a {
    padding: 10px 30px;
    border: 2px solid ${ColorPrimary};
    display: inline-block;
    border-radius: 6px;
    color: ${ColorPrimary};
    font-size: 18px;
    font-weight: bold;
    background-color: transparent;
    transition: all 0.3s ease;

    :hover {
      text-decoration: none;
      background-color: ${ColorPrimary};
      color: white;
    }
  }
`;
