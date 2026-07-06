import { LitElement, html, css } from "lit";
import { DEFAULT_CONFIG, EDITOR_TYPE } from "./const.js";

class SpoolmanFilamentCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static styles = css`
    .editor {
      padding: 16px;
    }

    .field {
      margin-bottom: 16px;
    }

    .field-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }

    .label {
      font-size: 14px;
      font-weight: 500;
    }

    .section-title {
      margin-top: 24px;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 500;
    }

    .section-title:first-child {
      margin-top: 0;
    }

    .switch-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .switch-label,
    .sub-label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .sub-label {
      margin-bottom: 4px;
    }

    ha-form {
      display: block;
      width: 100%;
    }

    textarea {
      width: 100%;
      min-height: 76px;
      box-sizing: border-box;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
      resize: vertical;
    }
  `;

  setConfig(config) {
    this._config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  render() {
    if (!this.hass || !this._config) return html``;

    return html`
      <div class="editor">
        <div class="section-title">General</div>

        ${this.renderTextForm(
          this._config.title || "",
          "Title",
          value => this.updateSimpleConfigValue("title", value)
        )}

        ${this.renderSwitch(
          this._config.hide_archived !== false,
          "Hide archived spools",
          checked => this.updateConfig({ hide_archived: checked })
        )}

        <div class="section-title">Grouping</div>

        ${this.renderSelect(
          this._config.group_by || "material",
          [
            ["material", "Material"],
            ["color", "Color"],
            ["vendor", "Vendor"],
            ["none", "Don't group"],
          ],
          value => this.updateConfig({ group_by: value || "material" })
        )}

        ${this._config.group_by !== "none"
          ? html`
              <div class="field">
                <div class="field-header">
                  <div class="label">Group order</div>
                </div>
                <div class="sub-label">One entry per line. Empty = automatic sorting.</div>
                <textarea
                  .value=${this.groupOrderValue()}
                  @change=${this.handleGroupOrderChanged}
                ></textarea>
              </div>

              ${this.renderSelect(
                this._config.group_sort_by || "name",
                [
                  ["name", "Name"],
                  ["total_remaining_weight", "Total remaining weight"],
                  ["max_remaining_weight", "Max remaining weight"],
                  ["spool_count", "Spool count"],
                ],
                value => this.updateConfig({ group_sort_by: value || "name" })
              )}

              ${this.renderSelect(
                this._config.group_sort_direction || "asc",
                [
                  ["asc", "Ascending"],
                  ["desc", "Descending"],
                ],
                value => this.updateConfig({ group_sort_direction: value || "asc" })
              )}

              ${this.renderTextForm(
                this._config.group_icon || "mdi:printer-3d-nozzle",
                "Group icon",
                value => this.updateSimpleConfigValue("group_icon", value)
              )}

              ${this.renderSwitch(
                this._config.show_group_title !== false,
                "Show group title",
                checked => this.updateConfig({ show_group_title: checked })
              )}
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
          value => this.updateConfig({ sort_by: value || "remaining_weight" })
        )}

        ${this.renderSelect(
          this._config.sort_direction || "asc",
          [
            ["asc", "Ascending"],
            ["desc", "Descending"],
          ],
          value => this.updateConfig({ sort_direction: value || "asc" })
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
              bar_direction: value || "vertical",
            };

            this.normalizePositions(config);
            this.setAndDispatchConfig(config);
          }
        )}

        ${this.renderSelect(
          this._config.name_position || "bottom",
          this.namePositionOptions(),
          value => this.updateConfig({ name_position: value || "bottom" })
        )}

        ${this.renderSelect(
          this._config.value_position || "center",
          this.valuePositionOptions(),
          value => this.updateConfig({ value_position: value || "center" })
        )}

        ${this.renderNumberForm(
          this._config.max_weight ?? 1000,
          "Max weight fallback",
          value => this.updateConfig({ max_weight: Number(value || 1000) })
        )}

        ${this.renderSwitch(
          this._config.show_name !== false,
          "Show name",
          checked => this.updateConfig({ show_name: checked })
        )}

        ${this.renderSwitch(
          this._config.use_filament_color !== false,
          "Use filament color",
          checked => this.updateConfig({ use_filament_color: checked })
        )}
      </div>
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
      <div class="field">
        <ha-form
          .hass=${this.hass}
          .data=${{ value }}
          .schema=${schema}
          .computeLabel=${() => label}
          @value-changed=${event => {
            onChange(event.detail.value?.value ?? "");
          }}
        ></ha-form>
      </div>
    `;
  }

  renderNumberForm(value, label, onChange) {
    const schema = [
      {
        name: "value",
        selector: {
          number: {
            mode: "box",
            min: 0,
            step: 1,
          },
        },
      },
    ];

    return html`
      <div class="field">
        <ha-form
          .hass=${this.hass}
          .data=${{ value }}
          .schema=${schema}
          .computeLabel=${() => label}
          @value-changed=${event => {
            onChange(event.detail.value?.value);
          }}
        ></ha-form>
      </div>
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
      <div class="field">
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
      </div>
    `;
  }

  renderSwitch(checked, label, onChange) {
    return html`
      <div class="field">
        <div class="switch-row">
          <ha-switch
            .checked=${checked}
            @change=${event => onChange(event.target.checked)}
          ></ha-switch>
          <span class="switch-label">${label}</span>
        </div>
      </div>
    `;
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

  groupOrderValue() {
    return Array.isArray(this._config.group_order)
      ? this._config.group_order.join("\n")
      : "";
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

  updateSimpleConfigValue(key, value) {
    const config = { ...this._config };
    const cleanValue = value?.trim();

    if (cleanValue) {
      config[key] = cleanValue;
    } else {
      delete config[key];
    }

    this.setAndDispatchConfig(config);
  }

  updateConfig(changes) {
    this.setAndDispatchConfig({
      ...this._config,
      ...changes,
    });
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
