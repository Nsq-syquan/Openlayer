import React, { useState } from "react";
import { BsLayoutSidebar } from "react-icons/bs";

const Sidebar = ({ children }) => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "1vh",
          left: open ? "30vw" : 0,
          zIndex: 1001,
          transition: "left 0.3s",
          background: "#fff",
          // border: "1px solid #ccc",
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
          padding: "6px",
          cursor: "pointer",
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <BsLayoutSidebar size={22} />
      </div>
      <div
        style={{
          position: "absolute",
          top: "1vh",
          left: 0,
          height: "98vh",
          width: "30vw",
          background: "#fff",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          overflowY: "auto",
          transition: "transform 0.3s",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          zIndex: 1000,
          borderBottomRightRadius: 4,
        }}
      >
        {children}
      </div>
    </>
  );
};

export default Sidebar;
