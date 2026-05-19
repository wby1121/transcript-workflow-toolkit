import fs from 'fs'
import path from 'path'

interface DbStore {
  transcripts: Record<string, unknown>[]
  transcript_variants: Record<string, unknown>[]
  seo_content: Record<string, unknown>[]
  jobs: Record<string, unknown>[]
  error_log: Record<string, unknown>[]
  analytics_events: Record<string, unknown>[]
  search_queries: Record<string, unknown>[]
}

let store: DbStore | null = null
let dbPath: string | null = null

function getDbPath(): string {
  if (dbPath) return dbPath
  dbPath = path.resolve(process.env.DATABASE_PATH || './data/transcripts.db')
  return dbPath
}

function loadStore(): DbStore {
  if (store) return store
  try {
    if (fs.existsSync(getDbPath())) {
      const raw = fs.readFileSync(getDbPath(), 'utf-8')
      store = JSON.parse(raw)
    } else {
      store = initializeStore()
    }
  } catch {
    store = initializeStore()
  }
  return store!
}

function initializeStore(): DbStore {
  return {
    transcripts: [],
    transcript_variants: [],
    seo_content: [],
    jobs: [],
    error_log: [],
    analytics_events: [],
    search_queries: [],
  }
}

let writeQueue: Promise<void> = Promise.resolve()

function enqueueWrite(fn: () => void): void {
  writeQueue = writeQueue.then(() => {
    try { fn() } catch (e) { console.error('[DB] Write failed:', e) }
  })
}

function saveStore(): void {
  const dir = path.dirname(getDbPath())
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  // Atomic write: temp file → rename, prevents corruption on crash
  const tmpPath = getDbPath() + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2))
  fs.renameSync(tmpPath, getDbPath())
}

// ---- Public API ----

export function getDb() {
  return {
    // Execute a string SQL-like command (for db-init compatibility)
    exec(_sql: string) {
      loadStore() // Ensure store is loaded
    },

    // Run a query (for INSERT, UPDATE, DELETE)
    prepare(sql: string) {
      return {
        run(...params: unknown[]) {
          return executeStatement(sql, params)
        },
        get(...params: unknown[]) {
          return executeGet(sql, params)
        },
        all(...params: unknown[]) {
          return executeAll(sql, params)
        },
      }
    },

    // For backwards compat
    close() {
      store = null
      dbPath = null
    },

    pragma(_pragma: string) {},
  }
}

function countParamsInClause(clause: string): number {
  return (clause.match(/\?/g) || []).length
}

function executeStatement(sql: string, params: unknown[]): { changes: number; lastInsertRowid: number } {
  const s = loadStore()
  const upper = sql.trim().toUpperCase()

  if (upper.startsWith('INSERT') || upper.startsWith('REPLACE') || upper.startsWith('INSERT OR REPLACE')) {
    const row = parseInsertValues(sql, params)
    const table = getTableFromSql(sql)
    if (table && row) {
      if (upper.includes('OR REPLACE')) {
        const conflictCol = getConflictColumn(sql)
        if (conflictCol && row[conflictCol] !== undefined) {
          const idx = s[table].findIndex(
            (r: Record<string, unknown>) => r && typeof r === 'object' && String(r[conflictCol]) === String(row[conflictCol])
          )
          if (idx >= 0) {
            s[table][idx] = { ...(s[table][idx] as Record<string, unknown>), ...row }
          } else {
            s[table].push(row)
          }
        } else {
          s[table].push(row)
        }
      } else {
        s[table].push(row)
      }
      enqueueWrite(() => saveStore())
    }
    return { changes: 1, lastInsertRowid: s[table]?.length || 0 }
  }

  if (upper.startsWith('UPDATE')) {
    const table = getTableFromSql(sql)
    if (!table) return { changes: 0, lastInsertRowid: 0 }

    // Split params: SET clause params come first, then WHERE clause params
    const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|\s*$)/is)
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/is)

    const setParamCount = setMatch ? countParamsInClause(setMatch[1]) : 0
    const setParams = params.slice(0, setParamCount)
    const whereParams = params.slice(setParamCount)

    const setClause = parseSetClause(sql, setParams)
    const whereClause = parseWhereClause(sql, whereParams)

    if (setClause) {
      let changes = 0
      s[table] = s[table].map((row: Record<string, unknown>) => {
        if (matchesWhere(row, whereClause)) {
          changes++
          return { ...row, ...setClause }
        }
        return row
      })
      if (changes > 0) enqueueWrite(() => saveStore())
      return { changes, lastInsertRowid: 0 }
    }
  }

  if (upper.startsWith('DELETE')) {
    const table = getTableFromSql(sql)
    const whereClause = parseWhereClause(sql, params)
    if (table) {
      const before = s[table].length
      s[table] = s[table].filter(
        (row: Record<string, unknown>) => !matchesWhere(row, whereClause)
      )
      const changes = before - s[table].length
      if (changes > 0) enqueueWrite(() => saveStore())
      return { changes, lastInsertRowid: 0 }
    }
  }

  if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX')) {
    return { changes: 0, lastInsertRowid: 0 }
  }

  return { changes: 0, lastInsertRowid: 0 }
}

