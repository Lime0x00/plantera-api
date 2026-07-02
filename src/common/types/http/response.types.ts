export interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data?: TData;
}

export type PlantApiResponse = ApiResponse<{
  id: number;
  plantId: number;
  wateringFrequency: number | null;
  fertilizingFrequency: number | null;
  imageUrl: string | null;
}>;

export type UserApiResponse = ApiResponse<{
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  avatarUrl: string | null;
}>;

export type ApiErrorResponse = {
  success: boolean;
  errorCode: string;
  message: string;
  error?: string;
  details?: unknown;
};
