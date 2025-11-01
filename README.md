# scrolloop

React virtual-scroll(윈도잉) 라이브러리

Just a virtual-scrolling library for React

## install

```bash
npm install scrolloop
yarn add scrolloop
pnpm add scrolloop
```

## how to use

```tsx
import { VirtualList } from "scrolloop";

const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);

export default function App() {
  return (
    <VirtualList
      count={items.length}
      itemSize={40}
      renderItem={(index, style) => (
        <div style={style} key={index}>
          {items[index]}
        </div>
      )}
    />
  );
}
```

## license

MIT

