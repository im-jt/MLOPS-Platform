


export type CellType = 'note' | 'code' | 'prompt';

export interface Cell {
  id: number;
  type: CellType;
  content: string;
  output?: string;
  details?: string;
  isDetailsOpen?: boolean;
  isInputCollapsed?: boolean;
  isOutputCollapsed?: boolean;
  isCollapsed?: boolean; // For note sections
  isEditing?: boolean; // For note edit mode
  isExecuting?: boolean;
  executionCount?: number;
}