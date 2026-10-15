import {
  benefits,
  campaign,
  type BenefitId,
  type Store,
} from "../data/campaign.ts";

export type CampaignPhase = "before" | "active" | "ended";
export type StoreStatus = "unknown" | "open" | "closed" | "outside";
export interface BenefitStatus {
  active: boolean;
  label: string;
}
export interface Schedule {
  phase: CampaignPhase;
  dateLabel: string;
  timeLabel: string;
  storeStatus: StoreStatus;
  storeStatusLabel: string;
  headline: string;
  benefitStatuses: Record<BenefitId, BenefitStatus>;
}

const localParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: campaign.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const koreanDate = new Intl.DateTimeFormat("ko-KR", {
  timeZone: campaign.timezone,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});
const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const isWithin = (minute: number, start: string, end: string) => {
  const from = minutesOf(start);
  const until = minutesOf(end);
  return from < until
    ? minute >= from && minute < until
    : from > until && (minute >= from || minute < until);
};

/** Schedule information only: active never certifies stock, purchase eligibility, or an open store. */
export function getSchedule(now: Date, store?: Store): Schedule {
  const parts = Object.fromEntries(
    localParts.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const minute = Number(parts.hour) * 60 + Number(parts.minute);
  // UTC weekday of the already extracted Korean calendar date is independent of the host timezone.
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const phase: CampaignPhase =
    date < campaign.startDate
      ? "before"
      : date > campaign.endDate
        ? "ended"
        : "active";

  let storeStatus: StoreStatus = "unknown";
  if (store?.verificationStatus === "verified") {
    if (store.closedDates.includes(date)) storeStatus = "closed";
    else if (store.businessHours)
      storeStatus = isWithin(
        minute,
        store.businessHours.open,
        store.businessHours.close,
      )
        ? "open"
        : "outside";
  }
  const storeStatusLabel =
    storeStatus === "closed"
      ? "오늘은 선택 점포의 휴점일이에요"
      : storeStatus === "outside"
        ? "점포 영업시간을 확인해 주세요"
        : storeStatus === "open"
          ? "확인된 점포 영업시간에 해당해요"
          : "영업시간과 휴점일은 공식 점포 안내에서 확인해 주세요";

  const headline =
    phase === "before"
      ? "11월 2일부터 시작해요"
      : phase === "ended"
        ? "이번 행사가 종료되었어요"
        : storeStatus === "closed" || storeStatus === "outside"
          ? storeStatusLabel
          : "11월 장보기 행사 안내";
  const suppressed =
    phase !== "active" || storeStatus === "closed" || storeStatus === "outside";
  const benefitStatuses = Object.fromEntries(
    benefits.map((benefit) => {
      const eligibleStore = benefit.id !== "B04" || store?.id === "river";
      const eligibleDay = benefit.weekdays.includes(weekday);
      const eligibleTime =
        benefit.timeWindows.length === 0 ||
        benefit.timeWindows.some(({ start, end }) =>
          isWithin(minute, start, end),
        );
      const active =
        !suppressed && eligibleStore && eligibleDay && eligibleTime;
      let label: string;
      if (phase !== "active") label = headline;
      else if (storeStatus === "closed" || storeStatus === "outside")
        label = storeStatusLabel;
      else if (benefit.id === "B01")
        label = active
          ? "식사 콤보 행사 시간대예요"
          : eligibleDay
            ? "오늘 11:30~13:30 · 17:30~19:30"
            : "월~목 · 11:30~13:30 · 17:30~19:30";
      else if (benefit.id === "B02")
        label = active ? "오늘은 주말 혜택 행사일이에요" : "금~일 행사예요";
      else if (benefit.id === "B03") label = "행사 신선식품과 함께 확인하세요";
      else
        label = active
          ? "퇴근길 행사 시간대예요 · 소진 시 종료"
          : eligibleStore
            ? "매일 17:00~20:00 · 소진 시 종료"
            : "리버점 단독 · 매일 17:00~20:00";
      return [benefit.id, { active, label }];
    }),
  ) as Record<BenefitId, BenefitStatus>;

  return {
    phase,
    dateLabel: koreanDate.format(now),
    timeLabel: `${parts.hour}:${parts.minute} · 한국시간`,
    storeStatus,
    storeStatusLabel,
    headline,
    benefitStatuses,
  };
}
