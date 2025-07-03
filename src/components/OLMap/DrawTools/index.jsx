import { useEffect, useRef, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Snap from "ol/interaction/Snap";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import GroupButton from "./GroupButton";
import { FaRegCircle } from "react-icons/fa";
import { TbPolygon } from "react-icons/tb";
import { BsSlashLg } from "react-icons/bs";
import { GrClear } from "react-icons/gr";
import GeoJSON from "ol/format/GeoJSON";
import { fromCircle } from "ol/geom/Polygon";
import Translate from "ol/interaction/Translate";

const DRAW_LAYER_NAME = "drawLayer";
const DRAW_LAYER_ZINDEX = 1000;
const DRAW_STYLE = new Style({
  fill: new Fill({ color: "rgba(255,255,255,0.2)" }),
  stroke: new Stroke({ color: "#33cc33", width: 2 }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "#ffcc33" }),
  }),
});

const DrawTools = ({ map, ref, activeDrawType, setActiveDrawType }) => {
  const drawRef = useRef();
  const snapRef = useRef();
  const modifyRef = useRef();
  const vectorLayerRef = useRef();
  const geojsonDraw = useRef([]);
  const translateRef = useRef([]);

  // Helper: Export features as GeoJSON FeatureCollection
  const exportGeoJSON = useCallback((features) => {
    const featureCollection = {
      type: "FeatureCollection",
      features,
    };
    console.log("export: ", featureCollection);
    return featureCollection;
  }, []);

  // Helper: Update or add a feature in geojsonDraw.current
  const updateExportFeature = useCallback(
    (feature) => {
      const id = feature.getId();
      if (!id) return;

      const clone = feature.clone();
      clone.setId(id);
      clone.set("id", id);

      if (clone.getGeometry().getType() === "Circle") {
        const polygon = fromCircle(clone.getGeometry(), 64);
        clone.setGeometry(polygon);
        clone.set("originalType", "Circle");
      }

      const format = new GeoJSON();
      const geojson = format.writeFeatureObject(clone, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:4326",
      });

      const index = geojsonDraw.current.findIndex((f) => f.id === id);
      if (index >= 0) {
        geojsonDraw.current[index] = geojson;
      } else {
        geojsonDraw.current.push(geojson);
      }
      exportGeoJSON(geojsonDraw.current);
    },
    [exportGeoJSON]
  );

  // Setup vector layer and interactions once
  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource();
    ref.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      properties: { name: DRAW_LAYER_NAME },
      style: DRAW_STYLE,
    });
    vectorLayer.setZIndex(DRAW_LAYER_ZINDEX);
    map.addLayer(vectorLayer);
    vectorLayerRef.current = vectorLayer;

    const modify = new Modify({ source: vectorSource });
    map.addInteraction(modify);
    modify.on("modifyend", (e) => {
      e.features.forEach(updateExportFeature); // cập nhật tất cả feature được sửa
    });
    modifyRef.current = modify;

    const translate = new Translate({ layers: [vectorLayer] });
    translate.on("translateend", (e) => {
      e.features.forEach(updateExportFeature);
    });
    map.addInteraction(translate);
    translateRef.current.push(translate);

    return () => {
      map.removeLayer(vectorLayer);
      map.removeInteraction(modify);
      map.removeInteraction(translate);
      translateRef.current = translateRef.current.filter(
        (t) => t !== translate
      );
    };
  }, [map, ref, updateExportFeature]);

  // Handle drawing interactions
  useEffect(() => {
    if (!map || !ref.current) return;

    if (drawRef.current) map.removeInteraction(drawRef.current);
    if (snapRef.current) map.removeInteraction(snapRef.current);

    drawRef.current = null;
    snapRef.current = null;

    if (!activeDrawType) return;

    const draw = new Draw({
      source: ref.current,
      type: activeDrawType,
    });

    draw.on("drawend", (e) => {
      const feature = e.feature;
      if (!feature.getId()) {
        const id = Date.now().toString();
        feature.setId(id);
        feature.set("id", id);
      }
      updateExportFeature(feature);
      setActiveDrawType(null);
    });

    map.addInteraction(draw);
    drawRef.current = draw;

    const snap = new Snap({ source: ref.current });
    map.addInteraction(snap);
    snapRef.current = snap;

    return () => {
      map.removeInteraction(draw);
      map.removeInteraction(snap);
    };
  }, [activeDrawType, map, ref, setActiveDrawType, updateExportFeature]);

  // Start drawing with a given type
  const startDrawing = useCallback(
    (drawType) => {
      if (activeDrawType === drawType) {
        if (drawRef.current) map.removeInteraction(drawRef.current);
        if (snapRef.current) map.removeInteraction(snapRef.current);
        drawRef.current = null;
        snapRef.current = null;
        setActiveDrawType(null);
        return;
      }

      if (drawRef.current) map.removeInteraction(drawRef.current);
      if (snapRef.current) map.removeInteraction(snapRef.current);

      const draw = new Draw({
        source: ref.current,
        type: drawType,
      });
      drawRef.current = draw;
      map.addInteraction(draw);

      const snap = new Snap({ source: ref.current });
      snapRef.current = snap;
      map.addInteraction(snap);

      setActiveDrawType(drawType);
    },
    [activeDrawType, map, ref, setActiveDrawType]
  );

  // Clear all drawings
  const clearDrawings = useCallback(() => {
    ref.current?.clear();
    geojsonDraw.current = [];
    exportGeoJSON([]);
  }, [ref, exportGeoJSON]);

  return (
    <GroupButton
      direction="column"
      title="Tools"
      animate={true}
      children={[
        {
          title: "Hình tròn",
          icon: <FaRegCircle size={20} />,
          onClick: () => startDrawing("Circle"),
        },
        {
          title: "Đa giác",
          icon: <TbPolygon size={20} />,
          onClick: () => startDrawing("Polygon"),
        },
        {
          title: "Line",
          icon: <BsSlashLg size={20} />,
          onClick: () => startDrawing("LineString"),
        },
        {
          title: "Xóa tất cả",
          icon: <GrClear size={20} />,
          onClick: clearDrawings,
        },
      ]}
      position={{ bottom: 12, right: 4 }}
    />
  );
};

export default DrawTools;
