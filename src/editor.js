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

    .section-title {
      margin: 24px 0 12px;
      font-size: 16px;
      font-weight: 500;
    }

    .section-title:first-child {
      margin-top: 0;
    }

    ha-form {
      display: block;
      width: 100%;
      margin-bottom: 12px;
    }

    textarea {
      width: 100%;
      min-height: 90px;
      box-sizing: border-box;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
      resize: vertical;
    }

    .hint {
      color: var(--secondary-text-color);
      font-size: 12px;
      margin-bottom: 6px;
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

        ${this.renderTextForm("title", "Title")}
        ${this.renderBooleanForm("hide_archived", "Hide archived spools")}

        <div class="section-title">Grouping</div>

        ${this.renderSelectForm("group_by", "Group by", [
          ["material", "Material"],
          ["color", "Color"],
          ["vendor", "Vendor"],
          ["none", "Don't group"],
        ])}

        ${this._config.group_by !== "none" ? html`
          <div class="hint">Group order, one entry per line. Empty = automatic sorting.</div>
          <textarea
            .value=${this.groupOrderValue()}
            @change=${this.handleGroupOrderChanged}
          ></textarea>

          ${this.renderSelectForm("group_sort_by", "Group sort by", [
            ["name", "Name"],
            ["total_remaining_weight", "Total remaining weight"],
            ["max_remaining_weight", "Max remaining weight"],
            ["spool_count", "Spool count"],
          ])}

          ${this.renderSelectForm("group_sort_direction", "Group sort direction", [
            ["asc", "Ascending"],
            ["desc", "Descending"],
          ])}

          ${this.renderTextForm("group_icon", "Group icon")}
          ${this.renderBooleanForm("show_group_title", "Show group title")}
        ` : ""}

        <div class="section-title">Sorting</div>

        ${this.renderSelectForm("sort_by", "Sort by", [
          ["remaining_weight", "Remaining weight"],
          ["filament_name", "Filament name"],
          ["filament_material", "Material"],
          ["filament_vendor_name", "Vendor"],
          ["filament_color_hex", "Color"],
        ])}

        ${this.renderSelectForm("sort_direction", "Sort direction", [
          ["asc", "Ascending"],
          ["desc", "Descending"],
        ])}

        <div class="section-title">Appearance</div>

        ${this.renderSelectForm("bar_direction", "Bar direction", [
          ["vertical", "Vertical"],
          ["horizontal", "Horizontal"],
        ])}

        ${this.renderSelectForm("name_position", "Name position", this.namePositionOptions())}
        ${this.renderSelectForm("value_position", "Value position", this.valuePositionOptions())}

        ${this.renderNumberForm("max_weight", "Max weight fallback")}
        ${this.renderBooleanForm("show_name", "Show name")}
        ${this.renderBooleanForm("use_filament_color", "Use filament color")}
      </div>
    `;
  }

  renderTextForm(key, label) {
    const schema = [
      {
        name: key,
        selector: {
          text: {},
        },
      },
    ];

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ [key]: this._config[key] ?? DEFAULT_CONFIG[key] ?? "" }}
        .schema=${schema}
        .computeLabel=${() => label}
        @value-changed=${event => this.handleFormValueChanged(event)}
      ></ha-form>
    `;
  }

  renderNumberForm(key, label) {
    const schema = [
      {
        name: key,
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
      <ha-form
        .hass=${this.hass}
        .data=${{ [key]: this._config[key] ?? DEFAULT_CONFIG[key] }}
        .schema=${schema}
        .computeLabel=${() => label}
        @value-changed=${event => this.handleFormValueChanged(event)}
      ></ha-form>
    `;
  }

  renderBooleanForm(key, label) {
    const schema = [
      {
        name: key,
        selector: {
          boolean: {},
        },
      },
    ];

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ [key]: this._config[key] !== false }}
        .schema=${schema}
        .computeLabel=${() => label}
        @value-changed=${event => this.handleFormValueChanged(event)}
      ></ha-form>
    `;
  }

  renderSelectForm(key, label, options) {
    const schema = [
      {
        name: key,
        selector: {
          select: {
            mode: "dropdown",
            options: options.map(([value, optionLabel]) => ({
              value,
              label: optionLabel,
            })),
          },
        },
      },
    ];

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ [key]: this._config[key] ?? DEFAULT_CONFIG[key] }}
        .schema=${schema}
        .computeLabel=${() => label}
        @value-changed=${event => this.handleFormValueChanged(event)}
      ></ha-form>
    `;
  }

  handleFormValueChanged(event) {
    const value = event.detail.value || {};
    const config = {
      ...this._config,
      ...value,
    };

    if ("bar_direction" in value) {
      this.normalizePositions(config);
    }

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

  setAndDispatchConfig(config) {
    this._config = config;

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get(EDITOR_TYPE)) {
  customElements.define(EDITOR_TYPE, SpoolmanFilamentCardEditor);
}
