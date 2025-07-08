import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import Overlay from "ol/Overlay";
import { useMap } from "../../../hooks/useMap";

const Popup = forwardRef((props, ref) => {
  const map = useMap();
  const containerRef = useRef(null);
  const overlayRef = useRef(null);

  const [data, setData] = useState(null);
  const [position, setPosition] = useState(null);

  // Tạo overlay khi map sẵn sàng
  useEffect(() => {
    if (!map || !containerRef.current) return;

    const overlay = new Overlay({
      element: containerRef.current,
      positioning: "bottom-center",
      stopEvent: false,
      offset: [0, -10],
      
    });

    overlayRef.current = overlay;
    map.addOverlay(overlay);

    return () => {
      map.removeOverlay(overlay);
    };
  }, [map]);

  // Show/hide từ ref
  useImperativeHandle(ref, () => ({
    show: (coordinate, data) => {
      setPosition(coordinate);
      setData(data);
      overlayRef.current?.setPosition(coordinate);
    },
    hide: () => {
      setData(null);
      setPosition(null);
      overlayRef.current?.setPosition(undefined);
    },
  }));

  if (!data) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white rounded shadow p-2"
      style={{ pointerEvents: "none" }}
    >
      {/* Render nội dung bằng React */}
      <div>
        <div className="font-bold">{data?.properties?.tentinh}</div>
        <div className="text-sm text-gray-600">ID: {data?.id}</div>
      </div>
    </div>
  );
});

export default Popup;
