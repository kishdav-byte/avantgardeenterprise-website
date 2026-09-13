import {
    SpaceContext,
    RoomType,
    BudgetTier,
    ProductRecommendation,
} from './space-planner-types'

const DEFAULT_AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG || 'avantgarde-20'

export interface CatalogProductTemplate {
    title: string
    category: string
    asin: string
    basePrice: number
    contexts: SpaceContext[]
    roomTypes?: RoomType[]
    priority: 'must_have' | 'recommended' | 'optional'
    placement_zone: string
    reasoning: string
}

// Curated taxonomy of verified Amazon organizational products
export const PRODUCT_CATALOG: CatalogProductTemplate[] = [
    // HOME: PANTRY & KITCHEN
    {
        title: 'Vtopmart Airtight Food Storage Containers (Set of 24) with Chalkboard Labels',
        category: 'Food Storage & Canisters',
        asin: 'B089K89F9S',
        basePrice: 32.99,
        contexts: ['home', 'business'],
        priority: 'must_have',
        placement_zone: 'Dry Storage / Eye-Level Shelving',
        reasoning: 'Uniform airtight modular containers maximize vertical shelf space while preventing pests and product expiration.',
    },
    {
        title: 'YouCopia 3-Tier Expandable Shelf Organizer for Spices and Canned Goods',
        category: 'Pantry Shelving',
        asin: 'B0036OQU4C',
        basePrice: 19.99,
        contexts: ['home'],
        priority: 'recommended',
        placement_zone: 'Upper Pantry / Prep Zone',
        reasoning: 'Stepped tier design provides immediate line-of-sight visibility to all spice jars and canned goods.',
    },
    {
        title: 'mDesign Wire Food Organizer Baskets with Handles (Pack of 4)',
        category: 'Pantry Baskets',
        asin: 'B0798VMR65',
        basePrice: 28.50,
        contexts: ['home', 'business'],
        priority: 'must_have',
        placement_zone: 'Lower Reach-in Shelves',
        reasoning: 'Enables quick grab-and-go grouping for snacks, baking supplies, and paper goods.',
    },

    // HOME: CLOSET & BEDROOM
    {
        title: 'Amazon Basics Slim Velvet Non-Slip Clothes Hangers (Pack of 50)',
        category: 'Closet Hardware',
        asin: 'B00FXNAAW2',
        basePrice: 22.99,
        contexts: ['home'],
        priority: 'must_have',
        placement_zone: 'Hanging Wardrobe Rod',
        reasoning: 'Ultra-thin velvet profile increases rod hanging capacity by up to 40% while preventing garment slippage.',
    },
    {
        title: 'Simple Houseware Foldable Cloth Storage Cube Bins (Set of 6)',
        category: 'Closet Organization',
        asin: 'B01M33TXZD',
        basePrice: 18.99,
        contexts: ['home', 'classroom'],
        priority: 'recommended',
        placement_zone: 'Cubby System / Upper Shelf',
        reasoning: 'Lightweight bins conceal seasonal folded apparel, toys, and soft goods with minimal investment.',
    },
    {
        title: 'Clear Stackable Drop-Front Shoe Box Organizers (Set of 12)',
        category: 'Shoe Storage',
        asin: 'B09N1V7V4W',
        basePrice: 42.99,
        contexts: ['home'],
        priority: 'optional',
        placement_zone: 'Closet Floor / Base Perimeter',
        reasoning: 'Transparent magnetic drop-front doors protect footwear while providing instant dust-free accessibility.',
    },

    // HOME & BUSINESS: CABLE & DESK
    {
        title: 'D-Line Cable Management Box Organizer with Cord Clips & Ties',
        category: 'Cable Management',
        asin: 'B007887E8E',
        basePrice: 16.99,
        contexts: ['home', 'business'],
        priority: 'must_have',
        placement_zone: 'Desk Perimeter / Floor Surge Strip',
        reasoning: 'Conceals dangerous tangled cords, reduces dust accumulation, and creates a clean ergonomic aesthetic.',
    },

    // CLASSROOM: SEATING, STATIONS, & STORAGE
    {
        title: 'Seville Classics 10-Drawer Mobile Organizer Cart with Locking Wheels',
        category: 'Classroom Carts',
        asin: 'B00394ECTE',
        basePrice: 44.99,
        contexts: ['classroom', 'business'],
        priority: 'must_have',
        placement_zone: 'Teacher Prep / STEM Center',
        reasoning: 'Color-coded drawers allow daily curriculum sorting (Mon-Fri) and mobile supply distribution.',
    },
    {
        title: 'Really Good Stuff Durable Book and Binder Storage Bins (Set of 4)',
        category: 'Student Literacy',
        asin: 'B01LWY7Q65',
        basePrice: 34.99,
        contexts: ['classroom'],
        priority: 'must_have',
        placement_zone: 'Reading Nook / Classroom Library',
        reasoning: 'Heavy-duty non-tip bins organize leveled readers and student portfolios by color coding.',
    },
    {
        title: 'Srenta Magnetic Whiteboard Hanging Pocket Chart (10 Pockets)',
        category: 'Visual Timers & Schedules',
        asin: 'B07Z8L3X29',
        basePrice: 15.99,
        contexts: ['classroom'],
        priority: 'recommended',
        placement_zone: 'Whiteboard / Front Wall Display',
        reasoning: 'Displays daily schedule cards, vocabulary focus words, and student attendance check-ins.',
    },
    {
        title: 'Storex Large Interlocking Book Caddies (Set of 6)',
        category: 'Student Table Supplies',
        asin: 'B08F2TRDQP',
        basePrice: 24.50,
        contexts: ['classroom'],
        priority: 'recommended',
        placement_zone: 'Student Group Pod Tables',
        reasoning: 'Holds scissors, markers, and glue sticks at center table stations to eliminate transition disruption.',
    },

    // BUSINESS & COMMERCIAL: WAREHOUSE, RETAIL, OFFICE
    {
        title: 'Amazon Basics 5-Shelf NSF-Certified Heavy-Duty Industrial Wire Rack (1500 lbs)',
        category: 'Commercial Shelving',
        asin: 'B01M0A7M9W',
        basePrice: 84.99,
        contexts: ['business'],
        priority: 'must_have',
        placement_zone: 'Stockroom / Fulfillment Wall',
        reasoning: 'Commercial NSF rating complies with sanitation standards while holding high-density inventory boxes.',
    },
    {
        title: 'Akro-Mils Heavy Duty Polypropylene Stack & Nest Storage Bins (Pack of 6)',
        category: 'Inventory Picking Bins',
        asin: 'B0001894C2',
        basePrice: 38.99,
        contexts: ['business'],
        priority: 'must_have',
        placement_zone: 'Order Prep / Picking Stations',
        reasoning: 'Industrial open-hopper front allows rapid FIFO inventory access and quick SKU scanning.',
    },
    {
        title: 'Brother P-Touch Industrial Handheld Label Maker (PT-H110)',
        category: 'Asset & Shelf Labeling',
        asin: 'B0135GES3E',
        basePrice: 29.99,
        contexts: ['home', 'classroom', 'business'],
        priority: 'must_have',
        placement_zone: 'Central Workspace',
        reasoning: 'Essential for clear location labeling of bin addresses, shelf IDs, and compliance markings.',
    },
    {
        title: 'D-Line Heavy-Duty Floor Cable Protector 6ft (Trip Hazard Prevention)',
        category: 'Safety & OSHA Compliance',
        asin: 'B0078RO172',
        basePrice: 24.99,
        contexts: ['business'],
        priority: 'must_have',
        placement_zone: 'Main Walkway / Foot Traffic Route',
        reasoning: 'Prevents workplace trip-and-fall incidents, protecting wiring across high-traffic floor pathways.',
    },
    {
        title: 'Cambro Camwear Commercial Clear Food Storage Square Container 6 Qt',
        category: 'Commercial Food Grade',
        asin: 'B0001MS88G',
        basePrice: 19.50,
        contexts: ['business'],
        priority: 'recommended',
        placement_zone: 'Commercial Kitchen / Walk-in Cooler',
        reasoning: 'Health code certified food container with easy-to-read metric graduations and snap-tight lids.',
    },
]

