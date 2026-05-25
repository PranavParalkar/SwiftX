/**
 * Reusable Supabase client mock.
 *
 * Lets a test script up a query result like:
 *
 *   const sb = createMockSupabase()
 *   sb.queue('profiles', 'select', { data: { id: 'u1', role: 'admin' }, error: null })
 *   await sb.from('profiles').select('*').eq('id', 'u1').single()
 *
 * Each chained method returns `this` so .from().select().eq().single() works.
 */

type Result = { data: any; error: any | null; count?: number }
type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete' | 'rpc'

export interface MockSupabase {
  from: jest.Mock
  rpc: jest.Mock
  auth: {
    getUser: jest.Mock
    signInWithPassword: jest.Mock
    signOut: jest.Mock
    admin: {
      createUser: jest.Mock
      deleteUser: jest.Mock
    }
  }
  // Test-side controls
  queue: (table: string, op: Op, result: Result) => void
  resetQueues: () => void
  /** Inspect the last call to .insert / .update / .upsert for a given table. */
  lastWrite: (table: string) => any
}

interface QItem { result: Result }

export function createMockSupabase(): MockSupabase {
  // Per-table, per-op queues: table → op → list of results
  const queues = new Map<string, Map<Op, QItem[]>>()
  const lastWrites = new Map<string, any>()
  const lastRpc: Record<string, any> = {}

  function dequeue(table: string, op: Op): Result {
    const t = queues.get(table)
    const list = t?.get(op)
    if (list && list.length > 0) return list.shift()!.result
    // Sensible default
    if (op === 'select') return { data: null, error: null }
    return { data: { id: 'generated-id' }, error: null }
  }

  function buildBuilder(table: string, op: Op, writePayload?: any) {
    if (writePayload !== undefined) lastWrites.set(table, writePayload)
    const builder: any = {}
    const chainable = ['eq', 'or', 'order', 'limit', 'in', 'gte', 'lte', 'gt', 'lt',
                       'is', 'neq', 'ilike', 'like', 'match', 'filter', 'range',
                       'select', 'maybeSingle', 'single', 'returns']
    chainable.forEach(m => { builder[m] = jest.fn(() => builder) })

    const finalise = () => Promise.resolve(dequeue(table, op))
    // Some terminators return a promise:
    builder.single = jest.fn(() => finalise())
    builder.maybeSingle = jest.fn(() => finalise())

    // For non-terminating selects ".select(...).eq(...)" the consumer
    // awaits the chain directly. Make the builder thenable.
    builder.then = (resolve: any, reject: any) => finalise().then(resolve, reject)
    return builder
  }

  const fromMock = jest.fn((table: string) => {
    const builder: any = {}
    builder.select  = jest.fn(() => buildBuilder(table, 'select'))
    builder.insert  = jest.fn((payload: any) => buildBuilder(table, 'insert', payload))
    builder.update  = jest.fn((payload: any) => buildBuilder(table, 'update', payload))
    builder.upsert  = jest.fn((payload: any) => buildBuilder(table, 'upsert', payload))
    builder.delete  = jest.fn(() => buildBuilder(table, 'delete'))
    return builder
  })

  const rpcMock = jest.fn((fn: string, args: any) => {
    lastRpc[fn] = args
    return Promise.resolve(dequeue(fn, 'rpc'))
  })

  return {
    from: fromMock,
    rpc: rpcMock,
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
    queue(table, op, result) {
      if (!queues.has(table)) queues.set(table, new Map())
      const t = queues.get(table)!
      if (!t.has(op)) t.set(op, [])
      t.get(op)!.push({ result })
    },
    resetQueues() {
      queues.clear()
      lastWrites.clear()
    },
    lastWrite(table) {
      return lastWrites.get(table)
    },
  }
}
