import { DefaultError, useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useTopLoader } from 'nextjs-toploader';

type UseCustomMutationProps<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = UseMutationOptions<TData, TError, TVariables, TContext> & { topBarLoading?: boolean };

export function useCustomMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>({
  topBarLoading = true,
  ...options
}: UseCustomMutationProps<TData, TError, TVariables, TContext>) {
  const loader = useTopLoader();

  return useMutation({
    retry: false,
    ...options,
    onMutate: (variables: TVariables) => {
      if (topBarLoading) {
        loader.start();
        loader.inc(loader.trickle());
      }
      return options.onMutate?.(variables);
    },
    onSuccess: (data, variables, context) => {
      if (topBarLoading) {
        loader.done();
      }
      return options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (topBarLoading) {
        loader.done();
      }
      return options.onError?.(error, variables, context);
    },
  });
}
