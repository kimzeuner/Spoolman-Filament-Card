# Spoolman Filament Card

A highly configurable Home Assistant card for visualizing remaining filament on your 3D printer spools.

Originally designed for **Spoolman**, the card is evolving into a generic resource visualization card that can also display custom entities.

---

## Features

### Spoolman Preset

- Automatic detection of all Spoolman filament entities
- Dynamic maximum weight based on `filament_weight`
- Grouping by
  - Material
  - Color
  - Vendor
  - None
- Custom group order
- Group icon
- Group sorting
- Spool sorting
- Horizontal / Vertical bars
- Name position
- Value position
- Show / Hide names
- Show / Hide group titles
- Use filament color
- Hide archived spools
- Automatic updates only when relevant entities change

---

## Presets

The card supports multiple presets.

### 1. Spoolman

The default preset.

Automatically discovers all Spoolman filament entities and displays them without any additional configuration.

```yaml
type: custom:spoolman-filament-card
preset: spoolman
```

---

### 2. Custom Attributes

This preset allows displaying arbitrary Home Assistant entities.

Each entity contains all required display information inside its attributes.

Example:

```yaml
state: 420

attributes:
  friendly_name: PLA Black
  group: PLA
  vendor: Prusament
  color: "#111111"
  max_value: 1000
  unit: g
```

Example configuration:

```yaml
type: custom:spoolman-filament-card

preset: custom_attributes

custom_attribute_entities:
  - sensor.pla_black
  - sensor.petg_white

group_by: material
```

Supported attributes

| Attribute | Description |
|------------|-------------|
| friendly_name | Display name |
| group | Group name |
| vendor | Vendor |
| color | Bar color |
| max_value | Maximum value |
| unit | Unit |
| value *(optional)* | Current value |
| remaining_weight *(optional)* | Alternative current value |

---

### 3. Custom Multiple Entities

Allows building one bar from multiple entities.

Example:

```yaml
type: custom:spoolman-filament-card

preset: custom_entities

custom_items:

  - name: PLA Black

    value_entity: sensor.pla_black_remaining
    max_entity: sensor.pla_black_capacity

    color_entity: sensor.pla_black_color
    group_entity: sensor.pla_black_material
    vendor_entity: sensor.pla_black_vendor

    unit: g

  - name: PETG White

    value_entity: sensor.petg_remaining
    max: 750

    color: "#ffffff"
    group: PETG
    vendor: Generic
```

Each field may either reference an entity or contain a fixed value.

Supported fields

| Field | Description |
|---------|-------------|
| value_entity | Current value |
| max_entity | Maximum value entity |
| max | Fixed maximum |
| color_entity | Color entity |
| color | Fixed color |
| group_entity | Group entity |
| group | Fixed group |
| vendor_entity | Vendor entity |
| vendor | Fixed vendor |
| name_entity | Name entity |
| name | Fixed name |
| unit | Display unit |

---

### 4. Home Assistant Labels *(planned)*

This preset automatically discovers entities by using Home Assistant Labels.

Instead of manually selecting entities, simply assign the same HA Label to all relevant entities.

Example:

```yaml
type: custom:spoolman-filament-card

preset: custom_label

custom_label_id: filament
```

Every entity carrying this label will automatically appear in the card.

This is especially useful for large installations because adding a new entity only requires assigning the label.

---

## Grouping

Available options

- Material / Group
- Color
- Vendor
- None

---

## Sorting

### Groups

- Name
- Total remaining value
- Maximum remaining value
- Item count

### Items

- Remaining value
- Name
- Material / Group
- Vendor
- Color

Ascending and descending sorting are supported.

---

## Appearance

- Vertical bars
- Horizontal bars
- Name position
- Value position
- Group title
- Group icon
- Use entity color
- Automatic text color
- Custom title

---

## Default YAML

```yaml
type: custom:spoolman-filament-card

title: Filament

preset: spoolman
```

---

## Advanced Example

```yaml
type: custom:spoolman-filament-card

title: Workshop Inventory

preset: custom_attributes

group_by: material

show_group_title: true
show_name: true

bar_direction: vertical

custom_attribute_entities:
  - sensor.pla_black
  - sensor.pla_white
  - sensor.petg_red
```

---

## Roadmap

- Home Assistant Label preset
- Entity picker
- Attribute picker
- Per-item icons
- Per-item click actions
- Multiple value formats
- Percentage display
- Templates for common use cases
- Import/Export presets

---

## Requirements

- Home Assistant
- Lovelace
- HACS (recommended)

---

## Installation

### HACS

Search for

```
Spoolman Filament Card
```

or add the custom repository.

---

## Credits

Inspired by the excellent **Spoolman** project and built for the Home Assistant community.
