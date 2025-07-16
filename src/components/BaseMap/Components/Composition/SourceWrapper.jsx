import React, { useMemo } from "react";
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
  customSource,
  data,
  id,
  wmsUrl,
  wmsParams = {},
  children,
}) => {
  // ✅ Nếu có customSource → ưu tiên dùng
  const source = useMemo(() => {
    if (customSource) return customSource;

    const normalizedParams = normalizeWmsParams(wmsParams);

    if (type === "vector") {
      try {
        const geojson = typeof data === "string" ? JSON.parse(data) : data;

        const features = new GeoJSON().readFeatures(geojson, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });

        const src = new VectorSource({ features });
        if (id) src.set("id", id);
        return src;
      } catch (err) {
        console.warn("⚠️ Lỗi đọc dữ liệu GeoJSON:", err);
        return null;
      }
    }

    if (type === "tile-wms" && wmsUrl && normalizedParams.LAYERS) {
      const src = new TileWMS({
        url: wmsUrl,
        params: {
          TILED: true,
          ...normalizedParams,
        },
        serverType: normalizedParams.SERVER_TYPE || "geoserver",
        crossOrigin: "anonymous",
      });
      if (id) src.set("id", id);
      return src;
    }

    if (type === "image-wms" && wmsUrl && normalizedParams.LAYERS) {
      const src = new ImageWMS({
        url: wmsUrl,
        params: {
          FORMAT: "image/png",
          TRANSPARENT: true,
          ...normalizedParams,
        },
        serverType: normalizedParams.SERVER_TYPE || "geoserver",
        crossOrigin: "anonymous",
      });
      if (id) src.set("id", id);
      return src;
    }

    console.warn("⚠️ SourceWrapper config không hợp lệ:", {
      type,
      wmsUrl,
      wmsParams,
    });

    return null;
  }, [type, data, id, wmsUrl, wmsParams, customSource]);

  // ✅ Nếu source null thì không render gì cả
  if (!source) return null;

  // ✅ Truyền source vào children
  return React.Children.map(children, (child) =>
    React.isValidElement(child) ? React.cloneElement(child, { source }) : null
  );
};
