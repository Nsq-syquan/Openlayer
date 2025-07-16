import { Typography } from "antd";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import { Fill, Stroke, Style } from "ol/style";
import proj4 from "proj4";
import { useCallback, useMemo, useRef, useState } from "react";
import BaseMap from "../../components/BaseMap";
import {
  DrawTools,
  Popup,
  Rightbar,
  Sidebar,
} from "../../components/BaseMap/Components";
import {
  LayerWrapper,
  SourceWrapper,
} from "../../components/BaseMap/Components/Composition";
import { onSelectDraw } from "../../components/BaseMap/handlers";
import useWMSClickHandler from "../../components/BaseMap/hooks/useWMSClickHandler";
import dataGeojson from "../../data/province.json";

// Đăng ký VN-2000 (EPSG:9218) - ví dụ: Khu vực Hồ Chí Minh (Zone 48N)
proj4.defs(
  "EPSG:9218",
  "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs +towgs84=0,0,0"
);
register(proj4);

const Home = () => {
  const mapRef = useRef();
  const [popupData, setPopupData] = useState(null);
  const [drawType, setDrawType] = useState(null);
  const drawRef = useRef(null);
  const selectedDrawIdRef = useRef(null);

  const wmsParams = useMemo(
    () => ({
      LAYERS: "topp:states", // ✅ viết hoa
      FORMAT: "image/png",
      TRANSPARENT: true,
    }),
    []
  );

  useWMSClickHandler(mapRef, "wms-source-1", ({ coordinate, data }) => {
    if (data.features?.length > 0) {
      console.log(data?.feature);
      setPopupData({
        lngLat: coordinate,
        feature: {
          properties: {
            name: data?.features[0]?.properties?.["STATE_NAME"],
          },
        },
      });
    } else {
      setPopupData(undefined);
    }
  });

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
    onSelectDraw(mapRef.current, evt, {
      vectorSource,
      selectedDrawIdRef,
      onFeatureSelect: (id) => {
        console.log("select draw ", id);
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
        feature: {
          ...feature,
          properties: {
            ...feature?.properties,
            name: feature?.properties?.tentinh,
          },
        },
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

  const onContextMenu = useCallback(
    (coordinate, map) => [
      {
        label: `📍 Sao chép tọa độ (Tọa độ địa lý)`,
        onClick: () => {
          const lonlat = transform(coordinate, "EPSG:3857", "EPSG:4326"); // WGS84

          const text = `${lonlat[0].toFixed(6)},${lonlat[1].toFixed(6)}
              `.trim();

          navigator.clipboard.writeText(text);
        },
      },
      {
        label: `📍 Sao chép tọa độ (VN-2000)`,
        onClick: () => {
          const vn2000 = transform(coordinate, "EPSG:3857", "EPSG:9218"); // VN-2000 (zone 48)
          const text = `
          ${vn2000[0].toFixed(2)}
            ,${vn2000[1].toFixed(2)}
              `.trim();

          navigator.clipboard.writeText(text);
        },
      },
      {
        label: "🔍 Zoom In",
        onClick: () => {
          map.getView().setZoom(map.getView().getZoom() + 1);
        },
      },
      {
        label: "🔎 Zoom Out",
        onClick: () => {
          map.getView().setZoom(map.getView().getZoom() - 1);
        },
      },
    ],
    []
  );

  const mapChildren = useMemo(
    () => (
      <>
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
            {popupData?.feature?.properties?.name}
          </Typography.Text>
        </Popup>
        <SourceWrapper type="vector" id="my-vector-source" data={dataGeojson}>
          <LayerWrapper
            type="vector"
            id="my-vector-layer"
            style={
              new Style({
                fill: new Fill({ color: "rgba(0, 123, 255, 0.3)" }),
                stroke: new Stroke({ color: "#007bff", width: 2 }),
                zIndex: 3,
              })
            }
          />
        </SourceWrapper>
        <SourceWrapper
          type="tile-wms"
          wmsUrl="https://ahocevar.com/geoserver/wms"
          wmsParams={wmsParams}
          id="wms-source-1"
        >
          <LayerWrapper type="tile-wms" id="wms-layer-1" />
        </SourceWrapper>
      </>
    ),
    [popupData, wmsParams, drawRef, drawType, dataGeojson, mapRef]
  );

  return (
    <div className="w-screen h-screen relative">
      <BaseMap
        ref={mapRef}
        // style={".../style.json"}
        zoom={10}
        onClick={onClickMap}
        onContextMenu={onContextMenu}
      >
        {mapChildren}
      </BaseMap>
    </div>
  );
};

export default Home;
