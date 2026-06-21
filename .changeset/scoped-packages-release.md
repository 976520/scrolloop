---
"@scrolloop/core": minor
"@scrolloop/react": minor
"@scrolloop/react-native": minor
"@scrolloop/preact": minor
"@scrolloop/vue": minor
"@scrolloop/svelte": minor
---

스코프 패키지로 전환: 각 프레임워크 어댑터를 독립 발행하고 공용 `@scrolloop/core`에 의존합니다.

- `@scrolloop/core`: 플랫폼 무관 가상 스크롤 코어 (기존 `@scrolloop/shared` 통합 — InfiniteSource / findMissingPages / canLoadPage 포함).
- `@scrolloop/react`, `@scrolloop/react-native`, `@scrolloop/preact`, `@scrolloop/vue`, `@scrolloop/svelte`: 각 프레임워크 어댑터.

기존 `scrolloop` 패키지(React)는 `@scrolloop/react`로 대체됩니다.
