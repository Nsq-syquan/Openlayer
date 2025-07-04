import Map from "ol/Map";
import Overlay from "ol/Overlay";
import View from "ol/View";
import { click } from "ol/events/condition";
import GeoJSON from "ol/format/GeoJSON";
import Select from "ol/interaction/Select";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { Fill, Stroke, Style } from "ol/style";
import { useEffect, useRef, useState } from "react";
import DrawTools from "./Components/DrawTools";
import MPopup from "./Components/Popup";
import { LuLayers2 } from "react-icons/lu";
import { Reportbar } from "../Reportbar";
import Sidebar from "../Sidebar";
import SourceVector from "./Components/Vector/Source";

import { defaults as defaultControls, ScaleLine, FullScreen, ZoomSlider, MousePosition, Attribution } from "ol/control";
import { createStringXY } from "ol/coordinate";
import "./index.css"


export default function OLMap({ onFeatureClick,  geojsonData, report = {active: false, title: "Thống kê", content: null}, sidebar = {active: false, content: null}, isDraw = false, ...rest }) {
  const mapRef = useRef();
  const popupRef = useRef();
  const [popupData, setPopupData] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const selectedFeatureRef = useRef(null);
  const [drawType, setDrawType] = useState(null);
  const vectorDrawRef = useRef();

  useEffect(() => {
    if (!popupRef.current) return;

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: true,
      positioning: "bottom-center",
      stopEvent: false,
      offset: [0, -10],
    });

    const olMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          }),
        })
      ],
      view: new View({
        center: fromLonLat([105.85, 21.03]),
        zoom: rest?.zoom ? rest?.zoom : 6,
      }),
      overlays: [overlay],
      controls: defaultControls({
        zoomOptions: {
          className: "zoom-custom"
        }
      }).extend([
        new ScaleLine(

        ),
        
        new MousePosition({
          coordinateFormat: createStringXY(5),
          projection: "EPSG:4326",
          className: "custom-mouse-position",
        }),
        new Attribution({
          collapsible: false,
        }),
      ]),
    });

    olMap.on("singleclick", (evt) => {
      // Nếu đang active vẽ thì không hiển thị popup
      const isDrawing = drawType !== null;
        if (isDrawing) return; // ✅ Không hiển thị popup khi đang vẽ


      // Chỉ lấy feature KHÔNG thuộc layer name drawLayer
      const feature = olMap.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
        if (layer && layer.get && layer.get("name") === "drawLayer")
          return null;
        return feat;
      });
      if (feature) {
        const coordinates = evt.coordinate;
        overlay.setPosition(coordinates);
        const props = feature.getProperties();
        setPopupData(props);
        if (onFeatureClick) onFeatureClick(feature);
      } else {
        overlay.setPosition(undefined);
        setPopupData(null);
      }
    });

    const select = new Select({ condition: click });
    olMap.addInteraction(select);
    select.on("select", (e) => {
      e.selected.forEach((f) => {
        f.setStyle(
          new Style({
            stroke: new Stroke({ color: "red", width: 3 }),
            fill: new Fill({ color: "rgba(255,0,0,0.2)" }),
          })
        );
        selectedFeatureRef.current = f;
      });
      e.deselected.forEach((f) => {
        if (!f.get("isDragging")) {
          f.setStyle(undefined);
        }
      });
    });

    setMapInstance(olMap);

    return () => olMap.setTarget(null);
  }, [geojsonData]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {
        isDraw && <DrawTools
        map={mapInstance}
        ref={vectorDrawRef}
        activeDrawType={drawType}
        setActiveDrawType={setDrawType}
        optionalTools={
          [
            {
              title: "Layers",
              icon: <LuLayers2 size={20} />,
              onClick: () => {
                alert("Chức năng chưa có")
              },
             
            }
          ]
        }
      
      />
      }
      {
        sidebar?.active && <Sidebar content={sidebar?.content}/>
      }
      {
        report?.active && <Reportbar title={report?.title} content={report?.content} />
      }

      <div ref={mapRef} style={{ width: "100%", height: "100%" }}></div>
      {mapInstance && (
                <SourceVector
                    map={mapInstance}
                    data={geojsonData}
                    idSource="my-vector-source"
                    idLayer="my-vector-layer"
                />
            )}
      <MPopup ref={popupRef} data={popupData} />
    </div>
  );
}
