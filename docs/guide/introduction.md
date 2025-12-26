# scrolloop 소개

scrolloop은 현대적인 웹 애플리케이션을 위한 고성능 가상 스크롤(Virtual Scrolling) 라이브러리입니다.

## why virtual scrolling?

웹 애플리케이션에서 수천 개 이상의 아이템을 한꺼번에 렌더링하면 DOM 노드가 너무 많아져 성능이 급격히 저하됩니다. scrolloop은 **윈도잉(windowing)** 기법을 사용하여 실제 화면에 보이는 항목만 렌더링함으로써 브라우저 부하를 획기적으로 줄여줍니다.

## packages

- `@scrolloop/core`: 플랫폼 독립적인 가상화 코어 로직
- `@scrolloop/react`: React 최적화 컴포넌트 (`VirtualList`, `InfiniteList`)
- `@scrolloop/react-native`: 모바일 성능 최적화 컴포넌트

## install

```bash
# React 프로젝트
npm install @scrolloop/react

# React Native 프로젝트
npm install @scrolloop/react-native
```

다음 단계에서 [Quick start](./quick-start)를 통해 첫 번째 가상 리스트를 구현해 보세요.
