# InfiniteList

`InfiniteList`는 데이터 페칭 로직과 가상화 기술을 결합하여, data를 fetching하며 무한히 스크롤되는 대용량 리스트를 효율적으로 구현할 수 있게 도와줍니다.

## 사용 예시

::: code-group

```tsx [React]
import { InfiniteList } from "@scrolloop/react";

function App() {
  const fetchPage = async (page: number, size: number) => {
    const response = await fetch(
      `https://api.example.com/items?page=${page}&size=${size}`
    );
    return await response.json(); // { items: T[], total: number } 반환
  };

  return (
    <InfiniteList
      fetchPage={fetchPage}
      itemSize={50}
      pageSize={20}
      renderItem={(item, index, style) => (
        <div key={index} style={style}>
          {item ? item.text : "Loading..."}
        </div>
      )}
    />
  );
}
```

```tsx [React Native]
import { View, Text } from "react-native";
import { InfiniteList } from "@scrolloop/react-native";

function App() {
  const fetchPage = async (page: number, size: number) => {
    return { items: data, total: 1000 };
  };

  return (
    <View style={{ flex: 1 }}>
      <InfiniteList
        fetchPage={fetchPage}
        itemSize={60}
        height={800}
        renderItem={(item, index, style) => (
          <View style={style}>
            <Text>{item ? item.title : "로딩 중..."}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

:::

## Props

InfiniteList는 가상화 설정 외에도 데이터 페칭 및 상태 관리를 위한 다양한 Props를 제공합니다. 모든 패키지(`react`, `react-native`)에서 공통으로 지원하는 Props는 다음과 같습니다.

| Prop                | Type       | Required | Description                                                                                               |
| :------------------ | :--------- | :------- | :-------------------------------------------------------------------------------------------------------- |
| `fetchPage`         | `Function` | **Yes**  | 페이지별 데이터를 가져오는 비동기 함수입니다. `(page, size) => Promise<PageResponse<T>>` 형태여야 합니다. |
| `renderItem`        | `Function` | **Yes**  | 각 아이템을 렌더링하는 함수입니다. `(item, index, style) => ReactNode` 형태입니다.                        |
| `itemSize`          | `number`   | **Yes**  | 각 아이템의 고정된 높이(또는 너비)입니다.                                                                 |
| `pageSize`          | `number`   | No       | 한 페이지당 아이템의 개수입니다. (기본값: `20`)                                                           |
| `initialPage`       | `number`   | No       | 처음 로드할 페이지 번호입니다. (기본값: `0`)                                                              |
| `prefetchThreshold` | `number`   | No       | 다음 페이지를 미리 불러올 기준이 되는 남은 페이지 수입니다. (기본값: `1`)                                 |
| `height`            | `number`   | No       | 리스트 컨테이너의 높이입니다. (기본값: `400`)                                                             |
| `overscan`          | `number`   | No       | 뷰포트 외부에서 미리 렌더링할 아이템의 수입니다. (기본값: `pageSize * 2`)                                 |
| `renderLoading`     | `Function` | No       | 최초 로딩 중에 표시할 UI를 렌더링하는 함수입니다.                                                         |
| `renderError`       | `Function` | No       | 에러 발생 시 표시할 UI를 렌더링하는 함수입니다. `(error, retry) => ReactNode` 형태입니다.                 |
| `renderEmpty`       | `Function` | No       | 데이터가 없을 때 표시할 UI를 렌더링하는 함수입니다.                                                       |
| `onPageLoad`        | `Function` | No       | 페이지 로드가 성공했을 때 실행되는 콜백입니다.                                                            |
| `onError`           | `Function` | No       | 에러가 발생했을 때 실행되는 콜백입니다.                                                                   |

### React 전용 (@scrolloop/react)

React 환경에서는 SSR 및 성능 최적화를 위한 추가 옵션을 제공합니다.

- **`isServerSide`** (`boolean`): 서버 사이드 렌더링(SSR) 모드를 활성화합니다. 활성화 시 하이드레이션 전까지 전체 리스트를 렌더링합니다.
- **`initialData`** (`T[]`): SSR 환경에서 서버로부터 미리 받아온 초기 데이터입니다.
- **`initialTotal`** (`number`): 전체 아이템의 총 개수를 서버에서 미리 알고 있는 경우 전달합니다.
- **`transitionStrategy`** (`object`): SSR에서 가상화 리스트로 전환될 때의 상세 전략을 설정합니다.

## 작동 방식

1. **Lazy Loading**: `InfiniteList`는 사용자의 스크롤 위치를 감시하며, 화면에 노출될 것으로 예상되는 페이지가 아직 로드되지 않은 경우에만 `fetchPage`를 호출합니다.
2. **Skeleton 지원**: data가 로딩 중일 때 `renderItem`에 `undefined`를 넘겨주어, skeleton UI를 쉽게 구현할 수 있도록 합니다.
3. **자동 재시도**: 네트워크 오류 등으로 페칭에 실패한 경우, `renderError`에서 제공하는 `retry` 함수를 통해 실패한 페이지부터 다시 불러올 수 있습니다.
