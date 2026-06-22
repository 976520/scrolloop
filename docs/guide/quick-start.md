# Quick start

scrolloop로 1분 안에 windowing 리스트를 구현해 보세요. 가장 일반적인 React 예시는 다음과 같습니다.

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

## Next step

- [VirtualList](./virtual-list)에서 런타임별 사용법과 props를 확인하세요.
- [InfiniteList](./infinite-list)에서 페이지 기반 무한 스크롤을 확인하세요.
