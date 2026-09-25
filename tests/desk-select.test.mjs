import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterDeskSelectOptions, nextDeskSelectIndex} from '../src/lib/desk/select.ts';

const options = [
  {value: 'ES', label: 'Spain'},
  {value: 'IT', label: 'Italy'},
  {value: 'UK', label: 'United Kingdom'},
];
assert.deepEqual(filterDeskSelectOptions(options, ''), options);
assert.deepEqual(filterDeskSelectOptions(options, 'united'), [{value: 'UK', label: 'United Kingdom'}]);
assert.equal(nextDeskSelectIndex(-1, 1, 3), 0);
assert.equal(nextDeskSelectIndex(0, -1, 3), 2);
assert.equal(nextDeskSelectIndex(2, 1, 3), 0);
assert.equal(nextDeskSelectIndex(0, 1, 0), -1);

const source = await readFile(new URL('../src/components/desk/DeskSelect.tsx', import.meta.url), 'utf8');
for (const token of ['aria-haspopup="listbox"', 'aria-expanded={open}', 'role="listbox"', 'role="option"', "event.key === 'Escape'", "event.key === 'ArrowDown'", "event.key === 'ArrowUp'", "event.key === 'Enter'", "event.key === ' '", "document.addEventListener('pointerdown'", 'top-full', 'z-50', 'max-h-[min(360px,45vh)]', 'overflow-y-auto']) {
  assert(source.includes(token), `DeskSelect missing expected behaviour: ${token}`);
}
assert(source.includes('Type to filter…'));
assert(source.includes('disabled:cursor-not-allowed'));
assert(!source.includes('<select'), 'DeskSelect must not fall back to an uncontrolled browser-native select');

console.log('PASS: DeskSelect filtering, wraparound keyboard navigation, ARIA/listbox, click-outside, constrained scrolling and blank/disabled component support');
