import React from "react";
import { VectorLayerWrapper, WMSLayerWrapper } from "./components/Layers";


export const MapLayer = ({ sourceType = "vector", ...props }) => {
  if (sourceType === "vector") return <VectorLayerWrapper {...props} />;
  if (sourceType === "wms") return <WMSLayerWrapper {...props} />;

  console.warn("⚠️ Loại source không hợp lệ:", sourceType);
  return null;
};


