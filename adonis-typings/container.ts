import type { AutoPreloadMixin } from "./auto-preload";

declare module "@adonisjs/core/types" {
  export interface ContainerBindings {
    "Adonis/Addons/AutoPreload": {
      AutoPreload: AutoPreloadMixin;
    };
  }
}
