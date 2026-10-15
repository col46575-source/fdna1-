import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const fridayEvening = "2026-11-06T08:00:00Z"; // Friday 17:00 in Korea.
const finderUrl = "https://eapp.emart.com/brandbranch/main.do";

async function openAt(page: Page, time = fridayEvening) {
  await page.clock.install({ time: new Date(time) });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "11월 장보기",
  );
}

function storeButton(page: Page, name: string) {
  return page
    .getByRole("group", { name: "방문 점포 선택" })
    .getByRole("button", { name: new RegExp(name) });
}

function card(page: Page, id: string) {
  return page.locator(`[data-benefit="${id}"]`);
}

test("starts without a store selection and shows all four ordered benefits", async ({
  page,
}) => {
  await openAt(page);
  await expect(page.locator('.store-option[aria-pressed="true"]')).toHaveCount(
    0,
  );
  await expect(page.locator(".benefit-card")).toHaveCount(4);
  expect(
    await page
      .locator(".benefit-card")
      .evaluateAll((cards) =>
        cards.map((item) => item.getAttribute("data-benefit")),
      ),
  ).toEqual(["B01", "B02", "B03", "B04"]);
  await expect(page.locator(".store-summary")).toContainText("점포를 선택하면");
  await expect(page.locator(".header-store")).toContainText("내 점포 선택");
  await expect(page.locator(".benefits-context")).toContainText(
    "전체 점포 혜택",
  );
  await expect(card(page, "B04")).toContainText("리버점 단독");
  await expect(card(page, "B04").locator(".schedule-line")).not.toHaveClass(
    /is-active/,
  );
});

test("switches each store and updates cards, selected state, header, summary and mobile action", async ({
  page,
}, testInfo) => {
  await openAt(page);
  for (const [name, count] of [
    ["센트럴점", 3],
    ["파크점", 3],
    ["리버점", 4],
    ["센트럴점", 3],
  ] as const) {
    await storeButton(page, name).click();
    await expect(storeButton(page, name)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.locator('.store-option[aria-pressed="true"]'),
    ).toHaveCount(1);
    await expect(page.locator(".benefit-card")).toHaveCount(count);
    await expect(page.locator(".header-store")).toContainText(name);
    await expect(page.locator(".store-summary")).toContainText(
      `${name} 혜택 ${count}가지를`,
    );
    await expect(page.locator(".benefits-context")).toContainText(
      `${name}의 혜택`,
    );
    if (testInfo.project.name === "mobile") {
      await expect(page.locator(".mobile-action > div")).toContainText(name);
      await expect(page.locator(".mobile-action > button")).toHaveText(
        `${name} 혜택 보기`,
      );
    }
  }
});

test("store selection lasts only for the current page and clears on reload", async ({
  page,
}) => {
  await openAt(page);
  await storeButton(page, "리버점").click();
  await expect(storeButton(page, "리버점")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('.store-option[aria-pressed="true"]')).toHaveCount(
    0,
  );
  await expect(page.locator(".benefit-card")).toHaveCount(4);
  await expect(page.locator(".header-store")).toContainText("내 점포 선택");
});

test("benefit conditions remain visible and details toggle without navigation", async ({
  page,
}) => {
  await openAt(page);
  await expect(card(page, "B02").locator(".core-conditions")).toContainText(
    "이번 2,000원 즉시 할인 전 35,000원 이상",
  );
  await expect(card(page, "B02").locator(".core-conditions")).toContainText(
    "영수증 합산 불가",
  );
  await expect(card(page, "B03").locator(".core-conditions")).toContainText(
    "행사 신선식품 10,000원 이상 구매 시 지정 가공식품 15% 할인",
  );
  await expect(card(page, "B03").locator(".core-conditions")).toContainText(
    "최대 2개",
  );
  await expect(card(page, "B04").locator(".early-end")).toBeVisible();
  for (const id of ["B01", "B02", "B03", "B04"]) {
    const details = card(page, id).locator(".detail-content");
    const toggle = card(page, id).getByRole("button", {
      name: "자세한 할인 조건",
    });
    await expect(details).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(details).toBeVisible();
    await expect(details).toContainText("확인 중");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(details).toBeHidden();
  }
});

