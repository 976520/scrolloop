# scrolloop 소개

scrolloop은 여러 UI 런타임에서 사용할 수 있는 고성능 가상 스크롤(Virtual Scrolling) 라이브러리입니다. 고정 높이 아이템을 기준으로 화면에 필요한 범위만 렌더링하고, 무한 스크롤 데이터 로딩까지 같은 API 형태로 제공합니다.

## why virtual scrolling?

웹 애플리케이션에서 수천 개 이상의 아이템을 한꺼번에 렌더링하면 DOM 노드가 너무 많아져 성능이 급격히 저하됩니다. scrolloop은 **윈도잉(windowing)** 기법을 사용하여 실제 화면에 보이는 항목만 렌더링함으로써 브라우저 부하를 획기적으로 줄여줍니다.

## packages

- `@scrolloop/core`: 플랫폼 독립적인 가상화 코어 로직
- `@scrolloop/shared`: infinite loading 상태 관리와 공통 유틸리티
- `@scrolloop/react`: React 컴포넌트 (`VirtualList`, `InfiniteList`)
- `@scrolloop/react-native`: React Native 컴포넌트
- `@scrolloop/preact`: Preact 컴포넌트와 hook
- `@scrolloop/vue`: Vue 3 컴포넌트와 composable
- `@scrolloop/svelte`: Svelte 5 컴포넌트와 store

## install

```bash
# React
npm install @scrolloop/react

# React Native
npm install @scrolloop/react-native

# Preact
npm install @scrolloop/preact

# Vue 3
npm install @scrolloop/vue

# Svelte 5
npm install @scrolloop/svelte
```

다음 단계에서 [Quick start](./quick-start)를 통해 첫 번째 가상 리스트를 구현해 보세요.
