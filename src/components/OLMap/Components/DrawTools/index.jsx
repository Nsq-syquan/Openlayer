import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import { fromCircle } from "ol/geom/Polygon";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Snap from "ol/interaction/Snap";
import Translate from "ol/interaction/Translate";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { useCallback, useEffect, useRef } from "react";
import { BsSlashLg } from "react-icons/bs";
import { FaRegCircle } from "react-icons/fa";
import { GrClear } from "react-icons/gr";
import { TbPolygon } from "react-icons/tb";
import GroupButton from "./GroupButton";
import "./index.css";

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

import Overlay from "ol/Overlay";
import { getArea, getLength } from "ol/sphere";

const DrawTools = ({
  map,
  ref,
  activeDrawType,
  setActiveDrawType,
  optionalTools,
  ...rest
}) => {
  const drawRef = useRef();
  const snapRef = useRef();
  const modifyRef = useRef();
  const vectorLayerRef = useRef();
  const geojsonDraw = useRef([]);
  const translateRef = useRef([]);
  const helpTooltipRef = useRef(null);
  const helpTooltipElementRef = useRef(null);
  const tooltipOverlaysRef = useRef({});
  const centerPointLayerRef = useRef();
  const segmentOverlaysRef = useRef([]);

  const exportGeoJSON = useCallback((features) => {
    const featureCollection = { type: "FeatureCollection", features };
    console.log("export: ", featureCollection);
    return featureCollection;
  }, []);

  const createHelpTooltip = () => {
    if (helpTooltipElementRef.current) helpTooltipElementRef.current.remove();

    const tooltipElement = document.createElement("div");
    tooltipElement.className = "tooltip tooltip-measure";
    helpTooltipElementRef.current = tooltipElement;

    const tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: "bottom-center",
    });

    map.addOverlay(tooltipOverlay);
    helpTooltipRef.current = tooltipOverlay;
  };

  const updateExportFeature = useCallback((feature) => {
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
    if (index >= 0) geojsonDraw.current[index] = geojson;
    else geojsonDraw.current.push(geojson);

    exportGeoJSON(geojsonDraw.current);
  }, [exportGeoJSON]);

  const clearSegmentOverlays = () => {
    segmentOverlaysRef.current.forEach((o) => map.removeOverlay(o));
    segmentOverlaysRef.current = [];
  };

  const addSegmentLengths = (geom) => {
    if (!map || !geom) return;
    clearSegmentOverlays();
    const coords = geom.getCoordinates();
    const isPolygon = geom.getType() === "Polygon";
    const lineCoords = isPolygon ? coords[0] : coords;

    for (let i = 0; i < lineCoords.length - 1; i++) {
      const p1 = lineCoords[i];
      const p2 = lineCoords[i + 1];
      const length = getLength(new LineString([p1, p2])).toFixed(2);
      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      const el = document.createElement("div");
      el.className = "tooltip tooltip-segment";
      // el.innerHTML = `${length} m`;
      el.innerHTML = `<div class="tooltip-label">${length} m</div>`;


      const overlay = new Overlay({
        element: el,
        offset: [0, -8],
        positioning: "bottom-center",
        stopEvent: false,
      });

      overlay.setPosition(mid);
      map.addOverlay(overlay);
      segmentOverlaysRef.current.push(overlay);
    }
  };

  const updateStaticTooltip = (feature) => {
    const id = feature.getId();
    if (!id || !map) return;

    let geom = feature.getGeometry();
    let tooltipText = "";
    let position;

    if (geom.getType() === "Circle") {
      tooltipText = `${geom.getRadius().toFixed(2)} m`;
      position = geom.getCenter();
    } else if (geom.getType() === "LineString") {
      tooltipText = `Tổng: ${getLength(geom).toFixed(2)} m`;
      const coords = geom.getCoordinates();
      position = coords[coords.length - 1];
      addSegmentLengths(geom);
    } else if (geom.getType() === "Polygon") {
      const ring = geom.getLinearRing(0);
      const perimeter = getLength(new LineString(ring.getCoordinates())).toFixed(2);
      const area = getArea(geom).toFixed(2);
      // tooltipText = `Chu vi: ${perimeter} m - Diện tích: ${area} m²`;
      tooltipText = `
        <div class="tooltip-label">${perimeter} m</div>
        <div class="tooltip-label">${area} m²</div>
      `;

      position = geom.getInteriorPoint().getCoordinates();
      addSegmentLengths(ring);
    } else return;

    let overlay = tooltipOverlaysRef.current[id];
    if (!overlay) {
      const element = document.createElement("div");
      element.className = "tooltip tooltip-static";
      overlay = new Overlay({ element, offset: [0, -10], positioning: "bottom-center", stopEvent: false });
      map.addOverlay(overlay);
      tooltipOverlaysRef.current[id] = overlay;
    }

    overlay.getElement().innerHTML = tooltipText;
    overlay.setPosition(position);
  };

  const updateCenterPoint = (feature) => {
    if (!feature || !centerPointLayerRef.current) return;

    const geom = feature.getGeometry();
    if (geom.getType() !== "Circle") return;

    const center = geom.getCenter();
    const centerSource = centerPointLayerRef.current.getSource();

    let centerFeature = feature.get("tempCenter");

    if (!centerFeature) {
      // Chưa có → tạo mới
      centerFeature = new Feature(new Point(center));
      centerSource.addFeature(centerFeature);
      feature.set("tempCenter", centerFeature);
    } else {
      // Đã có → update vị trí
      centerFeature.setGeometry(new Point(center));
    }
  };

  useEffect(() => {
    if (!map) return;

    const layer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: "red" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      }),
    });

    layer.setZIndex(1100);
    map.addLayer(layer);
    centerPointLayerRef.current = layer;

    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

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
      e.features.forEach((feature) => {
        updateStaticTooltip(feature);
        updateCenterPoint(feature);
      });
    });

    modify.on("modifystart", (e) => {
      e.features.forEach((feature) => {
        const geom = feature.getGeometry();
        if (geom.getType() === "Circle") {
          const centerFeature = feature.get("tempCenter");

          if (centerFeature) {
            // Khi hình tròn thay đổi → cập nhật tâm
            geom.on("change", () => {
              const center = geom.getCenter();
              centerFeature.setGeometry(new Point(center));
            });
          }
        }
      });
    });
    modifyRef.current = modify;

    const translate = new Translate({ layers: [vectorLayer] });
    translate.on("translateend", (e) => {
      e.features.forEach(updateExportFeature);
      e.features.forEach((feature) => {
        updateStaticTooltip(feature);
        updateCenterPoint(feature);
      });
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
    let sketch;
    let centerPointFeature = null;
    draw.on("drawstart", (e) => {
      const feature = e.feature;
      const geom = feature.getGeometry();
      sketch = e.feature;
      createHelpTooltip();

      if (geom.getType() === "Circle") {
        const tempCenter = new Feature(new Point(geom.getCenter()));
        centerPointLayerRef.current?.getSource().addFeature(tempCenter);
        feature.set("tempCenter", tempCenter);

        geom.on("change", () => {
          const center = geom.getCenter();
          const f = feature.get("tempCenter");
          if (f) f.setGeometry(new Point(center));
        });
      }

      // Khi kéo chuột trong lúc vẽ
      sketch.getGeometry().on("change", (evt) => {
        const geom = evt.target;
        const tooltip = helpTooltipElementRef.current;

        if (!tooltip || !map) return;

        if (geom.getType() === "Circle") {
          const center = geom.getCenter();
          const radius = geom.getRadius();
          tooltip.innerHTML = `${radius.toFixed(2)} m`;
          helpTooltipRef.current.setPosition(center);
        }

        if (geom.getType() === "LineString") {
          const coords = geom.getCoordinates();
          if (coords.length > 1) {
            const lastSegLength = getLength(
              new LineString([
                coords[coords.length - 2],
                coords[coords.length - 1],
              ])
            );
            tooltip.innerHTML = `${lastSegLength.toFixed(2)} m`;
            helpTooltipRef.current.setPosition(coords[coords.length - 1]);
          }
        }
      });
    });

    draw.on("drawend", (e) => {
      const feature = e.feature;

      if (!feature.getId()) {
        const id = Date.now().toString();
        feature.setId(id);
        feature.set("id", id);
      }

      const tempCenter = feature.get("tempCenter");

      if (tempCenter) {
        centerPointLayerRef.current?.getSource().removeFeature(tempCenter);
        feature.unset("tempCenter");
      }

      if (helpTooltipRef.current) {
        map.removeOverlay(helpTooltipRef.current);
        helpTooltipRef.current = null;
      }
      helpTooltipElementRef.current = null;

      updateExportFeature(feature);
      updateStaticTooltip(feature);
      updateCenterPoint(feature);
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

  const clearDrawings = useCallback(() => {
    if (!map) return;

    Object.values(tooltipOverlaysRef.current).forEach((overlay) => {
      if (overlay) map.removeOverlay(overlay);
    });
    tooltipOverlaysRef.current = {};

    clearSegmentOverlays();

    ref.current?.clear();
    geojsonDraw.current = [];
    exportGeoJSON([]);

    centerPointLayerRef.current?.getSource().clear();
  }, [map, ref, exportGeoJSON]);

  const defaultTools = [
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
  ];

  // ✅ Gộp thêm từ props.optionalTools nếu có
  const allTools = [...defaultTools, ...(optionalTools || [])];

  return (
    <>
      <GroupButton
        direction="column"
        title="Tools"
        animate={true}
        children={allTools}
        position={{ bottom: 110, right: 10 }}
      />

      
    </>
  );
};

export default DrawTools;
