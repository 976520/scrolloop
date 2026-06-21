<img width="300" alt="scrolloop logo" src="https://github.com/user-attachments/assets/d35a27e7-7895-43e5-9b4f-ac29c403dd3e" />

# [scrolloop](https://976520.github.io/scrolloop/)

Modern virtual and infinite scrolling components for React, React Native, Preact, Vue, and Svelte.

![NPM Downloads](https://img.shields.io/npm/dt/scrolloop)
![Repo size](https://img.shields.io/github/repo-size/976520/scrolloop)
![Last commit](https://img.shields.io/github/last-commit/976520/scrolloop?color=red)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

> [!NOTE]
> The legacy `scrolloop` package is now `@scrolloop/react`. Install the scoped package for your framework below.

## Install

### React

```bash
npm install @scrolloop/react
# or
yarn add @scrolloop/react
# or
pnpm add @scrolloop/react
```

### Preact

```bash
npm install @scrolloop/preact
# or
yarn add @scrolloop/preact
# or
pnpm add @scrolloop/preact
```

### Vue

```bash
npm install @scrolloop/vue
# or
yarn add @scrolloop/vue
# or
pnpm add @scrolloop/vue
```

### Svelte

```bash
npm install @scrolloop/svelte
# or
yarn add @scrolloop/svelte
# or
pnpm add @scrolloop/svelte
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

### Preact

```tsx
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

### Vue

```vue
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

### Svelte

```svelte
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
      height={400}
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
- **@scrolloop/shared**: Shared infinite loading state and utilities
- **@scrolloop/react**: React implementation
- **@scrolloop/preact**: Preact implementation
- **@scrolloop/vue**: Vue 3 implementation
- **@scrolloop/svelte**: Svelte 5 implementation
- **@scrolloop/react-native**: React Native implementation

## License

MIT
