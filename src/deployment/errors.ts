/**
 * Fail-closed deployment configuration error.
 *
 * Used when DEPLOYMENT_MODE, legacy seed flags, or required production
 * environment variables are missing or conflicting. Never include secrets
 * in the message.
 */
export class DeploymentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeploymentConfigError";
  }
}
