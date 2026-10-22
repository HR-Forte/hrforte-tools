import { EndpointName } from '../api/types';

export const getEndpointOptions = (...endpoints: EndpointName[]) => {
  return endpoints.map(endpoint => ({
    label: endpoint.replace('_', ' '),
    value: endpoint,
  }));
};
