import { LitElement, html, css } from "lit";
import { DEFAULT_CONFIG, EDITOR_TYPE } from "./const.js";
import {
  getGroupValue,
  sortGroups,
} from "./helpers.js";
const ACTION_OPTIONS = [
  ["more-info", "More info"],
  ["navigate", "Navigate"],
  ["url", "URL"],
  ["call-service", "Call service"],
  ["assist", "Assist"],
  ["none", "None"],
];

class SpoolmanFilamentCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _openSections: { state: true },
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

    .expandable-section {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .expandable-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 12px;
      cursor: pointer;
      user-select: none;
      font-weight: 500;
      background: var(--secondary-background-color);
    }
    
    .expandable-header:hover {
      filter: brightness(1.03);
    }
    
    .expandable-content {
      display: grid;
      gap: 12px;
      padding: 12px;
    }

  `;

  setConfig(config) {
    this._config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    if (!this._openSections) {
      this._openSections = {
        groupTitleOverrides: false,
      };
    }
  }

  render() {
    if (!this._config) return html``;

    const preset = this._config.preset || "spoolman";

    return html`
      <div class="editor">
        ${this.renderExpandableSection(
          "general",
          "General",
          this.renderGeneralSection(preset),
          true
        )}
    
        ${preset === "spoolman"
          ? this.renderSpoolmanOptions()
          : ""}
    
        ${preset === "custom_attributes"
          ? this.renderCustomAttributeOptions()
          : ""}
    
        ${preset === "custom_entities"
          ? this.renderCustomEntityOptions()
          : ""}
    
        ${preset === "custom_label"
          ? this.renderCustomLabelOptions()
          : ""}
    
        ${this.renderExpandableSection(
          "appearance",
          "Appearance",
          this.renderAppearanceOptions(),
          true
        )}
    
        ${this.renderExpandableSection(
          "actions",
          "Actions",
          this.renderActionOptions(),
          false
        )}
      </div>
    `;
  }

  toggleSection(section) {
    this._openSections = {
      ...(this._openSections || {}),
      [section]: !this._openSections?.[section],
    };
  }
  
  renderExpandableSection(section, title, content, openByDefault = false) {
    const isOpen = this._openSections?.[section] ?? openByDefault;
  
    return html`
      <div class="expandable-section">
        <div
          class="expandable-header"
          @click=${() => this.toggleSection(section)}
        >
          <span>${title}</span>
          <ha-icon icon=${isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}></ha-icon>
        </div>
  
        ${isOpen
          ? html`
              <div class="expandable-content">
                ${content}
              </div>
            `
          : ""}
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
      ${this.renderGroupTitleOverrides()}

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

      ${this.renderGroupTitleOverrides()}

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

  renderGroupTitleOverrides() {
    if (this._config.group_by === "none") return html``;
  
    const groups = this.getAvailableGroups();
  
    if (!groups.length) {
      return this.renderExpandableSection(
        "groupTitleOverrides",
        "Group Title Overrides",
        html`
          ${this.renderHint(
            "No groups found yet. Groups will appear here once matching entities are available."
          )}
        `,
        false
      );
    }
  
    return this.renderExpandableSection(
      "groupTitleOverrides",
      "Group Title Overrides",
      html`
        ${this.renderHint(
          "Configure individual icons, colors and actions for specific group titles."
        )}
    
        ${groups.map(group => this.renderGroupTitleOverride(group))}
      `,
      false
    );
  }

  getAvailableGroups() {
    if (!this.hass || !this._config || this._config.group_by === "none") {
      return [];
    }
  
    const preset = this._config.preset || "spoolman";
    const items = this.getPreviewItemsForGroups(preset);
  
    let groups = [...new Set(
      items
        .map(item => getGroupValue(this._config, item))
        .filter(Boolean)
    )];
  
    groups = sortGroups(this._config, groups, items);
  
    const groupOrder = Array.isArray(this._config.group_order)
      ? this._config.group_order
      : [];
  
    return [
      ...groupOrder.filter(group => groups.includes(group)),
      ...groups.filter(group => !groupOrder.includes(group)),
    ];
  }

  getPreviewItemsForGroups(preset) {
    if (preset === "custom_entities") {
      return this.getCustomEntityPreviewItems();
    }
  
    if (preset === "custom_attributes" || preset === "custom_label") {
      return this.getCustomAttributePreviewItems(preset);
    }
  
    return this.getSpoolmanPreviewItems();
  }

  getSpoolmanPreviewItems() {
    return Object.entries(this.hass.states)
      .map(([entity_id, state]) => ({ entity_id, state }))
      .filter(({ state }) => state.attributes?.filament_material);
  }

  getCustomAttributePreviewItems(preset) {
    const entities =
      preset === "custom_label"
        ? this.getEntitiesFromSelectedLabel()
        : this._config.custom_attribute_entities || [];
  
    const defaultMax = Number(this._config.custom_max_value || 1000);
    const defaultUnit = this._config.custom_unit || "g";
  
    return entities
      .map(entity_id => {
        const source = this.hass.states[entity_id];
        if (!source) return null;
  
        const attr = source.attributes || {};
        const value = Number(attr.value ?? attr.remaining_weight ?? source.state);
        if (Number.isNaN(value)) return null;
  
        return this.createPreviewItem({
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
      .filter(Boolean);
  }

  getCustomEntityPreviewItems() {
    const items = this._config.custom_items || [];
    const defaultMax = Number(this._config.custom_max_value || 1000);
    const defaultUnit = this._config.custom_unit || "g";
  
    return items
      .map((item, index) => {
        const valueState = this.hass.states[item.value_entity];
        if (!valueState) return null;
  
        const value = Number(valueState.state);
        if (Number.isNaN(value)) return null;
  
        const max = item.max_entity
          ? Number(this.hass.states[item.max_entity]?.state ?? defaultMax)
          : Number(item.max ?? item.max_value ?? defaultMax);
  
        const color = item.color_entity
          ? this.hass.states[item.color_entity]?.state
          : item.color;
  
        const group = item.group_entity
          ? this.hass.states[item.group_entity]?.state
          : item.group;
  
        const vendor = item.vendor_entity
          ? this.hass.states[item.vendor_entity]?.state
          : item.vendor;
  
        const name = item.name_entity
          ? this.hass.states[item.name_entity]?.state
          : item.name;
  
        return this.createPreviewItem({
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
      .filter(Boolean);
  }

  getEntitiesFromSelectedLabel() {
    const labelId = this._config.custom_label_id;
  
    if (!labelId || !this.hass?.entities) {
      return [];
    }
  
    return Object.entries(this.hass.entities)
      .filter(([, entity]) => entity.labels?.includes(labelId))
      .map(([entityId]) => entityId);
  }

  createPreviewItem({ entity_id, value, max, name, group, vendor, color, unit }) {
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
  
  renderGroupTitleOverride(group) {
    const icon = this._config.group_title_icons?.[group] || "";
    const color = this._config.group_title_colors?.[group] || "";
  
    return html`
      <div class="custom-item">
        <div class="section-title">${group}</div>
  
        ${this.renderIconPicker(
          icon,
          "Group title icon",
          value => this.updateGroupTitleValue("group_title_icons", group, value)
        )}
  
        ${this.renderTextForm(
          color,
          "Group title color",
          value => this.updateGroupTitleValue("group_title_colors", group, value)
        )}
  
        ${this.renderGroupTitleActionFields(group, "tap_action", "Tap action")}
        ${this.renderGroupTitleActionFields(group, "double_tap_action", "Double tap action")}
        ${this.renderGroupTitleActionFields(group, "hold_action", "Hold action")}
      </div>
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

      ${this.renderSwitchValue(
        this._config.group_icon !== "none",
        "Show group icon",
        value => this.updateGroupIconVisibility(value)
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

  renderGroupTitleActionFields(group, actionKey, label) {
    const groupActions = this._config.group_title_actions?.[group] || {};
    const actionConfig = groupActions[actionKey] || { action: "none" };
    const action = actionConfig.action || "none";
  
    return html`
      ${this.renderSelect(
        action,
        label,
        ACTION_OPTIONS,
        value => {
          const next = { action: value };
  
          if (value === "assist") {
            next.pipeline_id = "preferred";
            next.start_listening = true;
          }
  
          this.updateGroupTitleAction(group, actionKey, next);
        }
      )}
  
      ${action === "navigate"
        ? this.renderTextForm(
            actionConfig.navigation_path || "",
            "Navigation path",
            value =>
              this.updateGroupTitleAction(group, actionKey, {
                ...actionConfig,
                action,
                navigation_path: value,
              })
          )
        : ""}
  
      ${action === "url"
        ? this.renderTextForm(
            actionConfig.url_path || "",
            "URL path",
            value =>
              this.updateGroupTitleAction(group, actionKey, {
                ...actionConfig,
                action,
                url_path: value,
              })
          )
        : ""}
  
      ${action === "call-service"
        ? html`
            <div class="hint">Service</div>
  
            <ha-service-picker
              .hass=${this.hass}
              .value=${actionConfig.service || ""}
              @value-changed=${event =>
                this.updateGroupTitleAction(group, actionKey, {
                  ...actionConfig,
                  action,
                  service: event.detail.value,
                })}
            ></ha-service-picker>
  
            <div class="hint">Target entity</div>
  
            <ha-entity-picker
              .hass=${this.hass}
              .value=${actionConfig.target?.entity_id || ""}
              @value-changed=${event =>
                this.updateGroupTitleAction(group, actionKey, {
                  ...actionConfig,
                  action,
                  target: event.detail.value
                    ? { entity_id: event.detail.value }
                    : undefined,
                })}
            ></ha-entity-picker>
          `
        : ""}
  
      ${action === "assist"
        ? html`
            ${this.renderTextForm(
              actionConfig.pipeline_id || "preferred",
              "Pipeline ID",
              value =>
                this.updateGroupTitleAction(group, actionKey, {
                  ...actionConfig,
                  action,
                  pipeline_id: value,
                })
            )}
  
            ${this.renderSwitchValue(
              actionConfig.start_listening !== false,
              "Start listening",
              value =>
                this.updateGroupTitleAction(group, actionKey, {
                  ...actionConfig,
                  action,
                  start_listening: value,
                })
            )}
          `
        : ""}
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

  renderActionOptions() {
    return html`
  
      ${this.renderActionSelect("tap_action", "Tap action", "more-info")}
      ${this.renderActionSelect("double_tap_action", "Double tap action", "none")}
      ${this.renderActionSelect("hold_action", "Hold action", "none")}
    `;
  }
  
  renderActionSelect(configKey, label, defaultAction) {
    const actionConfig = this._config[configKey] || {};
    const action = actionConfig.action || defaultAction;
  
    return html`
      ${this.renderSelect(
        action,
        label,
        ACTION_OPTIONS,
        value => {
          const actionConfig = { action: value };
        
          if (value === "assist") {
            actionConfig.pipeline_id = "preferred";
            actionConfig.start_listening = true;
          }
        
          this.updateConfigValue(configKey, actionConfig);
        }
      )}
  
      ${this.renderActionExtraFields(configKey, actionConfig, action)}
    `;
  }
  
  renderActionExtraFields(configKey, actionConfig, action) {
    if (action === "navigate") {
      return this.renderTextForm(
        actionConfig.navigation_path || "",
        "Navigation path",
        value => this.updateActionConfigValue(configKey, "navigation_path", value)
      );
    }
  
    if (action === "url") {
      return this.renderTextForm(
        actionConfig.url_path || "",
        "URL path",
        value => this.updateActionConfigValue(configKey, "url_path", value)
      );
    }
  
    if (action === "call-service") {
      return html`
        <div class="hint">Service</div>
  
        <ha-service-picker
          .hass=${this.hass}
          .value=${actionConfig.service || ""}
          @value-changed=${event =>
            this.updateActionConfigValue(configKey, "service", event.detail.value)}
        ></ha-service-picker>
  
        <div class="hint">Target entity</div>
  
        <ha-entity-picker
          .hass=${this.hass}
          .value=${actionConfig.target?.entity_id || ""}
          @value-changed=${event =>
            this.updateActionTargetEntity(configKey, event.detail.value)}
        ></ha-entity-picker>
      `;
    }
    if (action === "assist") {
      return html`
        ${this.renderTextForm(
          actionConfig.pipeline_id || "preferred",
          "Pipeline ID",
          value => this.updateActionConfigValue(configKey, "pipeline_id", value)
        )}
    
        ${this.renderSwitchValue(
          actionConfig.start_listening !== false,
          "Start listening",
          value => this.updateActionConfigValue(configKey, "start_listening", value)
        )}
      `;
    }
    return html``;
  }

  updateGroupTitleValue(configKey, group, value) {
    const config = { ...this._config };
    const values = { ...(config[configKey] || {}) };
  
    if (value) {
      values[group] = value;
    } else {
      delete values[group];
    }
  
    config[configKey] = values;
    this.setAndDispatchConfig(config);
  }
  
  updateGroupTitleAction(group, actionKey, actionConfig) {
    const config = { ...this._config };
    const groupTitleActions = { ...(config.group_title_actions || {}) };
    const groupActions = { ...(groupTitleActions[group] || {}) };
  
    if (!actionConfig || actionConfig.action === "none") {
      delete groupActions[actionKey];
    } else {
      groupActions[actionKey] = actionConfig;
    }
  
    if (Object.keys(groupActions).length) {
      groupTitleActions[group] = groupActions;
    } else {
      delete groupTitleActions[group];
    }
  
    config.group_title_actions = groupTitleActions;
    this.setAndDispatchConfig(config);
  }

  updateActionConfigValue(configKey, field, value) {
    const config = { ...this._config };
    const actionConfig = { ...(config[configKey] || {}) };
    const cleanValue = typeof value === "string" ? value.trim() : value;
  
    if (cleanValue) {
      actionConfig[field] = cleanValue;
    } else {
      delete actionConfig[field];
    }
  
    config[configKey] = actionConfig;
    this.setAndDispatchConfig(config);
  }
  
  updateActionTargetEntity(configKey, entityId) {
    const config = { ...this._config };
    const actionConfig = { ...(config[configKey] || {}) };
  
    if (entityId) {
      actionConfig.target = {
        ...(actionConfig.target || {}),
        entity_id: entityId,
      };
    } else {
      delete actionConfig.target;
    }
  
    config[configKey] = actionConfig;
    this.setAndDispatchConfig(config);
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

  renderSwitchValue(checked, label, onChange) {
    return html`
      <div class="switch-row">
        <ha-switch
          .checked=${checked}
          @change=${event => onChange(event.target.checked)}
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

  updateGroupIconVisibility(visible) {
    const config = {
      ...this._config,
      group_icon: visible
        ? "mdi:printer-3d-nozzle"
        : "none",
    };
  
    this.setAndDispatchConfig(config);
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
