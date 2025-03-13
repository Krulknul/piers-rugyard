import { describe, it, expect } from 'vitest';
import { auctionStarted, auctionStartedSchema, parser } from './schema';
import { GatewayEzMode } from '@calamari-radix/gateway-ez-mode';
import { resolveAccountDomain } from './domain';
import { getNftInfo } from './nft';


describe('parsing', () => {
    it('should parse auction started', async () => {
        const parsed = parser.safeParse(auctionStarted, auctionStartedSchema)
        console.log(JSON.stringify(parsed, null, 2))

        expect(parsed.success).toBe(true)

        // if (parsed.success) {
        //     parsed.data.auction.highest_bid.variant
        // }
    });
});

describe('domain', () => {
    it('should resolve domain', async () => {
        const gateway = new GatewayEzMode
        const domain = await resolveAccountDomain(gateway, 'account_rdx12yspdmpd6jdgcffkk6vjkqa9fagf3wnha5xd06s3uje5wr9664arkf')
        expect(domain).toBe('ratta.xrd')
    });
})

describe('nft', () => {
    it('should be able to find nft info', async () => {
        const gateway = new GatewayEzMode
        const nft = await getNftInfo(gateway, 'resource_rdx1n2np4hju8hetgjkyvvsmxtm5mnt7zkrkg5h7z6455as229rhu79scy', '#1#')
        console.log(nft)
        expect(nft?.image).toBe('https://ersqfjtdhzgnu3xqoxc7i45guhkvbd7cdyplfclg4smt2l5yj7ka.arweave.net/JGUCpmM-TNpu8HXF9HOmodVQj-IeHrKJZuSZPS-4T9Q')
        expect(nft?.name).toBe("We're not going to build that yet")
    });
})