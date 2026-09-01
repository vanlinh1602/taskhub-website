import type { Stage } from '@/features/stages/types';

export type WorkflowTemplateStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface WorkflowTemplateSummary {
  readonly id: string;
  readonly name: string;
  readonly status: WorkflowTemplateStatus;
  readonly stageCount: number;
  readonly isDefault: boolean;
  readonly configurationVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowTemplatePage {
  readonly items: readonly WorkflowTemplateSummary[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface WorkflowTemplateStage {
  readonly id: string;
  readonly stageDefinitionId: string;
  readonly stepIndex: number;
  readonly durationHoursOverride: number | null;
  readonly effectiveDurationHours: number;
  readonly priceOverride: string | null;
  readonly effectivePrice: string;
  readonly stageDefinition: Stage;
}

export interface WorkflowTemplateDependency {
  readonly prerequisiteStageDefinitionId: string;
  readonly dependentStageDefinitionId: string;
}

export interface WorkflowTemplateConfiguration {
  readonly template: WorkflowTemplateSummary;
  readonly stages: readonly WorkflowTemplateStage[];
  readonly dependencies: readonly WorkflowTemplateDependency[];
  readonly isDefault: boolean;
}

export interface WorkflowTemplateStagePayload {
  readonly stageDefinitionId: string;
  readonly prerequisiteStageDefinitionIds: readonly string[];
  readonly durationHours?: number | null;
  readonly priceOverride?: string | null;
}

export interface WorkflowTemplateSavePayload {
  readonly name: string;
  readonly steps: readonly {
    readonly stages: readonly WorkflowTemplateStagePayload[];
  }[];
}
