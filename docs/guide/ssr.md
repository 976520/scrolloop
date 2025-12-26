# SSR (Server-Side Rendering) 가이드

scrolloop은 Next.js와 같은 서버 사이드 렌더링 환경에서 초기 로딩 성능과 SEO를 최적화할 수 있는 강력한 SSR 기능을 제공합니다.

## SSR의 도전 과제

가상 리스트(Virtual List)는 본질적으로 브라우저의 **스크롤 위치(scrollTop)**와 **뷰포트 크기**를 알아야만 어떤 아이템을 그릴지 결정할 수 있습니다. 하지만 서버 환경에는 다음과 같은 제약이 있습니다.

1.  **스크롤 정보 부재**: 서버는 사용자가 현재 어디를 보고 있는지 알 수 없습니다.
2.  **레이아웃 정보 부재**: 서버는 각 아이템의 실제 렌더링 높이나 컨테이너의 크기를 알 수 없습니다.

이로 인해 일반적인 가상 리스트는 서버에서 내용을 비워두거나(Empty), 클라이언트에서 자바스크립트가 로드될 때까지 아무것도 보여주지 못하는 경우가 많습니다.

## scrolloop의 해결책

scrolloop은 `isServerSide` 옵션과 초기 데이터를 통해 이 문제를 해결합니다.

### 1. `isServerSide` 옵션

이 옵션을 활성화하면 scrolloop은 클라이언트에서 가상화 엔진이 완전히 준비되기 전까지 **정적인 풀 리스트(Full List)** 모드로 동작합니다.

### 2. 하이드레이션 전략

서버에서 렌더링된 HTML이 브라우저에 전달되면, scrolloop은 즉시 가상 리스트로 전환되지 않고 **사용자의 첫 상호작용(스크롤 등)**이 발생할 때까지 기다립니다. 이를 통해 하이드레이션 시 발생할 수 있는 시각적 튐(Jitter) 현상을 방지합니다.

## 사용 예시 (Next.js App Router)

### 1. 서버 컴포넌트에서 데이터 페칭

```tsx
// app/items/page.tsx (Server Component)
import { ClientItems } from "./ClientItems";

export default async function Page() {
  // 서버에서 초기 데이터 10개를 가져옵니다.
  const initialItems = await fetchItems(0, 10);

  return (
    <ClientItems
      initialData={initialItems.data}
      initialTotal={initialItems.total}
    />
  );
}
```

### 2. 클라이언트 컴포넌트에서 사용

```tsx
// app/items/ClientItems.tsx (Client Component)
"use client";

import { InfiniteList } from "@scrolloop/react";

export function ClientItems({ initialData, initialTotal }) {
  const fetchPage = async (page, size) => {
    const res = await fetch(`/api/items?page=${page}&size=${size}`);
    return res.json();
  };

  return (
    <InfiniteList
      isServerSide={true}
      initialData={initialData}
      initialTotal={initialTotal}
      fetchPage={fetchPage}
      itemSize={60}
      height={800}
      renderItem={(item, index, style) => (
        <div key={index} style={style}>
          {item ? item.title : "로딩 중..."}
        </div>
      )}
    />
  );
}
```

## 주요 Props 설정

| Prop                 | Type      | Description                                                                    |
| :------------------- | :-------- | :----------------------------------------------------------------------------- |
| `isServerSide`       | `boolean` | SSR 모드 활성화 여부. 서버 환경이나 초기 하이드레이션 시 중요하게 작용합니다.  |
| `initialData`        | `T[]`     | 서버에서 미리 렌더링된 데이터 배열입니다.                                      |
| `initialTotal`       | `number`  | 전체 아이템의 총 개수(예상치)입니다. 스크롤바의 크기를 결정하는 데 사용됩니다. |
| `transitionStrategy` | `object`  | 가상화 모드로 전환되는 타이밍과 방식을 세밀하게 제어합니다.                    |

## 주의사항

- **Key 일치**: 서버에서 생성된 `key`와 클라이언트에서 생성된 `key`가 일치해야 하이드레이션 오류가 발생하지 않습니다. scrolloop 내부적으로 인덱스를 사용하지만, `renderItem` 내부의 컨텐츠에서도 일관된 키를 사용하세요.
- **초기 로딩량**: `initialData`를 너무 크게 잡으면 SSR의 장점인 '빠른 초기 렌더링'이 무색해질 수 있습니다. 보통 첫 화면을 채울 정도(10~20개)가 적당합니다.
