import type { ApplicationService } from '@adonisjs/core/types'
import { AutoPreload } from '../src/mixins/auto_preload.js'
export { configure } from '../configure.js'

export default class AutoPreloadProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton('@codenameryuu/adonis-lucid-auto-preload', () => {
      return { AutoPreload }
    })
  }

  public async boot() {}

  public async ready() {}

  public async shutdown() {}
}
