import { assert, UnitTest } from '@ephox/bedrock-client';
import { Body, Element, Insert, Remove, Css } from '@ephox/sugar';
import { ResizeDirection } from 'ephox/snooker/api/ResizeDirection';
import * as Adjustments from 'ephox/snooker/resize/Adjustments';
import { HTMLTableElement, HTMLDivElement } from '@ephox/dom-globals';
import { Arr } from '@ephox/katamari';
import { ColumnResizing } from 'ephox/snooker/api/Main';

UnitTest.test('ResizeTest', () => {
  const boundBox = '<div style="width: 800px; height: 600px; display: block;"></div>';
  const box = Element.fromHtml<HTMLDivElement>(boundBox);
  Insert.append(Body.body(), box);

  const relativeTable = () => Element.fromHtml<HTMLTableElement>(`<table style="border-collapse: collapse; width: 50%;" border="1">
  <tbody>
  <tr>
  <td style="width: 25%;">a</td>
  <td style="width: 25%;">b</td>
  <td style="width: 25%;">c</td>
  <td style="width: 25%;">d</td>
  </tr>
  <tr>
  <td style="width: 25%;">e</td>
  <td style="width: 25%;">f</td>
  <td style="width: 25%;">g</td>
  <td style="width: 25%;">h</td>
  </tr>
  </tbody>
  </table>`);

  const pixelTable = () => Element.fromHtml<HTMLTableElement>(`<table style="border-collapse: collapse; width: 400px;" border="1">
  <tbody>
  <tr>
  <td style="width: 96.75px;">a</td>
  <td style="width: 96.75px;">b</td>
  <td style="width: 96.75px;">c</td>
  <td style="width: 96.75px;">d</td>
  </tr>
  <tr>
  <td style="width: 96.75px;">e</td>
  <td style="width: 96.75px;">f</td>
  <td style="width: 96.75px;">g</td>
  <td style="width: 96.75px;">h</td>
  </tr>
  </tbody>
  </table>`);

  const percentageToStep = (percentage: number, width: number) => percentage / 100 * width;
  // Note: Will not work for tables with colspans or rowspans
  const getColumnWidths = (table: Element<HTMLTableElement>) => Arr.map(table.dom().rows[0].cells, (cell) => parseFloat(Css.getRaw(Element.fromDom(cell), 'width').getOr('0')));

  const testAdjustWidth = (msg: string, expectedWidth: number, expectedColumnWidths: number[], table: Element<HTMLTableElement>, step: number, index: number, direction: ResizeDirection, columnSizing: ColumnResizing) => {
    Insert.append(box, table);
    Adjustments.adjustWidth(table, step, index, direction, columnSizing);

    const actualTableWidth = parseFloat(Css.getRaw(table, 'width').getOrDie());
    assert.eq(actualTableWidth, expectedWidth, `${msg} - table widths should match: expected: ${expectedWidth}, actual: ${actualTableWidth}`);

    const widths = getColumnWidths(table);
    const widthDiffsPercentages = Arr.map(expectedColumnWidths, (x, i) => (widths[i] - x) / widths[i] * 100);
    // Verify that the differnce is less than 1% this is to allow for floating point errors
    Arr.each(widthDiffsPercentages, (x) => {
      assert.eq(true, Math.abs(x) < 1, `${msg} - columns widths should match: expected: ${expectedColumnWidths}, actual: ${widths}`);
    });

    Remove.remove(table);
  };

  const testInnerColumnResizing = () => {
    Arr.each([ 'default', 'static' ] as ColumnResizing[], (mode) => {
      testAdjustWidth(`ltr step (%) - ${mode} (0)`, 50, [ 37.5, 12.5, 25, 25 ], relativeTable(), percentageToStep(12.5, 400), 0, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr step (%) - ${mode} (1)`, 50, [ 25, 37.5, 12.5, 25 ], relativeTable(), percentageToStep(12.5, 400), 1, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr step (%) - ${mode} (2)`, 50, [ 25, 25, 37.5, 12.5 ], relativeTable(), percentageToStep(12.5, 400), 2, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (%) - ${mode} (0)`, 50, [ 47.5, 2.5, 25, 25 ], relativeTable(), percentageToStep(50, 400), 0, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (%) - ${mode} (1)`, 50, [ 25, 47.5, 2.5, 25 ], relativeTable(), percentageToStep(50, 400), 1, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (%) - ${mode} (2)`, 50, [ 25, 25, 47.5, 2.5 ], relativeTable(), percentageToStep(50, 400), 2, ResizeDirection.ltr, mode);
      testAdjustWidth(`rtl step (%) - ${mode} (0)`, 50, [ 12.5, 37.5, 25, 25 ], relativeTable(), percentageToStep(-12.5, 400), 0, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl step (%) - ${mode} (1)`, 50, [ 25, 12.5, 37.5, 25 ], relativeTable(), percentageToStep(-12.5, 400), 1, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl step (%) - ${mode} (2)`, 50, [ 25, 25, 12.5, 37.5 ], relativeTable(), percentageToStep(-12.5, 400), 2, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (%) - ${mode} (0)`, 50, [ 2.5, 47.5, 25, 25 ], relativeTable(), percentageToStep(-50, 400), 0, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (%) - ${mode} (1)`, 50, [ 25, 2.5, 47.5, 25 ], relativeTable(), percentageToStep(-50, 400), 1, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (%) - ${mode} (2)`, 50, [ 25, 25, 2.5, 47.5 ], relativeTable(), percentageToStep(-50, 400), 2, ResizeDirection.rtl, mode);
      testAdjustWidth(`ltr step (px) - ${mode} (0)`, 400, [ 146, 46, 96, 96 ], pixelTable(), 50, 0, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr step (px) - ${mode} (1)`, 400, [ 96, 146, 46, 96 ], pixelTable(), 50, 1, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr step (px) - ${mode} (2)`, 400, [ 96, 96, 146, 46 ], pixelTable(), 50, 2, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (px) - ${mode} (0)`, 400, [ 182, 10, 96, 96 ], pixelTable(), 200, 0, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (px) - ${mode} (1)`, 400, [ 96, 182, 10, 96 ], pixelTable(), 200, 1, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (px) - ${mode} (2)`, 400, [ 96, 96, 182, 10 ], pixelTable(), 200, 2, ResizeDirection.ltr, mode);
      testAdjustWidth(`rtl step (px) - ${mode} (0)`, 400, [ 46, 146, 96, 96 ], pixelTable(), -50, 0, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl step (px) - ${mode} (1)`, 400, [ 96, 46, 146, 96 ], pixelTable(), -50, 1, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl step (px) - ${mode} (2)`, 400, [ 96, 96, 46, 146 ], pixelTable(), -50, 2, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (px) - ${mode} (0)`, 400, [ 10, 182, 96, 96 ], pixelTable(), -200, 0, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (px) - ${mode} (1)`, 400, [ 96, 10, 182, 96 ], pixelTable(), -200, 1, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (px) - ${mode} (2)`, 400, [ 96, 96, 10, 182 ], pixelTable(), -200, 2, ResizeDirection.rtl, mode);
    });

    // 'resiztable' column sizing
    testAdjustWidth(`ltr step (%) - resiztable (0)`, 56.25, [ 33.33, 22.22, 22.22, 22.22 ], relativeTable(), percentageToStep(12.5, 400), 0, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`ltr step (%) - resiztable (1)`, 56.25, [ 22.22, 33.33, 22.22, 22.22 ], relativeTable(), percentageToStep(12.5, 400), 1, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`ltr step (%) - resiztable (2)`, 56.25, [ 22.22, 22.22, 33.33, 22.22 ], relativeTable(), percentageToStep(12.5, 400), 2, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`rtl large step (%) - resiztable (0)`, 75, [ 50, 16.67, 16.67, 16.67 ], relativeTable(), percentageToStep(50, 400), 0, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`rtl large step (%) - resiztable (1)`, 75, [ 16.67, 50, 16.67, 16.67 ], relativeTable(), percentageToStep(50, 400), 1, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`rtl large step (%) - resiztable (2)`, 75, [ 16.67, 16.67, 50, 16.67 ], relativeTable(), percentageToStep(50, 400), 2, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`rtl step (%) - resiztable (0)`, 43.75, [ 14.29, 28.57, 28.57, 28.57 ], relativeTable(), percentageToStep(-12.5, 400), 0, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl step (%) - resiztable (1)`, 43.75, [ 28.57, 14.29, 28.57, 28.57 ], relativeTable(), percentageToStep(-12.5, 400), 1, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl step (%) - resiztable (2)`, 43.75, [ 28.57, 28.57, 14.29, 28.57 ], relativeTable(), percentageToStep(-12.5, 400), 2, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl large step (%) - resiztable (0)`, 38.75, [ 3.23, 32.26, 32.26, 32.26 ], relativeTable(), percentageToStep(-50, 400), 0, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl large step (%) - resiztable (1)`, 38.75, [ 32.26, 3.23, 32.26, 32.26 ], relativeTable(), percentageToStep(-50, 400), 1, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl large step (%) - resiztable (2)`, 38.75, [ 32.26, 32.26, 3.23, 32.26 ], relativeTable(), percentageToStep(-50, 400), 2, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`ltr step (px) - resiztable (0)`, 450, [ 146, 96, 96, 96 ], pixelTable(), 50, 0, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`ltr step (px) - resiztable (1)`, 450, [ 96, 146, 96, 96 ], pixelTable(), 50, 1, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`ltr step (px) - resiztable (2)`, 450, [ 96, 96, 146, 96 ], pixelTable(), 50, 2, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`ltr large step (px) - resiztable (0)`, 600, [ 296, 96, 96, 96 ], pixelTable(), 200, 0, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`ltr large step (px) - resiztable (1)`, 600, [ 96, 296, 96, 96 ], pixelTable(), 200, 1, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`ltr large step (px) - resiztable (2)`, 600, [ 96, 96, 296, 96 ], pixelTable(), 200, 2, ResizeDirection.ltr, 'resizetable');
    testAdjustWidth(`rtl step (px) - resiztable (0)`, 350, [ 46, 96, 96, 96 ], pixelTable(), -50, 0, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl step (px) - resiztable (1)`, 350, [ 96, 46, 96, 96 ], pixelTable(), -50, 1, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl step (px) - resiztable (2)`, 350, [ 96, 96, 46, 96 ], pixelTable(), -50, 2, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl large step (px) - resiztable (0)`, 314, [ 10, 96, 96, 96 ], pixelTable(), -200, 0, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl large step (px) - resiztable (1)`, 314, [ 96, 10, 96, 96 ], pixelTable(), -200, 1, ResizeDirection.rtl, 'resizetable');
    testAdjustWidth(`rtl large step (px) - resiztable (2)`, 314, [ 96, 96, 10, 96 ], pixelTable(), -200, 2, ResizeDirection.rtl, 'resizetable');
  };

  const testLastColumnResizing = () => {
    Arr.each([ 'static', 'resizetable' ] as ColumnResizing[], (mode) => {
      testAdjustWidth(`ltr step (%) - ${mode} (3)`, 56.25, [ 22.22, 22.22, 22.22, 33.33 ], relativeTable(), percentageToStep(12.5, 400), 3, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (%) - ${mode} (3)`, 75, [ 16.67, 16.67, 16.67, 50 ], relativeTable(), percentageToStep(50, 400), 3, ResizeDirection.ltr, mode);
      testAdjustWidth(`rtl step (%) - ${mode} (3)`, 43.75, [ 28.57, 28.57, 28.57, 14.29 ], relativeTable(), percentageToStep(-12.5, 400), 3, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (%) - ${mode} (3)`, 38.75, [ 32.26, 32.26, 32.26, 3.23 ], relativeTable(), percentageToStep(-50, 400), 3, ResizeDirection.rtl, mode);
      testAdjustWidth(`ltr step (px) - ${mode} (3)`, 450, [ 96, 96, 96, 146 ], pixelTable(), 50, 3, ResizeDirection.ltr, mode);
      testAdjustWidth(`ltr large step (px) - ${mode} (3)`, 600, [ 96, 96, 96, 296 ], pixelTable(), 200, 3, ResizeDirection.ltr, mode);
      testAdjustWidth(`rtl step (px) - ${mode} (3)`, 350, [ 96, 96, 96, 46 ], pixelTable(), -50, 3, ResizeDirection.rtl, mode);
      testAdjustWidth(`rtl large step (px) - ${mode} (3)`, 314, [ 96, 96, 96, 10 ], pixelTable(), -200, 3, ResizeDirection.rtl, mode);
    });

    // Default column sizing
    testAdjustWidth(`ltr large step (%) - default (3)`, 56.25, [ 25, 25, 25, 25 ], relativeTable(), percentageToStep(12.5, 400), 3, ResizeDirection.ltr, 'default');
    testAdjustWidth(`ltr large step (%) - default (3)`, 75, [ 25, 25, 25, 25 ], relativeTable(), percentageToStep(50, 400), 3, ResizeDirection.ltr, 'default');
    testAdjustWidth(`rtl step (%) - default (3)`, 43.75, [ 25, 25, 25, 25 ], relativeTable(), percentageToStep(-12.5, 400), 3, ResizeDirection.rtl, 'default');
    testAdjustWidth(`rtl large step (%) - default (3)`, 25, [ 25, 25, 25, 25 ], relativeTable(), percentageToStep(-50, 400), 3, ResizeDirection.rtl, 'default');
    testAdjustWidth(`ltr step (px) - default (3)`, 450, [ 108, 108, 108, 108 ], pixelTable(), 50, 3, ResizeDirection.ltr, 'default');
    testAdjustWidth(`ltr large step (px) - default (3)`, 600, [ 146, 146, 146, 146 ], pixelTable(), 200, 3, ResizeDirection.ltr, 'default');
    testAdjustWidth(`rtl step (px) - default (3)`, 350, [ 83, 83, 83, 83 ], pixelTable(), -50, 3, ResizeDirection.rtl, 'default');
    testAdjustWidth(`rtl large step (px) - default (3)`, 200, [ 46, 46, 46, 46 ], pixelTable(), -200, 3, ResizeDirection.rtl, 'default');
  };

  testInnerColumnResizing();
  testLastColumnResizing();

  Remove.remove(box);
});
