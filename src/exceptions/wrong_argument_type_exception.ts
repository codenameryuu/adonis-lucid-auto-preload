import { Exception } from '@adonisjs/core/exceptions'

export default class WrongArgumentTypeException extends Exception {
  public static invoke(method: string) {
    return new this(`The method ${method} accepts only an array of strings`)
  }
}
