import { createContext, useContext } from "react";

// Context chứa OpenLayers map instance
export const MapContext = createContext(null);

// Hook để dùng context
export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within an <OLMap> component.");
  }
  return context;
};
