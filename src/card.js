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
    const oldSignature = this._spoolSignature;
  
    this._hass = hass;
    this._spoolSignature = this.createSpoolSignature(hass);
  
    if (!oldSignature || oldSignature !== this._spoolSignature) {
      this.render();
    }
  }

  createSpoolSignature(hass) {
    const preset = this.config?.preset || "spoolman";

    if (preset === "custom_attributes") {
      return (this.config.custom_attribute_entities || [])
        .map(entity_id => {
          const state = hass.states[entity_id];
          if (!state) return `${entity_id}|missing`;

          const attr = state.attributes || {};

          return [
            entity_id,
            state.state,
            attr.value,
            attr.remaining_weight,
            attr.max_value,
            attr.max,
            attr.name,
            attr.friendly_name,
            attr.group,
            attr.material,
            attr.vendor,
            attr.color,
            attr.filament_color_hex,
            attr.unit,
          ].join("|");
        })
        .sort()
        .join(";");
    }

    if (preset === "custom_entities") {
      return (this.config.custom_items || [])
        .map((item, index) => {
          const entityIds = [
            item.value_entity,
            item.max_entity,
            item.color_entity,
            item.group_entity,
            item.vendor_entity,
            item.name_entity,
          ].filter(Boolean);

          return [
            index,
            item.name,
            item.group,
            item.vendor,
            item.color,
            item.max,
            item.max_value,
            item.unit,
            ...entityIds.map(entity_id => {
              const state = hass.states[entity_id];
              if (!state) return `${entity_id}|missing`;
              return `${entity_id}|${state.state}|${state.attributes?.friendly_name || ""}`;
            }),
          ].join("|");
        })
        .sort()
        .join(";");
    }

    return Object.entries(hass.states)
      .filter(([, state]) => state.attributes?.filament_material)
      .map(([entity_id, state]) => {
        const attr = state.attributes;

        return [
          entity_id,
          state.state,
          attr.remaining_weight,
          attr.filament_weight,
          attr.archived,
          attr.filament_material,
          attr.filament_name,
          attr.filament_color_hex,
          attr.filament_vendor_name,
        ].join("|");
      })
      .sort()
      .join(";");
  }

  render() {
    if (!this._hass || !this.config) return;

    const items = this.getItems();

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

  getItems() {
    const preset = this.config.preset || "spoolman";

    if (preset === "custom_attributes") {
      return this.getCustomAttributeItems();
    }

    if (preset === "custom_entities") {
      return this.getCustomEntityItems();
    }

    return this.getSpoolmanItems();
  }

  getSpoolmanItems() {
    return Object.entries(this._hass.states)
      .map(([entity_id, state]) => ({ entity_id, state }))
      .filter(({ state }) => state.attributes?.filament_material)
      .filter(({ state }) => !this.config.hide_archived || state.attributes.archived === false)
      .sort((a, b) => compareItems(this.config, a, b));
  }

  getCustomAttributeItems() {
    const entities = this.config.custom_attribute_entities || [];
    const defaultMax = Number(this.config.custom_max_value || 1000);
    const defaultUnit = this.config.custom_unit || "g";

    return entities
      .map(entity_id => {
        const source = this._hass.states[entity_id];
        if (!source) return null;

        const attr = source.attributes || {};
        const value = Number(attr.value ?? attr.remaining_weight ?? source.state);
        if (Number.isNaN(value)) return null;

        return this.createVirtualItem({
          entity_id,
          value,
          max: Number(attr.max_value ?? attr.max ?? defaultMax),
          name: attr.name || attr.friendly_name || entity_id,
          group: attr.group || attr.material || "Custom",
          vendor: attr.vendor || "",
          color: attr.color || attr.filament_color_hex,
          unit: attr.unit || defaultUnit,
        });
      })
      .filter(Boolean)
      .sort((a, b) => compareItems(this.config, a, b));
  }

  getCustomEntityItems() {
    const items = this.config.custom_items || [];
    const defaultMax = Number(this.config.custom_max_value || 1000);
    const defaultUnit = this.config.custom_unit || "g";

    return items
      .map((item, index) => {
        const valueState = this._hass.states[item.value_entity];
        if (!valueState) return null;

        const value = Number(valueState.state);
        if (Number.isNaN(value)) return null;

        const max = item.max_entity
          ? Number(this._hass.states[item.max_entity]?.state ?? defaultMax)
          : Number(item.max ?? item.max_value ?? defaultMax);

        const color = item.color_entity
          ? this._hass.states[item.color_entity]?.state
          : item.color;

        const group = item.group_entity
          ? this._hass.states[item.group_entity]?.state
          : item.group;

        const vendor = item.vendor_entity
          ? this._hass.states[item.vendor_entity]?.state
          : item.vendor;

        const name = item.name_entity
          ? this._hass.states[item.name_entity]?.state
          : item.name;

        return this.createVirtualItem({
          entity_id: item.value_entity || `custom_item_${index}`,
          value,
          max: Number.isNaN(max) ? defaultMax : max,
          name: name || valueState.attributes?.friendly_name || item.value_entity,
          group: group || "Custom",
          vendor: vendor || "",
          color,
          unit: item.unit || defaultUnit,
        });
      })
      .filter(Boolean)
      .sort((a, b) => compareItems(this.config, a, b));
  }

  createVirtualItem({ entity_id, value, max, name, group, vendor, color, unit }) {
    return {
      entity_id,
      state: {
        state: String(value),
        attributes: {
          friendly_name: name,
          remaining_weight: value,
          filament_weight: max,
          filament_material: group,
          filament_name: name,
          filament_vendor_name: vendor,
          filament_color_hex: color,
          archived: false,
          custom_unit: unit,
        },
      },
    };
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
          <div class="value" style="color:${valueTextColor};">${weight.toFixed(1)}${attr.custom_unit || "g"}</div>
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
