export const CAMPAIGN = Object.freeze({
  startDate: '2026-11-02',
  endDate: '2026-11-29',
  timezone: 'Asia/Seoul',
  storeUrl: 'https://eapp.emart.com/brandbranch/main.do',
});

export const STORES = Object.freeze([
  { id: 'central', name: '센트럴점', verified: false, businessHours: null, closedDates: [] },
  { id: 'park', name: '파크점', verified: false, businessHours: null, closedDates: [] },
  { id: 'river', name: '리버점', verified: false, businessHours: null, closedDates: [] },
]);

export const BENEFITS = Object.freeze([
  { id: 'B01', name: '식사 콤보', stores: ['central', 'park', 'river'], weekdays: [1, 2, 3, 4], windows: [[690, 810], [1050, 1170]] },
  { id: 'B02', name: '주말 장보기', stores: ['central', 'park', 'river'], weekdays: [5, 6, 0], windows: [] },
  { id: 'B03', name: '함께 사면', stores: ['central', 'park', 'river'], weekdays: [0, 1, 2, 3, 4, 5, 6], windows: [] },
  { id: 'B04', name: '퇴근길 장보기', stores: ['river'], weekdays: [0, 1, 2, 3, 4, 5, 6], windows: [[1020, 1200]] },
]);

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAMPAIGN.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function koreanClock(date = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new TypeError('Invalid date');
  const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
  const iso = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    iso,
    weekday: new Date(`${iso}T12:00:00+09:00`).getUTCDay(),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    month: Number(parts.month), day: Number(parts.day),
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function campaignPhase(date = new Date()) {
  const { iso } = koreanClock(date);
  if (iso < CAMPAIGN.startDate) return 'upcoming';
  if (iso > CAMPAIGN.endDate) return 'ended';
  return 'active';
}

export function visibleBenefits(storeId = null) {
  if (!storeId) return [...BENEFITS];
  if (!STORES.some(store => store.id === storeId)) return [];
  return BENEFITS.filter(benefit => benefit.stores.includes(storeId));
}

export function storeState(store, date = new Date()) {
  if (!store || !store.verified) return 'unverified';
  const clock = koreanClock(date);
  if (store.closedDates?.includes(clock.iso)) return 'closed';
  if (!store.businessHours) return 'unverified';
  const { open, close } = store.businessHours;
  return clock.minutes >= open && clock.minutes < close ? 'open' : 'outside-hours';
}

export function benefitState(benefit, storeId = null, date = new Date(), storeOverride = null) {
  if (storeId && !benefit.stores.includes(storeId)) return 'unavailable-store';
  const phase = campaignPhase(date);
  if (phase !== 'active') return phase;
  const store = storeOverride ?? STORES.find(item => item.id === storeId);
  const storeStatus = storeState(store, date);
  if (storeStatus === 'closed' || storeStatus === 'outside-hours') return storeStatus;
  const clock = koreanClock(date);
  if (!benefit.weekdays.includes(clock.weekday)) return 'different-day';
  if (benefit.windows.length && !benefit.windows.some(([start, end]) => clock.minutes >= start && clock.minutes < end)) return 'different-time';
  return benefit.windows.length ? 'scheduled-time' : 'scheduled-day';
}

export function previewDate(iso, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !/^\d{2}:\d{2}$/.test(time)) return null;
  if (iso < CAMPAIGN.startDate || iso > CAMPAIGN.endDate) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  const date = new Date(`${iso}T${time}:00+09:00`);
  if (!Number.isFinite(date.getTime())) return null;
  const clock = koreanClock(date);
  return clock.iso === iso && clock.time === time ? date : null;
}

export function announcement(storeId, date, preview = false) {
  const store = STORES.find(item => item.id === storeId);
  const clock = koreanClock(date);
  const phase = campaignPhase(date);
  if (phase === 'upcoming') return { label: '11월 2일부터 시작해요', detail: '장보기 전에, 11월의 혜택을 미리 살펴보세요.' };
  if (phase === 'ended') return { label: '이번 행사가 종료되었어요', detail: '2026년 11월 2일~29일에 진행한 행사 안내입니다.' };
  const names = visibleBenefits(storeId).filter(b => ['scheduled-time', 'scheduled-day'].includes(benefitState(b, storeId, date))).map(b => !storeId && b.id === 'B04' ? `리버점 ${b.name}` : b.name);
  const prefix = preview ? `${clock.month}월 ${clock.day}일 ${clock.time} 일정` : '오늘의 행사 일정';
  return { label: prefix, detail: `${store ? `${store.name} · ` : ''}${names.join(', ') || '아래 전체 행사 일정을 확인해 주세요.'}` };
}
