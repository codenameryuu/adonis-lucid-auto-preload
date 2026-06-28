import { Exception } from "@adonisjs/core/exceptions";

export default class WrongRelationshipTypeException extends Exception {
  public static invoke(model: string) {
    return new this(`The model "${model}" has wrong relationships to be auto-preloaded. Only string and function types are allowed`);
  }
}
