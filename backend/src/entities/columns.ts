import { ColumnOptions } from 'typeorm';

// numeric columns come back from Postgres as strings, so turn them into numbers
export const money: ColumnOptions = {
  type: 'numeric',
  precision: 10,
  scale: 2,
  transformer: { to: (v: number) => v, from: (v: string | null) => (v === null ? null : Number(v)) },
};
