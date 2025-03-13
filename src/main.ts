import { Bot } from "grammy";
import { run } from "@grammyjs/runner";
import fs from "fs";
import { DateTime } from "luxon";

import { EnvironmentVariables } from "./environment";
import { BaseCommandHandler, CommandHandler, MyContext } from "./commandHandler";
import { StartHandler } from "./commands/start";

import {
    GatewayEzMode,
    SborParser,
} from "@calamari-radix/gateway-ez-mode";

import {
    GatewayApiClient,
    ProgrammaticScryptoSborValue,
} from "@radixdlt/babylon-gateway-api-sdk";

import {
    auctionSettledSchema,
    auctionStartedSchema,
    bidEventSchema,
} from "./schema";

import { resolveAccountDomain } from "./domain";
import { getNftInfo } from "./nft";
import { adminCommand } from "./middleware";

/*****************************************************
 * Constants / Environment
 *****************************************************/
const environmentVariables = new EnvironmentVariables();

const MY_USER_ID = "6277298559"; // <— If you still need to reference a default user

const PIERS_RUGYARD_MAINNET_COMPONENT =
    "component_rdx1cq86467tkaj0dsjavw2asjwugw5rggp3nf7hs3z30577xlj6nv22wr";
const PIERS_RUGYARD_STOKENET_COMPONENT =
    "component_tdx_2_1czvpp7w2htcj39n8qxkxew62ltaz6aaz97206vmahgdyg54fwnyekz";

const PIERS_RUGYARD_MAINNET_RESOURCE =
    "resource_rdx1n2np4hju8hetgjkyvvsmxtm5mnt7zkrkg5h7z6455as229rhu79scy";
const PIERS_RUGYARD_STOKENET_RESOURCE =
    "resource_tdx_2_1ntq7a805lxy0ehvxpyu9zm22psufd6duq9m9uk2zq6f8xssrhq52h0";

const STOKENET_DASHBOARD_BASE_URL = "https://stokenet-dashboard.radixdlt.com";
const MAINNET_DASHBOARD_BASE_URL = "https://dashboard.radixdlt.com";

/*****************************************************
 * Helper Functions
 *****************************************************/
// Decide which resource ID to use, based on environment
function resource() {
    if (environmentVariables.network === "mainnet") {
        return PIERS_RUGYARD_MAINNET_RESOURCE;
    }
    return PIERS_RUGYARD_STOKENET_RESOURCE;
}

// Decide which component address to use, based on environment
function component() {
    if (environmentVariables.network === "mainnet") {
        return PIERS_RUGYARD_MAINNET_COMPONENT;
    } else {
        return PIERS_RUGYARD_STOKENET_COMPONENT;
    }
}

// Decide which dashboard URL to link to
function dashboardUrl() {
    if (environmentVariables.network === "mainnet") {
        return MAINNET_DASHBOARD_BASE_URL;
    }
    return STOKENET_DASHBOARD_BASE_URL;
}

// Utility to partially obfuscate an account (if domain not found)
function formatAccount(account: string, domain: string | null) {
    if (domain) return domain;
    // For example: "accou...w1c9x" using last 10 chars minus 1
    return "accou..." + account.slice(-10, -1);
}

const DATA_FILE_PATH = "./data/gingers.json";

// create directory if it doesn't exist
if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
}

function readSubscriptions(): Set<number> {
    try {
        const raw = fs.readFileSync(DATA_FILE_PATH, { encoding: "utf-8" });
        const data = JSON.parse(raw);
        if (Array.isArray(data.subscribers)) {
            return new Set<number>(data.subscribers);
        }
    } catch (err) {
        console.error("readSubscriptions error:", err);
    }
    return new Set<number>();
}

