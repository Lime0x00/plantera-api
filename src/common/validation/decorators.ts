import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export interface ValOptions extends ValidationOptions {
  code?: string;
}

export function IsRequired(options?: ValOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRequired',
      target: object.constructor,
      propertyName,
      constraints: [options?.code ?? 'REQUIRED'],
      options: {
        ...options,
        message: options?.message ?? `${propertyName} is required.`,
      },
      validator: {
        validate(value: unknown) {
          return value !== null && value !== undefined && value !== '';
        },
        defaultMessage(args: ValidationArguments) {
          return (
            args.constraints?.[1] ||
            args.value?.toString() ||
            `${propertyName} is required.`
          );
        },
      },
    });
  };
}

export function IsValidEmail(options?: ValOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidEmail',
      target: object.constructor,
      propertyName,
      constraints: [options?.code ?? 'INVALID_FORMAT'],
      options: {
        ...options,
        message: options?.message ?? 'Must be a valid email format.',
      },
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          );
        },
      },
    });
  };
}

export function MinLen(min: number, options?: ValOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'minLen',
      target: object.constructor,
      propertyName,
      constraints: [options?.code ?? 'TOO_SHORT', min],
      options: {
        ...options,
        message: options?.message ?? `Must be at least ${min} characters.`,
      },
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && value.length >= min;
        },
        defaultMessage(args: ValidationArguments) {
          return (
            args.constraints?.[2] ||
            `Must be at least ${args.constraints?.[1] || min} characters.`
          );
        },
      },
    });
  };
}
