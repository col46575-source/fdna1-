import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  Fish,
  Info,
  Leaf,
  MapPin,
  MoonStar,
  Plus,
  Share2,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Store as StoreIcon,
  Utensils,
  X,
} from "lucide-react";
import { campaign, getBenefitsForStore, stores } from "./data/campaign";
import type { Benefit, StoreId } from "./data/campaign";
import { getSchedule } from "./lib/schedule";

const benefitIcons = {
  meal: Utensils,
  basket: ShoppingBasket,
  fresh: Leaf,
  river: MoonStar,
};
const shortNames = {
  B01: "맛있는 한 끼",
  B02: "기분 좋은 주말",
  B03: "함께 담는 즐거움",
  B04: "알뜰한 퇴근길",
};

function useCampaignClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      setNow(new Date());
      clearTimeout(timer);
      timer = setTimeout(update, 60_000 - (Date.now() % 60_000) + 20);
    };
    const onVisibility = () => {
      if (!document.hidden) update();
    };
    update();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", update);
    };
  }, []);
  return now;
}

function BrandLogo() {
  const [unavailable, setUnavailable] = useState(false);
  return unavailable ? (
    <span className="brand-fallback">이마트</span>
  ) : (
    <img
      className="brand-logo"
      src="https://eappfront.emart.com/assets/icon-logo-emart.svg?v=f787ff23"
      alt="이마트"
      width="96"
      height="34"
      onError={() => setUnavailable(true)}
    />
  );
}