function writeSubscriptions(subscribers: Set<number>): void {
    const data = {
        subscribers: Array.from(subscribers),
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

// Global in-memory set to hold subscriber chat IDs
const subscriptions = readSubscriptions();

/*****************************************************
 * Initialize Bot
 *****************************************************/
export const bot = new Bot<MyContext>(environmentVariables.botToken);

/*****************************************************
 * Commands Setup
 *****************************************************/


export class SubscribeHandler implements BaseCommandHandler {
    command = "subscribe";
    description = "Subscribe to auction notifications";
    addToList = true
    middlewares = [adminCommand]
    async handle(ctx: MyContext) {
        if (!ctx.chat) return
        const chatId = ctx.chat.id;

        if (subscriptions.has(chatId)) {
            await ctx.reply("You are already subscribed to auction notifications!");
            return;
        }

        subscriptions.add(chatId);
        writeSubscriptions(subscriptions);

        await ctx.reply("✅ You have subscribed to auction notifications! I'm personally pretty bullish on this...");
    }
    async handlePlainMessage(ctx: MyContext) {
    }
}

export class StopHandler implements BaseCommandHandler {
    command = "stop";
    description = "Stop receiving auction updates";
    addToList = true
    middlewares = [adminCommand]
    async handle(ctx: MyContext) {
        if (!ctx.chat) return
        const chatId = ctx.chat.id;

        if (!subscriptions.has(chatId)) {
            await ctx.reply("You are not currently subscribed.");
            return;
        }

        subscriptions.delete(chatId);
        writeSubscriptions(subscriptions);

        await ctx.reply("Then leave, my friend. Nothing is keeping you here... You have unsubscribed.");
    }
    async handlePlainMessage(ctx: MyContext) {
    }
}

const commands: CommandHandler[] = [
    new StartHandler(),
    new SubscribeHandler(),
    new StopHandler(),
];


// Register your existing commands
commands.forEach((command) => {
    if (command.menu) {
        bot.use(command.menu);
    }
    bot.command(command.command, ...command.middlewares, (ctx) =>
        command.handle(ctx)
    );
});

// If you have an "on message" fallback, here it is:
bot.on("message:text", async (ctx) => {
    commands.forEach((command) => {
        command.handlePlainMessage(ctx);
    });
});

/*****************************************************
 * Telegram Command List in the Bot’s Menu
 *****************************************************/
const commandDescriptions = [
    // Combine commands from your custom CommandHandler classes
    ...commands
        .filter((command) => command.addToList)
        .map((command) => ({
            command: command.command,
            description: command.description,
        })),

];
await bot.api.setMyCommands(commandDescriptions);

/*****************************************************
 * Gateway & Event Stream Setup
 *****************************************************/
const COMPONENT = component();
const RESOURCE = resource();
const DASHBOARD_URL = dashboardUrl();

const gateway = new GatewayEzMode(
    GatewayApiClient.initialize({
        applicationName: "",
        networkId: environmentVariables.network == "mainnet" ? 1 : 2,
    })
);

function broadcastToSubscribers(
    text: string,
    options?: Parameters<typeof bot.api.sendMessage>[2]
) {
    for (const chatId of subscriptions) {
        bot.api.sendMessage(chatId, text, options).catch((err) => {
            console.error(`Failed to send to chat ${chatId}:`, err);
        });
    }
}

export async function setConstantsMiddleware(
    ctx: MyContext,
    next: () => Promise<void>
) {
    ctx.environment = environmentVariables;
    await next();
}

// Create the transaction stream
const stream = await gateway.getTransactionStream({});
const parser = new SborParser();

function formatNumberString(num: string) {
    return new Intl.NumberFormat().format(Number(num));
}

/*****************************************************
 * Main Stream Loop
 *****************************************************/
async function runStream() {
    let transactions = await stream.next();

    while (true) {
        transactions = await stream.next();
        console.log(transactions.lastSeenStateVersion);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        transactions.transactions.forEach(async (transaction) => {
            if (!transaction.receipt) return;
            if (!transaction.receipt.detailed_events) return;

            for (const event of transaction.receipt.detailed_events) {
                // We only care about events from our known component
                if (event.emitter.type !== "EntityMethod") continue;
                if (event.emitter.global_emitter !== COMPONENT) continue;

                // 1) Auction Started
                if (event.identifier.event === "PiersRugyardAuctionStarted") {
                    const parsed = parser.safeParse(
                        event.payload.programmatic_json as ProgrammaticScryptoSborValue,
                        auctionStartedSchema
                    );
                    if (!parsed.success) {
                        console.error(parsed.error);
                        return;
                    }
                    console.log(
                        JSON.stringify(event.payload.programmatic_json, null, 2),
                        JSON.stringify(parsed.data, null, 2)
                    );

                    const nft = await getNftInfo(gateway, RESOURCE, parsed.data.auction.nft);
                    if (!nft) {
                        console.error("NFT not found");
                        return;
                    }

                    const caption = `
NEW AUCTION! <a href="${nft.image}">💸</a>

"${nft.name}"

Make it yours at piersrugyard.com
`;
                    // Broadcast to all subscribers
                    broadcastToSubscribers(caption, { parse_mode: "HTML" });

                    // If you want to do something with parsed.data.auction.end_timestamp, you can
                }

                // 2) Auction Bid
                else if (event.identifier.event === "PiersRugyardAuctionBid") {
                    const parsed = parser.safeParse(
                        event.payload.programmatic_json as ProgrammaticScryptoSborValue,
                        bidEventSchema
                    );
                    if (!parsed.success) {
                        console.error(parsed.error);
                        return;
                    }
                    console.log(
                        JSON.stringify(event.payload.programmatic_json, null, 2),
                        JSON.stringify(parsed.data, null, 2)
                    );

                    const endTimestamp = parsed.data.auction.end_timestamp;
                    const dateTime = DateTime.fromSeconds(endTimestamp);
                    const now = DateTime.now();
                    const timeLeft = dateTime.diff(now, ["hours", "minutes", "seconds"]).toHuman({
                        maximumFractionDigits: 0,
                    });

                    const bidder = parsed.data.bid.bidder;
                    const domain = await resolveAccountDomain(gateway, bidder);

                    const nft = await getNftInfo(gateway, RESOURCE, parsed.data.auction.nft);
                    if (!nft) {
                        console.error("NFT not found");
                        return;
                    }

                    const caption = `
NEW BID! 💸

<code>${formatNumberString(parsed.data.bid.amount)}</code> XRD for "${nft.name}"
Bid by <a href="${DASHBOARD_URL}/account/${bidder}">${formatAccount(
                        bidder,
                        domain
                    )}</a>
Time left: ${timeLeft}

Make it yours at piersrugyard.com
`;
                    broadcastToSubscribers(caption, {
                        parse_mode: "HTML",
                        link_preview_options: {
                            is_disabled: true,
                        },
                    });
                }

                // 3) Auction Settled
                else if (event.identifier.event === "PiersRugyardAuctionSettled") {
                    const parsed = parser.safeParse(
                        event.payload.programmatic_json as ProgrammaticScryptoSborValue,
                        auctionSettledSchema
                    );
                    if (!parsed.success) {
                        console.error(parsed.error);
                        return;
                    }
                    console.log(
                        JSON.stringify(event.payload.programmatic_json, null, 2),
                        JSON.stringify(parsed.data, null, 2)
                    );

                    const nft = await getNftInfo(gateway, RESOURCE, parsed.data.auction.nft);
                    if (!nft) {
                        console.error("NFT not found");
                        return;
                    }

                    // Highest bidder is an Option variant - check if Some
                    let highestBidder;
                    if (parsed.data.auction.highest_bidder.variant === "Some") {
                        highestBidder = parsed.data.auction.highest_bidder.value[0];
                    } else {
                        // No highest bidder
                        return;
                    }

                    const domain = await resolveAccountDomain(gateway, highestBidder);

                    const caption = `
AUCTION SETTLED! <a href="${nft.image}">💸</a>

Winning bid: <code>${formatNumberString(parsed.data.auction.highest_bid.value[0]!)}</code> XRD
Winner: <a href="${DASHBOARD_URL}/account/${highestBidder}">${formatAccount(
                        highestBidder,
                        domain
                    )}</a>
"${nft.name}"
`;
                    broadcastToSubscribers(caption, { parse_mode: "HTML" });
                }
            }
        });
    }
}

// Start transaction streaming in background
runStream();

// Start the bot with a runner
run(bot);