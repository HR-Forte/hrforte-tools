import { mongoMigrateCli } from 'mongo-migrate-ts';
import path from 'path';

mongoMigrateCli({
  uri: process.env.DATABASE_URI,
  database: process.env.DATABASE_NAME,
  migrationsDir: path.join(__dirname),
  migrationsCollection: 'migrations',
});
