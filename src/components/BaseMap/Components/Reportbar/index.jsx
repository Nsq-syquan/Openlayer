import React, { useState } from "react";
import { BsReverseLayoutSidebarReverse } from "react-icons/bs";
import { IoIosClose } from "react-icons/io";
import { useMap } from "../../../hooks/useMap";

export const Reportbar = ({ map = useMap(), title, content }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 1000,
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: "6px",
          cursor: "pointer",
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <BsReverseLayoutSidebarReverse size={22} />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "1vh",
            left: "5vw",
            width: "90vw",
            height: "98vh",
            background: "#fff",
            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            zIndex: 9999,
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            padding: 2,
          }}
        >
          <div
            style={{
              padding: 8,
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                paddingLeft: 8,
              }}
            >
                {title ? title : "Thống kê"}
            </span>
            <IoIosClose
              cursor={"pointer"}
              size={26}
              onClick={() => setOpen((prev) => !prev)}
            />
          </div>
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 16,
            }}
          >
            {content ? (
              content
            ) : (
              <div style={{ minHeight: 1200 }}>
                Nội dung Reportbar (cuộn khi vượt quá chiều cao)
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
