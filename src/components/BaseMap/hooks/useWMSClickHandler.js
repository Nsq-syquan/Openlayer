import { useEffect } from "react";


const useWMSClickHandler = (
  mapRef,
  sourceId,
  onFeatureInfo,
  options = {}
) => {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !sourceId || typeof onFeatureInfo !== "function") return;

    const handleClick = (evt) => {
      const coordinate = evt.coordinate;
      const view = map.getView();
      const resolution = view.getResolution();
      const projection = view.getProjection();

      const wmsLayer = map.getLayers().getArray().find((layer) => {
        const source = layer.getSource?.();
        return (
          source?.get("id") === sourceId &&
          layer.getVisible() &&
          layer.getOpacity() > 0
        );
      });

      if (!wmsLayer) return;

      const source = wmsLayer.getSource();
      const url = source.getFeatureInfoUrl(
        coordinate,
        resolution,
        projection,
        {
          INFO_FORMAT: options.infoFormat || "application/json",
          FEATURE_COUNT: options.featureCount || 5,
          QUERY_LAYERS: source.getParams().LAYERS,
        }
      );

      if (url) {
        fetch(url)
          .then((res) =>
            options.infoFormat === "text/html" ? res.text() : res.json()
          )
          .then((data) => {
            onFeatureInfo({ coordinate, data });
          })
          .catch((err) => console.error("GetFeatureInfo error:", err));
      }
    };

    map.on("click", handleClick);
    return () => {
      map.un("click", handleClick);
    };
  }, [mapRef, sourceId, onFeatureInfo, options]);
};

export default useWMSClickHandler;
