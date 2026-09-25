export interface DeskSelectOption {
  value: string;
  label: string;
}

export function filterDeskSelectOptions(options: DeskSelectOption[], query: string) {
  const needle = query.trim().toLocaleLowerCase('en-GB');
  if (!needle) return options;
  return options.filter(option => option.label.toLocaleLowerCase('en-GB').includes(needle));
}

export function nextDeskSelectIndex(current: number, direction: 1 | -1, length: number) {
  if (length <= 0) return -1;
  if (current < 0) return direction === 1 ? 0 : length - 1;
  return (current + direction + length) % length;
}
