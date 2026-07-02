import { BaseRepository } from '#infrastructure/database/base-repository';
import {
  IMyPlantRepository,
  MyPlantCreateInput,
  MyPlantUpdateInput,
  MyPlantWhereUniqueInput,
} from '#features/myPlant/myPlant.repository.interface';
import { MyPlantModel } from '#features/myPlant/domain';

export class MyPlantRepository
  extends BaseRepository<
    MyPlantModel,
    MyPlantWhereUniqueInput,
    import('#features/myPlant/myPlant.types').MyPlantWhereInput,
    MyPlantCreateInput,
    MyPlantUpdateInput
  >
  implements IMyPlantRepository
{
  public constructor() {
    super(MyPlantModel);
  }

  public async count(args?: {
    where?: Record<string, unknown>;
  }): Promise<number> {
    return this.driver.count(args);
  }
}