function executeGet(sql: string, params: unknown[]): Record<string, unknown> | undefined {
  const upper = sql.trim().toUpperCase()

  if (upper.startsWith('SELECT')) {
    const table = getTableFromSql(sql)
    const whereClause = parseWhereClause(sql, params)
    const orderBy = parseOrderBy(sql)
    const join = parseJoin(sql)

    if (table) {
      let rows = [...loadStore()[table]]
      if (join) {
        rows = applyJoin(rows, join)
      }
      rows = rows.filter((r: Record<string, unknown>) => matchesWhere(r, whereClause))
      if (orderBy) {
        rows.sort((a, b) => {
          const aVal = a[orderBy.col]
          const bVal = b[orderBy.col]
          if (aVal == null) return 1
          if (bVal == null) return -1
          return orderBy.desc ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal))
        })
      }
      return rows.length > 0 ? normalizeRow(rows[0]) : undefined
    }

    // COUNT query
    if (upper.includes('COUNT(*)')) {
      return { c: executeAll(sql, params).length }
    }
  }

  return undefined
}

function executeAll(sql: string, params: unknown[]): Record<string, unknown>[] {
  const upper = sql.trim().toUpperCase()

  if (upper.startsWith('SELECT')) {
    const table = getTableFromSql(sql)
    const whereClause = parseWhereClause(sql, params)
    const orderBy = parseOrderBy(sql)
    const limit = parseLimit(sql)
    const join = parseJoin(sql)

    if (table) {
      let rows = [...loadStore()[table]]
      if (join) {
        rows = applyJoin(rows, join)
      }
      rows = rows.filter((r: Record<string, unknown>) => matchesWhere(r, whereClause))
      if (orderBy) {
        rows.sort((a, b) => {
          const aVal = a[orderBy.col]
          const bVal = b[orderBy.col]
          if (aVal == null) return 1
          if (bVal == null) return -1
          return orderBy.desc ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal))
        })
      }
      if (limit !== undefined) {
        rows = rows.slice(0, limit)
      }
      return rows.map(normalizeRow)
    }
  }

  return []
}

// ---- SQL Parser Helpers ----

function getTableFromSql(sql: string): keyof DbStore | null {
  const upper = sql.toUpperCase()
  const fromMatch = sql.match(/FROM\s+(\w+)/i)
  const intoMatch = sql.match(/INTO\s+(\w+)/i)
  const updateMatch = sql.match(/UPDATE\s+(\w+)/i)
  const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i)
  const joinMatch = sql.match(/JOIN\s+(\w+)\s+(\w+)/i)

  const tableName = fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || deleteMatch?.[1] || joinMatch?.[1]
  if (!tableName) return null

  // Remove alias
  const name = tableName.toLowerCase()
  const validTables: (keyof DbStore)[] = ['transcripts', 'transcript_variants', 'seo_content', 'jobs', 'error_log', 'analytics_events', 'search_queries']
  return validTables.find(t => t === name || name.startsWith(t)) || null
}

