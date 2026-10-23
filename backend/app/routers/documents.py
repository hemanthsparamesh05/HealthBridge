import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import UPLOADS_DIR, settings
from app.database import get_db
from app.models import AuditEvent, Claim, ClaimDocument
from app.permissions import require_claim_access, require_decision_role
from app.schemas import DocumentOut, UserOut

router = APIRouter(prefix="/documents", tags=["documents"])

SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


def _doc_out(doc: ClaimDocument) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        claimId=doc.claim_id,
        filename=doc.filename,
        contentType=doc.content_type,
        sizeBytes=doc.size_bytes,
        docType=doc.doc_type,
        verified=doc.verified,
        uploadedBy=doc.uploaded_by,
        createdAt=doc.created_at.isoformat() if doc.created_at else "",
        downloadUrl=f"/api/documents/{doc.id}/download",
    )


def _claim_dir(claim_id: str) -> Path:
    path = UPLOADS_DIR / SAFE_NAME.sub("_", claim_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.get("/claim/{claim_id}", response_model=list[DocumentOut])
async def list_claim_documents(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> list[DocumentOut]:
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    await require_claim_access(claim, user, db)
    result = await db.execute(
        select(ClaimDocument)
        .where(ClaimDocument.claim_id == claim_id)
        .order_by(ClaimDocument.created_at.desc())
    )
    return [_doc_out(d) for d in result.scalars().all()]


@router.post("/claim/{claim_id}", response_model=DocumentOut)
async def upload_document(
    claim_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form(default="general"),
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> DocumentOut:
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    await require_claim_access(claim, user, db)

    content_type = file.content_type or "application/octet-stream"
    if content_type not in settings.allowed_upload_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: PDF, JPEG, PNG, WEBP, DOC, DOCX",
        )

    raw = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.max_upload_mb}MB limit")
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    original = SAFE_NAME.sub("_", file.filename or "upload.bin")
    stored = f"{uuid.uuid4().hex}_{original}"
    dest = _claim_dir(claim_id) / stored
    dest.write_bytes(raw)

    doc = ClaimDocument(
        claim_id=claim_id,
        filename=file.filename or original,
        stored_name=stored,
        content_type=content_type,
        size_bytes=len(raw),
        doc_type=doc_type,
        uploaded_by=user.email,
    )
    db.add(doc)
    db.add(
        AuditEvent(
            actor=user.email,
            action="document_upload",
            entity=claim_id,
            detail=f"{file.filename} ({len(raw)} bytes)",
        )
    )
    await db.commit()
    await db.refresh(doc)
    return _doc_out(doc)


@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
):
    doc = await db.get(ClaimDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    claim = await db.get(Claim, doc.claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    await require_claim_access(claim, user, db)
    path = _claim_dir(doc.claim_id) / doc.stored_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(path, media_type=doc.content_type, filename=doc.filename)


@router.patch("/{doc_id}/verify", response_model=DocumentOut)
async def verify_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> DocumentOut:
    doc = await db.get(ClaimDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    require_decision_role(user)
    doc.verified = True
    db.add(
        AuditEvent(
            actor=user.email,
            action="document_verify",
            entity=doc.claim_id,
            detail=doc.filename,
        )
    )
    await db.commit()
    await db.refresh(doc)
    return _doc_out(doc)


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
):
    doc = await db.get(ClaimDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    require_decision_role(user)
    path = _claim_dir(doc.claim_id) / doc.stored_name
    if path.exists():
        path.unlink()
    db.add(
        AuditEvent(
            actor=user.email,
            action="document_delete",
            entity=doc.claim_id,
            detail=doc.filename,
        )
    )
    await db.delete(doc)
    await db.commit()
    return {"ok": True}
