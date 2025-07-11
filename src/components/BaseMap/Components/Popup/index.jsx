// components/PopupOverlay.jsx
import { useContext, useEffect, useRef, useState } from "react";
import { MapContext } from "../../../hooks/useMap";
import ReactDOM from "react-dom";

const Popup = ({ coordinate, children }) => {
  const map = useContext(MapContext);
  const overlayRef = useRef(null);
  const [containerEl, setContainerEl] = useState(null);

  useEffect(() => {
    if (!map) return;

    const el = document.getElementById("popup-container");
    if (!el) return;

    const overlay = map.getOverlays().item(0); // dùng overlay đã tạo sẵn
    if (!overlay) return;

    overlayRef.current = overlay;
    setContainerEl(el);
  }, [map]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (!coordinate) {
      overlay.setPosition(undefined); // ẩn popup nếu không có tọa độ
      return;
    }

    overlay.setPosition(coordinate); // hiển thị popup
  }, [coordinate]);

  if (!containerEl || !coordinate) return null;

  return ReactDOM.createPortal(children, containerEl);
};

export default Popup;
