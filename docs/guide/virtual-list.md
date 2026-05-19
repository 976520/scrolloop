# VirtualList

`VirtualList`는 scrolloop의 가장 기본적인 고성능 리스트 컴포넌트입니다. 수천 개의 아이템도 화면에 보이는 부분만 선택적으로 렌더링하여 브라우저 부하를 최소화합니다.

## 사용 예시

::: code-group

```tsx [React]
import { VirtualList } from "@scrolloop/react";

function App() {
  const items = Array.from({ length: 1000 }, (_, i) => `Item #${i}`);

  return (
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
  );
}
```

```tsx [Preact]
import { VirtualList } from "@scrolloop/preact";

export function App() {
  const items = Array.from({ length: 1000 }, (_, i) => `Item #${i}`);

  return (
    <VirtualList
      count={items.length}
      itemSize={50}
      height={400}
      renderItem={(index, style) => <div style={style}>{items[index]}</div>}
    />
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { VirtualList } from "@scrolloop/vue";

const items = Array.from({ length: 1000 }, (_, i) => `Item #${i}`);
</script>

<template>
  <VirtualList :count="items.length" :item-size="50" :height="400">
    <template #default="{ index, style }">
      <div :style="style">{{ items[index] }}</div>
    </template>
  </VirtualList>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { VirtualList } from "@scrolloop/svelte";

  const items = Array.from({ length: 1000 }, (_, i) => `Item #${i}`);
</script>

<VirtualList count={items.length} itemSize={50} height={400}>
  {#snippet children(index, style)}
    <div
      style={`position: ${style.position}; top: ${style.top}; left: ${style.left}; right: ${style.right}; height: ${style.height};`}
    >
      {items[index]}
    </div>
  {/snippet}
</VirtualList>
```

```tsx [React Native]
import { View, Text } from "react-native";
import { VirtualList } from "@scrolloop/react-native";

function App() {
  return (
    <View style={{ flex: 1 }}>
      <VirtualList
        count={5000}
        itemSize={60}
        height={800}
        renderItem={(index, style) => (
          <View style={[style, { borderBottomWidth: 1, borderColor: "#eee" }]}>
            <Text>RN 아이템 {index}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

:::

## Props

VirtualList는 모든 런타임에서 같은 핵심 설정을 사용합니다. 각 아이템은 고정된 `itemSize`를 가진다고 가정합니다.

| Prop            | Type       | Required | Description                                                             |
| :-------------- | :--------- | :------- | :---------------------------------------------------------------------- |
| `count`         | `number`   | **Yes**  | 렌더링할 전체 아이템의 총 개수입니다.                                   |
| `itemSize`      | `number`   | **Yes**  | 각 아이템의 높이입니다 (px).                                            |
| `renderItem`    | `Function` | **Yes**  | 아이템을 렌더링하는 함수입니다. 인덱스와 스타일 객체를 인자로 받습니다. |
| `height`        | `number`   | No       | 컨테이너의 높이입니다. (기본값: 400)                                    |
| `overscan`      | `number`   | No       | 화면 밖 버퍼 영역에 미리 렌더링할 아이템의 수입니다. (기본값: 4)        |
| `onRangeChange` | `Function` | No       | 렌더링되는 인덱스 범위가 변경될 때 호출되는 콜백입니다.                 |

### React / Preact

- React는 `className`, Preact는 `class`를 컨테이너 요소에 적용할 수 있습니다.
- `style`: 컨테이너 요소에 적용할 인라인 스타일입니다.

### Vue 전용 (@scrolloop/vue)

- 기본 slot은 `{ index, style }`을 전달합니다.
- `rangeChange` 이벤트로 `{ startIndex, endIndex }`를 받을 수 있습니다.

### Svelte 전용 (@scrolloop/svelte)

- `children` snippet은 `(index, style)`을 전달받습니다.
- `onRangeChange` prop으로 `{ startIndex, endIndex }`를 받을 수 있습니다.

### React Native 전용 (@scrolloop/react-native)

- `VirtualList`는 React Native의 `ScrollView`를 상속받으므로, `onScroll`을 제외한 모든 `ScrollViewProps`를 지원합니다.
- `style`은 `ScrollView`에 적용됩니다.

## 주의사항

1. **Style 적용**: `renderItem`에서 제공하는 `style` 객체는 각 아이템의 위치를 결정하는 `absolute` 좌표 정보를 포함하고 있습니다. **반드시** 렌더링하는 최상위 element의 스타일에 적용해야 합니다.
2. **고정 크기 전제**: 현재 VirtualList는 모든 아이템이 동일한 `itemSize`를 가진다는 전제에서 범위를 계산합니다.
3. **Key 관리**: React와 React Native에서는 컴포넌트가 인덱스 기반 key를 주입합니다. 렌더링하는 하위 목록이 있다면 하위 요소의 key도 안정적으로 유지하세요.
