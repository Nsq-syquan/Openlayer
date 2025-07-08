import { Tooltip } from "antd";
import { useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { MdClear, MdOutlineDraw } from "react-icons/md";
import "./index.scss";

const GroupButton = ({
  icon,
  title,
  body,
  children,
  animate,
  position,
  direction,
  type,
}) => {
  const [toggle, setToggle] = useState(false);
  const handleToggle = () => {
    setToggle(!toggle);
  };

  const Greeting = ({ icon }) => {
    return (
      <Tooltip title={toggle ? "Close" : title} placement="left">
        <button
          className="custom-tool-icon"
          style={{
            borderRadius: type == "circle" ? "50%" : "4px",
          }}
          onClick={handleToggle}
        >
          <span className={animate ? `custom-icon` : ""}>
            {toggle ? (
              <MdClear size={20} />
            ) : icon ? (
              icon
            ) : (
              <MdOutlineDraw size={20} />
            )}
          </span>
        </button>
      </Tooltip>
    );
  };
  return (
    <div
      className="group-button-container"
      style={{
        left: position?.left ? `${position?.left}px` : "",
        top: position?.top ? `${position?.top}px` : "",
        right: position?.right ? `${position?.right}px` : "",
        bottom: position?.bottom ? `${position?.bottom}px` : "",
        flexDirection: direction,
      }}
    >
      {toggle && (
        <div
          className={
            direction == "column"
              ? "custom-tool-body-fade-up"
              : "custom-tool-body-fade-in-right"
          }
        >
          {children && (
            <div
              className="container-content"
              style={{
                display: "flex",
                flexDirection: direction,
                gap: 4,
              }}
            >
              {children?.map((child, index) => {
                return (
                  <Tooltip title={child?.title} key={index} placement="left">
                    <button
                      disabled={child?.disabled ?? false}
                      className={`custom-icon-wrapper ${
                        child?.active ? "active" : ""
                      } `}
                      style={{
                        borderRadius: type == "circle" ? "50%" : "4px",
                      }}
                      onClick={child?.onClick}
                    >
                      <span className="custom-icon">{child?.icon}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          )}
          {body}
        </div>
      )}

      <Greeting icon={icon ? icon : <AiOutlinePlus size={20} />} />
    </div>
  );
};

export default GroupButton;
