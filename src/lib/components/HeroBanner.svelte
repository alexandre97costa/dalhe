<script lang="ts">
  type HeroBannerInput = {
    label: string;
    duration: string;
    title: string;
    target: string;
    laps: string;
    car: string;
    cta: string;
  };

  export let data: HeroBannerInput = {
    label: "TODAY'S CHALLENGE",
    duration: "~15 min",
    title: "Circuit de Spa",
    target: "02:16.840",
    laps: "5 laps maximum",
    car: "Porsche 992 GT3 R",
    cta: "Start today's session"
  };
</script>

<div class="hero-banner" aria-label="Challenge banner">
  <div class="header-row">
    <span class="eyebrow">{data.label}</span>

    <div class="timer-pill" aria-label="Challenge duration">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="M12 7.5v5l3.4 2.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{data.duration}</span>
    </div>
  </div>

  <h1>{data.title}</h1>
  <p class="target">Target: {data.target}</p>

  <div class="stats-row">
    <div class="stat-item">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13.5c1.8-3.8 4.5-5.8 8.1-5.8 0 0 6.8.2 8.8 5.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4.8 15.5h14.4M7.8 18.4h8.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="8" cy="10" r="1.4" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="16" cy="10" r="1.4" fill="none" stroke="currentColor" stroke-width="1.8"/>
      </svg>
      <span>{data.laps}</span>
    </div>

    <div class="stat-item">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 14.5l4.4-6.1h6.3l2.1 2.8h2.1l1.1 3.3H4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="8" cy="16.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="17" cy="16.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>
      </svg>
      <span>{data.car}</span>
    </div>
  </div>

  <button type="button" class="cta">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor"/>
    </svg>
    <span>{data.cta}</span>
  </button>
</div>

<style>
  .hero-banner {
    width: min(100%, 620px);
    background: linear-gradient(135deg, #ff9a3d 0%, #f57a1d 100%);
    border-radius: 30px;
    padding: 20px 22px 18px;
    color: #fff7f2;
    box-shadow: 0 18px 30px rgba(230, 111, 26, 0.18);
    font-family: Inter, "Segoe UI", sans-serif;
    box-sizing: border-box;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 14px;
  }

  .eyebrow {
    font-size: 1.05rem;
    letter-spacing: 0.04em;
    font-weight: 800;
    text-transform: uppercase;
    color: rgba(255, 247, 242, 0.95);
    line-height: 1.2;
  }

  .timer-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 18px 0 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.24);
    color: #fff7f2;
    font-weight: 700;
    font-size: 1.05rem;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
  }

  .timer-pill svg {
    width: 19px;
    height: 19px;
    flex-shrink: 0;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.3rem, 4vw, 3.3rem);
    line-height: 1.05;
    letter-spacing: -0.06em;
    font-weight: 900;
    color: #fffaf6;
  }

  .target {
    margin: 10px 0 20px;
    font-size: clamp(1.2rem, 2vw, 1.7rem);
    font-weight: 700;
    letter-spacing: -0.04em;
    color: rgba(255, 247, 242, 0.96);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 54px;
    padding: 0 18px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
    color: #fffaf7;
    font-size: clamp(0.98rem, 1.6vw, 1.28rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    text-align: center;
  }

  .stat-item svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  .cta {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border: 0;
    border-radius: 999px;
    min-height: 62px;
    background: rgba(255, 250, 247, 0.96);
    color: #f57a1d;
    font-size: clamp(1.1rem, 2vw, 1.5rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    cursor: pointer;
    box-shadow: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(255, 255, 255, 0.18);
  }

  .cta svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  @media (max-width: 560px) {
    .hero-banner {
      padding: 16px 16px 14px;
      border-radius: 24px;
    }

    .header-row {
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .eyebrow {
      font-size: 0.78rem;
    }

    .timer-pill {
      min-height: 36px;
      padding: 0 12px 0 10px;
      font-size: 0.9rem;
    }

    .stats-row {
      grid-template-columns: 1fr;
    }

    .stat-item {
      justify-content: flex-start;
      padding: 0 16px;
      min-height: 48px;
      font-size: 1rem;
    }

    .cta {
      min-height: 54px;
    }
  }
</style>
