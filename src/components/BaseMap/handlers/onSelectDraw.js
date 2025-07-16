import { DRAW_STYLE, SELECTED_STYLE } from "../Components/DrawTools/style";


export const onSelectDraw = (
  map,
  event,
  {
    vectorSource,
    selectedDrawIdRef,
    onFeatureSelect,
    styleSelected = SELECTED_STYLE,
    styleDefault = DRAW_STYLE,
  }
) => {
  if (!map || !vectorSource) return;

  const pixel = event.pixel;

  const clickedFeature = map.forEachFeatureAtPixel(pixel, (feature, layer) => {
    if (layer?.get("name") === "drawLayer") {
      return feature;
    }
    return null;
  });
  console.log(clickedFeature)

  // Bỏ chọn feature cũ nếu có
  if (selectedDrawIdRef.current) {
    const prevFeature = vectorSource.getFeatureById(selectedDrawIdRef.current);
    if (prevFeature) {
      prevFeature.setStyle(styleDefault);
    }
  }

  // Chọn feature mới
  if (clickedFeature) {
    const id = clickedFeature.getId();
    selectedDrawIdRef.current = id;
    clickedFeature.setStyle(styleSelected);

    if (onFeatureSelect) {
      onFeatureSelect(id);
    }
  } else {
    selectedDrawIdRef.current = null;
    if (onFeatureSelect) {
      onFeatureSelect(null);
    }
  }

  vectorSource.changed(); // bắt buộc để cập nhật lại style
};
