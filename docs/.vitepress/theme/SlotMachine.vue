<template>
  <span :class="`inline-flex items-baseline ${className}`">
    <span
      v-for="(anims, index) in digitAnimations"
      :key="index"
      class="digit-container"
    >
      <span
        v-for="anim in anims"
        :key="anim.id"
        class="digit-item"
        :class="getAnimationClass(anim)"
        :style="{ animationDuration: `${anim.speed}s` }"
      >
        {{ anim.digit }}
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";

interface Props {
  value: number;
  className?: string;
}

interface DigitAnimation {
  id: string;
  digit: string;
  isLeaving: boolean;
  direction: "up" | "down";
  speed: number;
}

const props = withDefaults(defineProps<Props>(), {
  className: "",
});

const digitAnimations = ref<DigitAnimation[][]>([]);
const prevValue = ref(props.value);
const lastChangeTime = ref(Date.now());
const animationId = ref(0);
const audio = ref<HTMLAudioElement | null>(null);
const audioMidpoint = ref(0);

const getAnimationClass = (anim: DigitAnimation) => {
  if (anim.isLeaving) {
    return anim.direction === "up" ? "slot-leave-up" : "slot-leave-down";
  }
  return anim.direction === "up" ? "slot-enter-up" : "slot-enter-down";
};

// Initialize audio
onMounted(() => {
  if (typeof window === "undefined") return;

  const audioElement = new Audio("/sound/main/t.mp3");
  audioElement.preload = "auto";
  audioElement.volume = 0.5;

  audioElement.addEventListener("loadedmetadata", () => {
    audioMidpoint.value = audioElement.duration / 21;
  });

  audio.value = audioElement;

  // Initialize digit animations
  const digits = String(props.value).split("");
  digitAnimations.value = digits.map((digit) => [
    {
      id: `${animationId.value++}`,
      digit,
      isLeaving: false,
      direction: "up" as const,
      speed: 0.3,
    },
  ]);
});

onUnmounted(() => {
  if (audio.value) {
    audio.value.pause();
    audio.value = null;
  }
});

// Watch for value changes
watch(
  () => props.value,
  (newValue, oldValue) => {
    if (oldValue === newValue) return;

    const currentDigits = String(newValue).split("");
    const previousDigits = String(prevValue.value).split("");

    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTime.value;

    // Play sound effect from midpoint
    if (audio.value) {
      audio.value.currentTime = audioMidpoint.value;
      audio.value.play().catch(() => null);
    }

    // Calculate speed based on how quickly value is changing
    const speed = Math.max(0.15, Math.min(0.4, timeSinceLastChange / 1000));

    const direction: "up" | "down" = newValue > prevValue.value ? "up" : "down";

    // Handle length changes
    const maxLength = Math.max(currentDigits.length, previousDigits.length);
    const newAnimations: DigitAnimation[][] = [];

    for (let i = 0; i < maxLength; i++) {
      // Calculate actual index from the right (to handle length changes)
      const currentIndex = currentDigits.length - maxLength + i;
      const prevIndex = previousDigits.length - maxLength + i;

      const actualCurrentDigit =
        currentIndex >= 0 ? currentDigits[currentIndex] : undefined;
      const actualPrevDigit =
        prevIndex >= 0 ? previousDigits[prevIndex] : undefined;

      const existingAnims = digitAnimations.value[i] || [];

      if (actualCurrentDigit !== actualPrevDigit) {
        const leavingAnims = existingAnims
          .filter(() => actualPrevDigit !== undefined)
          .map((anim) => ({
            ...anim,
            isLeaving: true,
          }));

        if (actualCurrentDigit !== undefined) {
          const newAnim: DigitAnimation = {
            id: `${animationId.value++}`,
            digit: actualCurrentDigit,
            isLeaving: false,
            direction,
            speed,
          };

          newAnimations[i] = [...leavingAnims, newAnim];
        } else {
          newAnimations[i] = leavingAnims;
        }
      } else if (actualCurrentDigit !== undefined) {
        if (existingAnims.length === 0) {
          newAnimations[i] = [
            {
              id: `${animationId.value++}`,
              digit: actualCurrentDigit,
              isLeaving: false,
              direction,
              speed,
            },
          ];
        } else {
          newAnimations[i] = existingAnims;
        }
      }
    }

    // Only use positions that have current digits
    digitAnimations.value = currentDigits.map(
      (_, index) =>
        newAnimations[maxLength - currentDigits.length + index] || []
    );

    lastChangeTime.value = now;
    prevValue.value = newValue;

    // Clean up leaving animations after they complete
    setTimeout(() => {
      digitAnimations.value = digitAnimations.value.map((anims) =>
        anims.filter((anim) => !anim.isLeaving)
      );
    }, 400);
  }
);
</script>

<style scoped>
.digit-container {
  position: relative;
  display: inline-block;
  width: 0.6em;
  height: 0.75em;
  overflow: hidden;
}

.digit-item {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Enter animations (new digit coming in) */
.slot-enter-up {
  animation: slotEnterUp ease-out forwards;
}

.slot-enter-down {
  animation: slotEnterDown ease-out forwards;
}

/* Leave animations (old digit going out) */
.slot-leave-up {
  animation: slotLeaveUp ease-out forwards;
}

.slot-leave-down {
  animation: slotLeaveDown ease-out forwards;
}

/* Keyframes for UP direction */
@keyframes slotEnterUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slotLeaveUp {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

/* Keyframes for DOWN direction */
@keyframes slotEnterDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slotLeaveDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}
</style>
