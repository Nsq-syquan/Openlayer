import apply from "ol-mapbox-style";
import Map from "ol/Map";
import Overlay from "ol/Overlay";
import View from "ol/View";
import {
  Attribution,
  defaults as defaultControls,
  MousePosition,
  ScaleLine,
} from "ol/control";
import { createStringXY } from "ol/coordinate";
import TileLayer from "ol/layer/Tile";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import XYZ from "ol/source/XYZ";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { MapContext } from "./hooks/useMap";
import "./index.css";
import ContextMenu from "./Components/ContextMenu";

const BaseMap = forwardRef(
  (
    { style, onClick, renderContextMenu, isDraw = false, children, ...rest },
    ref
  ) => {
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const overlayRef = useRef(null);

    const [contextMenuState, setContextMenuState] = useState({
      position: null,
      items: [],
    });

    useEffect(() => {
      if (!mapRef.current || !overlayRef?.current) return;
      let olMap = null;

      const overlay = new Overlay({
        element: overlayRef.current,
        positioning: "bottom-center",
        stopEvent: false,
        offset: [0, -10],
      });

      const initializeMap = async () => {
        olMap = new Map({
          target: mapRef.current,
          layers: [],
          view: new View({
            center: fromLonLat([105.85, 21.03]),
            zoom: rest?.zoom || 6,
          }),
          overlays: [overlay],
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

        olMap.on("click", (event) => {
          setContextMenuState(null);
          if (onClick) onClick(event);
        });

        // Bắt sự kiện chuột phải
        olMap.getViewport().addEventListener("contextmenu", (event) => {
          event.preventDefault();
          const pixel = olMap.getEventPixel(event);
          const coordinate = olMap.getCoordinateFromPixel(pixel);

          // gọi hàm dựng menu từ props
          if (typeof rest.onContextMenu === "function") {
            const items = rest.onContextMenu(coordinate, olMap);
            setContextMenuState({
              position: { x: event.clientX, y: event.clientY },
              items,
            });
          }
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

          <div ref={overlayRef}>
            <div
              id="popup-container"
              style={{
                background: "white",
                padding: "8px",
                borderRadius: "6px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
              }}
            />
          </div>

          {contextMenuState && (
            <ContextMenu
              position={contextMenuState?.position}
              items={contextMenuState?.items}
              onClose={() => setContextMenuState({ position: null, items: [] })}
            />
          )}
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
