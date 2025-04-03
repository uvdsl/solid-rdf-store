import { Quint } from "./Quint";

export class WebReactiveResultError extends Error {
    reactiveResult: Quint[];
    constructor(reactiveResult:Quint[], webError:Error) {
      super(webError.message);
      this.reactiveResult = reactiveResult;
    }
  }