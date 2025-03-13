import { configDotenv } from "dotenv";


export class EnvironmentVariables {
    botToken: string;
    network: string;


    constructor() {
        configDotenv();

        if (process.env.BOT_TOKEN === undefined) {
            throw new Error("BOT_TOKEN must be provided in the environment variables");
        }
        this.botToken = process.env.BOT_TOKEN;

        if (process.env.NETWORK === undefined) {
            throw new Error("NETWORK must be provided in the environment variables");
        }
        this.network = process.env.NETWORK;

        return this;
    }
}