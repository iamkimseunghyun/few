import 'server-only';

import { createCaller } from '@/server/routers/_app';
import { createContext } from '@/server/context';
import { headers } from 'next/headers';

export const api = createCaller(async () => {
  const headersList = await headers();
  
  // Create a mock request object for the context
  const mockReq = {
    headers: headersList,
    method: 'GET',
    url: 'http://localhost:3000',
  } as unknown as Request;

  return createContext({
    req: mockReq,
    resHeaders: new Headers(),
    info: {
      isBatchCall: false,
      calls: [],
      accept: null,
      type: 'query',
      connectionParams: null,
      signal: new AbortController().signal,
      url: new URL('http://localhost:3000'),
    },
  });
});