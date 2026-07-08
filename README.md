# Filament Card

A modern and highly configurable Home Assistant Lovelace card to visualize your **Spoolman filament inventory**.

The card automatically discovers all Spoolman filament entities, groups and sorts them, and displays the remaining filament as vertical or horizontal bars.

![Preview](images/preview.png)

---

## Features

- 🎨 Group by **Material**, **Color**, **Vendor** or **Don't group**
- 📦 Automatic discovery of all Spoolman spools
- 📊 Vertical or horizontal bar layout
- 🌈 Optional filament colors
- 🔤 Custom group ordering
- 🔃 Flexible sorting
- 👀 Show or hide names
- 📑 Show or hide group titles
- 📍 Configurable value position
- 🏷 Configurable name position
- 🧩 Visual configuration editor
- 🌙 Fully compatible with Home Assistant themes

---

## Requirements

- Home Assistant
- Spoolman Integration
- HACS (recommended)

---

## Installation

### HACS

1. Open **HACS**
2. Add this repository as a **Custom Repository**
3. Install **Spoolman Filament Card**
4. Restart Home Assistant
5. Refresh your browser

---

## Configuration

### Minimal

```yaml
type: custom:spoolman-filament-card
```

---

### Example

```yaml
type: custom:spoolman-filament-card
title: Filament

group_by: material
group_order:
  - PLA
  - PLA+
  - TPU
  - PETG

group_icon: mdi:printer-3d-nozzle

sort_by: remaining_weight
sort_direction: asc

bar_direction: vertical

name_position: bottom
value_position: center

show_name: true
show_group_title: true

use_filament_color: true

hide_archived: true
```

---

## Options

| Option | Default | Description |
|---------|---------|-------------|
| title | Filament | Card title |
| group_by | material | `material`, `color`, `vendor`, `none` |
| group_order | [] | Custom group order |
| group_icon | mdi:printer-3d-nozzle | Group title icon (`none` to disable) |
| group_sort_by | name | Group sorting |
| group_sort_direction | asc | `asc` or `desc` |
| sort_by | remaining_weight | Spool sorting |
| sort_direction | asc | `asc` or `desc` |
| bar_direction | vertical | `vertical` or `horizontal` |
| name_position | bottom | Position of filament name |
| value_position | center | Position of remaining weight |
| show_name | true | Show filament name |
| show_group_title | true | Show group headings |
| use_filament_color | true | Color bars using filament color |
| hide_archived | true | Hide archived spools |
| max_weight | 1000 | Fallback maximum spool weight |

---

## Grouping

### Material

```yaml
group_by: material
```

Example:

- PLA
- PLA+
- TPU
- PETG

---

### Color

```yaml
group_by: color
```

Example:

- Red
- Black
- White

---

### Vendor

```yaml
group_by: vendor
```

Example:

- Bambu Lab
- Polymaker
- eSUN

---

### No grouping

```yaml
group_by: none
```

Displays all spools in one list.

---

## Custom Group Order

```yaml
group_order:
  - PLA
  - PLA+
  - TPU
  - PETG
```

Groups not listed will automatically be appended alphabetically.

---

## Sorting

Supported values:

```yaml
sort_by:
```

- remaining_weight
- filament_name
- filament_material
- filament_vendor_name
- filament_color_hex

---

## Icons

Any Home Assistant icon can be used.

Example:

```yaml
group_icon: mdi:printer-3d-nozzle
```

If you use **Custom Brand Icons**, you can also use:

```yaml
group_icon: phu:3d-filament
```

Disable the icon:

```yaml
group_icon: none
```

---

## Name Position

Vertical bars:

- top
- bottom

Horizontal bars:

- top
- bottom
- left
- right

---

## Value Position

Vertical bars:

- top
- center
- bottom

Horizontal bars:

- left
- center
- right

---

## Roadmap

- [x] Material grouping
- [x] Color grouping
- [x] Vendor grouping
- [x] Custom group ordering
- [x] Vertical bars
- [x] Horizontal bars
- [x] Visual editor
- [ ] Click to open More Info
- [ ] Localization
- [ ] Additional display modes
- [ ] Statistics card

---

## Contributing

Contributions, feature requests and bug reports are welcome!

Please use the GitHub issue tracker.

---

## License

MIT
