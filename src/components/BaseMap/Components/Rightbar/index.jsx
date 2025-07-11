import React, { useState, useRef, useEffect } from "react";
import { BsReverseLayoutSidebarReverse } from "react-icons/bs";
import { IoIosClose } from "react-icons/io";
import ReactDOM from "react-dom";

export const Rightbar = ({ title, children, style , zIndex = 10 }) => {
  const [open, setOpen] = useState(false);
  const [containerEl, setContainerEl] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setContainerEl(containerRef.current);
  }, []);

  return (
    <>
      {
        open ? null : <div
        style={{
          position: "absolute",
          top: "1vh",
          right: open ? "calc(100vw - 1px)" : 0,
          zIndex: zIndex,
          transition: "right 0.3s",
          background: "#fff",
          borderTop: "1px solid #ccc",
          borderLeft: "1px solid #ccc",
          borderBottom: "1px solid #ccc",
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
          padding: "6px",
          cursor: "pointer",
          ...style,
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <BsReverseLayoutSidebarReverse size={22} />
      </div>
      }

      {/* Panel nội dung report */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: "1vh",
          right: open ? "1vw" : 0,
          height: "98vh",
          width: "98vw",
          background: "#fff",
          border: "1px solid #ccc",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          overflowY: "auto",
          transition: "transform 0.3s",
          transform: open ? "translateX(0)" : "translateX(100%)",
          zIndex: zIndex,
          borderBottomLeftRadius: 4,
          padding: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <IoIosClose
        style={{
          position: "absolute",
          top: 12,
          right: 12
        }}
            cursor="pointer"
            size={26}
            onClick={() => setOpen(false)}
          />
        
        {/* Nội dung render portal */}
        <div>
          {containerEl && ReactDOM.createPortal(children, containerEl)}
        </div>
      </div>
    </>
  );
};