function parseWhereClause(sql: string, params: unknown[]): Record<string, unknown> | null {
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/is)
  if (!whereMatch) return null

  const clause = whereMatch[1].trim()
  const conditions: Record<string, unknown> = {}

  // Handle col = ?
  const eqMatches = clause.matchAll(/(\w+)\s*=\s*\?/g)
  let paramIdx = 0
  for (const m of eqMatches) {
    if (paramIdx < params.length) {
      conditions[m[1]] = params[paramIdx]
    }
    paramIdx++
  }

  // Handle col IN (status1, status2)
  const inMatch = clause.match(/(\w+)\s+IN\s+\(([^)]+)\)/i)
  if (inMatch) {
    const col = inMatch[1]
    const vals = inMatch[2].split(',').map(s => s.trim().replace(/'/g, ''))
    conditions[col + '_in'] = vals
  }

  // Handle date(col) = date(?)
  const dateMatch = clause.match(/date\((\w+)\)\s*=\s*date\('now'\)/)
  if (dateMatch) {
    conditions['_date_check'] = { col: dateMatch[1], value: 'today' }
  }

  return Object.keys(conditions).length > 0 ? conditions : null
}

function parseOrderBy(sql: string): { col: string; desc: boolean } | null {
  const match = sql.match(/ORDER BY\s+(\w+(?:\.\w+)?)\s*(DESC|ASC)?/i)
  if (!match) return null
  return {
    col: match[1].includes('.') ? match[1].split('.')[1] : match[1],
    desc: match[2]?.toUpperCase() === 'DESC',
  }
}

function parseLimit(sql: string): number | undefined {
  const match = sql.match(/LIMIT\s+(\d+)/i)
  if (!match) return undefined
  return parseInt(match[1])
}

function parseJoin(sql: string): { table: string; on: { left: string; right: string } } | null {
  const match = sql.match(/JOIN\s+(\w+)\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i)
  if (!match) return null
  return {
    table: match[1],
    on: { left: match[4], right: match[6] },
  }
}

function parseInsertValues(sql: string, params: unknown[]): Record<string, unknown> | null {
  const colMatch = sql.match(/\(([^)]+)\)\s*VALUES\s*\(/i)
  if (!colMatch) return null
  const cols = colMatch[1].split(',').map(s => s.trim())

  const row: Record<string, unknown> = {}
  // Use timestamp-based ID for primary keys
  if (cols[0] === 'id') {
    row.id = params[0] || generateId()
  }

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]
    const val = params[i]
    if (val === 'CURRENT_TIMESTAMP') {
      row[col] = new Date().toISOString()
    } else if (val !== null && val !== undefined) {
      row[col] = val
    } else {
      row[col] = null
    }
  }

  return row
}

function parseSetClause(sql: string, params: unknown[]): Record<string, unknown> | null {
  const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|\s*$)/is)
  if (!setMatch) return null
  const pairs = setMatch[1].split(',').map(s => s.trim())
  const result: Record<string, unknown> = {}

  let paramIdx = 0
  for (const pair of pairs) {
    const eqMatch = pair.match(/(\w+)\s*=\s*\?/)
    if (eqMatch) {
      result[eqMatch[1]] = params[paramIdx++]
    } else {
      // Handle datetime functions
      const funcMatch = pair.match(/(\w+)\s*=\s*datetime\('now'/i)
      if (funcMatch) {
        result[funcMatch[1]] = new Date().toISOString()
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

function getConflictColumn(sql: string): string | null {
  // Parse ON CONFLICT clause for INSERT OR REPLACE
  const match = sql.match(/ON CONFLICT\((\w+)\)/i)
  return match?.[1] || null
}

function matchesWhere(row: Record<string, unknown>, where: Record<string, unknown> | null): boolean {
  if (!where || Object.keys(where).length === 0) return true

  for (const [key, value] of Object.entries(where)) {
    if (key === '_date_check') {
      const { col, value: checkVal } = value as { col: string; value: string }
      if (checkVal === 'today') {
        const rowDate = new Date(row[col] as string).toDateString()
        const today = new Date().toDateString()
        if (rowDate !== today) return false
      }
      continue
    }

    if (key.endsWith('_in')) {
      const col = key.replace('_in', '')
      const vals = value as string[]
      if (!vals.includes(String(row[col]))) return false
      continue
    }

    if (String(row[key]) !== String(value)) return false
  }

  return true
}

function applyJoin(rows: Record<string, unknown>[], join: { table: string; on: { left: string; right: string } }): Record<string, unknown>[] {
  const joinTable = loadStore()[join.table as keyof DbStore] || []
  return rows.map(row => {
    const joined = joinTable.find(
      (jr: Record<string, unknown>) => String(jr[join.on.right]) === String(row[join.on.left])
    ) as Record<string, unknown> | undefined
    return joined ? { ...row, ...joined } : row
  })
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  // Convert snake_case to camelCase for backwards compat
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[key] = value
    // Also add camelCase version
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (camelKey !== key) {
      result[camelKey] = value
    }
  }
  return result
}

function generateId(): string {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9)
}

export function closeDb(): void {
  store = null
  dbPath = null
}
