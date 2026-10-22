import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Plus, Search } from 'lucide-react';
import { useCreateCompanyFeatureFlag } from '@/modules/feature-flag/feature-flag.query';
import { EndpointName } from '@/lib/api/types';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import {
  CreateCompanyFeatureFlagBody,
  FeatureFlagHeaderMap,
  FeatureFlagName,
  FeatureFlagNameEnum,
} from '@/modules/feature-flag/feature-flag.type';
import { Switch } from '@/components/ui/switch';
import { useGetAllCompanyWithESmartTimeAndAskGenie } from '@/modules/company/company.query';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type CreateCompanyFeatureFlagForm = {
  companyId: number;
  flags: Partial<Record<FeatureFlagName, boolean>>;
};

type CreateFeatureFlagModalProps = {
  endpoint: EndpointName;
};

const CreateFeatureFlagModal = ({ endpoint }: CreateFeatureFlagModalProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [query, setQuery] = useState('');
  const { mutateAsync: createCompanyFeatureFlag, isPending: isPendingCreateCompanyFeatureFlag } =
    useCreateCompanyFeatureFlag(endpoint);

  const { data: companiesData, isFetching: isFetchingCompanies } = useGetAllCompanyWithESmartTimeAndAskGenie(
    {
      page: 1,
      take: 5,
      q: query,
      sort: 'id',
      order: 'ASC',
    },
    endpoint
  );

  const companies = companiesData?.data;

  const { handleSubmit, watch, setValue, reset } = useForm<CreateCompanyFeatureFlagForm>({
    defaultValues: {
      companyId: 0,
      flags: {
        askGenie: false,
        workflow: false,
        changelog: false,
        myDocument: false,
      },
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const selectedCompanyId = watch('companyId');
  const selectedCompany = companies?.find(company => company.id === selectedCompanyId);
  const enabledCount = Object.values(FeatureFlagNameEnum).filter(featureFlag => watch(`flags.${featureFlag}`)).length;

  const onSubmit = (data: CreateCompanyFeatureFlagForm) => {
    if (!data.companyId) return; // a company must be selected
    createCompanyFeatureFlag({
      companyId: data.companyId,
      body: {
        // Untouched flags are omitted so the company keeps inheriting their defaults
        flags: data.flags as CreateCompanyFeatureFlagBody['flags'],
      },
    })
      .then(() => {
        reset();
        setSearchValue('');
        setOpen(false);
      })
      .catch(() => undefined); // error toast comes from the mutation
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='gap-2'>
          <Plus className='h-4 w-4' />
          Create Company Feature Flag
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Create Company Feature Flag</DialogTitle>
          <DialogDescription>Select a company, then choose which feature flags to override.</DialogDescription>
        </DialogHeader>

        <form className='flex flex-col gap-5' id='createFeatureFlagForm' onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col gap-2'>
            <Label>1. Company</Label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' aria-hidden />
              <Input
                placeholder='Search by company name or ID'
                aria-label='Search for a company'
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                className='pl-9 pr-9'
              />
              {(isFetchingCompanies || searchValue !== query) && (
                <Loader2 className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground' />
              )}
            </div>

            <div className='flex flex-col gap-1.5' role='listbox' aria-label='Companies'>
              {companies?.map(company => {
                const selected = selectedCompanyId === company.id;
                return (
                  <button
                    key={company.id}
                    type='button'
                    role='option'
                    aria-selected={selected}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 w-full text-left cursor-pointer rounded-md border transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected && 'border-primary bg-primary/5'
                    )}
                    onClick={() => setValue('companyId', company.id)}
                  >
                    <span className='text-xs text-muted-foreground tabular-nums w-12 shrink-0'>#{company.id}</span>
                    <span className='text-sm font-medium truncate flex-1'>{company.name}</span>
                    {selected && <Check className='h-4 w-4 text-primary shrink-0' />}
                  </button>
                );
              })}
              {companies && !companies.length && (
                <p className='py-4 text-center text-sm text-muted-foreground'>No companies found.</p>
              )}
              {!!companies?.length && (
                <p className='text-xs text-muted-foreground'>
                  Showing up to 5 results. Refine your search to narrow down.
                </p>
              )}
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between gap-2'>
              <Label>2. Feature flags</Label>
              <span className='text-xs text-muted-foreground'>
                {selectedCompanyId ? (
                  <>
                    For <b className='text-foreground'>{selectedCompany?.name || `#${selectedCompanyId}`}</b> ·{' '}
                  </>
                ) : null}
                {enabledCount} enabled
              </span>
            </div>
            <div className='grid gap-2 sm:grid-cols-2 max-h-[260px] overflow-y-auto rounded-md border p-2'>
              {Object.values(FeatureFlagNameEnum).map(featureFlag => (
                <Label
                  key={featureFlag}
                  htmlFor={featureFlag}
                  className='flex items-center justify-between gap-2 rounded-md px-2 py-2 font-normal cursor-pointer hover:bg-accent/50'
                >
                  <span className='truncate'>{FeatureFlagHeaderMap[featureFlag]}</span>
                  <Switch
                    id={featureFlag}
                    checked={!!watch(`flags.${featureFlag}`)}
                    onCheckedChange={value => setValue(`flags.${featureFlag}`, value)}
                  />
                </Label>
              ))}
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button
            type='submit'
            form='createFeatureFlagForm'
            disabled={isPendingCreateCompanyFeatureFlag || !selectedCompanyId}
          >
            {isPendingCreateCompanyFeatureFlag && <Loader2 className='h-4 w-4 animate-spin' />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFeatureFlagModal;
