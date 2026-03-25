import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type PreloadEntry = string | ((query: ModelQueryBuilderContract<any, any>) => void)

export function AutoPreload<T extends NormalizeConstructor<LucidModel>>(superclass: T) {
  class AutoPreloadModel extends superclass {
    /**
     * List of relationships to auto-preload.
     */
    public static $with: ReadonlyArray<PreloadEntry> = []

    public static boot() {
      super.boot()

      // `compose()` introduces an intermediate class. Depending on how Lucid
      // handles boot flags, we might see `booted` as inherited and skip hook
      // registration. Track it per subclass instead.
      if ((this as any).$autoPreloadHooksRegistered) return
      ;(this as any).$autoPreloadHooksRegistered = true

      // Register hooks on the actual model subclass.
      this.before('find', this.beforeFindHook.bind(this))
      this.before('fetch', this.beforeFetchHook.bind(this))
      this.before('paginate', this.beforePaginateHook.bind(this))
    }

    public static beforeFindHook(query: ModelQueryBuilderContract<any, any>) {
      this.applyAutoPreload(query)
    }

    public static beforeFetchHook(query: ModelQueryBuilderContract<any, any>) {
      this.applyAutoPreload(query)
    }

    public static beforePaginateHook(queries: any) {
      const main = Array.isArray(queries) ? (queries[1] ?? queries[0]) : queries
      this.applyAutoPreload(main)
    }

    public static applyAutoPreload(query: ModelQueryBuilderContract<any, any>) {
      // Check if auto-preload has been disabled for this specific query instance
      if ((query as any).$disableAutoPreload) return

      const relations = (this as any).$with as ReadonlyArray<PreloadEntry>
      if (!Array.isArray(relations)) return

      // Get list of relations to skip for this specific query
      const skipList = (query as any).$skipPreloads || []
      const onlyList = (query as any).$onlyPreloads || []

      for (const relation of relations) {
        if (typeof relation === 'string') {
          if (onlyList.length > 0 && !onlyList.includes(relation)) continue
          if (skipList.includes(relation)) continue

          if (relation.includes('.')) {
            this.handleNestedPreload(query, relation.split('.'))
          } else {
            query.preload(relation as any)
          }
        } else if (typeof relation === 'function') {
          relation(query)
        }
      }
    }

    public static handleNestedPreload(query: any, parts: string[]) {
      const current = parts.shift()
      if (!current) return

      query.preload(current as any, (builder: any) => {
        if (parts.length > 0) {
          this.handleNestedPreload(builder, [...parts])
        }
      })
    }

    /**
     * Correct Implementation: Returns the Query Builder to avoid global state pollution
     */
    public static without(relations: string[]) {
      const query = this.query()
      ;(query as any).$skipPreloads = relations
      return query
    }

    public static withOnly(relations: string[]) {
      const query = this.query()
      ;(query as any).$onlyPreloads = relations
      return query
    }

    public static withoutAny() {
      const query = this.query()
      ;(query as any).$disableAutoPreload = true
      return query
    }
  }

  return AutoPreloadModel
}
