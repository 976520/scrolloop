<template>
  <div class="bg-particles">
    <div class="particle particle-1"></div>
    <div class="particle particle-2"></div>
  </div>
</template>

<style scoped>
.bg-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.25;
  animation: float 25s infinite ease-in-out;
}

.particle-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -15%;
  left: -10%;
  animation-delay: 0s;
}

.particle-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #764ba2 0%, #f093fb 100%);
  bottom: -10%;
  right: -5%;
  animation-delay: 12s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  33% {
    transform: translate(80px, -60px) scale(1.15) rotate(120deg);
  }
  66% {
    transform: translate(-50px, 40px) scale(0.85) rotate(240deg);
  }
}
</style>
