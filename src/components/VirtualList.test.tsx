import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualList } from './VirtualList';

describe('VirtualList', () => {
  const defaultProps = {
    count: 100,
    itemSize: 50,
    height: 400,
    renderItem: (index: number) => <div data-testid={`item-${index}`}>Item {index}</div>,
  };

  // 컨테이너가 올바른 높이로 렌더링되는지
  it('renders container with correct height', () => {
    const { container } = render(<VirtualList {...defaultProps} />);
    const listContainer = container.firstChild as HTMLElement;

    expect(listContainer).toBeInTheDocument();
    expect(listContainer).toHaveStyle({ height: '400px' });
  });

  // 내부 컨테이너의 총 높이가 모든 아이템 높이의 합과 일치하는지
  it('renders correct total height', () => {
    const { container } = render(<VirtualList {...defaultProps} />);
    const listContainer = container.firstChild as HTMLElement;
    const innerContainer = listContainer.firstChild as HTMLElement;

    const expectedHeight = defaultProps.count * defaultProps.itemSize;
    expect(innerContainer).toHaveStyle({ height: `${expectedHeight}px` });
  });

  // 초기 렌더링 시 가시 영역 + overscan만큼의 아이템이 렌더링되는지
  it('renders initial visible items with overscan', () => {
    render(<VirtualList {...defaultProps} overscan={2} />);

    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.getByTestId('item-7')).toBeInTheDocument();
    
    expect(screen.getByTestId('item-10')).toBeInTheDocument();
  });

  // 커스텀 className이 올바르게 적용되는지
  it('applies custom className', () => {
    const { container } = render(<VirtualList {...defaultProps} className="custom-list" />);
    const listContainer = container.firstChild as HTMLElement;

    expect(listContainer).toHaveClass('custom-list');
  });

  // 커스텀 style 객체가 올바르게 적용되는지
  it('applies custom style', () => {
    const customStyle = { border: '1px solid red' };
    const { container } = render(<VirtualList {...defaultProps} style={customStyle} />);
    const listContainer = container.firstChild as HTMLElement;

    expect(listContainer).toHaveStyle(customStyle);
  });

  // 초기 렌더링 시 onRangeChange 콜백이 호출되고 올바른 범위 정보를 전달하는지
  it('calls onRangeChange when rendered', () => {
    const onRangeChange = vi.fn();
    render(<VirtualList {...defaultProps} onRangeChange={onRangeChange} />);

    expect(onRangeChange).toHaveBeenCalledWith({
      startIndex: expect.any(Number),
      endIndex: expect.any(Number),
    });
  });

  // 다른 itemSize와 count로도 올바르게 동작하는지
  it('renders with different item sizes', () => {
    const customProps = { ...defaultProps, itemSize: 100, count: 50 };
    const { container } = render(<VirtualList {...customProps} />);
    const innerContainer = (container.firstChild as HTMLElement).firstChild as HTMLElement;

    expect(innerContainer).toHaveStyle({ height: `${50 * 100}px` });
  });

  // count가 0일 때도 올바르게 처리되는지 (edge case)
  it('handles count of 0', () => {
    const { container } = render(<VirtualList {...defaultProps} count={0} />);
    const innerContainer = (container.firstChild as HTMLElement).firstChild as HTMLElement;

    expect(innerContainer).toHaveStyle({ height: '0px' });
  });
});

