import useBaseUrl from "@docusaurus/useBaseUrl";
import React from "react";

import sources from "../../utils/sources";
import { FeatureImage, Features } from "./styles";

const Feature = ({ imageUrl, title, description }) => {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={"col col--4"}>
      {imgUrl && (
        <div className="text--center">
          <FeatureImage src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

const Sources = () => {
  return (
    <div>
      {sources && sources.length > 0 && (
        <Features>
          <div className="container">
            <div className="row">
              {sources.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </Features>
      )}
    </div>
  );
};

export default Sources;
