import { BENEFITS, STORES, announcement, benefitState, campaignPhase, koreanClock, previewDate, visibleBenefits } from './campaign.mjs';

let selectedStore = null;
let selectedPreview = null;
let toastTimer;
const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const now = () => selectedPreview ?? new Date();
const names = { B01: '점심·저녁을 알뜰하게', B02: '주말 장보기도 가볍게', B03: '함께 담으면 더 알뜰하게', B04: '퇴근길, 오늘의 알뜰함' };
const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200);
}

function scrollToSection(id) {
  const node = document.getElementById(id);
  if (!node) return;
  node.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}

function render() {
  const store = STORES.find(item => item.id === selectedStore);
  const date = now();
  const visible = visibleBenefits(selectedStore).map(b => b.id);
  all('[data-store]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.store === selectedStore)));
  $('#header-store').textContent = store?.name ?? '내 점포 선택';
  $('#clear-store').hidden = !store;
  $('#benefit-description').textContent = store ? `${store.name}의 행사 ${visible.length}가지를 확인하세요.` : '세 점포 공통 행사와 리버점 단독 혜택을 확인하세요.';
  const current = announcement(selectedStore, date, Boolean(selectedPreview));
  setText($('#schedule-title'), current.label);
  setText($('#schedule-detail'), current.detail);
  $('.schedule-banner').classList.toggle('is-preview', Boolean(selectedPreview));
  $('#preview-reset').hidden = !selectedPreview;
  $('.period-label').hidden = Boolean(selectedPreview);
  const phase = campaignPhase(date);
  all('[data-benefit]').forEach(card => {
    const id = card.dataset.benefit;
    card.hidden = !visible.includes(id);
    const benefit = BENEFITS.find(item => item.id === id);
    const state = benefitState(benefit, selectedStore, date);
    const label = card.querySelector('[data-state-label]');
    label.classList.toggle('time-active', state === 'scheduled-time');
    if (state === 'scheduled-time') label.textContent = selectedPreview ? '미리보기 · 행사 시간대' : '일정상 행사 시간대';
    else if (state === 'ended') label.textContent = '종료된 행사';
    else if (state === 'closed') label.textContent = '선택 점포 휴점일';
    else if (state === 'outside-hours') label.textContent = '점포 영업시간 외';
    else label.textContent = names[id];
  });
  const cta = $('#mobile-cta');
  const ctaText = !store ? '내 점포 혜택 보기' : phase === 'upcoming' ? `${store.name} 혜택 미리 보기` : phase === 'ended' ? '종료된 행사 확인하기' : `${store.name} 혜택 보기`;
  cta.replaceChildren(document.createTextNode(ctaText));
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'icon');
  icon.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-arrow');
  icon.append(use); cta.append(icon);
  const clock = koreanClock(date);
  $('#preview-button-label').textContent = selectedPreview ? `${clock.month}/${clock.day} ${clock.time} · 미리보기 변경` : '방문일 혜택 미리 보기';
}

all('[data-scroll]').forEach(button => button.addEventListener('click', () => scrollToSection(button.dataset.scroll)));
all('[data-store]').forEach(button => button.addEventListener('click', () => {
  selectedStore = button.dataset.store;
  render();
  const store = STORES.find(item => item.id === selectedStore);
  $('#store-feedback').textContent = `${store.name}을 선택했습니다. 행사 ${visibleBenefits(selectedStore).length}가지를 확인할 수 있습니다.`;
}));
$('#clear-store').addEventListener('click', () => { selectedStore = null; render(); $('#store-feedback').textContent = '전체 점포의 행사 4가지를 표시합니다.'; });
$('#mobile-cta').addEventListener('click', () => scrollToSection(selectedStore ? 'benefits' : 'stores'));

const dialog = $('#preview-dialog');
$('#preview-open').addEventListener('click', () => { $('#preview-error').textContent = ''; dialog.showModal(); });
$('[data-close-dialog]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } });
$('#preview-form').addEventListener('submit', event => {
  event.preventDefault();
  const value = previewDate($('#preview-date').value, $('#preview-time').value);
  if (!value) { $('#preview-error').textContent = '11월 2일~29일 사이 날짜와 올바른 시간을 선택해 주세요.'; return; }
  selectedPreview = value; render(); dialog.close(); scrollToSection('benefits');
});
$('#preview-reset').addEventListener('click', () => { selectedPreview = null; render(); toast('오늘 날짜 기준으로 돌아왔어요.'); });

all('.share-button').forEach(button => button.addEventListener('click', async () => {
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) { await navigator.share({ title: document.title, text: '11월 장보기 혜택을 함께 확인해 보세요.', url }); return; }
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); toast('프로모션 링크를 복사했어요.'); return; }
    window.prompt('아래 프로모션 주소를 복사해 주세요.', url);
  } catch (error) {
    if (error.name !== 'AbortError') window.prompt('공유할 주소를 복사해 주세요.', url);
  }
}));

// Decorative icons are hidden from screen readers; labelled illustration containers remain meaningful.
all('svg.icon').forEach(icon => icon.setAttribute('aria-hidden', 'true'));
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
function scheduleMinuteRefresh() {
  setTimeout(() => { render(); scheduleMinuteRefresh(); }, 60_000 - Date.now() % 60_000 + 30);
}
scheduleMinuteRefresh();
render();
