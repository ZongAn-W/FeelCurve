import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:3100";
const OUT = "D:\\_projects\\_aimp-preview\\shots";

const results = [];
const errors = [];

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRestTransform(value) {
  if (!value || value === "none") return true;
  const body = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
  const numbers = (body.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number);
  if (numbers.length === 6) {
    return (
      Math.abs(numbers[0] - 1) < 0.005 &&
      Math.abs(numbers[3] - 1) < 0.005 &&
      Math.abs(numbers[4]) < 0.5 &&
      Math.abs(numbers[5]) < 0.5
    );
  }
  if (numbers.length === 16) {
    return (
      Math.abs(numbers[0] - 1) < 0.005 &&
      Math.abs(numbers[5] - 1) < 0.005 &&
      Math.abs(numbers[10] - 1) < 0.005
    );
  }
  return false;
}

async function promptText(page) {
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

async function setSlider(page, label, value) {
  return page.evaluate(
    (ariaLabel, next) => {
      const input = document.querySelector(
        `input[type="range"][aria-label="${ariaLabel}"]`,
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
    label,
    value,
  );
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: [
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
  ],
  userDataDir: "D:\\_projects\\_aimp-preview\\edge-verify",
  defaultViewport: { width: 1440, height: 1600, deviceScaleFactor: 1 },
});

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE, [
    "clipboard-read",
    "clipboard-write",
  ]);
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  // ---------- home ----------
  const homeResponse = await page.goto(`${BASE}/`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("h1", { timeout: 30000 });
  check(
    "home 200",
    homeResponse !== null && [200, 304].includes(homeResponse.status()),
    String(homeResponse?.status()),
  );
  const hero = await page.$eval("h1", (node) => node.innerText);
  check(
    "home hero copy",
    hero.includes("看得上的动效") && hero.includes("复制成提示词"),
    hero.replace(/\n/g, " / "),
  );
  const cardLinks = await page.$$eval('a[href^="/effects/"]', (links) =>
    links.map((link) => link.getAttribute("href")),
  );
  check(
    "home effect card links",
    ["/effects/magnetic-button", "/effects/spotlight-card", "/effects/staggered-text"].every(
      (href) => cardLinks.includes(href),
    ),
    cardLinks.join(", "),
  );
  await page.screenshot({ path: `${OUT}/home-zh.png`, fullPage: true });

  // ---------- detail: prompt basics ----------
  await page.goto(`${BASE}/effects/magnetic-button`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".prompt-body", { timeout: 30000 });
  await sleep(400);
  let text = await promptText(page);
  check("prompt rendered", text.length > 1200, `${text.length} chars`);
  check("prompt has zh headings", text.includes("角色") && text.includes("验收"));
  check("prompt has default radius", text.includes("140px"));
  check("prompt has default spring", text.includes("260") && text.includes("20"));

  // ---------- slider -> prompt sync ----------
  check("radius slider found", await setSlider(page, "磁场半径", 180));
  await sleep(300);
  text = await promptText(page);
  check("radius change syncs prompt", text.includes("180px"));
  check("radius change updates field wrapper", text.includes("360px"));

  check("stiffness slider found", await setSlider(page, "弹簧刚度", 400));
  await sleep(300);
  text = await promptText(page);
  check("stiffness change syncs prompt", text.includes("400"));

  // ---------- stack switch ----------
  check("switch stack -> vanilla", await clickByText(page, "Vanilla HTML/CSS/JS"));
  await sleep(300);
  text = await promptText(page);
  check(
    "vanilla prompt files",
    text.includes("magnetic-button.js") && text.includes("magnetic-button.css"),
  );
  check(
    "vanilla prompt uses rAF spring",
    text.includes("requestAnimationFrame") && text.includes("半隐式欧拉"),
  );

  check("switch stack -> gsap", await clickByText(page, "React + GSAP 3"));
  await sleep(300);
  text = await promptText(page);
  check(
    "gsap prompt uses quickTo",
    text.includes("quickTo") && text.includes("elastic.out"),
  );

  check("switch stack -> vue", await clickByText(page, "Vue 3 + Tailwind"));
  await sleep(300);
  text = await promptText(page);
  check("vue prompt file", text.includes("MagneticButton.vue"));

  check("switch stack -> react", await clickByText(page, "React + Tailwind + Motion"));
  await sleep(300);

  // ---------- variants ----------
  const fullText = await promptText(page);
  check("variant -> compact", await clickByText(page, "精简版"));
  await sleep(300);
  const compactText = await promptText(page);
  check(
    "compact shorter than full",
    compactText.length < fullText.length * 0.6,
    `${compactText.length} vs ${fullText.length}`,
  );
  check("compact has no sections", !compactText.includes("验收"));

  check("variant -> retrofit", await clickByText(page, "改造版"));
  await sleep(300);
  const retrofitText = await promptText(page);
  check(
    "retrofit asks for existing component",
    retrofitText.includes("在这里粘贴你的组件") &&
      retrofitText.includes("布尔 prop"),
  );

  check("variant -> full", await clickByText(page, "完整版"));
  await sleep(300);

  // ---------- prompt language ----------
  check("prompt lang -> EN", await clickByText(page, "EN"));
  await sleep(300);
  text = await promptText(page);
  check(
    "english prompt",
    text.includes("## ROLE") === false &&
      text.includes("ROLE") &&
      text.includes("You are a senior frontend engineer"),
    text.slice(0, 40),
  );

  // ---------- copy ----------
  const copyOk = await clickByText(page, "Copy prompt");
  await sleep(400);
  let clipboard = "";
  try {
    clipboard = await page.evaluate(() => navigator.clipboard.readText());
  } catch (error) {
    clipboard = `READ_ERROR: ${error.message}`;
  }
  check("copy button copies prompt", copyOk && clipboard.includes("ROLE"), `${clipboard.length} chars`);
  check(
    "copied text is the full prompt",
    clipboard.includes("## ROLE") &&
      clipboard.includes("180px") &&
      clipboard.includes("ACCEPTANCE") &&
      clipboard.includes("400"),
    `${clipboard.length} chars`,
  );

  // ---------- export all variants ----------
  const downloadDir = "D:\\_projects\\_aimp-preview\\downloads";
  fs.rmSync(downloadDir, { recursive: true, force: true });
  fs.mkdirSync(downloadDir, { recursive: true });
  const cdp = await page.createCDPSession();
  await cdp.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
  });
  check("export all button", await clickByText(page, "Export all"));
  await sleep(2000);
  const downloads = fs
    .readdirSync(downloadDir)
    .filter((name) => name.endsWith(".md"));
  const exported =
    downloads.length > 0
      ? fs.readFileSync(path.join(downloadDir, downloads[0]), "utf8")
      : "";
  const enSections = (exported.match(/^## ROLE$/gm) || []).length;
  const zhSections = (exported.match(/^## 角色$/gm) || []).length;
  const headers = (exported.match(/^# magnetic-button · /gm) || []).length;
  check(
    "export all downloads 24 prompts",
    downloads.length === 1 &&
      downloads[0].endsWith("-prompts.md") &&
      headers === 24 &&
      enSections + zhSections === 16,
    `${downloads.length} file · ${headers} prompts · ${enSections + zhSections} full/retrofit headings`,
  );

  // ---------- source tab ----------
  check("open source tab", await clickByText(page, "Source"));
  await sleep(300);
  const sourceText = await page.evaluate(
    () => document.querySelector("pre")?.innerText ?? "",
  );
  check(
    "source is the real component",
    sourceText.includes("export function MagneticButton") &&
      sourceText.includes("useMotionValue"),
  );
  check("source file path shown", (await page.content()).includes("components/effects/MagneticButton.tsx"));

  // ---------- magnetic interaction ----------
  await page.goto(`${BASE}/effects/magnetic-button`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".prompt-body", { timeout: 30000 });
  await sleep(500);
  const demoButton = () =>
    page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find(
        (node) =>
          node.textContent?.includes("Take this feel") ||
          node.textContent?.includes("拿走这个手感"),
      );
      if (!button) return null;
      const rect = button.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
  const box = await demoButton();
  if (!box) throw new Error("demo button not found");
  const targetX = box.x + box.width / 2 + 60;
  const targetY = box.y + box.height / 2 - 30;
  for (let step = 1; step <= 6; step += 1) {
    await page.mouse.move(
      box.x + (box.width * step) / 6,
      box.y + (box.height * step) / 6 - 10,
    );
    await sleep(40);
  }
  await page.mouse.move(targetX, targetY);
  await sleep(250);
  const transform = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find(
      (node) =>
        node.textContent?.includes("Take this feel") ||
        node.textContent?.includes("拿走这个手感"),
    );
    return button ? window.getComputedStyle(button).transform : "missing";
  });
  check(
    "magnetic button moves under pointer",
    transform !== "none" && transform !== "matrix(1, 0, 0, 1, 0, 0)",
    transform,
  );
  await page.mouse.move(10, 10);
  await sleep(700);
  const transformBack = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find(
      (node) =>
        node.textContent?.includes("Take this feel") ||
        node.textContent?.includes("拿走这个手感"),
    );
    return button ? window.getComputedStyle(button).transform : "missing";
  });
  check(
    "button returns to rest after leave",
    /matrix\(1, 0, 0, 1, 0, 0\)|none/.test(transformBack) ||
      (/matrix\(([^)]+)\)/.exec(transformBack)?.[1]
        .split(",")
        .slice(4)
        .every((part) => Math.abs(Number(part)) < 0.5) ??
        false),
    transformBack,
  );

  // ---------- spotlight card ----------
  await page.goto(`${BASE}/effects/spotlight-card`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".prompt-body", { timeout: 30000 });
  await sleep(500);
  let spotlightPrompt = await promptText(page);
  check(
    "spotlight prompt rendered",
    spotlightPrompt.length > 1200,
    `${spotlightPrompt.length} chars`,
  );
  check("spotlight size in prompt", spotlightPrompt.includes("220px"));
  check("spotlight slider found", await setSlider(page, "Spotlight size", 300));
  await sleep(300);
  spotlightPrompt = await promptText(page);
  check("spotlight slider syncs prompt", spotlightPrompt.includes("300px"));
  check(
    "spotlight stack switch",
    await clickByText(page, "Vanilla HTML/CSS/JS"),
  );
  await sleep(300);
  check(
    "spotlight vanilla prompt",
    (await promptText(page)).includes("spotlight-card.js"),
  );
  check("spotlight source tab", await clickByText(page, "Source"));
  await sleep(300);
  const spotlightSource = await page.evaluate(
    () => document.querySelector("pre")?.innerText ?? "",
  );
  check(
    "spotlight source is real file",
    spotlightSource.includes("export function SpotlightCard") &&
      spotlightSource.includes("SpotlightCardProps"),
  );

  await page.goto(`${BASE}/effects/spotlight-card`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-demo="spotlight-card"]', { timeout: 30000 });
  await sleep(400);
  const spotBox = await page.$eval('[data-demo="spotlight-card"]', (node) => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  await page.mouse.move(0, 0);
  await sleep(120);
  const spotRestBefore = await page.$eval('[data-demo="spotlight-card"]', (node) =>
    window.getComputedStyle(node).transform,
  );
  const spotTargetX = spotBox.x + spotBox.width * 0.2;
  const spotTargetY = spotBox.y + spotBox.height * 0.25;
  for (let step = 1; step <= 4; step += 1) {
    await page.mouse.move(
      spotBox.x + (spotBox.width * step) / 5,
      spotBox.y + (spotBox.height * step) / 5,
    );
    await sleep(80);
  }
  await page.mouse.move(spotTargetX, spotTargetY);
  await sleep(500);
  const spotHover = await page.$eval('[data-demo="spotlight-card"]', (node) =>
    window.getComputedStyle(node).transform,
  );
  check(
    "spotlight tilts under pointer",
    !isRestTransform(spotHover) && spotHover !== spotRestBefore,
    spotHover,
  );
  await page.mouse.move(5, 5);
  await sleep(900);
  const spotRest = await page.$eval('[data-demo="spotlight-card"]', (node) =>
    window.getComputedStyle(node).transform,
  );
  check("spotlight returns to rest", isRestTransform(spotRest), spotRest);

  // ---------- staggered text ----------
  await page.goto(`${BASE}/effects/staggered-text`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-demo="staggered-text"]', { timeout: 30000 });
  await sleep(900);
  let staggeredPrompt = await promptText(page);
  check(
    "staggered prompt rendered",
    staggeredPrompt.length > 1200 && staggeredPrompt.includes("45ms"),
    `${staggeredPrompt.length} chars`,
  );
  check("staggered slider found", await setSlider(page, "Stagger", 120));
  await sleep(300);
  staggeredPrompt = await promptText(page);
  check("staggered slider syncs prompt", staggeredPrompt.includes("120ms"));

  const units = await page.$$eval(
    '[data-demo="staggered-text"] .staggered-unit',
    (spans) => spans.length,
  );
  const label = await page.$eval('[data-demo="staggered-text"]', (node) =>
    node.getAttribute("aria-label"),
  );
  check("staggered text splits units", units >= 8, `${units} units`);
  check(
    "staggered text has a11y label",
    Boolean(label && label.length > 6),
    label ?? "",
  );
  check("staggered replay button", await clickByText(page, "Replay"));
  await sleep(300);
  check(
    "staggered replay keeps units",
    (await page.$$('[data-demo="staggered-text"] .staggered-unit')).length > 0,
  );

  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(`${BASE}/effects/staggered-text`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-demo="staggered-text"]', { timeout: 30000 });
  await sleep(500);
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
    "reduced motion forces final state",
    reducedUnit.opacity === "1" &&
      (reducedUnit.filter === "none" || reducedUnit.filter === "") &&
      (reducedUnit.transform === "none" || reducedUnit.transform === ""),
    JSON.stringify(reducedUnit),
  );
  check(
    "reduced motion has no hydration error",
    !errors.some((error) => error.includes("418")),
    errors.slice(0, 2).join(" | "),
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);

  // ---------- english UI screenshot ----------
  await page.evaluate(() => localStorage.setItem("mp-locale", "en"));
  await page.goto(`${BASE}/effects/magnetic-button?radius=170&pull=20&stiffness=320&damping=18&scale=1.04&glow=1`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".prompt-body", { timeout: 30000 });
  await sleep(600);
  check(
    "english ui",
    (await page.$eval("body", (body) => body.innerText)).includes("Parameters"),
  );
  check(
    "url params restored",
    (await promptText(page)).includes("320"),
  );
  await page.screenshot({ path: `${OUT}/detail-en.png`, fullPage: false });

  await page.goto(`${BASE}/effects/spotlight-card`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-demo="spotlight-card"]', { timeout: 30000 });
  await sleep(700);
  await page.screenshot({ path: `${OUT}/detail-spotlight.png`, fullPage: false });

  await page.goto(`${BASE}/effects/staggered-text`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-demo="staggered-text"]', { timeout: 30000 });
  await sleep(1600);
  await page.screenshot({ path: `${OUT}/detail-staggered.png`, fullPage: false });

  // ---------- mobile ----------
  await page.evaluate(() => localStorage.setItem("mp-locale", "zh"));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 30000 });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/home-mobile.png`, fullPage: true });
  await page.goto(`${BASE}/effects/magnetic-button`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".prompt-body", { timeout: 30000 });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/detail-mobile.png`, fullPage: false });

  // ---------- summary ----------
  check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) {
  console.log("FAILED:", failed.map((item) => item.name).join(", "));
  process.exitCode = 1;
}
