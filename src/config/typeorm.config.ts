import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export default registerAs(
  "typeorm",
  (): TypeOrmModuleOptions => ({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    // migrations são a fonte de verdade
    synchronize: false,
    migrationsRun: false,
    migrations: [join(__dirname, "..", "database", "migrations", "*.{ts,js}")],
    connectTimeoutMS: 10_000,
    extra: { max: 10, idleTimeoutMillis: 30_000 },
  }),
);
