# @codenameryuuu/adonis-lucid-auto-preload

Auto-preload multiple relationships when retrieving Lucid models on Adonis JS 7.

## Requirement

* Adonis Js 7

## Installation

```bash
yarn add @codenameryuuu/adonis-lucid-auto-preload
```

## Configure

```bash
node ace configure @codenameryuuu/adonis-lucid-auto-preload
```

## Usage

Extend from the AutoPreload mixin and add a new `static $with` attribute.

Adding `as const` to `$with` array will let the compiler know about your relationship names and infer them so you will have better intellisense when using `without` and `withOnly` methods.

Relationships will be auto-preloaded for `find` , `all` and `paginate` queries.

### **Using relation name**

```typescript
// App/Models/User.ts

import { BaseModel, column, hasMany, HasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { AutoPreload } from '@codenameryuuu/adonis-lucid-auto-preload'

import Post from '#models/post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

```typescript
// App/Controllers/Http/UsersController.ts

import User from '#models/user'

export default class UsersController {
  public async show() {
    return await User.find(1) // ⬅ Returns user with posts attached.
  }
}
```

### **Using function**

You can also use functions to auto-preload relationships. The function will receive the model query builder as the only argument.

```typescript
// App/Models/User.ts

import { BaseModel, column, hasMany, HasMany } from '@adonisjs/lucid/orm'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { compose } from '@adonisjs/core/helpers'

import { AutoPreload } from '@codenameryuuu/adonis-lucid-auto-preload'

import Post from '#models/post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = [
    (query: ModelQueryBuilderContract<typeof this>) => {
      query.preload('posts')
    }
  ]

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

```typescript
// App/Controllers/Http/UsersController.ts

import User from '#models/user'

export default class UsersController {
  public async show() {
    return await User.find(1) // ⬅ Returns user with posts attached.
  }
}
```

## Nested relationships

You can auto-preload nested relationships using the dot "." between the parent model and the child model. In the following example, `User` -> hasMany -> `Post` -> hasMany -> `Comment` .

```typescript
// App/Models/Post.ts

import { BaseModel, column, hasMany, HasMany } from '@adonisjs/lucid/orm'

class Post extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public title: string

  @column()
  public content: string

  @hasMany(() => Comment)
  public comments: HasMany<typeof Comment>
}
```

```typescript
// App/Models/User.ts

import { BaseModel, column, hasMany, HasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { AutoPreload } from '@codenameryuuu/adonis-lucid-auto-preload'

import Post from '#models/post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts.comments'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

When retrieving a user, it will preload both `posts` and `comments` ( `comments` will be attached to their `posts` parents objects).

You can also use functions to auto-preload nested relationships.

```typescript
public static $with = [
  (query: ModelQueryBuilderContract<typeof this>) => {
    query.preload('posts', (postsQuery) => {
      postsQuery.preload('comments')
    })
  }
]
```

## **Mixin methods**

The `AutoPreload` mixin will add 3 methods to your models. We will explain all of them below.

We will use the following model for our methods examples.

```typescript
// App/Models/User.ts

import { BaseModel, column, hasOne, HasOne, hasMany, HasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { AutoPreload } from '@codenameryuuu/adonis-lucid-auto-preload'

import Profile from '#models/profile'
import Post from '#models/post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts', 'profile'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasOne(() => Profile)
  public profile: HasOne<typeof Profile>

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

### **without**

This method takes an array of relationship names as the only argument. All specified relationships will not be auto-preloaded. You cannot specify relationships registered using functions.

```typescript
// App/Controllers/Http/UsersController.ts

import User from '#models/user'

export default class UsersController {
  public async show() {
    return await User.without(['posts']).find(1) // ⬅ Returns user with profile and without posts.
  }
}
```

### **withOnly**

This method takes an array of relationship names as the only argument. Only specified relationships will be auto-preloaded. You cannot specify relationships registered using functions.

```typescript
// App/Controllers/Http/UsersController.ts

import User from '#models/user'

export default class UsersController {
  public async show() {
    return await User.withOnly(['profile']).find(1) // ⬅ Returns user with profile and without posts.
  }
}
```

### **withoutAny**

Exclude all relationships from being auto-preloaded.

```typescript
// App/Controllers/Http/UsersController.ts

import User from '#models/user'

export default class UsersController {
  public async show() {
    return await User.withoutAny().find(1) // ⬅ Returns user without profile and posts.
  }
}
```

> **Note**
>
> You can chain other model methods with mixin methods. For example, `await User.withoutAny().query().paginate(1)`

## **Limitations**

* Consider the following scenario: `User` -> hasMany -> `Post` -> hasMany -> `Comments`. If you auto-preload `user` and `comments` from `Post` and you auto-preload `posts` from `User`, you will end-up in a infinite loop and your application will stop working.

## **Route model binding**

When using route model binding, you cannot use `without` , `withOnly` and `withoutAny` methods in your controller. But, you can make use of [findForRequest](https://github.com/adonisjs/route-model-binding#change-lookup-logic) method.

```typescript
// App/Models/User.ts

import { BaseModel, column, hasOne, HasOne, hasMany, HasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { AutoPreload } from '@codenameryuuu/adonis-lucid-auto-preload'

import Profile from '#models/profile'
import Post from '#models/post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts', 'profile'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasOne(() => Profile)
  public profile: HasOne<typeof Profile>

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>

  public static findForRequest(ctx, param, value) {
    const lookupKey = param.lookupKey === '$primaryKey' ? 'id' : param.lookupKey

    return this
      .without(['posts']) // ⬅ Do not auto-preload posts when using route model binding.
      .query()
      .where(lookupKey, value)
      .firstOrFail()
  }
}
```

## Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/codenameryuuu/adonis-lucid-auto-preload/issues). You can also take a look at the [contributing guide](https://github.com/codenameryuuu/adonis-lucid-auto-preload/blob/master/CONTRIBUTING.md).

## License

This project is [MIT](https://github.com/codenameryuuu/adonis-lucid-auto-preload/blob/master/LICENSE.md) licensed.
