export type StoreId = "central" | "park" | "river";
export type BenefitId = "B01" | "B02" | "B03" | "B04";

export interface Store {
  id: StoreId;
  name: string;
  officialStoreId: string | null;
  benefitIds: BenefitId[];
  businessHours: { open: string; close: string } | null;
  closedDates: string[];
  storeUrl: string;
  verifiedAt: string | null;
  verificationStatus: "unverified" | "verified";
}

export interface Benefit {
  id: BenefitId;
  title: string;
  eyebrow: string;
  displayValue: string;
  displayUnit: string;
  description: string;
  targetLabel: string;
  storeIds: StoreId[];
  /** JavaScript weekday numbering: Sunday 0, Monday 1, ... Saturday 6. */
  weekdays: number[];
  timeWindows: { start: string; end: string }[];
  scheduleLabel: string;
  minimumPurchaseAmount: number | null;
  maxQuantity: number | null;
  receiptCondition: string | null;
  stackingCondition: string | null;
  coreConditions: string[];
  details: string[];
  earlyEndNotice?: string;
  confirmationNotice: string;
  icon: "meal" | "basket" | "fresh" | "river";
}

const storeFinderUrl = "https://eapp.emart.com/brandbranch/main.do";
const allStores: StoreId[] = ["central", "park", "river"];
const everyDay = [0, 1, 2, 3, 4, 5, 6];

export const campaign = {
  id: "emart-november-2026",
  title: "이마트 고래잇! 알뜰한 11월 장보기",
  headline: "11월 장보기 혜택을 한눈에",
  description:
    "식사 콤보부터 주말 할인까지, 방문할 점포의 행사 조건을 확인해 보세요.",
  startDate: "2026-11-02",
  endDate: "2026-11-29",
  timezone: "Asia/Seoul",
  dateLabel: "2026.11.02 월 ~ 11.29 일",
  storeFinderUrl,
  commonNotices: [
    "행사 기간은 2026년 11월 2일부터 11월 29일까지입니다.",
    "행사 표시 상품에 한해 적용합니다. 자세한 대상 상품과 적용 조건은 매장 안내를 확인해 주세요.",
    "행사 간 중복 적용 여부와 적용 순서는 확인 중입니다. 합산 할인율이나 최대 절약 금액을 보장하지 않습니다.",
    "영업시간과 휴점일은 공식 점포 안내에서 확인해 주세요. 행사 일정 표시는 영업 여부나 재고를 보장하지 않습니다.",
    "이 페이지는 PRD 기반 화면 검토본입니다. 실제 점포 정보와 일부 행사 조건은 확인 중이며, 확정된 안내는 매장에서 확인해 주세요.",
  ],
} as const;

export const stores: Store[] = [
  {
    id: "central",
    name: "센트럴점",
    officialStoreId: null,
    benefitIds: ["B01", "B02", "B03"],
    businessHours: null,
    closedDates: [],
    storeUrl: storeFinderUrl,
    verifiedAt: null,
    verificationStatus: "unverified",
  },
  {
    id: "park",
    name: "파크점",
    officialStoreId: null,
    benefitIds: ["B01", "B02", "B03"],
    businessHours: null,
    closedDates: [],
    storeUrl: storeFinderUrl,
    verifiedAt: null,
    verificationStatus: "unverified",
  },
  {
    id: "river",
    name: "리버점",
    officialStoreId: null,
    benefitIds: ["B01", "B02", "B03", "B04"],
    businessHours: null,
    closedDates: [],
    storeUrl: storeFinderUrl,
    verifiedAt: null,
    verificationStatus: "unverified",
  },
];

