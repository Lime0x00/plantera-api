import { Resource } from '#common/types/http/resources';
import type { components } from '#common/types/generated/openapi.types';

type SpecSchemas = components['schemas'];

export class NotificationPreferencesResource extends Resource<
  unknown,
  SpecSchemas['NotificationPreferences']
> {
  protected transform(np: unknown): SpecSchemas['NotificationPreferences'] {
    const n = np as Record<string, unknown>;
    return {
      pushEnabled: n.pushEnabled as boolean,
      wateringReminders: n.wateringReminders as boolean,
      fertilizingReminders: n.fertilizingReminders as boolean,
      emailNotifications: n.emailNotifications as boolean,
    };
  }
}
