class SpoolmanFilamentCard extends HTMLElement {
    static getConfigElement() {
    return document.createElement("spoolman-filament-card-editor");
    }

    static getStubConfig() {
    return {
        title: "Filament",
        group_by: "material",
        group_sort_by: "name",
        group_sort_direction: "asc",
        sort_by: "remaining_weight",
        sort_direction: "asc",
        bar_direction: "vertical",
        name_position: "bottom",
        hide_archived: true
    };
    }

  setConfig(config) {
    this.config = {
      title: "Filament",
      name_position: "bottom",
      group_by: config.group_by ?? (config.group_by_material === false ? "none" : "material"),
      group_sort_by: "name",
      group_sort_direction: "asc",
      group_order: config.group_order ?? config.materials ?? [],
      group_icon: "mdi:printer-3d-nozzle",
      max_weight: 1000,
      hide_archived: true,
      sort_by: "remaining_weight",
      sort_direction: "asc",
      bar_direction: "vertical",
      show_name: true,
      show_group_title: true,
      value_position: "center",
      use_filament_color: true,
      ...config,
    };

    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
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
      .sort((a, b) => this.compareItems(a, b));

    const dynamicMaxWeight = Math.max(
        ...items.map(item => Number(item.state.attributes.filament_weight || item.state.attributes.remaining_weight || 0)),
        Number(this.config.max_weight || 0),
        1000
    );

    const content = this.config.group_by === "none"
    ? this.renderFlat(items, dynamicMaxWeight)
    : this.renderGrouped(items, dynamicMaxWeight);

    this.shadowRoot.innerHTML = `
      <style>
        ha-card { 
            padding: 16px; 
        }
        .title { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 16px; 
        }
        .heading {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 600;
            margin: 18px 0 10px;
        }

        .heading ha-icon {
            --mdc-icon-size: 20px;
            color: var(--secondary-text-color);
        }
        .heading:first-child { 
            margin-top: 0; 
        }
        .spools { 
            display: flex; 
            gap: 0; overflow-x: auto; 
            align-items: flex-end; 
            padding-bottom: 4px; 
        }
        .spool { 
            width: 70px; 
            min-width: 70px; 
            text-align: center; 
            cursor: pointer; 
            padding: 8px 4px; 
            box-sizing: border-box; 
        }
        .spool.vertical {
            width: 70px;
            min-width: 70px;
        }
        .spool.vertical .fill {
            width: 100%;
            height: 0;
            border-radius: 10px 10px 0 0;
        }
        .spool.vertical.name-top {
            display: flex;
            flex-direction: column;
        }

        .spool.vertical.name-top .name {
            order: -1;
            margin-top: 0;
            margin-bottom: 6px;
        }
        .spool.horizontal {
            width: 100%;
            min-width: 160px;
            display: grid;
            grid-template-columns: 1fr;
        }
        .spool.horizontal .bar {
            height: 28px;
        }
        .spool.horizontal .fill {
            top: 0;
            bottom: 0;
            height: 100%;
            width: 0;
            border-radius: 10px 0 0 10px;
        }
        .spool.horizontal .value {
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
        }

        .spool.horizontal .name {
            text-align: left;
            margin-top: 4px;
        }

        .spools.horizontal {
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
        }
        .spool.horizontal.name-left,
        .spool.horizontal.name-right {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            gap: 8px;
        }

        .spool.horizontal.name-right {
            grid-template-columns: 1fr auto;
        }

        .spool.horizontal.name-left .name,
        .spool.horizontal.name-right .name {
            margin-top: 0;
            white-space: nowrap;
        }
        .spool.vertical.value-top .value {
            top: 12px;
            bottom: auto;
        }

        .spool.vertical.value-center .value {
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
        }

        .spool.vertical.value-bottom .value {
            bottom: 20px;
        }

        .spool.horizontal.value-left .value {
            left: 10px;
            right: auto;
            text-align: left;
        }

        .spool.horizontal.value-center .value {
            left: 0;
            right: 0;
            text-align: center;
        }

        .spool.horizontal.value-right .value {
            left: auto;
            right: 10px;
            text-align: right;
        }
        .bar {
            height: 200px;
            border-radius: 10px;
            background: var(--divider-color);
            position: relative;
            overflow: hidden;
        }
        .fill {
            position: absolute;
            left: 0;
            bottom: 0;
            background: var(--primary-color);
        }
        .value {
            position: absolute;
            z-index: 2;
            left: 0;
            right: 0;
            bottom: 20px;
            font-size: 15px;
            font-weight: 700;
            text-align: center;
            text-shadow: 0 1px 2px rgba(0,0,0,.25);
        }
        .name { 
            font-size: 12px; 
            margin-top: 6px; 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
        }
        .empty { 
            color: var(--secondary-text-color); 
            padding: 8px 0; 
        }
      </style>

      <ha-card>
        ${this.config.title ? `<div class="title">${this.config.title}</div>` : ""}
        ${content}
      </ha-card>
    `;
  }

