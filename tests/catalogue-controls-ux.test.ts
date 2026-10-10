import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("catalogue page-size control is accessible, dark, and resets pagination", () => {
  const source = readFileSync("app/components/items-selector/ItemsSelector.tsx", "utf8");
  assert.match(source, /<select id="catalogue-page-size"/);
  assert.match(source, /aria-label="Items per page"/);
  assert.match(source, /params.set\("page", "1"\)/);
  assert.match(source, /new URLSearchParams\(searchParams.toString\(\)\)/);
  assert.match(source, /bg-\[#24211E\]/);
  assert.doesNotMatch(source, /bg-blue-|peer-hover/);
});
test("pagination uses a consistent dark theme and accessible current page", () => {
  const source = readFileSync("app/components/catalogue/Pagination.tsx", "utf8");
  assert.match(source, /aria-current={page === currentPage \? "page" : undefined}/);
  assert.match(source, /border-\[#DAA276\] bg-\[#DAA276\]/);
  assert.match(source, /bg-\[#24211E\]/);
  assert.match(source, /aria-label="Pagination"/);
  assert.match(source, /totalPages <= 1/);
  assert.doesNotMatch(source, /bg-white|border-gray-100|bg-blue/);
});
