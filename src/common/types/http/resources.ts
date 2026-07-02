export abstract class Resource<TModel, TSpec> {
  protected abstract transform(model: TModel): TSpec;

  make(model: TModel): TSpec {
    return this.transform(model) satisfies TSpec;
  }

  collection(models: TModel[]): TSpec[] {
    return models.map((m) => this.make(m));
  }
}

export interface SubmissionData {
  recordId: number;
  status: string;
}
