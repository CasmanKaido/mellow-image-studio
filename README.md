# Mellow Image Studio

A native landing page inspired by the supplied motion reference: editorial typography, screenshot cards that fan out on scroll, a working palette/frame preview, and a black section with progressive text and moving tool labels. The reference video is not embedded or shipped. Preview choices and card links open the editor with a supported background and frame selected. All artwork on the landing is HTML/CSS demonstrating the screenshot use case.

The editor lives at `/studio.html`: screen capture, image uploads, clipboard paste, cropping and restore original, background palettes, frames, spacing, corner radius, shadows and PNG export. Images stay in the browser. Optional transparent mascot stickers can be selected, resized, positioned in a corner or dragged freely, and are composited into the PNG. Reset clears the selected mascot. Mellow Lyrics stays in its own project.

Buildless site: `dist/`. Run `node --test tests/*.test.cjs`. Screen capture requires HTTPS and a user-selected source. The native scroll animation respects reduced-motion preferences. The landing and editor use responsive layouts.

## Mascot assets

Built-in image generation produced the transparent PNGs in `dist/assets/`: `mascot-mellow.png` (lilac jelly ghost, lime headphones, waving arm), `mascot-scout.png` (orange fox in a black hoodie, seated with a raised paw), and `mascot-bolt.png` (mint robot, glossy face, orange antenna, peace sign). Prompt direction: polished 3D collectible characters, front three-quarter view, full body, no text or logos, transparent alpha. The original ghost is reused from the earlier generated asset; the fox and robot were generated for this update. No generation API is called by the website.

`mascot-core.js` maps pointer coordinates through the fitted preview and keeps exported sticker bounds within the image. The main canvas includes the sticker in preview and PNG export. Export waits for its asset to finish loading. Mascots default to None; background and frame choices from the homepage can include a supported mascot through the query string.

## Studio preview

Screenshot controls precede the optional mascot section. Before upload, a clickable example is framed through the same rendering path as a user image and responds to all style controls. Export remains disabled until a user image is added. The preview canvas retains the selected export aspect ratio without an external padded frame or letterboxing; landscape is 1600 × 1200, square 1400 × 1400, and portrait 1080 × 1920. Its on-screen size is scaled to fit available space.

## Custom logos

Users can import one PNG, JPG or WebP logo/custom mascot up to 10 MB. It stays in browser memory, can be resized, positioned, dragged and given 10–100% opacity. Reset releases the imported image.
