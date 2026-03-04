# PWA Theme Color Test

A minimal PWA for testing edge-to-edge status bar coloring on Android and iOS.

## Usage

### HTML meta tags

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#282c34">

<!-- iOS: transparent status bar so body background shows through -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### manifest.json

```json
{
  "name": "My App",
  "display": "standalone",
  "theme_color": "#282c34",
  "background_color": "#282c34"
}
```

`theme_color` is used for the splash screen before the HTML loads.
Once the page renders, the meta tag takes over.

### JavaScript — dynamic status bar color

```js
function setBrowserThemeColor(color) {
  // Remove and re-create the meta tag.
  // Chrome Android ignores setAttribute() on an existing element.
  const existing = document.querySelector('meta[name="theme-color"]');
  if (existing) existing.remove();

  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = color;
  document.head.appendChild(meta);
}

// Call on theme change
setBrowserThemeColor('#ffffff');
```

On iOS the meta tag is secondary — just change the body's `background-color`
and the transparent status bar follows automatically.

## How Status Bar Coloring Works

The goal is to make the status bar blend seamlessly with the page background.
Each platform handles this differently.

### Android (Chrome standalone PWA)

The `<meta name="theme-color">` tag controls the status bar color.

- **Initial load**: Chrome reads the meta tag value and colors the status bar.
- **Splash screen**: Uses the manifest's `theme_color` (before HTML loads).
- **Dynamic updates**: Chrome does **not** react to `setAttribute()` on an
  existing meta element. The workaround is to remove the old `<meta>` tag and
  insert a brand-new DOM node. See `setBrowserThemeColor()` in `index.html`.

### iOS (Safari standalone PWA)

The `apple-mobile-web-app-status-bar-style: black-translucent` meta tag makes
the status bar transparent. The page's `background-color` shows through,
so the bar naturally matches whatever theme is active.

- **`viewport-fit=cover`** is required so the page extends behind the status bar.
- **`env(safe-area-inset-top)`** prevents content from being hidden under the notch.
- **CAVEAT (iOS 26+)**: Safari ignores the `theme-color` meta tag entirely and
  derives the bar color from the page's `background-color` automatically. Dynamic
  JS updates to the meta tag have zero effect. However, because `black-translucent`
  makes the bar transparent, the CSS `background-color` change is all that's needed
  — the status bar will follow your body background with no extra work.

### Samsung Internet

Samsung Internet fully supports `<meta name="theme-color">` including dynamic updates.

- No known dark-mode override issue like Chrome has.
- Uses the Chromium engine but has its own UI chrome handling, so `theme-color`
  behaves as expected across both light and dark system modes.

## Known Limitations

### PWA Re-installation Required

When changes are made to the `manifest.json` (like `theme_color` or `background_color`) or PWA-related meta tags, these updates often do not automatically apply to users who have already installed the PWA. To ensure that a changed manifest or meta tag fully takes effect, the PWA must be fully uninstalled from the device and re-installed.

### Android Chrome: Dark mode forces black status bar

**When the Android device is in system dark mode, Chrome forces the status bar
to pure black (`#000000`), ignoring the `theme-color` meta tag entirely.**

This is a confirmed, long-standing Chromium bug:
- **Issue**: [chromium #40634649](https://issues.chromium.org/issues/40634649)
- **Filed**: 2019
- **Status**: Still open (as of March 2026)

There is no web-platform workaround. The `<meta name="color-scheme">` tag,
media-query variants on `theme-color`, and dynamic JavaScript updates all fail
to override Chrome's forced black in system dark mode.

**Note**: While recent versions of the Google Chrome browser may allow the `theme-color` to work for installed PWAs in dark mode, other Chromium-based browsers (like Brave) still force the black status bar.

### iOS: `apple-mobile-web-app-capable` is deprecated

The `apple-mobile-web-app-capable` meta tag is deprecated in favor of the standard
`mobile-web-app-capable`. For modern PWAs, the manifest's `"display": "standalone"`
is the recommended way to signal installability.

However, some caveats apply:
- Removing the `apple-` prefix has been reported to break **splash screen** behavior
  on some iOS versions — it may need to be kept as a fallback.
- `apple-mobile-web-app-status-bar-style` has **no standard equivalent** and still
  requires the `apple-` prefix for `black-translucent` to work.
- Using the old `apple-` tag can cause installation issues where the app opens as a
  browser tab instead of standalone.

**Recommendation**: Use the standard `mobile-web-app-capable` tag alongside a proper
`manifest.json` with `"display": "standalone"`. If splash screens break, add back the
`apple-` prefixed tag as well.

### iOS Safari 26+: theme-color meta tag ignored

Safari 26.4+ marks `theme-color` as "supported" on caniuse but does not actually
use the value anywhere. Instead, Safari reads the `background-color` directly from
the page's CSS. For standalone PWAs using `black-translucent`, this is a non-issue
since the bar is transparent and the body background shows through regardless.

### What this means in practice

| Platform          | System Light               | System Dark                |
|-------------------|----------------------------|----------------------------|
| Chrome Android    | Status bar = theme-color   | Status bar = `#000000`     |
| Safari iOS        | Transparent (body bg)      | Transparent (body bg)      |
| Samsung Internet  | Status bar = theme-color   | Status bar = theme-color   |

## Browser Support

See [caniuse: meta theme-color](https://caniuse.com/?search=meta+theme-color) for full details.

| Browser                    | Support | Notes |
|----------------------------|---------|-------|
| Chrome 145+ Android        | Partial | Does not apply the color on devices with native dark mode enabled unless it's an installed PWA or TWA |
| Safari / iOS 26.4+         | Nominal | "Supported" but does not actually use the color anywhere; `black-translucent` still works |
| Samsung Internet 29        | Full    | Fully supported |

## Files

| File            | Purpose                                      |
|-----------------|----------------------------------------------|
| `index.html`    | App UI, theme toggle, and `setBrowserThemeColor()` logic |
| `manifest.json` | PWA manifest with `theme_color` for splash screen |
| `sw.js`         | Service worker (network-first with cache fallback) |
| `icon.png`      | 512x512 app icon                             |
| `icon-192.png`  | 192x192 app icon                             |
