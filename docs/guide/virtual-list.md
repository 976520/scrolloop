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

VirtualList는 사용 환경에 따라 약간 다른 설정을 지원합니다.

| Prop            | Type       | Required | Description                                                             |
| :-------------- | :--------- | :------- | :---------------------------------------------------------------------- |
| `count`         | `number`   | **Yes**  | 렌더링할 전체 아이템의 총 개수입니다.                                   |
| `itemSize`      | `number`   | **Yes**  | 각 아이템의 높이입니다 (px).                                            |
| `renderItem`    | `Function` | **Yes**  | 아이템을 렌더링하는 함수입니다. 인덱스와 스타일 객체를 인자로 받습니다. |
| `height`        | `number`   | No       | 컨테이너의 높이입니다. (기본값: 400)                                    |
| `overscan`      | `number`   | No       | 화면 밖 버퍼 영역에 미리 렌더링할 아이템의 수입니다. (기본값: 4)        |
| `onRangeChange` | `Function` | No       | 렌더링되는 인덱스 범위가 변경될 때 호출되는 콜백입니다.                 |

### React 전용 (@scrolloop/react)

- `className`: 컨테이너 요소에 적용할 CSS 클래스입니다.
- `style`: 컨테이너 요소에 적용할 인라인 스타일입니다.

### React Native 전용 (@scrolloop/react-native)

- `VirtualList`는 React Native의 `ScrollView`를 상속받으므로, `onScroll`을 제외한 모든 `ScrollViewProps`를 지원합니다.

## 주의사항

1. **Style 적용**: `renderItem`에서 제공하는 `style` 객체는 각 아이템의 위치를 결정하는 `absolute` 좌표 정보를 포함하고 있습니다. **반드시** 렌더링하는 최상위 element의 스타일에 적용해야 합니다.
2. **Key 관리**: `renderItem` 내부의 element에 `index`를 기반으로 한 고유한 `key`를 부여하는 것을 권장합니다.
