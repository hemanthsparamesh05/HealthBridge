from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(64), default="insurance_admin")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(128))
    state: Mapped[str] = mapped_column(String(64), default="Karnataka")
    phone: Mapped[str] = mapped_column(String(64))
    tier: Mapped[str] = mapped_column(String(32), default="Tier A")
    network_status: Mapped[str] = mapped_column(String(32), default="active")
    beds: Mapped[int] = mapped_column(Integer, default=200)
    specialties: Mapped[str] = mapped_column(Text, default="[]")
    avg_claim_amount: Mapped[float] = mapped_column(Float, default=0.0)
    fraud_rate: Mapped[float] = mapped_column(Float, default=0.0)
    provider_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HospitalMembership(Base):
    __tablename__ = "hospital_memberships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    hospital_id: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PolicyHolder(Base):
    __tablename__ = "policy_holders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    policy_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    member_name: Mapped[str] = mapped_column(String(255))
    patient_id: Mapped[str] = mapped_column(String(64), index=True)
    coverage_type: Mapped[str] = mapped_column(String(128))
    sum_insured: Mapped[float] = mapped_column(Float, default=500000.0)
    validity_start: Mapped[str] = mapped_column(String(32))
    validity_end: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="active")
    age: Mapped[int] = mapped_column(Integer, default=40)
    gender: Mapped[str] = mapped_column(String(16), default="Other")
    city: Mapped[str] = mapped_column(String(128), default="Bengaluru")
    phone: Mapped[str] = mapped_column(String(64), default="")
    email: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(String(64), index=True)
    patient_name: Mapped[str] = mapped_column(String(255))
    hospital: Mapped[str] = mapped_column(String(255))
    hospital_id: Mapped[str] = mapped_column(String(64), index=True)
    treatment_type: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Float)
    submitted_at: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(64), index=True, default="pending")
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(16), default="low")
    policy_id: Mapped[str] = mapped_column(String(64))
    coverage_type: Mapped[str] = mapped_column(String(128))
    validity_end: Mapped[str] = mapped_column(String(32))
    diagnosis: Mapped[str] = mapped_column(String(255))
    procedures: Mapped[str] = mapped_column(Text, default="[]")
    doctor: Mapped[str] = mapped_column(String(255))
    admission_date: Mapped[str] = mapped_column(String(32))
    discharge_date: Mapped[str] = mapped_column(String(32))
    notes: Mapped[str] = mapped_column(Text, default="")
    patient_age: Mapped[int] = mapped_column(Integer, default=40)
    patient_gender: Mapped[str] = mapped_column(String(16), default="Other")
    claim_duration_days: Mapped[int] = mapped_column(Integer, default=1)
    doctor_fee: Mapped[float] = mapped_column(Float, default=0.0)
    is_fraud_label: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ml_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ml_findings: Mapped[str] = mapped_column(Text, default="[]")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ClaimDocument(Base):
    __tablename__ = "claim_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    claim_id: Mapped[str] = mapped_column(String(64), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(128))
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    doc_type: Mapped[str] = mapped_column(String(64), default="general")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_by: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(255))
    entity: Mapped[str] = mapped_column(String(128))
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(64), default="system")
    priority: Mapped[str] = mapped_column(String(16), default="medium")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
