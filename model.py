"""
Shared-backbone, multi-head model.

One BERT-style encoder produces a hidden-state sequence per narrative.
- Classification/binary/confidence heads read the pooled [CLS] vector.
- The span head reads every token position (needed to point at start/end
  of evidence_phrase inside the narrative).
Each head is an independent nn.Linear -- see the "multi-modularity" discussion:
they share the backbone's output but not each other's weights.
"""

import torch.nn as nn
from transformers import AutoModel

import config as C


class MultiTaskIncidentModel(nn.Module):
    def __init__(self, backbone_name: str = C.BACKBONE_NAME):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(backbone_name)
        h = self.backbone.config.hidden_size

        self.energy_source_head = nn.Linear(h, len(C.ENERGY_SOURCES))
        self.energy_level_head = nn.Linear(h, len(C.ENERGY_LEVELS))
        self.exposure_type_head = nn.Linear(h, len(C.EXPOSURE_TYPES))
        self.barrier_status_head = nn.Linear(h, len(C.BARRIER_STATUS))
        self.lsr_head = nn.Linear(h, len(C.LIFE_SAVING_RULES))
        self.severity_head = nn.Linear(h, len(C.RECORDED_SEVERITIES))
        self.counterfactual_head = nn.Linear(h, 2)
        # NOTE: no evidence_verified_head -- it's computed deterministically in
        # postprocessing.py from whether the span head found a real span, since
        # a span extracted from the narrative's own tokens is verified by construction.
        self.confidence_head = nn.Linear(h, 1)
        self.span_head = nn.Linear(h, 2)  # per-token start/end logits

        self.dropout = nn.Dropout(0.1)

    def forward(self, input_ids, attention_mask):
        out = self.backbone(input_ids=input_ids, attention_mask=attention_mask)
        seq = out.last_hidden_state          # [batch, seq_len, hidden]
        pooled = self.dropout(seq[:, 0])     # [CLS] token -> [batch, hidden]

        span_logits = self.span_head(seq)    # [batch, seq_len, 2]
        start_logits, end_logits = span_logits.split(1, dim=-1)

        return {
            "energy_source": self.energy_source_head(pooled),
            "energy_level": self.energy_level_head(pooled),
            "exposure_type": self.exposure_type_head(pooled),
            "barrier_status": self.barrier_status_head(pooled),
            "life_saving_rule": self.lsr_head(pooled),
            "recorded_severity": self.severity_head(pooled),
            "counterfactual_binary": self.counterfactual_head(pooled),
            "confidence": self.confidence_head(pooled).squeeze(-1),
            "span_start": start_logits.squeeze(-1),  # [batch, seq_len]
            "span_end": end_logits.squeeze(-1),        # [batch, seq_len]
        }
