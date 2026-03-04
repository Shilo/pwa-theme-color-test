---
name: pwa-theme-color
description: >
  Add or fix status bar / theme-color support for web apps and PWAs. Use this
  skill whenever the user mentions theme-color, status bar color, PWA status bar,
  browser chrome color, or wants the status bar to match their app's background.
  Also use when adding PWA support and the project has a manifest.json or the user
  wants to install the app to a home screen. Use this even if the user just says
  "the status bar doesn't match" or "fix the bar color on mobile".
---

# PWA Theme Color — Status Bar Coloring

Make the mobile status bar blend seamlessly with a web app's background, on
Android (Chrome, Samsung Internet) and iOS (Safari). Supports both static
colors and dynamic theme switching.

## Phase 1: Audit the Project

Before touching any code, understand how the project handles theming today.

### 1. Check for existing theme-color setup

Search for these in the project:
- `<meta name="theme-color"` in HTML
- `theme_color` in manifest.json
- `apple-mobile-web-app-status-bar-style` in HTML
- Any JavaScript that sets `theme-color` dynamically

### 2. Identify the theming mechanism

Look for how the project manages its color scheme. Common patterns:

- **CSS custom properties** — `:root { --bg-color: #fff }` with overrides via class toggle or `[data-theme]` attribute
- **Class toggle** — `body.dark-theme` / `body.light-theme`
- **`prefers-color-scheme` media query** — `@media (prefers-color-scheme: dark)`
- **Theme provider / state** — a JS/framework store that drives colors
- **None** — single color scheme, no dynamic theming

### 3. Identify the background color(s)

Find the color(s) that should become the status bar color. This is typically the
`background-color` on `html` or `body`. If the project has multiple themes, note
all variants (e.g., `#ffffff` for light, `#282c34` for dark).

### 4. When in doubt, ask

If you cannot confidently determine the background color(s) or how theming works,
use `AskUserQuestion` to confirm. Do not guess.

---

## Phase 2: Static Setup

Apply these regardless of whether the project has dynamic theming.

### HTML meta tags

Add these to `<head>`, before any scripts:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="THE_BG_COLOR">
```

Replace `THE_BG_COLOR` with the project's primary background color.

### iOS standalone PWA meta tags

```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

`black-translucent` makes the status bar transparent on iOS so the page's
`background-color` shows through. This is the most reliable way to match the
status bar to any background color on iOS.

`viewport-fit=cover` (in the viewport meta tag above) is required for content
to extend behind the status bar.

### manifest.json

Ensure the manifest includes `theme_color` and `background_color`:

```json
{
  "theme_color": "THE_BG_COLOR",
  "background_color": "THE_BG_COLOR"
}
```

`theme_color` controls the splash screen status bar color before the HTML loads.
`background_color` controls the splash screen background. Set both to the same
primary background color.

### CSS

Ensure `html` and `body` both have the background-color set. This guarantees
overscroll areas match and iOS's transparent status bar reads the right color:

```css
html, body {
  background-color: THE_BG_COLOR;
}
```

Add safe-area padding to the main content container so content doesn't hide
behind the status bar notch or home indicator:

```css
.container {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

---

## Phase 3: Dynamic Support

**Only apply this phase if the project has dynamic theming** (multiple color
schemes, a toggle, or runtime theme changes). If the project uses a single
static color, skip to Phase 4.

### The `setBrowserThemeColor()` pattern

Chrome on Android does not reliably update the status bar when you call
`setAttribute('content', newColor)` on an existing `<meta name="theme-color">`
element. The workaround is to remove the old meta tag and create a new one:

```js
function setBrowserThemeColor(color) {
  const existing = document.querySelector('meta[name="theme-color"]');
  if (existing) existing.remove();

  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = color;
  document.head.appendChild(meta);
}
```

### Where to call it

Find the place in the project where the background color changes and call
`setBrowserThemeColor(newColor)` there. This is framework-agnostic — look for
the moment the theme actually switches:

- **Class toggle** — right after `body.classList.toggle('dark-theme')`
- **CSS variable update** — right after `document.documentElement.style.setProperty('--bg', color)`
- **State change** — in the callback/effect that runs when the theme state updates
- **Media query listener** — in a `matchMedia('(prefers-color-scheme: dark)')` change handler

The key insight: on iOS, `black-translucent` makes the status bar transparent,
so changing the body's `background-color` is enough. The meta tag update via
`setBrowserThemeColor()` is primarily needed for Android Chrome and Samsung
Internet, but calling it everywhere is harmless and ensures cross-platform
consistency.

---

## Phase 4: Platform Caveats

Document these as code comments near the theme-color meta tag or the
`setBrowserThemeColor()` function so future maintainers understand the
constraints.

### Android Chrome: Dark mode forces black status bar

When the device is in system dark mode, Chrome forcibly overrides the
theme-color to pure black (`#000000`), ignoring the meta tag.

- **Chromium bug**: https://issues.chromium.org/issues/40634649
- **Filed**: 2019, still open
- **No web-platform workaround exists**

`<meta name="color-scheme">`, media-query variants, and dynamic JS updates all
fail to override Chrome's forced black in system dark mode.

### iOS Safari 26+: theme-color meta tag ignored

Safari 26.4+ does not use the `theme-color` meta tag value. It derives the bar
color from the page's `background-color` automatically. For standalone PWAs
using `black-translucent`, this is a non-issue because the bar is already
transparent and the body background shows through.

### iOS: `apple-mobile-web-app-capable` deprecation

`apple-mobile-web-app-capable` is deprecated in favor of the standard
`mobile-web-app-capable`. Use the standard tag and rely on the manifest's
`"display": "standalone"` for installation. However:

- Removing the `apple-` prefix may break splash screens on some iOS versions.
- `apple-mobile-web-app-status-bar-style` has no standard equivalent and still
  requires the `apple-` prefix for `black-translucent`.

If splash screens break, add the `apple-` prefixed capable tag back as a
fallback alongside the standard one.

### Samsung Internet

Fully supports `<meta name="theme-color">` including dynamic updates. No known
dark-mode override issue. Despite using the Chromium engine, it has its own UI
chrome handling.

### Browser support summary

Reference: https://caniuse.com/?search=meta+theme-color

| Platform         | System Light             | System Dark              |
|------------------|--------------------------|--------------------------|
| Chrome Android   | Status bar = theme-color | Status bar = `#000000`   |
| Safari iOS       | Transparent (body bg)    | Transparent (body bg)    |
| Samsung Internet | Status bar = theme-color | Status bar = theme-color |

---

## Verification Checklist

After implementation, confirm:

- [ ] Meta tags are in `<head>` before any `<script>` tags
- [ ] `viewport` meta includes `viewport-fit=cover`
- [ ] `<meta name="theme-color">` value matches the primary background color
- [ ] manifest.json has `theme_color` and `background_color` set to the primary background
- [ ] `html` and `body` both have `background-color` set in CSS
- [ ] Main content container uses `env(safe-area-inset-*)` padding
- [ ] If dynamic theming: `setBrowserThemeColor()` is called on every theme change
- [ ] If dynamic theming: body `background-color` also updates (needed for iOS)
- [ ] Code comments document the Android dark mode Chromium bug and iOS 26+ caveat
