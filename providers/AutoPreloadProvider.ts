import type { ApplicationService } from "@adonisjs/core/types";

export default class AutoPreloadProvider {
  public static needsApplication = true;

  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton("Adonis/Addons/AutoPreload", () => {
      const { AutoPreload } = require("../src/Mixins/AutoPreload");

      return { AutoPreload };
    });
  }

  public async boot() {}

  public async ready() {}

  public async shutdown() {}
}
