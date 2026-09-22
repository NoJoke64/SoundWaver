import * as waveLine from "./waveLine.js";
import * as radialSpectrum from "./radialSpectrum.js";
import * as particleSwarm from "./particleSwarm.js";
import * as organicBlob from "./organicBlob.js";
import * as kaleidoscope from "./kaleidoscope.js";

export const STYLES = [waveLine, radialSpectrum, particleSwarm, organicBlob, kaleidoscope];

export function getStyle(id) {
  return STYLES.find((s) => s.id === id) || STYLES[0];
}
