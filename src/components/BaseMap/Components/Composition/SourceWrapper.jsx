import React from "react";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import TileWMS from "ol/source/TileWMS";
import ImageWMS from "ol/source/ImageWMS";

const normalizeWmsParams = (params) =>
  Object.keys(params).reduce((acc, key) => {
    acc[key.toUpperCase()] = params[key];
    return acc;
  }, {});


export const SourceWrapper = ({
  type = "vector", // "vector" | "tile-wms" | "image-wms"
  customSource,    // ưu tiên nếu có
  data,
  id,
  wmsUrl,
  wmsParams = {},
  children,
}) => {
  // Nếu đã có source sẵn từ ngoài truyền vào thì dùng luôn
  if (customSource) {
    return React.Children.map(children, (child) =>
      child ? React.cloneElement(child, { source: customSource }) : null
    );
  }

  let source = null;
  const normalizedParams = normalizeWmsParams(wmsParams);

  if (type === "vector") {
    try {
      const geojson = typeof data === "string" ? JSON.parse(data) : data;

      const features = new GeoJSON().readFeatures(geojson, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      source = new VectorSource({ features });
      if (id) source.set("id", id);
    } catch (err) {
      console.warn("⚠️ Lỗi đọc dữ liệu GeoJSON:", err);
      return null;
    }
  } else if (type === "tile-wms" && wmsUrl && normalizedParams.LAYERS) {
    source = new TileWMS({
      url: wmsUrl,
      params: {
        TILED: true,
        ...normalizedParams,
      },
      serverType: normalizedParams.serverType || "geoserver",
      crossOrigin: "anonymous",
    });
    if (id) source.set("id", id);
  } else if (type === "image-wms" && wmsUrl && normalizedParams.LAYERS) {
    source = new ImageWMS({
      url: wmsUrl,
      params: {
        FORMAT: "image/png",
        TRANSPARENT: true,
        ...normalizedParams,
      },
      serverType: normalizedParams.serverType || "geoserver",
      crossOrigin: "anonymous",
    });
    if (id) source.set("id", id);
  } else {
    console.warn("⚠️ SourceWrapper config không hợp lệ:", { type, wmsUrl, wmsParams });
    return null;
  }

  return React.Children.map(children, (child) =>
    child ? React.cloneElement(child, { source }) : null
  );
};
