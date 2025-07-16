import React, { forwardRef, useImperativeHandle, useRef } from "react";
import "./style.css";

const ContextMenu = forwardRef(({ position, onClose, items = [] }, ref) => {
  const menuRef = useRef();

  useImperativeHandle(ref, () => ({
    close: () => onClose(),
    getElement: () => menuRef.current,
  }));

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: position.y, left: position.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.label === "—" ? (
          <div key={i} style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
        ) : (
          <div
            key={i}
            className="context-item"
            onClick={() => {
              item.onClick?.();
              onClose();
            }}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        )
      )}
    </div>
  );
});

export default ContextMenu;
