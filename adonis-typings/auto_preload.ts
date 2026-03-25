import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import type { LucidModel } from '@adonisjs/lucid/types/model'

type GetWith<T> = T extends { $with: Array<infer Item> }
  ? Item extends string
    ? Item
    : string
  : string

export interface AutoPreloadMixin {
  <T extends NormalizeConstructor<LucidModel>>(
    superclass: T
  ): T & {
    $with: ReadonlyArray<string | ((query: any) => void)>

    without(this: T, relationships: Array<GetWith<T>>): any
    withOnly(this: T, relationships: Array<GetWith<T>>): any
    withoutAny(this: T): any

    new (...args: Array<any>): {}
  }
}
