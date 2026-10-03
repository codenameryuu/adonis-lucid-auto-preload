import type { NormalizeConstructor } from "@adonisjs/core/types/helpers";
import type { LucidModel, ModelQueryBuilderContract } from "@adonisjs/lucid/types/model";
import { Exception } from "@adonisjs/core/exceptions";

type PreloadEntry = string | ((query: ModelQueryBuilderContract<any, any>) => void);

export type AutoPreloadQueryBuilder<Model extends LucidModel> = ModelQueryBuilderContract<
  Model,
  InstanceType<Model>
> & {
  /**
   * Identity helper for Model-like chaining:
   * `Model.without(['x']).query().paginate(1)`
   */
  query(): AutoPreloadQueryBuilder<Model>;
  find(value: any): Promise<InstanceType<Model> | null>;
  findOrFail(value: any): Promise<InstanceType<Model>>;
  findBy(key: string | Record<string, unknown>, value?: any): Promise<InstanceType<Model> | null>;
  findByOrFail(key: string | Record<string, unknown>, value?: any): Promise<InstanceType<Model>>;
  findMany(value: any[]): Promise<InstanceType<Model>[]>;
  all(): Promise<InstanceType<Model>[]>;
};

type ScopedFlags = {
  $skipPreloads?: string[];
  $onlyPreloads?: string[];
  $disableAutoPreload?: boolean;
};

export type RelationInput = string | string[];

function normalizeRelations(relations: RelationInput): string[] {
  return Array.isArray(relations) ? relations : [relations];
}

export function AutoPreload<T extends NormalizeConstructor<LucidModel>>(superclass: T) {
  class AutoPreloadModel extends superclass {
    /**
     * List of relationships to auto-preload.
     */
    public static $with: ReadonlyArray<PreloadEntry> = [];

    public static boot() {
      super.boot();

      // `compose()` introduces an intermediate class. Depending on how Lucid
      // handles boot flags, we might see `booted` as inherited and skip hook
      // registration. Track it per subclass instead.
      if ((this as any).$autoPreloadHooksRegistered) return;
      (this as any).$autoPreloadHooksRegistered = true;

      // Register hooks on the actual model subclass.
      this.before("find", this.beforeFindHook.bind(this));
      this.before("fetch", this.beforeFetchHook.bind(this));
      this.before("paginate", this.beforePaginateHook.bind(this));
    }

    public static beforeFindHook(query: ModelQueryBuilderContract<any, any>) {
      this.applyAutoPreload(query);
    }

    public static beforeFetchHook(query: ModelQueryBuilderContract<any, any>) {
      this.applyAutoPreload(query);
    }

    public static beforePaginateHook(queries: any) {
      const main = Array.isArray(queries) ? (queries[1] ?? queries[0]) : queries;
      this.applyAutoPreload(main);
    }

    public static applyAutoPreload(query: ModelQueryBuilderContract<any, any>) {
      // Check if auto-preload has been disabled for this specific query instance
      if ((query as any).$disableAutoPreload) return;

      const relations = (this as any).$with as ReadonlyArray<PreloadEntry>;
      if (!Array.isArray(relations)) return;

      // Get list of relations to skip for this specific query
      const skipList = (query as any).$skipPreloads || [];
      const onlyList = (query as any).$onlyPreloads || [];

      for (const relation of relations) {
        if (typeof relation === "string") {
          if (onlyList.length > 0 && !onlyList.includes(relation)) continue;
          if (skipList.includes(relation)) continue;

          if (relation.includes(".")) {
            this.handleNestedPreload(query, relation.split("."));
          } else {
            query.preload(relation as any);
          }
        } else if (typeof relation === "function") {
          relation(query);
        }
      }
    }

    public static handleNestedPreload(query: any, parts: string[]) {
      const current = parts.shift();
      if (!current) return;

      query.preload(current as any, (builder: any) => {
        if (parts.length > 0) {
          this.handleNestedPreload(builder, [...parts]);
        }
      });
    }

    /**
     * Skip specific auto-preloaded relationships for this query.
     * Accepts a string or an array of strings (Laravel-style).
     */
    public static without(relations: RelationInput): AutoPreloadQueryBuilder<any> {
      return createScopedQuery(this, { $skipPreloads: normalizeRelations(relations) });
    }

    /**
     * Only auto-preload the specified relationships for this query.
     * Accepts a string or an array of strings (Laravel-style).
     */
    public static withOnly(relations: RelationInput): AutoPreloadQueryBuilder<any> {
      return createScopedQuery(this, { $onlyPreloads: normalizeRelations(relations) });
    }

    /**
     * Disable all auto-preloads for this query.
     */
    public static withoutAny(): AutoPreloadQueryBuilder<any> {
      return createScopedQuery(this, { $disableAutoPreload: true });
    }
  }

  return AutoPreloadModel;
}

/**
 * Returns a query builder scoped with auto-preload flags, plus Laravel-like
 * helpers (`find`, `findOrFail`, ...) so callers can write:
 * `Model.without(['x']).find(1)`
 */
function createScopedQuery(Model: LucidModel, flags: ScopedFlags): AutoPreloadQueryBuilder<any> {
  const query = Model.query() as AutoPreloadQueryBuilder<any>;

  Object.assign(query, flags);

  // Already a query builder — keep Model-like `.query()` chaining working.
  query.query = () => query;

  query.find = async (value: any) => {
    if (value === undefined) {
      throw new Exception('"find" expects a value. Received undefined');
    }
    return query.where(Model.primaryKey, value).first();
  };

  query.findOrFail = async (value: any) => {
    if (value === undefined) {
      throw new Exception('"findOrFail" expects a value. Received undefined');
    }
    return query.where(Model.primaryKey, value).firstOrFail();
  };

  query.findBy = async (key: string | Record<string, unknown>, value?: any) => {
    if (typeof key === "object") {
      return query.where(key).first();
    }
    if (value === undefined) {
      throw new Exception('"findBy" expects a value. Received undefined');
    }
    return query.where(key, value).first();
  };

  query.findByOrFail = async (key: string | Record<string, unknown>, value?: any) => {
    if (typeof key === "object") {
      return query.where(key).firstOrFail();
    }
    if (value === undefined) {
      throw new Exception('"findByOrFail" expects a value. Received undefined');
    }
    return query.where(key, value).firstOrFail();
  };

  query.findMany = async (value: any[]) => {
    if (value === undefined) {
      throw new Exception('"findMany" expects a value. Received undefined');
    }
    return query.whereIn(Model.primaryKey, value).orderBy(Model.primaryKey, "desc").exec();
  };

  query.all = async () => {
    return query.orderBy(Model.primaryKey, "desc").exec();
  };

  return query;
}