test("FAQs and common notices can be read and closed", async ({ page }) => {
  await openAt(page);
  const faqs = page.locator(".faq-list details");
  await expect(faqs).toHaveCount(4);
  for (let index = 0; index < 4; index++) {
    const item = faqs.nth(index);
    await item.locator("summary").click();
    await expect(item).toHaveAttribute("open", "");
    await expect(item.locator("p")).toBeVisible();
    await item.locator("summary").click();
    await expect(item).not.toHaveAttribute("open", "");
  }
  await page.locator(".notice-details > summary").click();
  await expect(page.locator(".notice-body")).toBeVisible();
  await expect(page.locator(".notice-body")).toContainText(
    "영업시간과 휴점일은 공식 점포 안내",
  );
  await expect(page.locator(".notice-body")).toContainText(
    "준비 수량 소진 시 조기 종료",
  );
});

test("hero and selected mobile action scroll to their correct sections", async ({
  page,
}, testInfo) => {
  await openAt(page);
  await page.locator(".primary-button").click();
  await expect
    .poll(async () =>
      page
        .locator("#stores")
        .evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    )
    .toBeLessThan(120);
  await expect(page.locator("#stores")).toBeInViewport();
  if (testInfo.project.name === "mobile") {
    await storeButton(page, "리버점").click();
    await page.locator(".mobile-action > button").click();
    await expect
      .poll(async () =>
        page
          .locator("#benefits")
          .evaluate((node) => Math.round(node.getBoundingClientRect().top)),
      )
      .toBeLessThan(120);
    await expect(
      page.getByRole("heading", { name: "11월엔, 이렇게 알뜰하게" }),
    ).toBeInViewport();
  }
});

test("keyboard users can choose a store, expand details and open FAQs", async ({
  page,
}) => {
  await openAt(page);
  const river = storeButton(page, "리버점");
  await river.focus();
  await page.keyboard.press("Enter");
  await expect(river).toHaveAttribute("aria-pressed", "true");
  const toggle = card(page, "B04").getByRole("button", {
    name: "자세한 할인 조건",
  });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const faq = page.locator(".faq-list details").first();
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(faq).toHaveAttribute("open", "");
});

