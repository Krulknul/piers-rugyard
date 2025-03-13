import { GatewayEzMode } from "@calamari-radix/gateway-ez-mode"

export async function getNftInfo(gateway: GatewayEzMode, resourceAddress: string, id: string): Promise<{
    image: string
    name: string
} | null> {
    const nftInfo = await gateway.gateway.state.getNonFungibleData(resourceAddress, id)
    if (nftInfo.data?.programmatic_json.kind !== 'Tuple') return null
    const image = nftInfo.data.programmatic_json.fields.find(field => field.field_name === 'key_image_url')
    if (!image) return null
    if (image.kind !== 'String') return null
    const name = nftInfo.data.programmatic_json.fields.find(field => field.field_name === 'name')
    if (!name) return null
    if (name.kind !== 'String') return null
    return {
        image: image.value,
        name: name.value
    }
}