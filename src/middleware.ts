
import { MyContext } from "./commandHandler";


export const adminCommand = async (ctx: MyContext, next: () => Promise<void>) => {
    if (!ctx.from) {
        return
    }
    if (ctx.chat?.type === 'private') {
        await next();
        return
    }
    if ((await ctx.getChatAdministrators()).find((admin) => admin.user.id === ctx.from!.id)) {
        await next();
    }
}

