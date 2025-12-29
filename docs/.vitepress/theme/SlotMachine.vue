<template>
  <span :class="`inline-flex items-center ${className}`">
    <span
      v-for="(anims, index) in digitAnimations"
      :key="index"
      class="digit-container"
    >
      <span
        class="digit-strip"
        :key="anims.map(a => a.id).join('-')"
        :class="getStripClass(anims)"
        :style="getStripStyle(anims)"
      >
        <span
          v-for="anim in anims"
          :key="anim.id"
          class="digit-item"
        >
          {{ anim.digit }}
        </span>
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
const cleanupTimer = ref<any>(null);

const audio = ref<HTMLAudioElement | null>(null);
const audioMidpoint = ref(0);

const getStripClass = (anims: DigitAnimation[]) => {
  if (anims.length < 2) return "";
  const entering = anims.find((a) => !a.isLeaving);
  if (!entering) return "";
  return entering.direction === "up" ? "strip-move-up" : "strip-move-down";
};

const getStripStyle = (anims: DigitAnimation[]) => {
  const entering = anims.find((a) => !a.isLeaving);
  if (!entering || anims.length < 2) return {};
  return { animationDuration: `${entering.speed}s` };
};

onMounted(() => {
  if (typeof window === "undefined") return;

  const audioElement = new Audio("/sound/main/t.mp3");
  audioElement.preload = "auto";
  audioElement.volume = 0.5;
  audioElement.addEventListener("loadedmetadata", () => {
    audioMidpoint.value = audioElement.duration / 21;
  });
  audio.value = audioElement;

  const digits = String(props.value).split("");
  digitAnimations.value = digits.map((digit) => [
    {
      id: `${animationId.value++}`,
      digit,
      isLeaving: false,
      direction: "up",
      speed: 0,
    },
  ]);
});

onUnmounted(() => {
  if (audio.value) {
    audio.value.pause();
    audio.value = null;
  }
  if (cleanupTimer.value) clearTimeout(cleanupTimer.value);
});

watch(
  () => props.value,
  (newValue, oldValue) => {
    if (oldValue === newValue) return;

    if (cleanupTimer.value) {
      clearTimeout(cleanupTimer.value);
      cleanupTimer.value = null;
    }
    
    digitAnimations.value = digitAnimations.value.map(group => {
      const entering = group.find(a => !a.isLeaving);
      return entering ? [entering] : group;
    });

    const currentDigits = String(newValue).split("");
    const previousDigits = digitAnimations.value.map(group => group[0]?.digit || "");

    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTime.value;
    if (audio.value) {
      audio.value.currentTime = audioMidpoint.value;
      audio.value.play().catch(() => null);
    }

    const speed = Math.max(0.15, Math.min(0.4, timeSinceLastChange / 1000));
    const direction: "up" | "down" = newValue > prevValue.value ? "up" : "down";
    const maxLength = Math.max(currentDigits.length, previousDigits.length);
    const newAnimations: DigitAnimation[][] = [];

    for (let i = 0; i < maxLength; i++) {
      const currentIndex = currentDigits.length - maxLength + i;
      const prevIndex = previousDigits.length - maxLength + i;

      const actualCurrentDigit = currentIndex >= 0 ? currentDigits[currentIndex] : undefined;
      
      const existingGroup = prevIndex >= 0 ? digitAnimations.value[prevIndex] : [];
      const actualPrevDigitObj = existingGroup?.[0]; 
      
      const newAnimBase = {
        id: `${animationId.value++}`,
        isLeaving: false,
        direction,
        speed,
      };

      if (actualCurrentDigit !== undefined) {
         if (actualPrevDigitObj && actualPrevDigitObj.digit !== actualCurrentDigit) {
            const prevAsLeaving = { ...actualPrevDigitObj, isLeaving: true };
            const newAsEntering = { ...newAnimBase, digit: actualCurrentDigit };

            if (direction === "up") {
              newAnimations[i] = [prevAsLeaving, newAsEntering];
            } else {
              newAnimations[i] = [newAsEntering, prevAsLeaving];
            }
         } else if (actualPrevDigitObj) {
            newAnimations[i] = [actualPrevDigitObj];
         } else {
            newAnimations[i] = [{ ...newAnimBase, digit: actualCurrentDigit }];
         }
      } else {
        newAnimations[i] = [];
      }
    }

    digitAnimations.value = newAnimations;

    lastChangeTime.value = now;
    prevValue.value = newValue;

    cleanupTimer.value = setTimeout(() => {
      digitAnimations.value = digitAnimations.value.map((anims) =>
        anims.filter((anim) => !anim.isLeaving)
      );
    }, speed * 1000 + 20);
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

.digit-strip {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  transform: translateY(0);
  will-change: transform;
}

.digit-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 0.75em;
  flex-shrink: 0;
  line-height: 1; 
}

.strip-move-up {
  animation: stripMoveUp cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.strip-move-down {
  animation: stripMoveDown cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes stripMoveUp {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-0.75em);
  }
}

@keyframes stripMoveDown {
  from {
    transform: translateY(-0.75em);
  }
  to {
    transform: translateY(0);
  }
}
</style>
