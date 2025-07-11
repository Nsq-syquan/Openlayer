import { Typography } from "antd";
import { Fill, Stroke, Style } from "ol/style";
import { useCallback, useMemo, useRef, useState } from "react";
import BaseMap from "../../components/BaseMap";
import DrawTools from "../../components/BaseMap/Components/DrawTools";
import Popup from "../../components/BaseMap/Components/Popup";
import { Rightbar } from "../../components/BaseMap/Components/Rightbar";
import { Sidebar } from "../../components/BaseMap/Components/Sidebar";
import MapLayer from "../../components/BaseMap/Components/Source";
import { handleMapClickSelectFeature } from "../../components/BaseMap/handlers/handleMapClickSelectFeature";
import data from "../../data/province.json";

const Home = () => {
  const mapRef = useRef();
  const [popupData, setPopupData] = useState(null);
  const [drawType, setDrawType] = useState(null);
  const drawRef = useRef(null);
  const selectedDrawIdRef = useRef(null);

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
    const { coordinate, pixel } = evt;

    const vectorSource = drawRef.current;

    const featureAtDrawLayer = mapRef?.current.forEachFeatureAtPixel(
      pixel,
      (feat, layer) => {
        if (layer?.get("name") === "drawLayer") return feat;
        return null;
      }
    );

    // Select feature trong DrawTools
    handleMapClickSelectFeature(mapRef.current, evt, {
      vectorSource,
      selectedDrawIdRef,
      onFeatureSelect: (id) => {
        console.log("select draw ", id);
        // setPopupData({ featureId: id });
      },
    });

    // Select feature ở layer khác (ví dụ: my-vector-layer)
    const feature = mapRef?.current.forEachFeatureAtPixel(
      pixel,
      (feat, layer) => {
        if (layer?.get("id") === "my-vector-layer") {
          return {
            ...feat,
            properties: feat.getProperties(),
            "layer-id": layer.get("id"),
          };
        }
        return null;
      }
    );

    if (feature) {
      setPopupData({
        lngLat: coordinate,
        feature,
      });
    } else {
      setPopupData(undefined);
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
        // style={"https://cdnbeta.tgdd.vn/maps/styles/mwg.json"}
        zoom={10}
        onClick={onClickMap}
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

        {/* Sidebar hiển thị nội dung */}
        <Sidebar>
          <Typography.Title level={5}>Thông tin chi tiết</Typography.Title>
          {popupData?.feature?.properties?.tentinh ? (
            <Typography.Text>
              Tên tỉnh: {popupData.feature.properties.tentinh}
            </Typography.Text>
          ) : (
            <Typography.Text>Không có dữ liệu</Typography.Text>
          )}
        </Sidebar>
        <Rightbar>
          <Typography.Title level={5}>Thông tin chi tiết</Typography.Title>
          {popupData?.feature?.properties?.tentinh ? (
            <Typography.Text>
              Tên tỉnh: {popupData.feature.properties.tentinh}
            </Typography.Text>
          ) : (
            <Typography.Text>Không có dữ liệu</Typography.Text>
          )}
        </Rightbar>

        <Popup coordinate={popupData?.lngLat}>
          <Typography.Text>
            {popupData?.feature?.properties?.tentinh}
          </Typography.Text>
        </Popup>

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