test("official finder links use the verified common URL without invented store mappings", async ({
  page,
}) => {
  await openAt(page);
  for (const store of [undefined, "센트럴점", "파크점", "리버점"]) {
    if (store) await storeButton(page, store).click();
    for (const link of await page
      .locator(".store-summary a, .site-footer > a")
      .all()) {
      await expect(link).toHaveAttribute("href", finderUrl);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  }
});

test("overseas device timezone still highlights Friday B02, B03 and selected river B04", async ({
  page,
}) => {
  await openAt(page);
  await storeButton(page, "리버점").click();
  await expect(page.locator(".schedule-line.is-active")).toHaveCount(3);
  for (const id of ["B02", "B03", "B04"])
    await expect(card(page, id).locator(".schedule-line")).toHaveClass(
      /is-active/,
    );
  await expect(card(page, "B01").locator(".schedule-line")).not.toHaveClass(
    /is-active/,
  );
  await expect(card(page, "B04").locator(".schedule-line")).toContainText(
    "퇴근길 행사 시간대예요",
  );
  await expect(page.locator(".schedule-banner")).toContainText(
    "영업시간과 휴점일은 공식 점포 안내",
  );
  await expect(page.locator("body")).not.toContainText("영업중");
});

for (const boundary of [
  {
    name: "before campaign",
    time: "2026-11-01T14:59:00Z",
    phase: "11월 2일부터 시작해요",
    count: 0,
  },
  {
    name: "campaign first midnight",
    time: "2026-11-01T15:00:00Z",
    phase: "11월 장보기 행사 안내",
    count: 1,
  },
  {
    name: "campaign last minute",
    time: "2026-11-29T14:59:00Z",
    phase: "11월 장보기 행사 안내",
    count: 2,
  },
  {
    name: "after campaign",
    time: "2026-11-29T15:00:00Z",
    phase: "이번 행사가 종료되었어요",
    count: 0,
  },
]) {
  test(`Korean date boundary: ${boundary.name}`, async ({ page }, testInfo) => {
    await openAt(page, boundary.time);
    await storeButton(page, "리버점").click();
    await expect(page.locator(".schedule-banner")).toContainText(
      boundary.phase,
    );
    await expect(page.locator(".schedule-line.is-active")).toHaveCount(
      boundary.count,
    );
    if (boundary.name === "after campaign") {
      await expect(page.locator(".ended-banner")).toBeVisible();
      if (testInfo.project.name === "mobile")
        await expect(page.locator(".mobile-action > button")).toHaveText(
          "종료된 행사 내용 보기",
        );
    }
    if (
      boundary.name === "before campaign" &&
      testInfo.project.name === "mobile"
    ) {
      await expect(page.locator(".mobile-action > button")).toHaveText(
        "행사 혜택 미리 보기",
      );
    }
  });
}

test("meal-combo highlight starts at 11:30 and clears automatically at 13:30 Korean time", async ({
  page,
}) => {
  await openAt(page, "2026-11-02T02:29:00Z");
  await expect(card(page, "B01").locator(".schedule-line")).not.toHaveClass(
    /is-active/,
  );
  await page.clock.fastForward(60_050);
  await expect(card(page, "B01").locator(".schedule-line")).toHaveClass(
    /is-active/,
  );
  await page.clock.fastForward(119 * 60_000);
  await expect(card(page, "B01").locator(".schedule-line")).toHaveClass(
    /is-active/,
  );
  await page.clock.fastForward(60_050);
  await expect(card(page, "B01").locator(".schedule-line")).not.toHaveClass(
    /is-active/,
  );
  await expect(card(page, "B01").locator(".schedule-line")).toContainText(
    "오늘 11:30~13:30",
  );
});

test("river evening highlight starts at 17:00 and clears at 20:00 without hiding early-end warning", async ({
  page,
}) => {
  await openAt(page, "2026-11-06T07:59:00Z");
  await storeButton(page, "리버점").click();
  await expect(card(page, "B04").locator(".schedule-line")).not.toHaveClass(
    /is-active/,
  );
  await page.clock.fastForward(60_050);
  await expect(card(page, "B04").locator(".schedule-line")).toHaveClass(
    /is-active/,
  );
  await page.clock.fastForward(180 * 60_000);
  await expect(card(page, "B04").locator(".schedule-line")).not.toHaveClass(
    /is-active/,
  );
  await expect(card(page, "B04").locator(".early-end")).toBeVisible();
});

test("viewport has no horizontal overflow, including expanded content", async ({
  page,
}, testInfo) => {
  await openAt(page);
  for (const toggle of await page
    .getByRole("button", { name: "자세한 할인 조건" })
    .all())
    await toggle.click();
  await page.locator(".notice-details > summary").click();
  const width = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(width.document).toBeLessThanOrEqual(width.viewport);
  expect(width.body).toBeLessThanOrEqual(width.viewport);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `/tmp/emart-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("main actions meet the 48px touch target and sharing has an accessible name", async ({
  page,
}, testInfo) => {
  await openAt(page);
  const selectors = [
    ".primary-button",
    ".store-option",
    ".detail-toggle",
    ".header-store",
    ".share-button",
  ];
  if (testInfo.project.name === "mobile")
    selectors.push(".mobile-action > button");
  for (const selector of selectors) {
    for (const button of await page.locator(selector).all()) {
      const bounds = await button.boundingBox();
      expect
        .soft(bounds?.height, `${selector} height`)
        .toBeGreaterThanOrEqual(48);
      expect
        .soft(bounds?.width, `${selector} width`)
        .toBeGreaterThanOrEqual(48);
    }
  }
  await expect(page.locator(".share-button")).toHaveAccessibleName(
    "혜택 공유하기",
  );
});
