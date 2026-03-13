require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/support/Field",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/renderers/UniqueValueRenderer",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/PopupTemplate",
  "esri/widgets/Legend",
  "esri/widgets/Search",
  "esri/widgets/Home",
  "esri/widgets/BasemapToggle",
  "esri/widgets/Expand",
  "esri/layers/support/FeatureReductionCluster",
], function (
  Map, MapView, FeatureLayer, Field, Graphic, Point,
  UniqueValueRenderer, SimpleMarkerSymbol, PopupTemplate,
  Legend, Search, Home, BasemapToggle, Expand, FeatureReductionCluster
) {

  // ── Map ──────────────────────────────────────────────────
  const map = new Map({ basemap: "dark-gray-vector" });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-98.5, 39.5],
    zoom: 4,
    padding: { top: 0 },
    popup: {
      dockEnabled: true,
      dockOptions: { position: "bottom-right", breakpoint: false },
    },
    ui: { components: ["attribution"] },
    constraints: { minZoom: 3 },
  });

  // ── Build graphics from data ─────────────────────────────
  const graphics = DEALER_DATABASE.map((d, i) => {
    return new Graphic({
      geometry: new Point({ longitude: d.lng, latitude: d.lat }),
      attributes: {
        ObjectID: i + 1,
        name: d.name,
        company: d.company,
        type: d.type,
        typeLabel: TYPE_LABELS[d.type] || d.type,
        category: d.category,
        address: d.address || "",
        city: d.city,
        state: d.state,
        zip: d.zip || "",
        phone: d.phone || "",
        website: d.website || "",
        products: d.products || "",
        privateLabel: d.privateLabel ? "Yes" : "No",
        notes: d.notes || "",
        fullAddress: `${d.address || ""}, ${d.city}, ${d.state} ${d.zip || ""}`,
      },
    });
  });

  // ── Renderer by company ──────────────────────────────────
  const uniqueInfos = Object.entries(COMPANY_COLORS).map(([company, color]) => ({
    value: company,
    symbol: new SimpleMarkerSymbol({
      color: color,
      size: company === "King Technology" ? 16 : 9,
      outline: {
        color: company === "King Technology" ? "#ffffff" : "rgba(255,255,255,0.4)",
        width: company === "King Technology" ? 3 : 1,
      },
      style: company === "King Technology" ? "diamond" : "circle",
    }),
    label: company,
  }));

  const companyRenderer = new UniqueValueRenderer({
    field: "company",
    defaultSymbol: new SimpleMarkerSymbol({
      color: "#888888",
      size: 8,
      outline: { color: "rgba(255,255,255,0.3)", width: 1 },
    }),
    defaultLabel: "Other",
    uniqueValueInfos: uniqueInfos,
  });

  // ── Renderer by type ─────────────────────────────────────
  const typeInfos = Object.entries(TYPE_COLORS).map(([type, color]) => ({
    value: type,
    symbol: new SimpleMarkerSymbol({
      color: color,
      size: 9,
      outline: { color: "rgba(255,255,255,0.4)", width: 1 },
    }),
    label: TYPE_LABELS[type] || type,
  }));

  const typeRenderer = new UniqueValueRenderer({
    field: "type",
    defaultSymbol: new SimpleMarkerSymbol({
      color: "#888888",
      size: 8,
      outline: { color: "rgba(255,255,255,0.3)", width: 1 },
    }),
    defaultLabel: "Other",
    uniqueValueInfos: typeInfos,
  });

  // ── Popup template ───────────────────────────────────────
  const popupTemplate = new PopupTemplate({
    title: "{name}",
    content: [
      {
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
      },
    ],
  });

  // ── Clustering ───────────────────────────────────────────
  const clusterConfig = {
    type: "cluster",
    clusterRadius: "80px",
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

  // ── Feature Layer (client-side) ──────────────────────────
  const fields = [
    new Field({ name: "ObjectID", alias: "ObjectID", type: "oid" }),
    new Field({ name: "name", alias: "Name", type: "string" }),
    new Field({ name: "company", alias: "Company", type: "string" }),
    new Field({ name: "type", alias: "Type", type: "string" }),
    new Field({ name: "typeLabel", alias: "Dealer Type", type: "string" }),
    new Field({ name: "category", alias: "Category", type: "string" }),
    new Field({ name: "address", alias: "Address", type: "string" }),
    new Field({ name: "city", alias: "City", type: "string" }),
    new Field({ name: "state", alias: "State", type: "string" }),
    new Field({ name: "zip", alias: "ZIP", type: "string" }),
    new Field({ name: "phone", alias: "Phone", type: "string" }),
    new Field({ name: "website", alias: "Website", type: "string" }),
    new Field({ name: "products", alias: "Products", type: "string" }),
    new Field({ name: "privateLabel", alias: "Private Label", type: "string" }),
    new Field({ name: "notes", alias: "Notes", type: "string" }),
    new Field({ name: "fullAddress", alias: "Full Address", type: "string" }),
  ];

  const dealerLayer = new FeatureLayer({
    source: graphics,
    fields: fields,
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

  // ── Heatmap renderer ─────────────────────────────────────
  const heatmapRenderer = {
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
  view.when(() => {
    // Home button
    const home = new Home({ view: view });
    view.ui.add(home, "top-left");

    // Basemap toggle
    const basemapToggle = new BasemapToggle({
      view: view,
      nextBasemap: "satellite",
    });
    view.ui.add(basemapToggle, "bottom-right");

    // Search widget
    const searchWidget = new Search({
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
    const searchExpand = new Expand({
      view: view,
      content: searchWidget,
      expandIcon: "search",
      group: "top-right",
    });
    view.ui.add(searchExpand, "top-right");

    updateDealerCount();
    buildFilterUI();
    buildLegend();
    updateStats();
  });

  // ── Dealer count chip ────────────────────────────────────
  function updateDealerCount(count) {
    const chip = document.getElementById("dealer-count-chip");
    const c = count !== undefined ? count : DEALER_DATABASE.length;
    chip.textContent = `${c.toLocaleString()} Dealers`;
  }

  // ── Build filter UI ──────────────────────────────────────
  function buildFilterUI() {
    // Type filters
    const typeContainer = document.getElementById("type-filters");
    const types = [...new Set(DEALER_DATABASE.map(d => d.type))];
    types.forEach(t => {
      const label = document.createElement("label");
      const cb = document.createElement("calcite-checkbox");
      cb.setAttribute("checked", "");
      cb.setAttribute("value", t);
      cb.classList.add("type-checkbox");
      const dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.backgroundColor = TYPE_COLORS[t] || "#888";
      label.appendChild(cb);
      label.appendChild(dot);
      label.appendChild(document.createTextNode(TYPE_LABELS[t] || t));
      typeContainer.appendChild(label);
    });

    // Company filters
    const companyContainer = document.getElementById("company-filters");
    const companies = [...new Set(DEALER_DATABASE.map(d => d.company))].sort();
    companies.forEach(c => {
      const label = document.createElement("label");
      const cb = document.createElement("calcite-checkbox");
      cb.setAttribute("checked", "");
      cb.setAttribute("value", c);
      cb.classList.add("company-checkbox");
      const dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.backgroundColor = COMPANY_COLORS[c] || "#888";
      label.appendChild(cb);
      label.appendChild(dot);
      label.appendChild(document.createTextNode(c));
      companyContainer.appendChild(label);
    });

    // Product filters
    const productContainer = document.getElementById("product-filters");
    const productKeywords = ["Chemicals", "Equipment", "Hot tubs", "Service", "Automation"];
    productKeywords.forEach(p => {
      const label = document.createElement("label");
      const cb = document.createElement("calcite-checkbox");
      cb.setAttribute("checked", "");
      cb.setAttribute("value", p);
      cb.classList.add("product-checkbox");
      label.appendChild(cb);
      label.appendChild(document.createTextNode(p));
      productContainer.appendChild(label);
    });

    // State combobox
    const stateCombo = document.getElementById("state-filter");
    const statesInData = [...new Set(DEALER_DATABASE.map(d => d.state))].sort();
    statesInData.forEach(s => {
      const item = document.createElement("calcite-combobox-item");
      item.setAttribute("value", s);
      item.setAttribute("text-label", s);
      stateCombo.appendChild(item);
    });
  }

  // ── Build legend ─────────────────────────────────────────
  function buildLegend() {
    const container = document.getElementById("legend-container");

    // By company
    const compSection = document.createElement("div");
    compSection.className = "legend-section";
    compSection.innerHTML = "<h4>By Company</h4>";
    Object.entries(COMPANY_COLORS).forEach(([name, color]) => {
      const item = document.createElement("div");
      item.className = "legend-item";
      const sym = document.createElement("div");
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

    // By type
    const typeSection = document.createElement("div");
    typeSection.className = "legend-section";
    typeSection.innerHTML = "<h4>By Dealer Type</h4>";
    Object.entries(TYPE_COLORS).forEach(([type, color]) => {
      const item = document.createElement("div");
      item.className = "legend-item";
      const sym = document.createElement("div");
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
    const data = filteredData || DEALER_DATABASE;
    const total = data.length;

    // By type
    const typeCounts = {};
    data.forEach(d => { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1; });
    const typeContainer = document.getElementById("stats-type");
    typeContainer.innerHTML = "";
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      typeContainer.innerHTML += `
        <div class="stat-row">
          <span class="stat-label"><span class="color-dot" style="background:${TYPE_COLORS[type] || '#888'}"></span> ${TYPE_LABELS[type] || type}</span>
          <div class="stat-bar-container"><div class="stat-bar" style="width:${(count/total*100)}%;background:${TYPE_COLORS[type] || '#888'}"></div></div>
          <span class="stat-value">${count}</span>
        </div>`;
    });

    // By company
    const companyCounts = {};
    data.forEach(d => { companyCounts[d.company] = (companyCounts[d.company] || 0) + 1; });
    const compContainer = document.getElementById("stats-company");
    compContainer.innerHTML = "";
    Object.entries(companyCounts).sort((a, b) => b[1] - a[1]).forEach(([company, count]) => {
      compContainer.innerHTML += `
        <div class="stat-row">
          <span class="stat-label"><span class="color-dot" style="background:${COMPANY_COLORS[company] || '#888'}"></span> ${company}</span>
          <div class="stat-bar-container"><div class="stat-bar" style="width:${(count/total*100)}%;background:${COMPANY_COLORS[company] || '#888'}"></div></div>
          <span class="stat-value">${count}</span>
        </div>`;
    });

    // Top states
    const stateCounts = {};
    data.forEach(d => { stateCounts[d.state] = (stateCounts[d.state] || 0) + 1; });
    const stateContainer = document.getElementById("stats-states");
    stateContainer.innerHTML = "";
    const maxStateCount = Math.max(...Object.values(stateCounts));
    Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([state, count]) => {
      stateContainer.innerHTML += `
        <div class="stat-row">
          <span class="stat-label">${state}</span>
          <div class="stat-bar-container"><div class="stat-bar" style="width:${(count/maxStateCount*100)}%"></div></div>
          <span class="stat-value">${count}</span>
        </div>`;
    });

    // Summary
    const summaryContainer = document.getElementById("stats-summary");
    const privateLabelCount = data.filter(d => d.privateLabel).length;
    const hotTubCount = data.filter(d => d.category === "hot-tub").length;
    const chemCount = data.filter(d => d.products && d.products.toLowerCase().includes("chemical")).length;
    const statesCount = new Set(data.map(d => d.state)).size;
    summaryContainer.innerHTML = `
      <div class="stat-row"><span class="stat-label">Total Dealers</span><span class="stat-value">${total}</span></div>
      <div class="stat-row"><span class="stat-label">States Covered</span><span class="stat-value">${statesCount}</span></div>
      <div class="stat-row"><span class="stat-label">Sell Chemicals</span><span class="stat-value">${chemCount}</span></div>
      <div class="stat-row"><span class="stat-label">Hot Tub Dealers</span><span class="stat-value">${hotTubCount}</span></div>
      <div class="stat-row"><span class="stat-label">Private Label Chemicals</span><span class="stat-value">${privateLabelCount}</span></div>
      <div class="stat-row"><span class="stat-label">Companies Tracked</span><span class="stat-value">${new Set(data.map(d => d.company)).size}</span></div>
    `;
  }

  // ── Filter logic ─────────────────────────────────────────
  function applyFilters() {
    const searchText = (document.getElementById("search-input").value || "").toLowerCase();

    const checkedTypes = [...document.querySelectorAll(".type-checkbox")]
      .filter(cb => cb.hasAttribute("checked"))
      .map(cb => cb.getAttribute("value"));

    const checkedCompanies = [...document.querySelectorAll(".company-checkbox")]
      .filter(cb => cb.hasAttribute("checked"))
      .map(cb => cb.getAttribute("value"));

    const checkedProducts = [...document.querySelectorAll(".product-checkbox")]
      .filter(cb => cb.hasAttribute("checked"))
      .map(cb => cb.getAttribute("value"));

    const stateCombo = document.getElementById("state-filter");
    const selectedStates = stateCombo.selectedItems
      ? Array.from(stateCombo.selectedItems).map(i => i.getAttribute("value"))
      : [];

    // Build where clause
    const clauses = [];

    if (checkedTypes.length > 0 && checkedTypes.length < Object.keys(TYPE_LABELS).length) {
      clauses.push(`type IN ('${checkedTypes.join("','")}')`);
    }

    if (checkedCompanies.length > 0) {
      const allCompanies = [...new Set(DEALER_DATABASE.map(d => d.company))];
      if (checkedCompanies.length < allCompanies.length) {
        clauses.push(`company IN ('${checkedCompanies.join("','")}')`);
      }
    }

    if (selectedStates.length > 0) {
      clauses.push(`state IN ('${selectedStates.join("','")}')`);
    }

    if (searchText) {
      clauses.push(`(LOWER(name) LIKE '%${searchText}%' OR LOWER(company) LIKE '%${searchText}%' OR LOWER(city) LIKE '%${searchText}%' OR LOWER(state) LIKE '%${searchText}%')`);
    }

    const where = clauses.length > 0 ? clauses.join(" AND ") : "1=1";
    dealerLayer.definitionExpression = where;

    // Update stats with filtered data
    const filteredData = DEALER_DATABASE.filter(d => {
      if (checkedTypes.length > 0 && !checkedTypes.includes(d.type)) return false;
      if (checkedCompanies.length > 0 && !checkedCompanies.includes(d.company)) return false;
      if (selectedStates.length > 0 && !selectedStates.includes(d.state)) return false;
      if (searchText) {
        const s = searchText;
        if (!d.name.toLowerCase().includes(s) &&
            !d.company.toLowerCase().includes(s) &&
            !d.city.toLowerCase().includes(s) &&
            !d.state.toLowerCase().includes(s)) return false;
      }
      return true;
    });

    updateDealerCount(filteredData.length);
    updateStats(filteredData);
  }

  document.getElementById("btn-apply-filters").addEventListener("click", applyFilters);

  document.getElementById("btn-clear-filters").addEventListener("click", () => {
    document.querySelectorAll(".type-checkbox, .company-checkbox, .product-checkbox").forEach(cb => {
      cb.setAttribute("checked", "");
    });
    document.getElementById("search-input").value = "";
    const stateCombo = document.getElementById("state-filter");
    if (stateCombo.selectedItems) {
      Array.from(stateCombo.selectedItems).forEach(item => {
        item.removeAttribute("selected");
      });
    }
    dealerLayer.definitionExpression = "1=1";
    updateDealerCount();
    updateStats();
  });

  // ── Search input live filter ─────────────────────────────
  document.getElementById("search-input").addEventListener("calciteInputTextInput", () => {
    applyFilters();
  });

  // ── Header actions ───────────────────────────────────────
  document.getElementById("btn-zoom-all").addEventListener("click", () => {
    view.goTo({ center: [-98.5, 39.5], zoom: 4 });
  });

  let clusterEnabled = true;
  document.getElementById("btn-toggle-cluster").addEventListener("click", () => {
    clusterEnabled = !clusterEnabled;
    if (clusterEnabled) {
      dealerLayer.featureReduction = clusterConfig;
    } else {
      dealerLayer.featureReduction = null;
    }
  });

  let heatmapEnabled = false;
  document.getElementById("btn-toggle-heat").addEventListener("click", () => {
    heatmapEnabled = !heatmapEnabled;
    if (heatmapEnabled) {
      dealerLayer.renderer = heatmapRenderer;
      dealerLayer.featureReduction = null;
    } else {
      dealerLayer.renderer = companyRenderer;
      if (clusterEnabled) {
        dealerLayer.featureReduction = clusterConfig;
      }
    }
  });

  // ── Action bar panel switching ───────────────────────────
  const actionBar = document.querySelector("calcite-action-bar");
  const panels = document.querySelectorAll("calcite-shell-panel[slot='panel-start'] calcite-panel");

  if (actionBar) {
    actionBar.addEventListener("click", (e) => {
      const action = e.target.closest("calcite-action");
      if (!action) return;
      const panelId = action.getAttribute("data-action-id");
      if (!panelId) return;

      // Toggle active state
      document.querySelectorAll("calcite-action-bar calcite-action").forEach(a => {
        a.removeAttribute("active");
      });
      action.setAttribute("active", "");

      // Show corresponding panel
      panels.forEach(p => {
        if (p.getAttribute("data-panel-id") === panelId) {
          p.removeAttribute("hidden");
        } else {
          p.setAttribute("hidden", "");
        }
      });
    });

    // Activate filters by default
    const filtersAction = document.querySelector('[data-action-id="filters"]');
    if (filtersAction) filtersAction.setAttribute("active", "");
  }

  // ── Detail panel ─────────────────────────────────────────
  const detailPanel = document.getElementById("detail-panel");
  const detailBody = document.getElementById("dealer-detail-body");

  view.on("click", (event) => {
    view.hitTest(event).then((response) => {
      const result = response.results.find(r => r.graphic && r.graphic.layer === dealerLayer);
      if (result && result.graphic.attributes.name) {
        const attrs = result.graphic.attributes;
        detailPanel.removeAttribute("collapsed");

        const color = COMPANY_COLORS[attrs.company] || "#888";
        const threatLevel = attrs.privateLabel === "Yes" ? "COMPETITOR (Private Label)" : "Potential Partner";
        const threatColor = attrs.privateLabel === "Yes" ? "#e74c3c" : "#2ecc71";

        detailBody.innerHTML = `
          <div class="detail-section">
            <h4 style="color:${color}">Company</h4>
            <div class="detail-field"><span class="label">Name</span><span class="value">${attrs.name}</span></div>
            <div class="detail-field"><span class="label">Company</span><span class="value" style="color:${color}">${attrs.company}</span></div>
            <div class="detail-field"><span class="label">Type</span><span class="value">${attrs.typeLabel}</span></div>
            <div class="detail-field"><span class="label">Category</span><span class="value">${attrs.category}</span></div>
          </div>
          <div class="detail-section">
            <h4>Location</h4>
            <div class="detail-field"><span class="label">Address</span><span class="value">${attrs.fullAddress}</span></div>
            <div class="detail-field"><span class="label">Phone</span><span class="value">${attrs.phone || "N/A"}</span></div>
            <div class="detail-field"><span class="label">Website</span><span class="value"><a href="https://${attrs.website}" target="_blank" style="color:var(--calcite-color-brand)">${attrs.website}</a></span></div>
          </div>
          <div class="detail-section">
            <h4>Products & Intelligence</h4>
            <div class="detail-field"><span class="label">Products</span><span class="value">${attrs.products}</span></div>
            <div class="detail-field"><span class="label">Private Label</span><span class="value" style="color:${attrs.privateLabel === 'Yes' ? '#e74c3c' : '#2ecc71'}">${attrs.privateLabel}</span></div>
            <div class="detail-field"><span class="label">Threat Level</span><span class="value" style="color:${threatColor};font-weight:700">${threatLevel}</span></div>
          </div>
          ${attrs.notes ? `
          <div class="detail-section">
            <h4>Intelligence Notes</h4>
            <calcite-notice open kind="${attrs.privateLabel === 'Yes' ? 'danger' : 'brand'}" scale="s">
              <div slot="message">${attrs.notes}</div>
            </calcite-notice>
          </div>` : ""}
        `;
      }
    });
  });

  document.getElementById("btn-close-detail").addEventListener("click", () => {
    detailPanel.setAttribute("collapsed", "");
  });

});
