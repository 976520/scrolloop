<img width="300" alt="4f11d7e413d6546a60fddc0e02219658e360d58512bc11c1acc57530fab307de" src="https://github.com/user-attachments/assets/d35a27e7-7895-43e5-9b4f-ac29c403dd3e" />

# scrolloop

React 스크롤 컴포넌트 라이브러리

Just a scrolling library for React

![NPM Downloads](https://img.shields.io/npm/d18m/scrolloop)
![Repo size](https://img.shields.io/github/repo-size/976520/scrolloop)
![Last commit](https://img.shields.io/github/last-commit/976520/scrolloop?color=red)
![Top language](https://img.shields.io/github/languages/top/976520/scrolloop)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install scrolloop
yarn add scrolloop
pnpm add scrolloop
```

```bash
npm install @scrolloop/react

npm install @scrolloop/react-native
```

## Examples

### VirtualList

```tsx
// import { VirtualList } from 'scrolloop';
import { VirtualList } from "@scrolloop/react";

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

```tsx
// import { VirtualList } from 'scrolloop/native';
import { VirtualList } from "@scrolloop/react-native";

import { View, Text } from "react-native";

const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);

export default function App() {
  return (
    <VirtualList
      count={items.length}
      itemSize={40}
      renderItem={(index, style) => (
        <View style={style} key={index}>
          <Text>{items[index]}</Text>
        </View>
      )}
    />
  );
}
```

### InfiniteList

```tsx
// import { InfiniteList } from 'scrolloop';
import { InfiniteList } from "@scrolloop/react";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function UserList() {
  return (
    <InfiniteList<User>
      fetchPage={fetchFunction()}
      pageSize={20}
      itemSize={60}
      height={800}
      renderItem={(user, index, style) => (
        <div
          style={{
            ...style,
            padding: "8px 16px",
            borderBottom: "1px solid #eee",
          }}
        >
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      )}
      renderLoading={() => <div>로딩 중...</div>}
      renderError={(error, retry) => (
        <div>
          <p>{error.message}</p>
          <button onClick={retry}>재시도</button>
        </div>
      )}
      renderEmpty={() => <div>데이터가 없습니다.</div>}
    />
  );
}
```

```tsx
// import { InfiniteList } from 'scrolloop/native';
import { InfiniteList } from "@scrolloop/react-native";

import { View, Text, TouchableOpacity } from "react-native";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function UserList() {
  return (
    <InfiniteList<User>
      fetchPage={fetchFunction()}
      pageSize={20}
      itemSize={60}
      height={800}
      renderItem={(user, index, style) => (
        <View
          style={{
            ...style,
            padding: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>{user.name}</Text>
          <Text style={{ color: "#666" }}>{user.email}</Text>
        </View>
      )}
      renderLoading={() => <Text>로딩 중...</Text>}
      renderError={(error, retry) => (
        <View>
          <Text>{error.message}</Text>
          <TouchableOpacity onPress={retry}>
            <Text>재시도</Text>
          </TouchableOpacity>
        </View>
      )}
      renderEmpty={() => <Text>데이터가 없습니다.</Text>}
    />
  );
}
```

## license

MIT
