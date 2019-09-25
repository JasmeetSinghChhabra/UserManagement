export class ProgramFeatures {
    constructor() {
    }

    program: string;
    vqa_picture: boolean;
    vqa_video: boolean;
    vqa_gallery: boolean;
    work_order: WorkOrderFeatures[];

    clone(): ProgramFeatures {
      return Object.assign(new ProgramFeatures(), this);
    }
}

export class WorkOrderFeatures{
  constructor() {
  }

  typeSID: number;
  logs: boolean;
  general_info: boolean;
  sector_work: boolean;

  clone(): WorkOrderFeatures {
    return Object.assign(new WorkOrderFeatures(), this);
  }
}

