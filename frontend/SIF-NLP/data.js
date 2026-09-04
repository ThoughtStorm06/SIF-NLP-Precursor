// SIF-Sentinel Domain Data & Seed Repository
// Tailored for Oil India Limited (OIL) HSE Operations

const INITIAL_REPORTS = [
  {
    id: "UAR-2026-0841",
    title: "Loose tagline on 3.5T drill pipe transfer over active rig floor",
    type: "Unsafe Act",
    source: "Field HSE Mobile App",
    asset: "Rig-04 Dibrugarh (Upstream Drilling)",
    location: "Rig Floor / Rotary Table",
    contractor: "Assam Energy Services Ltd",
    reported_by: "Field Safety Steward (ID: ***382)",
    timestamp: "2026-09-03 08:42",
    recorded_severity: "No Injury / Near Miss",
    narrative: "During tripping out of 5\" drill pipe string, the crane rigger failed to attach secondary tagline. Pipe swung erratically 1.2 meters above drillers due to sudden wind gust. Worker had to jump back against the doghouse to avoid being struck in the chest. PTW was active but exclusion zone was not barricaded. Rig floor pe tagline loose tha, worker bal-bal bach gaya.",
    energy_source: "Gravity & Suspended Loads",
    energy_source_id: "E1",
    energy_level: "High",
    exposure_type: "Direct Line of Fire (< 1.5m)",
    barrier_status: "Bypassed / Missing Exclusion Zone",
    life_saving_rule: "LSR-03: Line of Fire & LSR-07: Safe Lifting",
    sps: 94,
    sps_tier: "Critical",
    sps_breakdown: {
      energy_score: 9.2,
      barrier_score: 9.5,
      exposure_score: 9.5,
      context_multiplier: 1.15
    },
    counterfactual: {
      could_be_fatal: true,
      reasoning: "A 3.5-ton suspended drill pipe moving under uncontrolled swinging load within 1.2m of personnel has immediate fatal crush or blunt-trauma potential had the worker reacted 0.5s later."
    },
    evidence_spans: [
      { text: "failed to attach secondary tagline", type: "barrier_failure" },
      { text: "Pipe swung erratically 1.2 meters above drillers", type: "energy_release" },
      { text: "worker had to jump back against the doghouse to avoid being struck in the chest", type: "line_of_fire" },
      { text: "exclusion zone was not barricaded", type: "barrier_failure" }
    ],
    status: "Pending Triage",
    sla_hours_remaining: 1.8,
    assigned_to: "Priya Sharma (Field HSE)",
    audit_trail: [
      { action: "Ingested via Mobile Gateway", user: "System", time: "2026-09-03 08:43" },
      { action: "NLP Model Inference v1.4.2 (SPS: 94 Assigned)", user: "SIF-Engine", time: "2026-09-03 08:43" },
      { action: "Evidence Tokens Verified (Anti-Hallucination: PASS)", user: "Guardrail", time: "2026-09-03 08:43" }
    ]
  },
  {
    id: "UCR-2026-0912",
    title: "Uncertified flange clamp on 2800 PSI gas manifold line",
    type: "Unsafe Condition",
    source: "EHS Desktop Portal",
    asset: "Moran Gas Gathering Station (GGS-02)",
    location: "High Pressure Separator Skid",
    contractor: "OIL In-House Maintenance",
    reported_by: "Mechanical Technician (ID: ***104)",
    timestamp: "2026-09-03 09:15",
    recorded_severity: "Minor Equipment Leak",
    narrative: "Observed improvised fabricated steel clamp installed over leaking 4-inch bypass line on High Pressure Gas Manifold (operating pressure 2800 PSI). Vibration from compressor unit C-201 caused noticeable flange shuddering and hissing sound. Gas detector showed 12% LEL in immediate vicinity of clamp. No hot work or repair permit logged.",
    energy_source: "Pressurized Lines & Process Gas",
    energy_source_id: "E3",
    energy_level: "High",
    exposure_type: "Continuous Hydrocarbon Release",
    barrier_status: "Defeated / Substandard Mechanical Repair",
    life_saving_rule: "LSR-09: Process Safety Barrier & Well Control",
    sps: 91,
    sps_tier: "Critical",
    sps_breakdown: {
      energy_score: 9.6,
      barrier_score: 9.2,
      exposure_score: 8.5,
      context_multiplier: 1.2
    },
    counterfactual: {
      could_be_fatal: true,
      reasoning: "Catastrophic rupture of 2800 PSI gas line at GGS separator skid with 12% LEL creates vapor cloud explosion (VCE) or projectile hazard with high fatality potential for station operators."
    },
    evidence_spans: [
      { text: "improvised fabricated steel clamp installed over leaking 4-inch bypass line", type: "barrier_failure" },
      { text: "operating pressure 2800 PSI", type: "energy_release" },
      { text: "Gas detector showed 12% LEL in immediate vicinity", type: "line_of_fire" }
    ],
    status: "Escalated to CAPA",
    capa_id: "CAPA-2026-0419",
    sla_hours_remaining: 0,
    assigned_to: "Er. Rakesh Borah",
    audit_trail: [
      { action: "Ingested via EHS Portal", user: "System", time: "2026-09-03 09:16" },
      { action: "AI Classified Critical Precursor (SPS: 91)", user: "SIF-Engine", time: "2026-09-03 09:16" },
      { action: "Escalated to CAPA #CAPA-2026-0419", user: "Priya Sharma", time: "2026-09-03 10:02" }
    ]
  },
  {
    id: "NM-2026-1104",
    title: "Entry into crude storage tank without continuous H2S monitoring",
    type: "Near Miss",
    source: "Field HSE Mobile App",
    asset: "Central Tank Farm (CTF) Dikom",
    location: "Storage Tank TK-104 Manway",
    contractor: "Brahmaputra Industrial Tank Cleaning",
    reported_by: "Safety Officer (ID: ***911)",
    timestamp: "2026-09-03 11:30",
    recorded_severity: "No Injury / Work Stopped",
    narrative: "Two cleaning crew members entered Tank TK-104 sludge sump through lower shell manway. Portable 4-gas monitor was left sitting outside on tool tray instead of carried inside. Standby rescue watch had stepped away to fetch drinking water. Initial gas test was done at 07:00 AM, but no continuous forced ventilation was verified. Supervisor halted work immediately upon arrival. Mud pit aur tank andar gas test bina entry ho gaya tha.",
    energy_source: "Confined Space & Toxic Atmosphere",
    energy_source_id: "E8",
    energy_level: "High",
    exposure_type: "Direct Toxic Inhalation Exposure",
    barrier_status: "Missing Standby Watch & Atmospheric Monitor",
    life_saving_rule: "LSR-05: Confined Space Entry",
    sps: 88,
    sps_tier: "Critical",
    sps_breakdown: {
      energy_score: 9.0,
      barrier_score: 9.4,
      exposure_score: 8.8,
      context_multiplier: 1.15
    },
    counterfactual: {
      could_be_fatal: true,
      reasoning: "Unmonitored entry into unventilated sour crude sludge tank with no standby watcher leads to rapid H2S or oxygen-deficient asphyxiation with dual fatality probability before rescue can be initiated."
    },
    evidence_spans: [
      { text: "entered Tank TK-104 sludge sump through lower shell manway", type: "line_of_fire" },
      { text: "Portable 4-gas monitor was left sitting outside", type: "barrier_failure" },
      { text: "Standby rescue watch had stepped away", type: "barrier_failure" },
      { text: "no continuous forced ventilation was verified", type: "barrier_failure" }
    ],
    status: "Pending Triage",
    sla_hours_remaining: 3.2,
    assigned_to: "Priya Sharma (Field HSE)",
    audit_trail: [
      { action: "Ingested via Field Sync", user: "System", time: "2026-09-03 11:31" },
      { action: "AI Classification: Critical (SPS: 88)", user: "SIF-Engine", time: "2026-09-03 11:31" }
    ]
  },
  {
    id: "UAR-2026-0792",
    title: "Grinding hot work conducted within 3m of open condensate drain pit",
    type: "Unsafe Act",
    source: "EHS Desktop Portal",
    asset: "Duliajan Gas Processing Plant",
    location: "Condensate Stabilization Unit",
    contractor: "Apex Petro Services",
    reported_by: "Plant Operator (ID: ***552)",
    timestamp: "2026-09-02 14:10",
    recorded_severity: "No Injury / Permit Cancelled",
    narrative: "Contractor fabricator was cutting support bracket using angle grinder producing shower of hot sparks toward open condensate skimmer pit (Zone 1 hazardous area). Hot Work permit was issued for workshop area but contractor moved operation to live plant skid without re-validation or fire blanket shielding. Gas sniffer showed hydrocarbon traces at edge of grating.",
    energy_source: "Thermal & Hydrocarbon Flash Fire",
    energy_source_id: "E6",
    energy_level: "High",
    exposure_type: "Ignition Source in Flammable Vapor Zone",
    barrier_status: "Missing Fire Blankets & Invalid PTW",
    life_saving_rule: "LSR-06: Hot Work & LSR-01: Work Authorization",
    sps: 78,
    sps_tier: "High",
    sps_breakdown: {
      energy_score: 8.5,
      barrier_score: 8.2,
      exposure_score: 7.8,
      context_multiplier: 1.1
    },
    counterfactual: {
      could_be_fatal: true,
      reasoning: "Grinding sparks landing directly into volatile condensate drain pit can trigger flash fire / vapor ignition causing severe 3rd-degree burn fatalities in confined plant structure."
    },
    evidence_spans: [
      { text: "angle grinder producing shower of hot sparks toward open condensate skimmer pit", type: "energy_release" },
      { text: "Zone 1 hazardous area", type: "line_of_fire" },
      { text: "moved operation to live plant skid without re-validation or fire blanket shielding", type: "barrier_failure" }
    ],
    status: "Pending Triage",
    sla_hours_remaining: 18.5,
    assigned_to: "Priya Sharma (Field HSE)",
    audit_trail: [
      { action: "Ingested via EHS Portal", user: "System", time: "2026-09-02 14:15" },
      { action: "AI Classification: High SIF Precursor (SPS: 78)", user: "SIF-Engine", time: "2026-09-02 14:15" }
    ]
  },
  {
    id: "UCR-2026-0685",
    title: "Corroded top-handrail and missing toe-board at monkey board (24m derrick)",
    type: "Unsafe Condition",
    source: "Field HSE Mobile App",
    asset: "Rig-07 Naharkatiya (Drilling)",
    location: "Mast / Monkey Board Elevator",
    contractor: "OIL Rig Engineering",
    reported_by: "Derrickman (ID: ***233)",
    timestamp: "2026-09-02 16:40",
    recorded_severity: "No Injury / Guard Required",
    narrative: "During derrick pre-climb inspection, derrickman found severe rust corrosion at monkey board latch bracket (elevation 24 meters). The weld cracked under hand pressure. 1.5m section of kick-plate/toe-board missing, meaning dropped wrenches or pipe dope cans have direct drop path to sub-structure where mud loggers operate.",
    energy_source: "Gravity & Suspended Loads",
    energy_source_id: "E1",
    energy_level: "High",
    exposure_type: "Fall from Height / Dropped Object Sub-Structure",
    barrier_status: "Degraded Physical Barrier (Corroded Latch)",
    life_saving_rule: "LSR-04: Working at Height",
    sps: 72,
    sps_tier: "High",
    sps_breakdown: {
      energy_score: 8.2,
      barrier_score: 7.8,
      exposure_score: 7.0,
      context_multiplier: 1.1
    },
    counterfactual: {
      could_be_fatal: true,
      reasoning: "Fall from 24m derrick height or heavy tool dropped through missing toe-board has definite fatal outcome for personnel on the rig floor."
    },
    evidence_spans: [
      { text: "severe rust corrosion at monkey board latch bracket (elevation 24 meters)", type: "energy_release" },
      { text: "weld cracked under hand pressure", type: "barrier_failure" },
      { text: "1.5m section of kick-plate/toe-board missing", type: "barrier_failure" },
      { text: "direct drop path to sub-structure where mud loggers operate", type: "line_of_fire" }
    ],
    status: "Verified / In CAPA",
    capa_id: "CAPA-2026-0391",
    sla_hours_remaining: 0,
    assigned_to: "Er. Rakesh Borah",
    audit_trail: [
      { action: "Ingested via Mobile", user: "System", time: "2026-09-02 16:42" },
      { action: "AI Classification: High (SPS: 72)", user: "SIF-Engine", time: "2026-09-02 16:42" }
    ]
  },
  {
    id: "UAR-2026-0520",
    title: "Forklift operating with obstructed forward visibility during mud sack offloading",
    type: "Unsafe Act",
    source: "Field HSE Mobile App",
    asset: "Central Warehouse Duliajan",
    location: "Chemical Staging Yard",
    contractor: "LogiTrans India",
    reported_by: "Store Keeper (ID: ***812)",
    timestamp: "2026-09-01 10:15",
    recorded_severity: "Near Miss",
    narrative: "Forklift driver was transporting 4-high stacked pallets of bentonite powder forward down main pedestrian corridor. Driver could not see forward; no spotter or banksman present. Pedestrian contractor jumped aside into gravel ditch when forklift reversed unexpectedly. Reverse beeper was non-functional. Driver ko aage rasta nahi dikh raha tha.",
    energy_source: "Vehicles & Mobile Equipment",
    energy_source_id: "E9",
    energy_level: "Medium",
    exposure_type: "Pedestrian Collision in Blind Spot",
    barrier_status: "Defective Audio Alarm & Missing Banksman",
    life_saving_rule: "LSR-08: Driving & Heavy Mobile Equipment",
    sps: 58,
    sps_tier: "Medium",
    sps_breakdown: {
      energy_score: 6.5,
      barrier_score: 6.2,
      exposure_score: 6.0,
      context_multiplier: 1.0
    },
    counterfactual: {
      could_be_fatal: false,
      reasoning: "Struck-by 3-ton forklift at low yard speed can cause severe crush fractures, though fatality risk is moderate given low traveling velocity."
    },
    evidence_spans: [
      { text: "transporting 4-high stacked pallets of bentonite powder forward down main pedestrian corridor", type: "energy_release" },
      { text: "no spotter or banksman present", type: "barrier_failure" },
      { text: "Reverse beeper was non-functional", type: "barrier_failure" }
    ],
    status: "Pending Triage",
    sla_hours_remaining: 84.0,
    assigned_to: "Priya Sharma (Field HSE)",
    audit_trail: [
      { action: "Ingested via Mobile Gateway", user: "System", time: "2026-09-01 10:20" },
      { action: "AI Classification: Medium Precursor (SPS: 58)", user: "SIF-Engine", time: "2026-09-01 10:20" }
    ]
  },
  {
    id: "UCR-2026-0411",
    title: "Temporary 415V electrical cable draped across wet drainage ditch",
    type: "Unsafe Condition",
    source: "EHS Desktop Portal",
    asset: "Brahmaputra Pipeline River Crossing (ROW-08)",
    location: "HDD Drilling Pad",
    contractor: "Eastern Infra Pipeline Works",
    reported_by: "Electrical Inspector (ID: ***401)",
    timestamp: "2026-09-01 15:20",
    recorded_severity: "No Injury / Power Tripped",
    narrative: "A 415V armored power supply cable feeding hydrotest pump was found submersed in standing rainwater drain. Outer PVC sheath had deep cuts exposing inner insulation. Cable had no aerial support or protective pipe sleeve across equipment crossing path. RCCB tripping mechanism tested sluggish.",
    energy_source: "Electrical & Arc Flash Hazard",
    energy_source_id: "E4",
    energy_level: "Medium",
    exposure_type: "Wet Ground Energization Potential",
    barrier_status: "Damaged Cable Insulation & Ineffective RCCB",
    life_saving_rule: "LSR-02: Energy Isolation (LOTO) & Electrical Safety",
    sps: 54,
    sps_tier: "Medium",
    sps_breakdown: {
      energy_score: 6.8,
      barrier_score: 5.8,
      exposure_score: 5.2,
      context_multiplier: 1.0
    },
    counterfactual: {
      could_be_fatal: true,
      reasoning: "Contact with energized standing water or frayed 415V cable in wet rain environment has significant ventricular fibrillation / electrocution hazard."
    },
    evidence_spans: [
      { text: "415V armored power supply cable feeding hydrotest pump was found submersed in standing rainwater", type: "energy_release" },
      { text: "Outer PVC sheath had deep cuts exposing inner insulation", type: "barrier_failure" },
      { text: "RCCB tripping mechanism tested sluggish", type: "barrier_failure" }
    ],
    status: "Pending Triage",
    sla_hours_remaining: 92.0,
    assigned_to: "Priya Sharma (Field HSE)",
    audit_trail: [
      { action: "Ingested via Portal", user: "System", time: "2026-09-01 15:22" },
      { action: "AI Classification: Medium (SPS: 54)", user: "SIF-Engine", time: "2026-09-01 15:22" }
    ]
  },
  {
    id: "UCR-2026-0319",
    title: "Empty chemical drums stacked unevenly behind admin block",
    type: "Unsafe Condition",
    source: "Field HSE Mobile App",
    asset: "CTF Dikom Administration",
    location: "Rear Compound Wall",
    contractor: "OIL In-House Services",
    reported_by: "Admin Executive (ID: ***112)",
    timestamp: "2026-08-31 11:00",
    recorded_severity: "No Injury / Housekeeping",
    narrative: "Empty lubricant and solvent plastic drums stacked 3 high without wooden battens or strapping. Top drum slid off when stray dog brushed against pile. Drums are thoroughly washed and dry.",
    energy_source: "Gravity & Suspended Loads",
    energy_source_id: "E1",
    energy_level: "Low",
    exposure_type: "Casual Walkway Contact",
    barrier_status: "No Strapping",
    life_saving_rule: "Housekeeping & Yard Storage",
    sps: 18,
    sps_tier: "Low",
    sps_breakdown: {
      energy_score: 2.1,
      barrier_score: 2.0,
      exposure_score: 1.8,
      context_multiplier: 1.0
    },
    counterfactual: {
      could_be_fatal: false,
      reasoning: "Empty 5kg plastic drum falling from 1.5m poses negligible risk of severe injury. Pure housekeeping observation."
    },
    evidence_spans: [
      { text: "Empty lubricant and solvent plastic drums stacked 3 high", type: "energy_release" },
      { text: "Drums are thoroughly washed and dry", type: "mitigation" }
    ],
    status: "Closed (Bulk)",
    sla_hours_remaining: 0,
    assigned_to: "Priya Sharma (Field HSE)",
    audit_trail: [
      { action: "Ingested via Mobile", user: "System", time: "2026-08-31 11:05" },
      { action: "AI Classified Low SPS (18)", user: "SIF-Engine", time: "2026-08-31 11:05" },
      { action: "Bulk Verified & Closed", user: "Priya Sharma", time: "2026-08-31 17:00" }
    ]
  },
  {
    id: "UAR-2026-0294",
    title: "Operator not wearing safety glasses while checking sample drain valve",
    type: "Unsafe Act",
    source: "Field HSE Mobile App",
    asset: "Moran GGS-01",
    location: "Sampling Header 4",
    contractor: "OIL Operations",
    reported_by: "HSE Auditor (ID: ***605)",
    timestamp: "2026-08-30 09:30",
    recorded_severity: "No Injury",
    narrative: "Operator cracked sample needle valve on water cut header wearing helmet and boots but safety glasses were pushed on top of hard hat. Line was low pressure cold water emulsion (15 PSI).",
    energy_source: "Chemical & Eye Splashing",
    energy_source_id: "E7",
    energy_level: "Low",
    exposure_type: "Eye Splashing (< 0.5m)",
    barrier_status: "PPE Not Deployed",
    life_saving_rule: "Personal Protective Equipment",
    sps: 22,
    sps_tier: "Low",
    sps_breakdown: {
      energy_score: 2.5,
      barrier_score: 2.2,
      exposure_score: 2.0,
      context_multiplier: 1.0
    },
    counterfactual: {
      could_be_fatal: false,
      reasoning: "Low pressure ambient water-cut liquid could cause minor eye irritation, non-life-altering."
    },
    evidence_spans: [
      { text: "safety glasses were pushed on top of hard hat", type: "barrier_failure" },
      { text: "low pressure cold water emulsion (15 PSI)", type: "mitigation" }
    ],
    status: "Closed (Bulk)",
    sla_hours_remaining: 0,
    assigned_to: "Priya Sharma (Field HSE)",
    audit_trail: [
      { action: "Ingested via Mobile", user: "System", time: "2026-08-30 09:32" },
      { action: "AI Classified Low SPS (22)", user: "SIF-Engine", time: "2026-08-30 09:32" },
      { action: "Bulk Verified & Closed", user: "Priya Sharma", time: "2026-08-30 17:00" }
    ]
  }
];

