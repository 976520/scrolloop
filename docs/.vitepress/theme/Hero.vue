<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import SlotMachine from "./SlotMachine.vue";

const millionsCount = ref(0);
const kbCount = ref(0);

const animateCountUp = (targetValue, duration, callback) => {
  const startTime = performance.now();
  const startValue = 0;

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeInOutCubic =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const currentValue = Math.floor(
      startValue + (targetValue - startValue) * easeInOutCubic
    );
    callback(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      callback(targetValue);
    }
  };

  requestAnimationFrame(animate);
};

const startInitialAnimation = () => {
  animateCountUp(42, 1500, (value) => {
    kbCount.value = value;
  });

  animateCountUp(1048596, 2500, (value) => {
    millionsCount.value = value;
    if (value >= 1048596) {
      if (!window.__incrementStarted) {
        window.__incrementStarted = true;
        setInterval(() => {
          millionsCount.value += Math.floor(Math.random() * 8) + 2;
        }, 100);
      }
    }
  });
};

const scrolled = ref(false);

const handleScroll = () => {
  scrolled.value = window.scrollY > 50;
};

onMounted(() => {
  startInitialAnimation();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <section class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title animate-on-scroll fade-up">
        <span class="gradient-text">scrolloop</span>
      </h1>

      <p class="hero-tagline animate-on-scroll fade-up delay-100">
        <SlotMachine
          :value="millionsCount"
          class-name="counter-wrapper"
        />+ of items.
        <SlotMachine :value="kbCount" class-name="counter-wrapper" />KB
        of code.
        <span class="highlight">Zero lag.</span>
      </p>

      <p class="hero-desc animate-on-scroll fade-up delay-200">
        The ultimate virtual scrolling component for React and React Native.<br />
        Lightweight, Zero dependencies, and blazingly fast.
      </p>

      <div class="hero-actions animate-on-scroll fade-up delay-300">
        <a href="/guide/quick-start" class="btn primary glow-on-hover">
          <span>Get Started</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3L11 8L6 13"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </a>
        <a
          href="https://github.com/976520/scrolloop"
          target="_blank"
          class="btn secondary glass"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </div>

    <div
      class="scroll-indicator animate-on-scroll fade-in delay-500"
      :class="{ scrolled: scrolled }"
    >
      <div class="scroll-icon">
        <div class="scroll-wheel"></div>
      </div>
      <span>Scroll to explore</span>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1.5rem;
  position: relative;
  z-index: 2;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: 900;
  line-height: 1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 5s ease infinite;
}

@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.hero-tagline {
  font-size: clamp(1.25rem, 3vw, 2rem);
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #e4e4e7;
  line-height: 1.4;
}
.highlight {
  color: #a78bfa;
  text-shadow: 0 0 20px rgba(167, 139, 250, 0.5);
}

.hero-desc {
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
  color: #a1a1aa;
  margin-bottom: 3rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.6);
}

.btn.primary::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s;
}

.btn.primary:hover::before {
  left: 100%;
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e4e4e7;
  backdrop-filter: blur(10px);
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.scroll-indicator {
  position: absolute;
  bottom: 12rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #71717a;
  font-size: 0.875rem;
  animation: bounce 2s infinite;
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.scroll-indicator.scrolled {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(20px);
  animation: none;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-10px);
  }
}

.scroll-icon {
  width: 24px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
}

.scroll-wheel {
  width: 4px;
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  animation: scroll-wheel 2s infinite;
}

@keyframes scroll-wheel {
  0% {
    top: 8px;
    opacity: 1;
  }
  100% {
    top: 24px;
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 100vh;
    padding: 4rem 1rem;
  }
  .scroll-indicator {
    bottom: 2rem;
  }
}

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

.delay-100 {
  transition-delay: 0.1s;
}
.delay-200 {
  transition-delay: 0.2s;
}
.delay-300 {
  transition-delay: 0.3s;
}
.delay-400 {
  transition-delay: 0.4s;
}
.delay-500 {
  transition-delay: 0.5s;
}

.fade-up {
  transform: translateY(40px);
}
.fade-in {
  transform: translateY(0);
}
</style>
