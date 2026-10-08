// Fixture-only browser regression checks. Start tests/ui-preview.mjs first.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const base = process.env.UI_BASE_URL || "http://127.0.0.1:4178";
const artifacts = resolve(process.env.UI_ARTIFACT_DIR || "../browser-check");
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {},
);
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "en-US",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
async function noOverflow() {
  assert.ok(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
    "Horizontal overflow",
  );
}
async function requiredChecks() {
  for (const checkbox of await page
    .locator('input[aria-required="true"]')
    .all())
    await checkbox.check();
}
async function continueForm(fr = false) {
  await page
    .getByRole("button", { name: fr ? "Continuer" : "Continue", exact: true })
    .click();
}
try {
  await page.goto(base + '/girlhood');
  await page.waitForURL('**/programs/girlhood');
  await page.goto(base + '/programs/custom-campaign/privacy');
  await page.getByRole('heading', { name: /not found/i }).waitFor();
  await page.goto(base + '/programs/girlhood/unknown');
  await page.getByRole('heading', { name: /404|not found/i }).waitFor();
  await page.goto(base + '/programs/missing');
  await page.getByRole('heading', { name: /404|not found/i }).waitFor();
  await page.goto(base + "/programs/girlhood");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.getByRole("button", { name: "Freedom", exact: true }).click();
  await page.getByRole("heading", { name: "Space to be herself." }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Freedom", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Belonging", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("heading", { name: "A place where she is heard." })
    .waitFor();
  assert.equal(
    await page
      .locator(".girlhood-stars")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  await noOverflow();
  await page.screenshot({
    path: resolve(artifacts, "home-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Français", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "L’enfance des filles devrait leur appartenir",
      exact: true,
    })
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await page.screenshot({
    path: resolve(artifacts, "home-mobile-fr.png"),
    fullPage: true,
  });
  await page.locator(".girlhood-possibilities").screenshot({ path: resolve(artifacts, "possibilities-mobile-fr.png") });
  console.log(
    "PASS home interactions, keyboard activation, French/mobile layout and reduced motion",
  );

  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.goto(base + "/programs/girlhood/share-your-voice");
  await continueForm();
  await page.getByRole("alert").filter({ hasText: "Enter your age" }).waitFor();
  await page.getByRole("spinbutton").fill("12");
  assert.equal(
    await page.getByRole("textbox", { name: /How would you like/ }).count(),
    0,
  );
  await continueForm();
  await page
    .getByRole("textbox", { name: /Girlhood should be/ })
    .fill("A childhood full of questions and possibilities.");
  await continueForm();
  assert.equal(
    await page.getByRole("checkbox", { name: /may publish/ }).count(),
    0,
  );
  await requiredChecks();
  await continueForm();
  assert.equal(
    await page.getByRole("progressbar").getAttribute("aria-valuenow"),
    "4",
  );
  await page.screenshot({
    path: resolve(artifacts, "review-mobile.png"),
    fullPage: true,
  });
  let savedReceipt;
  let lostResponse = false;
  await page.route("**/api/girlhood/submit", async (route) => {
    if (!lostResponse && !route.request().postDataJSON().recoverOnly) {
      lostResponse = true;
      const actual = await route.fetch();
      savedReceipt = await actual.json();
      await route.abort("failed"); // The server committed, but the browser loses its response.
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Submit my voice ✦", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "could not confirm delivery" })
    .waitFor();
  assert.ok(savedReceipt.publicReference);
  const storage = await page.evaluate(() => ({ ...sessionStorage }));
  assert.deepEqual(Object.keys(storage), ["sgc-girlhood-receipt"]);
  assert.match(storage["sgc-girlhood-receipt"], /^[a-f0-9]{64}$/);
  await page.reload();
  await page
    .getByRole("button", { name: "Recover my receipt", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "Your voice has been received.",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page.locator("code").nth(0).innerText(),
    savedReceipt.publicReference,
  );
  assert.equal(
    await page.locator("code").nth(1).innerText(),
    savedReceipt.withdrawalCode,
  );
  await page
    .getByText("Your response will remain private.", { exact: true })
    .waitFor();
  const downloadWait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download my private receipt", exact: true })
    .click();
  const download = await downloadWait;
  const receiptFile = resolve(artifacts, "fixture-receipt.txt");
  await download.saveAs(receiptFile);
  assert.match(
    await readFile(receiptFile, "utf8"),
    new RegExp(savedReceipt.publicReference),
  );
  await noOverflow();
  await page.screenshot({
    path: resolve(artifacts, "receipt-mobile.png"),
    fullPage: true,
  });
  console.log(
    "PASS validation, under-13 privacy, dropped response, reload recovery and receipt download",
  );

  await page.goto(base + "/programs/girlhood/withdraw");
  await page
    .getByRole("textbox", { name: "Submission reference", exact: true })
    .fill(savedReceipt.publicReference);
  await page
    .getByLabel("Private withdrawal code", { exact: true })
    .fill(savedReceipt.withdrawalCode);
  await page
    .getByRole("button", { name: "Withdraw my contribution", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "has been withdrawn" })
    .waitFor();
  await page.goto(base + "/programs/girlhood/share-your-voice");
  await page
    .getByRole("button", { name: "Recover my receipt", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "This contribution has already been withdrawn.",
      exact: true,
    })
    .waitFor();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Clear receipt from this tab", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("sgc-girlhood-receipt")),
    null,
  );
  console.log(
    "PASS withdrawal, withdrawn receipt state and clearing private recovery key",
  );

  await page.getByRole("button", { name: "Français", exact: true }).click();
  await page.getByRole("spinbutton").fill("17");
  await continueForm(true);
  await page
    .locator("textarea")
    .first()
    .fill("Un monde plein de découvertes et de possibilités.");
  await continueForm(true);
  await page.getByRole("checkbox").first().check(); // Publication yes, identity still no.
  await requiredChecks();
  await continueForm(true);
  await page.getByText("Anonyme", { exact: false }).first().waitFor();
  await page
    .getByRole("button", { name: "Envoyer ma voix ✦", exact: true })
    .click();
  await page.locator("code").first().waitFor();
  await page
    .getByRole("button", { name: "Télécharger mon reçu privé", exact: true })
    .waitFor();
  await noOverflow();
  console.log("PASS French contribution and anonymous public preview");

  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.goto(base + "/programs/girlhood/wall");
  await page.locator("article").first().waitFor();
  await page.getByText("Read the rest of this voice", { exact: true }).click();
  await page
    .getByText("Anything she can imagine, with space to learn.", {
      exact: true,
    })
    .waitFor();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page
    .getByText("Un monde plein de découvertes.", { exact: false })
    .waitFor();
  await noOverflow();
  assert.deepEqual(errors, []);
  console.log("PASS expandable wall, pagination and no browser runtime errors");
} finally {
  await browser.close();
}
