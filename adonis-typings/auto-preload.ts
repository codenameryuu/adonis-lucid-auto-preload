import type { NormalizeConstructor } from "@adonisjs/core/types/helpers";
import type { LucidModel } from "@adonisjs/lucid/types/model";

type GetWith<T> = T extends { $with: Array<infer Item> } ? (Item extends string ? Item : string) : string;

export interface AutoPreloadMixin {
  <T extends NormalizeConstructor<LucidModel>>(superclass: T): T & {
    $with: Array<string | ((query: any) => void)>;

    without(this: T, relationships: Array<GetWith<T>>): T;
    withOnly(this: T, relationships: Array<GetWith<T>>): T;
    withoutAny(this: T): T;

    new (...args: Array<any>): {};
  };
}
