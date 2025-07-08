import React, { useEffect, useRef, useState, forwardRef } from "react";
import Map from "ol/Map";
import Overlay from "ol/Overlay";
import View from "ol/View";
import { click } from "ol/events/condition";
import Select from "ol/interaction/Select";
import TileLayer from "ol/layer/Tile";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import XYZ from "ol/source/XYZ";
import { Fill, Stroke, Style } from "ol/style";
import { LuLayers2 } from "react-icons/lu";
import DrawTools from "./Components/DrawTools";
import {
  Attribution,
  defaults as defaultControls,
  MousePosition,
  ScaleLine,
} from "ol/control";
import { createStringXY } from "ol/coordinate";
import { MapContext } from "../hooks/useMap";
import "./index.css";
import { layer } from "openlayers";
import apply from "ol-mapbox-style";
import VectorLayer from "ol/layer/Vector";
const SELECTED_STYLE = new Style({
  stroke: new Stroke({ color: "red", width: 3 }),
  fill: new Fill({ color: "rgba(255,0,0,0.2)" }),
});
// Bọc component bằng forwardRef để nhận ref từ parent
const BaseMap = forwardRef(
  (
    {
      style,
      onClick,
      report = { active: false, title: "Thống kê", content: null },
      sidebar = { active: false, content: null },
      isDraw = false,
      children,
      ...rest
    },
    ref // Ref được truyền từ parent
  ) => {
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const selectedFeatureRef = useRef(null);
    // const [drawType, setDrawType] = useState(null);
    // const vectorDrawRef = useRef(null);

    useEffect(() => {
      if (!mapRef.current) return;

      let olMap = null;

      // Khởi tạo bản đồ trong animation frame tiếp theo để đảm bảo DOM sẵn sàng
      const initializeMap = async () => {
        olMap = new Map({
          target: mapRef.current,
          layers: [],
          view: new View({
            center: fromLonLat([105.85, 21.03]),
            zoom: rest?.zoom || 6,
          }),
          controls: defaultControls({
            zoomOptions: { className: "zoom-custom" },
          }).extend([
            new ScaleLine(),
            new MousePosition({
              coordinateFormat: createStringXY(5),
              projection: "EPSG:4326",
              className: "custom-mouse-position",
            }),
            new Attribution({ collapsible: false }),
          ]),
        });
        if (style) {
          await apply(olMap, style);
        } else {
          const baseLayer = new TileLayer({
            source: new XYZ({
              url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            }),
          });
          olMap.addLayer(baseLayer);
        }

        olMap.on("singleclick", (evt) => {
          // const feature = olMap.getFeaturesAtPixel(evt.pixel)[0];
          const feature = olMap.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
            if (layer && layer.get && layer.get("name") === "drawLayer")
              return null;
            return {
              ...feat,
              properties: feat.getProperties(),
              "layer-id": layer.get("id")
            };
          });
          if (typeof onClick === "function") {
            onClick({
              coordinate: evt.coordinate,
              pixel: evt.pixel,
              feature: feature,
            });
          }
          
          // if (!feature && typeof onClick === "function") {
          //   onClick({
          //     coordinate: evt.coordinate,
          //     pixel: evt.pixel,
          //     feature: null,
          //     layer: null,
          //   });
          // }
        });

        // Initialize Select interaction
        const select = new Select({
          condition: click,
          style: SELECTED_STYLE,
          layers: (layer) => layer instanceof VectorLayer, // Only apply to VectorLayer
        });

        olMap.addInteraction(select);

        // Handle feature selection
        select.on("select", (e) => {
          // Deselect previous feature
          if (
            selectedFeatureRef.current &&
            !e.selected.includes(selectedFeatureRef.current)
          ) {
            selectedFeatureRef.current.setStyle(undefined);
            selectedFeatureRef.current = null;
          }

          // Select new feature and trigger onClick
          // if (e.selected.length > 0) {
          //   selectedFeatureRef.current = e.selected[0];
          //   selectedFeatureRef.current.setStyle(SELECTED_STYLE);
          //   if (typeof onClick === "function") {
          //     const layer = olMap
          //       .getLayers()
          //       .getArray()
          //       .find(
          //         (l) =>
          //           l instanceof VectorLayer &&
          //           l.getSource().getFeatures().includes(e.selected[0])
          //       );
          //     console.log({
          //       coordinate: e.mapBrowserEvent.coordinate,
          //       pixel: e.mapBrowserEvent.pixel,
          //       feature: e.selected[0],
          //       layer: layer || null,
          //     });
          //     onClick({
          //       coordinate: e.mapBrowserEvent.coordinate,
          //       pixel: e.mapBrowserEvent.pixel,
          //       feature: e.selected[0],
          //       layer: layer || null,
          //     });
          //   }
          // }
        });
        setMapInstance(olMap);
        setIsMapReady(true);

        // Gán instance bản đồ vào ref
        if (ref) {
          if (typeof ref === "function") {
            ref(olMap); // Hỗ trợ callback ref
          } else {
            ref.current = olMap; // Hỗ trợ ref object
          }
        }
      };

      // Khởi tạo bản đồ
      const animationFrameId = requestAnimationFrame(initializeMap);

      // Cleanup khi component unmount
      return () => {
        cancelAnimationFrame(animationFrameId);
        if (olMap) {
          olMap.setTarget(null);
          olMap.dispose();
        }
        setMapInstance(null);
        setIsMapReady(false);
        // Đặt ref về null khi cleanup
        if (ref) {
          if (typeof ref === "function") {
            ref(null);
          } else {
            ref.current = null;
          }
        }
      };
    }, []);

    // Reset drawType khi isDraw thay đổi
    useEffect(() => {
      if (!isDraw) {
        setDrawType(null);
      }
    }, [isDraw]);

    return (
      <MapContext.Provider value={mapInstance}>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: "hidden",
          }}
        >
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          {/* Render children */}
          {isMapReady &&
            children &&
            (Array.isArray(children)
              ? children.map((child, index) =>
                  React.isValidElement(child)
                    ? React.cloneElement(child, { key: index })
                    : null
                )
              : React.isValidElement(children)
              ? React.cloneElement(children, {})
              : null)}
        </div>
      </MapContext.Provider>
    );
  }
);

export default BaseMap;
