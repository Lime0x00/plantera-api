import { BaseRepository } from '#infrastructure/database/base-repository';
import {
  IPlantRepository,
  PlantWhereUniqueInput,
} from '#features/plant/plant.repository.interface';
import { Plant } from '#features/plant/domain';

export class PlantRepository
  extends BaseRepository<
    Plant,
    PlantWhereUniqueInput,
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, unknown>
  >
  implements IPlantRepository
{
  public constructor() {
    super(Plant);
  }

  async findById(args: {
    where: PlantWhereUniqueInput;
  }): Promise<Plant | null> {
    return this.findUnique(args);
  }

  async count(args?: { where?: Record<string, unknown> }): Promise<number> {
    return this.driver.count(args);
  }
}
