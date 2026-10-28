import { DataSourceOptions } from 'typeorm';

export const dbOptions = (): DataSourceOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../entities/*.entity.{ts,js}'],
  synchronize: process.env.DB_SYNC !== 'false',
});