const TAXONOMY_HIGH_ENERGY = [
  { id: "E1", name: "Gravity & Suspended Loads", icon: "anchor", weight: 4.0, count: 42 },
  { id: "E2", name: "Mechanical & Rotating Machinery", icon: "cog", weight: 3.8, count: 31 },
  { id: "E3", name: "Pressurized Lines & Gases", icon: "gauge-high", weight: 4.2, count: 58 },
  { id: "E4", name: "Electrical & Static Arc", icon: "bolt", weight: 3.5, count: 24 },
  { id: "E5", name: "Process Hydrocarbon Release", icon: "fire", weight: 4.5, count: 47 },
  { id: "E6", name: "Thermal & Cryogenic Heat", icon: "temperature-high", weight: 3.2, count: 19 },
  { id: "E7", name: "Toxic Chemicals & H2S Gas", icon: "skull-crossbones", weight: 4.4, count: 28 },
  { id: "E8", name: "Confined Space & Atmosphere", icon: "dungeon", weight: 4.3, count: 21 },
  { id: "E9", name: "Vehicles & Mobile Equipment", icon: "truck-monster", weight: 3.4, count: 36 },
  { id: "E10", name: "Excavation & Ground Subsidence", icon: "trowel-bricks", weight: 3.1, count: 14 },
  { id: "E11", name: "Marine & River Crossing Water", icon: "water", weight: 3.0, count: 9 }
];

