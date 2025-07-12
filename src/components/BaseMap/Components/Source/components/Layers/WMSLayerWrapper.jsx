import React, { useEffect, useRef } from "react";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import ImageLayer from "ol/layer/Image";
import ImageWMS from "ol/source/ImageWMS";
import { useMap } from "../../../../hooks/useMap";

export const WMSLayerWrapper = ({
  idLayer,
  wmsUrl,
  wmsParams = {},
  renderType = "tile", // "tile" | "image"
}) => {
  const map = useMap();
  const layerRef = useRef();

  useEffect(() => {
    if (!map) return;
    if (!wmsUrl || !wmsParams.layers) {
      console.warn("⚠️ Thiếu wmsUrl hoặc wmsParams.layers cho WMS Layer.");
      return;
    }

    const baseParams = {
      LAYERS: wmsParams.layers,
      STYLES: wmsParams.styles || "",
      FORMAT: wmsParams.format || "image/png",
      TRANSPARENT: wmsParams.transparent ?? true,
      VERSION: wmsParams.version || "1.1.1",
      ...wmsParams,
    };

    let source, layer;

    if (renderType === "tile") {
      source = new TileWMS({
        url: wmsUrl,
        params: baseParams,
        serverType: wmsParams.serverType || "geoserver",
        crossOrigin: "anonymous",
      });

      layer = new TileLayer({ source });
    } else if (renderType === "image") {
      source = new ImageWMS({
        url: wmsUrl,
        params: baseParams,
        serverType: wmsParams.serverType || "geoserver",
        crossOrigin: "anonymous",
      });

      layer = new ImageLayer({ source });
    } else {
      console.warn("⚠️ renderType không hợp lệ:", renderType);
      return;
    }

    if (idLayer) layer.set("id", idLayer);

    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, idLayer, wmsUrl, JSON.stringify(wmsParams), renderType]);

  return null;
};

