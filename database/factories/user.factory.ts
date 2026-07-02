import { faker } from '@faker-js/faker';

export interface UserFactoryData {
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  timezone?: string;
  pushToken?: string;
  storageDisk?: string | null;
  storagePath?: string | null;
}

export function makeUser(data?: Partial<UserFactoryData>): UserFactoryData {
  const firstName = data?.firstName ?? faker.person.firstName();
  return {
    email: data?.email ?? faker.internet.email({ firstName }),
    firstName,
    lastName: data?.lastName ?? faker.person.lastName(),
    userName: data?.userName ?? faker.internet.username({ firstName }),
    password: data?.password ?? faker.internet.password({ length: 12 }),
    timezone: data?.timezone ?? faker.location.timeZone(),
    pushToken: data?.pushToken ?? faker.string.alphanumeric(32),
    storageDisk: data?.storageDisk ?? null,
    storagePath: data?.storagePath ?? null,
  };
}

export function makeUsers(count: number): UserFactoryData[] {
  return Array.from({ length: count }, (_, index) => {
    faker.seed(index + 1);

    return makeUser({
      email: `seed-user-${index + 1}@example.com`,
      userName: `seeduser${index + 1}`,
    });
  });
}
