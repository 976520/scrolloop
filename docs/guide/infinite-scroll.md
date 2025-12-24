# 무한 스크롤 (Infinite Scroll)

`InfiniteList` 컴포넌트를 사용하면 대량의 데이터를 페이지 단위로 불러오면서 가상화의 이점을 동시에 누릴 수 있습니다.

## InfiniteList

데이터 페칭 로직과 가상화가 결합된 지능형 컴포넌트입니다.

### 사용 예시

```tsx
import { InfiniteList } from "@scrolloop/react";

const InfiniteExample = () => {
  const fetchPage = async (page: number) => {
    const response = await fetch(`https://api.example.com/items?page=${page}`);
    const data = await response.json();
    return data.items; // T[] 반환
  };

  return (
    <InfiniteList
      fetchPage={fetchPage}
      itemSize={50}
      pageSize={20} // 한 페이지당 아이템 개수
      renderItem={(item, index, style) => (
        <div style={style}>{item ? `항목: ${item.name}` : "로딩 중..."}</div>
      )}
      renderLoading={() => <div>전체 로딩 중...</div>}
    />
  );
};
```

### 작동 방식

1. **지능형 페칭**: 사용자가 스크롤하여 특정 범위가 화면에 들어오려고 하면, 필요한 페이지를 자동으로 판단하여 `fetchPage`를 호출합니다.
2. **캐싱**: 이미 불러온 페이지는 내부적으로 관리되어 불필요한 재요청을 방지합니다.
3. **오버스캔 & 프리페치**: `prefetchThreshold` 옵션을 통해 사용자가 리스트 끝에 도달하기 전에 미리 다음 데이터를 불러올 수 있습니다.

### 주요 Props

| Prop                | Type                             | Description                                                                     |
| :------------------ | :------------------------------- | :------------------------------------------------------------------------------ |
| `fetchPage`         | `(page: number) => Promise<T[]>` | 데이터를 가져오는 비동기 함수입니다.                                            |
| `pageSize`          | `number`                         | 한 번에 가져올 데이터 개수입니다.                                               |
| `initialPage`       | `number`                         | 시작 페이지 번호입니다. (기본값: 0)                                             |
| `prefetchThreshold` | `number`                         | 다음 페이지를 미리 불러올 기준이 되는 남은 페이지 수입니다.                     |
| `renderItem`        | `(item: T \| undefined, ...)`    | 아이템 렌더링 함수입니다. 데이터가 아직 로딩 중이면 `item`은 `undefined`입니다. |

## loading 및 Error 처리

`InfiniteList`는 선언적인 렌더링을 위해 다음 Props를 제공합니다.

- `renderLoading`: 초기 데이터가 전혀 없을 때 보여줄 화면
- `renderError`: 페칭 실패 시 보여줄 화면 (재시도 함수 제공)
- `renderEmpty`: 데이터가 하나도 없을 때 보여줄 화면
