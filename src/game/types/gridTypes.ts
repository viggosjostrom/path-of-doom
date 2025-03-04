// Grid Types
export type CellType = 'Path' | 'Tower' | 'Empty';
export type CellEffect = 'Slow' | 'DamageBoost' | 'None';

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  effect?: CellEffect;
  towerId?: string;
  id: string; // Unique identifier for each cell
}

export type Grid = GridCell[][]; 