const LIFE_SAVING_RULES = [
  { id: "LSR-01", name: "Work Authorization & PTW", icon: "file-signature" },
  { id: "LSR-02", name: "Energy Isolation (LOTO)", icon: "lock" },
  { id: "LSR-03", name: "Line of Fire Avoidance", icon: "crosshairs" },
  { id: "LSR-04", name: "Working at Height", icon: "mountain" },
  { id: "LSR-05", name: "Confined Space Entry", icon: "door-closed" },
  { id: "LSR-06", name: "Hot Work & Ignition Control", icon: "fire-flame-curved" },
  { id: "LSR-07", name: "Safe Mechanical Lifting", icon: "boxes-stacked" },
  { id: "LSR-08", name: "Driving & Vehicle Safety", icon: "car" },
  { id: "LSR-09", name: "Well Control & Process Safety Barrier", icon: "shield-halved" }
];

const HEATMAP_DATA = {
  installations: [
    "Rig-04 Dibrugarh",
    "Rig-07 Naharkatiya",
    "Moran GGS-02",
    "CTF Dikom",
    "Duliajan Gas Plant",
    "Pipeline ROW-08"
  ],
  categories: ["E1 Gravity", "E3 Pressure", "E5 Hydrocarbon", "E7 H2S/Chem", "E8 Confined", "E9 Vehicles"],
  matrix: [
    // [E1, E3, E5, E7, E8, E9]
    [84, 45, 78, 20, 12, 60], // Rig-04 Dibrugarh
    [72, 38, 55, 30, 15, 42], // Rig-07 Naharkatiya
    [25, 91, 88, 70, 40, 18], // Moran GGS-02 (High pressure & gas)
    [32, 64, 76, 88, 85, 50], // CTF Dikom (Confined space & H2S)
    [20, 78, 62, 50, 30, 22], // Duliajan Gas Plant
    [50, 48, 15, 10, 15, 74]  // Pipeline ROW-08 (Vehicles & Heavy plant)
  ]
};

