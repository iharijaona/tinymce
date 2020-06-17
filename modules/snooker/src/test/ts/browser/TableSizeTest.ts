import { Assert, UnitTest } from '@ephox/bedrock-client';
import { HTMLTableCellElement, HTMLTableElement } from '@ephox/dom-globals';
import { Body, Element, Insert, Remove, SelectorFind, Width } from '@ephox/sugar';
import { ResizeDirection } from 'ephox/snooker/api/ResizeDirection';
import { TableSize } from 'ephox/snooker/api/TableSize';
import { Warehouse } from 'ephox/snooker/model/Warehouse';
import * as fc from 'fast-check';

const pixelTableHtml = '<table style="width: 400px"><tbody><tr><td style="width: 200px"></td><td style="width: 200px"></td></tr></tbody></table>';
const percentTableHtml = '<table style="width: 75%"><tbody><tr><td style="width: 50%"></td><td style="width: 50%"></td></tr></tbody></table>';
const noneTableHtml = '<table><tbody><tr><td></td><td></td></tr></tbody></table>';

UnitTest.test('TableSize.getTableSize', () => {
  const pixelTable = Element.fromHtml<HTMLTableElement>(pixelTableHtml);
  const percentageTable = Element.fromHtml<HTMLTableElement>(percentTableHtml);
  const noneTable = Element.fromHtml<HTMLTableElement>(noneTableHtml);

  const pixelSizing = TableSize.getTableSize(pixelTable);
  const percentageSizing = TableSize.getTableSize(percentageTable);
  const noneSizing = TableSize.getTableSize(noneTable);

  Assert.eq('Pixel sizing detected', 'pixel', pixelSizing.label);
  Assert.eq('Percentage sizing detected', 'percent', percentageSizing.label);
  Assert.eq('None sizing detected', 'none', noneSizing.label);
});

UnitTest.test('TableSize.pixelSizing', () => {
  const table = Element.fromHtml<HTMLTableElement>(pixelTableHtml);
  Insert.append(Body.body(), table);

  const sizing = TableSize.getTableSize(table);
  const warehouse = Warehouse.fromTable(table);

  Assert.eq('Width should be 400px', 400, sizing.width());
  Assert.eq('Pixel width should be 400px', 400, sizing.pixelWidth());
  Assert.eq('Cell widths should be 200px each', [ 200, 200 ], sizing.getWidths(warehouse, ResizeDirection.ltr, sizing));
  Assert.eq('Cell min width should be at least 10px', true, sizing.minCellWidth() >= 10);

  fc.assert(fc.property(fc.integer(-390, 390), (delta) => {
    Assert.eq('Cell delta should be identity', delta, sizing.getCellDelta(delta));
    Assert.eq('Single column width should be the delta', [ delta ], sizing.singleColumnWidth(400, delta));
  }));

  Remove.remove(table);
});

UnitTest.test('TableSize.percentageSizing', () => {
  const container = Element.fromHtml('<div style="position: absolute; left: 0; top: 0; width: 800px"></div>');
  const table = Element.fromHtml<HTMLTableElement>(percentTableHtml);
  Insert.append(container, table);
  Insert.append(Body.body(), container);

  const sizing = TableSize.getTableSize(table);
  const warehouse = Warehouse.fromTable(table);

  Assert.eq('Width should be 75', 75, sizing.width());
  Assert.eq('Pixel width should be 600px', 600, sizing.pixelWidth());
  Assert.eq('Cell widths should be 50% each', [ 50, 50 ], sizing.getWidths(warehouse, ResizeDirection.ltr, sizing));
  Assert.eq('Cell min width should be at least 10px in percentage (1.25%)', true, sizing.minCellWidth() >= 1.25);

  fc.assert(fc.property(fc.integer(-400, 400), fc.nat(100), (delta, colWidth) => {
    const deltaPercent = delta / 600 * 100;
    Assert.eq('Cell delta should be the same, but in percentage', deltaPercent, sizing.getCellDelta(delta));
    Assert.eq('Single column width should be 100% - percentage width', [ 100 - colWidth ], sizing.singleColumnWidth(colWidth, delta));
  }));

  Remove.remove(container);
});

UnitTest.test('TableSize.noneSizing', () => {
  const table = Element.fromHtml<HTMLTableElement>(noneTableHtml);
  Insert.append(Body.body(), table);

  const sizing = TableSize.getTableSize(table);
  const warehouse = Warehouse.fromTable(table);
  const width = Width.get(table);
  const cellWidth = SelectorFind.descendant<HTMLTableCellElement>(table, 'td').map(Width.get).getOrDie();

  Assert.eq('Width should be the computed size of the table', width, sizing.width());
  Assert.eq('Pixel width should be the computed size of the table', width, sizing.pixelWidth());
  Assert.eq('Cell widths should be the computed size of the cell', [ cellWidth, cellWidth ], sizing.getWidths(warehouse, ResizeDirection.ltr, sizing));
  Assert.eq('Cell min width should be at least 10px', true, sizing.minCellWidth() >= 10);

  fc.assert(fc.property(fc.integer(-390, 390), (delta) => {
    Assert.eq('Cell delta should be identity', delta, sizing.getCellDelta(delta));
    Assert.eq('Single column width should be the column width', [ 400 ], sizing.singleColumnWidth(400, delta));
  }));

  Remove.remove(table);
});
