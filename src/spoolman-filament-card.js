import "./card.js";
import "./editor.js";
import { CARD_TYPE } from "./const.js";

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TYPE,
  name: "Spoolman Filament Card",
  description: "Shows Spoolman filament stock grouped by material, color, or vendor.",
});
