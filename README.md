# scrolloop

React 스크롤 컴포넌트 라이브러리

Just a scrolling library for React

## install

```bash
npm install scrolloop
yarn add scrolloop
pnpm add scrolloop
```

## Components

### VirtualList

```tsx
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

### InfiniteList

```tsx
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
        <div style={{ ...style, padding: '8px 16px', borderBottom: '1px solid #eee' }}>
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

## license

MIT

