import { LitElement, html, css } from "lit";
import { DEFAULT_CONFIG, EDITOR_TYPE } from "./const.js";

class SpoolmanFilamentCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = css`
    .editor {
      display: grid;
      gap: 16px;
      padding: 16px;
    }

    .section-title {
      margin-top: 12px;
      font-size: 16px;
      font-weight: 500;
    }

    .section-title:first-child {
      margin-top: 0;
    }

    ha-textfield,
    ha-select {
      width: 100%;
    }

    .switch-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .switch-label {
      font-size: 14px;
    }

    textarea {
      width: 100%;
      min-height: 80px;
      box-sizing: border-box;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
      resize: vertical;
    }

    .hint {
      color: var(--secondary-text-color);
      font-size: 12px;
      margin-bottom: -8px;
    }
  `;

  setConfig(config) {
    this._config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="editor">
        <div class="section-title">General</div>

        ${this.renderTextField("title", "Title")}
        ${this.renderSwitch("hide_archived", "Hide archived spools")}

        <div class="section-title">Grouping</div>

        ${this.renderSelect("group_by", "Group by", [
          ["material", "Material"],
          ["color", "Color"],
          ["vendor", "Vendor"],
          ["none", "Don't group"],
        ])}

        ${this._config.group_by !== "none"
          ? html`
              <div class="hint">Group order, one entry per line. Empty = automatic sorting.</div>
              <textarea
                .value=${this.groupOrderValue()}
                @input=${this.handleGroupOrderChanged}
              ></textarea>

              ${this.renderSelect("group_sort_by", "Group sort by", [
                ["name", "Name"],
                ["total_remaining_weight", "Total remaining weight"],
                ["max_remaining_weight", "Max remaining weight"],
                ["spool_count", "Spool count"],
              ])}

              ${this.renderSelect("group_sort_direction", "Group sort direction", [
                ["asc", "Ascending"],
                ["desc", "Descending"],
              ])}

              ${this.renderTextField("group_icon", "Group icon")}
              ${this.renderSwitch("show_group_title", "Show group title")}
            `
          : html``}

        <div class="section-title">Sorting</div>

        ${this.renderSelect("sort_by", "Sort by", [
          ["remaining_weight", "Remaining weight"],
          ["filament_name", "Filament name"],
          ["filament_material", "Material"],
          ["filament_vendor_name", "Vendor"],
          ["filament_color_hex", "Color"],
        ])}

        ${this.renderSelect("sort_direction", "Sort direction", [
          ["asc", "Ascending"],
          ["desc", "Descending"],
        ])}

        <div class="section-title">Appearance</div>

        ${this.renderSelect("bar_direction", "Bar direction", [
          ["vertical", "Vertical"],
          ["horizontal", "Horizontal"],
        ])}

        ${this.renderSelect("name_position", "Name position", this.namePositionOptions())}
        ${this.renderSelect("value_position", "Value position", this.valuePositionOptions())}

        ${this.renderNumberField("max_weight", "Max weight fallback")}
        ${this.renderSwitch("show_name", "Show name")}
        ${this.renderSwitch("use_filament_color", "Use filament color")}
      </div>
    `;
  }

  renderTextField(key, label) {
    return html`
      <ha-textfield
        label=${label}
        .value=${this._config[key] ?? DEFAULT_CONFIG[key] ?? ""}
        @input=${event => this.updateConfigValue(key, event.target.value)}
      ></ha-textfield>
    `;
  }

  renderNumberField(key, label) {
    return html`
      <ha-textfield
        label=${label}
        type="number"
        .value=${String(this._config[key] ?? DEFAULT_CONFIG[key] ?? 0)}
        @input=${event => this.updateConfigValue(key, Number(event.target.value))}
      ></ha-textfield>
    `;
  }

  renderSelect(key, label, options) {
    const value = this._config[key] ?? DEFAULT_CONFIG[key];
    const selectedIndex = options.findIndex(([optionValue]) => optionValue === value);
  
    return html`
      <ha-select
        label=${label}
        .value=${value}
        .selected=${selectedIndex >= 0 ? selectedIndex : 0}
        @selected=${event => {
          const item = event.detail?.item;
          const selectedValue = item?.value ?? item?.getAttribute?.("value");
          if (selectedValue !== undefined && selectedValue !== null) {
            this.handleSelectChanged(key, selectedValue);
          }
        }}
        @closed=${event => event.stopPropagation()}
      >
        ${options.map(
          ([optionValue, optionLabel]) => html`
              ${optionLabel}
            </mwc-list-item>
          `
        )}
      </ha-select>
    `;
  }

  renderSwitch(key, label) {
    return html`
      <div class="switch-row">
        <ha-switch
          .checked=${this._config[key] !== false}
          @change=${event => this.updateConfigValue(key, event.target.checked)}
        ></ha-switch>
        <span class="switch-label">${label}</span>
      </div>
    `;
  }

  handleSelectChanged(key, value) {
    if (value === undefined || value === null || value === this._config[key]) return;
  
    const config = {
      ...this._config,
      [key]: value,
    };
  
    if (key === "bar_direction") {
      this.normalizePositions(config);
    }
  
    this.setAndDispatchConfig(config);
  }

  updateConfigValue(key, value) {
    const config = {
      ...this._config,
      [key]: value,
    };

    this.setAndDispatchConfig(config);
  }

  handleGroupOrderChanged(event) {
    const group_order = event.target.value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    this.setAndDispatchConfig({
      ...this._config,
      group_order,
    });
  }

  groupOrderValue() {
    return Array.isArray(this._config.group_order)
      ? this._config.group_order.join("\n")
      : "";
  }

  namePositionOptions() {
    return this._config.bar_direction === "horizontal"
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
  }

  valuePositionOptions() {
    return this._config.bar_direction === "horizontal"
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
  }

  normalizePositions(config) {
    if (config.bar_direction === "vertical") {
      if (!["top", "bottom"].includes(config.name_position)) {
        config.name_position = "bottom";
      }

      if (!["top", "center", "bottom"].includes(config.value_position)) {
        config.value_position = "center";
      }
    }

    if (config.bar_direction === "horizontal") {
      if (!["top", "bottom", "left", "right"].includes(config.name_position)) {
        config.name_position = "bottom";
      }

      if (!["left", "center", "right"].includes(config.value_position)) {
        config.value_position = "center";
      }
    }
  }

  setAndDispatchConfig(config) {
    this._config = config;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }
}

if (!customElements.get(EDITOR_TYPE)) {
  customElements.define(EDITOR_TYPE, SpoolmanFilamentCardEditor);
}
