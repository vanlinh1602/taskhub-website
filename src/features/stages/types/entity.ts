export interface Stage {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly defaultPrice: string;
  readonly defaultDurationHours: number;
  readonly currency: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StagePage {
  readonly items: readonly Stage[];
  readonly activeTotal: number;
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface StageFormValues {
  readonly name: string;
  readonly description: string;
  readonly defaultPrice: string;
  readonly durationHours: string;
  readonly displayOrder: string;
}

export interface StagePayload {
  readonly name: string;
  readonly description?: string;
  readonly defaultPrice: string;
  readonly durationHours: number;
  readonly displayOrder: number;
}
