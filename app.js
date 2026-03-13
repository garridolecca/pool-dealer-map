require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/widgets/Search",
  "esri/widgets/Home",
  "esri/widgets/BasemapToggle",
  "esri/widgets/Expand",
], function (Map, MapView, FeatureLayer, Graphic, Point, Search, Home, BasemapToggle, Expand) {

  // ── State ────────────────────────────────────────
  var clusterEnabled = false; // OFF by default
  var heatmapEnabled = false;
  var isMobile = window.innerWidth <= 640;

  // ── Map ──────────────────────────────────────────
  var map = new Map({ basemap: "dark-gray-vector" });
  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-98.5, 39.5],
    zoom: isMobile ? 3 : 4,
    popup: { dockEnabled: true, dockOptions: { position: "bottom-center", breakpoint: { width: 640 } } },
    ui: { components: ["attribution"] },
    constraints: { minZoom: 3 },
  });

  // ── Graphics ─────────────────────────────────────
  console.log("Building", DEALER_DATABASE.length, "graphics...");
  var graphics = [];
  for (var i = 0; i < DEALER_DATABASE.length; i++) {
    var d = DEALER_DATABASE[i];
    if (!d.lat || !d.lng) continue;
    graphics.push(new Graphic({
      geometry: new Point({ longitude: d.lng, latitude: d.lat }),
      attributes: {
        ObjectID: i + 1,
        name: d.name || "",
        company: d.company || "",
        type: d.type || "",
        typeLabel: (TYPE_LABELS[d.type]) || d.type || "",
        category: d.category || "",
        address: d.address || "",
        city: d.city || "",
        state: d.state || "",
        zip: d.zip || "",
        phone: d.phone || "",
        website: d.website || "",
        products: d.products || "",
        privateLabel: d.privateLabel ? "Yes" : "No",
        notes: d.notes || "",
        fullAddress: (d.address || "") + ", " + (d.city || "") + ", " + (d.state || "") + " " + (d.zip || ""),
      },
    }));
  }
  console.log("Created", graphics.length, "graphics");

  // ── Renderer ─────────────────────────────────────
  var uniqueInfos = [];
  var companies = Object.keys(COMPANY_COLORS);
  for (var c = 0; c < companies.length; c++) {
    var co = companies[c];
    uniqueInfos.push({
      value: co,
      symbol: {
        type: "simple-marker",
        color: COMPANY_COLORS[co],
        size: co === "King Technology" ? 14 : 6,
        outline: { color: co === "King Technology" ? "#fff" : [255,255,255,0.3], width: co === "King Technology" ? 2 : 0.5 },
        style: co === "King Technology" ? "diamond" : "circle",
      },
      label: co,
    });
  }
  var companyRenderer = {
    type: "unique-value", field: "company",
    defaultSymbol: { type: "simple-marker", color: "#888", size: 5, outline: { color: [255,255,255,0.2], width: 0.5 } },
    defaultLabel: "Other", uniqueValueInfos: uniqueInfos,
  };

  // ── Popup ────────────────────────────────────────
  var popupTpl = {
    title: "{name}",
    content: [{ type: "fields", fieldInfos: [
      { fieldName: "company", label: "Company" },
      { fieldName: "typeLabel", label: "Type" },
      { fieldName: "fullAddress", label: "Address" },
      { fieldName: "phone", label: "Phone" },
      { fieldName: "website", label: "Website" },
      { fieldName: "products", label: "Products" },
      { fieldName: "privateLabel", label: "Private Label" },
      { fieldName: "notes", label: "Notes" },
    ]}],
  };

  // ── Cluster config (off by default) ──────────────
  var clusterConfig = {
    type: "cluster", clusterRadius: "80px",
    clusterMinSize: "22px", clusterMaxSize: "56px",
    popupTemplate: { title: "{cluster_count} dealers", content: "Zoom in to see individual dealers." },
    labelingInfo: [{ deconflictionStrategy: "none",
      labelExpressionInfo: { expression: "Text($feature.cluster_count, '#,###')" },
      symbol: { type: "text", color: "#fff", font: { weight: "bold", family: "Noto Sans", size: "11px" } },
      labelPlacement: "center-center",
    }],
  };

  // ── Heatmap renderer ─────────────────────────────
  var heatmapRenderer = {
    type: "heatmap",
    colorStops: [
      { color: "rgba(0,0,0,0)", ratio: 0 },
      { color: "rgba(0,100,255,0.4)", ratio: 0.1 },
      { color: "rgba(0,200,200,0.6)", ratio: 0.25 },
      { color: "rgba(100,255,100,0.7)", ratio: 0.45 },
      { color: "rgba(255,255,0,0.85)", ratio: 0.65 },
      { color: "rgba(255,100,0,0.9)", ratio: 0.8 },
      { color: "rgba(255,0,0,1)", ratio: 1 },
    ],
    minDensity: 0, maxDensity: 0.008, radius: 16,
  };

  // ── Feature Layer — NO clustering by default ─────
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
    ],
    objectIdField: "ObjectID",
    geometryType: "point",
    spatialReference: { wkid: 4326 },
    renderer: companyRenderer,
    popupTemplate: popupTpl,
    title: "Pool & Hot Tub Dealers",
    featureReduction: null, // NO CLUSTERING by default
    outFields: ["*"],
  });
  map.add(dealerLayer);
  console.log("Layer added — no clustering by default");

  // ── Widgets ──────────────────────────────────────
  view.when(function() {
    console.log("View ready");
    view.ui.add(new Home({ view: view }), "top-left");
    view.ui.add(new BasemapToggle({ view: view, nextBasemap: "satellite" }), "bottom-right");

    var searchWidget = new Search({
      view: view, includeDefaultSources: false,
      sources: [{ layer: dealerLayer, searchFields: ["name","company","city","state"],
        displayField: "name", exactMatch: false, outFields: ["*"],
        name: "Dealers", placeholder: "Search dealers..." }],
    });
    view.ui.add(new Expand({ view: view, content: searchWidget, expandIcon: "search" }), "top-right");

    buildFilterUI();
    buildLegend();
    updateDealerCount();
    updateStats();

    // Mobile panel toggle
    if (isMobile) {
      var panel = document.getElementById("filter-panel");
      if (panel) panel.classList.add("mobile-hidden");
    }
  });

  // ════════════════════════════════════════════════
  // FILTERS — all work in real-time sync with the map
  // ════════════════════════════════════════════════

  function applyFilters() {
    var searchText = (document.getElementById("search-input").value || "").toLowerCase().trim();

    // Gather checked types
    var allTypeCheckboxes = document.querySelectorAll(".type-checkbox");
    var checkedTypes = [];
    allTypeCheckboxes.forEach(function(cb) {
      if (cb.hasAttribute("checked")) checkedTypes.push(cb.getAttribute("value"));
    });

    // Gather checked companies
    var allCompanyCheckboxes = document.querySelectorAll(".company-checkbox");
    var checkedCompanies = [];
    allCompanyCheckboxes.forEach(function(cb) {
      if (cb.hasAttribute("checked")) checkedCompanies.push(cb.getAttribute("value"));
    });

    // Gather selected states
    var stateCombo = document.getElementById("state-filter");
    var selectedStates = [];
    if (stateCombo && stateCombo.selectedItems) {
      Array.from(stateCombo.selectedItems).forEach(function(item) {
        selectedStates.push(item.getAttribute("value"));
      });
    }

    // Build SQL where clause for the layer
    var clauses = [];
    var totalTypes = Object.keys(TYPE_LABELS).length;
    if (checkedTypes.length > 0 && checkedTypes.length < totalTypes) {
      clauses.push("type IN ('" + checkedTypes.join("','") + "')");
    } else if (checkedTypes.length === 0) {
      clauses.push("1=0"); // nothing checked = show nothing
    }

    var totalCompanies = Object.keys(COMPANY_COLORS).length;
    if (checkedCompanies.length > 0 && checkedCompanies.length < totalCompanies) {
      clauses.push("company IN ('" + checkedCompanies.join("','") + "')");
    } else if (checkedCompanies.length === 0) {
      clauses.push("1=0");
    }

    if (selectedStates.length > 0) {
      clauses.push("state IN ('" + selectedStates.join("','") + "')");
    }

    if (searchText) {
      var esc = searchText.replace(/'/g, "''");
      clauses.push("(LOWER(name) LIKE '%" + esc + "%' OR LOWER(company) LIKE '%" + esc + "%' OR LOWER(city) LIKE '%" + esc + "%' OR LOWER(state) LIKE '%" + esc + "%')");
    }

    // Apply to layer
    dealerLayer.definitionExpression = clauses.length > 0 ? clauses.join(" AND ") : "1=1";

    // Also filter local data for stats
    var filtered = DEALER_DATABASE.filter(function(d) {
      if (checkedTypes.length === 0) return false;
      if (checkedTypes.length < totalTypes && checkedTypes.indexOf(d.type) < 0) return false;
      if (checkedCompanies.length === 0) return false;
      if (checkedCompanies.length < totalCompanies && checkedCompanies.indexOf(d.company) < 0) return false;
      if (selectedStates.length > 0 && selectedStates.indexOf(d.state) < 0) return false;
      if (searchText) {
        if ((d.name||"").toLowerCase().indexOf(searchText) < 0 &&
            (d.company||"").toLowerCase().indexOf(searchText) < 0 &&
            (d.city||"").toLowerCase().indexOf(searchText) < 0 &&
            (d.state||"").toLowerCase().indexOf(searchText) < 0) return false;
      }
      return true;
    });

    updateDealerCount(filtered.length);
    updateStats(filtered);
  }

  // ── Build filter UI ──────────────────────────────
  function buildFilterUI() {
    // Types
    var typeContainer = document.getElementById("type-filters");
    var typeSet = {};
    DEALER_DATABASE.forEach(function(d) { typeSet[d.type] = true; });
    Object.keys(typeSet).forEach(function(t) {
      var lbl = document.createElement("label");
      var cb = document.createElement("calcite-checkbox");
      cb.setAttribute("checked", ""); cb.setAttribute("value", t); cb.setAttribute("scale", "s");
      cb.classList.add("type-checkbox");
      // Real-time filter on change
      cb.addEventListener("calciteCheckboxChange", function() { applyFilters(); });
      var dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.backgroundColor = TYPE_COLORS[t] || "#888";
      lbl.appendChild(cb); lbl.appendChild(dot);
      lbl.appendChild(document.createTextNode(" " + (TYPE_LABELS[t] || t)));
      typeContainer.appendChild(lbl);
    });

    // Companies
    var compContainer = document.getElementById("company-filters");
    var compSet = {};
    DEALER_DATABASE.forEach(function(d) { compSet[d.company] = true; });
    var compList = Object.keys(compSet).sort();
    compList.forEach(function(c) {
      var lbl = document.createElement("label");
      var cb = document.createElement("calcite-checkbox");
      cb.setAttribute("checked", ""); cb.setAttribute("value", c); cb.setAttribute("scale", "s");
      cb.classList.add("company-checkbox");
      cb.addEventListener("calciteCheckboxChange", function() { applyFilters(); });
      var dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.backgroundColor = COMPANY_COLORS[c] || "#888";
      lbl.appendChild(cb); lbl.appendChild(dot);
      lbl.appendChild(document.createTextNode(" " + c));
      compContainer.appendChild(lbl);
    });

    // States
    var stateCombo = document.getElementById("state-filter");
    var stateSet = {};
    DEALER_DATABASE.forEach(function(d) { if (d.state) stateSet[d.state] = true; });
    Object.keys(stateSet).sort().forEach(function(s) {
      var item = document.createElement("calcite-combobox-item");
      item.setAttribute("value", s); item.setAttribute("text-label", s);
      stateCombo.appendChild(item);
    });
    stateCombo.addEventListener("calciteComboboxChange", function() { applyFilters(); });

    // Search — real-time
    var searchInput = document.getElementById("search-input");
    searchInput.addEventListener("calciteInputTextInput", function() { applyFilters(); });
    searchInput.addEventListener("calciteInputTextChange", function() { applyFilters(); });

    // Clear all
    document.getElementById("btn-clear-filters").addEventListener("click", function() {
      document.querySelectorAll(".type-checkbox, .company-checkbox").forEach(function(cb) { cb.setAttribute("checked", ""); });
      searchInput.value = "";
      // Clear combobox
      if (stateCombo.selectedItems) {
        Array.from(stateCombo.selectedItems).forEach(function(i) { i.removeAttribute("selected"); });
      }
      dealerLayer.definitionExpression = "1=1";
      updateDealerCount(); updateStats();
    });
  }

  // ── Dealer count ─────────────────────────────────
  function updateDealerCount(count) {
    var chip = document.getElementById("dealer-count-chip");
    if (chip) chip.textContent = (count !== undefined ? count : graphics.length).toLocaleString() + " Dealers";
  }

  // ── Legend ────────────────────────────────────────
  function buildLegend() {
    var container = document.getElementById("legend-container");
    if (!container) return;

    var sec1 = document.createElement("div"); sec1.className = "legend-section";
    sec1.innerHTML = "<h4>By Company</h4>";
    Object.keys(COMPANY_COLORS).forEach(function(name) {
      var item = document.createElement("div"); item.className = "legend-item";
      var sym = document.createElement("div"); sym.className = "legend-symbol";
      sym.style.backgroundColor = COMPANY_COLORS[name];
      if (name === "King Technology") {
        sym.style.borderColor = "#fff"; sym.style.borderWidth = "2px";
        sym.style.borderRadius = "0"; sym.style.transform = "rotate(45deg)";
      }
      item.appendChild(sym); item.appendChild(document.createTextNode(name));
      sec1.appendChild(item);
    });
    container.appendChild(sec1);

    var sec2 = document.createElement("div"); sec2.className = "legend-section";
    sec2.innerHTML = "<h4>By Dealer Type</h4>";
    Object.keys(TYPE_COLORS).forEach(function(t) {
      var item = document.createElement("div"); item.className = "legend-item";
      var sym = document.createElement("div"); sym.className = "legend-symbol square";
      sym.style.backgroundColor = TYPE_COLORS[t];
      item.appendChild(sym); item.appendChild(document.createTextNode(TYPE_LABELS[t] || t));
      sec2.appendChild(item);
    });
    container.appendChild(sec2);
  }

  // ── Stats ────────────────────────────────────────
  function updateStats(data) {
    data = data || DEALER_DATABASE;
    var total = data.length;

    function renderBars(containerId, counts, colorMap) {
      var el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = "";
      var sorted = Object.entries(counts).sort(function(a,b) { return b[1]-a[1]; });
      var max = sorted.length > 0 ? sorted[0][1] : 1;
      sorted.forEach(function(entry) {
        var k = entry[0], v = entry[1];
        var color = colorMap ? (colorMap[k] || "#0079c1") : "#0079c1";
        el.innerHTML += '<div class="stat-row"><span class="stat-label"><span class="color-dot" style="background:'+color+'"></span> '+ k +'</span><div class="stat-bar-container"><div class="stat-bar" style="width:'+(v/max*100)+'%;background:'+color+'"></div></div><span class="stat-value">'+v+'</span></div>';
      });
    }

    var typeCounts = {}; data.forEach(function(d) { typeCounts[TYPE_LABELS[d.type]||d.type] = (typeCounts[TYPE_LABELS[d.type]||d.type]||0)+1; });
    renderBars("stats-type", typeCounts, null);

    var compCounts = {}; data.forEach(function(d) { compCounts[d.company] = (compCounts[d.company]||0)+1; });
    renderBars("stats-company", compCounts, COMPANY_COLORS);

    var stateCounts = {}; data.forEach(function(d) { if(d.state) stateCounts[d.state] = (stateCounts[d.state]||0)+1; });
    var topStates = {}; Object.entries(stateCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,15).forEach(function(e){topStates[e[0]]=e[1];});
    renderBars("stats-states", topStates, null);

    var sum = document.getElementById("stats-summary");
    if (sum) {
      var pl = data.filter(function(d){return d.privateLabel;}).length;
      var ht = data.filter(function(d){return d.category==="hot-tub";}).length;
      var ch = data.filter(function(d){return d.products&&d.products.toLowerCase().indexOf("chemical")>=0;}).length;
      sum.innerHTML =
        '<div class="stat-row"><span class="stat-label">Total Dealers</span><span class="stat-value">'+total.toLocaleString()+'</span></div>'+
        '<div class="stat-row"><span class="stat-label">States</span><span class="stat-value">'+Object.keys(stateCounts).length+'</span></div>'+
        '<div class="stat-row"><span class="stat-label">Sell Chemicals</span><span class="stat-value">'+ch.toLocaleString()+'</span></div>'+
        '<div class="stat-row"><span class="stat-label">Hot Tub Dealers</span><span class="stat-value">'+ht.toLocaleString()+'</span></div>'+
        '<div class="stat-row"><span class="stat-label">Private Label</span><span class="stat-value">'+pl.toLocaleString()+'</span></div>'+
        '<div class="stat-row"><span class="stat-label">Companies</span><span class="stat-value">'+Object.keys(compCounts).length+'</span></div>';
    }
  }

  // ── Header buttons ───────────────────────────────
  document.getElementById("btn-zoom-all").addEventListener("click", function() {
    view.goTo({ center: [-98.5, 39.5], zoom: isMobile ? 3 : 4 });
  });

  document.getElementById("btn-toggle-cluster").addEventListener("click", function() {
    if (heatmapEnabled) return;
    clusterEnabled = !clusterEnabled;
    dealerLayer.featureReduction = clusterEnabled ? clusterConfig : null;
    this.setAttribute("active", clusterEnabled ? "" : null);
    if (!clusterEnabled) this.removeAttribute("active");
  });

  document.getElementById("btn-toggle-heat").addEventListener("click", function() {
    heatmapEnabled = !heatmapEnabled;
    if (heatmapEnabled) {
      dealerLayer.renderer = heatmapRenderer;
      dealerLayer.featureReduction = null;
      clusterEnabled = false;
      document.getElementById("btn-toggle-cluster").removeAttribute("active");
    } else {
      dealerLayer.renderer = companyRenderer;
      if (clusterEnabled) dealerLayer.featureReduction = clusterConfig;
    }
  });

  // ── Action bar panel switching ───────────────────
  var actionBar = document.querySelector("calcite-action-bar");
  var panels = document.querySelectorAll("#filter-panel calcite-panel");
  if (actionBar) {
    actionBar.addEventListener("click", function(e) {
      var action = e.target.closest("calcite-action");
      if (!action || !action.getAttribute("data-action-id")) return;
      var id = action.getAttribute("data-action-id");
      actionBar.querySelectorAll("calcite-action").forEach(function(a) { a.removeAttribute("active"); });
      action.setAttribute("active", "");
      panels.forEach(function(p) {
        p.getAttribute("data-panel-id") === id ? p.removeAttribute("hidden") : p.setAttribute("hidden", "");
      });
    });
  }

  // ── Detail panel ─────────────────────────────────
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
      if (db) db.innerHTML =
        '<div class="detail-section"><h4 style="color:'+color+'">Company</h4>'+
        '<div class="detail-field"><span class="label">Name</span><span class="value">'+a.name+'</span></div>'+
        '<div class="detail-field"><span class="label">Company</span><span class="value" style="color:'+color+'">'+a.company+'</span></div>'+
        '<div class="detail-field"><span class="label">Type</span><span class="value">'+a.typeLabel+'</span></div></div>'+
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

  // ── Mobile filter toggle ─────────────────────────
  var mobileToggle = document.getElementById("mobile-filter-toggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", function() {
      var panel = document.getElementById("filter-panel");
      if (panel) panel.classList.toggle("mobile-hidden");
    });
  }

});
