export type ErrorDetail = { code: string; message: string };

export function fieldErrors<T extends string>(
  fields: Partial<Record<T, ErrorDetail>>
): Partial<Record<T, ErrorDetail>> {
  return fields;
}
