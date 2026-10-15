import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { CAMPAIGN, STORES, BENEFITS, koreanClock, campaignPhase, visibleBenefits, benefitState, previewDate, storeState, announcement } from '../dist/campaign.mjs';

const date = value => new Date(`${value}+09:00`);
const b = id => BENEFITS.find(item => item.id === id);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

test('T01 행사 시작 전은 한국 자정까지 유지된다', () => {
  assert.equal(campaignPhase(date('2026-11-01T23:59:59')), 'upcoming');
  assert.equal(campaignPhase(date('2026-11-02T00:00:00')), 'active');
});
test('T02 식사 콤보 점심은 11시 30분에 시작된다', () => {
  assert.equal(benefitState(b('B01'), 'central', date('2026-11-02T11:29:59')), 'different-time');
  assert.equal(benefitState(b('B01'), 'central', date('2026-11-02T11:30:00')), 'scheduled-time');
});
test('T03 점심 종료 경계는 13시 30분이다', () => {
  assert.equal(benefitState(b('B01'), 'central', date('2026-11-02T13:29:59')), 'scheduled-time');
  assert.equal(benefitState(b('B01'), 'central', date('2026-11-02T13:30:00')), 'different-time');
});
test('T04 저녁 시작과 종료 경계를 지킨다', () => {
  assert.equal(benefitState(b('B01'), 'park', date('2026-11-02T17:30:00')), 'scheduled-time');
  assert.equal(benefitState(b('B01'), 'park', date('2026-11-02T19:30:00')), 'different-time');
});
test('T05 금요일은 주말 혜택이며 식사 콤보 요일이 아니다', () => {
  assert.equal(benefitState(b('B01'), 'central', date('2026-11-06T12:00:00')), 'different-day');
  assert.equal(benefitState(b('B02'), 'central', date('2026-11-06T12:00:00')), 'scheduled-day');
});
test('T06 토요일에는 주말 및 함께 구매 일정을 보여준다', () => {
  for (const id of ['B02', 'B03']) assert.equal(benefitState(b(id), 'central', date('2026-11-07T18:00:00')), 'scheduled-day');
});
test('T07 미선택과 리버점은 4개, 다른 점포는 3개다', () => {
  assert.equal(visibleBenefits().length, 4);
  assert.equal(visibleBenefits('river').length, 4);
  assert.equal(visibleBenefits('central').length, 3);
  assert.equal(visibleBenefits('park').length, 3);
  assert.ok(!visibleBenefits('central').some(item => item.id === 'B04'));
  assert.deepEqual(visibleBenefits('unknown'), []);
});
test('T08 퇴근길 행사는 리버점에서 17시 이상 20시 미만이다', () => {
  assert.equal(benefitState(b('B04'), 'river', date('2026-11-06T16:59:59')), 'different-time');
  assert.equal(benefitState(b('B04'), 'river', date('2026-11-06T17:00:00')), 'scheduled-time');
  assert.equal(benefitState(b('B04'), 'river', date('2026-11-06T20:00:00')), 'different-time');
  assert.equal(benefitState(b('B04'), 'central', date('2026-11-06T18:00:00')), 'unavailable-store');
});
test('T09 11월 29일 끝까지 진행하고 30일 한국 자정에 종료한다', () => {
  assert.equal(campaignPhase(date('2026-11-29T23:59:59')), 'active');
  assert.equal(campaignPhase(date('2026-11-30T00:00:00')), 'ended');
  assert.equal(benefitState(b('B03'), 'river', date('2026-11-30T00:00:00')), 'ended');
});
test('T10 같은 시각은 기기 또는 입력 시간대와 무관하게 한국 기준이다', () => {
  const local = date('2026-11-06T18:00:00');
  const utc = new Date('2026-11-06T09:00:00Z');
  const newYork = new Date('2026-11-06T04:00:00-05:00');
  assert.deepEqual(koreanClock(local), koreanClock(utc));
  assert.deepEqual(koreanClock(local), koreanClock(newYork));
  assert.equal(koreanClock(utc).weekday, 5);
  assert.equal(CAMPAIGN.timezone, 'Asia/Seoul');
});
test('T11 모바일과 키보드를 위한 핵심 마크업이 존재한다', () => {
  const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
  const css = readFileSync(resolve(root, 'dist/styles.css'), 'utf8');
  const buttons = html.match(/<button[^>]+data-store="[^\"]+"[^>]*>/g) ?? [];
  assert.equal(buttons.length, 3);
  for (const button of buttons) assert.match(button, /aria-pressed="false"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<dialog[^>]+aria-labelledby="preview-title"/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width:374px/);
});
test('T12 구매 금액 산정 및 가공식품 대상이 카드 앞면에 명시된다', () => {
  const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
  const weekend = html.split('data-benefit="B02"')[1].split('<details')[0];
  const together = html.split('data-benefit="B03"')[1].split('<details')[0];
  assert.match(weekend, /35,000원 이상/);
  assert.match(weekend, /다른 상품 할인 적용 후/);
  assert.match(weekend, /단일 영수증/);
  assert.match(together, /지정 가공식품/);
  assert.match(together, /최대 2개/);
});
test('T13 검증된 휴점일은 행사 시간보다 우선한다', () => {
  const store = { id: 'river', verified: true, closedDates: ['2026-11-06'], businessHours: { open: 600, close: 1380 } };
  assert.equal(storeState(store, date('2026-11-06T18:00:00')), 'closed');
  assert.equal(benefitState(b('B04'), 'river', date('2026-11-06T18:00:00'), store), 'closed');
  assert.equal(benefitState(b('B04'), 'river', date('2026-11-01T18:00:00'), store), 'upcoming');
});
test('T14 영업 정보가 없으면 영업중을 확정하지 않으며 공식 원본 로고를 사용한다', () => {
  for (const store of STORES) assert.equal(storeState(store, date('2026-11-06T18:00:00')), 'unverified');
  const logo = readFileSync(resolve(root, 'dist/assets/emart-logo.svg'), 'utf8');
  assert.match(logo, /width="96" height="28"/);
  assert.match(logo, /#FAB601/i);
  assert.match(logo, /#222222/i);
});
test('방문일 미리보기는 유효한 행사 기간만 허용한다', () => {
  assert.equal(previewDate('2026-11-06', '18:00').toISOString(), '2026-11-06T09:00:00.000Z');
  assert.equal(previewDate('2026-11-01', '18:00'), null);
  assert.equal(previewDate('2026-11-30', '18:00'), null);
  assert.equal(previewDate('2026-11-06', '24:00'), null);
  assert.equal(previewDate('2026-11-06', '18:90'), null);
  assert.equal(previewDate('invalid', '18:00'), null);
  assert.equal(previewDate('2026-11-06', '<script>'), null);
});
test('시간 정보가 검증되면 영업시간 밖의 강조를 해제한다', () => {
  const store = { verified: true, closedDates: [], businessHours: { open: 600, close: 1140 } };
  assert.equal(storeState(store, date('2026-11-06T19:00:00')), 'outside-hours');
  assert.equal(benefitState(b('B04'), 'river', date('2026-11-06T19:00:00'), store), 'outside-hours');
});
test('전체 점포 요약에서도 리버점 전용 행사를 구분한다', () => {
  const result = announcement(null, date('2026-11-06T18:00:00'), true);
  assert.match(result.label, /11월 6일 18:00/);
  assert.match(result.detail, /리버점 퇴근길/);
});
test('페이지 내부 이동과 앱의 필수 선택 대상이 모두 존재한다', () => {
  const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^\"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate HTML id');
  const targets = [...html.matchAll(/(?:href="#|data-scroll=")([^\"]+)"/g)].map(m => m[1]);
  for (const target of targets) assert.ok(ids.includes(target), `missing internal target ${target}`);
  const js = readFileSync(resolve(root, 'dist/app.mjs'), 'utf8');
  for (const m of js.matchAll(/\$\('#([^']+)'\)/g)) assert.ok(ids.includes(m[1]), `missing app target ${m[1]}`);
  const localResources = [...html.matchAll(/(?:src|href)="([^\"]+)"/g)].map(m => m[1]).filter(u => !/^(?:https?:|#)/.test(u));
  for (const resource of localResources) assert.ok(existsSync(resolve(root, 'dist', resource)), `missing file ${resource}`);
});
test('초기 화면 자산이 PRD의 2 MB 전송 예산 이내다', () => {
  const assets = readdirSync(resolve(root, 'dist/assets')).filter(f => /\.(?:webp|svg|woff)$/.test(f));
  const bytes = assets.reduce((sum, file) => sum + statSync(resolve(root, 'dist/assets', file)).size, 0);
  const textBytes = ['index.html', 'styles.css', 'app.mjs', 'campaign.mjs'].reduce((sum, file) => sum + statSync(resolve(root, 'dist', file)).size, 0);
  assert.ok(bytes + textBytes < 2_000_000, `initial payload ${bytes + textBytes} bytes`);
});
