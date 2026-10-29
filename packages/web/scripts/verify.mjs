import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const BASE = process.env.VERIFY_BASE ?? "http://127.0.0.1:3100";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "..", "..");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUT = path.resolve(repoRoot, "output", `verify-${stamp}`);
const DOWNLOADS = path.join(OUT, "downloads");
const PROFILE = path.join(OUT, "chrome-profile");

fs.mkdirSync(DOWNLOADS, { recursive: true });
fs.mkdirSync(PROFILE, { recursive: true });

const browserCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const executablePath = browserCandidates.find((candidate) =>
  fs.existsSync(candidate),
);
if (!executablePath) {
  throw new Error("No Chrome/Edge executable found; set CHROME_PATH");
}

const results = [];
const errors = [];

function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(checkFn, timeout = 5000, interval = 60) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await checkFn()) return true;
    await sleep(interval);
  }
  return false;
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function promptText(page) {
  await page.waitForSelector(".prompt-body", { timeout: 15000 });
  return page.evaluate(
    () => document.querySelector(".prompt-body")?.innerText ?? "",
  );
}

async function clickByText(page, text) {
  return page.evaluate((needle) => {
    const nodes = [...document.querySelectorAll("button")];
    const target = nodes.find((node) => node.textContent?.trim() === needle);
    if (!target) return false;
    target.click();
    return true;
  }, text);
}

async function setSlider(page, ariaLabel, value) {
  return page.evaluate(
    (label, next) => {
      const input = document.querySelector(
        `input[type="range"][aria-label="${label}"]`,
      );
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(input, String(next));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    },
    ariaLabel,
    value,
  );
}

async function tabTo(page, selector, maxTabs = 80) {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  });
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const found = await page.evaluate(
      (needle) => document.activeElement?.matches(needle) ?? false,
      selector,
    );
    if (found) return true;
  }
  return false;
}

async function focusOutline(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    const style = window.getComputedStyle(element);
    return {
      tag: element.tagName,
      text: element.textContent?.trim() ?? "",
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    };
  });
}

function matrixRest(transform) {
  if (!transform || transform === "none") return true;
  const body = transform.slice(
    transform.indexOf("(") + 1,
    transform.lastIndexOf(")"),
  );
  const numbers = (body.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []).map(Number);
  if (numbers.length === 6) {
    const [a, b, c, d, e, f] = numbers;
    return (
      Math.abs(a - 1) < 0.01 &&
      Math.abs(d - 1) < 0.01 &&
      Math.abs(b) < 0.01 &&
      Math.abs(c) < 0.01 &&
      Math.abs(e) < 1 &&
      Math.abs(f) < 1
    );
  }
  if (numbers.length === 16) {
    const m11 = numbers[0];
    const m12 = numbers[1];
    const m13 = numbers[2];
    const m21 = numbers[4];
    const m22 = numbers[5];
    const m23 = numbers[6];
    const m31 = numbers[8];
    const m32 = numbers[9];
    const m33 = numbers[10];
    const m41 = numbers[12];
    const m42 = numbers[13];
    return (
      Math.abs(m11 - 1) < 0.01 &&
      Math.abs(m22 - 1) < 0.01 &&
      Math.abs(m33 - 1) < 0.01 &&
      Math.abs(m12) < 0.01 &&
      Math.abs(m13) < 0.01 &&
      Math.abs(m21) < 0.01 &&
      Math.abs(m23) < 0.01 &&
      Math.abs(m31) < 0.01 &&
      Math.abs(m32) < 0.01 &&
      Math.abs(m41) < 1 &&
      Math.abs(m42) < 1
    );
  }
  return false;
}

function matrixScale(transform) {
  if (!transform || transform === "none") return 1;
  const body = transform.slice(
    transform.indexOf("(") + 1,
    transform.lastIndexOf(")"),
  );
  const numbers = (body.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []).map(Number);
  return numbers.length === 6 ? numbers[0] : numbers[0] ?? 1;
}

async function readClipboard(page) {
  try {
    return await page.evaluate(() => navigator.clipboard.readText());
  } catch (error) {
    return `READ_ERROR: ${error.message}`;
  }
}

