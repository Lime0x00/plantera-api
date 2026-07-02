import type { UpdateProfileRequestDto } from '#features/user/dtos/update-profile.dto';
import type { ChangePasswordRequestDto } from '#features/user/dtos/change-password.dto';
import type { UpdateNotificationPreferencesRequestDto } from '#features/user/dtos/update-notification-preferences.dto';
import type { components } from '#common/types/generated/openapi.types';

export type UpdateProfileRequest = UpdateProfileRequestDto;
export type ChangePasswordRequest = ChangePasswordRequestDto;
export type UpdateNotificationPreferencesRequest =
  UpdateNotificationPreferencesRequestDto;

// Required for response type references
export type _Spec = components['schemas'];
