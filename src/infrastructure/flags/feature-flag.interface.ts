export interface IFeatureFlagService {
  /**
   * Evaluates a boolean flag for a generic application context
   */
  isEnabled(flagKey: string): Promise<boolean>;

  /**
   * Evaluates a boolean flag targeted at a specific user context (Context-aware flagging)
   */
  isEnabledForUser(flagKey: string, userId: string): Promise<boolean>;
}
