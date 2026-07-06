import { DEFAULT_CONFIG } from "./const.js";

class SpoolmanFilamentCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

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
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--divider-color);
          background: var(--card-background-color);
          color: var(--primary-text-color);
        }

        textarea {
          min-height: 90px;
          resize: vertical;
          font-family: inherit;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkbox input {
          width: auto;
        }

        .section {
          font-weight: 600;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--divider-color);
        }

        .section:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
      </style>

      <div class="form">
        <div class="section">General</div>

        <label>
          Title
          <input name="title" value="${this.config.title ?? ""}">
        </label>

        <label class="checkbox">
          <input name="hide_archived" type="checkbox" ${this.config.hide_archived !== false ? "checked" : ""}>
          Hide archived spools
        </label>

        <div class="section">Grouping</div>

        <label>
          Group by
          <select name="group_by">
            <option value="material" ${this.selected("group_by", "material")}>Material</option>
            <option value="color" ${this.selected("group_by", "color")}>Color</option>
            <option value="vendor" ${this.selected("group_by", "vendor")}>Vendor</option>
            <option value="none" ${this.selected("group_by", "none")}>Don't group</option>
          </select>
        </label>

        ${this.config.group_by !== "none" ? `
          <label>
            Group order
            <textarea name="group_order">${this.groupOrderValue()}</textarea>
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

          <label class="checkbox">
            <input name="show_group_title" type="checkbox" ${this.config.show_group_title !== false ? "checked" : ""}>
            Show group title
          </label>
        ` : ""}

        <div class="section">Sorting</div>

        <label>
          Sort by
          <select name="sort_by">
            <option value="remaining_weight" ${this.selected("sort_by", "remaining_weight")}>Remaining weight</option>
            <option value="filament_name" ${this.selected("sort_by", "filament_name")}>Filament name</option>
            <option value="filament_material" ${this.selected("sort_by", "filament_material")}>Material</option>
            <option value="filament_vendor_name" ${this.selected("sort_by", "filament_vendor_name")}>Vendor</option>
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

        <div class="section">Appearance</div>

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
            ${this.namePositionOptions()}
          </select>
        </label>

        <label>
          Value position
          <select name="value_position">
            ${this.valuePositionOptions()}
          </select>
        </label>

        <label>
          Max weight fallback
          <input name="max_weight" type="number" value="${this.config.max_weight ?? 1000}">
        </label>

        <label class="checkbox">
          <input name="show_name" type="checkbox" ${this.config.show_name !== false ? "checked" : ""}>
          Show name
        </label>

        <label class="checkbox">
          <input name="use_filament_color" type="checkbox" ${this.config.use_filament_color !== false ? "checked" : ""}>
          Use filament color
        </label>
      </div>
    `;

    this.querySelectorAll("input, select, textarea").forEach(element => {
      element.addEventListener("change", event => this.valueChanged(event));
    });
  }

  selected(key, value) {
    return (this.config[key] ?? DEFAULT_CONFIG[key]) === value ? "selected" : "";
  }

  namePositionOptions() {
    const options = this.config.bar_direction === "horizontal"
      ? [
          ["top", "Top"],
          ["bottom", "Bottom"],
          ["left", "Left"],
          ["right", "Right"],
        ]
      : [
          ["top", "Top"],
          ["bottom", "Bottom"],
        ];

    return options.map(([value, label]) =>
      `<option value="${value}" ${this.selected("name_position", value)}>${label}</option>`
    ).join("");
  }

  valuePositionOptions() {
    const options = this.config.bar_direction === "horizontal"
      ? [
          ["left", "Left"],
          ["center", "Center"],
          ["right", "Right"],
        ]
      : [
          ["top", "Top"],
          ["center", "Center"],
          ["bottom", "Bottom"],
        ];

    return options.map(([value, label]) =>
      `<option value="${value}" ${this.selected("value_position", value)}>${label}</option>`
    ).join("");
  }

  groupOrderValue() {
    if (!Array.isArray(this.config.group_order)) return "";
    return this.config.group_order.join("\n");
  }

  valueChanged(event) {
    const target = event.target;
    const key = target.name;

    let value;

    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      value = Number(target.value);
    } else if (key === "group_order") {
      value = target.value
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
    } else {
      value = target.value;
    }

    const config = {
      ...this.config,
      [key]: value,
    };

    this.config = config;

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));

    if (["group_by", "bar_direction"].includes(key)) {
      this._rendered = false;
      this.render();
      this._rendered = true;
    }
  }
}

customElements.define("spoolman-filament-card-editor", SpoolmanFilamentCardEditor);
