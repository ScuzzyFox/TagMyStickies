/**
 * Use devLog for doing simple console logs ONLY in development environments.
 * e.g. if you want something to be printed only in testing and not in prod, use this.
 *
 * @param data The data to print out
 */
export function devLog(data?: any, ...optionalParameters: any[]): void {
  if (
    process.env.ENVIRONMENT_CONTEXT &&
    process.env.ENVIRONMENT_CONTEXT.toLowerCase().includes("dev")
  ) {
    if (optionalParameters && optionalParameters.length > 0) {
      console.log(data, optionalParameters);
    } else {
      console.log(data);
    }
  }
}

/**
 * Use devLog for doing simple console logs ONLY in production environments.
 * e.g. if you want something to be printed only in prod and not in testing, use this.
 *
 * @param data The data to print out
 */
export function prodLog(data?: any, ...optionalParameters: any[]): void {
  if (
    process.env.ENVIRONMENT_CONTEXT &&
    process.env.ENVIRONMENT_CONTEXT.toLowerCase().includes("prod")
  ) {
    if (optionalParameters && optionalParameters.length > 0) {
      console.log(data, optionalParameters);
    } else {
      console.log(data);
    }
  }
}
