import React, { useEffect, useRef } from "react";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke } from "ol/style";

const defaultStyle = new Style({
    fill: new Fill({ color: "rgba(0, 123, 255, 0.3)" }),
    stroke: new Stroke({ color: "#007bff", width: 2 }),
});

const SourceVector = ({ map, data, style, idSource, idLayer }) => {
    const layerRef = useRef();

    useEffect(() => {
        if (!map || !data) return;

        const vectorSource = new VectorSource({
            features: new GeoJSON().readFeatures(data, {
                featureProjection: "EPSG:3857",
            }),
        });
        if (idSource) vectorSource.set("id", idSource);

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: style || defaultStyle,
        });
        if (idLayer) vectorLayer.set("id", idLayer);

        map.addLayer(vectorLayer);
        layerRef.current = vectorLayer;

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
            }
        };
    }, [map, data, style, idSource, idLayer]);

    return null;
};

export default SourceVector;