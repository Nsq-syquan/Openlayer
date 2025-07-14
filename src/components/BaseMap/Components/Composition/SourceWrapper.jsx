import React from "react";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import TileWMS from "ol/source/TileWMS";
import ImageWMS from "ol/source/ImageWMS";

export const SourceWrapper = ({
  type = "vector", // "vector" | "tile-wms" | "image-wms"
  data,
  id,
  wmsUrl,
  wmsParams = {},
  children,
}) => {
  let source = null;

  if (type === "vector") {
    const geojson = typeof data === "string" ? JSON.parse(data) : data;

    const features = new GeoJSON().readFeatures(geojson, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });

    source = new VectorSource({ features });
    if (id) source.set("id", id);
  } else if (type === "tile-wms" && wmsUrl && wmsParams.layers) {
    source = new TileWMS({
      url: wmsUrl,
      params: {
        LAYERS: wmsParams.layers,
        STYLES: wmsParams.styles || "",
        TILED: true,
        ...wmsParams,
      },
      serverType: wmsParams.serverType || "geoserver",
      crossOrigin: "anonymous",
    });
  } else if (type === "image-wms" && wmsUrl && wmsParams.layers) {
    source = new ImageWMS({
      url: wmsUrl,
      params: {
        LAYERS: wmsParams.layers,
        STYLES: wmsParams.styles || "",
        FORMAT: "image/png",
        TRANSPARENT: true,
        ...wmsParams,
      },
      serverType: wmsParams.serverType || "geoserver",
      crossOrigin: "anonymous",
    });
  } else {
    console.warn("⚠️ Invalid source config");
    return null;
  }

  // Clone children and inject `source`
  return React.Children.map(children, (child) =>
    React.cloneElement(child, { source })
  );
};

