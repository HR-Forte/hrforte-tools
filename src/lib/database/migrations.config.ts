export const migrationsConfig = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
  database: process.env.MONGODB_DATABASE || "hrforte-management",
  migrationsDir: "migrations",
  migrationsCollection: "migrations"
};

export default migrationsConfig; 