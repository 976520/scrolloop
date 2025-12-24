<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Particles from "./Particles.vue";
import Hero from "./Hero.vue";
import Demo from "./Demo.vue";

const observer = ref(null);

onMounted(() => {
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll(".animate-on-scroll").forEach((el) => {
    observer.value.observe(el);
  });
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});
</script>

<template>
  <div class="home-container">
    <Particles />
    <Hero />
    <Demo />
  </div>
</template>

<style scoped>
.home-container {
  overflow-x: hidden;
  user-select: none;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  color: #e4e4e7;
  position: relative;
  min-height: 100vh;
}
</style>

<style>
.token.tag {
  color: #569cd6;
}
.token.attr-name {
  color: #9cdcfe;
}
.token.attr-value {
  color: #ce9178;
}
.token.punctuation {
  color: #808080;
}
.token.text {
  color: #d4d4d4;
}
</style>
