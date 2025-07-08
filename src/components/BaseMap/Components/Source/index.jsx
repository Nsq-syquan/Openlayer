import React, { useEffect, useRef } from "react";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import { Style, Fill, Stroke } from "ol/style";
import { useMap } from "../../../hooks/useMap";

const defaultStyle = new Style({
  fill: new Fill({ color: "rgba(0, 123, 255, 0.3)" }),
  stroke: new Stroke({ color: "#007bff", width: 2 }),
});

const MapLayer = ({
  data, // Dữ liệu cho VectorLayer (GeoJSON)
  style, // Style cho VectorLayer
  idSource, // ID của source
  idLayer, // ID của layer
  sourceType = "vector", // Loại source: "vector" hoặc "wms"
  wmsParams = {}, // Tham số WMS (layers, styles, v.v.)
  wmsUrl, // URL của WMS server
}) => {
  const map = useMap();
  const layerRef = useRef();

  useEffect(() => {
    if (!map) return;

    let layer;

    if (sourceType === "vector") {
      // Xử lý Vector Layer
      if (!data) {
        console.warn("⚠️ Không có dữ liệu cho Vector Layer.");
        return;
      }

      const geojsonObject = typeof data === "string" ? JSON.parse(data) : data;

      const features = new GeoJSON().readFeatures(geojsonObject, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      if (!features.length) {
        console.warn("⚠️ Không có feature nào trong dữ liệu.");
        return;
      }

      const vectorSource = new VectorSource({
        features,
      });
      if (idSource) vectorSource.set("id", idSource);

      layer = new VectorLayer({
        source: vectorSource,
        style: style || defaultStyle,
      });
    } else if (sourceType === "wms") {
      // Xử lý WMS Layer
      if (!wmsUrl || !wmsParams.layers) {
        console.warn("⚠️ Thiếu wmsUrl hoặc wmsParams.layers cho WMS Layer.");
        return;
      }

      const wmsSource = new TileWMS({
        url: wmsUrl,
        params: {
          LAYERS: wmsParams.layers,
          TILED: true,
          ...wmsParams, // Các tham số khác như styles, format, v.v.
        },
        projection: "EPSG:3857",
        serverType: wmsParams.serverType || "geoserver", // Mặc định là GeoServer
      });

      layer = new TileLayer({
        source: wmsSource,
      });
    } else {
      console.warn("⚠️ Loại source không hợp lệ:", sourceType);
      return;
    }

    // Gán idLayer cho layer
    if (idLayer) layer.set("id", idLayer);

    // Thêm layer vào bản đồ
    map.addLayer(layer);
    layerRef.current = layer;

    // Cleanup khi component unmount
    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, data, style, idSource, idLayer, sourceType, wmsUrl, JSON.stringify(wmsParams)]);

  return null;
};

export default MapLayer;