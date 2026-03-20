# FROG Dealer Intelligence Platform

**Live App: [garridolecca.github.io/pool-dealer-map](https://garridolecca.github.io/pool-dealer-map/)**

Interactive competitive intelligence platform mapping **12,651 pool and hot tub dealer locations** across all 50 US states, with AI-powered identification of **3,832 dealers carrying FROG water care products** and **priority scoring** to rank every dealer by opportunity value.

Built by **Jhonatan Garrido-Lecca** using Claude Code + ArcGIS Maps SDK + Node.js.

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Total dealer locations mapped | **12,651** |
| FROG-tagged dealer locations | **3,832** |
| Official authorized FROG dealers matched | **2,665** |
| Unique dealer websites scanned | **1,793** |
| Official FROG locator dealers scraped | **3,896** |
| Web pages crawled | **100,000+** |
| States covered | **50** |
| Total project effort | **~14 hours** |

---

## Dealer Priority Scoring (0-100)

Every dealer is scored on 6 factors to help King Technology prioritize outreach for direct sales:

| Factor | Points | Logic |
|--------|--------|-------|
| **FROG Product Coverage** | 0-30 | Official authorized (+15), 3+ products (+15), some products (+10) |
| **Channel Value** | 0-25 | Independent (25) > OEM (20) > Distribution (10) > Retail (5) |
| **Dealer Type** | 0-15 | Independent (15) > Franchise (12) > Manufacturer (10) > Chain (8) |
| **Market Size** | 0-10 | FL/CA/TX/AZ = 9-10, mid-tier states = 4-7, small states = 1-3 |
| **No Private Label** | 0-10 | Not selling competing house brands = bonus |
| **White Space** | 0-10 | States with low FROG penetration = bigger opportunity |

### Tier Distribution

| Tier | Score | Dealers | Description |
|------|-------|---------|-------------|
| **A** | 75+ | 1,472 | Top priority -- high-value independents with FROG in strong markets |
| **B** | 55-74 | 5,107 | High value -- good conversion or expansion opportunity |
| **C** | 35-54 | 5,982 | Moderate -- equipment-focused or smaller market dealers |
| **D** | <35 | 530 | Lower priority -- big-box, online, or private-label competitors |

---

## FROG Dealer Identification

Three complementary methods were used to identify which dealers carry FROG products:

### 1. Official FROG Dealer Locator Scrape
Scraped **frogproducts.com/find-a-dealer** across **747 US zip codes** using POST form requests. Found **3,896 authorized FROG dealers** with name, address, city, state, and phone. Cross-referenced against our database: **2,665 matches** confirmed.

### 2. Deep Website Scanner
Custom Node.js crawler scanned **49 pages per dealer** across **1,793 unique websites** (~87,000 total pages). Pages checked include: homepage, /products, /chemicals, /brands, /frog, /shop, /water-care, /spa-chemicals, /collections, on-site search (?s=frog), sitemaps, and dynamically discovered Frog-related links. Found **304 dealers** with specific FROG product mentions.

### 3. AI-Powered Internet Search
AI agents searched Google, Yelp, Facebook business pages, Amazon, Walmart, and industry directories for FROG product keywords. Found **69 additional dealers** including multi-location chains (Watson's, Aqua Quip, Litehouse Pools) and online retailers.

### FROG Products Tracked (13 keywords across 4 lines)
- **Hot Tub**: @ease (Floating & In-Line), SmartChlor, Serene, Maintain, Balancing Basics
- **Pool**: Pool Frog Cycler, Bac PACs, Mineral Reservoir (5400/6100), BAM, Flippin' Frog, Instant Frog
- **Leap (Dealer Exclusive)**: Infuzer, Torpedo Pac, Anti-Bac Mineral Pac, ALL-OUT, Wake-Up/Hibernation
- **Pool Solutions**: No More Phos, No More Cloudy, No More Algae, Algae 90 Day

---

## Dealer Data Sources (12,651 locations)

| Source | Method | Dealers |
|--------|--------|---------|
| Pentair | Salesforce SFDC dealer export | ~7,400 |
| Jacuzzi / Sundance | Dealer locator API crawl | ~1,430 |
| Leslie's | Demandware store locator API | ~880 |
| BioGuard | SOCi platform multi-level crawl | ~860 |
| Bullfrog / Caldera | Sitemap discovery + page scraping | ~640 |
| Hot Spring Spas | JSON-LD structured data extraction | ~590 |
| PoolCorp / SCP | Map API (map_api/map.php) | ~420 |
| Pinch A Penny | Store locator (PoolCorp affiliate) | ~310 |
| Hayward | Amasty locator, geographic grid search | ~200 |
| Heritage Pool | Location data extract | ~115 |
| Others | Manual entries (King Tech HQ, big-box, online) | ~16 |

---

## App Features

- **Priority scoring** -- every dealer scored 0-100 with visual gauge bar and tier classification (A/B/C/D)
- **Priority view toggle** -- resizes map dots by tier (Tier A = large green diamonds, Tier D = small gray dots)
- **FROG Coverage dashboard** -- real-time stats showing FROG dealer counts, confidence levels, official authorized count
- **FROG dealer highlight** -- binoculars button to show only FROG-carrying dealers
- **Channel filter** -- Distribution (PoolCorp/Heritage), OEM (hot tub brands), Independent, Direct, Retail
- **Interactive map** -- ArcGIS dark basemap with 12,651 dealer dots, satellite toggle
- **Clustering & heatmap** -- toggle grouped view or density heatmap
- **Smart filtering** -- click any stat row to filter; combine type + state + channel + FROG + priority
- **Search** -- real-time search by dealer name, company, city, or state
- **Detail panel** -- click any dealer for full info: priority score, FROG products, channel, official status, threat assessment
- **Welcome modal** -- explains methodology, data sources, scoring, and usage instructions
- **Mobile responsive** -- works on phone/tablet with collapsible panels

---

## Channel Classification

| Channel | Companies | Description |
|---------|-----------|-------------|
| **Distribution** | PoolCorp, Heritage Pool Supply | Traditional wholesale distributors (now competing) |
| **OEM** | Hot Spring, Jacuzzi, Sundance, Bullfrog, Caldera | Hot tub manufacturers (direct-to-dealer transition) |
| **Independent** | Pentair, BioGuard, Leslie's, and others | Independent pool/spa dealers (highest value targets) |
| **Retail** | Home Depot, Walmart, Costco, online retailers | Big-box and e-commerce |
| **Direct** | King Technology | FROG manufacturer HQ |

---

## Key Ownership Consolidation

```
PoolCorp (NYSE: POOL)
 +-- SCP Distributors (228 sales centers)
 +-- Superior Pool Products
 +-- Pinch A Penny (291+ retail franchises)
 +-- Horizon Distributors (irrigation)

Leslie's (NYSE: LESL)
 +-- Leslie's Pool Supplies (972 stores, 37 states)
 +-- In The Swim (online + 9 DCs)
 +-- Pool Supply World (online)

The Home Depot
 +-- Heritage Pool Supply Group (150+ wholesale, 36 states)

Pentair (NYSE: PNR)
 +-- Pentair Equipment Dealers (thousands)
 +-- Watkins Wellness (acquired 2023)
      +-- Hot Spring Spas (700-850+ dealers)
      +-- Caldera Spas
      +-- Freeflow / Fantasy Spas

Jacuzzi Group
 +-- Jacuzzi (200+ dealers)
 +-- Sundance Spas (200+ dealers)
```

---

## Tech Stack

- ArcGIS Maps SDK for JavaScript 4.31
- Calcite Design System 2.13.2 (dark theme)
- Client-side FeatureLayer with clustering
- Node.js scraping scripts (custom HTTP crawlers)
- Claude Code (AI-assisted development)
- Pure HTML/CSS/JS -- no build step required
- GitHub Pages hosting

---

## Project Structure

```
pool-dealer-map/
+-- index.html                  # App entry point
+-- app.js                      # Map logic, filters, stats, renderers
+-- styles.css                  # Dark theme styling
+-- dealers-data.js             # 12,651 dealers (auto-generated)
+-- build-data.js               # Data pipeline (merges all sources)
+-- fetch_frog_dealers.js       # Basic FROG website scanner
+-- fetch_frog_deep.js          # Deep FROG scanner (49 pages/dealer)
+-- fetch_frog_locator.js       # Official FROG locator scraper
+-- frog_internet_dealers.json  # Internet search results
+-- create-presentation.js      # PowerPoint generator
+-- FROG-Dealer-Intelligence-Platform.pptx  # Project presentation
```

---

## Behind the Scenes

| Task | Scale | Time |
|------|-------|------|
| Initial dealer scraping | 11 APIs/sources, ~13,000 raw records | ~3 hrs |
| Data cleaning & deduplication | 13,000 -> 12,651 unique locations | ~1 hr |
| Basic FROG website scan | 1,793 websites, 8 pages each | ~25 min |
| Deep FROG website scan | 1,793 websites, 49 pages each (~87,000 requests) | ~5 hrs |
| Official FROG locator scrape | 747 zip codes, 3,896 dealers found | ~30 min |
| AI internet search | 27+ Google/directory queries | ~20 min |
| App design & development | ArcGIS map, dashboard, filters, modals, scoring | ~4 hrs |
| **Total** | **100,000+ web pages analyzed** | **~14 hrs** |

---

**Confidential** -- This tool and its data are built for King Technology. Do not share externally.
