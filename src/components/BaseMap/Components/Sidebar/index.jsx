import React, { useState } from "react";
import { BsLayoutSidebar } from "react-icons/bs";
import { useMap } from "../../../hooks/useMap";

const Sidebar = ({ content }) => {
  const [open, setOpen] = useState(false);
  // const map = useMap();

  // console.log("useMap", map)

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "1vh",
          left: open ? "calc(30vw - 1px)" : 0,
          zIndex: 1001,
          transition: "left 0.3s",
          background: "#fff",
          borderTop: "1px solid #ccc",
          borderRight: "1px solid #ccc",
          borderBottom: "1px solid #ccc",
          
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
          border: "1px solid #ccc",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          overflowY: "auto",
          transition: "transform 0.3s",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          zIndex: 1000,
          borderBottomRightRadius: 4,
          padding: 4
        }}
      >
        {content ? content : "Nội dung ở đây"}
      </div>
    </>
  );
};

export default Sidebar;
