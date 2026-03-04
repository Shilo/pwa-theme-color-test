# Design: pwa-theme-color skill

## Goal

A Claude Code skill that teaches the AI how to add or fix status bar /
theme-color support in any web app or PWA, regardless of how the project's
theming is set up.

## Decisions

- **Scope**: Web / PWA only. No native wrappers (Capacitor, Cordova, Electron).
- **Frameworks**: Framework-agnostic. Vanilla JS/HTML guidance; the AI adapts to the project's framework on its own.
- **Detection**: Full discovery. The skill walks the AI through auditing the project first. If unsure, the AI asks the user via `AskUserQuestion`.
- **Structure**: Single flat `SKILL.md`, no bundled resources. ~230 lines.

## Skill Phases

1. **Audit** — Find existing theme-color setup, identify theming mechanism, determine background color(s). Ask user if unsure.
2. **Static setup** — Meta tags, manifest.json, CSS (background-color on html/body, safe-area padding).
3. **Dynamic support** (conditional) — `setBrowserThemeColor()` remove-and-recreate pattern, wired into wherever the project's theme changes.
4. **Platform caveats** — Android dark mode Chromium bug, iOS 26+ meta tag ignored, apple-mobile-web-app-capable deprecation, Samsung Internet full support.
5. **Verification checklist** — Confirms everything is in place.

## Key Technical Details

Derived from the pwa-theme-color-test reference project:

- Chrome Android ignores `setAttribute()` on existing meta elements in standalone mode; must remove and re-create the DOM node
- Android system dark mode forces black status bar (Chromium bug #40634649, open since 2019)
- iOS `black-translucent` makes bar transparent; body background shows through
- iOS 26+ ignores theme-color meta tag entirely; reads background-color from CSS
- Samsung Internet fully supports dynamic theme-color updates

## Triggering

The skill should trigger on: theme-color, status bar color, PWA status bar,
browser chrome color, matching status bar to background, adding PWA support with
manifest.json, "the bar doesn't match", or any mention of mobile status bar
coloring.
