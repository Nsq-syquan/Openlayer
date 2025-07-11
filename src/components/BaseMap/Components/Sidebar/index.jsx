import React, { useState, useRef, useEffect } from "react";
import { BsLayoutSidebar } from "react-icons/bs";
import ReactDOM from "react-dom";

export const Sidebar = ({ style, children, zIndex = 9 }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "1vh",
          left: open ? "calc(30vw - 1px)" : 0,
          zIndex: zIndex,
          transition: "left 0.3s",
          background: "#fff",
          borderTop: "1px solid #ccc",
          borderRight: "1px solid #ccc",
          borderBottom: "1px solid #ccc",
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
          padding: "6px",
          cursor: "pointer",
          ...style,
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <BsLayoutSidebar size={22} />
      </div>

      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: "1vh",
          left: 0,
          height: "98vh",
          width: "30vw",
          background: "#fff",
          border: "1px solid #ccc",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          overflowY: "auto",
          transition: "transform 0.3s",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          zIndex: zIndex,
          borderBottomRightRadius: 4,
          padding: 4,
        }}
      >
        {containerRef.current && ReactDOM.createPortal(children, containerRef.current)}
      </div>
    </>
  );
};

