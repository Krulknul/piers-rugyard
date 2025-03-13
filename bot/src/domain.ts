import { GatewayEzMode } from "@calamari-radix/gateway-ez-mode"

const XRD_DOMAINS_RESOURCE_ADDRESS = "resource_rdx1n2dd0w53zpdlqdz65vpymygj8a60vqnggyuxfpfdldjmy2224x020q"

export async function resolveAccountDomain(gateway: GatewayEzMode, account: string): Promise<string | null> {
    const nftHoldings = await gateway.getAccount(account).getNftBalances()
    return nftHoldings.find(nft => nft.resourceInfo.resourceAddress === XRD_DOMAINS_RESOURCE_ADDRESS)?.nftBalance.at(0)?.name || null
}
