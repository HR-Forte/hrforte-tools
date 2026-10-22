import { useState, useCallback, useEffect } from 'react';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '../ui/multi-select';

export interface MultiSelectOption {
  label: string | React.ReactNode;
  value: string | number;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface MultiSelectV2Props<T extends string | number = string | number> {
  /** Array of options to display */
  options?: MultiSelectOption[];
  /** Selected values (controlled) */
  values?: T[];
  /** Default selected values (uncontrolled) */
  defaultValues?: T[];
  /** Callback when selection changes */
  onValuesChange?: (values: T[]) => void;
  /** Type of value to return in onValuesChange ('string' | 'number') */
  valueType?: T extends number ? 'number' : T extends string ? 'string' : 'string' | 'number';
  /** Loading state */
  loading?: boolean;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Callback to load more items */
  onLoadMore?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty message */
  emptyMessage?: string;
  /** Custom className for trigger */
  className?: string;
  /** Enable/disable search */
  search?: boolean | { placeholder?: string; emptyMessage?: string };
}

export const MultiSelectV2 = <T extends string | number = string | number>({
  options = [],
  values,
  defaultValues,
  onValuesChange,
  valueType,
  loading = false,
  hasMore = false,
  onLoadMore,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found.',
  className,
  search = true,
}: MultiSelectV2Props<T>) => {
  const searchConfig =
    typeof search === 'object' ? search : search ? { placeholder: searchPlaceholder, emptyMessage } : false;

  // Convert values based on valueType
  const convertValue = useCallback(
    (value: string | number): T => {
      if (valueType === 'number') {
        return (typeof value === 'number' ? value : parseInt(value)) as T;
      }
      if (valueType === 'string') {
        return String(value) as T;
      }
      // If no valueType specified, return as-is
      return value as T;
    },
    [valueType]
  );

  const handleValuesChange = useCallback(
    (newValues: (string | number)[]) => {
      if (onValuesChange) {
        const convertedValues = newValues.map(convertValue);
        onValuesChange(convertedValues);
      }
    },
    [onValuesChange, convertValue]
  );

  return (
    <MultiSelect
      values={values}
      defaultValues={defaultValues}
      onValuesChange={handleValuesChange}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
    >
      <MultiSelectTrigger className={className || 'w-full max-w-[400px]'}>
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent search={searchConfig}>
        <MultiSelectGroup>
          {options.map(option => (
            <MultiSelectItem
              key={option.value}
              value={option.value}
              {...(option.disabled && { disabled: option.disabled })}
            >
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
};

// Example usage with infinite scroll
export const MultiSelectV2WithInfiniteScroll = () => {
  const [options, setOptions] = useState<MultiSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>([]);

  // Simulate fetching data with number IDs
  const fetchOptions = useCallback(async (pageNum: number) => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pageSize = 20;
    const newOptions: MultiSelectOption[] = Array.from({ length: pageSize }, (_, i) => ({
      value: pageNum * pageSize + i + 1, // Using number IDs
      label: `Option ${pageNum * pageSize + i + 1}`,
    }));

    setOptions(prev => [...prev, ...newOptions]);
    setHasMore(pageNum < 4); // Stop after 5 pages (100 items)
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchOptions(0);
  }, [fetchOptions]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOptions(nextPage);
    }
  }, [loading, hasMore, page, fetchOptions]);

  return (
    <MultiSelectV2
      options={options}
      values={selectedValues}
      onValuesChange={setSelectedValues}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      placeholder='Select frameworks...'
      searchPlaceholder='Search frameworks...'
      emptyMessage='No frameworks found.'
      className='w-full max-w-[400px]'
    />
  );
};
