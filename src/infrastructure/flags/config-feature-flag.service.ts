import { IFeatureFlagService } from '../flags/feature-flag.interface';

export class ConfigFeatureFlagService implements IFeatureFlagService {
  async isEnabled(): Promise<boolean> {
    return false;
  }

  async isEnabledForUser(): Promise<boolean> {
    return false;
  }
}
