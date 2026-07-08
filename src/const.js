export const CARD_VERSION = "0.1.0";
export const CARD_TYPE = "filament-card";
export const EDITOR_TYPE = "filament-card-editor";

export const DEFAULT_CONFIG = {
  preset: "spoolman",
  
  title: "Filament",
  group_by: "material",
  group_sort_by: "name",
  group_sort_direction: "asc",
  group_order: [],
  group_icon: "mdi:printer-3d-nozzle",
  max_weight: 1000,
  hide_archived: true,
  sort_by: "remaining_weight",
  sort_direction: "asc",
  bar_direction: "vertical",
  name_position: "bottom",
  show_name: true,
  show_group_title: true,
  show_group_icon: true,
  value_position: "center",
  use_filament_color: true,

  // Custom mode
  custom_attribute_entities: [],
  custom_items: [],
  custom_max_value: 1000,
  custom_unit: "g",

  custom_label_id: "",
};
