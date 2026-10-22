'use client';

import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MultiSelectContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedValues: Set<string | number>;
  toggleValue: (value: string | number) => void;
  items: Map<string | number, ReactNode>;
  onItemAdded: (value: string | number, label: ReactNode) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
};
const MultiSelectContext = createContext<MultiSelectContextType | null>(null);

export function MultiSelect({
  children,
  values,
  defaultValues,
  onValuesChange,
  loading,
  hasMore,
  onLoadMore,
}: {
  children: ReactNode;
  values?: (string | number)[];
  defaultValues?: (string | number)[];
  onValuesChange?: (values: (string | number)[]) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [internalValues, setInternalValues] = useState(new Set<string | number>(values ?? defaultValues));
  const selectedValues = values ? new Set(values) : internalValues;
  const [items, setItems] = useState<Map<string | number, ReactNode>>(new Map());

  function toggleValue(value: string | number) {
    const getNewSet = (prev: Set<string | number>) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    };
    setInternalValues(getNewSet);
    onValuesChange?.([...getNewSet(selectedValues)]);
  }

  const onItemAdded = useCallback((value: string | number, label: ReactNode) => {
    setItems(prev => {
      if (prev.get(value) === label) return prev;
      return new Map(prev).set(value, label);
    });
  }, []);

  return (
    <MultiSelectContext
      value={{
        open,
        setOpen,
        selectedValues,
        toggleValue,
        items,
        onItemAdded,
        loading,
        hasMore,
        onLoadMore,
      }}
    >
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        {children}
      </Popover>
    </MultiSelectContext>
  );
}

export function MultiSelectTrigger({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: ReactNode;
} & ComponentPropsWithoutRef<typeof Button>) {
  const { open } = useMultiSelectContext();

  return (
    <PopoverTrigger asChild>
      <Button
        {...props}
        variant={props.variant ?? 'outline'}
        role={props.role ?? 'combobox'}
        aria-expanded={props['aria-expanded'] ?? open}
        className={cn(
          "flex h-auto min-h-9 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 py-1.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
          className
        )}
      >
        {children}
        <ChevronsUpDownIcon className='size-4 shrink-0 opacity-50' />
      </Button>
    </PopoverTrigger>
  );
}

