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

        ${this.renderSelect(
          this._config.group_by || "material",
          [
            ["material", "Material"],
            ["color", "Color"],
            ["vendor", "Vendor"],
            ["none", "Don't group"],
          ],
          value => this.updateConfigValue("group_by", value)
        )}

        ${this._config.group_by !== "none"
          ? html`
              <div class="hint">Group order, one entry per line. Empty = automatic sorting.</div>
              <textarea
                .value=${this.groupOrderValue()}
                @input=${this.handleGroupOrderChanged}
              ></textarea>

              ${this.renderSelect(
                this._config.group_sort_by || "name",
                [
                  ["name", "Name"],
                  ["total_remaining_weight", "Total remaining weight"],
                  ["max_remaining_weight", "Max remaining weight"],
                  ["spool_count", "Spool count"],
                ],
                value => this.updateConfigValue("group_sort_by", value)
              )}
          

              ${this.renderSelect(
                this._config.group_sort_direction || "asc",
                [
                  ["asc", "Ascending"],
                  ["desc", "Descending"],
                ],
                value => this.updateConfigValue("group_sort_direction", value)
              )}

              ${this.renderTextField("group_icon", "Group icon")}
              ${this.renderSwitch("show_group_title", "Show group title")}
            `
          : html``}

        <div class="section-title">Sorting</div>

        ${this.renderSelect(
          this._config.sort_by || "remaining_weight",
          [
            ["remaining_weight", "Remaining weight"],
            ["filament_name", "Filament name"],
            ["filament_material", "Material"],
            ["filament_vendor_name", "Vendor"],
            ["filament_color_hex", "Color"],
          ],
          value => this.updateConfigValue("sort_by", value)
        )}

        ${this.renderSelect(
          this._config.sort_direction || "asc",
          [
            ["asc", "Ascending"],
            ["desc", "Descending"],
          ],
          value => this.updateConfigValue("sort_direction", value)
        )}

        <div class="section-title">Appearance</div>

        ${this.renderSelect(
          this._config.bar_direction || "vertical",
          [
            ["vertical", "Vertical"],
            ["horizontal", "Horizontal"],
          ],
          value => {
            const config = {
              ...this._config,
              bar_direction: value,
            };
        
            this.normalizePositions(config);
            this.setAndDispatchConfig(config);
          }
        )}

        ${this.renderSelect(
          this._config.name_position || "bottom",
          this.namePositionOptions(),
          value => this.updateConfigValue("name_position", value)
        )}
        ${this.renderSelect(
          this._config.value_position || "center",
          this.valuePositionOptions(),
          value => this.updateConfigValue("value_position", value)
        )}

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

  renderTextForm(value, label, onChange) {
    const schema = [
      {
        name: "value",
        selector: {
          text: {},
        },
      },
    ];
  
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ value }}
        .schema=${schema}
        .computeLabel=${() => label}
        @value-changed=${event => {
          onChange(event.detail.value?.value ?? "");
        }}
      ></ha-form>
    `;
  }

  renderSelect(value, options, onChange) {
    const schema = [
      {
        name: "value",
        selector: {
          select: {
            mode: "dropdown",
            options: options.map(([optionValue, label]) => ({
              value: optionValue,
              label,
            })),
          },
        },
      },
    ];
  
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ value }}
        .schema=${schema}
        .computeLabel=${() => ""}
        @value-changed=${event => {
          const selectedValue = event.detail.value?.value;
          if (selectedValue !== undefined && selectedValue !== value) {
            onChange(selectedValue);
          }
        }}
      ></ha-form>
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
