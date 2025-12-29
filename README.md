<img width="300" alt="scrolloop logo" src="https://github.com/user-attachments/assets/d35a27e7-7895-43e5-9b4f-ac29c403dd3e" />

# [scrolloop](https://976520.github.io/scrolloop/)

The modern scrolling component for React and React Native

![NPM Downloads](https://img.shields.io/npm/dt/scrolloop)
![Repo size](https://img.shields.io/github/repo-size/976520/scrolloop)
![Last commit](https://img.shields.io/github/last-commit/976520/scrolloop?color=red)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## Install

### React

```bash
npm install @scrolloop/react
# or
yarn add @scrolloop/react
# or
pnpm add @scrolloop/react
```

### React Native

```bash
npm install @scrolloop/react-native
# or
yarn add @scrolloop/react-native
# or
pnpm add @scrolloop/react-native
```

## Quick Start

### React

```tsx
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

### React Native

```tsx
import { View, Text } from "react-native";
import { VirtualList } from "@scrolloop/react-native";

function App() {
  const items = Array.from({ length: 1000 }, (_, i) => `Item #${i}`);

  return (
    <VirtualList
      count={items.length}
      itemSize={50}
      renderItem={(index, style) => (
        <View key={index} style={style}>
          <Text>{items[index]}</Text>
        </View>
      )}
    />
  );
}
```

## Packages

- **@scrolloop/core**: Platform-agnostic virtual scrolling logic
- **@scrolloop/react**: React implementation
- **@scrolloop/react-native**: React Native implementation

## License

MIT
