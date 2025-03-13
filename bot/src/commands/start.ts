import { BaseCommandHandler, MyContext } from "../commandHandler";


const startText = `
Welcome to the Piers Rugyard auction notification bot.

`

export class StartHandler implements BaseCommandHandler {
    command = "start";
    description = "View the start message";
    addToList = false
    middlewares = []
    async handle(ctx: MyContext) {
        await ctx.reply(startText, { parse_mode: "MarkdownV2" })
    }
    async handlePlainMessage(ctx: MyContext) {
        return
    }
}