    renderGrouped(items, dynamicMaxWeight) {
    let groups = [...new Set(items.map(item => this.getGroupValue(item)))];

    if (this.config.group_order?.length) {
        const order = this.config.group_order.map(value => String(value));

        groups.sort((a, b) => {
        const ai = order.indexOf(String(a));
        const bi = order.indexOf(String(b));

        const aKnown = ai !== -1;
        const bKnown = bi !== -1;

        if (aKnown && bKnown) return ai - bi;
        if (aKnown) return -1;
        if (bKnown) return 1;

        return String(a).localeCompare(String(b), undefined, { numeric: true });
        });
    } else {
        groups.sort((a, b) => this.compareGroups(a, b, items));
    }

    return groups.map(group => {
        const groupItems = items.filter(item => this.getGroupValue(item) === group);
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
    if (!items.length) return `<div class="empty">Keine Filamente gefunden.</div>`;

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
            ? this.normalizeColor(attr.filament_color_hex)
            : "var(--primary-color)";
        const valueTextColor = this.config.use_filament_color
            ? this.getValueTextColor(color, percent)
            : "var(--text-primary-color, var(--primary-text-color))";
        const name = this.config.group_by === "color"
            ? (attr.filament_material || attr.friendly_name || entity_id)
            : (attr.filament_name || attr.friendly_name || entity_id);

        return `
            <div class="spool ${this.config.bar_direction} name-${this.config.name_position} value-${this.config.value_position}" data-entity="${entity_id}">
                ${this.config.show_name && (this.config.name_position === "top" || this.config.name_position === "left") ? `<div class="name">${name}</div>` : ""}
                <div class="bar">
                    <div class="fill" style="${this.getFillStyle(percent, color)}"></div>
                    <div class="value" style="color:${valueTextColor};">${weight.toFixed(1)}g</div>
                </div>
                ${this.config.show_name && (this.config.name_position === "bottom" || this.config.name_position === "right") ? `<div class="name">${name}</div>` : ""}
            </div>
        `;
    }

    getValueTextColor(color, percent) {
    const position = this.config.value_position || "center";

    if (this.config.bar_direction === "horizontal") {
        if (position === "left" && percent >= 15) {
        return this.getTextColor(color);
        }

        if (position === "center" && percent >= 50) {
        return this.getTextColor(color);
        }

        if (position === "right" && percent >= 85) {
        return this.getTextColor(color);
        }

        return "var(--primary-text-color)";
    }

    if (this.config.bar_direction === "vertical") {
        if (position === "bottom" && percent >= 15) {
        return this.getTextColor(color);
        }

        if (position === "center" && percent >= 50) {
        return this.getTextColor(color);
        }

        if (position === "top" && percent >= 85) {
        return this.getTextColor(color);
        }

        return "var(--primary-text-color)";
    }

    return "var(--primary-text-color)";
    }

  compareItems(a, b) {
    const attr = this.config.sort_by;
    const direction = this.config.sort_direction === "desc" ? -1 : 1;

    const av = a.state.attributes[attr] ?? a.state.state ?? "";
    const bv = b.state.attributes[attr] ?? b.state.state ?? "";

    const an = Number(av);
    const bn = Number(bv);

    if (!Number.isNaN(an) && !Number.isNaN(bn)) {
      return (an - bn) * direction;
    }

    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * direction;
  }

  compareGroups(a, b, items) {
    const direction = this.config.group_sort_direction === "desc" ? -1 : 1;

    const aItems = items.filter(item => this.getGroupValue(item) === a);
    const bItems = items.filter(item => this.getGroupValue(item) === b);

    switch (this.config.group_sort_by) {
      case "total_remaining_weight": {
        const av = aItems.reduce((sum, item) => sum + Number(item.state.attributes.remaining_weight || 0), 0);
        const bv = bItems.reduce((sum, item) => sum + Number(item.state.attributes.remaining_weight || 0), 0);
        return (av - bv) * direction;
      }

      case "max_remaining_weight": {
        const av = Math.max(...aItems.map(item => Number(item.state.attributes.remaining_weight || 0)));
        const bv = Math.max(...bItems.map(item => Number(item.state.attributes.remaining_weight || 0)));
        return (av - bv) * direction;
      }

      case "spool_count":
        return (aItems.length - bItems.length) * direction;

      case "name":
      default:
        return String(a).localeCompare(String(b), undefined, { numeric: true }) * direction;
    }
  }

    getGroupValue(item) {
        const attr = item.state.attributes;

        if (this.config.group_by === "color") {
            return attr.filament_name || attr.filament_color_hex || "unknown";
        }

        if (this.config.group_by === "material") {
            return attr.filament_material || "unknown";
        }
        if (this.config.group_by === "vendor") {
            return attr.filament_vendor_name || "unknown";
        }
        return "all";
    }

  normalizeColor(value) {
    if (!value) return "#999999";
    return value.startsWith("#") ? value : `#${value}`;
  }

  getTextColor(hex) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140 ? "black" : "white";
  }

  getCardSize() {
    return 4;
  }

  getFillStyle(percent, color) {
    if (this.config.bar_direction === "horizontal") {
        return `width:${percent}%; background:${color};`;
    }

    return `height:${percent}%; background:${color};`;
  }

}

class SpoolmanFilamentCardEditor extends HTMLElement {
    setConfig(config) {
    this.config = { ...config };

    if (!this._rendered) {
        this.render();
        this._rendered = true;
    }
    }

