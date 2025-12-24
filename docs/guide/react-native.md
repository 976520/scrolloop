# React Native 지원

scrolloop은 모바일 환경에서도 고성능 리스트 렌더링을 지원하기 위해 `@scrolloop/react-native` 패키지를 제공합니다.

## 특징

웹 브라우저의 DOM 대신 React Native의 View와 ScrollView를 활용하여 최적화된 성능을 제공합니다. 핵심 로직이 동일하므로 React용 패키지와 거의 같은 인터페이스로 사용할 수 있습니다.

## 사용 예시

```tsx
import { View, Text } from "react-native";
import { VirtualList } from "@scrolloop/react-native";

const RNExample = () => {
  return (
    <View style={{ flex: 1 }}>
      <VirtualList
        count={5000}
        itemSize={60}
        height={800}
        renderItem={(index, style) => (
          <View
            style={[
              style,
              {
                borderBottomWidth: 1,
                borderColor: "#eee",
                justifyContent: "center",
              },
            ]}
          >
            <Text>RN 아이템 {index}</Text>
          </View>
        )}
      />
    </View>
  );
};
```
