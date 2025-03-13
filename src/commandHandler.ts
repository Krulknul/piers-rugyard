import { EnvironmentVariables } from "./environment";
import { Context } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";
import { Menu } from "@grammyjs/menu";

export interface CustomContext extends Context {
    environment: EnvironmentVariables;
}
export type MyContext = CustomContext & ConversationFlavor;


export interface CommandHandler {
    command: string;
    description: string;
    middlewares: ((ctx: MyContext, next: () => Promise<void>) => Promise<void>)[]
    addToList: boolean;
    menu?: Menu<MyContext>
    handle: (ctx: MyContext) => Promise<void>;
    handlePlainMessage: (ctx: MyContext) => Promise<void>;
}

export class BaseCommandHandler implements CommandHandler {
    command = "";
    description = "";
    middlewares = new Array
    addToList = true
    menu?: Menu<MyContext>
    async handle(ctx: MyContext) {
        await ctx.reply("not implemented");
    }
    async handlePlainMessage(ctx: MyContext) {
        return
    }
}