# U.S. Pool & Hot Tub Dealer Intelligence Map

**Live App: [https://garridolecca.github.io/pool-dealer-map/](https://garridolecca.github.io/pool-dealer-map/)**

Interactive ArcGIS JavaScript application mapping pool and hot tub chemical dealers across the United States. Built as a competitive intelligence tool for King Technology (FROG Products).

## What This Maps

| Category | Companies | Locations |
|----------|-----------|-----------|
| **Wholesale Distributors** | PoolCorp/SCP, Heritage Pool Supply | 50+ mapped |
| **Retail Chains** | Leslie's Pool Supplies | 20+ mapped |
| **Franchises** | Pinch A Penny, ASP | 15+ mapped |
| **Equipment Manufacturers** | Hayward, Pentair, Fluidra/Zodiac | HQ + distribution |
| **Chemical Competitors** | BioGuard/BioLab, Natural Chemistry | HQ + manufacturing |
| **Hot Tub Dealers** | Hot Spring Spas, Jacuzzi, Bullfrog, Sundance | Key dealers |
| **Big Box Retail** | Home Depot, Lowe's, Walmart, Costco, Ace | HQ/representative |
| **Online Retailers** | In The Swim, Pool Supply World, Doheny's | Warehouses |
| **Independents** | Regional dealers across the U.S. | Key locations |
| **King Technology** | FROG Products HQ | Minnetonka, MN |

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

- **PoolCorp** (424 US locations) is going vertical with private-label chemicals — transitioning from distribution partner to direct competitor
- **Heritage Pool Supply** (150+ locations) is being acquired by **Home Depot** — merging wholesale distribution with 2,300+ big-box stores
- **Sun Belt concentration** — FL, TX, CA, AZ hold the densest dealer networks and fastest growth
- **Private label threat** — PoolCorp, Leslie's, Pinch A Penny, Home Depot, Walmart all sell house-brand chemicals

## Tech Stack

- ArcGIS Maps SDK for JavaScript 4.31
- Calcite Design System (dark theme)
- Client-side FeatureLayer with clustering
- Pure HTML/CSS/JS — no build step required

## Data Sources

Location data compiled from public store locators, press releases, SEC filings, and industry directories. Representative locations shown for chains with 100+ stores.
