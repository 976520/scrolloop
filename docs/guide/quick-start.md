# Quick start

scrolloop로 1분 안에 고성능 리스트를 구현해 보세요.

## 기본 사용법

가장 기본적인 React 에서의 `VirtualList` 컴포넌트 사용 예시입니다.

```tsx
import { VirtualList } from "@scrolloop/react";

function App() {
  // 1,000개의 데이터 생성
  const items = Array.from({ length: 1000 }, (_, i) => `Item #${i}`);

  return (
    <div>
      <VirtualList
        count={items.length}
        itemSize={50}
        height={400}
        renderItem={(index, style) => (
          <div key={index} style={style}>
            {items[index]}
          </div>
        )}
      />
    </div>
  );
}
```

## 핵심 Props

| Prop         | Type       | Required | Description                                     |
| :----------- | :--------- | :------- | :---------------------------------------------- |
| `count`      | `number`   | Yes      | 전체 item의 개수                                |
| `itemSize`   | `number`   | Yes      | 각 item의 높이                                  |
| `renderItem` | `Function` | Yes      | 인덱스와 스타일을 받아 item을 렌더링하는 함수   |
| `height`     | `number`   | No       | container의 높이 (기본값: 400)                  |
| `overscan`   | `number`   | No       | 화면 밖에서 미리 렌더링할 item 개수 (기본값: 4) |

## Next step

- [React 상세 가이드](./react)에서 더 다양한 기능을 확인하세요.
- [무한 스크롤 구현](./infinite-scroll) 방법을 알아보세요.
- [React Native](./react-native)에서 사용하는 방법을 확인하세요.
