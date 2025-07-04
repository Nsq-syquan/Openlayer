import React from "react";
import OLMap from "../../components/OLMap";

import data from "../../data/province.json";

const Home = () => {
  return (
    <div className="w-screen h-screen">
      <OLMap
        geojsonData={data}
        zoom={10}
        onFeatureClick={(feature) => console.log("Thông tin:", feature)}
        report={{
          active: true,
          content: "Hello",
        }}
        sidebar={{
          active: false,
          content: "Sidebar custom",
        }}
        isDraw
      />
    </div>
  );
};

export default Home;