function BenefitCard({
  benefit,
  status,
}: {
  benefit: Benefit;
  status: { active: boolean; label: string };
}) {
  const Icon = benefitIcons[benefit.icon];
  const [expanded, setExpanded] = useState(false);
  return (
    <article
      className={`benefit-card benefit-${benefit.icon}`}
      data-benefit={benefit.id}
    >
      <div className="benefit-card-top">
        <span className="benefit-category">
          <Icon size={17} strokeWidth={1.8} />
          {shortNames[benefit.id]}
        </span>
        <span
          className={`day-pill ${benefit.id === "B04" ? "river-pill" : ""}`}
        >
          {benefit.id === "B01"
            ? "월–목"
            : benefit.id === "B02"
              ? "금–일"
              : benefit.id === "B04"
                ? "리버점 단독"
                : "매일"}
        </span>
      </div>
      <h3>{benefit.title}</h3>
      <div className="benefit-value">
        {benefit.displayValue}
        <span>{benefit.displayUnit}</span>
        <span className="discount-label">
          {benefit.id === "B02" ? "즉시 할인" : "할인"}
        </span>
      </div>
      <div className="benefit-body">
        <p className="benefit-target">{benefit.description}</p>
        <ul className="core-conditions">
          {benefit.coreConditions.map((condition) => (
            <li key={condition}>
              <Check size={15} />
              <span>{condition}</span>
            </li>
          ))}
        </ul>
        {benefit.earlyEndNotice && (
          <p className="early-end">
            <Info size={14} />
            {benefit.earlyEndNotice}
          </p>
        )}
      </div>
      <div className={`schedule-line ${status.active ? "is-active" : ""}`}>
        <Clock3 size={15} />
        <span>{status.label}</span>
      </div>
      <div className="benefit-details">
        <button
          className="detail-toggle"
          aria-expanded={expanded}
          aria-controls={`detail-${benefit.id}`}
          onClick={() => setExpanded(!expanded)}
        >
          <span>자세한 할인 조건</span>
          <Plus size={18} className={expanded ? "rotated" : ""} />
        </button>
        <div
          id={`detail-${benefit.id}`}
          hidden={!expanded}
          className="detail-content"
        >
          <ul>
            {benefit.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <p className="confirmation">
            <Info size={14} />
            <span>{benefit.confirmationNotice}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

const faqs = [
  {
    q: "어느 점포에서 받을 수 있나요?",
    a: "식사 콤보, 주말 혜택, 함께 사면 할인은 센트럴점·파크점·리버점에서 진행해요. 퇴근길 20% 할인은 리버점에서만 진행합니다. 행사 표시 상품에 한해 적용되며, 방문 전 공식 점포 안내를 확인해 주세요.",
  },
  {
    q: "신선식품도 15% 할인되나요?",
    a: "「매일 함께 사면」의 15% 할인 대상은 지정 가공식품이에요. 행사 신선식품을 10,000원 이상 구매하면 지정 즉석밥·참치·멸치를 최대 2개까지 할인받는 행사입니다. 정확한 대상 상품과 금액 산정 기준은 매장 안내를 확인해 주세요.",
  },
  {
    q: "다른 할인과 함께 받을 수 있나요?",
    a: "식사 콤보는 다른 쿠폰 및 기존 수량 할인과 중복 적용할 수 없어요. 나머지 행사와의 중복 적용 여부와 적용 순서는 확인 중입니다. 계산 전 매장 안내를 확인해 주세요.",
  },
  {
    q: "퇴근길 행사 상품이 품절되면 어떻게 되나요?",
    a: "리버점 퇴근길 할인은 준비 수량 소진 시 조기 종료됩니다. 이 페이지에서는 실시간 재고를 확인할 수 없어요. 행사 표시 상품과 남은 수량은 매장에서 확인해 주세요.",
  },
];

export default function App() {
  const [selectedStoreId, setSelectedStoreId] = useState<StoreId | undefined>();
  const [toast, setToast] = useState("");
  const now = useCampaignClock();
  const selectedStore = stores.find((store) => store.id === selectedStoreId);
  const schedule = getSchedule(now, selectedStore);
  const visibleBenefits = getBenefitsForStore(selectedStoreId);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const notify = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  };
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: document.title,
          text: "이마트 고래잇! 11월 장보기 혜택을 확인해 보세요.",
          url: window.location.href,
        });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        notify("행사 페이지 링크를 복사했어요.");
      } else notify("주소창의 링크를 복사해 공유해 주세요.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        notify("공유하지 못했어요. 주소창의 링크를 복사해 주세요.");
    }
  };
  const goTo = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  const stickyLabel =
    schedule.phase === "ended"
      ? "종료된 행사 내용 보기"
      : schedule.phase === "before"
        ? "행사 혜택 미리 보기"
        : selectedStore
          ? `${selectedStore.name} 혜택 보기`
          : "내 점포 혜택 보기";

  return (
    <>
      <a className="skip-link" href="#benefits">
        혜택 본문으로 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner container">
          <a className="brand" href="#" aria-label="이마트 11월 행사 처음으로">
            <BrandLogo />
            <span className="header-divider" />
            <span className="header-campaign">11월의 장보기</span>
          </a>
          <nav aria-label="주요 메뉴">
            <a href="#benefits">혜택 모아보기</a>
            <a href="#how-to">이용 안내</a>
            <a href="#faq">자주 묻는 질문</a>
          </nav>
          <button className="header-store" onClick={() => goTo("stores")}>
            <MapPin size={16} />
            <span>{selectedStore?.name ?? "내 점포 선택"}</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      <main>
        {schedule.phase === "ended" && (
          <div className="ended-banner" role="status">
            이번 행사가 종료되었어요. 아래에서 지난 행사 내용을 확인할 수
            있어요.
          </div>
        )}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-inner container">
            <div className="hero-copy">
              <div className="campaign-eyebrow">
                <span className="tiny-sparkle">✳</span> 이마트 고래잇! 알뜰한
                11월 장보기
              </div>
              <h1 id="hero-title">
                11월 장보기
                <br />
                <span>
                  혜택을 한눈에<span className="title-dot">.</span>
                </span>
              </h1>
              <p className="hero-description">
                식사 콤보부터 주말 할인까지,
                <br />
                이번 달도 맛있게, 알뜰하게 장봐요.
              </p>
              <div className="hero-date">
                <CalendarDays size={17} />
                <strong>
                  2026.11.02<span>월</span> – 11.29<span>일</span>
                </strong>
                <span className="duration">28일간</span>
              </div>
              <button className="primary-button" onClick={() => goTo("stores")}>
                내 점포 혜택 보기
                <ArrowDown size={18} />
              </button>
              <p className="hero-stores">
                센트럴점<span>·</span>파크점<span>·</span>리버점
              </p>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-orbit" />
              <img
                src={`${import.meta.env.BASE_URL}images/whale-groceries.webp`}
                alt=""
                width="720"
                height="600"
                fetchPriority="high"
                className="hero-art"
              />
              <span className="floating-label label-top">
                <Sparkles size={17} /> 알뜰함을 가득 담아!
              </span>
              <span className="floating-label label-bottom">
                <ShoppingBag size={17} /> 오늘도 맛있는 발견
              </span>
              <span className="hero-star star-one">✦</span>
              <span className="hero-star star-two">✧</span>
            </div>
          </div>
          <div className="hero-wave" aria-hidden="true">
            <svg viewBox="0 0 1440 48" preserveAspectRatio="none">
              <path
                d="M0 28Q180 0 360 25T720 25T1080 25T1440 20V48H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        <section
          className="store-section container"
          id="stores"
          aria-labelledby="store-title"
        >
          <div className="store-heading">
            <div>
              <p className="section-eyebrow">나의 장보기, 나의 혜택</p>
              <h2 id="store-title">어느 점포로 장보러 가세요?</h2>
            </div>
            <span className="no-location">
              <MapPin size={15} /> 위치 권한 없이 선택해요
            </span>
          </div>
          <div
            className="store-options"
            role="group"
            aria-label="방문 점포 선택"
          >
            {stores.map((store) => (
              <button
                key={store.id}
                className={`store-option ${selectedStoreId === store.id ? "selected" : ""}`}
                aria-pressed={selectedStoreId === store.id}
                onClick={() => setSelectedStoreId(store.id)}
              >
                <span className="store-option-icon">
                  <StoreIcon size={23} strokeWidth={1.5} />
                </span>
                <span className="store-option-text">
                  <strong>{store.name}</strong>
                  <span>
                    {store.id === "river"
                      ? "퇴근길 전용 혜택까지"
                      : "11월 공통 혜택"}
                  </span>
                </span>
                <span className="store-radio">
                  {selectedStoreId === store.id && (
                    <Check size={15} strokeWidth={3} />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="store-summary" aria-live="polite">
            <Info size={15} />
            <p>
              {selectedStore ? (
                <>
                  <strong>{selectedStore.name}</strong> 혜택{" "}
                  {visibleBenefits.length}가지를 모았어요.{" "}
                </>
              ) : (
                <>점포를 선택하면 해당 점포의 혜택을 확인할 수 있어요. </>
              )}
              <span>영업시간과 휴점일은 공식 점포 안내에서 확인해 주세요.</span>
            </p>
            <a
              href={selectedStore?.storeUrl ?? campaign.storeFinderUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              공식 점포찾기
              <ArrowUpRight size={15} />
            </a>
          </div>
        </section>

        <section
          className="benefits-section"
          id="benefits"
          aria-labelledby="benefits-title"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow blue">놓치지 마세요</p>
                <h2 id="benefits-title">11월엔, 이렇게 알뜰하게</h2>
                <p className="section-description">
                  필요한 만큼 담고, 나에게 맞는 혜택을 확인해 보세요.
                </p>
              </div>
              <button
                className="share-button"
                aria-label="혜택 공유하기"
                onClick={share}
              >
                <Share2 size={17} />
                <span>혜택 공유하기</span>
              </button>
            </div>
            <div
              className={`schedule-banner ${schedule.phase === "active" ? "campaign-active" : ""}`}
              role="status"
            >
              <span className="schedule-icon">
                <CalendarDays size={20} />
              </span>
              <div>
                <strong>{schedule.headline}</strong>
                <p>
                  {schedule.phase === "before"
                    ? "지금은 미리 둘러보세요. 행사 일정은 한국 시간을 기준으로 안내해요."
                    : schedule.phase === "ended"
                      ? "행사 기간: 2026.11.02–11.29 · 현재 행사 시간 안내가 종료되었어요."
                      : schedule.storeStatusLabel}
                </p>
              </div>
              <span className="schedule-period">11.02 – 11.29</span>
            </div>
            <div className="benefits-context">
              <span>
                {selectedStore ? (
                  <>
                    <MapPin size={14} />
                    <strong>{selectedStore.name}</strong>의 혜택
                  </>
                ) : (
                  "전체 점포 혜택"
                )}
                <span className="count">{visibleBenefits.length}</span>
              </span>
              <span className="review-tag">조건 확인 중 · 검토용</span>
            </div>
            <div className="benefit-grid">
              {visibleBenefits.map((benefit) => (
                <BenefitCard
                  key={benefit.id}
                  benefit={benefit}
                  status={schedule.benefitStatuses[benefit.id]}
                />
              ))}
            </div>
            <p className="benefit-footnote">
              <Info size={14} /> 행사 표시 상품에 한해 적용돼요. 자세한 대상
              상품과 적용 조건은 매장 안내를 확인해 주세요.
            </p>
          </div>
        </section>

        <section
          className="how-section container"
          id="how-to"
          aria-labelledby="how-title"
        >
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">장보기 전, 가볍게 확인</p>
              <h2 id="how-title">혜택 이용은 이렇게</h2>
            </div>
            <span className="how-caption">세 가지만 기억해 주세요</span>
          </div>
          <div className="how-grid">
            <div className="how-step">
              <span className="step-icon">
                <ShoppingBag size={29} strokeWidth={1.6} />
              </span>
              <span className="step-number">STEP 01</span>
              <h3>행사 표시 상품 찾기</h3>
              <p>
                매장에서 행사 표시가 있는
                <br />
                대상 상품을 확인해 주세요.
              </p>
            </div>
            <ChevronRight className="step-arrow" size={21} />
            <div className="how-step">
              <span className="step-icon">
                <Clock3 size={29} strokeWidth={1.6} />
              </span>
              <span className="step-number">STEP 02</span>
              <h3>구매 조건 살펴보기</h3>
              <p>
                상품 조합과 구매 금액,
                <br />
                행사 요일·시간을 확인해 주세요.
              </p>
            </div>
            <ChevronRight className="step-arrow" size={21} />
            <div className="how-step">
              <span className="step-icon">
                <Check size={30} strokeWidth={1.6} />
              </span>
              <span className="step-number">STEP 03</span>
              <h3>계산 전 한 번 더 확인</h3>
              <p>
                결제 전 매장 안내에 따라
                <br />
                할인 적용 조건을 확인해 주세요.
              </p>
            </div>
          </div>
        </section>

        <section
          className="faq-section container"
          id="faq"
          aria-labelledby="faq-title"
        >
          <div className="faq-intro">
            <p className="section-eyebrow blue">궁금한 점이 있나요?</p>
            <h2 id="faq-title">
              쉽게 확인하는
              <br />
              장보기 혜택
            </h2>
            <p>
              방문 전 궁금한 내용을
              <br />
              미리 확인해 보세요.
            </p>
            <div className="faq-doodle" aria-hidden="true">
              <Fish size={58} strokeWidth={1.1} />
              <span>?</span>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.q}>
                <summary>
                  <span className="q-label">Q.</span>
                  <span>{faq.q}</span>
                  <ChevronDown size={19} />
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className="notices-section container"
          aria-labelledby="notice-title"
        >
          <details className="notice-details">
            <summary>
              <span>
                <Info size={18} />
                <strong id="notice-title">꼭 확인해 주세요</strong>
              </span>
              <span className="notice-summary-label">
                행사 유의사항
                <ChevronDown size={18} />
              </span>
            </summary>
            <div className="notice-body">
              <ul>
                {campaign.commonNotices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
                <li>
                  식사 콤보는 월~목 기준으로 안내하고 있어요. 금요일 포함 여부와
                  할인 대상 금액 범위는 확인 중입니다.
                </li>
                <li>
                  주말 할인은 다른 상품 할인 적용 후, 이번 2,000원 할인 적용 전
                  35,000원 이상인 단일 영수증 기준입니다. 영수증 합산은
                  불가합니다.
                </li>
                <li>
                  연계 구매의 15% 할인 대상은 지정 가공식품이며, 신선식품 전체에
                  적용되는 할인이 아닙니다. 정확한 대상 상품과 최대 2개의 합산
                  방식은 확인 중입니다.
                </li>
                <li>
                  리버점 퇴근길 할인은 매일 17:00~20:00에 진행되며 준비 수량
                  소진 시 조기 종료됩니다.
                </li>
                <li>
                  센트럴점·파크점·리버점의 실제 점포 ID, 영업시간과 휴점일
                  정보는 미확정입니다. 공식 점포찾기에서 방문 정보를 확인해
                  주세요.
                </li>
                <li>
                  본 페이지는 PRD v0.2를 바탕으로 한 검토용 시안입니다. 미확정
                  조건은 실제 고객 공개 전 확인이 필요합니다.
                </li>
                <li>
                  고래와 장보기 이미지는 캠페인 분위기를 위한 예시 일러스트이며,
                  실제 행사 대상 상품을 의미하지 않습니다.
                </li>
              </ul>
            </div>
          </details>
        </section>

        <div className="closing-banner">
          <div className="container">
            <span className="closing-flower">✳</span>
            <p>
              오늘도 맛있게, <strong>알뜰하게!</strong>
            </p>
            <span>11월의 장보기도 이마트와 함께</span>
            <ShoppingBasket size={38} strokeWidth={1.5} />
          </div>
        </div>
      </main>

      <footer className="site-footer container">
        <div>
          <span className="footer-brand">이마트</span>
          <span>이마트 고래잇! 알뜰한 11월 장보기</span>
        </div>
        <a
          href={campaign.storeFinderUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          이마트 공식 점포찾기
          <ExternalLink size={13} />
        </a>
        <p>© 2026 EMART. 프로모션 페이지 검토용 시안.</p>
      </footer>
      <div className="mobile-action">
        <div>
          <MapPin size={16} />
          <span>{selectedStore?.name ?? "방문 점포를 선택해 주세요"}</span>
        </div>
        <button onClick={() => goTo(selectedStoreId ? "benefits" : "stores")}>
          {stickyLabel}
          <ArrowRight size={17} />
        </button>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="알림 닫기" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
