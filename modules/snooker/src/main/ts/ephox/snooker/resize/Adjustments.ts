import { Arr } from '@ephox/katamari';
import * as Deltas from '../calc/Deltas';
import * as DetailsList from '../model/DetailsList';
import { Warehouse } from '../model/Warehouse';
import * as ColumnSizes from './ColumnSizes';
import * as Recalculations from './Recalculations';
import * as Sizes from './Sizes';
import * as TableSize from './TableSize';
import * as CellUtils from '../util/CellUtils';
import { RowData, Detail } from '../api/Structs';
import { Element } from '@ephox/sugar';
import { BarPositions, ColInfo, RowInfo } from './BarPositions';
import { ColumnResizing } from '../api/TableResize';

const getWarehouse = <T extends Detail> (list: RowData<T>[]) => Warehouse.generate(list);

const sumUp = (newSize: number[]) => Arr.foldr(newSize, (b, a) => b + a, 0);

const getTableWarehouse = (table: Element) => {
  const list = DetailsList.fromTable(table);
  return getWarehouse(list);
};

const adjustWidth = (table: Element, delta: number, index: number, direction: BarPositions<ColInfo>, columnResizeBehaviour: ColumnResizing) => {
  const tableSize = TableSize.getTableSize(table);
  const step = tableSize.getCellDelta(delta);
  const warehouse = getTableWarehouse(table);
  const widths = tableSize.getWidths(warehouse, direction, tableSize);
  const isLastColumn = index === warehouse.grid.columns() - 1;

  // Calculate all of the new widths for columns
  const deltas = Deltas.determine(widths, index, step, tableSize, columnResizeBehaviour);
  const newWidths = tableSize.getNewWidths(widths, deltas);

  // Set the width of each cell based on the column widths
  const newSizes = Recalculations.recalculateWidth(warehouse, newWidths);
  Arr.each(newSizes, (cell) => {
    tableSize.setElementWidth(cell.element, cell.width);
  });

  // Set the overall width of the table.
  if (columnResizeBehaviour === 'resizetable' || isLastColumn) {
    let newDelta = step;
    if (tableSize.widthType === 'fixed') {
      // For px sizing, newDelta includes the extra px for the padding and border width that needs to be included for the new table width to be correct
      newDelta = tableSize.width() - sumUp(widths);
    } else if (columnResizeBehaviour !== 'default' && step < 0 && Math.abs(step) > widths[index]) {
      // RTL (relative) over another column
      newDelta = sumUp(deltas);
    }

    tableSize.setTableWidth(table, newWidths, newDelta);
  }
};

const adjustHeight = (table: Element, delta: number, index: number, direction: BarPositions<RowInfo>) => {
  const warehouse = getTableWarehouse(table);
  const heights = ColumnSizes.getPixelHeights(warehouse, direction);

  const newHeights = Arr.map(heights, (dy, i) => index === i ? Math.max(delta + dy, CellUtils.minHeight()) : dy);

  const newCellSizes = Recalculations.recalculateHeight(warehouse, newHeights);
  const newRowSizes = Recalculations.matchRowHeight(warehouse, newHeights);

  Arr.each(newRowSizes, (row) => {
    Sizes.setHeight(row.element(), row.height());
  });

  Arr.each(newCellSizes, (cell) => {
    Sizes.setHeight(cell.element(), cell.height());
  });

  const total = sumUp(newHeights);
  Sizes.setHeight(table, total);
};

// Ensure that the width of table cells match the passed in table information.
const adjustWidthTo = <T extends Detail> (table: Element, list: RowData<T>[], direction: BarPositions<ColInfo>) => {
  const tableSize = TableSize.getTableSize(table);
  const warehouse = getWarehouse(list);
  const widths = tableSize.getWidths(warehouse, direction, tableSize);

  // Set the width of each cell based on the column widths
  const newSizes = Recalculations.recalculateWidth(warehouse, widths);
  Arr.each(newSizes, (cell) => {
    tableSize.setElementWidth(cell.element, cell.width);
  });

  // const total = Arr.foldr(widths, function (b, a) { return a + b; }, 0);
  if (newSizes.length > 0) {
    // tableSize.setTableWidth(table, total);
    // WARNING, this may be incorrect, the commented out code above was the original
    tableSize.setTableWidth(table, widths, tableSize.getCellDelta(0));
  }
};

export {
  adjustWidth,
  adjustHeight,
  adjustWidthTo
};
