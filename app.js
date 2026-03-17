require([
  "esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer",
  "esri/Graphic", "esri/geometry/Point",
  "esri/widgets/Search", "esri/widgets/Home", "esri/widgets/BasemapToggle", "esri/widgets/Expand",
], function (Map, MapView, FeatureLayer, Graphic, Point, Search, Home, BasemapToggle, Expand) {

  // ═══════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════
  var clusterEnabled = false;
  var heatmapEnabled = false;
  var frogFilterEnabled = false;
  var isMobile = window.innerWidth <= 640;

  // Active filters — each category allows one selection at a time (click to toggle)
  var activeFilters = {
    type: null,           // e.g. "wholesale"
    company: null,        // e.g. "PoolCorp"
    state: null,          // e.g. "FL"
    channel: null,        // e.g. "distribution"
    frogConfidence: null, // e.g. "high"
  };

  // ═══════════════════════════════════════════════════
  // MAP
  // ═══════════════════════════════════════════════════
  var map = new Map({ basemap: "dark-gray-vector" });
  var view = new MapView({
    container: "viewDiv", map: map,
    center: [-98.5, 39.5], zoom: isMobile ? 3 : 4,
    popup: { autoOpenEnabled: false }, // DISABLED — use right panel instead
    ui: { components: ["attribution"] },
    constraints: { minZoom: 3 },
  });

  // ═══════════════════════════════════════════════════
  // GRAPHICS
  // ═══════════════════════════════════════════════════
  console.log("Building", DEALER_DATABASE.length, "graphics...");
  var graphics = [];
  for (var i = 0; i < DEALER_DATABASE.length; i++) {
    var d = DEALER_DATABASE[i];
    if (!d.lat || !d.lng) continue;
    graphics.push(new Graphic({
      geometry: new Point({ longitude: d.lng, latitude: d.lat }),
      attributes: {
        ObjectID: i + 1, name: d.name || "", company: d.company || "",
        type: d.type || "", typeLabel: (TYPE_LABELS[d.type]) || d.type || "",
        category: d.category || "", address: d.address || "",
        city: d.city || "", state: d.state || "", zip: d.zip || "",
        phone: d.phone || "", website: d.website || "",
        products: d.products || "", privateLabel: d.privateLabel ? "Yes" : "No",
        notes: d.notes || "",
        fullAddress: (d.address || "") + ", " + (d.city || "") + ", " + (d.state || "") + " " + (d.zip || ""),
        frogProducts: d.frogProducts || "",
        frogScore: d.frogScore || 0,
        frogConfidence: d.frogConfidence || "none",
        frogLines: d.frogLines || "",
        channel: d.channel || "independent",
        channelLabel: (typeof CHANNEL_LABELS !== 'undefined' && CHANNEL_LABELS[d.channel]) || d.channel || "",
        frogOfficial: d.frogOfficial ? "Yes" : "No",
      },
    }));
  }
  console.log("Created", graphics.length, "graphics");

  // ═══════════════════════════════════════════════════
  // RENDERER
  // ═══════════════════════════════════════════════════
  var uniqueInfos = [];
  Object.keys(COMPANY_COLORS).forEach(function(co) {
    uniqueInfos.push({
      value: co,
      symbol: {
        type: "simple-marker", color: COMPANY_COLORS[co],
        size: co === "King Technology" ? 14 : 6,
        outline: { color: co === "King Technology" ? "#fff" : [255,255,255,0.3], width: co === "King Technology" ? 2 : 0.5 },
        style: co === "King Technology" ? "diamond" : "circle",
      }, label: co,
    });
  });
  var companyRenderer = {
    type: "unique-value", field: "company",
    defaultSymbol: { type: "simple-marker", color: "#888", size: 5, outline: { color: [255,255,255,0.2], width: 0.5 } },
    defaultLabel: "Other", uniqueValueInfos: uniqueInfos,
  };

  // FROG-focused renderer — highlights dealers by Frog confidence
  var frogRendererInfos = [
    { value: "high", symbol: { type: "simple-marker", color: "#00ff88", size: 12, outline: { color: "#fff", width: 2 }, style: "diamond" }, label: "FROG High" },
    { value: "medium", symbol: { type: "simple-marker", color: "#f1c40f", size: 10, outline: { color: "#fff", width: 1.5 }, style: "diamond" }, label: "FROG Medium" },
    { value: "low", symbol: { type: "simple-marker", color: "#ff9800", size: 8, outline: { color: "#fff", width: 1 }, style: "circle" }, label: "FROG Low" },
  ];
  var frogRenderer = {
    type: "unique-value", field: "frogConfidence",
    defaultSymbol: { type: "simple-marker", color: [100,100,100,0.3], size: 3, outline: { color: [255,255,255,0.1], width: 0 } },
    defaultLabel: "No FROG", uniqueValueInfos: frogRendererInfos,
  };

  var clusterConfig = {
    type: "cluster", clusterRadius: "80px", clusterMinSize: "22px", clusterMaxSize: "56px",
    popupTemplate: { title: "{cluster_count} dealers", content: "Zoom in to see individual dealers." },
    labelingInfo: [{ deconflictionStrategy: "none",
      labelExpressionInfo: { expression: "Text($feature.cluster_count, '#,###')" },
      symbol: { type: "text", color: "#fff", font: { weight: "bold", family: "Noto Sans", size: "11px" } },
      labelPlacement: "center-center" }],
  };

  var heatmapRenderer = {
    type: "heatmap",
    colorStops: [
      { color: "rgba(0,0,0,0)", ratio: 0 }, { color: "rgba(0,100,255,0.4)", ratio: 0.1 },
      { color: "rgba(0,200,200,0.6)", ratio: 0.25 }, { color: "rgba(100,255,100,0.7)", ratio: 0.45 },
      { color: "rgba(255,255,0,0.85)", ratio: 0.65 }, { color: "rgba(255,100,0,0.9)", ratio: 0.8 },
      { color: "rgba(255,0,0,1)", ratio: 1 },
    ],
    minDensity: 0, maxDensity: 0.008, radius: 16,
  };

  // ═══════════════════════════════════════════════════
  // LAYER — no clustering, no popup
  // ═══════════════════════════════════════════════════
  var dealerLayer = new FeatureLayer({
    source: graphics,
    fields: [
      { name: "ObjectID", type: "oid" },
      { name: "name", type: "string" }, { name: "company", type: "string" },
      { name: "type", type: "string" }, { name: "typeLabel", type: "string" },
      { name: "category", type: "string" }, { name: "address", type: "string" },
      { name: "city", type: "string" }, { name: "state", type: "string" },
      { name: "zip", type: "string" }, { name: "phone", type: "string" },
      { name: "website", type: "string" }, { name: "products", type: "string" },
      { name: "privateLabel", type: "string" }, { name: "notes", type: "string" },
      { name: "fullAddress", type: "string" },
      { name: "frogProducts", type: "string" },
      { name: "frogScore", type: "integer" },
      { name: "frogConfidence", type: "string" },
      { name: "frogLines", type: "string" },
      { name: "channel", type: "string" },
      { name: "channelLabel", type: "string" },
      { name: "frogOfficial", type: "string" },
    ],
    objectIdField: "ObjectID", geometryType: "point",
    spatialReference: { wkid: 4326 },
    renderer: companyRenderer, popupEnabled: false,
    title: "Dealers", featureReduction: null, outFields: ["*"],
  });
  map.add(dealerLayer);

  // ═══════════════════════════════════════════════════
  // WIDGETS
  // ═══════════════════════════════════════════════════
  view.when(function() {
    console.log("View ready");
    view.ui.add(new Home({ view: view }), "top-left");
    view.ui.add(new BasemapToggle({ view: view, nextBasemap: "satellite" }), "bottom-right");
    var sw = new Search({
      view: view, includeDefaultSources: false,
      sources: [{ layer: dealerLayer, searchFields: ["name","company","city","state"],
        displayField: "name", exactMatch: false, outFields: ["*"],
        name: "Dealers", placeholder: "Search dealers..." }],
    });
    view.ui.add(new Expand({ view: view, content: sw, expandIcon: "search" }), "top-right");

    renderAllStats();
    updateDealerCount();

    if (isMobile) {
      var panel = document.getElementById("stats-panel");
      if (panel) panel.classList.add("mobile-hidden");
    }
  });

  // ═══════════════════════════════════════════════════
  // CLICK MAP → SHOW RIGHT PANEL (no popup)
  // ═══════════════════════════════════════════════════
  view.on("click", function(event) {
    view.hitTest(event).then(function(response) {
      var r = response.results.find(function(x) { return x.graphic && x.graphic.layer === dealerLayer; });
      if (!r || !r.graphic.attributes || !r.graphic.attributes.name) return;
      var a = r.graphic.attributes;
      var dp = document.getElementById("detail-panel");
      var db = document.getElementById("dealer-detail-body");
      if (dp) dp.removeAttribute("collapsed");
      var color = COMPANY_COLORS[a.company] || "#888";
      var threat = a.privateLabel === "Yes";
      var hasFrog = a.frogScore > 0;
      var isOfficial = a.frogOfficial === "Yes";
      var frogColor = (typeof FROG_CONFIDENCE_COLORS !== 'undefined' && FROG_CONFIDENCE_COLORS[a.frogConfidence]) || "#555";
      var channelColor = (typeof CHANNEL_COLORS !== 'undefined' && CHANNEL_COLORS[a.channel]) || "#888";

      // Build FROG section
      var frogSection = '';
      var officialBadge = isOfficial ? '<div class="detail-field"><span class="label">Official Status</span><span class="value" style="color:#00ff88;font-weight:700">AUTHORIZED FROG DEALER</span></div>' : '';
      if (hasFrog) {
        frogSection =
          '<div class="detail-section"><h4 style="color:#00ff88">FROG Products</h4>'+
          officialBadge+
          '<div class="detail-field"><span class="label">Products</span><span class="value" style="color:#00ff88">'+a.frogProducts+'</span></div>'+
          '<div class="detail-field"><span class="label">Product Lines</span><span class="value">'+a.frogLines+'</span></div>'+
          '<div class="detail-field"><span class="label">Score</span><span class="value" style="color:'+frogColor+';font-weight:700">'+a.frogScore+' products</span></div>'+
          '<div class="detail-field"><span class="label">Confidence</span><span class="value" style="color:'+frogColor+';font-weight:700;text-transform:uppercase">'+a.frogConfidence+'</span></div>'+
          '</div>';
      } else {
        frogSection =
          '<div class="detail-section"><h4>FROG Status</h4>'+
          '<div class="detail-field"><span class="label">FROG Products</span><span class="value" style="color:#555">Not detected</span></div>'+
          '</div>';
      }

      if (db) db.innerHTML =
        '<div class="detail-section"><h4 style="color:'+color+'">Company</h4>'+
        '<div class="detail-field"><span class="label">Name</span><span class="value">'+a.name+'</span></div>'+
        '<div class="detail-field"><span class="label">Company</span><span class="value" style="color:'+color+'">'+a.company+'</span></div>'+
        '<div class="detail-field"><span class="label">Type</span><span class="value">'+a.typeLabel+'</span></div>'+
        '<div class="detail-field"><span class="label">Channel</span><span class="value" style="color:'+channelColor+'">'+a.channelLabel+'</span></div></div>'+
        frogSection+
        '<div class="detail-section"><h4>Location</h4>'+
        '<div class="detail-field"><span class="label">Address</span><span class="value">'+a.fullAddress+'</span></div>'+
        '<div class="detail-field"><span class="label">Phone</span><span class="value">'+(a.phone||"N/A")+'</span></div>'+
        '<div class="detail-field"><span class="label">Website</span><span class="value"><a href="https://'+a.website+'" target="_blank" style="color:var(--calcite-color-brand)">'+a.website+'</a></span></div></div>'+
        '<div class="detail-section"><h4>Intelligence</h4>'+
        '<div class="detail-field"><span class="label">Products</span><span class="value">'+a.products+'</span></div>'+
        '<div class="detail-field"><span class="label">Private Label</span><span class="value" style="color:'+(threat?"#e74c3c":"#2ecc71")+'">'+a.privateLabel+'</span></div>'+
        '<div class="detail-field"><span class="label">Threat</span><span class="value" style="color:'+(threat?"#e74c3c":"#2ecc71")+';font-weight:700">'+(threat?"COMPETITOR":"Potential Partner")+'</span></div></div>'+
        (a.notes?'<div class="detail-section"><h4>Notes</h4><calcite-notice open kind="'+(threat?"danger":"brand")+'" scale="s"><div slot="message">'+a.notes+'</div></calcite-notice></div>':'');
    });
  });

  document.getElementById("btn-close-detail").addEventListener("click", function() {
    document.getElementById("detail-panel").setAttribute("collapsed", "");
  });

  // ═══════════════════════════════════════════════════
  // FILTERING ENGINE
  // ═══════════════════════════════════════════════════
  function applyFilters() {
    var searchText = (document.getElementById("search-input").value || "").toLowerCase().trim();
    var clauses = [];

    if (activeFilters.type) clauses.push("type = '" + activeFilters.type + "'");
    if (activeFilters.company) clauses.push("company = '" + activeFilters.company.replace(/'/g,"''") + "'");
    if (activeFilters.state) clauses.push("state = '" + activeFilters.state + "'");
    if (activeFilters.channel) clauses.push("channel = '" + activeFilters.channel + "'");
    if (activeFilters.frogConfidence) clauses.push("frogConfidence = '" + activeFilters.frogConfidence + "'");
    if (frogFilterEnabled) clauses.push("frogScore > 0");
    if (searchText) {
      var esc = searchText.replace(/'/g, "''");
      clauses.push("(LOWER(name) LIKE '%" + esc + "%' OR LOWER(company) LIKE '%" + esc + "%' OR LOWER(city) LIKE '%" + esc + "%' OR LOWER(state) LIKE '%" + esc + "%')");
    }

    dealerLayer.definitionExpression = clauses.length > 0 ? clauses.join(" AND ") : "1=1";

    // Update count
    var filtered = getFilteredData(searchText);
    updateDealerCount(filtered.length);
    renderAllStats(filtered);
    renderActiveFilters();
  }

  function getFilteredData(searchText) {
    if (searchText === undefined) searchText = (document.getElementById("search-input").value || "").toLowerCase().trim();
    return DEALER_DATABASE.filter(function(d) {
      if (activeFilters.type && d.type !== activeFilters.type) return false;
      if (activeFilters.company && d.company !== activeFilters.company) return false;
      if (activeFilters.state && d.state !== activeFilters.state) return false;
      if (activeFilters.channel && d.channel !== activeFilters.channel) return false;
      if (activeFilters.frogConfidence && d.frogConfidence !== activeFilters.frogConfidence) return false;
      if (frogFilterEnabled && (!d.frogScore || d.frogScore === 0)) return false;
      if (searchText) {
        if ((d.name||"").toLowerCase().indexOf(searchText) < 0 &&
            (d.company||"").toLowerCase().indexOf(searchText) < 0 &&
            (d.city||"").toLowerCase().indexOf(searchText) < 0 &&
            (d.state||"").toLowerCase().indexOf(searchText) < 0) return false;
      }
      return true;
    });
  }

  // Toggle a filter — click once to activate, click again to deactivate
  function toggleFilter(category, value) {
    if (activeFilters[category] === value) {
      activeFilters[category] = null; // deactivate
    } else {
      activeFilters[category] = value; // activate
    }
    applyFilters();
  }

  // ═══════════════════════════════════════════════════
  // ACTIVE FILTER CHIPS
  // ═══════════════════════════════════════════════════
  function renderActiveFilters() {
    var container = document.getElementById("active-filters");
    var chips = document.getElementById("active-filter-chips");
    var hasAny = activeFilters.type || activeFilters.company || activeFilters.state || activeFilters.channel || activeFilters.frogConfidence || frogFilterEnabled;

    container.style.display = hasAny ? "block" : "none";
    chips.innerHTML = "";

    if (frogFilterEnabled) {
      var chipF = document.createElement("calcite-chip");
      chipF.setAttribute("scale", "s"); chipF.setAttribute("kind", "brand"); chipF.setAttribute("closable", "");
      chipF.textContent = "FROG Dealers Only";
      chipF.addEventListener("calciteChipClose", function() {
        frogFilterEnabled = false;
        document.getElementById("btn-toggle-frog").removeAttribute("active");
        dealerLayer.renderer = companyRenderer;
        applyFilters();
      });
      chips.appendChild(chipF);
    }
    if (activeFilters.frogConfidence) {
      var chipFC = document.createElement("calcite-chip");
      chipFC.setAttribute("scale", "s"); chipFC.setAttribute("kind", "brand"); chipFC.setAttribute("closable", "");
      chipFC.textContent = "FROG: " + activeFilters.frogConfidence.charAt(0).toUpperCase() + activeFilters.frogConfidence.slice(1);
      chipFC.addEventListener("calciteChipClose", function() { activeFilters.frogConfidence = null; applyFilters(); });
      chips.appendChild(chipFC);
    }
    if (activeFilters.channel) {
      var chipCh = document.createElement("calcite-chip");
      chipCh.setAttribute("scale", "s"); chipCh.setAttribute("kind", "brand"); chipCh.setAttribute("closable", "");
      var chLabel = (typeof CHANNEL_LABELS !== 'undefined' && CHANNEL_LABELS[activeFilters.channel]) || activeFilters.channel;
      chipCh.textContent = "Channel: " + chLabel;
      chipCh.addEventListener("calciteChipClose", function() { activeFilters.channel = null; applyFilters(); });
      chips.appendChild(chipCh);
    }
    if (activeFilters.type) {
      var chip = document.createElement("calcite-chip");
      chip.setAttribute("scale", "s"); chip.setAttribute("kind", "brand"); chip.setAttribute("closable", "");
      chip.textContent = "Type: " + (TYPE_LABELS[activeFilters.type] || activeFilters.type);
      chip.addEventListener("calciteChipClose", function() { activeFilters.type = null; applyFilters(); });
      chips.appendChild(chip);
    }
    if (activeFilters.company) {
      var chip2 = document.createElement("calcite-chip");
      chip2.setAttribute("scale", "s"); chip2.setAttribute("kind", "brand"); chip2.setAttribute("closable", "");
      chip2.textContent = "Company: " + activeFilters.company;
      chip2.addEventListener("calciteChipClose", function() { activeFilters.company = null; applyFilters(); });
      chips.appendChild(chip2);
    }
    if (activeFilters.state) {
      var chip3 = document.createElement("calcite-chip");
      chip3.setAttribute("scale", "s"); chip3.setAttribute("kind", "brand"); chip3.setAttribute("closable", "");
      chip3.textContent = "State: " + activeFilters.state;
      chip3.addEventListener("calciteChipClose", function() { activeFilters.state = null; applyFilters(); });
      chips.appendChild(chip3);
    }
  }

  document.getElementById("btn-clear-all").addEventListener("click", function() {
    activeFilters.type = null; activeFilters.company = null; activeFilters.state = null;
    activeFilters.channel = null; activeFilters.frogConfidence = null;
    frogFilterEnabled = false;
    document.getElementById("btn-toggle-frog").removeAttribute("active");
    document.getElementById("search-input").value = "";
    dealerLayer.renderer = companyRenderer;
    applyFilters();
  });

  // ═══════════════════════════════════════════════════
  // RENDER STATS — clickable rows that act as filters
  // ═══════════════════════════════════════════════════
  function renderAllStats(data) {
    data = data || DEALER_DATABASE;
    var total = data.length;

    // ── FROG Coverage Summary ──
    var frogSumEl = document.getElementById("stats-frog-summary");
    if (frogSumEl) {
      var frogDealers = data.filter(function(d) { return d.frogScore > 0; });
      var frogHigh = data.filter(function(d) { return d.frogConfidence === 'high'; }).length;
      var frogMed = data.filter(function(d) { return d.frogConfidence === 'medium'; }).length;
      var frogLow = data.filter(function(d) { return d.frogConfidence === 'low'; }).length;
      var frogHotTub = data.filter(function(d) { return d.frogLines && d.frogLines.indexOf('hot-tub') >= 0; }).length;
      var frogPool = data.filter(function(d) { return d.frogLines && d.frogLines.indexOf('pool') >= 0; }).length;
      var frogOfficial = data.filter(function(d) { return d.frogOfficial; }).length;
      var pct = total > 0 ? ((frogDealers.length / total) * 100).toFixed(1) : '0';

      frogSumEl.innerHTML =
        '<div class="stat-row frog-highlight" style="cursor:default"><span class="stat-label" style="color:#00ff88;font-weight:700">FROG Dealers</span><span class="stat-value" style="color:#00ff88;font-size:14px">'+frogDealers.length.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Coverage Rate</span><span class="stat-value">'+pct+'%</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label" style="color:#00ff88">Official Authorized</span><span class="stat-value" style="color:#00ff88">'+frogOfficial.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label"><span class="color-dot" style="background:#00ff88"></span> High Confidence</span><span class="stat-value">'+frogHigh.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label"><span class="color-dot" style="background:#f1c40f"></span> Medium</span><span class="stat-value">'+frogMed.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label"><span class="color-dot" style="background:#ff9800"></span> Low</span><span class="stat-value">'+frogLow.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Hot Tub Line</span><span class="stat-value">'+frogHotTub.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Pool Line</span><span class="stat-value">'+frogPool.toLocaleString()+'</span></div>';

      // Update frog count chip
      var frogChip = document.getElementById("frog-count-chip");
      if (frogChip) {
        frogChip.textContent = frogDealers.length.toLocaleString() + " FROG";
        frogChip.style.display = "inline-flex";
      }
    }

    // ── By FROG Confidence (clickable) ──
    var frogConfEl = document.getElementById("stats-frog-confidence");
    if (frogConfEl) {
      var confCounts = {};
      data.forEach(function(d) {
        var conf = d.frogConfidence || 'none';
        confCounts[conf] = (confCounts[conf] || 0) + 1;
      });
      frogConfEl.innerHTML = "";
      var confOrder = ['high', 'medium', 'low', 'none'];
      var confLabels = { high: 'High (3+ products)', medium: 'Medium (1-2 products)', low: 'Low (general mention)', none: 'Not Detected' };
      var confColors = (typeof FROG_CONFIDENCE_COLORS !== 'undefined') ? FROG_CONFIDENCE_COLORS : { high: '#00ff88', medium: '#f1c40f', low: '#ff9800', none: '#555' };
      var confMax = 1;
      confOrder.forEach(function(c) { if ((confCounts[c] || 0) > confMax) confMax = confCounts[c]; });
      confOrder.forEach(function(conf) {
        var count = confCounts[conf] || 0;
        if (count === 0) return;
        var color = confColors[conf] || '#555';
        var isActive = activeFilters.frogConfidence === conf;
        var row = document.createElement("div");
        row.className = "stat-row" + (isActive ? " active" : "");
        row.innerHTML =
          '<span class="stat-label"><span class="color-dot" style="background:'+color+'"></span> '+confLabels[conf]+'</span>'+
          '<div class="stat-bar-container"><div class="stat-bar" style="width:'+(count/confMax*100)+'%;background:'+color+'"></div></div>'+
          '<span class="stat-value">'+count.toLocaleString()+'</span>';
        row.addEventListener("click", function() { toggleFilter("frogConfidence", conf); });
        frogConfEl.appendChild(row);
      });
    }

    // ── By Channel ──
    var chanCounts = {};
    data.forEach(function(d) { var ch = d.channel || 'independent'; chanCounts[ch] = (chanCounts[ch] || 0) + 1; });
    var chanEl = document.getElementById("stats-channel");
    if (chanEl) {
      chanEl.innerHTML = "";
      var chanSorted = Object.entries(chanCounts).sort(function(a,b){return b[1]-a[1];});
      var chanMax = chanSorted.length > 0 ? chanSorted[0][1] : 1;
      var chanColors = (typeof CHANNEL_COLORS !== 'undefined') ? CHANNEL_COLORS : {};
      var chanLabels = (typeof CHANNEL_LABELS !== 'undefined') ? CHANNEL_LABELS : {};
      chanSorted.forEach(function(entry) {
        var ch = entry[0], count = entry[1];
        var color = chanColors[ch] || "#0079c1";
        var label = chanLabels[ch] || ch;
        var isActive = activeFilters.channel === ch;
        var row = document.createElement("div");
        row.className = "stat-row" + (isActive ? " active" : "");
        row.innerHTML =
          '<span class="stat-label"><span class="color-dot" style="background:'+color+'"></span> '+label+'</span>'+
          '<div class="stat-bar-container"><div class="stat-bar" style="width:'+(count/chanMax*100)+'%;background:'+color+'"></div></div>'+
          '<span class="stat-value">'+count.toLocaleString()+'</span>';
        row.addEventListener("click", function() { toggleFilter("channel", ch); });
        chanEl.appendChild(row);
      });
    }

    // ── By Dealer Type ──
    var typeCounts = {};
    data.forEach(function(d) { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1; });
    var typeEl = document.getElementById("stats-type");
    typeEl.innerHTML = "";
    var typeSorted = Object.entries(typeCounts).sort(function(a,b){return b[1]-a[1];});
    var typeMax = typeSorted.length > 0 ? typeSorted[0][1] : 1;
    typeSorted.forEach(function(entry) {
      var type = entry[0], count = entry[1];
      var color = TYPE_COLORS[type] || "#0079c1";
      var label = TYPE_LABELS[type] || type;
      var isActive = activeFilters.type === type;
      var row = document.createElement("div");
      row.className = "stat-row" + (isActive ? " active" : "");
      row.innerHTML =
        '<span class="stat-label"><span class="color-dot" style="background:'+color+'"></span> '+label+'</span>'+
        '<div class="stat-bar-container"><div class="stat-bar" style="width:'+(count/typeMax*100)+'%;background:'+color+'"></div></div>'+
        '<span class="stat-value">'+count.toLocaleString()+'</span>';
      row.addEventListener("click", function() { toggleFilter("type", type); });
      typeEl.appendChild(row);
    });

    // ── By Company ──
    var compCounts = {};
    data.forEach(function(d) { compCounts[d.company] = (compCounts[d.company] || 0) + 1; });
    var compEl = document.getElementById("stats-company");
    compEl.innerHTML = "";
    var compSorted = Object.entries(compCounts).sort(function(a,b){return b[1]-a[1];});
    var compMax = compSorted.length > 0 ? compSorted[0][1] : 1;
    compSorted.forEach(function(entry) {
      var company = entry[0], count = entry[1];
      var color = COMPANY_COLORS[company] || "#0079c1";
      var isActive = activeFilters.company === company;
      var row = document.createElement("div");
      row.className = "stat-row" + (isActive ? " active" : "");
      row.innerHTML =
        '<span class="stat-label"><span class="color-dot" style="background:'+color+'"></span> '+company+'</span>'+
        '<div class="stat-bar-container"><div class="stat-bar" style="width:'+(count/compMax*100)+'%;background:'+color+'"></div></div>'+
        '<span class="stat-value">'+count.toLocaleString()+'</span>';
      row.addEventListener("click", function() { toggleFilter("company", company); });
      compEl.appendChild(row);
    });

    // ── By State ──
    var stateCounts = {};
    data.forEach(function(d) { if (d.state) stateCounts[d.state] = (stateCounts[d.state] || 0) + 1; });
    var stateEl = document.getElementById("stats-states");
    stateEl.innerHTML = "";
    var stateSorted = Object.entries(stateCounts).sort(function(a,b){return b[1]-a[1];});
    var stateMax = stateSorted.length > 0 ? stateSorted[0][1] : 1;
    stateSorted.forEach(function(entry) {
      var state = entry[0], count = entry[1];
      var isActive = activeFilters.state === state;
      var row = document.createElement("div");
      row.className = "stat-row" + (isActive ? " active" : "");
      row.innerHTML =
        '<span class="stat-label">'+state+'</span>'+
        '<div class="stat-bar-container"><div class="stat-bar" style="width:'+(count/stateMax*100)+'%"></div></div>'+
        '<span class="stat-value">'+count.toLocaleString()+'</span>';
      row.addEventListener("click", function() { toggleFilter("state", state); });
      stateEl.appendChild(row);
    });

    // ── Summary ──
    var sumEl = document.getElementById("stats-summary");
    if (sumEl) {
      var pl = data.filter(function(d){return d.privateLabel;}).length;
      var ht = data.filter(function(d){return d.category==="hot-tub";}).length;
      var ch = data.filter(function(d){return d.products&&d.products.toLowerCase().indexOf("chemical")>=0;}).length;
      var frogTotal = data.filter(function(d){return d.frogScore > 0;}).length;
      sumEl.innerHTML =
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Total Dealers</span><span class="stat-value">'+total.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">States</span><span class="stat-value">'+Object.keys(stateCounts).length+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">FROG Dealers</span><span class="stat-value" style="color:#00ff88">'+frogTotal.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Sell Chemicals</span><span class="stat-value">'+ch.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Hot Tub Dealers</span><span class="stat-value">'+ht.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Private Label</span><span class="stat-value">'+pl.toLocaleString()+'</span></div>'+
        '<div class="stat-row" style="cursor:default"><span class="stat-label">Companies</span><span class="stat-value">'+Object.keys(compCounts).length+'</span></div>';
    }
  }

  // ═══════════════════════════════════════════════════
  // DEALER COUNT
  // ═══════════════════════════════════════════════════
  function updateDealerCount(count) {
    var chip = document.getElementById("dealer-count-chip");
    if (chip) chip.textContent = (count !== undefined ? count : graphics.length).toLocaleString() + " Dealers";
  }

  // ═══════════════════════════════════════════════════
  // SEARCH — real-time
  // ═══════════════════════════════════════════════════
  var searchInput = document.getElementById("search-input");
  searchInput.addEventListener("calciteInputTextInput", function() { applyFilters(); });
  searchInput.addEventListener("calciteInputTextChange", function() { applyFilters(); });

  // ═══════════════════════════════════════════════════
  // HEADER BUTTONS
  // ═══════════════════════════════════════════════════
  document.getElementById("btn-zoom-all").addEventListener("click", function() {
    view.goTo({ center: [-98.5, 39.5], zoom: isMobile ? 3 : 4 });
  });

  document.getElementById("btn-toggle-cluster").addEventListener("click", function() {
    if (heatmapEnabled) return;
    clusterEnabled = !clusterEnabled;
    dealerLayer.featureReduction = clusterEnabled ? clusterConfig : null;
    if (clusterEnabled) this.setAttribute("active",""); else this.removeAttribute("active");
  });

  document.getElementById("btn-toggle-heat").addEventListener("click", function() {
    heatmapEnabled = !heatmapEnabled;
    if (heatmapEnabled) {
      dealerLayer.renderer = heatmapRenderer; dealerLayer.featureReduction = null;
      clusterEnabled = false; document.getElementById("btn-toggle-cluster").removeAttribute("active");
    } else {
      dealerLayer.renderer = frogFilterEnabled ? frogRenderer : companyRenderer;
      if (clusterEnabled) dealerLayer.featureReduction = clusterConfig;
    }
  });

  // FROG filter toggle
  document.getElementById("btn-toggle-frog").addEventListener("click", function() {
    frogFilterEnabled = !frogFilterEnabled;
    if (frogFilterEnabled) {
      this.setAttribute("active", "");
      if (!heatmapEnabled) dealerLayer.renderer = frogRenderer;
    } else {
      this.removeAttribute("active");
      if (!heatmapEnabled) dealerLayer.renderer = companyRenderer;
    }
    applyFilters();
  });

  // ═══════════════════════════════════════════════════
  // WELCOME MODAL
  // ═══════════════════════════════════════════════════
  var welcomeModal = document.getElementById("welcome-modal");
  var btnCloseWelcome = document.getElementById("btn-close-welcome");
  if (btnCloseWelcome) {
    btnCloseWelcome.addEventListener("click", function() {
      if (welcomeModal) welcomeModal.removeAttribute("open");
    });
  }
  if (welcomeModal) {
    welcomeModal.addEventListener("calciteModalClose", function() {
      welcomeModal.removeAttribute("open");
    });
  }

  // ═══════════════════════════════════════════════════
  // MOBILE
  // ═══════════════════════════════════════════════════
  var mobileToggle = document.getElementById("mobile-panel-toggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", function() {
      var panel = document.getElementById("stats-panel");
      if (panel) panel.classList.toggle("mobile-hidden");
    });
  }

});
