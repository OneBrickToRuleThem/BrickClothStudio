/**
 * Layout packing algorithm for print sheets
 * Simple grid-based bin packing with optional rotation
 */

import { BoundingBox } from '../utils/types';
import { PAPER_SIZES } from '../utils/constants';

export interface LayoutItem {
  id: string;
  width: number;
  height: number;
  data: any;
}

export interface LayoutResult {
  items: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
    page: number;
    data: any;
  }>;
  pagesUsed: number;
}

/**
 * Pack items onto a page with given dimensions
 * Uses a simple shelf algorithm
 */
export function packItemsOnPage(
  items: LayoutItem[],
  pageWidth: number,
  pageHeight: number,
  margin: number,
  gutter: number,
  autoRotate: boolean = true
): LayoutResult {
  const usableWidth = pageWidth - 2 * margin;
  const usableHeight = pageHeight - 2 * margin;

  const result: LayoutResult = {
    items: [],
    pagesUsed: 0,
  };

  let currentPage = 1;
  let currentY = margin;
  let shelfHeight = 0;
  let currentX = margin;

  for (const item of items) {
    let itemWidth = item.width;
    let itemHeight = item.height;
    let rotated = false;

    // Try rotating if it fits better
    if (autoRotate && item.height > item.width) {
      const rotatedW = item.height;
      const rotatedH = item.width;
      if (rotatedW <= usableWidth && rotatedH <= usableHeight) {
        itemWidth = rotatedW;
        itemHeight = rotatedH;
        rotated = true;
      }
    }

    // Check if item fits in current shelf
    if (currentX + itemWidth + gutter > pageWidth - margin) {
      // Start new shelf
      currentX = margin;
      currentY += shelfHeight + gutter;
      shelfHeight = 0;

      // Check if we need a new page
      if (currentY + itemHeight > pageHeight - margin) {
        currentPage++;
        currentY = margin;
      }
    }

    // Add item to layout
    result.items.push({
      id: item.id,
      x: currentX,
      y: currentY,
      width: itemWidth,
      height: itemHeight,
      rotated,
      page: currentPage,
      data: item.data,
    });

    currentX += itemWidth + gutter;
    shelfHeight = Math.max(shelfHeight, itemHeight);
  }

  result.pagesUsed = currentPage;
  return result;
}

/**
 * Pack items for A4 or Letter paper
 */
export function packItemsForPaper(
  items: LayoutItem[],
  paperSize: 'A4' | 'LETTER',
  orientation: 'portrait' | 'landscape',
  margin: number = 10,
  gutter: number = 5,
  autoRotate: boolean = true
): LayoutResult {
  const paper = PAPER_SIZES[paperSize];
  const [width, height] =
    orientation === 'landscape' ? [paper.height, paper.width] : [paper.width, paper.height];

  return packItemsOnPage(items, width, height, margin, gutter, autoRotate);
}

/**
 * Generate layout for multiple copies with rotation options
 */
export function generateMultiCopyLayout(
  baseItem: LayoutItem,
  copies: number,
  paperSize: 'A4' | 'LETTER',
  orientation: 'portrait' | 'landscape',
  margin: number = 10,
  gutter: number = 5
): LayoutResult {
  const items = Array.from({ length: copies }).map((_, i) => ({
    ...baseItem,
    id: `${baseItem.id}-copy-${i}`,
  }));

  return packItemsForPaper(items, paperSize, orientation, margin, gutter, true);
}
