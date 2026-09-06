import { DismissableLayerBranch } from '@radix-ui/react-dismissable-layer';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export type Option = {
  label: string;
  value: string;
  /** Soften option/trigger text while keeping the option selectable. */
  muted?: boolean;
};

type MenuPlacement = 'bottom' | 'top';

type MenuPositionStrategy = 'fixed' | 'absolute';

type MenuLayout = {
  readonly positionStrategy: MenuPositionStrategy;
  readonly left: number;
  readonly width: number;
  readonly maxHeight: number;
  readonly placement: MenuPlacement;
  readonly top?: number;
  readonly bottom?: number;
};

type SearchSelectProps = {
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsText?: string;
  allowCreate?: boolean;
  onCreateOption?: (label: string) => Promise<Option> | Option;
  disabled?: boolean;
  className?: string;
  name?: string; // optional form integration
  position?: 'bottom' | 'top';
  /** Renders the menu in a fixed layer so it is not clipped by overflow ancestors (e.g. dialogs). */
  usePortal?: boolean;
  /**
   * Required for smooth wheel/touch scroll when `usePortal` is used inside Radix `Dialog`: mount the menu into this
   * node (place an empty host element inside `DialogContent` and pass it here). Falls back to `document.body` when
   * omitted (scroll may be blocked by `RemoveScroll` outside the dialog content tree).
   */
  portalHost?: HTMLElement | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const MENU_VIEWPORT_PADDING_PX = 8;
const SEARCH_SECTION_APPROX_PX = 52;
const MENU_MIN_HEIGHT_PX = 120;
/** Extra pixels allowed past the portal host bottom/top so the panel can grow when the dialog uses overflow-visible. */
const MENU_HOST_OVERFLOW_ALLOWANCE_PX = 48;

function computeMenuLayoutAdaptive(
  triggerRect: DOMRect,
  preferred: 'bottom' | 'top',
  hostRect: DOMRect | null,
): MenuLayout {
  const gapPx = 4;
  const spaceBelowViewport =
    window.innerHeight - triggerRect.bottom - gapPx - MENU_VIEWPORT_PADDING_PX;
  const spaceAboveViewport = triggerRect.top - gapPx - MENU_VIEWPORT_PADDING_PX;
  const spaceBelowHost =
    hostRect !== null
      ? hostRect.bottom - triggerRect.bottom - gapPx
      : spaceBelowViewport;
  const spaceAboveHost =
    hostRect !== null
      ? triggerRect.top - hostRect.top - gapPx
      : spaceAboveViewport;

  const spaceBelow =
    hostRect !== null
      ? Math.min(spaceBelowViewport, spaceBelowHost)
      : spaceBelowViewport;
  const spaceAbove =
    hostRect !== null
      ? Math.min(spaceAboveViewport, spaceAboveHost)
      : spaceAboveViewport;
  const preferBottom = preferred === 'bottom';

  const openBelow =
    preferBottom && spaceBelow >= MENU_MIN_HEIGHT_PX - SEARCH_SECTION_APPROX_PX
      ? true
      : !preferBottom &&
          spaceAbove >= MENU_MIN_HEIGHT_PX - SEARCH_SECTION_APPROX_PX
        ? false
        : spaceBelow >= spaceAbove;

  if (openBelow) {
    const maxHeightViewport =
      window.innerHeight -
      triggerRect.bottom -
      gapPx -
      MENU_VIEWPORT_PADDING_PX;
    const maxHeightHostTight =
      hostRect !== null
        ? hostRect.bottom - triggerRect.bottom - gapPx
        : maxHeightViewport;
    const maxHeightHostRelaxed =
      hostRect !== null
        ? maxHeightHostTight + MENU_HOST_OVERFLOW_ALLOWANCE_PX
        : maxHeightViewport;
    const maxHeight = Math.max(
      MENU_MIN_HEIGHT_PX,
      Math.min(
        maxHeightViewport,
        maxHeightHostRelaxed,
        window.innerHeight - MENU_VIEWPORT_PADDING_PX * 2,
      ),
    );

    if (hostRect === null) {
      return {
        positionStrategy: 'fixed',
        placement: 'bottom',
        left: triggerRect.left,
        width: triggerRect.width,
        top: triggerRect.bottom + gapPx,
        maxHeight,
      };
    }

    return {
      positionStrategy: 'absolute',
      placement: 'bottom',
      left: triggerRect.left - hostRect.left,
      width: triggerRect.width,
      top: triggerRect.bottom + gapPx - hostRect.top,
      maxHeight,
    };
  }

  const maxHeightViewport = triggerRect.top - gapPx - MENU_VIEWPORT_PADDING_PX;
  const maxHeightHostTight =
    hostRect !== null
      ? triggerRect.top - hostRect.top - gapPx
      : maxHeightViewport;
  const maxHeightHostRelaxed =
    hostRect !== null
      ? maxHeightHostTight + MENU_HOST_OVERFLOW_ALLOWANCE_PX
      : maxHeightViewport;
  const maxHeight = Math.max(
    MENU_MIN_HEIGHT_PX,
    Math.min(
      maxHeightViewport,
      maxHeightHostRelaxed,
      window.innerHeight - MENU_VIEWPORT_PADDING_PX * 2,
    ),
  );

  if (hostRect === null) {
    return {
      positionStrategy: 'fixed',
      placement: 'top',
      left: triggerRect.left,
      width: triggerRect.width,
      bottom: window.innerHeight - triggerRect.top + gapPx,
      maxHeight,
    };
  }

  return {
    positionStrategy: 'absolute',
    placement: 'top',
    left: triggerRect.left - hostRect.left,
    width: triggerRect.width,
    bottom: hostRect.bottom - triggerRect.top + gapPx,
    maxHeight,
  };
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm hoặc thêm mới...',
  noOptionsText = 'Không có kết quả',
  allowCreate = false,
  onCreateOption,
  disabled = false,
  className = '',
  name,
  position = 'bottom',
  usePortal = false,
  portalHost,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [localOptions, setLocalOptions] = useState<Option[]>(options ?? []);
  const [highlight, setHighlight] = useState<number>(-1);
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuPortalRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const syncMenuPosition = useCallback((): void => {
    if (!usePortal || triggerRef.current === null) {
      return;
    }
    const triggerRect: DOMRect = triggerRef.current.getBoundingClientRect();
    const hostRect: DOMRect | null =
      portalHost?.getBoundingClientRect() ?? null;
    setMenuLayout(computeMenuLayoutAdaptive(triggerRect, position, hostRect));
  }, [portalHost, position, usePortal]);

  // Keep local options in sync when props.options change
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuLayout(null);
      return;
    }
    if (!usePortal) {
      return;
    }
    syncMenuPosition();
  }, [open, syncMenuPosition, usePortal]);

  useEffect(() => {
    if (!open || !usePortal) {
      return;
    }
    syncMenuPosition();
    window.addEventListener('resize', syncMenuPosition);
    document.addEventListener('scroll', syncMenuPosition, true);
    return () => {
      window.removeEventListener('resize', syncMenuPosition);
      document.removeEventListener('scroll', syncMenuPosition, true);
    };
  }, [open, syncMenuPosition, usePortal]);

  // After portaled menu mounts, Radix Dialog's trapped FocusScope must pause (child FocusScope
  // registers in useEffect). autoFocus runs too early, so focus the search field on the next tick.
  useEffect(() => {
    if (!open || !usePortal || menuLayout === null) {
      return;
    }
    const timeoutId: number = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, usePortal, menuLayout]);

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent): void {
      const target: Node = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuPortalRef.current?.contains(target)) return;
      setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localOptions ?? [];
    return (
      localOptions.filter((o) =>
        [o.label, o.value].some((t) => t.toLowerCase().includes(q)),
      ) ?? []
    );
  }, [query, localOptions]);

  const existsExact = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return localOptions.some((o) => o.label.toLowerCase() === q);
  }, [query, localOptions]);

  const showCreate = allowCreate && query.trim() && !existsExact;

  useEffect(() => {
    // Reset highlight when list changes or opens
    setHighlight(filtered?.length ? 0 : showCreate ? 0 : -1);
  }, [open, query, filtered?.length, showCreate]);

  useEffect(() => {
    // Ensure highlighted item is visible
    if (!listRef.current || highlight < 0) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlight}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  async function handleCreate(label: string) {
    const base: Option = { label: label.trim(), value: slugify(label) };
    try {
      const created = onCreateOption ? await onCreateOption(label) : base;
      setLocalOptions((prev) => {
        const next = [...prev, created];
        return next;
      });
      onChange(created);
      setQuery('');
      setOpen(false);
    } catch {
      // Do nothing
    }
  }

  function handleSelect(opt: Option) {
    if (opt.value === value?.value) {
      onChange(null);
    } else {
      onChange(opt);
    }
    setOpen(false);
    setQuery('');
  }

  function toggleOpen() {
    if (disabled) return;
    setOpen((o) => !o);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key.length === 1 || e.key === 'ArrowDown')) {
      setOpen(true);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => {
          const count = filtered.length + (showCreate ? 1 : 0);
          if (count === 0) return -1;
          return (h + 1 + count) % count;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => {
          const count = filtered.length + (showCreate ? 1 : 0);
          if (count === 0) return -1;
          return (h - 1 + count) % count;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlight === -1) return;
        if (showCreate && highlight === 0) {
          handleCreate(query);
        } else {
          const idx = highlight - (showCreate ? 1 : 0);
          const opt = filtered[idx];
          if (opt) handleSelect(opt);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative w-full', className)}
      onKeyDown={onKeyDown}
    >
      {name && (
        // Hidden input for form submissions
        <input type="hidden" name={name} value={value?.value ?? ''} />
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggleOpen}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          open && 'ring-2 ring-ring ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>span]:line-clamp-1',
        )}
        disabled={disabled}
      >
        <span
          className={cn(
            'truncate text-left text-sm',
            value?.muted === true ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {value ? (
            value.label
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
      </button>

      {/* Popup (inline — clipped by overflow ancestors) */}
      {open && !usePortal ? (
        <div
          role="dialog"
          aria-label="Select options"
          className={cn(
            'absolute z-50 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            position === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
          )}
        >
          {/* Search */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
            <Search
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Xóa tìm kiếm"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* List */}
          <ul
            ref={listRef}
            role="listbox"
            aria-activedescendant={
              highlight >= 0 ? `opt-${highlight}` : undefined
            }
            className={cn('h-56 overflow-auto p-1')}
          >
            {showCreate && (
              <li
                id={`opt-${0}`}
                data-index={0}
                role="option"
                aria-selected={highlight === 0}
                onMouseEnter={() => setHighlight(0)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleCreate(query)}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none',
                  highlight === 0
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground',
                )}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-input text-xs">
                  +
                </span>
                Thêm "{query.trim()}"
              </li>
            )}

            {filtered.length === 0 && !showCreate && (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">
                {noOptionsText}
              </li>
            )}

            {filtered.map((opt, i) => {
              const idx = i + (showCreate ? 1 : 0);
              const selected = value?.value === opt.value;
              const isMuted: boolean = opt.muted === true;
              return (
                <li
                  key={opt.value}
                  id={`opt-${idx}`}
                  data-index={idx}
                  role="option"
                  aria-selected={highlight === idx}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center justify-between rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none',
                    highlight === idx && 'bg-accent',
                    isMuted
                      ? 'text-muted-foreground'
                      : highlight === idx
                        ? 'text-accent-foreground'
                        : 'text-foreground',
                  )}
                >
                  <span>{opt.label}</span>
                  {selected && (
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Popup (portal — above modal overflow) */}
      {open && usePortal && menuLayout !== null
        ? createPortal(
            <FocusScope trapped={false} loop={false}>
              <DismissableLayerBranch
                ref={menuPortalRef}
                data-slot="search-select-portal"
                role="dialog"
                aria-label="Select options"
                className="pointer-events-auto z-[100] flex !max-h-[300px] flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                style={{
                  position: menuLayout.positionStrategy,
                  left: menuLayout.left,
                  width: menuLayout.width,
                  maxHeight: menuLayout.maxHeight,
                  ...(menuLayout.placement === 'bottom'
                    ? { top: menuLayout.top }
                    : { bottom: menuLayout.bottom }),
                }}
              >
                <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
                  <Search
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      aria-label="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>

                <ul
                  ref={listRef}
                  role="listbox"
                  aria-activedescendant={
                    highlight >= 0 ? `opt-${highlight}` : undefined
                  }
                  className={cn(
                    'min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain p-1',
                  )}
                >
                  {showCreate && (
                    <li
                      id={`opt-${0}`}
                      data-index={0}
                      role="option"
                      aria-selected={highlight === 0}
                      onMouseEnter={() => setHighlight(0)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleCreate(query)}
                      className={cn(
                        'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none',
                        highlight === 0
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground',
                      )}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-input text-xs">
                        +
                      </span>
                      Thêm "{query.trim()}"
                    </li>
                  )}

                  {filtered.length === 0 && !showCreate && (
                    <li className="px-2 py-1.5 text-sm text-muted-foreground">
                      {noOptionsText}
                    </li>
                  )}

                  {filtered.map((opt, i) => {
                    const idx = i + (showCreate ? 1 : 0);
                    const selected = value?.value === opt.value;
                    const isMuted: boolean = opt.muted === true;
                    return (
                      <li
                        key={opt.value}
                        id={`opt-${idx}`}
                        data-index={idx}
                        role="option"
                        aria-selected={highlight === idx}
                        onMouseEnter={() => setHighlight(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(opt)}
                        className={cn(
                          'relative flex w-full cursor-default select-none items-center justify-between rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none',
                          highlight === idx && 'bg-accent',
                          isMuted
                            ? 'text-muted-foreground'
                            : highlight === idx
                              ? 'text-accent-foreground'
                              : 'text-foreground',
                        )}
                      >
                        <span>{opt.label}</span>
                        {selected && (
                          <Check className="h-4 w-4 shrink-0" aria-hidden />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </DismissableLayerBranch>
            </FocusScope>,
            portalHost ?? document.body,
          )
        : null}
    </div>
  );
}
