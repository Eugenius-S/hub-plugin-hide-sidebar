# Hide sidebar: an Agents Hub plugin

A button with a panel icon hides and restores the hub sidebar, like in Claude. The button sits in the sidebar header: on top are the button, the plugins avatar (mascot) and the ☰ menu, below is the search at full width; while the sidebar is hidden, the button sits at the left edge of the page, in the same place. The choice is remembered in this browser. The sidebar smoothly slides out and in (about 260 ms), and the page next to it takes its place; only position and opacity move, the layout is not recalculated frame by frame. With "reduce motion" set in the system, the sidebar just fades. Right after the page loads there is no animation, and neither in a browser without View Transitions. On a phone the session list is a separate screen, so there is no button.

The button label is English by default and Russian when the hub language is Russian.

## Themes with their own button

If a theme draws its own sidebar button, this plugin shows no button and does not apply the saved choice (the theme's button works the core's own fold). The plugin looks for it by markup, not by theme name: any button marked `data-sidebar-toggle`, or a button whose class contains `fold` in the search row (`.search-row`) or directly in `#app` (the Clean theme). It looks again after every change of the page, so a theme switch needs no reload; without such a button everything works as before. A theme author can mark the button with `data-sidebar-toggle`. A plugin's `hub-sidebar` request still hides the sidebar, and our button at the page edge is then the way back.

## For other plugins

A plugin that needs more room (a canvas, an editor) hides the sidebar for the time of its view with an event on `window`:

```js
// entered the view
dispatchEvent(new CustomEvent("hub-sidebar", { detail: { hide: true, by: "my-plugin" } }));
// left the view
dispatchEvent(new CustomEvent("hub-sidebar", { detail: { hide: false, by: "my-plugin" } }));
```

`by` is the plugin name. When the last one releases, the sidebar returns to what the owner chose by hand. If the owner pressed the button while the view was open, that is their choice, and it stays after leaving the view. Without this plugin the event does nothing. While the sidebar is hidden, `<html>` has the class `hs-hidden`, and a button (32×32) sits in the top left corner, so leave room for it.

## Changes

- 1.4.0: a theme with its own sidebar button (Clean) - one button instead of two; the plugin's header layout also stays out of such a theme's header.

## Install

"Settings" → "Plugins" → paste the link to this repository → "Check and install". Needs a hub with Plugin API 1.5+ (the `sidebar.header` slot).

## Tests

```
python3 -m unittest discover -s tests
node --test tests/*.test.mjs
```

Code — MIT.

Icon — [3D Fluency](https://icons8.com/icons/3d-fluency) by Icons8.
