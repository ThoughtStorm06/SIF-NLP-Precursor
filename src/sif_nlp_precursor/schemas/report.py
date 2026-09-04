from typing import Literal

from pydantic import BaseModel, Field


class ReportInput(BaseModel):
    file_type: Literal["zip", "pdf", "txt", "docx"]
    content: str = Field(min_length=1)


class ReportReceivedResponse(BaseModel):
    case_id: str
    file_type: str
    message: str


class ReportHistoryItem(BaseModel):
    case_id: str
    title: str | None
    narrative: str
    input_type: str
    processing_type: str
    created_by: str
    created_at: str
class FeedbackInput(BaseModel):
    status: Literal["correct", "incorrect"]
    created_by: str = "user"
    corrected_data: dict | None = None
    comment: str | None = None


class FeedbackResponse(BaseModel):
    prediction_id: int
    case_id: str
    status: Literal["correct", "incorrect"]
    message: str


class DashboardResponse(BaseModel):
    total_reports: int
    total_predictions: int
    high_risk_reports: int
    medium_risk_reports: int
    low_risk_reports: int
    correct_predictions: int
    incorrect_predictions: int

class SimilarReportItem(BaseModel):
    case_id: str
    title: str | None
    narrative: str
    similarity_score: float


class SimilarReportsResponse(BaseModel):
    case_id: str
    similar_reports: list[SimilarReportItem]

class TaxonomyResponse(BaseModel):
    categories: list[str]

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    status: str
    task: str