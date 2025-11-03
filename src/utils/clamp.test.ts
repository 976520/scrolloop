import { describe, it, expect } from 'vitest';
import { clamp } from './clamp';

describe('clamp', () => {
  it('value is within range, return value', () => {
    expect(clamp(0, 5, 10)).toBe(5);
    expect(clamp(10, 15, 20)).toBe(15);
    expect(clamp(-10, 0, 10)).toBe(0);
  });

  it('value is less than minimum value, return minimum value', () => {
    expect(clamp(0, -5, 10)).toBe(0);
    expect(clamp(10, 5, 20)).toBe(10);
    expect(clamp(-10, -20, 10)).toBe(-10);
  });

  it('value is greater than maximum value, return maximum value', () => {
    expect(clamp(0, 15, 10)).toBe(10);
    expect(clamp(10, 25, 20)).toBe(20);
    expect(clamp(-10, 20, 10)).toBe(10);
  });

  it('boundary value handling', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(0, 10, 10)).toBe(10);
    expect(clamp(5, 5, 5)).toBe(5);
  });

  it('negative range handling', () => {
    expect(clamp(-20, -15, -10)).toBe(-15);
    expect(clamp(-20, -25, -10)).toBe(-20);
    expect(clamp(-20, -5, -10)).toBe(-10);
  });

  it('decimal value handling', () => {
    expect(clamp(0.5, 1.5, 2.5)).toBe(1.5);
    expect(clamp(0.5, 0.2, 2.5)).toBe(0.5);
    expect(clamp(0.5, 3.7, 2.5)).toBe(2.5);
  });
});

