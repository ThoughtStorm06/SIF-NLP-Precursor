import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.resolve(__dirname, '../../sample.csv');
const outputPath = path.resolve(__dirname, '../database/seed/seedData.json');

const OIL_ASSETS = [
  'Rig-04 Dibrugarh (Upstream Drilling)',
  'Moran Gas Gathering Station (GGS-02)',
  'Duliajan Processing Plant',
  'Digboi Refinery Complex',
  'Makum High Pressure Station',
  'Jorhat Oil Storage Terminal',
  'Naharkatia Production Facility',
  'Tinsukia Compressor Station'
];

function parsePythonDict(str) {
  if (!str) return null;
  try {
    // Replace single quotes with double quotes, True/False with true/false
    let jsonStr = str
      .replace(/'/g, '"')
      .replace(/True/g, 'true')
      .replace(/False/g, 'false')
      .replace(/None/g, 'null');
    return JSON.parse(jsonStr);
  } catch (err) {
    return str;
  }
}

function titleCase(str) {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function convert() {
  console.log(`Reading CSV from ${csvPath}...`);
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf8');
  // Split lines respecting quoted newlines
  const rawLines = fileContent.split(/\r?\n/);
  
  // Clean multiline CSV rows
  const lines = [];
  let buffer = '';
  for (const line of rawLines) {
    if (!line && !buffer) continue;
    buffer += (buffer ? '\n' : '') + line;
    const quoteCount = (buffer.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      lines.push(buffer);
      buffer = '';
    }
  }

  if (lines.length === 0) {
    console.error('CSV is empty');
    process.exit(1);
  }

  const header = parseCSVLine(lines[0]);
  console.log('Header fields:', header);

  const reports = [];
  let idCounter = 1;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = parseCSVLine(lines[i]);
    if (row.length < header.length) continue;

    const case_id = row[0] || `CSV-${idCounter++}`;
    const narrative = (row[1] || '').replace(/\s+/g, ' ').trim();
    const title = (row[2] || '').replace(/\s+/g, ' ').trim();
    const energy_source = titleCase(row[3] || 'General');
    const energy_level = titleCase(row[4] || 'Moderate');
    const exposure_type = titleCase(row[5] || 'Proximity');
    const barrier_status = titleCase(row[6] || 'Absent');
    const life_saving_rule = titleCase(row[7] || 'General Safety');
    const counterfactual_could_be_fatal = row[8] === 'True' || row[8] === 'true';
    const counterfactual_reasoning = (row[9] || '').replace(/\s+/g, ' ').trim();
    const evidence_phrase = (row[10] || '').replace(/\s+/g, ' ').trim();
    const raw_severity = parsePythonDict(row[11]);
    const confidence = parseFloat(row[12]) || 0.90;
    const evidence_verified = row[13] === 'True' || row[13] === 'true';
    const sps = parseFloat(row[14]) || 50.0;
    const sps_breakdown_raw = parsePythonDict(row[15]);

    // Format recorded severity
    let recorded_severity = 'Reported Incident';
    if (typeof raw_severity === 'object' && raw_severity !== null) {
      const vals = Object.values(raw_severity);
      if (vals.length > 0) recorded_severity = titleCase(vals[0]);
    } else if (typeof raw_severity === 'string') {
      recorded_severity = titleCase(raw_severity);
    }

    // Determine SPS Tier
    let sps_tier = 'Medium';
    if (sps >= 75.0) sps_tier = 'Critical';
    else if (sps >= 60.0) sps_tier = 'High';
    else if (sps >= 40.0) sps_tier = 'Medium';
    else sps_tier = 'Low';

    // Parse SPS sub-scores
    let energy_score = 3;
    let barrier_score = 2;
    let exposure_score = 2;
    let counterfactual_pts = 3;

    if (sps_breakdown_raw && typeof sps_breakdown_raw === 'object') {
      energy_score = sps_breakdown_raw.energy_level_pts ?? energy_score;
      barrier_score = sps_breakdown_raw.barrier_pts ?? barrier_score;
      exposure_score = sps_breakdown_raw.exposure_pts ?? exposure_score;
      counterfactual_pts = sps_breakdown_raw.counterfactual_pts ?? counterfactual_pts;
    }

    // Pick deterministic asset based on case_id string hash
    let hash = 0;
    for (let charIdx = 0; charIdx < case_id.length; charIdx++) {
      hash = (hash * 31 + case_id.charCodeAt(charIdx)) % OIL_ASSETS.length;
    }
    const asset = OIL_ASSETS[Math.abs(hash)];

    // Build evidence_spans array
    const evidence_spans = [];
    if (evidence_phrase) {
      evidence_spans.push({
        text: evidence_phrase,
        type: 'energy_release',
        verified: evidence_verified
      });
    }

    // Build audit trail
    const audit_trail = [
      {
        action: `Ingested report #${case_id} from Safety Records Gateway`,
        user: 'System Ingestion',
        time: '2026-09-04 10:00'
      },
      {
        action: `SIF-Sentinel NLP Model Inference (SPS: ${sps.toFixed(1)} -> Tier: ${sps_tier})`,
        user: 'SIF-Engine v1.4.2',
        time: '2026-09-04 10:00'
      }
    ];

    reports.push({
      id: case_id,
      title: title || `Incident Report #${case_id}`,
      narrative: narrative,
      energy_source,
      energy_level,
      exposure_type,
      barrier_status,
      life_saving_rule,
      recorded_severity,
      confidence,
      sps,
      sps_tier,
      sps_breakdown: {
        energy_score,
        barrier_score,
        exposure_score,
        counterfactual_pts,
        context_multiplier: 1.0
      },
      counterfactual: {
        could_be_fatal: counterfactual_could_be_fatal,
        reasoning: counterfactual_reasoning
      },
      evidence_spans,
      status: 'Pending Triage',
      asset,
      timestamp: '2026-09-04 10:00',
      sla_hours_remaining: sps_tier === 'Critical' ? 2.0 : sps_tier === 'High' ? 6.0 : 24.0,
      audit_trail,
      similar_reports: []
    });
  }

  // Preserve existing taxonomy and CAPA actions if present
  let existingTaxonomy = [
    { id: 'E1', name: 'Gravity Fall', category: 'energy_source', icon: 'ArrowDown' },
    { id: 'E2', name: 'Thermal', category: 'energy_source', icon: 'Flame' },
    { id: 'E3', name: 'Motion Vehicle Traffic', category: 'energy_source', icon: 'Truck' },
    { id: 'E4', name: 'Mechanical Moving Equipment', category: 'energy_source', icon: 'Cog' },
    { id: 'E5', name: 'Electrical', category: 'energy_source', icon: 'Zap' },
    { id: 'E6', name: 'Mechanical Caught In Between', category: 'energy_source', icon: 'ShieldAlert' }
  ];

  // Generate rich CAPA items linked directly to sample.csv records
  const sampleCapaActions = [
    {
      id: 'CAPA-2026-001',
      source_report: reports[0]?.id || '201079928',
      title: 'Standardize Hot Radiator Cap Pressure Isolation Controls',
      owner: 'Er. Rakesh Borah (Site Engineer)',
      due_date: '2026-09-03',
      status: 'In Progress',
      priority: reports[0]?.sps_tier || 'Critical',
      asset: reports[0]?.asset || 'Rig-04 Dibrugarh (Upstream Drilling)',
      sap_work_order: 'SAP-WO-2026-8819',
      sla_window_hours: 24,
      sla_hours_remaining: -4.5,
      sla_status: 'Overdue',
      evidence_phrase: reports[0]?.evidence_spans?.[0]?.text || "Employee's foot dislodged the cooling system radiator cap under pressure",
      sps: reports[0]?.sps || 87.5,
      sps_tier: reports[0]?.sps_tier || 'Critical',
      energy_source: reports[0]?.energy_source || 'Thermal',
      life_saving_rule: reports[0]?.life_saving_rule || 'PPE & Pressure Isolation',
      barrier_status: reports[0]?.barrier_status || 'Absent',
      action_description: 'Install mandatory secondary safety latching pins on all forklift coolant reservoir caps across upstream drilling rigs.',
      owner_notes: 'Latching pins dispatched from central warehouse; awaiting site installation team.',
      reviewer_comments: '',
      created_at: '2026-09-03 10:00',
      history: [
        { timestamp: '2026-09-03 10:00', actor: 'Priya Sharma (Field HSE)', action: 'Escalated from Report #201079928 to CAPA' },
        { timestamp: '2026-09-03 14:00', actor: 'Er. Rakesh Borah', action: 'Assigned owner & updated status to In Progress' }
      ]
    },
    {
      id: 'CAPA-2026-002',
      source_report: reports[1]?.id || '202561825',
      title: 'Install Trailer Edge Fall Protection & Work Platform Barriers',
      owner: 'Vikramjit Singh (Contractor Safety Coordinator)',
      due_date: '2026-09-04',
      status: 'In Progress',
      priority: reports[1]?.sps_tier || 'High',
      asset: reports[1]?.asset || 'Moran Gas Gathering Station (GGS-02)',
      sap_work_order: 'SAP-WO-2026-9042',
      sla_window_hours: 48,
      sla_hours_remaining: 3.5,
      sla_status: 'Near Breach',
      evidence_phrase: reports[1]?.evidence_spans?.[0]?.text || 'Employee fell 57 inches from flatbed trailer onto ground with no fall protection',
      sps: reports[1]?.sps || 56.2,
      sps_tier: reports[1]?.sps_tier || 'High',
      energy_source: reports[1]?.energy_source || 'Gravity Fall',
      life_saving_rule: reports[1]?.life_saving_rule || 'Working at Height',
      barrier_status: reports[1]?.barrier_status || 'Absent',
      action_description: 'Erect portable perimeter guardrails for flatbed unloading operations and issue 100% tie-off lanyards.',
      owner_notes: 'Guardrail modules installed on 2 flatbeds; final inspection scheduled today.',
      reviewer_comments: '',
      created_at: '2026-09-03 08:00',
      history: [
        { timestamp: '2026-09-03 08:00', actor: 'Priya Sharma (Field HSE)', action: 'Escalated from Report #202561825 to CAPA' }
      ]
    },
    {
      id: 'CAPA-2026-003',
      source_report: reports[2]?.id || '200361855',
      title: 'Deploy Automated Radar Traffic Barriers & Highway Exclusion Zones',
      owner: 'Anurag Dutta (Logistics Lead)',
      due_date: '2026-09-05',
      status: 'Ready for Verification',
      priority: reports[2]?.sps_tier || 'Critical',
      asset: reports[2]?.asset || 'Duliajan Processing Plant',
      sap_work_order: 'SAP-WO-2026-9110',
      sla_window_hours: 24,
      sla_hours_remaining: 18.0,
      sla_status: 'On Track',
      evidence_phrase: reports[2]?.evidence_spans?.[0]?.text || 'Vehicle traveling at 55 mph veered into turn lane striking workers',
      sps: reports[2]?.sps || 81.2,
      sps_tier: reports[2]?.sps_tier || 'Critical',
      energy_source: reports[2]?.energy_source || 'Motion Vehicle Traffic',
      life_saving_rule: reports[2]?.life_saving_rule || 'Mobile Equipment Driving',
      barrier_status: reports[2]?.barrier_status || 'Partially Functioning',
      action_description: 'Place mobile crash attenuators and solar speed radar display signs on active roadside fiber optic work sites.',
      owner_notes: 'Attenuator trucks deployed and operational at turn lanes. Ready for closure verification.',
      reviewer_comments: '',
      created_at: '2026-09-04 06:00',
      history: [
        { timestamp: '2026-09-04 06:00', actor: 'Priya Sharma (Field HSE)', action: 'Escalated from Report #200361855 to CAPA' },
        { timestamp: '2026-09-04 12:00', actor: 'Anurag Dutta', action: 'Submitted completion evidence & requested verification' }
      ]
    },
    {
      id: 'CAPA-2026-004',
      source_report: reports[3]?.id || '200361863',
      title: 'Enforce Stacking Height Limits & Dunnage Separation Standards',
      owner: 'Er. Rakesh Borah (Site Engineer)',
      due_date: '2026-09-02',
      status: 'Closed & Verified',
      priority: reports[3]?.sps_tier || 'High',
      asset: reports[3]?.asset || 'Digboi Refinery Complex',
      sap_work_order: 'SAP-WO-2026-8701',
      sla_window_hours: 48,
      sla_hours_remaining: 0,
      sla_status: 'Closed On Time',
      evidence_phrase: reports[3]?.evidence_spans?.[0]?.text || 'Five tier stack of 2,000 lbs wire cubes overturned striking operator',
      sps: reports[3]?.sps || 71.9,
      sps_tier: reports[3]?.sps_tier || 'High',
      energy_source: reports[3]?.energy_source || 'Mechanical Moving Equipment',
      life_saving_rule: reports[3]?.life_saving_rule || 'Line of Fire',
      barrier_status: reports[3]?.barrier_status || 'Degraded',
      action_description: 'Cap wire cube stack heights to max 3 tiers and install interlocking dunnage racks in recycling warehouse.',
      owner_notes: 'Interlocking racks installed and warehouse loading SOP revised.',
      reviewer_comments: 'Verified physical barrier installation during site audit on 2026-09-02.',
      created_at: '2026-09-01 10:00',
      history: [
        { timestamp: '2026-09-01 10:00', actor: 'Priya Sharma (Field HSE)', action: 'Escalated from Report #200361863 to CAPA' },
        { timestamp: '2026-09-02 11:00', actor: 'Er. Rakesh Borah', action: 'Completed rack installation' },
        { timestamp: '2026-09-02 15:00', actor: 'Corporate HSE Head', action: 'Verified & closed CAPA item' }
      ]
    }
  ];

  const sampleModels = [
    {
      id: 'v1.4.2-prod',
      name: 'SIF-Transformer-v1.4.2',
      status: 'Production',
      f1_score: 89.2,
      precision: 90.5,
      recall: 88.0,
      data_drift: 0.02,
      prediction_drift: 0.03,
      deployed_at: '2026-08-01 09:30',
      evaluated_at: '2026-09-04 00:00',
      traffic_eval_count: 9129,
      notes: 'Active production model powering SIF precursor triage.'
    },
    {
      id: 'v1.5.0-candidate',
      name: 'SIF-DeBERTa-v1.5.0',
      status: 'Shadow Mode',
      f1_score: 92.4,
      precision: 93.1,
      recall: 91.7,
      data_drift: 0.01,
      prediction_drift: 0.01,
      deployed_at: '2026-09-04 08:00',
      evaluated_at: '2026-09-04 08:00',
      traffic_eval_count: 9129,
      notes: 'Shadow candidate fine-tuned on recent Assam field reports.'
    },
    {
      id: 'v1.4.1-legacy',
      name: 'SIF-Transformer-v1.4.1',
      status: 'Rollback Eligible',
      f1_score: 87.1,
      precision: 87.8,
      recall: 86.4,
      data_drift: 0.04,
      prediction_drift: 0.04,
      deployed_at: '2026-06-15 14:00',
      evaluated_at: '2026-08-01 09:00',
      traffic_eval_count: 8500,
      notes: 'Prior stable release; verified fallback for emergency rollback.'
    }
  ];

  const sampleDriftMetrics = {
    tolerance_threshold: 0.05,
    trend_months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    data_drift: [0.01, 0.01, 0.02, 0.03, 0.02, 0.02, 0.02],
    prediction_drift: [0.01, 0.02, 0.02, 0.04, 0.03, 0.03, 0.03],
    category_performance: [
      { category: 'Thermal Energy', f1: 91.5, precision: 92.0, recall: 91.0, status: 'Normal' },
      { category: 'Pressure System', f1: 88.2, precision: 89.0, recall: 87.4, status: 'Normal' },
      { category: 'Chemical Release', f1: 86.4, precision: 87.5, recall: 85.3, status: 'Normal' },
      { category: 'Motion Vehicle', f1: 90.1, precision: 91.2, recall: 89.0, status: 'Normal' },
      { category: 'Electrical Arc', f1: 87.9, precision: 88.5, recall: 87.3, status: 'Normal' },
      { category: 'Gravitational Fall', f1: 92.0, precision: 92.8, recall: 91.2, status: 'Normal' }
    ]
  };

  const sampleShadowComparison = {
    candidate_version: 'v1.5.0-candidate',
    production_version: 'v1.4.2-prod',
    evaluation_dataset: '9,129 Held-Out Incident Narratives (sample.csv)',
    aggregate_deltas: {
      f1_score: { candidate: 92.4, production: 89.2, delta: '+3.2pp' },
      precision: { candidate: 93.1, production: 90.5, delta: '+2.6pp' },
      recall: { candidate: 91.7, production: 88.0, delta: '+3.7pp' },
      data_drift: { candidate: 0.01, production: 0.02, delta: '-0.01' }
    },
    category_deltas: [
      { category: 'Barrier Status Classification', candidate_f1: 91.2, prod_f1: 86.5, delta: '+4.7pp' },
      { category: 'Energy Source Recognition', candidate_f1: 94.0, prod_f1: 91.8, delta: '+2.2pp' },
      { category: 'Life-Saving Rules Mapping', candidate_f1: 92.1, prod_f1: 89.3, delta: '+2.8pp' }
    ]
  };

  const sampleAnalystFeedback = {
    overall_agree_rate: '91.4%',
    overall_override_rate: '8.6%',
    categories: [
      { category: 'Barrier Status', agree_rate: '81.5%', override_rate: '18.5%', top_reason: 'Barrier over-weighted', count: 142 },
      { category: 'Life-Saving Rules', agree_rate: '89.2%', override_rate: '10.8%', top_reason: 'LSR misclassified', count: 84 },
      { category: 'Energy Source', agree_rate: '95.8%', override_rate: '4.2%', top_reason: 'Secondary energy omitted', count: 32 },
      { category: 'Exposure Type', agree_rate: '96.5%', override_rate: '3.5%', top_reason: 'Proximity boundary error', count: 27 }
    ]
  };

  const sampleFairnessMetrics = {
    by_contractor: [
      { group: 'Oil India Internal Rigs', flagging_rate: '28.4%', precision: '91.2%', recall: '89.5%', sample_size: 3420 },
      { group: 'Alpha Drilling Contractors', flagging_rate: '29.1%', precision: '89.8%', recall: '88.1%', sample_size: 2850 },
      { group: 'North East Pipelines Ltd', flagging_rate: '27.8%', precision: '90.5%', recall: '88.9%', sample_size: 2859 }
    ],
    by_site: [
      { site: 'Rig-04 Dibrugarh', flagging_rate: '30.1%', precision: '90.8%', recall: '89.2%' },
      { site: 'Digboi Refinery Complex', flagging_rate: '27.4%', precision: '91.5%', recall: '90.1%' },
      { site: 'Moran Gas Gathering (GGS-02)', flagging_rate: '28.9%', precision: '89.5%', recall: '87.8%' }
    ],
    by_language: [
      { group: 'English Technical Narrative', precision: '91.8%', recall: '90.2%', sample_size: 7800 },
      { group: 'Assamese-English Code-Mixed', precision: '86.4%', recall: '84.1%', sample_size: 1329 }
    ]
  };

  const sampleAuditTrail = [
    {
      timestamp: '2026-09-04 08:00',
      actor: 'Dr. Iyer (Head of Process Safety)',
      event: 'Shadow Mode Deployment',
      version: 'v1.5.0-candidate',
      rationale: 'Deployed fine-tuned DeBERTa model to shadow evaluation stream.'
    },
    {
      timestamp: '2026-08-01 09:30',
      actor: 'R. Kalita (MLOps Lead)',
      event: 'Model Promotion',
      version: 'v1.4.2-prod',
      rationale: 'Promoted Transformer v1.4.2 to Production (Improved F1 score across Thermal & Pressure categories by +2.4pp).'
    },
    {
      timestamp: '2026-06-15 14:00',
      actor: 'R. Kalita (MLOps Lead)',
      event: 'Model Promotion',
      version: 'v1.4.1-legacy',
      rationale: 'Initial baseline deployment for SIF-Sentinel v1.0.'
    }
  ];

  const finalData = {
    reports,
    taxonomy: existingTaxonomy,
    capa_actions: sampleCapaActions,
    models: sampleModels,
    drift_metrics: sampleDriftMetrics,
    shadow_comparison: sampleShadowComparison,
    analyst_feedback: sampleAnalystFeedback,
    fairness_metrics: sampleFairnessMetrics,
    governance_audit_trail: sampleAuditTrail
  };

  console.log(`Writing ${reports.length} parsed reports to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf8');
  console.log('Successfully generated seedData.json with MLOps governance data!');
}

convert();

