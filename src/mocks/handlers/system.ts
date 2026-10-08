import { HttpResponse } from 'msw'

import { route } from '../http'

export const systemHandlers = [
  route(
    'get',
    '/health',
    { operation: 'system.health', label: 'Saúde da API' },
    () => HttpResponse.json({ status: 'ok', time: new Date().toISOString() }),
  ),
]
