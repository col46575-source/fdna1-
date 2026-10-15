import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("initial promotion passes automated WCAG A/AA checks", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("selected store and expanded conditions remain accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /리버점 퇴근길 전용 혜택까지/ })
    .click();
  for (const button of await page
    .getByRole("button", { name: "자세한 할인 조건" })
    .all())
    await button.click();
  for (const summary of await page.locator(".faq-list summary").all())
    await summary.click();
  await page.locator(".notice-details summary").click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
