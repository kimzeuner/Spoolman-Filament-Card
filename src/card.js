import { CARD_TYPE, EDITOR_TYPE, DEFAULT_CONFIG } from "./const.js";
import { cardStyle } from "./styles.js";
import {
  normalizeColor,
  getFillStyle,
  getGroupValue,
  getValueTextColor,
  compareItems,
  sortGroups,
} from "./helpers.js";

class SpoolmanFilamentCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(EDITOR_TYPE);
  }

  static getStubConfig() {
    return { ...DEFAULT_CONFIG };
  }

  setConfig(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      group_by: config.group_by ?? (config.group_by_material === false ? "none" : "material"),
      group_order: config.group_order ?? config.materials ?? DEFAULT_CONFIG.group_order,
      ...config,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass || !this.config) return;

    const items = Object.entries(this._hass.states)
      .map(([entity_id, state]) => ({ entity_id, state }))
      .filter(({ state }) => state.attributes?.filament_material)
      .filter(({ state }) => !this.config.hide_archived || state.attributes.archived === false)
      .sort((a, b) => compareItems(this.config, a, b));

    const dynamicMaxWeight = Math.max(
      ...items.map(item =>
        Number(item.state.attributes.filament_weight || item.state.attributes.remaining_weight || 0)
      ),
      Number(this.config.max_weight || 0),
      1000
    );

    const content = this.config.group_by === "none"
      ? this.renderFlat(items, dynamicMaxWeight)
      : this.renderGrouped(items, dynamicMaxWeight);

    this.shadowRoot.innerHTML = `
      <style>${cardStyle}</style>

      <ha-card>
        ${this.config.title ? `<div class="title">${this.config.title}</div>` : ""}
        ${content}
      </ha-card>
    `;
  }

  renderGrouped(items, dynamicMaxWeight) {
    let groups = [...new Set(items.map(item => getGroupValue(this.config, item)))];
    groups = sortGroups(this.config, groups, items);

    return groups.map(group => {
      const groupItems = items.filter(item => getGroupValue(this.config, item) === group);
      if (!groupItems.length) return "";

      return `
        ${this.config.show_group_title ? `
          <div class="heading">
            ${
              this.config.group_icon !== "none"
                ? `<ha-icon icon="${this.config.group_icon}"></ha-icon>`
                : ""
            }
            <span>${group}</span>
          </div>
        ` : ""}

        <div class="spools ${this.config.bar_direction}">
          ${groupItems.map(item => this.renderSpool(item, dynamicMaxWeight)).join("")}
        </div>
      `;
    }).join("");
  }

  renderFlat(items, dynamicMaxWeight) {
    if (!items.length) {
      return `<div class="empty">Keine Filamente gefunden.</div>`;
    }

    return `
      <div class="spools ${this.config.bar_direction}">
        ${items.map(item => this.renderSpool(item, dynamicMaxWeight)).join("")}
      </div>
    `;
  }

  renderSpool({ entity_id, state }, dynamicMaxWeight) {
    const attr = state.attributes;
    const weight = Number(attr.remaining_weight ?? state.state ?? 0);
    const spoolMaxWeight = Number(attr.filament_weight || dynamicMaxWeight || 1000);
    const percent = Math.max(0, Math.min(100, weight / spoolMaxWeight * 100));

    const color = this.config.use_filament_color
      ? normalizeColor(attr.filament_color_hex)
      : "var(--primary-color)";

    const valueTextColor = getValueTextColor(this.config, color, percent);

    const name = this.config.group_by === "color"
      ? (attr.filament_material || attr.friendly_name || entity_id)
      : (attr.filament_name || attr.friendly_name || entity_id);

    return `
      <div class="spool ${this.config.bar_direction} name-${this.config.name_position} value-${this.config.value_position}" data-entity="${entity_id}">
        ${
          this.config.show_name && ["top", "left"].includes(this.config.name_position)
            ? `<div class="name">${name}</div>`
            : ""
        }

        <div class="bar">
          <div class="fill" style="${getFillStyle(this.config, percent, color)}"></div>
          <div class="value" style="color:${valueTextColor};">${weight.toFixed(1)}g</div>
        </div>

        ${
          this.config.show_name && ["bottom", "right"].includes(this.config.name_position)
            ? `<div class="name">${name}</div>`
            : ""
        }
      </div>
    `;
  }

  getCardSize() {
    return 4;
  }
}

customElements.define(CARD_TYPE, SpoolmanFilamentCard);