    set hass(hass) {
    this._hass = hass;
    }

  render() {
    if (!this.config) return;

    this.innerHTML = `
      <style>
        .form {
          display: grid;
          gap: 12px;
        }

        label {
          display: grid;
          gap: 4px;
          font-size: 14px;
        }

        input,
        select {
          width: 100%;
          box-sizing: border-box;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--divider-color);
          background: var(--card-background-color);
          color: var(--primary-text-color);
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkbox input {
          width: auto;
        }
      </style>

      <div class="form">
        <label>
          Title
          <input name="title" value="${this.config.title ?? ""}">
        </label>

        <label>
          Group by
          <select name="group_by">
            <option value="material" ${this.selected("group_by", "material")}>Material</option>
            <option value="color" ${this.selected("group_by", "color")}>Color</option>
            <option value="vendor" ${this.selected("group_by", "vendor")}>Vendor</option>
            <option value="none" ${this.selected("group_by", "none")}>Don't group</option>
          </select>
        </label>

        <label>
          Group sort by
          <select name="group_sort_by">
            <option value="name" ${this.selected("group_sort_by", "name")}>Name</option>
            <option value="total_remaining_weight" ${this.selected("group_sort_by", "total_remaining_weight")}>Total remaining weight</option>
            <option value="max_remaining_weight" ${this.selected("group_sort_by", "max_remaining_weight")}>Max remaining weight</option>
            <option value="spool_count" ${this.selected("group_sort_by", "spool_count")}>Spool count</option>
          </select>
        </label>

        <label>
          Group sort direction
          <select name="group_sort_direction">
            <option value="asc" ${this.selected("group_sort_direction", "asc")}>Ascending</option>
            <option value="desc" ${this.selected("group_sort_direction", "desc")}>Descending</option>
          </select>
        </label>

        <label>
          Group icon
          <input name="group_icon" value="${this.config.group_icon ?? "mdi:printer-3d-nozzle"}">
        </label>

        <label>
          Sort by
          <select name="sort_by">
            <option value="remaining_weight" ${this.selected("sort_by", "remaining_weight")}>Remaining weight</option>
            <option value="filament_name" ${this.selected("sort_by", "filament_name")}>Filament name</option>
            <option value="filament_material" ${this.selected("sort_by", "filament_material")}>Material</option>
            <option value="filament_color_hex" ${this.selected("sort_by", "filament_color_hex")}>Color</option>
          </select>
        </label>

        <label>
          Sort direction
          <select name="sort_direction">
            <option value="asc" ${this.selected("sort_direction", "asc")}>Ascending</option>
            <option value="desc" ${this.selected("sort_direction", "desc")}>Descending</option>
          </select>
        </label>

        <label>
          Bar direction
          <select name="bar_direction">
            <option value="vertical" ${this.selected("bar_direction", "vertical")}>Vertical</option>
            <option value="horizontal" ${this.selected("bar_direction", "horizontal")}>Horizontal</option>
          </select>
        </label>

        <label>
          Name position
          <select name="name_position">
            <option value="bottom" ${this.selected("name_position", "bottom")}>Bottom</option>
            <option value="top" ${this.selected("name_position", "top")}>Top</option>
            <option value="left" ${this.selected("name_position", "left")}>Left</option>
            <option value="right" ${this.selected("name_position", "right")}>Right</option>
          </select>
        </label>

        <label>
        Value position
            <select name="value_position">
                <option value="bottom">Bottom</option>
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
            </select>
            </label>

            <label class="checkbox">
            <input name="show_name" type="checkbox" checked>
            Show name
            </label>

            <label class="checkbox">
            <input name="show_group_title" type="checkbox" checked>
            Show group title
            </label>

            <label class="checkbox">
            <input name="use_filament_color" type="checkbox" checked>
            Use filament color
        </label>

        <label>
          Max weight fallback
          <input name="max_weight" type="number" value="${this.config.max_weight ?? 1000}">
        </label>

        <label class="checkbox">
          <input name="hide_archived" type="checkbox" ${this.config.hide_archived !== false ? "checked" : ""}>
          Hide archived spools
        </label>
      </div>
    `;

    this.querySelectorAll("input, select").forEach(element => {
      element.addEventListener("change", event => this.valueChanged(event));
    });
  }

  selected(key, value) {
    return (this.config[key] ?? this.defaultValue(key)) === value ? "selected" : "";
  }

  defaultValue(key) {
    const defaults = {
      group_by: "material",
      group_sort_by: "name",
      group_sort_direction: "asc",
      sort_by: "remaining_weight",
      sort_direction: "asc",
      bar_direction: "vertical",
      name_position: "bottom",
      value_position: "center",
        show_name: true,
        show_group_title: true,
        use_filament_color: true,
    };

    return defaults[key];
  }

  valueChanged(event) {
    const target = event.target;
    const key = target.name;

    let value;

    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      value = Number(target.value);
    } else {
      value = target.value;
    }

    const config = {
      ...this.config,
      [key]: value,
    };

    const messageEvent = new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(messageEvent);
  }
}

customElements.define("spoolman-filament-card-editor", SpoolmanFilamentCardEditor);

customElements.define("spoolman-filament-card", SpoolmanFilamentCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "spoolman-filament-card",
  name: "Spoolman Filament Card",
  description: "Shows Spoolman filament stock grouped by material.",
});
