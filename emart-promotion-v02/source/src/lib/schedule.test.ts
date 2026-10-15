import test from "node:test";
import assert from "node:assert/strict";
import {
  getBenefitsForStore,
  benefits,
  stores,
  type Store,
} from "../data/campaign.ts";
import { getSchedule } from "./schedule.ts";

const kst = (dateTime: string) => new Date(`${dateTime}:00+09:00`);
const central = stores.find((store) => store.id === "central")!;
const river = stores.find((store) => store.id === "river")!;
const allInactive = (schedule: ReturnType<typeof getSchedule>) =>
  Object.values(schedule.benefitStatuses).every((status) => !status.active);

test("T01: the campaign begins at Korean midnight, with no earlier highlights", () => {
  const before = getSchedule(kst("2026-11-01T23:59"), river);
  assert.equal(before.phase, "before");
  assert.ok(allInactive(before));
  assert.match(before.headline, /11월 2일/);
  assert.equal(getSchedule(kst("2026-11-02T00:00")).phase, "active");
});

test("T02–T04: meal windows include opening and exclude closing times", () => {
  for (const [time, active] of [
    ["11:29", false],
    ["11:30", true],
    ["13:29", true],
    ["13:30", false],
    ["17:29", false],
    ["17:30", true],
    ["19:29", true],
    ["19:30", false],
  ] as const) {
    assert.equal(
      getSchedule(kst(`2026-11-02T${time}`), central).benefitStatuses.B01
        .active,
      active,
      time,
    );
  }
  assert.equal(
    getSchedule(new Date("2026-11-02T13:29:59.999+09:00")).benefitStatuses.B01
      .active,
    true,
  );
  assert.equal(
    getSchedule(new Date("2026-11-02T13:30:00.000+09:00")).benefitStatuses.B01
      .active,
    false,
  );
});

test("T05: Friday enables weekend information without promising a meal combo", () => {
  const schedule = getSchedule(kst("2026-11-06T12:00"), central);
  assert.equal(schedule.benefitStatuses.B01.active, false);
  assert.equal(schedule.benefitStatuses.B02.active, true);
  assert.match(schedule.benefitStatuses.B02.label, /주말 혜택 행사일/);
});

test("T06: weekend and fresh-food linked benefits are scheduled on Saturday", () => {
  const schedule = getSchedule(kst("2026-11-07T18:00"), central);
  assert.equal(schedule.benefitStatuses.B02.active, true);
  assert.equal(schedule.benefitStatuses.B03.active, true);
});

test("all 28 campaign dates preserve the Monday–Thursday and Friday–Sunday split", () => {
  for (let day = 2; day <= 29; day++) {
    const date = `2026-11-${String(day).padStart(2, "0")}`;
    const now = kst(`${date}T12:00`);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const schedule = getSchedule(now);
    assert.equal(schedule.phase, "active", date);
    assert.equal(
      schedule.benefitStatuses.B01.active,
      weekday >= 1 && weekday <= 4,
      date,
    );
    assert.equal(
      schedule.benefitStatuses.B02.active,
      [0, 5, 6].includes(weekday),
      date,
    );
    assert.equal(schedule.benefitStatuses.B03.active, true, date);
  }
});

test("T07: store filtering preserves card order and an unselected view shows all four", () => {
  assert.deepEqual(
    getBenefitsForStore().map(({ id }) => id),
    ["B01", "B02", "B03", "B04"],
  );
  assert.deepEqual(
    getBenefitsForStore("river").map(({ id }) => id),
    ["B01", "B02", "B03", "B04"],
  );
  assert.deepEqual(
    getBenefitsForStore("central").map(({ id }) => id),
    ["B01", "B02", "B03"],
  );
  assert.equal(getBenefitsForStore("park").length, 3);
});

test("T08: river offer needs explicit river selection and its half-open time window", () => {
  for (const [time, active] of [
    ["16:59", false],
    ["17:00", true],
    ["19:59", true],
    ["20:00", false],
  ] as const) {
    const now = kst(`2026-11-06T${time}`);
    assert.equal(
      getSchedule(now, river).benefitStatuses.B04.active,
      active,
      time,
    );
    assert.equal(getSchedule(now, central).benefitStatuses.B04.active, false);
    assert.equal(getSchedule(now).benefitStatuses.B04.active, false);
  }
  assert.match(
    benefits.find(({ id }) => id === "B04")!.earlyEndNotice!,
    /소진 시 조기 종료/,
  );
});

test("T09: November 29 is included and November 30 midnight ends every highlight", () => {
  assert.equal(getSchedule(kst("2026-11-29T23:59"), river).phase, "active");
  const ended = getSchedule(kst("2026-11-30T00:00"), river);
  assert.equal(ended.phase, "ended");
  assert.ok(allInactive(ended));
  assert.match(ended.headline, /종료/);
});

test("T10: the same instant produces Korean weekday/date/time regardless of host timezone", () => {
  const original = process.env.TZ;
  try {
    const instant = new Date("2026-11-02T02:30:00Z");
    process.env.TZ = "America/Los_Angeles";
    const overseas = getSchedule(instant, central);
    process.env.TZ = "Asia/Seoul";
    assert.deepEqual(getSchedule(instant, central), overseas);
    assert.equal(overseas.benefitStatuses.B01.active, true);
    assert.match(overseas.dateLabel, /11월 2일/);
    assert.match(overseas.timeLabel, /^11:30/);
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("T13: a verified closure takes priority over all scheduled highlights", () => {
  const closed: Store = {
    ...river,
    verificationStatus: "verified",
    closedDates: ["2026-11-06"],
    businessHours: { open: "10:00", close: "22:00" },
  };
  const schedule = getSchedule(kst("2026-11-06T18:00"), closed);
  assert.equal(schedule.storeStatus, "closed");
  assert.ok(allInactive(schedule));
  assert.match(schedule.headline, /휴점일/);
});

test("verified opening and closing boundaries suppress highlights outside store hours", () => {
  const verified: Store = {
    ...river,
    verificationStatus: "verified",
    businessHours: { open: "11:30", close: "19:00" },
  };
  assert.equal(
    getSchedule(kst("2026-11-02T11:29"), verified).storeStatus,
    "outside",
  );
  assert.equal(
    getSchedule(kst("2026-11-02T11:30"), verified).storeStatus,
    "open",
  );
  const closing = getSchedule(kst("2026-11-02T19:00"), verified);
  assert.equal(closing.storeStatus, "outside");
  assert.ok(allInactive(closing));
});

test("unverified business data never establishes a closure or open status", () => {
  const unverified: Store = {
    ...river,
    closedDates: ["2026-11-06"],
    businessHours: { open: "10:00", close: "11:00" },
  };
  const schedule = getSchedule(kst("2026-11-06T18:00"), unverified);
  assert.equal(schedule.storeStatus, "unknown");
  assert.equal(schedule.benefitStatuses.B04.active, true);
  assert.match(schedule.storeStatusLabel, /공식 점포 안내/);
});

test("missing store information stays unknown and campaign phase overrides store warnings", () => {
  assert.equal(
    getSchedule(kst("2026-11-06T18:00"), river).storeStatus,
    "unknown",
  );
  const verified: Store = {
    ...river,
    verificationStatus: "verified",
    businessHours: { open: "10:00", close: "20:00" },
  };
  const before = getSchedule(kst("2026-11-01T23:59"), verified);
  assert.equal(before.storeStatus, "outside");
  assert.match(before.headline, /11월 2일/);
  assert.ok(allInactive(before));
});
