import type { NormalizeConstructor } from "@adonisjs/core/types/helpers";
import type { LucidModel, ModelQueryBuilderContract } from "@adonisjs/lucid/types/model";

type GetWith<T> = T extends { $with: ReadonlyArray<infer Item> | Array<infer Item> }
  ? Item extends string
    ? Item
    : string
  : string;

type RelationInput<T> = GetWith<T> | Array<GetWith<T>>;

type AutoPreloadQueryBuilder<Model extends LucidModel> = ModelQueryBuilderContract<
  Model,
  InstanceType<Model>
> & {
  query(): AutoPreloadQueryBuilder<Model>;
  find(value: any): Promise<InstanceType<Model> | null>;
  findOrFail(value: any): Promise<InstanceType<Model>>;
  findBy(key: string | Record<string, unknown>, value?: any): Promise<InstanceType<Model> | null>;
  findByOrFail(key: string | Record<string, unknown>, value?: any): Promise<InstanceType<Model>>;
  findMany(value: any[]): Promise<InstanceType<Model>[]>;
  all(): Promise<InstanceType<Model>[]>;
};

export interface AutoPreloadMixin {
  <T extends NormalizeConstructor<LucidModel>>(superclass: T): T & {
    $with: ReadonlyArray<string | ((query: any) => void)>;

    without(this: T, relationships: RelationInput<T>): AutoPreloadQueryBuilder<T>;
    withOnly(this: T, relationships: RelationInput<T>): AutoPreloadQueryBuilder<T>;
    withoutAny(this: T): AutoPreloadQueryBuilder<T>;

    new (...args: Array<any>): {};
  };
}
