import { DataSource } from "typeorm";
import { BimaUser } from "./entities/BimaUser";

export const dataSource = new DataSource({
    type: "mongodb",
    database: "test",
    synchronize: true,
    url: process.env.MONGO_URI,
    useNewUrlParser: true,
    logging: false,
    entities: [BimaUser],
    migrations: [],
    subscribers: [],
});
