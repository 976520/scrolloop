# SSR (Server-Side Rendering) 지원

scrolloop은 서버 사이드 렌더링 환경인 Next.js 등에서 SEO 및 초기 로딩 성능 최적화를 위한 특별한 기능을 제공합니다.

## SSR 방식의 가상 리스트 문제

가상 리스트는 브라우저의 스크롤 위치를 알아야만 내용을 렌더링할 수 있습니다. 하지만 서버에는 스크롤(Window)이 없으므로, 기본적으로 가상 리스트는 서버에서 비어 있게 렌더링됩니다. 이는 SEO와 초기 사용자 경험에 좋지 않습니다.

## scrolloop의 해결책

scrolloop은 `isServerSide` 옵션과 초기 데이터를 활용하여 서버에서도 일정량의 아이템을 정적으로 렌더링할 수 있게 지원합니다.

### 사용법

```tsx
<InfiniteList
  isServerSide={true}
  initialData={serverSideData} // 서버에서 미리 가져온 초기 데이터
  initialTotal={100} // 전체 아이템 예상 개수
  // ... 기타 설정
/>
```

### 작동 프로세스

1. **서버 사이드**: `initialData`에 포함된 모든 항목을 일반적인 리스트 형태로 렌더링합니다.
2. **클라이언트 하이드레이션(Hydration)**: 브라우저에 자바스크립트가 로드되면 scrolloop이 리스트를 제어하기 시작합니다.
3. **가상화 전환**: 사용자가 실제로 스크롤을 시작하면 즉시 가상 리스트 모드로 전환되어 성능을 확보합니다.

## Next.js App Router 예시

```tsx
// Server Component
export default async function Page() {
  const initialData = await getInitialItems();

  return <ClientList initialData={initialData} />;
}

// Client Component ('use client')
function ClientList({ initialData }) {
  return (
    <InfiniteList
      isServerSide={true}
      initialData={initialData}
      // ...
    />
  );
}
```