export const benefits: Benefit[] = [
  {
    id: "B01",
    title: "맛있는 한 끼, 식사 콤보",
    eyebrow: "월~목, 든든한 한 끼",
    displayValue: "15",
    displayUnit: "%",
    description: "간편식과 음료·유제품을 함께 담으세요.",
    targetLabel: "간편식 1개 + 음료 또는 유제품 1개",
    storeIds: [...allStores],
    weekdays: [1, 2, 3, 4],
    timeWindows: [
      { start: "11:30", end: "13:30" },
      { start: "17:30", end: "19:30" },
    ],
    scheduleLabel: "월~목 · 11:30~13:30 / 17:30~19:30",
    minimumPurchaseAmount: null,
    maxQuantity: null,
    receiptCondition: "같은 영수증으로 동시 구매",
    stackingCondition: "타 쿠폰 및 기존 수량 할인과 중복 적용 불가",
    coreConditions: [
      "간편식 1개와 음료 또는 유제품 1개를 같은 영수증으로 동시 구매",
      "월~목 · 11:30~13:30, 17:30~19:30",
    ],
    details: [
      "센트럴점·파크점·리버점의 행사 표시 상품에 한해 적용합니다.",
      "간편식 1개와 음료 또는 유제품 1개를 같은 영수증으로 동시에 구매해야 합니다.",
      "타 쿠폰 및 기존 수량 할인과 중복 적용할 수 없습니다. 이 중복 제한은 식사 콤보에 대한 조건입니다.",
      "월~목을 구현 기준으로 사용합니다. 개별 자료의 평일 표기와 차이가 있어 금요일 포함 여부는 확인 중입니다.",
      "15%가 적용되는 구체적인 금액 범위와 대상 품목, 실제 할인 마감 시각의 운영 기준은 매장 안내를 확인해 주세요.",
    ],
    confirmationNotice: "조건 확인 중 · 콤보 요일과 할인 적용 금액 범위",
    icon: "meal",
  },
  {
    id: "B02",
    title: "주말 장보기, 더 알뜰하게",
    eyebrow: "금~일, 주말 혜택",
    displayValue: "2,000",
    displayUnit: "원",
    description: "35,000원 이상 장보면 즉시 할인.",
    targetLabel: "다른 상품 할인 반영 후 35,000원 이상 구매",
    storeIds: [...allStores],
    weekdays: [5, 6, 0],
    timeWindows: [],
    scheduleLabel: "금~일 · 단일 영수증 기준",
    minimumPurchaseAmount: 35000,
    maxQuantity: null,
    receiptCondition: "단일 영수증 기준 · 영수증 합산 불가",
    stackingCondition: null,
    coreConditions: [
      "다른 상품 할인 반영 후, 이번 2,000원 즉시 할인 전 35,000원 이상",
      "단일 영수증 기준 · 영수증 합산 불가",
    ],
    details: [
      "금요일부터 일요일까지 센트럴점·파크점·리버점에서 진행합니다.",
      "구매 금액은 다른 상품 할인을 적용한 후, 이번 2,000원 즉시 할인을 적용하기 전 금액을 기준으로 합니다.",
      "단일 영수증 기준이며 여러 영수증의 구매 금액을 합산할 수 없습니다.",
      "예: 다른 상품 할인 반영 후 대상 구매 금액이 35,000원이면, 2,000원 즉시 할인 후 33,000원입니다.",
      "제외 품목, 횟수 제한 및 추가 자격 조건은 확인 중입니다. 자세한 조건은 매장 안내를 확인해 주세요.",
    ],
    confirmationNotice: "조건 확인 중 · 제외 품목, 횟수 제한 및 추가 자격",
    icon: "basket",
  },
  {
    id: "B03",
    title: "신선하게 담고, 함께 할인",
    eyebrow: "매일, 함께 사면",
    displayValue: "15",
    displayUnit: "%",
    description: "지정 가공식품을 더 알뜰하게.",
    targetLabel: "행사 신선식품 10,000원 이상 구매 시 지정 가공식품 할인",
    storeIds: [...allStores],
    weekdays: [...everyDay],
    timeWindows: [],
    scheduleLabel: "매일 · 지정 가공식품 최대 2개",
    minimumPurchaseAmount: 10000,
    maxQuantity: 2,
    receiptCondition: null,
    stackingCondition: null,
    coreConditions: [
      "행사 신선식품 10,000원 이상 구매 시 지정 가공식품 15% 할인",
      "즉석밥·참치·멸치 중 지정 상품 · 최대 2개",
    ],
    details: [
      "행사 기간 중 매일 센트럴점·파크점·리버점에서 진행합니다.",
      "15% 할인 대상은 지정 가공식품입니다. 신선식품을 15% 할인하는 혜택이 아닙니다.",
      "지정 상품군은 즉석밥·참치·멸치이며, 지정 상품 최대 2개에 적용합니다.",
      "정확한 대상 상품 목록, 신선식품 10,000원 산정 시점, 최대 2개의 합산 방식 및 동일 영수증 조건은 확인 중입니다.",
      "자료에 없는 상품 가격이나 할인 금액은 별도로 안내하지 않습니다. 자세한 적용 조건은 매장 안내를 확인해 주세요.",
    ],
    confirmationNotice:
      "조건 확인 중 · 대상 상품, 금액 산정·수량 합산 및 영수증 기준",
    icon: "fresh",
  },
  {
    id: "B04",
    title: "퇴근길에 만나는 작은 행복",
    eyebrow: "리버점 단독, 퇴근길 할인",
    displayValue: "20",
    displayUnit: "%",
    description: "오늘의 신선함을 저녁에도 알뜰하게.",
    targetLabel: "리버점 당일 행사 신선식품·간편식",
    storeIds: ["river"],
    weekdays: [...everyDay],
    timeWindows: [{ start: "17:00", end: "20:00" }],
    scheduleLabel: "리버점 단독 · 매일 17:00~20:00",
    minimumPurchaseAmount: null,
    maxQuantity: null,
    receiptCondition: null,
    stackingCondition: null,
    coreConditions: [
      "리버점 단독 · 당일 행사 신선식품과 간편식",
      "매일 17:00~20:00 · 준비 수량 소진 시 조기 종료",
    ],
    details: [
      "리버점에서만 매일 17:00~20:00에 진행하는 행사입니다.",
      "당일 행사 표시가 있는 신선식품과 간편식에 한해 20% 할인합니다.",
      "준비 수량 소진 시 조기 종료됩니다. 페이지에서는 재고나 품절 여부를 실시간으로 확인할 수 없습니다.",
      "정확한 대상 상품과 실제 할인 마감 시각의 운영 기준은 매장 안내를 확인해 주세요.",
    ],
    earlyEndNotice: "준비 수량 소진 시 조기 종료",
    confirmationNotice: "조건 확인 중 · 대상 상품과 실제 할인 마감 기준",
    icon: "river",
  },
];

/** Unselected visitors can review all four offers; selecting a store filters availability. */
export function getBenefitsForStore(storeId?: StoreId): Benefit[] {
  return storeId
    ? benefits.filter((benefit) => benefit.storeIds.includes(storeId))
    : [...benefits];
}
