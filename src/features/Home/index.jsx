import React, { useCallback, useMemo, useRef, useState } from "react";
import data from "../../data/province.json";
import Sidebar from "../../components/BaseMap/Components/Sidebar";
import Popup from "../../components/BaseMap/Components/Popup";
import MapLayer from "../../components/BaseMap/Components/Source";
import DrawTools from "../../components/BaseMap/Components/DrawTools";
import { LuLayers2 } from "react-icons/lu";
import { Reportbar } from "../../components/BaseMap/Components/Reportbar";
import BaseMap from "../../components/BaseMap";
import { Fill, Stroke, Style } from "ol/style";

const Home = () => {
  const mapRef = useRef();
  const [popupData, setPopupData] = useState(null);
  const [drawType, setDrawType] = useState(null);
  const drawRef = useRef(null);
  const popupRef = useRef(null);


  const wmsParams = useMemo(
    () => ({
      service: "wms",
      layers: "topp:states",
      format: "image/png",
      transparent: true,
    }),
    []
  );

  const onClickMap = useCallback((evt) => {
    const { coordinate, feature, layer } = evt;
    console.log("Map click:", evt);

    if (feature) {
    const coordinates = evt.coordinate;
    const data = feature.properties;
    popupRef.current?.show(coordinates, data);
  } else {
    popupRef.current?.hide();
  }
  }, []);

  const handleFeatureCreate = useCallback((feature) => {
    console.log("Feature created:", feature.getId());
  }, []);

  const handleFeatureUpdate = useCallback((feature) => {
    console.log("Feature updated:", feature.getId());
  }, []);

  const handleFeatureDelete = useCallback((featureId) => {
    console.log("Feature deleted:", featureId);
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <BaseMap
        ref={mapRef}
        style={"https://cdnv2.tgdd.vn/maps/styles/mwg.json"}
        zoom={10}
        onClick={onClickMap}
        report={{
          active: true,
          content: "Hello",
        }}
        sidebar={{
          active: true,
          content: "Sidebar custom",
        }}
        isDraw
      >
        <DrawTools
          ref={drawRef}
          activeDrawType={drawType}
          setActiveDrawType={setDrawType}
          onFeatureCreate={handleFeatureCreate}
          onFeatureUpdate={handleFeatureUpdate}
          onFeatureDelete={handleFeatureDelete}
        />

        <Sidebar content={"Hello"} />
        <Popup ref={popupRef} />
        <Reportbar />

        <MapLayer
          sourceType="vector"
          data={data}
          idSource="my-vector-source"
          idLayer="my-vector-layer"
          style={
            new Style({
              fill: new Fill({ color: "rgba(0, 123, 255, 0.3)" }),
              stroke: new Stroke({ color: "#007bff", width: 2 }),
              zIndex: 3,
            })
          }
        />
        <MapLayer
          sourceType="wms"
          wmsUrl="https://ahocevar.com/geoserver/ows"
          wmsParams={wmsParams}
          idLayer="wms-layer"
        />
      </BaseMap>
    </div>
  );
};

export default Home;
