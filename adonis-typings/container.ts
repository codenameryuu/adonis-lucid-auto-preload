import type { AutoPreloadMixin } from './auto_preload.js'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    '@codenameryuu/adonis-lucid-auto-preload': {
      AutoPreload: AutoPreloadMixin
    }
  }
}
