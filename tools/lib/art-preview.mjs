export function artPreview(recipe, assets) {
  // The page opens from disk and draws directly from the exported atlases.
  const data = JSON.stringify({ recipe, assets }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PixelFX art preview</title>
<style>
  :root { color-scheme: dark; font: 16px system-ui, sans-serif; background: #101721; color: #eef4f6; }
  body { margin: 0 auto; padding: 28px clamp(14px, 4vw, 48px); max-width: 1280px; }
  header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 24px; }
  h1, h2, p { margin: 0; }
  h1 { margin: 4px 0; font-size: clamp(26px, 5vw, 42px); }
  .eyebrow { font-size: 12px; letter-spacing: .15em; color: #a6efde; }
  #controls { display: flex; flex-wrap: wrap; gap: 8px; }
  button { padding: 8px 12px; font: inherit; text-transform: capitalize; border: 1px solid #425365; border-radius: 6px; background: #192432; color: inherit; cursor: pointer; }
  button[aria-pressed="true"] { background: #a6efde; border-color: #a6efde; color: #10252b; }
  #cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; }
  article { border: 1px solid #304052; border-radius: 12px; overflow: hidden; background: #171f2a; }
  .caption { padding: 14px 16px; }
  h2 { font-size: 16px; margin-bottom: 4px; }
  .details { color: #a6b4c3; font-size: 13px; }
  canvas { display: block; width: 100%; height: auto; background: repeating-linear-gradient(0deg, transparent 0 23px, #243141 23px 24px), repeating-linear-gradient(90deg, #151e29 0 23px, #243141 23px 24px); }
  .error { color: #ffb68e; padding: 12px 16px; }
</style>
<header>
  <div><p class="eyebrow">PIXELFX / ART PREVIEW</p><h1 id="recipe"></h1></div>
  <div id="controls" aria-label="Preview controls"></div>
</header>
<main id="cards"></main>
<script>
  const { recipe, assets } = ${data};
  const controls = document.getElementById("controls");
  const cards = document.getElementById("cards");
  document.getElementById("recipe").textContent = recipe.replace(/-/g, " ");
  const actions = [...new Set(assets.map((asset) => asset.id.split("/")[1]))];
  const tabs = new Map();
  const play = document.createElement("button");
  let views = [], paused = false, time = 0, last = performance.now();

  function card(asset) {
    const article = document.createElement("article");
    const caption = document.createElement("div");
    caption.className = "caption";
    const title = document.createElement("h2");
    title.textContent = asset.name;
    const details = document.createElement("p");
    details.className = "details";
    details.textContent = [asset.id, asset.frames + " frames", asset.fps + " FPS", asset.loop ? "Loop" : "One shot"].join(" · ");
    caption.append(title, details);
    const canvas = document.createElement("canvas");
    [canvas.width, canvas.height] = asset.frameSize;
    canvas.setAttribute("aria-label", asset.name + " " + asset.id);
    article.append(caption, canvas);
    cards.append(article);
    const image = new Image();
    image.onerror = () => {
      const error = document.createElement("p");
      error.className = "error";
      error.textContent = "Could not load " + asset.atlas;
      article.append(error);
    };
    image.src = asset.atlas;
    return { asset, image, context: canvas.getContext("2d"), frame: -1 };
  }

  function select(action) {
    for (const [name, tab] of tabs) tab.setAttribute("aria-pressed", String(name === action));
    cards.replaceChildren();
    views = assets.filter((asset) => asset.id.endsWith("/" + action)).map(card);
    time = 0;
  }

  for (const action of actions) {
    const tab = document.createElement("button");
    tab.textContent = action;
    tab.onclick = () => select(action);
    controls.append(tab);
    tabs.set(action, tab);
  }
  play.textContent = "Pause";
  play.onclick = () => {
    paused = !paused;
    play.textContent = paused ? "Play" : "Pause";
  };
  controls.append(play);
  select(actions[0]);

  function tick(now) {
    if (!paused) time += Math.max(0, now - last) / 1000;
    last = now;
    for (const view of views) {
      const { asset, image, context } = view;
      if (!image.complete || !image.naturalWidth) continue;
      const phase = time % (asset.seconds + (asset.loop ? 0 : 0.65));
      const i = Math.min(asset.frames - 1, Math.floor(phase * asset.fps));
      if (view.frame === i) continue;
      view.frame = i;
      const [w, h] = asset.frameSize;
      context.clearRect(0, 0, w, h);
      context.drawImage(image, (i % asset.columns) * w, Math.floor(i / asset.columns) * h, w, h, 0, 0, w, h);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
</script>
</html>`;
}
