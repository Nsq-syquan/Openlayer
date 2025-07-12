import React, { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import { Style, Fill, Stroke } from "ol/style";
import { VectorSourceWrapper } from "../VectorSourceWrapper";
import { useMap } from "../../../../hooks/useMap";

const defaultStyle = new Style({
  fill: new Fill({ color: "rgba(0, 123, 255, 0.3)" }),
  stroke: new Stroke({ color: "#007bff", width: 2 }),
});

export const VectorLayerWrapper = ({ data, style, idSource, idLayer }) => {
  const map = useMap();
  const layerRef = useRef();

  useEffect(() => {
    if (!map) return;

    const source = VectorSourceWrapper({ data, idSource });
    if (!source) return;

    const layer = new VectorLayer({
      source,
      style: style || defaultStyle,
    });

    if (idLayer) layer.set("id", idLayer);

    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, data, style, idSource, idLayer]);

  return null;
};


