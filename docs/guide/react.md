# React에서 사용하기

`@scrolloop/react` 패키지는 React 환경에 최적화된 가상화 컴포넌트를 제공합니다.

## VirtualList

가장 기본적인 가상 리스트 컴포넌트입니다.

### 사용 예시

```tsx
import { VirtualList } from "@scrolloop/react";

const MyList = () => {
  return (
    <VirtualList
      count={10000}
      itemSize={50}
      height={500}
      renderItem={(index, style) => (
        <div
          style={{
            ...style,
            backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          아이템 {index}
        </div>
      )}
      onRangeChange={({ startIndex, endIndex }) => {
        console.log(`현재 렌더링 범위: ${startIndex} ~ ${endIndex}`);
      }}
    />
  );
};
```

### 인터페이스

```
title="VirtualListProps"
interface VirtualListProps {
  /** 전체 아이템 개수 */
  count: number;
  /** 각 아이템의 높이 (단위: px) */
  itemSize: number;
  /** 렌더링 함수 */
  renderItem: (index: number, style: CSSProperties) => ReactNode;
  /** 컨테이너 높이 (기본값: 400) */
  height?: number;
  /** 화면 밖 미리 렌더링 개수 (기본값: 4) */
  overscan?: number;
  /** 컨테이너 클래스명 */
  className?: string;
  /** 컨테이너 스타일 */
  style?: CSSProperties;
  /** 범위 변경 콜백 */
  onRangeChange?: (range: { startIndex: number; endIndex: number }) => void;
}
```
