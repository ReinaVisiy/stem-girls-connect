import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
const base = process.env.UI_BASE_URL || "http://127.0.0.1:4182";
const artifacts = resolve(
  process.env.UI_ARTIFACT_DIR || "../../outputs/girlhood-redesign",
);
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const notes = [
  "Safe.",
  "Free to dream.",
  "Room to be myself.",
  "Someone who believed in me.",
  "A childhood full of questions.",
  "Time to play.",
].map((text, i) => ({
  public_reference: "local-fixture-" + i,
  public_category: ["girl", "young_woman", "woman", "ally"][i % 4],
  language: "en",
  public_girlhood_response: text,
  public_future_response: i === 0 ? "Anything she imagines." : null,
  public_support_response:
    i === 0 ? "Someone who listens. " + "A longer memory. ".repeat(90) : null,
  safe_display_name: "Anonymous",
  safe_country: null,
  safe_city: null,
  featured: true,
  created_at: "2026-10-09",
}));
await page.route("**/api/girlhood/wall?*", (route) =>
  route.fulfill({
    json: { responses: notes, hasMore: false, nextCursor: null },
  }),
);
await page.route('**/api/girlhood/note?*', route => route.fulfill({json:{response:notes[0]}}));
let state = "open";
await page.route("**/api/girlhood/status", (route) =>
  route.fulfill({ json: { state } }),
);
const overflow = async () =>
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "horizontal overflow",
  );
