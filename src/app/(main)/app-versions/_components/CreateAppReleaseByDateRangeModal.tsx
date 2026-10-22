'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useCreateAppReleaseByDateRange,
  useReviewCreateAppReleaseByDateRange,
} from '@/modules/change-log/change-log.query';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { CalendarRange, ChevronLeft, ChevronRight, Eye, Layers, Plus, Rocket } from 'lucide-react';
import { useState } from 'react';
import { EndpointName } from '@/lib/api/types';
import { CreateAppReleaseByDateRangeBody, ReviewCreateAppReleaseByDateRangeResponse } from '@/modules/change-log/change-log.type';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Tailwind classNames for DayPicker v10 ─────────────────────────────────

const dayPickerClassNames = {
  root: 'p-3',
  months: 'relative',
  month: 'flex flex-col gap-4',
  month_caption: 'flex items-center justify-center h-7 relative',
  caption_label: 'text-sm font-semibold',
  nav: 'absolute inset-0 flex items-center justify-between pointer-events-none z-10',
  button_previous:
    'pointer-events-auto h-7 w-7 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors disabled:opacity-50',
  button_next:
    'pointer-events-auto h-7 w-7 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors disabled:opacity-50',
  chevron: 'h-4 w-4',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'text-muted-foreground rounded-md w-9 text-[0.8rem] font-normal text-center',
  weeks: 'mt-2',
  week: 'flex mt-1',
  day: 'relative p-0 text-center [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md [&:has([data-range-end])]:rounded-r-md [&:has([data-range-start])]:rounded-l-md [&:has([data-outside])]:opacity-50',
  day_button:
    'h-9 w-9 text-sm rounded-md font-normal hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-selected:opacity-100 transition-colors',
  selected:
    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
  range_start: 'rounded-r-none bg-primary text-primary-foreground',
  range_end: 'rounded-l-none bg-primary text-primary-foreground',
  range_middle: 'rounded-none bg-accent text-accent-foreground',
  today: 'bg-accent text-accent-foreground font-semibold',
  outside: 'text-muted-foreground opacity-30',
  disabled: 'text-muted-foreground opacity-30 cursor-not-allowed',
  hidden: 'invisible',
};

// ─── Preset helpers ─────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
];

function getPresetRange(days: number): DateRange {
  const today = new Date();
  return { from: startOfDay(subDays(today, days - 1)), to: endOfDay(today) };
}

// ─── Date Range Picker ───────────────────────────────────────────────────────

