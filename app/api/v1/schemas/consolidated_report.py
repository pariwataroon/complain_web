from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class StatusHistoryItem(BaseModel):
    status: str
    status_thai: str
    notes: Optional[str] = None
    changed_at: Optional[datetime] = None
    changed_by: Optional[str] = None

class ComplaintSummary(BaseModel):
    id: UUID
    complaint_number: str
    subject: str
    status: str
    complainant_name: str
    respondent_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    status_history: List[StatusHistoryItem] = []
    complaint_type: Optional[str] = None
    incident_date: Optional[datetime] = None
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    severity_level: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_date: Optional[datetime] = None
    resolution_summary: Optional[str] = None
    resolved_date: Optional[datetime] = None

class OutgoingReportSummary(BaseModel):
    id: UUID
    type: str  # "report1", "report2", "report3", "report4"
    reference_number: Optional[str] = None
    complaint_number: Optional[str] = None
    subject: str
    department_name: Optional[str] = None
    signature_user_name: Optional[str] = None
    created_at: datetime

class AdditionalReference(BaseModel):
    type: str  # "additional_reference_1" or "additional_reference_2"
    reference_number: str
    reference_date: Optional[datetime] = None

class RelatedComplaint(BaseModel):
    id: UUID
    complaint_number: str
    subject: str
    relationship_type: str  # "parent", "child", "sibling", "referenced", "references_this"
    created_at: datetime

class RelationshipSummary(BaseModel):
    total_related: int = 0
    parent_count: int = 0
    child_count: int = 0
    sibling_count: int = 0
    referenced_count: int = 0
    references_this_count: int = 0

class WorkflowFlags(BaseModel):
    new_complaint: Optional[bool] = None
    add_more_complaint_to_ref: Optional[bool] = None
    group_work: Optional[bool] = None
    complaint_filing_type: Optional[str] = None

class ReferenceNumbers(BaseModel):
    reference_number: Optional[str] = None
    reference_date: Optional[datetime] = None
    reference_number2: Optional[str] = None
    reference_date2: Optional[datetime] = None
    reference_number3: Optional[str] = None
    reference_date3: Optional[datetime] = None
    reference_number4: Optional[str] = None
    reference_date4: Optional[datetime] = None
    document_number: Optional[str] = None
    document_date: Optional[datetime] = None

class ConsolidatedComplaintReport(BaseModel):
    complaint: ComplaintSummary
    outgoing_reports: List[OutgoingReportSummary] = []
    additional_references: List[AdditionalReference] = []
    related_complaints: List[RelatedComplaint] = []
    total_documents: int = 0
    parent_complaint_id: Optional[str] = None
    has_children: bool = False
    has_siblings: bool = False
    has_references: bool = False
    relationship_summary: RelationshipSummary
    workflow_flags: WorkflowFlags
    reference_numbers: ReferenceNumbers

class ConsolidatedReportOptions(BaseModel):
    departments: List[Dict[str, str]] = []
    users: List[Dict[str, str]] = []
    statuses: List[Dict[str, str]] = []
    report_types: List[Dict[str, str]] = []