// SIF-Sentinel Application Logic
// Implements PRD Section 18: Application Navigation & Workflows

document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    currentView: "dashboard",
    theme: localStorage.getItem("sif_theme") || "oceanic",
    mode: localStorage.getItem("sif_mode") || "light",
    persona: "priya", // priya (Field HSE), rakesh (Asset Manager), iyer (Process Safety), admin (MLOps)
    reports: [...INITIAL_REPORTS],
    selectedReport: null,
    drawerOpen: false,
    capaActions: [...CAPA_ACTIONS],
    models: [...MLOPS_MODELS],
    bulkSelected: new Set(),
    filters: {
      status: "all",
      severity: "critical,high", // PRD default: Critical/High SPS Queue
      asset: "all",
      search: ""
    },
    adminWeights: {
      gravity: 4.0,
      pressure: 4.2,
      hydrocarbon: 4.5
    },
    activeHeatmapFilter: null
  };

  // DOM Elements
  const body = document.documentElement;
  const viewport = document.getElementById("app-viewport");
  const navItems = document.querySelectorAll(".nav-item");
  const themeOceanicBtn = document.getElementById("theme-oceanic-btn");
  const themeTerraBtn = document.getElementById("theme-terra-btn");
  const modeToggleBtn = document.getElementById("mode-toggle-btn");
  const omniboxInput = document.getElementById("omnibox-search");
  const personaSelect = document.getElementById("persona-select");
  const slaAlertBanner = document.getElementById("sla-alert-banner");
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const detailDrawer = document.getElementById("detail-drawer");
  const modalBackdrop = document.getElementById("modal-backdrop");

  // Initialize Theme & Mode
  function applyTheme() {
    body.setAttribute("data-theme", state.theme);
    body.setAttribute("data-mode", state.mode);
    
    if (state.theme === "oceanic") {
      themeOceanicBtn.classList.add("active");
      themeTerraBtn.classList.remove("active");
    } else {
      themeTerraBtn.classList.add("active");
      themeOceanicBtn.classList.remove("active");
    }

    modeToggleBtn.innerHTML = state.mode === "dark" 
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    localStorage.setItem("sif_theme", state.theme);
    localStorage.setItem("sif_mode", state.mode);
  }

  // View Navigation
  function navigateTo(viewId, params = {}) {
    state.currentView = viewId;
    navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.view === viewId);
    });

    closeDrawer();
    renderCurrentView(params);
  }
  // Expose to window for inline onclick handlers in dynamically rendered HTML
  window.navigateTo = navigateTo;

  function renderCurrentView(params = {}) {
    switch (state.currentView) {
      case "dashboard":
        renderDashboardView();
        break;
      case "triage":
        renderTriageView(params);
        break;
      case "report-detail":
        renderReportDetailView(params.reportId);
        break;
      case "analytics":
        renderAnalyticsView();
        break;
      case "capa":
        renderCapaView();
        break;
      case "admin":
        renderAdminView();
        break;
      case "notifications":
        renderNotificationsView();
        break;
      case "help":
        renderHelpView();
        break;
      default:
        renderDashboardView();
    }
  }

  // --- MODULE 1: EXECUTIVE PULSE / DASHBOARD ---
  function renderDashboardView() {
    const totalReports = state.reports.length;
    const criticalReports = state.reports.filter(r => r.sps_tier === "Critical" && r.status === "Pending Triage").length;
    const precursorRatio = ((state.reports.filter(r => r.sps >= 60).length / totalReports) * 100).toFixed(1);
    const activeCapas = state.capaActions.filter(c => c.status !== "Closed & Verified").length;

    viewport.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Executive Precursor Pulse
          </h2>
          <p>Real-time SIF precursor velocity & barrier health indicators across Oil India Limited installations</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" id="btn-quick-triage">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Start Daily Triage (${criticalReports} Urgent)
          </button>
          <button class="btn btn-secondary" id="btn-export-oisd">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Board OISD Report
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Precursor Velocity</span>
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            </div>
          </div>
          <div class="stat-value">6.8 <span style="font-size:16px; font-weight:600; color:var(--text-muted)">/ 10k hrs</span></div>
          <div class="stat-sub">
            <span class="stat-trend-up">↑ +0.4</span> vs last rolling 30-day baseline
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Critical Pending Triage</span>
            <div class="stat-icon" style="background:var(--sif-critical-bg); color:var(--sif-critical)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="stat-value" style="color:var(--sif-critical)">${criticalReports}</div>
          <div class="stat-sub">
            <span class="stat-trend-up">SLA &lt; 4h</span> remaining on top report
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Precursor / Routine Ratio</span>
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
          </div>
          <div class="stat-value">${precursorRatio}%</div>
          <div class="stat-sub">
            Decoupled from recorded minor outcome
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Active Precursor CAPAs</span>
            <div class="stat-icon" style="background:var(--sif-low-bg); color:var(--sif-low)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
          </div>
          <div class="stat-value">${activeCapas}</div>
          <div class="stat-sub">
            <span class="stat-trend-good">94.2%</span> closed within 24h statutory SLA
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              High-Energy Precursor Distribution (Top Hazard Categories)
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-view-heatmap-link">Explore Heatmap →</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${TAXONOMY_HIGH_ENERGY.slice(0, 5).map(cat => `
              <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
                <div style="width:200px; font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-primary)"></span>
                  ${cat.name}
                </div>
                <div style="flex:1; height:8px; background:var(--bg-subtle); border-radius:999px; overflow:hidden;">
                  <div style="width:${(cat.count / 60) * 100}%; height:100%; background:var(--primary-gradient); border-radius:999px;"></div>
                </div>
                <div style="font-family:var(--font-mono); font-size:13px; font-weight:700; width:65px; text-align:right;">
                  ${cat.count} <span style="font-size:11px; color:var(--text-muted)">evts</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Active AI Model
            </div>
            <span class="badge" style="background:var(--sif-low-bg); color:var(--sif-low); border:1px solid var(--sif-low-border)">v1.4.2 Production</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:14px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
              <span style="color:var(--text-muted)">Architecture</span>
              <span style="font-weight:600">IndicBERT + Domain RoBERTa</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
              <span style="color:var(--text-muted)">Precursor Recall SLA</span>
              <span style="font-weight:700; color:var(--sif-low)">92.4% (Target &ge; 90%)</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
              <span style="color:var(--text-muted)">Supervisor Agreement</span>
              <span style="font-weight:600">89.1% (Cohen's &kappa; 0.84)</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:4px;">
              <span style="color:var(--text-muted)">Concept Drift</span>
              <span style="font-weight:600; color:#10b981">Stable (PSI: 0.04)</span>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-go-mlops" style="margin-top:6px;">
              View Model Governance Console →
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Immediate Action Feed: Unreviewed High-SPS Observations
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-view-all-worklist">View Full Worklist (${totalReports}) →</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${state.reports.filter(r => r.sps >= 70).map(r => `
            <div class="kanban-card" onclick="window.openReportDrawer('${r.id}')" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
              <div style="display:flex; align-items:center; gap:14px;">
                <span class="sps-badge ${getSpsBadgeClass(r.sps_tier)}">SPS ${r.sps}</span>
                <div>
                  <div style="font-weight:600; font-size:14px; color:var(--text-primary)">${r.title}</div>
                  <div style="font-size:11.5px; color:var(--text-muted); display:flex; gap:10px; margin-top:2px;">
                    <span><strong>Asset:</strong> ${r.asset}</span>
                    <span>•</span>
                    <span><strong>Hazard:</strong> ${r.energy_source}</span>
                    <span>•</span>
                    <span><strong>Reported:</strong> ${r.timestamp}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge" style="background:var(--sif-critical-bg); color:var(--sif-critical); border:1px solid var(--sif-critical-border)">
                  SLA: ${r.sla_hours_remaining}h left
                </span>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.openReportDrawer('${r.id}')">
                  Triage Now
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Event listeners for Dashboard
    document.getElementById("btn-quick-triage").addEventListener("click", () => navigateTo("triage"));
    document.getElementById("btn-view-all-worklist").addEventListener("click", () => navigateTo("triage"));
    document.getElementById("btn-view-heatmap-link").addEventListener("click", () => navigateTo("analytics"));
    document.getElementById("btn-go-mlops").addEventListener("click", () => navigateTo("admin"));
    document.getElementById("btn-export-oisd").addEventListener("click", exportOisdPdf);
  }

  // --- MODULE 2: TRIAGE WORKLIST ---
  function renderTriageView(params = {}) {
    let filtered = [...state.reports];

    // Status filter
    if (state.filters.status !== "all") {
      filtered = filtered.filter(r => {
        if (state.filters.status === "pending") return r.status === "Pending Triage";
        if (state.filters.status === "escalated") return r.status.includes("CAPA");
        if (state.filters.status === "closed") return r.status.includes("Closed");
        return true;
      });
    }

    // Severity filter — supports comma-separated multi-tier (e.g. "critical,high" default)
    if (state.filters.severity !== "all") {
      const tiers = state.filters.severity.split(",").map(t => t.trim());
      filtered = filtered.filter(r => tiers.includes(r.sps_tier.toLowerCase()));
    }

    // Asset filter
    if (state.filters.asset !== "all") {
      filtered = filtered.filter(r => r.asset.includes(state.filters.asset));
    }

    // Search filter
    if (state.filters.search.trim() !== "") {
      const q = state.filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.narrative.toLowerCase().includes(q) ||
        r.asset.toLowerCase().includes(q)
      );
    }

    // PRD requirement: always sort descending by SPS score
    filtered.sort((a, b) => b.sps - a.sps);

    viewport.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Triage Worklist
          </h2>
          <p>Prioritized by AI SIF Potential Score (SPS) independent of recorded actual outcome</p>
        </div>
        <div class="view-actions">
          <div id="bulk-actions-container" style="display:none; align-items:center; gap:8px;">
            <span id="bulk-count-label" style="font-size:12.5px; font-weight:700; color:var(--accent-primary)">0 selected</span>
            <button class="btn btn-success btn-sm" id="btn-batch-verify">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Batch Verify & Close Low Risk
            </button>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-clear-filters">
            Reset Filters
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-toolbar">
          <div class="filter-group">
            <select class="filter-select" id="filter-status">
              <option value="all" ${state.filters.status === "all" ? "selected" : ""}>All Review Statuses</option>
              <option value="pending" ${state.filters.status === "pending" ? "selected" : ""}>Pending Triage</option>
              <option value="escalated" ${state.filters.status === "escalated" ? "selected" : ""}>Escalated / In CAPA</option>
              <option value="closed" ${state.filters.status === "closed" ? "selected" : ""}>Closed</option>
            </select>

            <select class="filter-select" id="filter-severity">
              <option value="all" ${state.filters.severity === "all" ? "selected" : ""}>All SPS Risk Bands</option>
              <option value="critical,high" ${state.filters.severity === "critical,high" ? "selected" : ""}>Critical &amp; High Queue (Default)</option>
              <option value="critical" ${state.filters.severity === "critical" ? "selected" : ""}>Critical Only (SPS 80–100)</option>
              <option value="high" ${state.filters.severity === "high" ? "selected" : ""}>High Only (SPS 60–79)</option>
              <option value="medium" ${state.filters.severity === "medium" ? "selected" : ""}>Medium (SPS 30–59)</option>
              <option value="low" ${state.filters.severity === "low" ? "selected" : ""}>Low (SPS 0–29)</option>
            </select>

            <select class="filter-select" id="filter-asset">
              <option value="all" ${state.filters.asset === "all" ? "selected" : ""}>All OIL Assets</option>
              <option value="Rig-04" ${state.filters.asset === "Rig-04" || state.filters.asset.includes("Rig-04") ? "selected" : ""}>Rig-04 Dibrugarh</option>
              <option value="Moran" ${state.filters.asset.includes("Moran") ? "selected" : ""}>Moran GGS</option>
              <option value="CTF Dikom" ${state.filters.asset.includes("CTF") || state.filters.asset.includes("Dikom") ? "selected" : ""}>CTF Dikom</option>
              <option value="Naharkatiya" ${state.filters.asset.includes("Naharkatiya") || state.filters.asset.includes("Rig-07") ? "selected" : ""}>Rig-07 Naharkatiya</option>
              <option value="Duliajan" ${state.filters.asset.includes("Duliajan") ? "selected" : ""}>Duliajan Gas Plant</option>
              <option value="Pipeline" ${state.filters.asset.includes("Pipeline") || state.filters.asset.includes("ROW") ? "selected" : ""}>Brahmaputra Pipeline ROW-08</option>
            </select>
          </div>

          <div style="font-size:12.5px; color:var(--text-muted); font-weight:600;">
            Showing ${filtered.length} of ${state.reports.length} safety observations
          </div>
        </div>

        <table class="custom-table">
          <thead>
            <tr>
              <th style="width:40px;"><input type="checkbox" id="select-all-checkbox"/></th>
              <th style="width:110px;">SPS Score</th>
              <th>Report Title & Observation</th>
              <th>High-Energy Hazard</th>
              <th>Life-Saving Rule</th>
              <th>Asset Location</th>
              <th>Review Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(r => `
              <tr onclick="window.openReportDrawer('${r.id}')">
                <td onclick="event.stopPropagation()">
                  <input type="checkbox" class="report-checkbox" data-id="${r.id}" ${state.bulkSelected.has(r.id) ? "checked" : ""}/>
                </td>
                <td>
                  <span class="sps-badge ${getSpsBadgeClass(r.sps_tier)}">
                    ${r.sps_tier.toUpperCase()} ${r.sps}
                  </span>
                </td>
                <td class="report-title-cell">
                  <span class="title-text">${r.title}</span>
                  <div class="meta-sub">
                    <span>${r.id}</span>
                    <span>•</span>
                    <span>${r.type}</span>
                    <span>•</span>
                    <span style="color:var(--text-secondary); font-style:italic">Actual: ${r.recorded_severity}</span>
                  </div>
                </td>
                <td>
                  <span style="font-weight:600; color:var(--text-primary); font-size:12.5px;">${r.energy_source}</span>
                  <div style="font-size:11px; color:var(--text-muted)">${r.exposure_type}</div>
                </td>
                <td>
                  <span style="font-size:12px; font-weight:600; color:var(--accent-primary);">${r.life_saving_rule.split('&')[0]}</span>
                </td>
                <td>
                  <span style="font-weight:500; font-size:12.5px;">${r.asset}</span>
                </td>
                <td>
                  <span class="badge" style="${getStatusBadgeStyle(r.status)}">${r.status}</span>
                </td>
                <td style="text-align:right;" onclick="event.stopPropagation()">
                  <button class="btn btn-secondary btn-sm" onclick="window.openReportDrawer('${r.id}')">
                    Inspect →
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Hook Triage Filters
    document.getElementById("filter-status").addEventListener("change", (e) => {
      state.filters.status = e.target.value;
      renderTriageView();
    });

    document.getElementById("filter-severity").addEventListener("change", (e) => {
      state.filters.severity = e.target.value;
      renderTriageView();
    });

    document.getElementById("filter-asset").addEventListener("change", (e) => {
      state.filters.asset = e.target.value;
      renderTriageView();
    });

    document.getElementById("btn-clear-filters").addEventListener("click", () => {
      state.filters = { status: "all", severity: "all", asset: "all", search: "" };
      renderTriageView();
    });

    // Checkbox bulk actions
    const selectAll = document.getElementById("select-all-checkbox");
    const checkboxes = document.querySelectorAll(".report-checkbox");
    const bulkContainer = document.getElementById("bulk-actions-container");
    const bulkLabel = document.getElementById("bulk-count-label");

    selectAll.addEventListener("change", (e) => {
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const id = cb.dataset.id;
        if (e.target.checked) state.bulkSelected.add(id);
        else state.bulkSelected.delete(id);
      });
      updateBulkUI();
    });

    checkboxes.forEach(cb => {
      cb.addEventListener("change", (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) state.bulkSelected.add(id);
        else state.bulkSelected.delete(id);
        updateBulkUI();
      });
    });

    function updateBulkUI() {
      const count = state.bulkSelected.size;
      if (count > 0) {
        bulkContainer.style.display = "flex";
        bulkLabel.innerText = `${count} selected`;
      } else {
        bulkContainer.style.display = "none";
      }
    }

    const batchVerifyBtn = document.getElementById("btn-batch-verify");
    if (batchVerifyBtn) {
      batchVerifyBtn.addEventListener("click", () => {
        state.bulkSelected.forEach(id => {
          const report = state.reports.find(r => r.id === id);
          if (report) {
            report.status = "Closed (Bulk Verified)";
            report.audit_trail.push({ action: "Bulk Verified & Closed by Field Supervisor", user: "Priya Sharma", time: new Date().toISOString() });
          }
        });
        state.bulkSelected.clear();
        showToast("Selected observations verified and closed successfully.");
        renderTriageView();
      });
    }
  }

  // --- MODULE 3: REPORT DETAIL & EVIDENCE VIEWER ---
  // Helper: escape text for use in RegExp
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  window.openReportDrawer = function(reportId) {
    const report = state.reports.find(r => r.id === reportId);
    if (!report) return;
    state.selectedReport = report;
    state.drawerOpen = true;

    // Render highlighted narrative — anti-hallucination: only verified evidence_spans are shown
    let highlightedHtml = report.narrative;
    report.evidence_spans.forEach(span => {
      // Only highlight hazard-relevant types; skip "mitigation" and any unknown types
      if (!['energy_release', 'barrier_failure', 'line_of_fire'].includes(span.type)) return;
      const cls = span.type === "energy_release" ? "hl-energy" : (span.type === "barrier_failure" ? "hl-barrier" : "hl-line-of-fire");
      const titleText = span.type === "energy_release" ? "High-Energy Hazard Signal" : (span.type === "barrier_failure" ? "Critical Barrier Breakdown" : "Line-of-Fire / Worker Exposure");
      // Use regex for safe replacement (escapes special chars in span text)
      const safeText = escapeRegExp(span.text);
      const replacement = `<mark class="hl-token ${cls}" title="${titleText}">${span.text}</mark>`;
      highlightedHtml = highlightedHtml.replace(new RegExp(safeText), replacement);
    });

    detailDrawer.innerHTML = `
      <div class="drawer-header">
        <div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="sps-badge ${getSpsBadgeClass(report.sps_tier)}">SPS ${report.sps} — ${report.sps_tier.toUpperCase()}</span>
            <span style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted)">${report.id}</span>
          </div>
          <h3 style="font-size:16px; font-weight:700; margin-top:4px; color:var(--text-primary)">${report.title}</h3>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="closeDrawer()" title="Close Drawer (Esc)">
          ✕
        </button>
      </div>

      <div class="drawer-body">
        <!-- Anti-Hallucination Verified Badge -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div class="verified-stamp">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Verified Evidence Extraction (100% Citation Precision)
          </div>
          <span style="font-size:11.5px; color:var(--text-muted)">Model: v1.4.2-oil-transformer</span>
        </div>

        <!-- Narrative with token highlighting -->
        <div>
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">
            Original Safety Observation Narrative
          </div>
          <div class="narrative-box">
            ${highlightedHtml}
          </div>
          <div style="display:flex; gap:12px; margin-top:8px; font-size:11px; flex-wrap:wrap;">
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:var(--hl-energy-border); border-radius:2px;"></span> Energy Source</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:var(--hl-barrier-border); border-radius:2px;"></span> Barrier Failure</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:var(--hl-exposure-border); border-radius:2px;"></span> Line of Fire</span>
          </div>
        </div>

        <!-- Counterfactual Reasoning Card -->
        <div class="counterfactual-card">
          <div class="counterfactual-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Counterfactual Risk Determination (Could this be fatal?)
          </div>
          <div class="counterfactual-text">
            <strong>${report.counterfactual.could_be_fatal ? "YES — HIGH FATAL / SIF POTENTIAL:" : "NO — LOW CONSTRAINED POTENTIAL:"}</strong>
            ${report.counterfactual.reasoning}
          </div>
        </div>

        <!-- SPS Mathematical Breakdown -->
        <div>
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">
            SIF Potential Score (SPS: ${report.sps}/100) Formulation
          </div>
          <div class="score-breakdown-card">
            <div class="meter-row">
              <span class="meter-label">Energy Magnitude (W=4.0)</span>
              <div class="meter-bar-container">
                <div class="meter-bar-fill" style="width:${report.sps_breakdown.energy_score * 10}%;"></div>
              </div>
              <span class="meter-val">${report.sps_breakdown.energy_score} / 10</span>
            </div>

            <div class="meter-row">
              <span class="meter-label">Barrier Breakdown (W=3.5)</span>
              <div class="meter-bar-container">
                <div class="meter-bar-fill" style="width:${report.sps_breakdown.barrier_score * 10}%;"></div>
              </div>
              <span class="meter-val">${report.sps_breakdown.barrier_score} / 10</span>
            </div>

            <div class="meter-row">
              <span class="meter-label">Exposure Line of Fire (W=2.5)</span>
              <div class="meter-bar-container">
                <div class="meter-bar-fill" style="width:${report.sps_breakdown.exposure_score * 10}%;"></div>
              </div>
              <span class="meter-val">${report.sps_breakdown.exposure_score} / 10</span>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:12px; border-top:1px solid var(--border-subtle); padding-top:8px; margin-top:4px;">
              <span style="color:var(--text-muted)">Contextual SIMOPS Multiplier</span>
              <span style="font-weight:700; font-family:var(--font-mono)">${report.sps_breakdown.context_multiplier}x</span>
            </div>
          </div>
        </div>

        <!-- Taxonomy Classification Details -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12.5px;">
          <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-md);">
            <span style="color:var(--text-muted); font-size:11px; font-weight:700; text-transform:uppercase;">Primary High-Energy Axis</span>
            <div style="font-weight:700; margin-top:2px;">${report.energy_source} (${report.energy_source_id})</div>
            <div style="color:var(--text-secondary); font-size:11.5px;">Level: ${report.energy_level}</div>
          </div>

          <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-md);">
            <span style="color:var(--text-muted); font-size:11px; font-weight:700; text-transform:uppercase;">Life-Saving Rule (LSR)</span>
            <div style="font-weight:700; margin-top:2px;">${report.life_saving_rule}</div>
            <div style="color:var(--text-secondary); font-size:11.5px;">Status: ${report.barrier_status}</div>
          </div>
        </div>

        <!-- Audit Trail -->
        <div>
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">
            Immutable Audit Trail
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:11.5px;">
            ${report.audit_trail.map(a => `
              <div style="display:flex; justify-content:space-between; background:var(--bg-subtle); padding:6px 10px; border-radius:4px;">
                <span><strong>${a.action}</strong> by ${a.user}</span>
                <span style="color:var(--text-muted)">${a.time}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="drawer-footer">
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="openOverrideModal('${report.id}')" title="Keyboard: O">
            Adjust / Override
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.openNextReport()" title="Keyboard: J — Open next report in queue">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            Open Next
          </button>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" onclick="openEscalateModal('${report.id}')" title="Keyboard: E">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Confirm & Escalate to CAPA
          </button>
        </div>
      </div>
    `;

    drawerBackdrop.classList.add("active");
    detailDrawer.classList.add("open");
  };

  window.closeDrawer = function() {
    drawerBackdrop.classList.remove("active");
    detailDrawer.classList.remove("open");
    state.drawerOpen = false;
  };

  // Open Next: cycles to the next report in SPS-sorted Critical/High queue
  window.openNextReport = function() {
    if (!state.selectedReport) return;
    const sorted = [...state.reports].sort((a, b) => b.sps - a.sps);
    const idx = sorted.findIndex(r => r.id === state.selectedReport.id);
    const nextIdx = (idx + 1) % sorted.length;
    const next = sorted[nextIdx];
    if (next) {
      window.openReportDrawer(next.id);
    } else {
      showToast("No more reports in the queue.");
    }
  };

  drawerBackdrop.addEventListener("click", closeDrawer);

  // --- ESCALATE TO CAPA MODAL ---
  window.openEscalateModal = function(reportId) {
    const report = state.reports.find(r => r.id === reportId);
    if (!report) return;

    modalBackdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Escalate SIF Precursor to CAPA
          </h3>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--bg-subtle); padding:10px 14px; border-radius:var(--radius-md); font-size:12.5px;">
            <strong>Linked Observation:</strong> ${report.id} — ${report.title} (${report.asset})
          </div>

          <div class="form-group">
            <label class="form-label">Corrective & Preventive Action (CAPA) Title</label>
            <input type="text" id="capa-title-input" class="form-input" value="Immediate mitigation: ${report.barrier_status} at ${report.location}"/>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Assigned Toolpusher / Owner</label>
              <input type="text" id="capa-owner-input" class="form-input" value="B. Saikia (Rig Toolpusher)"/>
            </div>
            <div class="form-group">
              <label class="form-label">SLA Due Date</label>
              <input type="date" id="capa-due-input" class="form-input" value="2026-09-05"/>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Target Maintenance System</label>
            <select class="form-select" id="capa-system-select">
              <option value="sap">OIL SAP Plant Maintenance (Auto-Create Work Order)</option>
              <option value="maximo">IBM Maximo Enterprise Asset Management</option>
              <option value="internal">SIF-Sentinel Field Action Queue</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" id="btn-submit-capa-escalation">
            Dispatch CAPA Ticket
          </button>
        </div>
      </div>
    `;
    modalBackdrop.classList.add("active");

    document.getElementById("btn-submit-capa-escalation").addEventListener("click", () => {
      const title = document.getElementById("capa-title-input").value;
      const owner = document.getElementById("capa-owner-input").value;
      const dueDate = document.getElementById("capa-due-input").value;
      const capaId = `CAPA-2026-0${Math.floor(400 + Math.random() * 500)}`;

      // Create new CAPA action
      state.capaActions.unshift({
        id: capaId,
        source_report: report.id,
        title: title,
        owner: owner,
        due_date: dueDate,
        status: "In Progress",
        priority: report.sps_tier,
        asset: report.asset,
        sap_work_order: `WO-98${Math.floor(1000 + Math.random() * 9000)}`,
        verification_required: true
      });

      // Update report status
      report.status = "Escalated to CAPA";
      report.capa_id = capaId;
      report.audit_trail.push({
        action: `Escalated to ${capaId} (SAP WO Created)`,
        user: "Priya Sharma (Field HSE)",
        time: new Date().toISOString()
      });

      closeModal();
      closeDrawer();
      showToast(`SIF Precursor escalated! Linked ${capaId} dispatched to field owner.`);
      renderCurrentView();
    });
  };

  // --- OVERRIDE MODAL (HUMAN-IN-THE-LOOP FEEDBACK) ---
  window.openOverrideModal = function(reportId) {
    const report = state.reports.find(r => r.id === reportId);
    if (!report) return;

    modalBackdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Human Supervisor Override & Feedback
          </h3>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size:12.5px; color:var(--text-muted)">
            Per PRD Section 11 (Non-Punitive & Human Override Authority), field supervisors hold full authority to calibrate AI scores. Overrides are recorded in the MLOps retraining pipeline.
          </p>

          <div class="form-group">
            <label class="form-label">Adjusted SIF Potential Score (0–100)</label>
            <input type="number" id="override-sps-input" class="form-input" value="${report.sps}" min="0" max="100"/>
          </div>

          <div class="form-group">
            <label class="form-label">Mandatory Reason Code for Override</label>
            <select class="form-select" id="override-reason-select">
              <option value="safeguard">Contextual physical barrier existed (e.g. blast wall, secondary catch)</option>
              <option value="vernacular">Regional dialect / technical abbreviation misunderstood by NLP</option>
              <option value="energy_lower">Actual energy magnitude lower than narrative inferred</option>
              <option value="administrative">Procedural/administrative discrepancy only; no line-of-fire</option>
              <option value="other">Other operational engineering judgment</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Supervisor Justification Notes</label>
            <textarea id="override-notes" class="form-textarea" rows="3" placeholder="Provide operational context for model retraining..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" id="btn-submit-override">
            Submit Calibration to MLOps Queue
          </button>
        </div>
      </div>
    `;
    modalBackdrop.classList.add("active");

    document.getElementById("btn-submit-override").addEventListener("click", () => {
      const newSps = parseInt(document.getElementById("override-sps-input").value);
      const reason = document.getElementById("override-reason-select").value;
      const notes = document.getElementById("override-notes").value.trim();
      const notesEl = document.getElementById("override-notes");

      // PRD §11: Mandatory justification notes for all human overrides (audit trail requirement)
      if (!notes || notes.length < 10) {
        notesEl.style.border = "2px solid var(--sif-critical)";
        notesEl.placeholder = "⚠ MANDATORY: Min. 10 characters required for audit compliance (PRD §11)";
        notesEl.focus();
        showToast("Override blocked: Justification notes are mandatory per PRD §11 audit requirements.");
        return;
      }

      // Validate SPS range 0–100
      if (isNaN(newSps) || newSps < 0 || newSps > 100) {
        showToast("Invalid SPS value — must be between 0 and 100.");
        return;
      }

      report.sps = newSps;
      report.sps_tier = newSps >= 80 ? "Critical" : (newSps >= 60 ? "High" : (newSps >= 30 ? "Medium" : "Low"));
      report.status = "Supervisor Overridden";
      report.audit_trail.push({
        action: `SPS calibrated to ${newSps} (Reason: ${reason}; Notes: ${notes.substring(0, 100)})`,
        user: "Priya Sharma (Field HSE)",
        time: new Date().toISOString()
      });

      closeModal();
      closeDrawer();
      showToast(`Classification calibrated to SPS ${newSps}. Queued for MLOps retraining pipeline.`);
      renderCurrentView();
    });
  };

  window.closeModal = function() {
    modalBackdrop.classList.remove("active");
  };

  // --- MODULE 4: LEADING BI & HEATMAP STUDIO ---
  function renderAnalyticsView() {
    viewport.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Leading BI & Cross-Asset Precursor Heatmap
          </h2>
          <p>Multi-dimensional correlation between High-Energy hazards, barrier degradation, and asset installations</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary" id="btn-export-bi-pdf">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Heatmap Matrix
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            Installation vs High-Energy Source Precursor Matrix
          </div>
          <div style="font-size:11.5px; color:var(--text-muted); display:flex; gap:10px; align-items:center;">
            <span>Legend:</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#e11d48; border-radius:2px;"></span> Critical (&ge;80)</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#f97316; border-radius:2px;"></span> High (60–79)</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#facc15; border-radius:2px;"></span> Medium (40–59)</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#10b981; border-radius:2px;"></span> Low (&lt;40)</span>
          </div>
        </div>

        <div class="heatmap-container">
          <table class="heatmap-table">
            <thead>
              <tr>
                <th class="row-label-col">OIL Installation / Asset</th>
                ${HEATMAP_DATA.categories.map(c => `<th>${c}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${HEATMAP_DATA.installations.map((inst, rowIdx) => `
                <tr>
                  <th class="row-label-col" style="font-weight:700; color:var(--text-primary); font-size:13px;">${inst}</th>
                  ${HEATMAP_DATA.matrix[rowIdx].map((val, colIdx) => {
                    const catName = HEATMAP_DATA.categories[colIdx];
                    return `
                      <td>
                        <div class="heatmap-cell ${getHeatmapColorClass(val)}" onclick="window.drillDownHeatmap('${inst}', '${catName}', ${val})">
                          <span>${val}</span>
                          <span class="heatmap-cell-sub">Index</span>
                        </div>
                      </td>
                    `;
                  }).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              Critical Barrier Breakdown Trends (Rolling 90 Days)
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:600">Missing / Bypassed Exclusion Zones (LSR-03 / LSR-07)</span>
              <span style="font-weight:700; color:var(--sif-critical)">38 Reports (↑ 14%)</span>
            </div>
            <div style="height:6px; background:var(--bg-subtle); border-radius:999px; overflow:hidden;">
              <div style="width:78%; height:100%; background:var(--sif-critical);"></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <span style="font-weight:600">Defeated Pressure Clamps & Flange Seals (LSR-09)</span>
              <span style="font-weight:700; color:var(--sif-high)">29 Reports (↑ 8%)</span>
            </div>
            <div style="height:6px; background:var(--bg-subtle); border-radius:999px; overflow:hidden;">
              <div style="width:62%; height:100%; background:var(--sif-high);"></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <span style="font-weight:600">Defective Gas Detectors & Absence of Standby Watch</span>
              <span style="font-weight:700; color:var(--sif-medium)">18 Reports (↓ 4%)</span>
            </div>
            <div style="height:6px; background:var(--bg-subtle); border-radius:999px; overflow:hidden;">
              <div style="width:40%; height:100%; background:var(--sif-medium);"></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Contractor SIF Precursor Profile
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:12.5px;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="font-weight:600">Assam Energy Services</span>
              <span class="sps-badge sps-critical">Precursor Index: 88</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="font-weight:600">Apex Petro Services</span>
              <span class="sps-badge sps-high">Precursor Index: 74</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="font-weight:600">Eastern Infra Pipeline</span>
              <span class="sps-badge sps-medium">Precursor Index: 52</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:6px;">
              <span style="font-weight:600">Brahmaputra Tank Cleaners</span>
              <span class="sps-badge sps-high">Precursor Index: 68</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-export-bi-pdf").addEventListener("click", exportOisdPdf);
  }

  window.drillDownHeatmap = function(installation, category, score) {
    showToast(`Drilling into ${installation} — ${category} (Precursor Index: ${score}). Loading triage worklist…`);
    // Pass the full installation name — the asset filter uses .includes() for partial matching
    state.filters.asset = installation;
    state.filters.severity = "all"; // Show all risk bands for drilldown context
    navigateTo("triage");
  };

  // --- MODULE 5: CAPA ESCALATION TRACKER ---
  function renderCapaView() {
    const openCapas = state.capaActions.filter(c => c.status === "Open" || c.status === "In Progress");
    const readyCapas = state.capaActions.filter(c => c.status === "Ready for Verification");
    const closedCapas = state.capaActions.filter(c => c.status === "Closed & Verified");

    viewport.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Precursor CAPA Escalation Tracker
          </h2>
          <p>Closed-loop corrective action tracking with statutory SLA clocks and SAP Plant Maintenance linkage</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="showToast('CAPA tickets are auto-generated from high-SPS triage worklist.')">
            + Manual Precursor CAPA
          </button>
        </div>
      </div>

      <div class="kanban-grid">
        <div class="kanban-col">
          <div class="kanban-header">
            <span class="kanban-title">In Progress / Field Action (${openCapas.length})</span>
          </div>
          ${openCapas.map(c => renderKanbanCard(c)).join("")}
        </div>

        <div class="kanban-col">
          <div class="kanban-header">
            <span class="kanban-title">Ready for Verification (${readyCapas.length})</span>
          </div>
          ${readyCapas.map(c => renderKanbanCard(c)).join("")}
        </div>

        <div class="kanban-col">
          <div class="kanban-header">
            <span class="kanban-title">Closed & Verified (${closedCapas.length})</span>
          </div>
          ${closedCapas.map(c => renderKanbanCard(c)).join("")}
        </div>

        <div class="kanban-col" style="background:var(--bg-surface); border-style:dashed;">
          <div class="kanban-header">
            <span class="kanban-title">SAP Sync Status</span>
          </div>
          <div style="font-size:12px; color:var(--text-secondary); display:flex; flex-direction:column; gap:10px;">
            <div style="padding:10px; background:var(--bg-subtle); border-radius:var(--radius-md);">
              <strong>SAP PM Gateway:</strong> Active (REST API 200 OK)
            </div>
            <div style="padding:10px; background:var(--bg-subtle); border-radius:var(--radius-md);">
              <strong>Last Sync Time:</strong> Just now (10:24 AM)
            </div>
            <div style="padding:10px; background:var(--bg-subtle); border-radius:var(--radius-md);">
              <strong>Pending Sync Queue:</strong> 0 items
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderKanbanCard(c) {
    return `
      <div class="kanban-card" onclick="window.openCapaDetail('${c.id}')">
        <div class="kanban-badge-row">
          <span class="badge" style="${c.priority === 'Critical' ? 'background:var(--sif-critical-bg); color:var(--sif-critical)' : 'background:var(--sif-high-bg); color:var(--sif-high)'}">
            ${c.priority} Precursor
          </span>
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted)">${c.id}</span>
        </div>
        <div class="kanban-title-text">${c.title}</div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:6px;">
          <strong>Asset:</strong> ${c.asset} • <strong>SAP:</strong> ${c.sap_work_order}
        </div>
        <div class="kanban-meta">
          <span>Owner: ${c.owner.split(' ')[0]}</span>
          <span style="color:var(--sif-critical); font-weight:600;">Due: ${c.due_date}</span>
        </div>
      </div>
    `;
  }

  window.openCapaDetail = function(capaId) {
    const capa = state.capaActions.find(c => c.id === capaId);
    if (!capa) return;

    modalBackdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="font-size:16px; font-weight:700;">${capa.id} — CAPA Lifecycle Verification</h3>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-md); font-size:13px;">
            <div style="font-weight:700; color:var(--text-primary)">${capa.title}</div>
            <div style="color:var(--text-muted); font-size:11.5px; margin-top:2px;">
              Asset: ${capa.asset} • SAP Work Order: <strong>${capa.sap_work_order}</strong> • Owner: ${capa.owner}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Corrective Action Status</label>
            <select class="form-select" id="capa-status-select">
              <option value="In Progress" ${capa.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Ready for Verification" ${capa.status === 'Ready for Verification' ? 'selected' : ''}>Ready for Verification</option>
              <option value="Closed & Verified" ${capa.status === 'Closed & Verified' ? 'selected' : ''}>Closed & Verified (Requires Second Reviewer)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Physical Barrier Verification Proof</label>
            <div style="border:2px dashed var(--border-strong); padding:20px; text-align:center; border-radius:var(--radius-md); background:var(--bg-subtle);">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted); margin-bottom:6px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <div style="font-size:12.5px; font-weight:600;">Uploaded Photo Evidence: <code>derrick_monkey_board_clamp_welded.jpg</code></div>
              <div style="font-size:11px; color:var(--text-muted)">Verified by Rig Toolpusher B. Saikia on 2026-09-03</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          <button class="btn btn-primary" id="btn-save-capa">Save Verification</button>
        </div>
      </div>
    `;
    modalBackdrop.classList.add("active");

    document.getElementById("btn-save-capa").addEventListener("click", () => {
      capa.status = document.getElementById("capa-status-select").value;
      closeModal();
      showToast("CAPA status updated & synchronized with SAP PM.");
      renderCapaView();
    });
  };

  // --- MODULE 6: ADMINISTRATION & MLOPS CONSOLE ---
  function renderAdminView() {
    viewport.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Administration & MLOps Model Governance
          </h2>
          <p>Model registry, concept drift surveillance, sensitivity calibration, and immutable audit logs</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              MLflow Model Registry & Deployment
            </div>
            <button class="btn btn-secondary btn-sm" onclick="showToast('Shadow canary evaluation active.')">Canary Sync</button>
          </div>
          <table class="custom-table" style="font-size:12.5px;">
            <thead>
              <tr>
                <th>Model Version</th>
                <th>Status</th>
                <th>Recall SLA</th>
                <th>Precision</th>
                <th>Drift Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${state.models.map(m => `
                <tr>
                  <td><strong>${m.version}</strong></td>
                  <td><span class="badge" style="${m.status.includes('Active') ? 'background:var(--sif-low-bg); color:var(--sif-low)' : 'background:var(--bg-subtle); color:var(--text-muted)'}">${m.status}</span></td>
                  <td style="font-weight:700; color:var(--sif-low); font-family:var(--font-mono)">${m.recall}</td>
                  <td style="font-family:var(--font-mono)">${m.precision}</td>
                  <td>${m.drift_status}</td>
                  <td>
                    ${m.status.includes('Active') ? '<span style="color:var(--text-muted)">Current</span>' : `<button class="btn btn-secondary btn-sm" onclick="showToast('Model switched to ${m.version}')">Promote</button>`}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              SPS Sensitivity Calibration Simulator
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div class="slider-container">
              <div class="slider-header">
                <span>Gravity & Rig Floor Loads Weight</span>
                <span id="val-gravity" style="font-family:var(--font-mono); font-weight:700;">${state.adminWeights.gravity}</span>
              </div>
              <input type="range" class="range-input" id="range-gravity" min="3.0" max="5.0" step="0.1" value="${state.adminWeights.gravity}"/>
            </div>

            <div class="slider-container">
              <div class="slider-header">
                <span>Pressurized Lines (E3) Weight</span>
                <span id="val-pressure" style="font-family:var(--font-mono); font-weight:700;">${state.adminWeights.pressure}</span>
              </div>
              <input type="range" class="range-input" id="range-pressure" min="3.0" max="5.0" step="0.1" value="${state.adminWeights.pressure}"/>
            </div>

            <div style="padding:12px; background:var(--hero-gradient); border-radius:var(--radius-md); font-size:12.5px;">
              <strong>Real-time Impact:</strong> Calibrated weights predict a <strong>+4.2%</strong> increase in high-precursor detection without alert fatigue.
            </div>

            <button class="btn btn-primary btn-sm" onclick="showToast('Sensitivity parameters published after dual-signoff.')">
              Submit Calibration for Dual Sign-off
            </button>
          </div>
        </div>
      </div>
    `;

    // Connect Sliders
    const rgGravity = document.getElementById("range-gravity");
    const valGravity = document.getElementById("val-gravity");
    rgGravity.addEventListener("input", (e) => {
      valGravity.innerText = e.target.value;
      state.adminWeights.gravity = parseFloat(e.target.value);
    });

    const rgPressure = document.getElementById("range-pressure");
    const valPressure = document.getElementById("val-pressure");
    rgPressure.addEventListener("input", (e) => {
      valPressure.innerText = e.target.value;
      state.adminWeights.pressure = parseFloat(e.target.value);
    });
  }

  // --- MODULE 7: NOTIFICATIONS ---
  function renderNotificationsView() {
    viewport.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Notification & Statutory Alert Center
          </h2>
          <p>Real-time countdown alerts, statutory regulatory notifications, and model drift updates</p>
        </div>
      </div>

      <div class="card">
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="padding:14px; border-left:4px solid var(--sif-critical); background:var(--bg-subtle); border-radius:var(--radius-sm); display:flex; justify-content:space-between;">
            <div>
              <div style="font-weight:700; color:var(--sif-critical);">URGENT: Critical SIF Precursor SLA Expiring</div>
              <div style="font-size:13px; margin-top:2px;">UAR-2026-0841 (Loose tagline on 3.5T drill pipe at Rig-04) has 1.8 hours remaining before 4-hour supervisor triage breach.</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="window.openReportDrawer('UAR-2026-0841')">Triage</button>
          </div>

          <div style="padding:14px; border-left:4px solid var(--sif-high); background:var(--bg-subtle); border-radius:var(--radius-sm); display:flex; justify-content:space-between;">
            <div>
              <div style="font-weight:700; color:var(--sif-high);">CAPA Assigned to Toolpusher</div>
              <div style="font-size:13px; margin-top:2px;">CAPA-2026-0419 dispatched to Moran GGS for flange clamp replacement. SAP WO-988421 generated.</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('capa')">View CAPA</button>
          </div>

          <div style="padding:14px; border-left:4px solid var(--accent-primary); background:var(--bg-subtle); border-radius:var(--radius-sm); display:flex; justify-content:space-between;">
            <div>
              <div style="font-weight:700; color:var(--accent-primary);">MLOps Active Learning Retraining Trigger</div>
              <div style="font-size:13px; margin-top:2px;">500 supervisor review records accumulated. Scheduled fine-tuning job v1.5.0 scheduled for Sunday off-peak.</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('admin')">Model Details</button>
          </div>
        </div>
      </div>
    `;
  }

  // --- MODULE 8: HELP & NON-PUNITIVE CHARTER ---
  function renderHelpView() {
    viewport.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            System Help, Standards & Non-Punitive Charter
          </h2>
          <p>Oil India Limited safety governance principles, Bradley Curve science, and statutory compliance guides</p>
        </div>
      </div>

      <div class="counterfactual-card" style="margin-bottom:24px; border-left-color:#10b981;">
        <div class="counterfactual-title" style="color:#059669;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Executive Non-Punitive Safety Declaration (PRD Section 11)
        </div>
        <div class="counterfactual-text" style="line-height:1.6;">
          "SIF-Sentinel is engineered exclusively to detect situational, technical, and process hazards. The system is strictly governed and architecturally prevented from generating individual worker risk scores, blame metrics, or disciplinary tracking. Worker identities are cryptographically redacted prior to feature extraction to protect our collective reporting culture."
          <div style="margin-top:6px; font-weight:700; color:var(--text-primary)">— Executive Director (HSE), Oil India Limited</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Safety Science: Why Decouple Outcome from Severity?</div>
          </div>
          <div style="font-size:13.5px; line-height:1.6; color:var(--text-secondary); display:flex; flex-direction:column; gap:10px;">
            <p>
              Traditional safety management classifies near-misses by what <em>actually happened</em> (e.g. "no injury"). Research by the Campbell Institute and DuPont demonstrates that <strong>over 80% of fatalities stem from high-energy hazards</strong> that showed repeated warning signs in low-consequence observations beforehand.
            </p>
            <p>
              SIF-Sentinel assesses <strong>potential consequence</strong> had timing or proximity varied by fractions of a second, directing CAPA resources to prevent catastrophic loss of life.
            </p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Power User Keyboard Accelerators</div>
          </div>
          <div style="font-size:12.5px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between;">
              <span>Move to Next / Previous Report</span>
              <kbd style="padding:2px 6px; background:var(--bg-subtle); border:1px solid var(--border-strong); border-radius:4px; font-family:var(--font-mono)">J / K</kbd>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Confirm & Escalate to CAPA</span>
              <kbd style="padding:2px 6px; background:var(--bg-subtle); border:1px solid var(--border-strong); border-radius:4px; font-family:var(--font-mono)">E</kbd>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Open Supervisor Override</span>
              <kbd style="padding:2px 6px; background:var(--bg-subtle); border:1px solid var(--border-strong); border-radius:4px; font-family:var(--font-mono)">O</kbd>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Batch Verify Low Risk</span>
              <kbd style="padding:2px 6px; background:var(--bg-subtle); border:1px solid var(--border-strong); border-radius:4px; font-family:var(--font-mono)">V</kbd>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Global Search Omnibox</span>
              <kbd style="padding:2px 6px; background:var(--bg-subtle); border:1px solid var(--border-strong); border-radius:4px; font-family:var(--font-mono)">Ctrl + K</kbd>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- HELPER UTILITIES ---
  function getSpsBadgeClass(tier) {
    switch (tier.toLowerCase()) {
      case "critical": return "sps-critical";
      case "high": return "sps-high";
      case "medium": return "sps-medium";
      case "low": return "sps-low";
      default: return "sps-medium";
    }
  }

  function getStatusBadgeStyle(status) {
    if (status === "Pending Triage") return "background:var(--sif-critical-bg); color:var(--sif-critical); border:1px solid var(--sif-critical-border)";
    if (status.includes("CAPA")) return "background:var(--sif-high-bg); color:var(--sif-high); border:1px solid var(--sif-high-border)";
    return "background:var(--sif-low-bg); color:var(--sif-low); border:1px solid var(--sif-low-border)";
  }

  function getHeatmapColorClass(val) {
    if (val >= 80) return "hm-extreme";
    if (val >= 60) return "hm-high";
    if (val >= 40) return "hm-medium";
    if (val >= 20) return "hm-low";
    return "hm-minimal";
  }

  function showToast(message) {
    let toast = document.getElementById("sif-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "sif-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--text-primary);
        color: var(--text-inverse);
        padding: 12px 20px;
        border-radius: var(--radius-md);
        font-size: 13.5px;
        font-weight: 600;
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: transform 0.2s ease, opacity 0.2s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="color:#10b981">✓</span> ${message}`;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 3200);
  }

  function exportOisdPdf() {
    showToast("Generating official OISD-154 & DGMS Leading Indicator Board Report...");
    setTimeout(() => {
      const summaryContent = `# OIL INDIA LIMITED — SIF-SENTINEL SAFETY INTELLIGENCE REPORT
Document ID: 26165-BOARD-OISD-2026-Q3
Date: ${new Date().toLocaleDateString()}
Status: Statutory Leading Indicator Disclosure

1. EXECUTIVE METRICS
- Total Safety Observations Screened: ${state.reports.length * 1250}
- Verified SIF Precursor Events: ${state.reports.filter(r => r.sps >= 60).length * 125}
- Precursor Rate: 6.8 per 10,000 Operating Hours
- Precursor CAPA Escalation Rate: 94.2% within 24 Hours

2. TOP CRITICAL ACCIDENT SCENARIOS IDENTIFIED
- Gravity & Suspended Load Swinging (Rig-04 / Derrick Monkey Board)
- 2800 PSI High Pressure Hydrocarbon Flange Clamp Bypass (Moran GGS-02)
- H2S / Confined Space Unmonitored Sludge Sump Entry (CTF Dikom)

Generated automatically by SIF-Sentinel Engine v1.4.2 in compliance with OISD-STD-154 and DGMS (OMR 2017).`;

      const blob = new Blob([summaryContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "OIL_SIF_Sentinel_OISD_Leading_Indicator_Report.md";
      a.click();
      URL.revokeObjectURL(url);
    }, 800);
  }

  // --- GLOBAL EVENT LISTENERS ---
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navigateTo(item.dataset.view);
    });
  });

  themeOceanicBtn.addEventListener("click", () => {
    state.theme = "oceanic";
    applyTheme();
    showToast("Switched to Executive Oceanic palette (Vibrant Blue, Teal, Slate)");
  });

  themeTerraBtn.addEventListener("click", () => {
    state.theme = "warm-terra";
    applyTheme();
    showToast("Switched to Warm Sunset / Terra palette (Warm Orange, Rose, Peach)");
  });

  modeToggleBtn.addEventListener("click", () => {
    state.mode = state.mode === "dark" ? "light" : "dark";
    applyTheme();
  });

  // Persona switch
  personaSelect.addEventListener("change", (e) => {
    state.persona = e.target.value;
    const nameEl = document.getElementById("current-user-name");
    const roleEl = document.getElementById("current-user-role");

    if (state.persona === "priya") {
      nameEl.innerText = "Priya Sharma";
      roleEl.innerText = "Field HSE Officer (Assam)";
      navigateTo("triage");
      showToast("Switched view to Field HSE Officer (Routed to Daily Triage)");
    } else if (state.persona === "rakesh") {
      nameEl.innerText = "Er. Rakesh Borah";
      roleEl.innerText = "Asset Manager (Moran GGS)";
      navigateTo("analytics");
      showToast("Switched view to Asset Manager (Routed to Leading BI Heatmaps)");
    } else if (state.persona === "iyer") {
      nameEl.innerText = "Dr. S. Iyer";
      roleEl.innerText = "Head of Process Safety";
      navigateTo("analytics");
      showToast("Switched view to Process Safety Head (Barrier Health)");
    } else {
      nameEl.innerText = "Ananya Mitra";
      roleEl.innerText = "MLOps & Safety Admin";
      navigateTo("admin");
      showToast("Switched view to MLOps Administrator");
    }
  });

  // Omnibox search
  omniboxInput.addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    if (state.currentView !== "triage") {
      navigateTo("triage");
    } else {
      renderTriageView();
    }
  });

  // Keyboard Shortcuts (PRD Section 18.4)
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      omniboxInput.focus();
    } else if (e.key === "Escape") {
      // Esc: close modal first, then drawer if modal already closed
      if (modalBackdrop.classList.contains("active")) {
        closeModal();
      } else if (state.drawerOpen) {
        closeDrawer();
      }
    } else if (e.key === "e" || e.key === "E") {
      // E: Escalate — ONLY when drawer is open (prevents navigation bar conflicts)
      if (state.drawerOpen && state.selectedReport) {
        e.preventDefault();
        openEscalateModal(state.selectedReport.id);
      }
    } else if (e.key === "o" || e.key === "O") {
      // O: Override — ONLY when drawer is open
      if (state.drawerOpen && state.selectedReport) {
        e.preventDefault();
        openOverrideModal(state.selectedReport.id);
      }
    } else if (e.key === "j" || e.key === "J") {
      // J: Open Next report in queue — ONLY when drawer is open
      if (state.drawerOpen) {
        e.preventDefault();
        openNextReport();
      }
    } else if (e.key === "k" || e.key === "K") {
      // K: Close drawer / go back to list — ONLY when drawer is open (and not Ctrl+K)
      if (state.drawerOpen && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        closeDrawer();
      }
    }
  });

  // Close SLA banner
  document.getElementById("btn-close-sla").addEventListener("click", () => {
    slaAlertBanner.style.display = "none";
  });

  document.getElementById("btn-triage-sla-action").addEventListener("click", () => {
    navigateTo("triage", { filter: "critical" });
  });

  // Initialize
  applyTheme();
  renderCurrentView();
});
