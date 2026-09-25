'use client';

import {useEffect, useId, useMemo, useRef, useState, type KeyboardEvent} from 'react';
import {filterDeskSelectOptions, nextDeskSelectIndex, type DeskSelectOption} from '@/lib/desk/select';

type Props = {
  id?: string;
  label: string;
  value: string;
  placeholder: string;
  options: DeskSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  loadingText?: string;
};

export default function DeskSelect({id, label, value, placeholder, options, onChange, disabled = false, searchable = false, loadingText}: Props) {
  const reactId = useId();
  const controlId = id ?? `desk-select-${reactId.replace(/:/g, '')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const filtered = useMemo(() => filterDeskSelectOptions(options, query), [options, query]);
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = filtered.findIndex(option => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : (filtered.length ? 0 : -1));
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, filtered, searchable, value]);

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  function close() {
    setOpen(false);
    setQuery('');
  }

  function choose(option: DeskSelectOption) {
    onChange(option.value);
    close();
  }

  function move(direction: 1 | -1) {
    setActiveIndex(index => nextDeskSelectIndex(index, direction, filtered.length));
  }

  function handleKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      if (open) { event.preventDefault(); close(); }
      return;
    }
    if (!open && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
    else if (event.key === 'Enter' && activeIndex >= 0 && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex]);
    }
  }

  const displayValue = disabled && loadingText ? loadingText : selected?.label ?? placeholder;

  return <div ref={rootRef} className="relative min-w-0">
    <span id={`${controlId}-label`} className="text-sm font-semibold">{label}</span>
    <button
      id={controlId}
      type="button"
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={`${controlId}-listbox`}
      aria-labelledby={`${controlId}-label ${controlId}-value`}
      onClick={() => { if (!disabled) setOpen(value => !value); }}
      onKeyDown={handleKeyboard}
      className="mt-2 flex w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-black px-3 py-3 text-left text-white outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span id={`${controlId}-value`} className={`min-w-0 truncate ${selected ? '' : 'text-muted'}`}>{displayValue}</span>
      <span aria-hidden="true" className="shrink-0 text-xs text-muted">▾</span>
    </button>
    {open && !disabled && <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[12rem] overflow-hidden rounded-lg border border-white/15 bg-black shadow-2xl">
      {searchable && <div className="border-b border-white/10 p-2">
        <input
          ref={searchRef}
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={handleKeyboard}
          aria-label={`Filter ${label.toLowerCase()} options`}
          placeholder="Type to filter…"
          className="w-full rounded-md border border-white/15 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand"
        />
      </div>}
      <ul id={`${controlId}-listbox`} role="listbox" aria-labelledby={`${controlId}-label`} className="max-h-[min(360px,45vh)] overflow-y-auto overscroll-contain py-1">
        {filtered.length ? filtered.map((option, index) => <li
          key={option.value}
          id={`${controlId}-option-${index}`}
          role="option"
          aria-selected={option.value === value}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseDown={event => event.preventDefault()}
          onClick={() => choose(option)}
          className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm ${index === activeIndex ? 'bg-white/10' : ''} ${option.value === value ? 'text-brand' : 'text-white'}`}
        >
          <span>{option.label}</span><span aria-hidden="true">{option.value === value ? '✓' : ''}</span>
        </li>) : <li className="px-3 py-3 text-sm text-muted">No matching options.</li>}
      </ul>
    </div>}
  </div>;
}