export function MultiSelectValue({
  placeholder,
  clickToRemove = true,
  className,
  overflowBehavior = 'wrap-when-open',
  ...props
}: {
  placeholder?: string;
  clickToRemove?: boolean;
  overflowBehavior?: 'wrap' | 'wrap-when-open' | 'cutoff';
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>) {
  const { selectedValues, toggleValue, items, open } = useMultiSelectContext();
  const [overflowAmount, setOverflowAmount] = useState(0);
  const valueRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  const shouldWrap = overflowBehavior === 'wrap' || (overflowBehavior === 'wrap-when-open' && open);

  const checkOverflow = useCallback(() => {
    if (valueRef.current == null) return;

    const containerElement = valueRef.current;
    const overflowElement = overflowRef.current;
    const items = containerElement.querySelectorAll<HTMLElement>('[data-selected-item]');

    if (overflowElement != null) overflowElement.style.display = 'none';
    items.forEach(child => child.style.removeProperty('display'));
    let amount = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      const child = items[i]!;
      if (containerElement.scrollWidth <= containerElement.clientWidth) {
        break;
      }
      amount = items.length - i;
      child.style.display = 'none';
      overflowElement?.style.removeProperty('display');
    }
    setOverflowAmount(amount);
  }, []);

  const handleResize = useCallback(
    (node: HTMLDivElement) => {
      valueRef.current = node;

      const mutationObserver = new MutationObserver(checkOverflow);
      const observer = new ResizeObserver(debounce(checkOverflow, 100));

      mutationObserver.observe(node, {
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
      observer.observe(node);

      return () => {
        observer.disconnect();
        mutationObserver.disconnect();
        valueRef.current = null;
      };
    },
    [checkOverflow]
  );

  if (selectedValues.size === 0 && placeholder) {
    return <span className='min-w-0 overflow-hidden font-normal text-muted-foreground'>{placeholder}</span>;
  }

  return (
    <div
      {...props}
      ref={handleResize}
      className={cn('flex w-full gap-1.5 overflow-hidden', shouldWrap && 'h-full flex-wrap', className)}
    >
      {[...selectedValues]
        .filter(value => items.has(value))
        .map(value => (
          <Badge
            variant='outline'
            data-selected-item
            className='group flex items-center gap-1'
            key={value}
            onClick={
              clickToRemove
                ? e => {
                    e.stopPropagation();
                    toggleValue(value);
                  }
                : undefined
            }
          >
            {items.get(value)}
            {clickToRemove && <XIcon className='size-2 text-muted-foreground group-hover:text-destructive' />}
          </Badge>
        ))}
      <Badge
        style={{
          display: overflowAmount > 0 && !shouldWrap ? 'block' : 'none',
        }}
        variant='outline'
        ref={overflowRef}
      >
        +{overflowAmount}
      </Badge>
    </div>
  );
}

export function MultiSelectContent({
  search = true,
  children,
  ...props
}: {
  search?: boolean | { placeholder?: string; emptyMessage?: string };
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof Command>, 'children'>) {
  const canSearch = typeof search === 'object' ? true : search;
  const { loading, hasMore, onLoadMore, open } = useMultiSelectContext();
  const commandRef = useRef<HTMLDivElement>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore || !open) {
      return;
    }

    // Use requestAnimationFrame to wait for the DOM to be ready after popover opens
    const rafId = requestAnimationFrame(() => {
      // Find the CommandList element (the actual scrollable container)
      // CommandList typically renders with [cmdk-list] attribute
      const listElement = commandRef.current?.querySelector('[cmdk-list]') as HTMLElement;

      if (!listElement) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = listElement;

        // Trigger when near bottom (within 100px)
        if (scrollTop + clientHeight >= scrollHeight - 100 && !loading) {
          onLoadMore();
        }
      };

      listElement.addEventListener('scroll', handleScroll);
      scrollHandlerRef.current = () => listElement.removeEventListener('scroll', handleScroll);

      // Also check on mount in case content doesn't fill container
      handleScroll();
    });

    return () => {
      cancelAnimationFrame(rafId);
      scrollHandlerRef.current?.();
      scrollHandlerRef.current = null;
    };
  }, [hasMore, loading, onLoadMore, open]);

  return (
    <>
      <div style={{ display: 'none' }}>
        <Command>
          <CommandList>{children}</CommandList>
        </Command>
      </div>
      <PopoverContent className='min-w-[var(--radix-popover-trigger-width)] p-0'>
        <Command {...props} ref={commandRef}>
          {canSearch ? (
            <CommandInput placeholder={typeof search === 'object' ? search.placeholder : undefined} />
          ) : (
            <button autoFocus className='sr-only' />
          )}
          <CommandList>
            {canSearch && <CommandEmpty>{typeof search === 'object' ? search.emptyMessage : undefined}</CommandEmpty>}
            {children}
            {hasMore && (
              <div className='flex items-center justify-center p-4 text-sm text-muted-foreground'>
                {loading ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    <span>Loading more...</span>
                  </div>
                ) : (
                  'Scroll for more'
                )}
              </div>
            )}
            {!hasMore && !loading && (
              <div className='p-2 text-center text-xs text-muted-foreground'>{/* End of list */}</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </>
  );
}

export function MultiSelectItem({
  value,
  children,
  badgeLabel,
  onSelect,
  ...props
}: {
  badgeLabel?: ReactNode;
  value: string | number;
} & Omit<ComponentPropsWithoutRef<typeof CommandItem>, 'value'>) {
  const { toggleValue, selectedValues, onItemAdded } = useMultiSelectContext();
  const isSelected = selectedValues.has(value);

  useEffect(() => {
    onItemAdded(value, badgeLabel ?? children);
  }, [value, children, onItemAdded, badgeLabel]);

  return (
    <CommandItem
      {...props}
      value={String(value)}
      onSelect={() => {
        toggleValue(value);
        onSelect?.(String(value));
      }}
    >
      <CheckIcon className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
      {children}
    </CommandItem>
  );
}

export function MultiSelectGroup(props: ComponentPropsWithoutRef<typeof CommandGroup>) {
  return <CommandGroup {...props} />;
}

export function MultiSelectSeparator(props: ComponentPropsWithoutRef<typeof CommandSeparator>) {
  return <CommandSeparator {...props} />;
}

function useMultiSelectContext() {
  const context = useContext(MultiSelectContext);
  if (context == null) {
    throw new Error('useMultiSelectContext must be used within a MultiSelectContext');
  }
  return context;
}

function debounce<T extends (...args: never[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
