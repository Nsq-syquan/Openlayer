import React, { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import { useMap } from "../../hooks/useMap";

export const LayerWrapper = ({ source, type = "vector", style, idLayer }) => {
  const map = useMap();
  const layerRef = useRef();

  useEffect(() => {
    if (!map || !source) return;

    let layer;
    if (type === "vector") {
      layer = new VectorLayer({ source, style });
    } else if (type === "tile-wms") {
      layer = new TileLayer({ source });
    } else if (type === "image-wms") {
      layer = new ImageLayer({ source });
    }

    if (idLayer) layer.set("id", idLayer);
    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, source, type, style, idLayer]);

  return null;
};

