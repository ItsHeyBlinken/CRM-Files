declare module 'connect-pg-simple' {
  import { Pool } from 'pg'
  import session from 'express-session'

  interface PGStoreOptions {
    pool: Pool
    tableName?: string
    createTableIfMissing?: boolean
    pruneSessionInterval?: number
    errorLog?: (error: Error) => void
  }

  class PGStore extends session.Store {
    constructor(options: PGStoreOptions)
    prune(): Promise<void>
  }

  namespace connectPgSimple {
    export { PGStore, PGStoreOptions }
  }

  function connectPgSimple(session: typeof import('express-session')): typeof PGStore
  export = connectPgSimple
}