/**
 * Builds an affiliate URL for a specific ASIN.
 */
export function buildAmazonAffiliateUrl(asin: string, tag: string = DEFAULT_AFFILIATE_TAG): string {
    return `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(tag)}`
}

/**
 * Builds an affiliate search URL for arbitrary product queries.
 */
export function buildAmazonSearchUrl(query: string, tag: string = DEFAULT_AFFILIATE_TAG): string {
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(tag)}`
}

/**
 * Maps AI suggested products or room context to a curated, affiliate-tagged product kit.
 */
export function mapProductsToAmazonAffiliate(
    context: SpaceContext,
    roomType: RoomType,
    budgetTier: BudgetTier = 'medium',
    aiSuggestions: Partial<ProductRecommendation>[] = [],
    tag: string = DEFAULT_AFFILIATE_TAG
): ProductRecommendation[] {
    const results: ProductRecommendation[] = []

    // 1. Process AI-generated suggestions first
    if (aiSuggestions && aiSuggestions.length > 0) {
        for (const item of aiSuggestions) {
            if (!item.title) continue

            // Check if matches known catalog ASIN
            const matchedCatalog = PRODUCT_CATALOG.find(
                (p) => p.title.toLowerCase().includes(item.title!.toLowerCase()) ||
                    (item.category && p.category.toLowerCase().includes(item.category.toLowerCase()))
            )

            const asin = matchedCatalog ? matchedCatalog.asin : (item.asin || 'B089K89F9S')
            const affiliateUrl = matchedCatalog
                ? buildAmazonAffiliateUrl(matchedCatalog.asin, tag)
                : (item.affiliate_url || buildAmazonSearchUrl(item.title, tag))

            results.push({
                title: item.title,
                category: item.category || matchedCatalog?.category || 'Storage Organization',
                asin,
                affiliate_url: affiliateUrl,
                price_estimate: item.price_estimate || matchedCatalog?.basePrice || 24.99,
                priority: item.priority || matchedCatalog?.priority || 'recommended',
                placement_zone: item.placement_zone || matchedCatalog?.placement_zone || 'Primary Storage Area',
                reasoning: item.reasoning || matchedCatalog?.reasoning || 'Engineered for clutter minimization and functional flow.',
            })
        }
    }

    // 2. Supplement with context-specific catalog staples if results are few
    if (results.length < 4) {
        const contextMatches = PRODUCT_CATALOG.filter((p) => p.contexts.includes(context))

        for (const staple of contextMatches) {
            if (results.some((r) => r.asin === staple.asin)) continue

            results.push({
                title: staple.title,
                category: staple.category,
                asin: staple.asin,
                affiliate_url: buildAmazonAffiliateUrl(staple.asin, tag),
                price_estimate: staple.basePrice,
                priority: staple.priority,
                placement_zone: staple.placement_zone,
                reasoning: staple.reasoning,
            })

            if (results.length >= 6) break
        }
    }

    // 3. Filter / adjust based on budget tier
    if (budgetTier === 'diy_low') {
        // Prioritize essentials and lower-cost items
        return results
            .sort((a, b) => (a.price_estimate || 0) - (b.price_estimate || 0))
            .slice(0, 5)
    }

    return results
}
