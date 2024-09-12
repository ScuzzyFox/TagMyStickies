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
