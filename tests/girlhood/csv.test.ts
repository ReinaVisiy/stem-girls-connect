import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell } from "../../shared/csv";
test("newsletter CSV preserves cells and prevents untrusted spreadsheet formulas", () => {
  assert.equal(csvCell("normal@example.org"), '"normal@example.org"');
  assert.equal(csvCell('a,"b"@example.org'), '"a,""b""@example.org"');
  assert.equal(csvCell("=1+1@example.org"), '"\'=1+1@example.org"');
  assert.equal(csvCell(" +SUM(1)@example.org"), '"\' +SUM(1)@example.org"');
  assert.equal(csvCell(null), '""');
});
