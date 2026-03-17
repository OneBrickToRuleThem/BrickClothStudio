/**
 * Unit tests for packing and layout
 */

import { describe, it, expect } from 'vitest';
import { packItemsForPaper, generateMultiCopyLayout, LayoutItem } from '../export/packer';

describe('Packing Algorithm', () => {
  it('should pack items on A4 paper', () => {
    const items: LayoutItem[] = [
      { id: '1', width: 50, height: 80, data: {} },
      { id: '2', width: 50, height: 80, data: {} },
    ];

    const result = packItemsForPaper(items, 'A4', 'portrait', 10, 5);

    expect(result.items.length).toBe(2);
    expect(result.pagesUsed).toBeGreaterThan(0);
  });

  it('should pack items on Letter paper', () => {
    const items: LayoutItem[] = [
      { id: '1', width: 40, height: 60, data: {} },
      { id: '2', width: 40, height: 60, data: {} },
    ];

    const result = packItemsForPaper(items, 'LETTER', 'portrait', 10, 5);

    expect(result.items.length).toBe(2);
    expect(result.pagesUsed).toBeGreaterThan(0);
  });

  it('should handle landscape orientation', () => {
    const items: LayoutItem[] = [
      { id: '1', width: 100, height: 50, data: {} },
    ];

    const result = packItemsForPaper(items, 'A4', 'landscape', 10, 5);

    expect(result.items.length).toBe(1);
    expect(result.items[0].x).toBeGreaterThanOrEqual(10);
  });

  it('should respect margins', () => {
    const items: LayoutItem[] = [
      { id: '1', width: 30, height: 40, data: {} },
    ];

    const result = packItemsForPaper(items, 'A4', 'portrait', 15, 5);

    // Item should not be placed at exact 0,0 due to margin
    expect(result.items[0].x).toBeGreaterThanOrEqual(15);
    expect(result.items[0].y).toBeGreaterThanOrEqual(15);
  });

  it('should generate multiple copies', () => {
    const baseItem: LayoutItem = { id: 'base', width: 40, height: 60, data: {} };

    const result = generateMultiCopyLayout(baseItem, 3, 'A4', 'portrait', 10, 5);

    expect(result.items.length).toBe(3);
    expect(result.items[0].id).toContain('copy-0');
    expect(result.items[2].id).toContain('copy-2');
  });

  it('should use auto-rotate when enabled', () => {
    const items: LayoutItem[] = [
      { id: '1', width: 200, height: 30, data: {} }, // Wide item
    ];

    const result = packItemsForPaper(items, 'A4', 'portrait', 10, 5, true);

    // With auto-rotate, this wide item might be rotated
    expect(result.items.length).toBe(1);
  });

  it('should place items with correct spacing', () => {
    const items: LayoutItem[] = [
      { id: '1', width: 30, height: 40, data: {} },
      { id: '2', width: 30, height: 40, data: {} },
    ];

    const result = packItemsForPaper(items, 'A4', 'portrait', 10, 10);

    // Items should respect gutter spacing
    const item1End = result.items[0].x + result.items[0].width;
    const item2Start = result.items[1].x;
    const spacing = item2Start - item1End;

    expect(spacing).toBeGreaterThanOrEqual(10); // gutter = 10
  });
});

describe('Layout Coordinates', () => {
  it('should assign correct page numbers', () => {
    // Create many items to exceed single page
    const items: LayoutItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      width: 100,
      height: 100,
      data: {},
    }));

    const result = packItemsForPaper(items, 'A4', 'portrait', 10, 5);

    // Should use multiple pages
    const pages = Math.max(...result.items.map(i => i.page));
    expect(pages).toBeGreaterThan(1);
  });

  it('should provide valid coordinates for all items', () => {
    const items: LayoutItem[] = [
      { id: '1', width: 50, height: 80, data: {} },
      { id: '2', width: 50, height: 80, data: {} },
      { id: '3', width: 50, height: 80, data: {} },
    ];

    const result = packItemsForPaper(items, 'A4', 'portrait', 10, 5);

    result.items.forEach(item => {
      expect(item.x).toBeGreaterThanOrEqual(10);
      expect(item.y).toBeGreaterThanOrEqual(10);
      expect(item.width).toBeGreaterThan(0);
      expect(item.height).toBeGreaterThan(0);
      expect(item.page).toBeGreaterThan(0);
    });
  });
});
