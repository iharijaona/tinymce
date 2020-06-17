import { Arr, Fun } from '@ephox/katamari';
import { Width, Element } from '@ephox/sugar';
import * as CellUtils from '../util/CellUtils';
import * as ColumnSizes from './ColumnSizes';
import * as Sizes from './Sizes';
import { Warehouse } from '../model/Warehouse';
import { BarPositions, ColInfo } from './BarPositions';

export type WidthType = 'fixed' | 'relative';

export interface TableSize {
  width: () => number;
  pixelWidth: () => number;
  getWidths: (warehouse: Warehouse, direction: BarPositions<ColInfo>, tableSize: TableSize) => number[];
  getNewWidths: (widths: number[], deltas: number[]) => number[];
  getCellDelta: (delta: number) => number;
  singleColumnWidth: (w: number, delta: number) => number[];
  minCellWidth: () => number;
  setElementWidth: (cell: Element, amount: number) => void;
  setTableWidth: (table: Element, newWidths: number[], delta: number) => void;
  widthType: WidthType;
}

const percentageSize = (width: string, element: Element): TableSize => {
  const floatWidth = parseFloat(width);
  const pixelWidth = Width.get(element);
  const getCellDelta = (delta: number) => delta / pixelWidth * 100;
  // If we have one column in a percent based table, that column should be 100% of the width of the table.
  const singleColumnWidth = (w: number, _delta: number) => [ 100 - w ];
  // Get the width of a 10 pixel wide cell over the width of the table as a percentage
  const minCellWidth = () => CellUtils.minWidth() / pixelWidth * 100;;
  const setTableWidth = (table: Element, _newWidths: number[], delta: number) => {
    const ratio = delta / 100;
    const change = ratio * floatWidth;
    Sizes.setPercentageWidth(table, floatWidth + change);
  };
  const getNewWidths = (widths: number[], deltas: number[]) => {
    const initialNewWidths = Arr.map(widths, (width, i) => width + deltas[i]);
    const normaliser = 100 / Arr.foldl(initialNewWidths, (b, a) => b + a, 0);
    // Normalise widths to add up to 100%
    return Arr.map(initialNewWidths, (w) => w * normaliser);
  };
  return {
    width: Fun.constant(floatWidth),
    pixelWidth: Fun.constant(pixelWidth),
    getWidths: ColumnSizes.getPercentageWidths,
    getCellDelta,
    singleColumnWidth,
    minCellWidth,
    setElementWidth: Sizes.setPercentageWidth,
    setTableWidth,
    widthType: 'relative',
    getNewWidths
  };
};

const pixelSize = (width: number): TableSize => {
  const getCellDelta = Fun.identity;
  const singleColumnWidth = (w: number, delta: number) => {
    const newNext = Math.max(CellUtils.minWidth(), w + delta);
    return [ newNext - w ];
  };
  const setTableWidth = (table: Element, newWidths: number[], delta: number) => {
    const newWidthsTotal = Arr.foldl(newWidths, (b, a) => b + a, 0);
    Sizes.setPixelWidth(table, newWidthsTotal + delta);
  };
  const getNewWidths = (widths: number[], deltas: number[]) => Arr.map(widths, (width, i) => width + deltas[i]);
  return {
    width: Fun.constant(width),
    pixelWidth: Fun.constant(width),
    getWidths: ColumnSizes.getPixelWidths,
    getCellDelta,
    singleColumnWidth,
    minCellWidth: CellUtils.minWidth,
    setElementWidth: Sizes.setPixelWidth,
    setTableWidth,
    widthType: 'fixed',
    getNewWidths
  };
};

const chooseSize = (element: Element, width: string) => {
  const percentMatch = Sizes.percentageBasedSizeRegex().exec(width);
  if (percentMatch !== null) {
    return percentageSize(percentMatch[1], element);
  }
  const pixelMatch = Sizes.pixelBasedSizeRegex().exec(width);
  if (pixelMatch !== null) {
    const intWidth = parseInt(pixelMatch[1], 10);
    return pixelSize(intWidth);
  }
  const fallbackWidth = Width.get(element);
  return pixelSize(fallbackWidth);
};

const getTableSize = (element: Element) => {
  const width = Sizes.getRawWidth(element);
  // If we have no width still, return a pixel width at least.
  return width.fold(() => {
    const fallbackWidth = Width.get(element);
    return pixelSize(fallbackWidth);
  }, (w) => chooseSize(element, w));
};

export {
  getTableSize
};
