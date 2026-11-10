# Pixel art pipeline

The same PixelFX painter can draw static UI, characters sampled from key poses, and effects. An art recipe groups those assets under one export command. PNG and JSON export needs Node 18 or newer. Animated GIF previews also need FFmpeg on `PATH`.

## Render the field kit

```sh
npm run art -- art/field-kit.mjs --list
npm run art -- art/field-kit.mjs --frames
npm run art -- art/field-kit.mjs ui/hud scout/fire --gif --frames --out records/hazard --opts '{"theme":"hazard","helmet":"respirator","weapon":"launcher","health":24,"ammo":4}'
```

The third command exports only the named assets. Use a separate `--out` for each variant you want to keep. The default output is `records/art/field-kit`. The field kit accepts these options.

| Option | Values |
| --- | --- |
| `theme` | `field` or `hazard` |
| `helmet` | `visor` or `respirator` |
| `weapon` | `pistol` or `launcher` |
| `health` | Integer percentage from 0 to 100 |
| `ammo`, `capacity` | Integer rounds and magazine size, with `0 <= ammo <= capacity <= 999` and positive capacity |
| `label` | Button label in the pixel font, sized to fit the button |

The HUD preview shows sample values. Use the standalone `ui/panel`, `ui/vital-icon` and `ui/ammo-icon` assets to build a HUD that updates values from the game. The four button states share the same dimensions. The scout keeps a common canvas and feet pivot across all three clips. Change its loadout or theme while reusing the same motion tracks. `fx/muzzle-pistol` is the standalone PixelFX pistol effect. Time it from the fire marker and attach it to your weapon at runtime.

### Detailed character recipe

The Sentinel recipe redraws the scout pose tracks on a 112×88 canvas with separate armor plates, a radio pack, visor or respirator, and carbine or pistol. The idle, walk and fire atlases share a feet pivot at `(42, 77)` and play at 12 FPS. `field` and `hazard` both work with either loadout.

```sh
npm run art -- art/sentinel.mjs --frames
npm run art -- art/sentinel.mjs --frames --out records/sentinel-hazard --opts '{"theme":"hazard","helmet":"respirator","weapon":"pistol"}'
```

### HD cel-shaded Sentinel

Install the repository's development dependencies once, then run the cel export.

```sh
npm ci
npm run art:cel
```

Open `records/art/sentinel-cel/preview.html` from disk. Select **Idle**, **Walk**, or **Fire** to play both loadouts side by side. The export includes the Field visor and carbine, and the Hazard respirator and pistol. Each loadout has 24 idle frames, 24 walk frames and 20 fire frames at 24 FPS. The fire marker is frame 6 and the flash and smoke are baked into that clip.

Each clip exports an `atlas.png`, an `atlas.json`, and individual transparent PNGs in `frames/`. Each cell is 680×600 pixels, with the feet at `(242, 544)`. `index.json` lists the six clips, their loop flags and the number of valid atlas cells. The HTML preview reads those same atlases. Use `npm run art:cel -- --gif` to also write per-clip GIFs when FFmpeg is available. Use `npm run art:cel -- --out records/another-cel-run` for a separate output directory.

## Read the export

- `index.json` lists the assets rendered by the command and their relative paths. `--preview` also writes a playable `preview.html` next to the index.
- Each asset has `atlas.png` with straight RGBA, `atlas.json` with frame rectangles and `preview.png` with sample frames over a backdrop. A static asset is a single PNG cell. `--frames` also writes numbered transparent PNGs, and `--gif` writes an animated preview for multi-frame assets.
- `meta.pixelfx` holds the frame size, rows, columns, FPS, loop flag and pivot. Frames start at the top left and advance across each row. Play only the frame count listed in the metadata. `slice` is `[left, top, right, bottom]` in pixels, and `markers` maps event names to zero-based frame indices. The scout's `fire` marker is frame 3 at 12 FPS.

For UE5, import UI PNGs as textures and use the panel's slice margins for a box brush in UMG. Convert the pixel margins to fractions of the source width and height for the brush. For a character atlas, extract a Paper 2D sprite grid with the recorded cell size and zero spacing. Use the recorded FPS and pivot when setting up the Flipbook. Nearest filtering preserves the pixel edges. A translucent material preserves soft alpha on effects such as the muzzle flash.

## Author a recipe

A recipe is a local ES module that default-exports an array. Each asset declares a unique `category/name` ID, a `kind` (`ui`, `character` or `vfx`), a `[width, height]`, and a `draw(painter, timeInSeconds, options)` function. The painter starts at `pivot` inside the image, with `[0, 0]` at the top left by default. A custom asset defaults to one frame at 12 FPS. Set `fps`, `frames` and `loop` for clips. Optional `options` supply drawing defaults, and `--opts` supplies overrides for the current export.

```js
import { drawPanel } from "../src/art/hud.js";
import { artTheme } from "../src/art/themes.js";

export default [
  {
    id: "ui/inventory-panel",
    kind: "ui",
    size: [120, 32],
    slice: [5, 5, 5, 5],
    options: { theme: "field" },
    draw(painter, time, options) {
      drawPanel(painter, 0, 0, 120, 32, artTheme(options.theme));
    },
  },
  { id: "fx/pistol", kind: "vfx", effect: "projectiles/muzzle-pistol" },
];
```

An entry with `effect` uses the named PixelFX effect's existing render path, including simulated particles and its own timing. For a new character, use [the scout implementation](../src/art/scout.js) as a reference for palette mapping, pixel layers attached to the rig, and named pose tracks. Preview the clip before exporting and keep the pivot fixed across poses and equipment variants.

For vector art, supply `svg(timeInSeconds, options)` in place of `draw`. Return an SVG fragment such as a `<g>` with paths. Coordinates are relative to the same `pivot`, and the exporter rasterizes at `size` with antialiasing. `svg` uses the offline renderer installed by `npm ci` and shares the PNG and metadata export with pixel recipes. Convert labels in SVG assets to paths for portable exports. [The HD Sentinel recipe](../art/sentinel-cel.mjs) is a complete example.
