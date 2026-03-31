# @codenameryuu/adonis-lucid-auto-preload

Auto-preload (eager loading) multiple relationships when retrieving Lucid models on Adonis JS.

## Requirement

* Adonis Js 7
* Lucid 22 or higher

## Installation

* Install the package

```bash
yarn add @codenameryuu/adonis-lucid-auto-preload
```

* Configure the package

```bash
node ace configure @codenameryuu/adonis-lucid-auto-preload
```

* Make sure to register the provider inside `adonisrc.ts` file.

```typescript
providers: [
  // ...
  () => import('@codenameryuu/adonis-lucid-auto-preload/provider'),
],
```

## Usage

Extend from the AutoPreload mixin and add a new `static $with` attribute.

Adding `as const` to `$with` array will let the compiler know about your relationship names and infer them so you will have better intellisense when using `without` and `withOnly` methods.

Relationships will be auto-preloaded for `find` , `all` and `paginate` queries.

**Note:** Relationships must be `belongsTo` , if you are using other relationship types, it may cause infinite loop.

**Note:** Make sure `AutoPreload` extended in the last position, especially when using `SoftDeletes` package.

### **Using relation name**

```typescript
// App/Models/Product.ts

import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { compose } from "@adonisjs/core/helpers";

import { AutoPreload } from "@codenameryuu/adonis-lucid-auto-preload";
import { SoftDeletes } from "@codenameryuu/adonis-lucid-soft-deletes";

import ProductCategory from '#models/product-category'

class Product extends compose(BaseModel, SoftDeletes, AutoPreload) {
  public static $with = ['productCategory'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  declare productCategoryId: number

  @column()
  declare name: string

  @belongsTo(() => ProductCategory, {
    localKey: "id",
    foreignKey: "product_category_id",
    serializeAs: "product_category",
  })
  declare productCategory: BelongsTo<typeof ProductCategory>;
}
```

```typescript
// App/Controllers/Http/ProductsController.ts

import Product from '#models/product'

export default class ProductsController {
  public async show() {
    return await Product.find(1) // ⬅ Returns product with product category attached.
  }
}
```

### **Using function**

You can also use functions to auto-preload relationships. The function will receive the model query builder as the only argument.

```typescript
// App/Models/Product.ts

import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { compose } from '@adonisjs/core/helpers'

import { AutoPreload } from '@codenameryuu/adonis-lucid-auto-preload'
import { SoftDeletes } from "@codenameryuu/adonis-lucid-soft-deletes";

import ProductCategory from '#models/product-category'

class Product extends compose(BaseModel, SoftDeletes, AutoPreload) {
  public static $with = [
    (query: ModelQueryBuilderContract<typeof this>) => {
      query.preload('productCategory')
    }
  ]

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productCategoryId: number

  @column()
  declare name: string

  @belongsTo(() => ProductCategory, {
    localKey: "id",
    foreignKey: "product_category_id",
    serializeAs: "product_category",
  })
  declare productCategory: BelongsTo<typeof ProductCategory>;
}
```

```typescript
// App/Controllers/Http/ProductsController.ts

import Product from '#models/product'

export default class ProductsController {
  public async show() {
    return await Product.find(1) // ⬅ Returns product with product category attached.
  }
}
```

## Nested relationships

You can auto-preload nested relationships using the dot "." between the parent model and the child model. In the following example, `Product` -> belongsTo -> `ProductCategory` -> belongsTo -> `User` .

```typescript
// App/Models/ProductCategory.ts

import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { compose } from "@adonisjs/core/helpers";

import { AutoPreload } from "@codenameryuu/adonis-lucid-auto-preload";
import { SoftDeletes } from "@codenameryuu/adonis-lucid-soft-deletes";

import User from '#models/user'

class ProductCategory extends compose(BaseModel, SoftDeletes, AutoPreload) {
  public static $with = ['user'] as const

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @belongsTo(() => User, {
    localKey: "id",
    foreignKey: "user_id",
    serializeAs: "user",
  })
  declare user: BelongsTo<typeof User>;
}
```

```typescript
// App/Models/Product.ts

import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { compose } from '@adonisjs/core/helpers'

import { AutoPreload } from '@codenameryuu/adonis-lucid-auto-preload'
import { SoftDeletes } from "@codenameryuu/adonis-lucid-soft-deletes";

import ProductCategory from '#models/product-category'

class Product extends compose(BaseModel, SoftDeletes, AutoPreload) {
  public static $with = ['productCategory.user'] as const

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productCategoryId: number

  @column()
  declare name: string

  @belongsTo(() => ProductCategory, {
    localKey: "id",
    foreignKey: "product_category_id",
    serializeAs: "product_category",
  })
  declare productCategory: BelongsTo<typeof ProductCategory>;
}
```

When retrieving a product, it will preload both `productCategory` and `user` ( `user` will be attached to their `productCategory` parents objects).

You can also use functions to auto-preload nested relationships.

```typescript
public static $with = [
  (query: ModelQueryBuilderContract<typeof this>) => {
    query.preload('productCategory', (productCategoryQuery) => {
      productCategoryQuery.preload('user')
    })
  }
]
```

## **Mixin methods**

The `AutoPreload` mixin will add 3 methods to your models. We will explain all of them below.

We will use the following model for our methods examples.

### **without**

This method takes an array of relationship names as the only argument. All specified relationships will not be auto-preloaded. You cannot specify relationships registered using functions.

```typescript
// App/Controllers/Http/ProductsController.ts

import Product from '#models/product'

export default class ProductsController {
  public async show() {
    return await Product.without(['productCategory']).find(1) // ⬅ Returns product without product category.
  }
}
```

### **withOnly**

This method takes an array of relationship names as the only argument. Only specified relationships will be auto-preloaded. You cannot specify relationships registered using functions.

```typescript
// App/Controllers/Http/ProductsController.ts

import Product from '#models/product'

export default class ProductsController {
  public async show() {
    return await Product.withOnly(['productCategory']).find(1) // ⬅ Returns product with product category.
  }
}
```

### **withoutAny**

Exclude all relationships from being auto-preloaded.

```typescript
// App/Controllers/Http/ProductsController.ts

import Product from '#models/product'

export default class ProductsController {
  public async show() {
    return await Product.withoutAny().find(1) // ⬅ Returns product without product category.
  }
}
```

> **Note**
>
> You can chain other model methods with mixin methods. For example, `await Product.withoutAny().query().paginate(1)`

## License

This project is [MIT](https://github.com/codenameryuu/adonis-lucid-auto-preload/blob/master/LICENSE.md) licensed.