const MLOPS_MODELS = [
  { version: "v1.4.2-oil-transformer", status: "Active in Production", accuracy: "93.8%", recall: "92.4%", precision: "75.8%", f1: "83.3%", records_scored: "48,290", last_retrained: "2026-08-28", drift_status: "Stable (PSI: 0.04)" },
  { version: "v1.4.1-oil-transformer", status: "Retired (Rollback Candidate)", accuracy: "91.2%", recall: "90.1%", precision: "72.0%", f1: "80.0%", records_scored: "124,050", last_retrained: "2026-07-15", drift_status: "Superseded" },
  { version: "v1.5.0-shadow-eval", status: "Shadow Mode (Evaluating)", accuracy: "94.6%", recall: "93.9%", precision: "78.2%", f1: "85.3%", records_scored: "1,420", last_retrained: "2026-09-02", drift_status: "Canary Stage" }
];

const CAPA_ACTIONS = [
  { id: "CAPA-2026-0419", source_report: "UCR-2026-0912", title: "Replace temporary flange clamp with welded ASME B16.5 spool", owner: "K. Baruah (Mechanical Maint)", due_date: "2026-09-05", status: "In Progress", priority: "Critical", asset: "Moran GGS-02", sap_work_order: "WO-988421", verification_required: true },
  { id: "CAPA-2026-0391", source_report: "UCR-2026-0685", title: "Renew monkey board latch bracket & install derrick kick-plate", owner: "B. Saikia (Rig Toolpusher)", due_date: "2026-09-04", status: "Ready for Verification", priority: "High", asset: "Rig-07 Naharkatiya", sap_work_order: "WO-987102", verification_required: true },
  { id: "CAPA-2026-0370", source_report: "NM-2026-0820", title: "Retest & calibrate stationary H2S sensors in compressor bay 3", owner: "Instrument Team", due_date: "2026-08-30", status: "Closed & Verified", priority: "High", asset: "CTF Dikom", sap_work_order: "WO-984400", verification_required: true }
];
