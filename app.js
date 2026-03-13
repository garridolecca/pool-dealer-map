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

  // ── Map ──────────────────────────────────────────────────
  const map = new Map({ basemap: "dark-gray-vector" });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-98.5, 39.5],
    zoom: 4,
    popup: {
      dockEnabled: true,
      dockOptions: { position: "bottom-right", breakpoint: false },
    },
    ui: { components: ["attribution"] },
    constraints: { minZoom: 3 },
  });

  // ── Build graphics from data ─────────────────────────────
  console.log("Building graphics from", DEALER_DATABASE.length, "dealers...");

  const graphics = [];
  for (let i = 0; i < DEALER_DATABASE.length; i++) {
    const d = DEALER_DATABASE[i];
    if (!d.lat || !d.lng || d.lat === 0 || d.lng === 0) continue;
    graphics.push(new Graphic({
      geometry: new Point({ longitude: d.lng, latitude: d.lat }),
      attributes: {
        ObjectID: i + 1,
        name: d.name || "",
        company: d.company || "",
        type: d.type || "",
        typeLabel: (TYPE_LABELS && TYPE_LABELS[d.type]) || d.type || "",
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
        fullAddress: ((d.address || "") + ", " + (d.city || "") + ", " + (d.state || "") + " " + (d.zip || "")).trim(),
      },
    }));
  }
  console.log("Created", graphics.length, "valid graphics");

  // ── Renderer (autocast) ──────────────────────────────────
  const uniqueInfos = Object.entries(COMPANY_COLORS).map(function(entry) {
    var company = entry[0];
    var color = entry[1];
    return {
      value: company,
      symbol: {
        type: "simple-marker",
        color: color,
        size: company === "King Technology" ? 16 : 8,
        outline: {
          color: company === "King Technology" ? "#ffffff" : [255, 255, 255, 0.4],
          width: company === "King Technology" ? 3 : 0.5,
        },
        style: company === "King Technology" ? "diamond" : "circle",
      },
      label: company,
    };
  });

  var companyRenderer = {
    type: "unique-value",
    field: "company",
    defaultSymbol: {
      type: "simple-marker",
      color: "#888888",
      size: 7,
      outline: { color: [255, 255, 255, 0.3], width: 0.5 },
    },
    defaultLabel: "Other",
    uniqueValueInfos: uniqueInfos,
  };

  // ── Popup ────────────────────────────────────────────────
  var popupTemplate = {
    title: "{name}",
    content: [{
      type: "fields",
      fieldInfos: [
        { fieldName: "company", label: "Company" },
        { fieldName: "typeLabel", label: "Dealer Type" },
        { fieldName: "category", label: "Category" },
        { fieldName: "fullAddress", label: "Address" },
        { fieldName: "phone", label: "Phone" },
        { fieldName: "website", label: "Website" },
        { fieldName: "products", label: "Products" },
        { fieldName: "privateLabel", label: "Private Label Chemicals" },
        { fieldName: "notes", label: "Notes" },
      ],
    }],
  };

  // ── Clustering ───────────────────────────────────────────
  var clusterConfig = {
    type: "cluster",
    clusterRadius: "100px",
    clusterMinSize: "24px",
    clusterMaxSize: "60px",
    popupTemplate: {
      title: "Cluster: {cluster_count} dealers",
      content: "This cluster contains {cluster_count} dealer locations. Zoom in to see individual dealers.",
    },
    labelingInfo: [{
      deconflictionStrategy: "none",
      labelExpressionInfo: { expression: "Text($feature.cluster_count, '#,###')" },
      symbol: {
        type: "text",
        color: "#ffffff",
        font: { weight: "bold", family: "Noto Sans", size: "12px" },
      },
      labelPlacement: "center-center",
    }],
  };

  // ── Feature Layer ────────────────────────────────────────
  var dealerLayer = new FeatureLayer({
    source: graphics,
    fields: [
      { name: "ObjectID", alias: "ObjectID", type: "oid" },
      { name: "name", alias: "Name", type: "string" },
      { name: "company", alias: "Company", type: "string" },
      { name: "type", alias: "Type", type: "string" },
      { name: "typeLabel", alias: "Dealer Type", type: "string" },
      { name: "category", alias: "Category", type: "string" },
      { name: "address", alias: "Address", type: "string" },
      { name: "city", alias: "City", type: "string" },
      { name: "state", alias: "State", type: "string" },
      { name: "zip", alias: "ZIP", type: "string" },
      { name: "phone", alias: "Phone", type: "string" },
      { name: "website", alias: "Website", type: "string" },
      { name: "products", alias: "Products", type: "string" },
      { name: "privateLabel", alias: "Private Label", type: "string" },
      { name: "notes", alias: "Notes", type: "string" },
      { name: "fullAddress", alias: "Full Address", type: "string" },
    ],
    objectIdField: "ObjectID",
    geometryType: "point",
    spatialReference: { wkid: 4326 },
    renderer: companyRenderer,
    popupTemplate: popupTemplate,
    title: "Pool & Hot Tub Dealers",
    featureReduction: clusterConfig,
    outFields: ["*"],
  });

  map.add(dealerLayer);
  console.log("Layer added to map");

  // ── Heatmap renderer ─────────────────────────────────────
  var heatmapRenderer = {
    type: "heatmap",
    colorStops: [
      { color: "rgba(0, 0, 0, 0)", ratio: 0 },
      { color: "rgba(0, 100, 255, 0.5)", ratio: 0.1 },
      { color: "rgba(0, 200, 200, 0.7)", ratio: 0.3 },
      { color: "rgba(100, 255, 100, 0.8)", ratio: 0.5 },
      { color: "rgba(255, 255, 0, 0.9)", ratio: 0.7 },
      { color: "rgba(255, 100, 0, 0.95)", ratio: 0.85 },
      { color: "rgba(255, 0, 0, 1)", ratio: 1 },
    ],
    minDensity: 0,
    maxDensity: 0.01,
    radius: 18,
  };

  // ── Widgets ──────────────────────────────────────────────
  view.when(function() {
    console.log("View ready");

    var home = new Home({ view: view });
    view.ui.add(home, "top-left");

    var basemapToggle = new BasemapToggle({ view: view, nextBasemap: "satellite" });
    view.ui.add(basemapToggle, "bottom-right");

    var searchWidget = new Search({
      view: view,
      includeDefaultSources: false,
      sources: [{
        layer: dealerLayer,
        searchFields: ["name", "company", "city", "state"],
        displayField: "name",
        exactMatch: false,
        outFields: ["*"],
        name: "Dealers",
        placeholder: "Search dealers...",
      }],
    });
    var searchExpand = new Expand({ view: view, content: searchWidget, expandIcon: "search" });
    view.ui.add(searchExpand, "top-right");

    updateDealerCount();
    buildFilterUI();
    buildLegend();
    updateStats();
  }).catch(function(err) {
    console.error("View failed:", err);
  });

  // ── Dealer count chip ────────────────────────────────────
  function updateDealerCount(count) {
    var chip = document.getElementById("dealer-count-chip");
    if (!chip) return;
    var c = count !== undefined ? count : graphics.length;
    chip.textContent = c.toLocaleString() + " Dealers";
  }

  // ── Build filter UI ──────────────────────────────────────
  function buildFilterUI() {
    var typeContainer = document.getElementById("type-filters");
    if (!typeContainer) return;

    var types = [];
    var typeSet = {};
    DEALER_DATABASE.forEach(function(d) { if (!typeSet[d.type]) { typeSet[d.type] = true; types.push(d.type); } });

    types.forEach(function(t) {
      var label = document.createElement("label");
      var cb = document.createElement("calcite-checkbox");
      cb.setAttribute("checked", "");
      cb.setAttribute("value", t);
      cb.classList.add("type-checkbox");
      var dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.backgroundColor = TYPE_COLORS[t] || "#888";
      label.appendChild(cb);
      label.appendChild(dot);
      label.appendChild(document.createTextNode(TYPE_LABELS[t] || t));
      typeContainer.appendChild(label);
    });

    var companyContainer = document.getElementById("company-filters");
    if (!companyContainer) return;

    var companies = [];
    var compSet = {};
    DEALER_DATABASE.forEach(function(d) { if (!compSet[d.company]) { compSet[d.company] = true; companies.push(d.company); } });
    companies.sort();

    companies.forEach(function(c) {
      var label = document.createElement("label");
      var cb = document.createElement("calcite-checkbox");
      cb.setAttribute("checked", "");
      cb.setAttribute("value", c);
      cb.classList.add("company-checkbox");
      var dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.backgroundColor = COMPANY_COLORS[c] || "#888";
      label.appendChild(cb);
      label.appendChild(dot);
      label.appendChild(document.createTextNode(c));
      companyContainer.appendChild(label);
    });

    var productContainer = document.getElementById("product-filters");
    if (productContainer) {
      ["Chemicals", "Equipment", "Hot tubs", "Service", "Automation"].forEach(function(p) {
        var label = document.createElement("label");
        var cb = document.createElement("calcite-checkbox");
        cb.setAttribute("checked", "");
        cb.setAttribute("value", p);
        cb.classList.add("product-checkbox");
        label.appendChild(cb);
        label.appendChild(document.createTextNode(p));
        productContainer.appendChild(label);
      });
    }

    var stateCombo = document.getElementById("state-filter");
    if (stateCombo) {
      var statesInData = [];
      var stateSet = {};
      DEALER_DATABASE.forEach(function(d) { if (d.state && !stateSet[d.state]) { stateSet[d.state] = true; statesInData.push(d.state); } });
      statesInData.sort();
      statesInData.forEach(function(s) {
        var item = document.createElement("calcite-combobox-item");
        item.setAttribute("value", s);
        item.setAttribute("text-label", s);
        stateCombo.appendChild(item);
      });
    }
  }

  // ── Build legend ─────────────────────────────────────────
  function buildLegend() {
    var container = document.getElementById("legend-container");
    if (!container) return;

    var compSection = document.createElement("div");
    compSection.className = "legend-section";
    compSection.innerHTML = "<h4>By Company</h4>";
    Object.keys(COMPANY_COLORS).forEach(function(name) {
      var color = COMPANY_COLORS[name];
      var item = document.createElement("div");
      item.className = "legend-item";
      var sym = document.createElement("div");
      sym.className = "legend-symbol";
      sym.style.backgroundColor = color;
      if (name === "King Technology") {
        sym.style.borderColor = "#ffffff";
        sym.style.borderWidth = "3px";
        sym.style.borderRadius = "0";
        sym.style.transform = "rotate(45deg)";
        sym.style.width = "14px";
        sym.style.height = "14px";
      }
      item.appendChild(sym);
      item.appendChild(document.createTextNode(name));
      compSection.appendChild(item);
    });
    container.appendChild(compSection);

    var typeSection = document.createElement("div");
    typeSection.className = "legend-section";
    typeSection.innerHTML = "<h4>By Dealer Type</h4>";
    Object.keys(TYPE_COLORS).forEach(function(type) {
      var color = TYPE_COLORS[type];
      var item = document.createElement("div");
      item.className = "legend-item";
      var sym = document.createElement("div");
      sym.className = "legend-symbol square";
      sym.style.backgroundColor = color;
      item.appendChild(sym);
      item.appendChild(document.createTextNode(TYPE_LABELS[type] || type));
      typeSection.appendChild(item);
    });
    container.appendChild(typeSection);
  }

  // ── Stats ────────────────────────────────────────────────
  function updateStats(filteredData) {
    var data = filteredData || DEALER_DATABASE;
    var total = data.length;

    var typeCounts = {};
    data.forEach(function(d) { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1; });
    var typeContainer = document.getElementById("stats-type");
    if (typeContainer) {
      typeContainer.innerHTML = "";
      Object.entries(typeCounts).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(entry) {
        var type = entry[0], count = entry[1];
        typeContainer.innerHTML +=
          '<div class="stat-row">' +
          '<span class="stat-label"><span class="color-dot" style="background:' + (TYPE_COLORS[type] || '#888') + '"></span> ' + (TYPE_LABELS[type] || type) + '</span>' +
          '<div class="stat-bar-container"><div class="stat-bar" style="width:' + (count / total * 100) + '%;background:' + (TYPE_COLORS[type] || '#888') + '"></div></div>' +
          '<span class="stat-value">' + count + '</span>' +
          '</div>';
      });
    }

    var companyCounts = {};
    data.forEach(function(d) { companyCounts[d.company] = (companyCounts[d.company] || 0) + 1; });
    var compContainer = document.getElementById("stats-company");
    if (compContainer) {
      compContainer.innerHTML = "";
      Object.entries(companyCounts).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(entry) {
        var company = entry[0], count = entry[1];
        compContainer.innerHTML +=
          '<div class="stat-row">' +
          '<span class="stat-label"><span class="color-dot" style="background:' + (COMPANY_COLORS[company] || '#888') + '"></span> ' + company + '</span>' +
          '<div class="stat-bar-container"><div class="stat-bar" style="width:' + (count / total * 100) + '%;background:' + (COMPANY_COLORS[company] || '#888') + '"></div></div>' +
          '<span class="stat-value">' + count + '</span>' +
          '</div>';
      });
    }

    var stateCounts = {};
    data.forEach(function(d) { if (d.state) stateCounts[d.state] = (stateCounts[d.state] || 0) + 1; });
    var stateContainer = document.getElementById("stats-states");
    if (stateContainer) {
      stateContainer.innerHTML = "";
      var maxStateCount = Math.max.apply(null, Object.values(stateCounts));
      Object.entries(stateCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 15).forEach(function(entry) {
        var state = entry[0], count = entry[1];
        stateContainer.innerHTML +=
          '<div class="stat-row">' +
          '<span class="stat-label">' + state + '</span>' +
          '<div class="stat-bar-container"><div class="stat-bar" style="width:' + (count / maxStateCount * 100) + '%"></div></div>' +
          '<span class="stat-value">' + count + '</span>' +
          '</div>';
      });
    }

    var summaryContainer = document.getElementById("stats-summary");
    if (summaryContainer) {
      var privateLabelCount = data.filter(function(d) { return d.privateLabel; }).length;
      var hotTubCount = data.filter(function(d) { return d.category === "hot-tub"; }).length;
      var chemCount = data.filter(function(d) { return d.products && d.products.toLowerCase().indexOf("chemical") >= 0; }).length;
      var statesCount = Object.keys(stateCounts).length;
      summaryContainer.innerHTML =
        '<div class="stat-row"><span class="stat-label">Total Dealers</span><span class="stat-value">' + total + '</span></div>' +
        '<div class="stat-row"><span class="stat-label">States Covered</span><span class="stat-value">' + statesCount + '</span></div>' +
        '<div class="stat-row"><span class="stat-label">Sell Chemicals</span><span class="stat-value">' + chemCount + '</span></div>' +
        '<div class="stat-row"><span class="stat-label">Hot Tub Dealers</span><span class="stat-value">' + hotTubCount + '</span></div>' +
        '<div class="stat-row"><span class="stat-label">Private Label Chemicals</span><span class="stat-value">' + privateLabelCount + '</span></div>' +
        '<div class="stat-row"><span class="stat-label">Companies Tracked</span><span class="stat-value">' + Object.keys(companyCounts).length + '</span></div>';
    }
  }

  // ── Filter logic ─────────────────────────────────────────
  function applyFilters() {
    var searchText = (document.getElementById("search-input").value || "").toLowerCase();

    var checkedTypes = [];
    document.querySelectorAll(".type-checkbox").forEach(function(cb) {
      if (cb.hasAttribute("checked")) checkedTypes.push(cb.getAttribute("value"));
    });

    var checkedCompanies = [];
    document.querySelectorAll(".company-checkbox").forEach(function(cb) {
      if (cb.hasAttribute("checked")) checkedCompanies.push(cb.getAttribute("value"));
    });

    var stateCombo = document.getElementById("state-filter");
    var selectedStates = [];
    if (stateCombo && stateCombo.selectedItems) {
      Array.from(stateCombo.selectedItems).forEach(function(item) {
        selectedStates.push(item.getAttribute("value"));
      });
    }

    var clauses = [];
    var allTypes = Object.keys(TYPE_LABELS);
    if (checkedTypes.length > 0 && checkedTypes.length < allTypes.length) {
      clauses.push("type IN ('" + checkedTypes.join("','") + "')");
    }

    var allCompanies = Object.keys(COMPANY_COLORS);
    if (checkedCompanies.length > 0 && checkedCompanies.length < allCompanies.length) {
      clauses.push("company IN ('" + checkedCompanies.join("','") + "')");
    }

    if (selectedStates.length > 0) {
      clauses.push("state IN ('" + selectedStates.join("','") + "')");
    }

    if (searchText) {
      var escaped = searchText.replace(/'/g, "''");
      clauses.push("(LOWER(name) LIKE '%" + escaped + "%' OR LOWER(company) LIKE '%" + escaped + "%' OR LOWER(city) LIKE '%" + escaped + "%' OR LOWER(state) LIKE '%" + escaped + "%')");
    }

    dealerLayer.definitionExpression = clauses.length > 0 ? clauses.join(" AND ") : "1=1";

    var filteredData = DEALER_DATABASE.filter(function(d) {
      if (checkedTypes.length > 0 && checkedTypes.length < allTypes.length && checkedTypes.indexOf(d.type) < 0) return false;
      if (checkedCompanies.length > 0 && checkedCompanies.length < allCompanies.length && checkedCompanies.indexOf(d.company) < 0) return false;
      if (selectedStates.length > 0 && selectedStates.indexOf(d.state) < 0) return false;
      if (searchText) {
        var s = searchText;
        if ((d.name || "").toLowerCase().indexOf(s) < 0 &&
            (d.company || "").toLowerCase().indexOf(s) < 0 &&
            (d.city || "").toLowerCase().indexOf(s) < 0 &&
            (d.state || "").toLowerCase().indexOf(s) < 0) return false;
      }
      return true;
    });

    updateDealerCount(filteredData.length);
    updateStats(filteredData);
  }

  var applyBtn = document.getElementById("btn-apply-filters");
  if (applyBtn) applyBtn.addEventListener("click", applyFilters);

  var clearBtn = document.getElementById("btn-clear-filters");
  if (clearBtn) clearBtn.addEventListener("click", function() {
    document.querySelectorAll(".type-checkbox, .company-checkbox, .product-checkbox").forEach(function(cb) {
      cb.setAttribute("checked", "");
    });
    document.getElementById("search-input").value = "";
    var stateCombo = document.getElementById("state-filter");
    if (stateCombo && stateCombo.selectedItems) {
      Array.from(stateCombo.selectedItems).forEach(function(item) {
        item.removeAttribute("selected");
      });
    }
    dealerLayer.definitionExpression = "1=1";
    updateDealerCount();
    updateStats();
  });

  var searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.addEventListener("calciteInputTextInput", function() { applyFilters(); });

  // ── Header actions ───────────────────────────────────────
  var zoomAllBtn = document.getElementById("btn-zoom-all");
  if (zoomAllBtn) zoomAllBtn.addEventListener("click", function() {
    view.goTo({ center: [-98.5, 39.5], zoom: 4 });
  });

  var clusterEnabled = true;
  var clusterBtn = document.getElementById("btn-toggle-cluster");
  if (clusterBtn) clusterBtn.addEventListener("click", function() {
    clusterEnabled = !clusterEnabled;
    dealerLayer.featureReduction = clusterEnabled ? clusterConfig : null;
  });

  var heatmapEnabled = false;
  var heatBtn = document.getElementById("btn-toggle-heat");
  if (heatBtn) heatBtn.addEventListener("click", function() {
    heatmapEnabled = !heatmapEnabled;
    if (heatmapEnabled) {
      dealerLayer.renderer = heatmapRenderer;
      dealerLayer.featureReduction = null;
    } else {
      dealerLayer.renderer = companyRenderer;
      if (clusterEnabled) dealerLayer.featureReduction = clusterConfig;
    }
  });

  // ── Action bar panel switching ───────────────────────────
  var actionBar = document.querySelector("calcite-action-bar");
  var panels = document.querySelectorAll("calcite-shell-panel[slot='panel-start'] calcite-panel");

  if (actionBar) {
    actionBar.addEventListener("click", function(e) {
      var action = e.target.closest("calcite-action");
      if (!action) return;
      var panelId = action.getAttribute("data-action-id");
      if (!panelId) return;

      document.querySelectorAll("calcite-action-bar calcite-action").forEach(function(a) {
        a.removeAttribute("active");
      });
      action.setAttribute("active", "");

      panels.forEach(function(p) {
        if (p.getAttribute("data-panel-id") === panelId) {
          p.removeAttribute("hidden");
        } else {
          p.setAttribute("hidden", "");
        }
      });
    });

    var filtersAction = document.querySelector('[data-action-id="filters"]');
    if (filtersAction) filtersAction.setAttribute("active", "");
  }

  // ── Detail panel ─────────────────────────────────────────
  var detailPanel = document.getElementById("detail-panel");
  var detailBody = document.getElementById("dealer-detail-body");

  view.on("click", function(event) {
    view.hitTest(event).then(function(response) {
      var result = response.results.find(function(r) { return r.graphic && r.graphic.layer === dealerLayer; });
      if (result && result.graphic.attributes && result.graphic.attributes.name) {
        var attrs = result.graphic.attributes;
        if (detailPanel) detailPanel.removeAttribute("collapsed");

        var color = COMPANY_COLORS[attrs.company] || "#888";
        var threatLevel = attrs.privateLabel === "Yes" ? "COMPETITOR (Private Label)" : "Potential Partner";
        var threatColor = attrs.privateLabel === "Yes" ? "#e74c3c" : "#2ecc71";

        if (detailBody) {
          detailBody.innerHTML =
            '<div class="detail-section">' +
            '<h4 style="color:' + color + '">Company</h4>' +
            '<div class="detail-field"><span class="label">Name</span><span class="value">' + attrs.name + '</span></div>' +
            '<div class="detail-field"><span class="label">Company</span><span class="value" style="color:' + color + '">' + attrs.company + '</span></div>' +
            '<div class="detail-field"><span class="label">Type</span><span class="value">' + attrs.typeLabel + '</span></div>' +
            '<div class="detail-field"><span class="label">Category</span><span class="value">' + attrs.category + '</span></div>' +
            '</div>' +
            '<div class="detail-section">' +
            '<h4>Location</h4>' +
            '<div class="detail-field"><span class="label">Address</span><span class="value">' + attrs.fullAddress + '</span></div>' +
            '<div class="detail-field"><span class="label">Phone</span><span class="value">' + (attrs.phone || "N/A") + '</span></div>' +
            '<div class="detail-field"><span class="label">Website</span><span class="value"><a href="https://' + attrs.website + '" target="_blank" style="color:var(--calcite-color-brand)">' + attrs.website + '</a></span></div>' +
            '</div>' +
            '<div class="detail-section">' +
            '<h4>Products & Intelligence</h4>' +
            '<div class="detail-field"><span class="label">Products</span><span class="value">' + attrs.products + '</span></div>' +
            '<div class="detail-field"><span class="label">Private Label</span><span class="value" style="color:' + (attrs.privateLabel === "Yes" ? "#e74c3c" : "#2ecc71") + '">' + attrs.privateLabel + '</span></div>' +
            '<div class="detail-field"><span class="label">Threat Level</span><span class="value" style="color:' + threatColor + ';font-weight:700">' + threatLevel + '</span></div>' +
            '</div>' +
            (attrs.notes ? '<div class="detail-section"><h4>Intelligence Notes</h4><calcite-notice open kind="' + (attrs.privateLabel === "Yes" ? "danger" : "brand") + '" scale="s"><div slot="message">' + attrs.notes + '</div></calcite-notice></div>' : '');
        }
      }
    });
  });

  var closeBtn = document.getElementById("btn-close-detail");
  if (closeBtn) closeBtn.addEventListener("click", function() {
    if (detailPanel) detailPanel.setAttribute("collapsed", "");
  });

});
