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

  it('renders container with correct height', () => {
    const { container } = render(<VirtualList {...defaultProps} />);
    const listContainer = container.firstChild as HTMLElement;

    expect(listContainer).toBeInTheDocument();
    expect(listContainer).toHaveStyle({ height: '400px' });
  });

  it('renders correct total height', () => {
    const { container } = render(<VirtualList {...defaultProps} />);
    const listContainer = container.firstChild as HTMLElement;
    const innerContainer = listContainer.firstChild as HTMLElement;

    const expectedHeight = defaultProps.count * defaultProps.itemSize;
    expect(innerContainer).toHaveStyle({ height: `${expectedHeight}px` });
  });

  it('renders initial visible items with overscan', () => {
    render(<VirtualList {...defaultProps} overscan={2} />);

    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.getByTestId('item-7')).toBeInTheDocument();
    
    expect(screen.getByTestId('item-10')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<VirtualList {...defaultProps} className="custom-list" />);
    const listContainer = container.firstChild as HTMLElement;

    expect(listContainer).toHaveClass('custom-list');
  });

  it('applies custom style', () => {
    const customStyle = { border: '1px solid red' };
    const { container } = render(<VirtualList {...defaultProps} style={customStyle} />);
    const listContainer = container.firstChild as HTMLElement;

    expect(listContainer).toHaveStyle(customStyle);
  });

  it('calls onRangeChange when rendered', () => {
    const onRangeChange = vi.fn();
    render(<VirtualList {...defaultProps} onRangeChange={onRangeChange} />);

    expect(onRangeChange).toHaveBeenCalledWith({
      startIndex: expect.any(Number),
      endIndex: expect.any(Number),
    });
  });

  it('renders with different item sizes', () => {
    const customProps = { ...defaultProps, itemSize: 100, count: 50 };
    const { container } = render(<VirtualList {...customProps} />);
    const innerContainer = (container.firstChild as HTMLElement).firstChild as HTMLElement;

    expect(innerContainer).toHaveStyle({ height: `${50 * 100}px` });
  });

  it('handles count of 0', () => {
    const { container } = render(<VirtualList {...defaultProps} count={0} />);
    const innerContainer = (container.firstChild as HTMLElement).firstChild as HTMLElement;

    expect(innerContainer).toHaveStyle({ height: '0px' });
  });
});

