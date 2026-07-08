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

    .hint {
      color: var(--secondary-text-color);
      font-size: 12px;
      line-height: 1.4;
      margin-top: -6px;
    }

    ha-textfield,
    ha-select {
      width: 100%;
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

    .switch-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .switch-label {
      font-size: 14px;
    }

    .custom-item {
      display: grid;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }

    .button-row {
      display: flex;
      gap: 8px;
    }

    .editor-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: fit-content;
      padding: 8px 14px;
      border: none;
      border-radius: 4px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      user-select: none;
    }

    .editor-button:hover {
      filter: brightness(1.08);
    }

    .editor-button.secondary {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
    }

    .editor-button.danger {
      background: var(--error-color);
      color: var(--text-primary-color);
    }
  `;

  setConfig(config) {
    this._config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    if (this._config.group_icon === "none") {
      this._config.show_group_icon = false;
    } else if (this._config.show_group_icon === undefined) {
      this._config.show_group_icon = true;
    }
    
  }

  render() {
    if (!this._config) return html``;

    const preset = this._config.preset || "spoolman";

    return html`
      <div class="editor">
        ${this.renderGeneralSection(preset)}

        ${preset === "spoolman" ? this.renderSpoolmanOptions() : ""}
        ${preset === "custom_attributes" ? this.renderCustomAttributeOptions() : ""}
        ${preset === "custom_entities" ? this.renderCustomEntityOptions() : ""}
        ${preset === "custom_label" ? this.renderCustomLabelOptions() : ""}

        ${this.renderAppearanceOptions()}
      </div>
    `;
  }

  renderGeneralSection(preset) {
    return html`
      <div class="section-title">General</div>

      ${this.renderSelect(
        preset,
        "Choose Preset",
        [
          ["spoolman", "Spoolman"],
          ["custom_attributes", "Custom: Attributes"],
          ["custom_entities", "Custom: Multiple entities"],
          ["custom_label", "Custom: HA Label"],
        ],
        value => this.updatePreset(value)
      )}

      ${this.renderPresetHint(preset)}

      ${this.renderTextField("title", "Title")}
    `;
  }

  renderSpoolmanOptions() {
    return html`
      <div class="section-title">Grouping</div>

      ${this.renderSelect(
        this._config.group_by || "material",
        "Group by",
        [
          ["material", "Material"],
          ["color", "Color"],
          ["vendor", "Vendor"],
          ["none", "Don't group"],
        ],
        value => this.updateConfigValue("group_by", value)
      )}

      ${this.renderGroupingDetails("Spool count")}

      <div class="section-title">Sorting</div>

      ${this.renderSelect(
        this._config.sort_by || "remaining_weight",
        "Sort by",
        [
          ["remaining_weight", "Remaining weight"],
          ["filament_name", "Filament name"],
          ["filament_material", "Material"],
          ["filament_vendor_name", "Vendor"],
          ["filament_color_hex", "Color"],
        ],
        value => this.updateConfigValue("sort_by", value)
      )}

      ${this.renderSortDirection()}

      ${this.renderNumberField("max_weight", "Max weight fallback")}
      ${this.renderHint("Used only if no filament weight is available.")}

      ${this.renderSwitch("hide_archived", "Hide archived spools")}
      ${this.renderSwitch("use_filament_color", "Use filament color")}
    `;
  }

  renderCustomAttributeOptions() {
    return html`
      <div class="section-title">Custom Attributes</div>

      ${this.renderEntityPicker(
        this._config.custom_attribute_entities || [],
        "Entities with attributes",
        value => this.updateConfigValue("custom_attribute_entities", value),
        true
      )}

      ${this.renderHint(
        "Each selected entity should provide attributes like group, vendor, color, max_value and unit."
      )}

      ${this.renderCustomDefaults()}
      ${this.renderCustomSharedOptions()}
    `;
  }

  renderCustomEntityOptions() {
    const items = this._config.custom_items || [];

    return html`
      <div class="section-title">Custom Multiple Entities</div>

      ${this.renderHint(
        "Create one item per spool. Each item can use separate entities for value, max value, color, group and vendor."
      )}

      ${items.map((item, index) => this.renderCustomItem(item, index))}

      <button
        class="editor-button"
        type="button"
        @click=${() => this.addCustomItem()}
      >
        <ha-icon icon="mdi:plus"></ha-icon>
        Add spool
      </button>

      ${this.renderCustomDefaults()}
      ${this.renderCustomSharedOptions()}
    `;
  }

  renderCustomItem(item, index) {
    return html`
      <div class="custom-item">
        <div class="section-title">Spool ${index + 1}</div>

        ${this.renderTextForm(
          item.name || "",
          "Name",
          value => this.updateCustomItem(index, "name", value)
        )}

        ${this.renderEntityPicker(
          item.value_entity || "",
          "Value entity",
          value => this.updateCustomItem(index, "value_entity", value)
        )}

        ${this.renderEntityPicker(
          item.max_entity || "",
          "Max entity",
          value => this.updateCustomItem(index, "max_entity", value)
        )}

        ${this.renderEntityPicker(
          item.color_entity || "",
          "Color entity",
          value => this.updateCustomItem(index, "color_entity", value)
        )}

        ${this.renderEntityPicker(
          item.group_entity || "",
          "Group entity",
          value => this.updateCustomItem(index, "group_entity", value)
        )}

        ${this.renderEntityPicker(
          item.vendor_entity || "",
          "Vendor entity",
          value => this.updateCustomItem(index, "vendor_entity", value)
        )}

        ${this.renderEntityPicker(
          item.name_entity || "",
          "Name entity",
          value => this.updateCustomItem(index, "name_entity", value)
        )}

        ${this.renderTextForm(
          item.unit || this._config.custom_unit || "g",
          "Unit",
          value => this.updateCustomItem(index, "unit", value)
        )}

        <button
          class="editor-button danger"
          type="button"
          @click=${() => this.removeCustomItem(index)}
        >
          <ha-icon icon="mdi:delete"></ha-icon>
          Remove spool
        </button>
      </div>
    `;
  }

  renderCustomLabelOptions() {
    return html`
      <div class="section-title">Custom HA Label</div>

      ${this.renderHint(
        "All entities with the selected Home Assistant label will be used automatically. They should provide the same attributes as Custom Attributes."
      )}

      ${this.renderLabelPicker(
        this._config.custom_label_id || "",
        "HA Label",
        value => this.updateConfigValue("custom_label_id", value)
      )}

      ${this.renderCustomDefaults()}
      ${this.renderCustomSharedOptions()}
    `;
  }

  renderCustomDefaults() {
    return html`
      ${this.renderTextForm(
        this._config.custom_max_value ?? 1000,
        "Default max value",
        value => this.updateConfigValue("custom_max_value", Number(value))
      )}

      ${this.renderHint("Used when an item does not provide its own maximum value.")}

      ${this.renderTextForm(
        this._config.custom_unit || "g",
        "Default unit",
        value => this.updateConfigValue("custom_unit", value)
      )}
    `;
  }

  renderCustomSharedOptions() {
    return html`
      <div class="section-title">Grouping</div>

      ${this.renderSelect(
        this._config.group_by || "material",
        "Group by",
        [
          ["material", "Group"],
          ["color", "Color"],
          ["vendor", "Vendor"],
          ["none", "Don't group"],
        ],
        value => this.updateConfigValue("group_by", value)
      )}

      ${this.renderGroupingDetails("Item count")}

      <div class="section-title">Sorting</div>

      ${this.renderSelect(
        this._config.sort_by || "remaining_weight",
        "Sort by",
        [
          ["remaining_weight", "Value"],
          ["filament_name", "Name"],
          ["filament_material", "Group"],
          ["filament_vendor_name", "Vendor"],
          ["filament_color_hex", "Color"],
        ],
        value => this.updateConfigValue("sort_by", value)
      )}

      ${this.renderSortDirection()}

      ${this.renderSwitch("use_filament_color", "Use item color")}
    `;
  }

  renderGroupingDetails(countLabel) {
    if (this._config.group_by === "none") return html``;

    return html`
      ${this.renderHint(this.groupOrderHint())}

      <textarea
        .value=${this.groupOrderValue()}
        @input=${this.handleGroupOrderChanged}
      ></textarea>

      ${this.renderSelect(
        this._config.group_sort_by || "name",
        "Group sort by",
        [
          ["name", "Name"],
          ["total_remaining_weight", "Total remaining weight"],
          ["max_remaining_weight", "Max remaining weight"],
          ["spool_count", countLabel],
        ],
        value => this.updateConfigValue("group_sort_by", value)
      )}

      ${this.renderSelect(
        this._config.group_sort_direction || "asc",
        "Group sort direction",
        [
          ["asc", "Ascending"],
          ["desc", "Descending"],
        ],
        value => this.updateConfigValue("group_sort_direction", value)
      )}

      ${this.renderSwitch(
        "show_group_icon",
        "Show group icon",
        value => {
          const config = {
            ...this._config,
            show_group_icon: value,
            group_icon: value
              ? this._config.group_icon || "mdi:printer-3d-nozzle"
              : "none",
          };
      
          this.setAndDispatchConfig(config);
        }
      )}
      
      ${this._config.group_icon !== "none"
        ? this.renderIconPicker(
            this._config.group_icon || "mdi:printer-3d-nozzle",
            "Group icon",
            value => this.updateConfigValue("group_icon", value || "none")
          )
        : ""}

      ${this.renderSwitch("show_group_title", "Show group title")}
    `;
  }

  renderSortDirection() {
    return this.renderSelect(
      this._config.sort_direction || "asc",
      "Sort direction",
      [
        ["asc", "Ascending"],
        ["desc", "Descending"],
      ],
      value => this.updateConfigValue("sort_direction", value)
    );
  }

  renderAppearanceOptions() {
    return html`
      <div class="section-title">Appearance</div>

      ${this.renderSelect(
        this._config.bar_direction || "vertical",
        "Bar direction",
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
        "Name position",
        this.namePositionOptions(),
        value => this.updateConfigValue("name_position", value)
      )}

      ${this.renderSelect(
        this._config.value_position || "center",
        "Value position",
        this.valuePositionOptions(),
        value => this.updateConfigValue("value_position", value)
      )}

      ${this.renderSwitch("show_name", "Show name")}
    `;
  }

  renderPresetHint(preset) {
    const hints = {
      spoolman: "Automatically discovers Spoolman filament entities.",
      custom_attributes: "Use entities that provide all display data through attributes.",
      custom_entities: "Build each spool from multiple Home Assistant entities.",
      custom_label: "Automatically use entities assigned to a Home Assistant label.",
    };

    return this.renderHint(hints[preset] || "");
  }

  renderHint(text) {
    if (!text) return html``;

    return html`
      <div class="hint">${text}</div>
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

  renderSelect(value, label, options, onChange) {
    const schema = [
      {
        name: "value",
        selector: {
          select: {
            mode: "dropdown",
            options: options.map(([optionValue, optionLabel]) => ({
              value: optionValue,
              label: optionLabel,
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
        .computeLabel=${() => label}
        @value-changed=${event => {
          const selectedValue = event.detail.value?.value;
          if (selectedValue !== undefined && selectedValue !== value) {
            onChange(selectedValue);
          }
        }}
      ></ha-form>
    `;
  }

  renderEntityPicker(value, label, onChange, multiple = false) {
    const schema = [
      {
        name: "value",
        selector: {
          entity: {
            multiple,
          },
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
          onChange(event.detail.value?.value || (multiple ? [] : ""));
        }}
      ></ha-form>
    `;
  }

  renderLabelPicker(value, label, onChange) {
    const schema = [
      {
        name: "value",
        selector: {
          label: {},
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
          onChange(event.detail.value?.value || "");
        }}
      ></ha-form>
    `;
  }

  renderIconPicker(value, label, onChange) {
    const schema = [
      {
        name: "value",
        selector: {
          icon: {},
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
          onChange(event.detail.value?.value || "");
        }}
      ></ha-form>
    `;
  }

  renderSwitch(key, label, onChange = null) {
    const checked = this._config[key] !== false;
  
    return html`
      <div class="switch-row">
        <ha-switch
          .checked=${checked}
          @change=${event => {
            if (onChange) {
              onChange(event.target.checked);
            } else {
              this.updateConfigValue(key, event.target.checked);
            }
          }}
        ></ha-switch>
        <span class="switch-label">${label}</span>
      </div>
    `;
  }

  updatePreset(preset) {
    const config = {
      ...this._config,
      preset,
    };

    if (preset === "spoolman") {
      delete config.custom_attribute_entities;
      delete config.custom_items;
      delete config.custom_label_id;
      delete config.custom_max_value;
      delete config.custom_unit;
    }

    if (preset === "custom_attributes") {
      delete config.custom_items;
      delete config.custom_label_id;
    }

    if (preset === "custom_entities") {
      delete config.custom_attribute_entities;
      delete config.custom_label_id;
    }

    if (preset === "custom_label") {
      delete config.custom_attribute_entities;
      delete config.custom_items;
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

  updateCustomItem(index, key, value) {
    const custom_items = [...(this._config.custom_items || [])];

    custom_items[index] = {
      ...custom_items[index],
      [key]: value,
    };

    this.updateConfigValue("custom_items", custom_items);
  }

  addCustomItem() {
    const custom_items = [
      ...(this._config.custom_items || []),
      {
        name: "",
        value_entity: "",
        max_entity: "",
        color_entity: "",
        group_entity: "",
        vendor_entity: "",
        name_entity: "",
        unit: this._config.custom_unit || "g",
      },
    ];

    this.updateConfigValue("custom_items", custom_items);
  }

  removeCustomItem(index) {
    const custom_items = [...(this._config.custom_items || [])];
    custom_items.splice(index, 1);

    this.updateConfigValue("custom_items", custom_items);
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

  groupOrderHint() {
    if (this._config.group_by === "color") {
      return "One color per line. Unknown colors are appended automatically.";
    }

    if (this._config.group_by === "vendor") {
      return "One vendor per line. Unknown vendors are appended automatically.";
    }

    return "One group per line. Unknown groups are appended automatically.";
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
