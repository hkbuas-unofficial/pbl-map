# Map Assets & Data Format

Place your venue map image here.

## Map Image
- **Name:** `venue_map.png` (or `.svg`, `.jpg`)
- **Location:** `assets/map/venue_map.png`
- **Size:** At least 1200px wide for clarity

## Excel (.xlsx) Column Headers

Use **exactly** these headers (case-sensitive):

| Column | Description | Example |
|--------|-------------|---------|
| `booth_id` | Unique booth ID (also in QR code) | `A01` |
| `booth_name` | Display name | `Science Lab` |
| `booth_location` | Location description shown in booth detail | `2nd Floor, Room 201, near the elevator` |
| `booth_x` | Horizontal position % on map (0-100) | `45.5` |
| `booth_y` | Vertical position % on map (0-100) | `30.2` |
| `question_1` | First question text | `What is 2+2?` |
| `option_1a` | Option A for Q1 | `3` |
| `option_1b` | Option B for Q1 | `4` |
| `option_1c` | Option C for Q1 | `5` |
| `option_1d` | Option D for Q1 | `6` |
| `answer_1` | Correct answer letter: `a`, `b`, `c`, or `d` | `b` |
| `question_2` | Second question text | ... |
| `option_2a` | Option A for Q2 | ... |
| ... | Repeat pattern for questions 2-5 | ... |

**Save as:** `booth_data.xlsx` in the project root.

## Booth Coordinates
- `booth_x`: 0 = left edge, 100 = right edge of map
- `booth_y`: 0 = top edge, 100 = bottom edge of map

The grid overlay in the app helps you estimate coordinates.