const go = async (path) => {
  await page.goto(base + "/programs/girlhood" + path);
  await page.locator(".girlhood-shell").waitFor();
};
try {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, name] of [
      ["", "home"],
      ["/share-your-voice", "writing"],
      ["/wall", "wall"],
    ]) {
      await go(path);
      if (name === "writing") await page.locator("#note-0").waitFor();
      if (name === "wall") {
        await page.locator(".girlhood-note-preview").first().waitFor();
        const columns = await page
          .locator(".girlhood-notes-grid")
          .evaluate(
            (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
          );
        assert.equal(columns, width < 768 ? 3 : 4);
        await page.locator(".girlhood-note-preview").first().click();
        await page.getByRole("dialog").locator("section p").last().waitFor();
        assert.ok(await page.getByRole("dialog").isVisible());
        assert.equal(
          await page
            .getByRole("dialog")
            .locator("section p")
            .last()
            .textContent(),
          notes[0].public_support_response,
        );
        await page.screenshot({
          path: resolve(artifacts, "expanded-" + width + ".png"),
          fullPage: true,
        });
        await page.keyboard.press("Escape");
        assert.ok(
          await page
            .locator(".girlhood-note-preview")
            .first()
            .evaluate((el) => el === document.activeElement),
        );
      }
      await overflow();
      await page.screenshot({
        path: resolve(artifacts, name + "-" + width + ".png"),
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/share-your-voice");
  assert.equal(await page.getByRole("progressbar").count(), 0);
  assert.ok(await page.getByRole("spinbutton").isVisible());
  await page.locator("#note-0").fill("Safe.");
  await page.locator("#note-1").fill("Anything.");
  assert.equal(await page.locator("#note-0").inputValue(), "Safe.");
  await page
    .getByRole("button", { name: "Share my words", exact: false })
    .click();
  await page.getByRole("spinbutton").fill("12");
  assert.ok(
    (await page
      .getByText("Your response will not be displayed publicly", {
        exact: false,
      })
      .count()) || (await page.locator(".girlhood-private-note").isVisible()),
  );
  assert.equal(await page.locator("input[type=checkbox]:checked").count(), 0);
  assert.equal(
    await page
      .getByLabel("STEM Girls Connect may publish", { exact: false })
      .count(),
    0,
  );
  await page.getByRole("spinbutton").fill("17");
  await page
    .locator(".girlhood-before-content > .girlhood-choice")
    .first()
    .locator("input")
    .check();
  await page.locator(".girlhood-extra-choices summary").click();
  await page
    .getByLabel("Your name or nickname (optional)", { exact: true })
    .fill("Local test");
  await page
    .getByLabel("Where are you writing from? (optional)", { exact: true })
    .fill("Test place");
  assert.equal(
    await page.getByLabel("Show this location with my note").isChecked(),
    false,
  );
  await page.getByLabel("Show this location with my note").check();
  await page.getByRole("spinbutton").fill("12");
  await page.getByRole("spinbutton").fill("17");
  assert.equal(
    await page
      .getByLabel("Your name or nickname (optional)", { exact: true })
      .inputValue(),
    "",
  );
  assert.equal(
    await page
      .getByLabel("Where are you writing from? (optional)", { exact: true })
      .inputValue(),
    "",
  );
  for (const checkbox of await page.locator("input[aria-required=true]").all())
    await checkbox.check();
  await page.locator("#note-0").fill("x".repeat(2001));
  await page
    .getByRole("button", { name: "Share my words", exact: false })
    .click();
  await page.getByRole("alert").filter({ hasText: "2,000" }).waitFor();
  assert.equal(
    await page.locator("#note-0").inputValue(),
    "x".repeat(2001),
    "no silent truncation",
  );
  await page.locator("#note-0").fill("Safe.");
  state = "closed";
  await page.evaluate(() => dispatchEvent(new Event("focus")));
  await page.waitForFunction(
    () => document.querySelector(".girlhood-send button").disabled,
  );
  await page
    .getByRole("button", { name: "Share my words", exact: false })
    .isDisabled()
    .then((v) => assert.ok(v));
  assert.equal(await page.locator("#note-0").inputValue(), "Safe.");
  state = "open";
  await page.evaluate(() => dispatchEvent(new Event("focus")));
  await page.waitForFunction(
    () => !document.querySelector(".girlhood-send button").disabled,
  );
  await page
    .getByRole("button", { name: "Share my words", exact: false })
    .click();
  await page.locator(".girlhood-receipt").waitFor();
  await page.screenshot({
    path: resolve(artifacts, "receipt-mobile.png"),
    fullPage: true,
  });
  const codes = await page.locator(".girlhood-receipt code").allTextContents();
  assert.equal(codes.length, 2);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("link", { name: "In their own words", exact: true })
    .click();
  assert.ok(
    await page.locator(".girlhood-receipt").isVisible(),
    "unsaved receipt navigation is guarded",
  );
  const storage = await page.evaluate(() => ({ ...sessionStorage }));
  assert.deepEqual(Object.keys(storage), ["sgc-girlhood-receipt"]);
  assert.match(storage["sgc-girlhood-receipt"], /^[a-f0-9]{64}$/);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download my private receipt" })
    .click();
  await download;
  await page.reload();
  await page.getByRole("button", { name: "Recover my receipt" }).click();
  await page.locator(".girlhood-receipt").waitFor();
  assert.deepEqual(
    await page.locator(".girlhood-receipt code").allTextContents(),
    codes,
  );
  page.on("dialog", (d) => d.accept());
  await go("/withdraw");
  await page.locator("input").nth(0).fill(codes[0]);
  await page.locator("input").nth(1).fill(codes[1]);
  await page
    .getByRole("button", { name: "Withdraw my contribution", exact: true })
    .click();
  await page
    .getByText("Your contribution has been withdrawn.", { exact: true })
    .waitFor();
  for (const value of ["closed", "not_yet_open"]) {
    state = value;
    await go("/share-your-voice");
    await page.locator(".girlhood-availability").waitFor();
    assert.equal(await page.locator("textarea").count(), 3);
  }
  state = "open";
  await go("/share-your-voice");
  await page.getByRole("button", { name: "Français", exact: true }).click();
  await page.locator("#note-0").waitFor();
  assert.ok(
    (await page.locator("label[for=note-0]").textContent()).includes("enfance"),
  );
  await page.screenshot({
    path: resolve(artifacts, "writing-french-mobile.png"),
    fullPage: true,
  });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({
    path: resolve(artifacts, "writing-dark-mobile.png"),
    fullPage: true,
  });
  await overflow();
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(artifacts, "verification.json"),
    JSON.stringify(
      {
        passed: true,
        widths: [360, 390, 768, 1440],
        checks: [
          "three mobile cards",
          "expanded full responses",
          "keyboard modal close and focus",
          "write before details",
          "optional permissions default off",
          "under-13 strips identity and permission",
          "oversize rejection without truncation",
          "submission",
          "receipt download and reload recovery",
          "withdrawal",
          "availability",
          "French",
          "dark mode",
          "no horizontal overflow",
          "no browser errors",
        ],
        fixtureDataOnly: true,
      },
      null,
      2,
    ),
  );
  console.log("PASS redesign browser verification and screenshots");
} finally {
  await browser.close();
}