type DateRangePickerProps = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const displayText =
    value?.from && value?.to
      ? `${format(value.from, 'dd/MM/yyyy')} → ${format(value.to, 'dd/MM/yyyy')}`
      : value?.from
        ? `${format(value.from, 'dd/MM/yyyy')} → …`
        : 'Select date range';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal gap-2 h-10',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarRange className='h-4 w-4 shrink-0' />
          <span>{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        {/* Quick presets */}
        <div className='flex gap-1 p-3 border-b'>
          {PRESETS.map(preset => (
            <Button
              key={preset.days}
              variant='outline'
              size='sm'
              className='text-xs h-7'
              onClick={() => {
                onChange(getPresetRange(preset.days));
                setOpen(false);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <DayPicker
          mode='range'
          selected={value}
          onSelect={onChange}
          numberOfMonths={1}
          disabled={{ after: new Date() }}
          classNames={dayPickerClassNames}
          components={{
            Chevron: ({ orientation }) =>
              orientation === 'left' ? (
                <ChevronLeft className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              ),
          }}
        />
        {value && (
          <div className='p-3 border-t flex justify-end'>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs text-muted-foreground'
              onClick={() => onChange(undefined)}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Review Panel ────────────────────────────────────────────────────────────

function ReviewPanel({ data }: { data: ReviewCreateAppReleaseByDateRangeResponse }) {
  if (!data.length) {
    return (
      <div className='flex flex-col items-center justify-center py-10 text-muted-foreground gap-2'>
        <Layers className='h-8 w-8 opacity-40' />
        <p className='text-sm'>No releases found for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <p className='text-xs text-muted-foreground uppercase tracking-wide font-semibold'>
        {data.length} release{data.length > 1 ? 's' : ''} will be created
      </p>
      {data.map((item, idx) => (
        <Card key={idx} className='border-border'>
          <CardContent className='p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>
                {format(new Date(item.date), 'dd MMM yyyy')}
              </span>
              <Badge variant='default' className='font-mono text-xs'>
                v{item.appVersion}
              </Badge>
            </div>
            {item.componentReleases.length > 0 ? (
              <div className='flex flex-wrap gap-1.5'>
                {item.componentReleases.map(cr => (
                  <Badge
                    key={cr.id}
                    className='text-xs'
                    style={{ backgroundColor: REPO_NAME_MAPPING?.[cr.repoName]?.color }}
                  >
                    {REPO_NAME_MAPPING?.[cr.repoName]?.name || cr.repoName} v{cr.repoVersion}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground italic'>No component releases</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

const CreateAppReleaseByDateRangeModal = ({ endpoint }: { endpoint: EndpointName }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'review'>('select');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reviewData, setReviewData] = useState<ReviewCreateAppReleaseByDateRangeResponse | null>(null);

  const { mutateAsync: createAppReleaseByDateRange, isPending } = useCreateAppReleaseByDateRange(endpoint);
  const { mutateAsync: reviewCreateAppReleaseByDateRange, isPending: isReviewing } =
    useReviewCreateAppReleaseByDateRange(endpoint);

  const toApiBody = (): CreateAppReleaseByDateRangeBody | null => {
    if (!dateRange?.from || !dateRange?.to) return null;
    return {
      startDate: format(dateRange.from, 'yyyy-MM-dd'),
      endDate: format(dateRange.to, 'yyyy-MM-dd'),
    };
  };

  const handleReview = async () => {
    const body = toApiBody();
    if (!body) {
      toast.error('Please select a valid date range');
      return;
    }
    const response = await reviewCreateAppReleaseByDateRange(body);
    setReviewData(response);
    setStep('review');
  };

  const handleCreate = async () => {
    const body = toApiBody();
    if (!body) return;
    await createAppReleaseByDateRange(body);
    setOpen(false);
  };

  const handleBack = () => {
    setStep('select');
    setReviewData(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep('select');
      setDateRange(undefined);
      setReviewData(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' size='lg' className='gap-2'>
          <Plus className='w-4 h-4' />
          Create App Release by Date Range
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CalendarRange className='w-5 h-5 text-primary' />
            {step === 'select' ? 'Select Date Range' : 'Review Releases'}
          </DialogTitle>
        </DialogHeader>

        <div className='py-2'>
          {step === 'select' && (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>
                  Choose a date range to generate app releases from component releases within that period.
                </p>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
              {dateRange?.from && dateRange?.to && (
                <div className='text-xs text-muted-foreground bg-muted rounded-md px-3 py-2'>
                  Selected: <span className='font-medium text-foreground'>{format(dateRange.from, 'dd MMM yyyy')}</span>
                  {' '}&rarr;{' '}
                  <span className='font-medium text-foreground'>{format(dateRange.to, 'dd MMM yyyy')}</span>
                </div>
              )}
            </div>
          )}

          {step === 'review' && reviewData && (
            <div className='max-h-[400px] overflow-y-auto pr-1'>
              <ReviewPanel data={reviewData} />
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 pt-2 border-t'>
          {step === 'select' ? (
            <>
              <Button variant='outline' onClick={() => handleOpenChange(false)} disabled={isReviewing}>
                Cancel
              </Button>
              <Button
                onClick={handleReview}
                disabled={!dateRange?.from || !dateRange?.to || isReviewing}
                className='gap-2 min-w-[120px]'
              >
                {isReviewing ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                    Reviewing…
                  </>
                ) : (
                  <>
                    <Eye className='w-4 h-4' />
                    Review
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant='outline' onClick={handleBack} disabled={isPending}>
                <ChevronLeft className='w-4 h-4 mr-1' />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isPending || !reviewData?.length}
                className='gap-2 min-w-[150px]'
              >
                {isPending ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                    Creating…
                  </>
                ) : (
                  <>
                    <Rocket className='w-4 h-4' />
                    Create App Release
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAppReleaseByDateRangeModal;
