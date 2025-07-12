import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";

export const VectorSourceWrapper = ({ data, idSource }) => {
  if (!data) {
    console.warn("⚠️ Không có dữ liệu cho Vector Source.");
    return null;
  }

  const geojsonObject = typeof data === "string" ? JSON.parse(data) : data;
  const features = new GeoJSON().readFeatures(geojsonObject, {
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857",
  });

  if (!features.length) {
    console.warn("⚠️ Không có feature nào trong dữ liệu.");
    return null;
  }

  const vectorSource = new VectorSource({ features });
  if (idSource) vectorSource.set("id", idSource);

  return vectorSource;
};