async function waitForDownload(directory, before, timeout = 8000) {
  return waitFor(async () => {
    const files = fs
      .readdirSync(directory)
      .filter(
        (name) =>
          name.endsWith(".md") &&
          !before.includes(name) &&
          !name.endsWith(".crdownload"),
      );
    return files.length > 0;
  }, timeout);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  userDataDir: PROFILE,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
  ],
  defaultViewport: { width: 1440, height: 1200, deviceScaleFactor: 1 },
});

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE, ["clipboard-read", "clipboard-write"]);

  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) =>
    errors.push(`${page.url()} pageerror: ${error.message}`),
  );

  // Start in English so the labels used below are stable.
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("fc-locale", "en"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 15000 });

  // ---------- home structure ----------
  const navOrder = await page.$$eval("header nav a", (links) =>
    links.map((link) => link.textContent?.trim()),
  );
  check(
    "top nav shows Method before Effects",
    navOrder.join("|") === "Method|Effects",
    navOrder.join("|"),
  );
  const navType = await page.$eval("header nav a", (link) => {
    const style = window.getComputedStyle(link);
    return {
      size: style.fontSize,
      weight: style.fontWeight,
      family: style.fontFamily,
    };
  });
  check(
    "top nav uses the refined medium sans type",
    navType.size === "13.5px" &&
      navType.weight === "500" &&
      navType.family.includes("SF Pro Text"),
    JSON.stringify(navType),
  );

  const cardTags = await page.$$eval("[data-effect-card]", (cards) =>
    cards.map((card) => card.tagName),
  );
  check(
    "home cards are not one big link",
    cardTags.length === 4 && cardTags.every((tag) => tag === "ARTICLE"),
    cardTags.join(", "),
  );

  const detailLinks = await page.$$eval("[data-effect-link]", (links) =>
    links.map((link) => link.getAttribute("data-effect-link")),
  );
  check(
    "each effect has its own detail link",
    [
      "magnetic-button",
      "spotlight-card",
      "staggered-text",
      "liquid-glass-button",
    ].every((slug) => detailLinks.includes(slug)),
    detailLinks.join(", "),
  );

  const demoInsideLink = await page.$eval(
    '[data-effect-card="staggered-text"] [data-demo="staggered-text"]',
    (demo) => demo.closest("a") !== null,
  );
  check("interactive demo is outside any link", !demoInsideLink);

  // Keyboard focus reaches the explicit link with a visible outline.
  const linkFocusable = await tabTo(page, '[data-effect-link="magnetic-button"]');
  const linkOutline = linkFocusable ? await focusOutline(page) : null;
  check("detail link reachable by keyboard", linkFocusable);
  check(
    "detail link has a visible focus ring",
    Boolean(
      linkOutline &&
        linkOutline.outlineStyle !== "none" &&
        Number.parseFloat(linkOutline.outlineWidth) >= 2,
    ),
    JSON.stringify(linkOutline),
  );
  await page.keyboard.press("Enter");
  await waitFor(
    () => page.evaluate(() => location.pathname === "/effects/magnetic-button"),
    5000,
  );
  check(
    "link navigates to the detail page",
    (await page.evaluate(() => location.pathname)) ===
      "/effects/magnetic-button",
  );

  // ---------- home demo interaction does not navigate ----------
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-demo="staggered-text"]', {
    timeout: 15000,
  });
  const replayFocusable = await tabTo(
    page,
    '[data-effect-card="staggered-text"] button',
  );
  check("demo replay is keyboard reachable", replayFocusable);
  if (replayFocusable) {
    await page.keyboard.press("Enter");
    await sleep(200);
  }
  check(
    "keyboard demo interaction does not navigate",
    (await page.evaluate(() => location.pathname)) === "/",
  );

  const magneticCard = await page.$('[data-effect-card="magnetic-button"]');
  if (!magneticCard) throw new Error("magnetic home card missing");
  await magneticCard.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await sleep(250);
  const magneticBox = await magneticCard.boundingBox();
  if (!magneticBox) throw new Error("magnetic home card has no box");
  await page.mouse.move(
    magneticBox.x + magneticBox.width / 2 + 30,
    magneticBox.y + 150,
  );
  await sleep(350);
  const homeMagneticTransform = await page.$eval(
    '[data-effect-card="magnetic-button"] [data-demo="magnetic-button"] button',
    (button) => window.getComputedStyle(button).transform,
  );
  check(
    "home magnetic demo responds to pointer",
    !matrixRest(homeMagneticTransform),
    homeMagneticTransform,
  );
  await page.mouse.click(
    magneticBox.x + magneticBox.width / 2 + 30,
    magneticBox.y + 150,
  );
  await sleep(250);
  check(
    "clicking the demo does not navigate",
    (await page.evaluate(() => location.pathname)) === "/",
  );

  const homeSpotlight = await page.$(
    '[data-effect-card="spotlight-card"] [data-demo="spotlight-card"]',
  );
  if (!homeSpotlight) throw new Error("home spotlight card missing");
  await homeSpotlight.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await sleep(250);
  const homeSpotlightBox = await homeSpotlight.boundingBox();
  if (!homeSpotlightBox) throw new Error("home spotlight has no box");
  await page.mouse.move(
    homeSpotlightBox.x + homeSpotlightBox.width * 0.2,
    homeSpotlightBox.y + homeSpotlightBox.height * 0.25,
  );
  await sleep(500);
  const homeSpotlightTransform = await homeSpotlight.evaluate(
    (node) => window.getComputedStyle(node).transform,
  );
  check(
    "home spotlight demo tilts under the pointer",
    !matrixRest(homeSpotlightTransform),
    homeSpotlightTransform,
  );
  check(
    "pointer interaction on the home spotlight does not navigate",
    (await page.evaluate(() => location.pathname)) === "/",
  );

  await page.screenshot({ path: path.join(OUT, "home-desktop.png"), fullPage: true });

  // ---------- liquid glass button: swatches + squash ----------
  await page.goto(`${BASE}/effects/liquid-glass-button`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-demo="liquid-glass-button-stage"]', {
    timeout: 15000,
  });
  const glassSwatches = await page.$$eval("[data-pattern-option]", (nodes) =>
    nodes.map((node) => node.getAttribute("data-pattern-option")),
  );
  check(
    "glass stage offers four textures",
    glassSwatches.length === 4 &&
      ["medallion", "cloud", "brocade", "aurora"].every((id) =>
        glassSwatches.includes(id),
      ),
    glassSwatches.join(", "),
  );
  const glassInitial = await page.$eval(
    "[data-active-pattern]",
    (node) => node.getAttribute("data-active-pattern"),
  );
  check("glass stage starts on the medallion", glassInitial === "medallion");

  await page.click('[data-pattern-option="cloud"]');
  const glassSwitched = await waitFor(
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("[data-active-pattern]")
            ?.getAttribute("data-active-pattern") === "cloud",
      ),
    3000,
  );
  check(
    "clicking a swatch changes the surface under the glass",
    glassSwitched,
  );

  const glassPrompt = await promptText(page);
  check(
    "glass prompt keeps the translucency and thickness specs",
    glassPrompt.includes("LiquidGlassButton") &&
      glassPrompt.includes("backdrop-filter: blur(10px)") &&
      glassPrompt.includes("9px glass edge"),
    glassPrompt.slice(0, 120),
  );

  const glassButton = await page.$('[data-demo="liquid-glass-button"]');
  if (!glassButton) throw new Error("glass button missing");
  const glassBox = await glassButton.boundingBox();
  await page.mouse.move(
    glassBox.x + glassBox.width / 2,
    glassBox.y + glassBox.height / 2,
  );
  await sleep(200);
  await page.mouse.down();
  await sleep(180);
  const glassPressed = await glassButton.evaluate(
    (node) => window.getComputedStyle(node).transform,
  );
  check("glass button squashes while pressed", !matrixRest(glassPressed), glassPressed);
  await page.mouse.up();
  await page.mouse.move(4, 4);
  await sleep(900);
  const glassRest = await glassButton.evaluate(
    (node) => window.getComputedStyle(node).transform,
  );
  check("glass button springs back to rest", matrixRest(glassRest), glassRest);

  await glassButton.evaluate((node) => {
    node.focus();
    window.__glassClicks = 0;
    node.addEventListener("click", () => {
      window.__glassClicks += 1;
    });
  });
  await page.keyboard.down("Space");
  await sleep(160);
  const glassKeyboardPressed = await glassButton.evaluate(
    (node) => window.getComputedStyle(node).transform,
  );
  await page.keyboard.up("Space");
  await sleep(800);
  const glassKeyboardClicks = await page.evaluate(() => window.__glassClicks);
  check(
    "glass button squashes from the keyboard",
    !matrixRest(glassKeyboardPressed),
    glassKeyboardPressed,
  );
  check(
    "glass button keeps the native Space click",
    glassKeyboardClicks === 1,
    String(glassKeyboardClicks),
  );

  // ---------- detail: restore a full shared URL without overwriting it ----------
  const sharedSearch =
    "?radius=180&pull=20&stiffness=320&damping=18&scale=1.04&glow=0&stack=vue&variant=retrofit&lang=en&utm_source=verify#stage";
  await page.goto(`${BASE}/effects/magnetic-button${sharedSearch}`, {
    waitUntil: "domcontentloaded",
  });
  await promptText(page);
  await waitFor(
    async () =>
      (await promptText(page)).includes("180px") &&
      (await promptText(page)).includes("Vue 3 + TypeScript"),
    5000,
  );
  const restoredPrompt = await promptText(page);
  const restoredUrl = await page.evaluate(() => location.href);
  check(
    "initial shared URL is not overwritten with defaults",
    restoredUrl.includes("radius=180") &&
      restoredUrl.includes("stack=vue") &&
      restoredUrl.includes("variant=retrofit") &&
      restoredUrl.includes("lang=en") &&
      restoredUrl.includes("utm_source=verify") &&
      restoredUrl.endsWith("#stage"),
    restoredUrl,
  );
  check(
    "shared URL restores params and stack",
    restoredPrompt.includes("180px") &&
      restoredPrompt.includes("Vue 3 + TypeScript"),
    restoredPrompt.slice(0, 120),
  );
  check(
    "shared retrofit URL asks for the component",
    restoredPrompt.includes("Ask me to paste the full component before writing any code"),
  );
  const retrofitEmpty = await page.$eval(
    "[data-retrofit-source-state]",
    (node) => node.getAttribute("data-retrofit-source-state"),
  );
  check("retrofit source input starts empty", retrofitEmpty === "empty");

  // ---------- URL read validation ----------
  await page.goto(
    `${BASE}/effects/magnetic-button?radius=999&pull=nope&glow=maybe&stack=bogus&variant=bogus&lang=fr`,
    { waitUntil: "domcontentloaded" },
  );
  await promptText(page);
  await waitFor(
    async () =>
      (await promptText(page)).includes("220px") &&
      (await promptText(page)).includes("React 19"),
    5000,
  );
  const invalidPrompt = await promptText(page);
  check(
    "invalid URL values are clamped / rejected",
    invalidPrompt.includes("220px") && invalidPrompt.includes("React 19"),
    invalidPrompt.slice(0, 120),
  );
  const activeVariant = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button[aria-pressed='true']")];
    return buttons.map((button) => button.textContent?.trim()).filter(Boolean);
  });
  check(
    "invalid stack / variant fall back to defaults",
    activeVariant.some((label) => label === "React + Tailwind + Motion") &&
      activeVariant.some((label) => label === "Full"),
    activeVariant.join(" | "),
  );

  // ---------- retrofit source / prompt / share / copy ----------
  await page.goto(
    `${BASE}/effects/magnetic-button?radius=180&pull=20&stiffness=320&damping=18&scale=1.04&glow=0&stack=vue&variant=retrofit&lang=en&utm_source=verify#stage`,
    { waitUntil: "domcontentloaded" },
  );
  await promptText(page);
  const sourceMarker =
    "export function ExistingCard() { return <div>SOURCE_MARKER_123</div>; }";
  await page.click("[data-retrofit-source]");
  await page.keyboard.type(sourceMarker, { delay: 2 });
  const sourceReachedPrompt = await waitFor(
    async () => (await promptText(page)).includes("SOURCE_MARKER_123"),
    5000,
  );
  let retrofitPrompt = await promptText(page);
  check(
    "retrofit prompt includes the pasted source",
    sourceReachedPrompt && retrofitPrompt.includes(sourceMarker),
    `${retrofitPrompt.length} chars`,
  );
  const promptCodeBlocks = await page.$$eval("[data-prompt-code]", (nodes) =>
    nodes.map((node) => node.textContent ?? ""),
  );
  check(
    "pasted source is rendered as a code block",
    promptCodeBlocks.some((code) => code.includes("SOURCE_MARKER_123")),
    `${promptCodeBlocks.length} blocks`,
  );

  await clickByText(page, "React + Tailwind + Motion");
  await clickByText(page, "EN");
  await clickByText(page, "Full");
  await clickByText(page, "Retrofit");
  await sleep(250);
  const sourceAfterSwitches = await page.$eval(
    "[data-retrofit-source]",
    (node) => node.value,
  );
  check(
    "source survives stack / language / variant switches",
    sourceAfterSwitches === sourceMarker,
  );

  // UI language toggle must not remount the prompt panel or clear the source.
  await clickByText(page, "中文");
  await sleep(250);
  const sourceAfterLocale = await page.$eval(
    "[data-retrofit-source]",
    (node) => node.value,
  );
  check("source survives the UI locale toggle", sourceAfterLocale === sourceMarker);
  await clickByText(page, "EN");
  await sleep(200);

  const urlWithSource = await page.evaluate(() => location.href);
  const storageWithSource = await page.evaluate(() =>
    JSON.stringify({ ...localStorage }),
  );
  check(
    "source is never written to the URL",
    !urlWithSource.includes("SOURCE_MARKER_123"),
  );
  check(
    "source is never written to localStorage",
    !storageWithSource.includes("SOURCE_MARKER_123"),
  );

  // Sharing while the source is in page memory must not leak it into the URL.
  const sourceShareClicked = await clickByText(page, "Copy tuned link");
  await sleep(300);
  const sourceShareText = sourceShareClicked
    ? await readClipboard(page)
    : "";
  let sourceShareUrl = null;
  try {
    sourceShareUrl = new URL(sourceShareText);
  } catch {
    sourceShareUrl = null;
  }
  check(
    "share URL excludes the pasted source and keeps unrelated params/hash",
    Boolean(
      sourceShareUrl &&
        !sourceShareText.includes("SOURCE_MARKER_123") &&
        sourceShareUrl.searchParams.get("utm_source") === "verify" &&
        sourceShareUrl.hash === "#stage" &&
        sourceShareUrl.searchParams.get("stack") === "react" &&
        sourceShareUrl.searchParams.get("variant") === "retrofit" &&
        sourceShareUrl.searchParams.get("lang") === "en",
    ),
    sourceShareText.slice(0, 180),
  );

  // Export all must not contain the pasted page-memory source.
  const cdp = await page.createCDPSession();
  await cdp.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: DOWNLOADS,
  });
  const downloadsBefore = fs.readdirSync(DOWNLOADS);
  const exportClicked = await clickByText(page, "Export all");
  const downloadReady = exportClicked
    ? await waitForDownload(DOWNLOADS, downloadsBefore)
    : false;
  let exported = "";
  if (downloadReady) {
    const file = fs
      .readdirSync(DOWNLOADS)
      .find((name) => name.endsWith(".md"));
    if (file) exported = fs.readFileSync(path.join(DOWNLOADS, file), "utf8");
  }
  check(
    "export all downloads a markdown file",
    downloadReady,
    `${exported.length} chars`,
  );
  check(
    "batch export never contains the pasted source",
    downloadReady && !exported.includes("SOURCE_MARKER_123"),
  );
  check(
    "batch export still contains 24 prompts",
    (exported.match(/^# magnetic-button · /gm) ?? []).length === 24,
  );

  // Copy success, then invalidate on a parameter change.
  await page.goto(`${BASE}/effects/magnetic-button`, {
    waitUntil: "domcontentloaded",
  });
  await promptText(page);
  const copyButton = await page.$("[data-copy-status]");
  if (!copyButton) throw new Error("copy button missing");
  await copyButton.click();
  const copied = await waitFor(
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("[data-copy-status]")
            ?.getAttribute("data-copy-status") === "copied",
      ),
    4000,
  );
  const clipboardText = copied ? await readClipboard(page) : "";
  check(
    "copy success is reported only after the clipboard write",
    copied && clipboardText.includes("ROLE") && clipboardText.includes("140px"),
    `${clipboardText.length} chars`,
  );
  check(
    "copy button shows the copied label",
    (await bodyText(page)).includes("Copied"),
  );

  check("radius slider found", await setSlider(page, "Field radius", 170));
  const copyReset = await waitFor(
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("[data-copy-status]")
            ?.getAttribute("data-copy-status") === "idle",
      ),
    3000,
  );
  const promptAfterSlider = await promptText(page);
  const urlAfterSlider = await page.evaluate(() => location.href);
  check(
    "slider updates prompt and URL",
    promptAfterSlider.includes("170px") && urlAfterSlider.includes("radius=170"),
  );
  check(
    "copied state is cleared immediately when the prompt changes",
    copyReset,
  );

  // Share the current, complete selection (including stack / variant / lang).
  await clickByText(page, "Vue 3 + Tailwind");
  await clickByText(page, "Retrofit");
  await sleep(250);
  const sharedClicked = await clickByText(page, "Copy tuned link");
  await sleep(300);
  const shareText = sharedClicked ? await readClipboard(page) : "";
  let shareUrl = null;
  try {
    shareUrl = new URL(shareText);
  } catch {
    shareUrl = null;
  }
  check(
    "share copies a valid URL with all prompt choices",
    Boolean(
      shareUrl &&
        shareUrl.searchParams.get("radius") === "170" &&
        shareUrl.searchParams.get("stack") === "vue" &&
        shareUrl.searchParams.get("variant") === "retrofit" &&
        shareUrl.searchParams.get("lang") === "en",
    ),
    shareText.slice(0, 160),
  );

  // A fresh page opening that shared link must reproduce the same state.
  const sharedPage = await browser.newPage();
  await sharedPage.goto(shareText || `${BASE}/effects/magnetic-button`, {
    waitUntil: "domcontentloaded",
  });
  await promptText(sharedPage);
  await waitFor(
    async () => {
      const text = await promptText(sharedPage);
      return text.includes("170px") && text.includes("Vue 3 + TypeScript");
    },
    5000,
  );
  const sharedPrompt = await promptText(sharedPage);
  const sharedState = await sharedPage.evaluate(() => ({
    path: location.pathname,
    search: location.search,
    buttons: [...document.querySelectorAll("button[aria-pressed='true']")].map(
      (button) => button.textContent?.trim(),
    ),
  }));
  check(
    "shared link reproduces the prompt selection",
    sharedPrompt.includes("170px") &&
      sharedPrompt.includes("Vue 3 + TypeScript") &&
      sharedPrompt.includes("Ask me to paste the full component"),
    `${sharedPrompt.length} chars`,
  );
  check(
    "shared link reproduces the selected buttons",
    sharedState.buttons.includes("Vue 3 + Tailwind") &&
      sharedState.buttons.includes("Retrofit") &&
      sharedState.buttons.includes("en"),
    JSON.stringify(sharedState.buttons),
  );
  await sharedPage.close();

  // Copy failure must not claim success, and must show actionable feedback.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
    document.execCommand = () => false;
  });
  await page.click("[data-copy-status]");
  const copyFailed = await waitFor(
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("[data-copy-status]")
            ?.getAttribute("data-copy-status") === "failed",
      ),
    4000,
  );
  check(
    "clipboard failure is reported instead of showing Copied",
    copyFailed && (await bodyText(page)).includes("Copy failed"),
  );

  // Reload to restore the real clipboard before testing reset + refresh.
  await page.reload({ waitUntil: "domcontentloaded" });
  await promptText(page);
  const resetClicked = await clickByText(page, "Reset");
  await sleep(350);
  const resetPrompt = await promptText(page);
  const resetUrl = await page.evaluate(() => location.href);
  check(
    "reset writes default params back to the URL",
    resetClicked &&
      resetPrompt.includes("140px") &&
      resetUrl.includes("radius=140") &&
      resetUrl.includes("stack=vue") &&
      resetUrl.includes("variant=retrofit"),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  const refreshedPrompt = await promptText(page);
  const refreshedUrl = await page.evaluate(() => location.href);
  check(
    "refresh after reset is consistent",
    refreshedPrompt.includes("140px") &&
      refreshedUrl.includes("radius=140") &&
      refreshedUrl.includes("stack=vue") &&
      refreshedUrl.includes("variant=retrofit"),
  );

  // Source tab reads the real file path from the spec.
  const sourceClicked = await clickByText(page, "Source");
  await sleep(250);
  const sourcePanel = await page.evaluate(() => {
    const pre = document.querySelector(".prompt-scroll pre");
    return {
      text: document.body.innerText,
      code: pre?.textContent ?? "",
    };
  });
  check(
    "source tab shows the spec path and real component",
    sourceClicked &&
      sourcePanel.text.includes("components/effects/MagneticButton.tsx") &&
      sourcePanel.code.includes("export function MagneticButton"),
  );

  const detailHeadingType = await page.evaluate(() => {
    const heading = document.querySelector("main h1");
    const style = window.getComputedStyle(heading);
    return { family: style.fontFamily, weight: style.fontWeight };
  });
  check(
    "detail heading uses the display face",
    detailHeadingType.family.includes("displayFont"),
    JSON.stringify(detailHeadingType),
  );

  // Keyboard focus on a detail control.
  const shareFocusable = await tabTo(page, "button[aria-live='polite']");
  const shareOutline = shareFocusable ? await focusOutline(page) : null;
  check(
    "detail controls are keyboard focusable with a visible ring",
    Boolean(
      shareOutline &&
        shareOutline.outlineStyle !== "none" &&
        Number.parseFloat(shareOutline.outlineWidth) >= 2,
    ),
    JSON.stringify(shareOutline),
  );

  await page.goto(
    `${BASE}/effects/magnetic-button?radius=180&stack=vue&variant=retrofit&lang=en`,
    { waitUntil: "domcontentloaded" },
  );
  await promptText(page);
  await page.screenshot({
    path: path.join(OUT, "detail-desktop.png"),
    fullPage: true,
  });

  // ---------- reduced motion ----------
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);

  await page.goto(`${BASE}/effects/magnetic-button`, {
    waitUntil: "domcontentloaded",
  });
  await promptText(page);
  const reducedButton = await page.$('[data-demo="magnetic-button"] button');
  if (!reducedButton) throw new Error("reduced magnetic button missing");
  const reducedBox = await reducedButton.boundingBox();
  if (!reducedBox) throw new Error("reduced magnetic button has no box");
  await page.mouse.move(
    reducedBox.x + reducedBox.width / 2 + 60,
    reducedBox.y + reducedBox.height / 2,
  );
  await sleep(450);
  const reducedMagneticTransform = await page.$eval(
    '[data-demo="magnetic-button"] button',
    (button) => window.getComputedStyle(button).transform,
  );
  check(
    "reduced motion disables magnetic pull and scale",
    matrixRest(reducedMagneticTransform),
    reducedMagneticTransform,
  );

  await page.goto(`${BASE}/effects/spotlight-card`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("[data-spotlight-glow]", { timeout: 15000 });
  const reducedGlowVisible = await waitFor(
    () =>
      page.evaluate(
        () =>
          window.getComputedStyle(
            document.querySelector("[data-spotlight-glow]"),
          ).opacity === "1",
      ),
    4000,
  );
  const spotlightCard = await page.$("[data-demo='spotlight-card']");
  if (!spotlightCard) throw new Error("spotlight card missing");
  const spotlightBox = await spotlightCard.boundingBox();
  if (!spotlightBox) throw new Error("spotlight card has no box");
  await page.mouse.move(
    spotlightBox.x + spotlightBox.width * 0.15,
    spotlightBox.y + spotlightBox.height * 0.2,
  );
  await sleep(450);
  const reducedSpotlight = await page.evaluate(() => {
    const card = document.querySelector("[data-demo='spotlight-card']");
    const glow = document.querySelector("[data-spotlight-glow]");
    const border = document.querySelector("[data-spotlight-border]");
    return {
      transform: window.getComputedStyle(card).transform,
      glowOpacity: window.getComputedStyle(glow).opacity,
      borderPresent: Boolean(border),
      borderBackground: border
        ? window.getComputedStyle(border).backgroundImage
        : "",
    };
  });
  check(
    "reduced spotlight has no tilt or scale",
    matrixRest(reducedSpotlight.transform),
    reducedSpotlight.transform,
  );
  check(
    "reduced spotlight keeps a static glow and border highlight",
    reducedGlowVisible &&
      reducedSpotlight.glowOpacity === "1" &&
      reducedSpotlight.borderPresent &&
      reducedSpotlight.borderBackground.includes("radial-gradient"),
  );
  await page.screenshot({
    path: path.join(OUT, "reduced-spotlight.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/effects/staggered-text`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-demo="staggered-text"] .staggered-unit', {
    timeout: 15000,
  });
  await sleep(350);
  const reducedUnit = await page.$eval(
    '[data-demo="staggered-text"] .staggered-unit',
    (node) => {
      const style = window.getComputedStyle(node);
      return {
        opacity: style.opacity,
        filter: style.filter,
        transform: style.transform,
      };
    },
  );
  check(
    "reduced staggered text renders its final state",
    reducedUnit.opacity === "1" &&
      (reducedUnit.filter === "none" || reducedUnit.filter === "") &&
      (reducedUnit.transform === "none" || reducedUnit.transform === ""),
    JSON.stringify(reducedUnit),
  );

  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);

  // ---------- mobile: touch scroll, tap safety, layout ----------
  const mobile = await browser.newPage();
  mobile.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  mobile.on("pageerror", (error) =>
    errors.push(`${mobile.url()} pageerror: ${error.message}`),
  );
  await mobile.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await mobile.waitForSelector('[data-effect-card="magnetic-button"]', {
    timeout: 15000,
  });

  const touchField = await mobile.$('[data-demo="magnetic-button"]');
  if (!touchField) throw new Error("mobile magnetic demo missing");
  await touchField.evaluate((node) =>
    node.scrollIntoView({ block: "start", behavior: "instant" }),
  );
  await sleep(300);
  const touchBox = await touchField.boundingBox();
  if (!touchBox) throw new Error("mobile magnetic demo has no box");
  const touchX = touchBox.x + touchBox.width / 2;
  const touchY = Math.min(touchBox.y + touchBox.height / 2, 844 - 80);
  const touchCdp = await mobile.createCDPSession();

  // Touch press feedback must still move the button down to ~0.98.
  await touchCdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: touchX, y: touchY, id: 3 }],
  });
  await sleep(180);
  const pressedTransform = await mobile.$eval(
    '[data-demo="magnetic-button"] button',
    (button) => window.getComputedStyle(button).transform,
  );
  await touchCdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await sleep(500);
  const releasedTransform = await mobile.$eval(
    '[data-demo="magnetic-button"] button',
    (button) => window.getComputedStyle(button).transform,
  );
  check(
    "touch press still gives the 0.98 press feedback",
    matrixScale(pressedTransform) < 0.995 &&
      matrixScale(pressedTransform) > 0.9 &&
      Math.abs(matrixScale(releasedTransform) - 1) < 0.01,
    `${pressedTransform} → ${releasedTransform}`,
  );

  const scrollBefore = await mobile.evaluate(() => window.scrollY);
  await touchCdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: touchX, y: touchY, id: 1 }],
  });
  for (let step = 1; step <= 10; step += 1) {
    await touchCdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: touchX, y: touchY - (260 * step) / 10, id: 1 }],
    });
    await sleep(20);
  }
  await touchCdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await sleep(500);
  const scrollAfter = await mobile.evaluate(() => window.scrollY);
  check(
    "touch scroll starting inside the magnetic demo still scrolls the page",
    scrollAfter > scrollBefore + 20,
    `${scrollBefore} → ${scrollAfter}`,
  );
  const touchAction = await mobile.$eval(
    '[data-demo="magnetic-button"]',
    (node) => window.getComputedStyle(node).touchAction,
  );
  check(
    "magnetic demo does not block touch panning",
    touchAction !== "none",
    touchAction,
  );

  const mobileUrlBeforeTap = await mobile.evaluate(() => location.href);
  const mobileButton = await mobile.$('[data-demo="magnetic-button"] button');
  if (mobileButton) await mobileButton.tap();
  await sleep(300);
  check(
    "tapping the mobile demo does not navigate",
    (await mobile.evaluate(() => location.href)) === mobileUrlBeforeTap,
  );

  const mobileReplay = await mobile.$(
    '[data-effect-card="staggered-text"] button',
  );
  if (!mobileReplay) throw new Error("mobile replay button missing");
  await mobileReplay.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await mobileReplay.tap();
  await sleep(300);
  check(
    "tapping mobile replay does not navigate",
    (await mobile.evaluate(() => location.href)) === mobileUrlBeforeTap,
  );
  await mobile.screenshot({
    path: path.join(OUT, "home-mobile.png"),
    fullPage: true,
  });

  await mobile.goto(`${BASE}/effects/magnetic-button`, {
    waitUntil: "domcontentloaded",
  });
  await promptText(mobile);
  await mobile.screenshot({
    path: path.join(OUT, "detail-mobile.png"),
    fullPage: false,
  });

  const mobileHints = await mobile.evaluate(() => {
    const pointer = document.querySelector(".pointer-only");
    const touch = document.querySelector(".touch-only");
    return {
      pointer: pointer ? window.getComputedStyle(pointer).display : null,
      touch: touch ? window.getComputedStyle(touch).display : null,
    };
  });
  check(
    "mobile detail shows the touch hint instead of the pointer hint",
    mobileHints.pointer === "none" && mobileHints.touch !== "none",
    JSON.stringify(mobileHints),
  );

  // Touch scroll starting on the detail demo.
  const detailDemo = await mobile.$('[data-demo="magnetic-button"]');
  if (detailDemo) {
    await detailDemo.evaluate((node) =>
      node.scrollIntoView({ block: "start", behavior: "instant" }),
    );
    await sleep(250);
    const detailBox = await detailDemo.boundingBox();
    if (detailBox) {
      const x = detailBox.x + detailBox.width / 2;
      const y = Math.min(detailBox.y + detailBox.height / 2, 844 - 80);
      const before = await mobile.evaluate(() => window.scrollY);
      await touchCdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y, id: 2 }],
      });
      for (let step = 1; step <= 8; step += 1) {
        await touchCdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y - (220 * step) / 8, id: 2 }],
        });
        await sleep(20);
      }
      await touchCdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await sleep(450);
      const after = await mobile.evaluate(() => window.scrollY);
      check(
        "detail page touch scroll works from the demo area",
        after > before + 20,
        `${before} → ${after}`,
      );
    }
  }

  await mobile.close();

  check(
    "no console or page errors",
    errors.length === 0,
    errors.slice(0, 3).join(" | "),
  );
  console.log(`\nScreenshots / downloads: ${OUT}`);
} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((item) => item.name).join(", "));
  process.exitCode = 1;
}
