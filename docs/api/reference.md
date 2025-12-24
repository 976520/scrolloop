# API 레퍼런스

scrolloop의 주요 패키지별 API 상세 명세입니다.

## @scrolloop/react

### VirtualList

React용 핵심 가상 리스트 컴포넌트입니다.

| Property        | Type                                                 | Default  | Description                                                                                   |
| :-------------- | :--------------------------------------------------- | :------- | :-------------------------------------------------------------------------------------------- |
| `count`         | `number`                                             | **필수** | 렌더링할 전체 아이템의 총 개수입니다.                                                         |
| `itemSize`      | `number`                                             | **필수** | 각 아이템의 높이입니다 (px).                                                                  |
| `renderItem`    | `(index: number, style: CSSProperties) => ReactNode` | **필수** | 아이템을 렌더링하는 함수입니다. `style`은 절대 좌표 정보를 포함하므로 반드시 적용해야 합니다. |
| `height`        | `number`                                             | `400`    | 스크롤 컨테이너의 높이입니다.                                                                 |
| `overscan`      | `number`                                             | `4`      | 화면 밖 버퍼 영역에 렌더링할 아이템의 수입니다.                                               |
| `onRangeChange` | `(range: Range) => void`                             | -        | 렌더링되는 인덱스 범위가 변경될 때 호출됩니다.                                                |

---

### InfiniteList

데이터 페칭 기능을 포함한 상위 컴포넌트입니다.

| Property            | Type                             | Default  | Description                                     |
| :------------------ | :------------------------------- | :------- | :---------------------------------------------- |
| `fetchPage`         | `(page: number) => Promise<T[]>` | **필수** | 데이터 조회를 위한 비동기 함수입니다.           |
| `pageSize`          | `number`                         | `20`     | 한 페이지당 아이템 개수입니다.                  |
| `prefetchThreshold` | `number`                         | `1`      | 다음 페이지를 미리 불러올 기준 범위입니다.      |
| `isServerSide`      | `boolean`                        | `false`  | SSR 모드 활성화 여부입니다.                     |
| `initialData`       | `T[]`                            | -        | SSR 환경에서 서버로부터 받은 초기 데이터입니다. |
| `renderLoading`     | `() => ReactNode`                | -        | 전체 로딩 시 노출할 UI입니다.                   |
| `renderEmpty`       | `() => ReactNode`                | -        | 데이터가 없을 때 노출할 UI입니다.               |

---

## @scrolloop/core

### calculateVirtualRange

가상화 계산을 수행하는 순수 유틸리티 함수입니다.

```typescript
function calculateVirtualRange(
  scrollTop: number, // 현재 스크롤 위치
  containerHeight: number, // 컨테이너 높이
  itemSize: number, // 아이템 크기
  totalCount: number, // 전체 개수
  overscan: number, // 오버스캔 크기
  prevScrollTop?: number // 이전 스크롤 위치 (방향성 판단용)
): VirtualRange;
```
