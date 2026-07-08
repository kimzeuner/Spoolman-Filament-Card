import "./card.js";
import "./editor.js";
import { CARD_TYPE } from "./const.js";

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TYPE,
  name: "Filament Card",
  description: "Shows filament stock grouped by material, color, or vendor.",
});
