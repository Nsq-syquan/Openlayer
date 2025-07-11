import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";

export const DRAW_STYLE = new Style({
  fill: new Fill({ color: "rgba(255,255,255,0.2)" }),
  stroke: new Stroke({ color: "#33cc33", width: 2 }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "#ffcc33" }),
  }),
});
export const SELECTED_STYLE = new Style({
  fill: new Fill({ color: "rgba(255,0,0,0.4)" }),
  stroke: new Stroke({ color: "#ff0000", width: 3 }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "#ff0000" }),
  }),
});