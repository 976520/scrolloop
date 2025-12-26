# concepts

scrolloop이 어떻게 수만 개의 item을 성능 저하 없이 빠르게 렌더링하는지, 그 구조적 원리를 알아봅시다.

## 1. windowing

windowing이란 전체 리스트 아이템 중에서 현재 사용자에게 보이는(visible) 영역에 해당하는 item만 선택적으로 DOM에 렌더링하는 기법입니다.

사용자가 스크롤할 때마다 scrolloop은 현재 `scrollTop`을 계산하여 해당 위치에 있어야 할 아이템의 인덱스 범위를 찾아냅니다. 10만 개의 data가 있어도 실제 DOM에는 10~20개만 존재하게 됩니다.

직접 scroll해 보세요!

<VirtualizationVisualizer />

장점은 뻔합니다. memory 사용량을 획기적으로 줄이고, 브라우저의 layout 계산 비용을 최소화합니다.

## 2. overscan

아주 빠르게 scroll할 때, 브라우저가 다음 item을 그리기 전에 잠깐 공백이 보이는 현상을 방지하기 위한 기법으로, viewport 바로 위와 아래에 지정된 개수(`overscan`)만큼의 item을 미리 렌더링해 둡니다.

## 3. 절대 좌표 배치 (Absolute Positioning)

scrolloop은 가상 리스트의 전체 높이를 유지하면서 아이템을 효율적으로 배치하기 위해 **내부 container 전략**을 사용합니다.

내부 container의 높이를 `count * itemSize`로 설정하여 브라우저의 기본 scrollbar가 실제 item의 수에 맞춰 생기도록 합니다. 각 item은 container 내에서 `position: absolute`와 `top` 값을 사용하여 정확한 위치에 고정됩니다.

이 방식은 item이 추가/삭제될 때 다른 item의 위치에 영향을 주지 않으므로, 브라우저의 reflow를 방지하는 데 효과적입니다.

---

다음 단계에서 실제 컴포넌트를 사용하여 리스트를 구현하는 방법을 확인해 보세요.

- [VirtualList 사용법](./virtual-list)
- [InfiniteList 사용법](./infinite-list)
