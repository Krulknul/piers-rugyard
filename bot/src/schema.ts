import { s, SborParser } from '@calamari-radix/gateway-ez-mode'
import { ProgrammaticScryptoSborValue } from '@radixdlt/babylon-gateway-api-sdk';
export const auctionStarted: ProgrammaticScryptoSborValue = {
    kind: 'Tuple',
    type_name: 'PiersRugyardAuctionStarted',
    fields: [
        {
            kind: 'Tuple',
            type_name: 'Auction',
            field_name: 'auction',
            fields: [
                {
                    kind: 'U64',
                    field_name: 'id',
                    value: '49',
                },
                {
                    kind: 'I64',
                    type_name: 'Instant',
                    field_name: 'start_timestamp',
                    value: '1741881420',
                },
                {
                    kind: 'I64',
                    type_name: 'Instant',
                    field_name: 'end_timestamp',
                    value: '1741881720',
                },
                {
                    kind: 'NonFungibleLocalId',
                    field_name: 'nft',
                    value: '#49#',
                },
                {
                    kind: 'Enum',
                    type_name: 'Option',
                    field_name: 'highest_bid',
                    variant_id: '0',
                    variant_name: 'None',
                    fields: [],
                },
                {
                    kind: 'Enum',
                    type_name: 'Option',
                    field_name: 'highest_bidder',
                    variant_id: '0',
                    variant_name: 'None',
                    fields: [],
                },
                {
                    kind: 'U64',
                    field_name: 'bid_count',
                    value: '0',
                },
                {
                    kind: 'Array',
                    field_name: 'latest_bids',
                    element_kind: 'Tuple',
                    elements: [],
                },
            ],
        },
    ],
};

export const bidSchema = s.struct({
    amount: s.decimal(),
    bidder: s.resourceAddress(),
    timestamp: s.number()
})

export const auctionSchema = s.struct({
    id: s.number(),
    start_timestamp: s.number(),
    end_timestamp: s.number(),
    nft: s.nonFungibleLocalId(),
    highest_bid: s.option(s.decimal()),
    highest_bidder: s.option(
        s.resourceAddress()
    ),
    bid_count: s.number(),
    latest_bids: s.array(bidSchema)
})

export const auctionStartedSchema = s.struct({
    auction: auctionSchema
})

export const auctionSettledSchema = auctionStartedSchema

export const bidEventSchema = s.struct({
    auction: auctionSchema,
    bid: bidSchema
})

export const parser = new SborParser