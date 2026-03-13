# U.S. Pool & Hot Tub Dealer Intelligence Map

**Live App: [https://garridolecca.github.io/pool-dealer-map/](https://garridolecca.github.io/pool-dealer-map/)**

Interactive ArcGIS JavaScript application mapping pool and hot tub chemical dealers across the United States. Built as a competitive intelligence tool for King Technology (FROG Products).

## What This Maps

| Category | Companies | Mapped | Total Market |
|----------|-----------|--------|--------------|
| **Wholesale Distributors** | PoolCorp/SCP, Heritage Pool Supply | 70+ | ~600+ |
| **Retail Chains** | Leslie's Pool Supplies (NYSE: LESL) | 22+ | 972 |
| **Franchises** | Pinch A Penny (PoolCorp-owned), ASP | 15+ | 291+ |
| **Equipment Manufacturers** | Hayward, Pentair, Fluidra/Zodiac | HQ + dist | ~2,777 (Hayward alone) |
| **Chemical Competitors** | BioGuard/BioLab (KIK/Solenis), Natural Chemistry | HQ + mfg | ~1,500 (BioGuard) |
| **Hot Tub Dealers** | Hot Spring (Pentair), Jacuzzi, Bullfrog, Sundance | 30+ | 700-850+ (Hot Spring) |
| **Big Box Retail** | Home Depot, Lowe's, Walmart, Costco, Ace, True Value | HQ/representative | ~19,000+ |
| **Online Retailers** | In The Swim (Leslie's), Pool Supply World, Doheny's, PoolSupplies.com | Warehouses | 30+ DCs |
| **Independents** | Regional dealers, builders, service companies | Key locations | Thousands |
| **King Technology** | FROG Products HQ | Minnetonka, MN | 1 |

## Key Ownership Consolidation

```
PoolCorp (NYSE: POOL)
 ├── SCP Distributors (228 sales centers)
 ├── Superior Pool Products
 ├── Pinch A Penny (291+ retail franchises) ← acquired Dec 2021
 └── Horizon Distributors (irrigation)

Leslie's (NYSE: LESL)
 ├── Leslie's Pool Supplies (972 stores, 37 states)
 ├── In The Swim (online + 9 DCs) ← acquired
 └── Pool Supply World (online) ← acquired

The Home Depot
 └── Heritage Pool Supply Group (150+ wholesale, 36 states) ← acquired Jun 2024, $18.25B via SRS

Pentair (NYSE: PNR)
 ├── Pentair Equipment Dealers (thousands)
 └── Watkins Wellness ← acquired 2023
      ├── Hot Spring Spas (700-850+ dealers)
      ├── Caldera Spas
      ├── Freeflow Spas
      └── Fantasy Spas

Jacuzzi Group
 ├── Jacuzzi (200+ dealers)
 └── Sundance Spas (200+ dealers)

KIK Consumer Products / Solenis
 ├── BioGuard (~1,500 authorized retailers)
 ├── BioLab (manufacturing)
 ├── Natural Chemistry
 └── SpaGuard
```

## Features

- **Interactive map** with dark basemap and satellite toggle
- **Clustering** for dense areas with toggle on/off
- **Heatmap mode** to visualize dealer density hotspots
- **Filter by** dealer type, company, products, and state
- **Search** by name, company, city, or state
- **Detail panel** with full dealer information and competitive intelligence
- **Statistics dashboard** with breakdowns by type, company, and state
- **Private label tracking** — identifies which companies sell their own branded chemicals (direct competitors to King Technology)
- **Threat assessment** — flags competitors vs. potential partners

## Key Intelligence Insights

- **PoolCorp** (424+ locations + 291 Pinch A Penny) controls the largest distribution + retail network. Going vertical with private-label chemicals — transitioning from partner to direct competitor
- **Heritage Pool Supply** (150+ locations) **acquired by Home Depot** (Jun 2024, $18.25B) — merging #2 wholesale distributor with 2,300+ big-box stores
- **Leslie's** (972 stores) owns the #1 and #2 online retailers (In The Swim, Pool Supply World) — sells Leslie's branded chemicals
- **Pentair acquired Watkins/Hot Spring** (2023) — now controls equipment + the largest hot tub dealer network (700-850+)
- **Sun Belt concentration** — FL, TX, CA, AZ hold the densest dealer networks and fastest growth. Leslie's: TX(224), CA(172), AZ(98), FL(92)
- **Private label threat** — PoolCorp, Leslie's, Pinch A Penny, Home Depot, Walmart, Doheny's, In The Swim all sell house-brand chemicals

## Tech Stack

- ArcGIS Maps SDK for JavaScript 4.31
- Calcite Design System (dark theme)
- Client-side FeatureLayer with clustering
- Pure HTML/CSS/JS — no build step required

## Data Sources

Location data compiled from public store locators, press releases, SEC filings, ScrapeHero reports, and industry directories including:
- [PoolCorp Sales Centers](https://poolcorp.com/sales-centers/)
- [Heritage Pool Supply Branch Locator](https://heritagepoolsupplygroup.com/en/branch-locator/)
- [Leslie's Store Locator](https://lesliespool.com/stores)
- [Pinch A Penny Stores](https://pinchapenny.com/stores)
- [Hayward Dealer Locator](https://hayward.com/dealerlocator)
- [Pentair Find-a-Dealer](https://pentair.com/en-us/find-a-dealer/pool-spa.html)
- [BioGuard Store Locator](https://local.bioguard.com)
- [Hot Spring Spas Dealers](https://hotspring.com/hot-tub-dealers)
- [Bullfrog Spas Stores](https://bullfrogspas.com/stores/)

Representative locations shown for chains with 100+ stores. Full dataset can be expanded by scraping the locator APIs above.
