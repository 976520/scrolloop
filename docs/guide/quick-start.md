# Quick start

scrolloop로 1분 안에 windowing 리스트를 구현해 보세요.

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

- [VirtualList](./virtual-list)에서 더 다양한 기능을 확인하세요.
