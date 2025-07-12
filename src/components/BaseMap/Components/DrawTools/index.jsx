import React, { useCallback, useEffect, useRef, forwardRef } from "react";
import { v4 as uuidv4 } from "uuid";
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
import Select from "ol/interaction/Select";
import { click } from "ol/events/condition";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { BsSlashLg } from "react-icons/bs";
import { FaRegCircle } from "react-icons/fa";
import { GrClear } from "react-icons/gr";
import { TbPolygon } from "react-icons/tb";
import GroupButton from "./GroupButton";
import Overlay from "ol/Overlay";
import { getArea, getLength } from "ol/sphere";
import "./index.css";
import { useMap } from "../../hooks/useMap";

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
const SELECTED_STYLE = new Style({
  fill: new Fill({ color: "rgba(255,0,0,0.4)" }),
  stroke: new Stroke({ color: "#ff0000", width: 3 }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "#ff0000" }),
  }),
});

export const DrawTools = forwardRef(
  (
    {
      map = useMap(),
      activeDrawType,
      setActiveDrawType,
      optionalTools = [],
      onFeatureCreate,
      onFeatureUpdate,
      onFeatureDelete,
      onFeatureSelect,
      ...rest
    },
    ref
  ) => {
    const drawRef = useRef();
    const snapRef = useRef();
    const modifyRef = useRef();
    const selectRef = useRef();
    const vectorLayerRef = useRef();
    const geojsonDraw = useRef([]);
    const translateRef = useRef([]);
    const helpTooltipRef = useRef(null);
    const helpTooltipElementRef = useRef(null);
    const tooltipOverlaysRef = useRef({});
    const centerPointLayerRef = useRef();
    const segmentOverlaysRef = useRef([]);
    const vectorSourceRef = useRef();
    const selectedDrawIdRef = useRef(null);

    const exportGeoJSON = useCallback((features) => {
      const featureCollection = { type: "FeatureCollection", features };
      console.log("GeoJSON exported:", featureCollection);
      return featureCollection;
    }, []);

    const createHelpTooltip = useCallback(() => {
      if (helpTooltipElementRef.current) {
        helpTooltipElementRef.current.remove();
      }

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
    }, [map]);

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

    const clearSegmentOverlays = useCallback(() => {
      segmentOverlaysRef.current.forEach((o) => map.removeOverlay(o));
      segmentOverlaysRef.current = [];
    }, [map]);

    const addSegmentLengths = useCallback(
      (geom) => {
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
      },
      [map, clearSegmentOverlays]
    );

    const updateStaticTooltip = useCallback(
      (feature) => {
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
          overlay = new Overlay({
            element,
            offset: [0, -10],
            positioning: "bottom-center",
            stopEvent: false,
          });
          map.addOverlay(overlay);
          tooltipOverlaysRef.current[id] = overlay;
        }

        overlay.getElement().innerHTML = tooltipText;
        overlay.setPosition(position);
      },
      [map, addSegmentLengths]
    );

    const updateCenterPoint = useCallback(
      (feature) => {
        if (!feature || !centerPointLayerRef.current) return;

        const geom = feature.getGeometry();
        if (geom.getType() !== "Circle") return;

        const center = geom.getCenter();
        const centerSource = centerPointLayerRef.current.getSource();

        let centerFeature = feature.get("tempCenter");

        if (!centerFeature) {
          centerFeature = new Feature(new Point(center));
          centerSource.addFeature(centerFeature);
          feature.set("tempCenter", centerFeature);
        } else {
          centerFeature.setGeometry(new Point(center));
        }
      },
      []
    );

    const deleteFeature = useCallback(
      (featureId) => {
        if (!map || !vectorSourceRef.current) return;

        const feature = vectorSourceRef.current.getFeatureById(featureId);
        if (feature) {
          vectorSourceRef.current.removeFeature(feature);

          // Remove static tooltip
          const overlay = tooltipOverlaysRef.current[featureId];
          if (overlay) {
            map.removeOverlay(overlay);
            delete tooltipOverlaysRef.current[featureId];
          }

          // Remove segment tooltips by clearing all segment overlays
          clearSegmentOverlays();

          // Remove center point if exists
          const centerFeature = feature.get("tempCenter");
          if (centerFeature) {
            centerPointLayerRef.current?.getSource().removeFeature(centerFeature);
          }

          // Update GeoJSON
          geojsonDraw.current = geojsonDraw.current.filter((f) => f.id !== featureId);
          exportGeoJSON(geojsonDraw.current);

          // Notify parent
          if (onFeatureDelete) {
            onFeatureDelete(featureId);
          }

          // Clear selectedDrawId if the deleted feature was selected
          if (selectedDrawIdRef.current === featureId) {
            selectedDrawIdRef.current = null;
            if (onFeatureSelect) {
              onFeatureSelect(null);
            }
          }

          // Refresh layer to update style
          vectorLayerRef.current?.getSource().changed();
        }
      },
      [map, exportGeoJSON, clearSegmentOverlays, onFeatureDelete, onFeatureSelect]
    );

    // Setup center point layer
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
        if (map && layer) {
          map.removeLayer(layer);
        }
      };
    }, [map]);

    // Setup vector layer and interactions
    useEffect(() => {
      if (!map) return;

      const vectorSource = new VectorSource();
      vectorSourceRef.current = vectorSource;

      if (ref) {
        if (typeof ref === "function") {
          ref(vectorSource);
        } else {
          ref.current = vectorSource;
        }
      }

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        properties: { name: DRAW_LAYER_NAME, idLayer: DRAW_LAYER_NAME },
        style: (feature) =>
          feature.getId() === selectedDrawIdRef.current ? SELECTED_STYLE : DRAW_STYLE,
      });
      vectorLayer.setZIndex(DRAW_LAYER_ZINDEX);
      map.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;

      const modify = new Modify({ source: vectorSource });
      map.addInteraction(modify);

      modify.on("modifyend", (e) => {
        const updatedFeatures = e.features.getArray();
        updatedFeatures.forEach((feature) => {
          updateExportFeature(feature);
          updateStaticTooltip(feature);
          updateCenterPoint(feature);
          if (onFeatureUpdate) {
            onFeatureUpdate(feature);
          }
        });
        vectorLayer.getSource().changed();
      });

      modify.on("modifystart", (e) => {
        e.features.forEach((feature) => {
          const geom = feature.getGeometry();
          if (geom.getType() === "Circle") {
            const centerFeature = feature.get("tempCenter");
            if (centerFeature) {
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
        const updatedFeatures = e.features.getArray();
        updatedFeatures.forEach((feature) => {
          updateExportFeature(feature);
          updateStaticTooltip(feature);
          updateCenterPoint(feature);
          if (onFeatureUpdate) {
            onFeatureUpdate(feature);
          }
        });
        vectorLayer.getSource().changed();
      });
      map.addInteraction(translate);
      translateRef.current.push(translate);

      const select = new Select({
        condition: click,
        layers: [vectorLayer],
        style: SELECTED_STYLE,
      });
      map.addInteraction(select);

      select.on("select", (e) => {
        const selectedFeature = e.selected[0];
        const previousSelectedId = selectedDrawIdRef.current;

        if (selectedFeature) {
          selectedDrawIdRef.current = selectedFeature.getId();
          if (onFeatureSelect) {
            onFeatureSelect(selectedFeature.getId());
          }
        } else {
          selectedDrawIdRef.current = null;
          if (onFeatureSelect) {
            onFeatureSelect(null);
          }
        }

        if (previousSelectedId) {
          const prevFeature = vectorSource.getFeatureById(previousSelectedId);
          if (prevFeature) {
            prevFeature.setStyle(undefined);
          }
        }

        vectorLayer.getSource().changed();
      });

      selectRef.current = select;

      return () => {
        if (map) {
          map.removeLayer(vectorLayer);
          map.removeInteraction(modify);
          map.removeInteraction(translate);
          map.removeInteraction(select);
        }
        translateRef.current = translateRef.current.filter((t) => t !== translate);
        if (ref) {
          if (typeof ref === "function") {
            ref(null);
          } else {
            ref.current = null;
          }
        }
      };
    }, [
      map,
      ref,
      updateExportFeature,
      updateStaticTooltip,
      updateCenterPoint,
      onFeatureUpdate,
      onFeatureSelect,
    ]);

    // Handle drawing interactions
    useEffect(() => {
      if (!map || !vectorSourceRef.current || !activeDrawType) return;

      if (drawRef.current) map.removeInteraction(drawRef.current);
      if (snapRef.current) map.removeInteraction(snapRef.current);

      drawRef.current = null;
      snapRef.current = null;

      const draw = new Draw({
        source: vectorSourceRef.current,
        type: activeDrawType,
      });

      draw.on("drawstart", (e) => {
        const feature = e.feature;
        const geom = feature.getGeometry();
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

        geom.on("change", (evt) => {
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
          const id = uuidv4();
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

        if (onFeatureCreate) {
          onFeatureCreate(feature);
        }
      });

      map.addInteraction(draw);
      drawRef.current = draw;

      const snap = new Snap({ source: vectorSourceRef.current });
      map.addInteraction(snap);
      snapRef.current = snap;

      return () => {
        if (map) {
          map.removeInteraction(draw);
          map.removeInteraction(snap);
        }
      };
    }, [
      map,
      activeDrawType,
      setActiveDrawType,
      updateExportFeature,
      updateStaticTooltip,
      updateCenterPoint,
      onFeatureCreate,
    ]);

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
          source: vectorSourceRef.current,
          type: drawType,
        });
        drawRef.current = draw;
        map.addInteraction(draw);

        const snap = new Snap({ source: vectorSourceRef.current });
        snapRef.current = snap;
        map.addInteraction(snap);

        setActiveDrawType(drawType);
      },
      [activeDrawType, map, setActiveDrawType]
    );

    const clearDrawings = useCallback(() => {
      if (!map || !vectorSourceRef.current) return;

      Object.values(tooltipOverlaysRef.current).forEach((overlay) => {
        if (overlay) map.removeOverlay(overlay);
      });
      tooltipOverlaysRef.current = {};

      clearSegmentOverlays();

      vectorSourceRef.current.clear();
      geojsonDraw.current = [];
      exportGeoJSON([]);

      centerPointLayerRef.current?.getSource().clear();

      selectedDrawIdRef.current = null;
      if (onFeatureSelect) {
        onFeatureSelect(null);
      }
      if (onFeatureDelete) {
        onFeatureDelete("all");
      }
    }, [map, exportGeoJSON, clearSegmentOverlays, onFeatureDelete, onFeatureSelect]);

    const deleteSelectedFeature = useCallback(() => {
      if (selectedDrawIdRef.current) {
        deleteFeature(selectedDrawIdRef.current);
      } else {
        console.warn("No feature selected to delete.");
      }
    }, [deleteFeature]);

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
        title: "Xóa Feature Được Chọn",
        icon: <GrClear size={20} />,
        onClick: deleteSelectedFeature,
      },
      {
        title: "Xóa Tất Cả",
        icon: <GrClear size={20} />,
        onClick: clearDrawings,
      },
    ];

    const allTools = [...defaultTools, ...optionalTools];

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
  }
);
