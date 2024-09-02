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
    console.log(data, optionalParameters);
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
    console.log(data, optionalParameters);
  }
}

/**
 * Use isDev when you want to find out if we're in a development/testing environement or not.
 *
 * @returns boolean or undefined
 */
export function isDev(): boolean | undefined {
  if (!process.env.ENVIRONMENT_CONTEXT) {
    return undefined;
  }
  if (process.env.ENVIRONMENT_CONTEXT.toLowerCase().includes("dev")) {
    return true;
  }
  return false;
}
