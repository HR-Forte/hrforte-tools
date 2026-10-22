'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export interface InfiniteScrollOption {
  label: string | React.ReactNode;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}

interface InfiniteScrollListProps {
  options: InfiniteScrollOption[];
  value?: string[];
  onSelect?: (values: string[], selectedOptions: InfiniteScrollOption[]) => void;
  onSearchChange?: (search: string) => void;
  onFetchMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  searchDebounceMs?: number;
}

export const InfiniteScrollList: React.FC<InfiniteScrollListProps> = ({
  options,
  value,
  onSelect,
  onSearchChange,
  onFetchMore,
  hasMore = false,
  isLoading = false,
  className,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No options available.',
  loadingMessage = 'Loading more…',
  searchDebounceMs = 300,
}) => {
  const isControlled = Array.isArray(value);
  const [internalValues, setInternalValues] = useState<string[]>(value ?? []);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFirstSearchChange = useRef(true);
  const idPrefix = useId();

  useEffect(() => {
    if (isControlled) {
      setInternalValues(value ?? []);
    }
  }, [isControlled, value]);

  const selectedValues = useMemo(
    () => (isControlled ? (value ?? []) : internalValues),
    [isControlled, internalValues, value]
  );

  const displayedOptions = useMemo(() => {
    if (onSearchChange) {
      return options;
    }

    const lowerSearch = debouncedSearch.trim().toLowerCase();
    if (!lowerSearch) {
      return options;
    }

    return options.filter(
      option => typeof option.label === 'string' && option.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, debouncedSearch, onSearchChange]);

  const handleSelectionChange = useCallback(
    (nextValues: string[]) => {
      if (!isControlled) {
        setInternalValues(nextValues);
      }

      if (onSelect) {
        const selectedOptions = options.filter(option => nextValues.includes(option.value));
        onSelect(nextValues, selectedOptions);
      }
    },
    [isControlled, onSelect, options]
  );

  const toggleValue = useCallback(
    (optionValue: string, checked: boolean) => {
      const nextValues = checked
        ? Array.from(new Set([...selectedValues, optionValue]))
        : selectedValues.filter(v => v !== optionValue);
      handleSelectionChange(nextValues);
    },
    [handleSelectionChange, selectedValues]
  );

  const handleSelectAll = useCallback(() => {
    if (!displayedOptions.length) return;

    const selectableOptions = displayedOptions.filter(option => !option.disabled);
    const allSelectableSelected = selectableOptions.every(option => selectedValues.includes(option.value));

    const nextValues = allSelectableSelected
      ? selectedValues.filter(value => !selectableOptions.some(option => option.value === value))
      : Array.from(new Set([...selectedValues, ...selectableOptions.map(option => option.value)]));

    handleSelectionChange(nextValues);
  }, [displayedOptions, handleSelectionChange, selectedValues]);

  useEffect(() => {
    if (!onFetchMore) return;

    const sentinel = sentinelRef.current;
    const root = listRef.current;

    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !isLoading) {
          onFetchMore();
        }
      },
      {
        root,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onFetchMore]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextSearch = event.target.value;
    setSearchInput(nextSearch);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput);

      if (onSearchChange) {
        if (isFirstSearchChange.current) {
          isFirstSearchChange.current = false;
          if (!searchInput) {
            return;
          }
        }
        onSearchChange(searchInput);
      }
    }, searchDebounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchInput, onSearchChange, searchDebounceMs]);

  const selectableOptionsCount = displayedOptions.filter(option => !option.disabled).length;
  const selectedCount = selectedValues.filter(value =>
    displayedOptions.some(option => option.value === value && !option.disabled)
  ).length;
  const isAllSelected = selectableOptionsCount > 0 && selectableOptionsCount === selectedCount;

  return (
    <Card className={cn('w-full p-4', className)}>
      <CardContent className='p-0 flex flex-col gap-3'>
        <Input
          type='text'
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={searchInput}
          onChange={handleSearchChange}
        />

        <div className='flex items-center justify-between'>
          <Button variant='outline' size='sm' onClick={handleSelectAll} disabled={!displayedOptions.length}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <span className='text-xs text-muted-foreground' aria-live='polite'>
            {selectedValues.length}/{displayedOptions.length} selected
          </span>
        </div>

        <div ref={listRef} className='max-h-60 overflow-y-auto pr-1'>
          {displayedOptions.length === 0 && !isLoading ? (
            <div className='py-6 text-center text-sm text-muted-foreground'>{emptyMessage}</div>
          ) : (
            <div className='flex flex-col gap-2'>
              {displayedOptions.map(option => {
                const checked = selectedValues.includes(option.value);
                const optionId = `${idPrefix}-${option.value}`;
                return (
                  <div key={option.value} className='flex items-center gap-2 rounded-md border border-input px-3 py-2'>
                    <Checkbox
                      id={optionId}
                      checked={checked}
                      disabled={option.disabled}
                      onCheckedChange={state => toggleValue(option.value, state === true)}
                    />
                    <Label
                      htmlFor={optionId}
                      className={cn('flex-1 cursor-pointer', option.disabled && 'text-muted-foreground')}
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}

              {onFetchMore && (
                <div ref={sentinelRef} className='flex justify-center py-3 text-sm text-muted-foreground'>
                  {isLoading ? (
                    <div className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      {loadingMessage}
                    </div>
                  ) : hasMore ? (
                    <span>Scroll to load more…</span>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InfiniteScrollList;
