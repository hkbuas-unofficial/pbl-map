# Map Assets

Place your venue map image here.

## Recommended File
- **Name:** `venue_map.png` (or `.svg`, `.jpg`)
- **Location:** `assets/map/venue_map.png`
- **Size:** At least 1200px wide for clarity

## After Uploading
Update `src/screens/MapScreen.js`:

Replace the placeholder map View with:
```jsx
<Image
  source={require('../../assets/map/venue_map.png')}
  style={styles.mapImage}
  resizeMode="contain"
/>
```

And add to styles:
```js
mapImage: {
  width: '100%',
  height: '100%',
},
```

## Booth Coordinates
Booth positions are set as percentages (0-100) in your xlsx file:
- `booth_x`: Horizontal position (0 = left, 100 = right)
- `booth_y`: Vertical position (0 = top, 100 = bottom)

The grid overlay in the app helps you estimate coordinates.
