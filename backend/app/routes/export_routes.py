
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.controllers import export_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.export_schema import ExportHistoryOut
from app.utils.deps import require_admin

router = APIRouter(prefix="/api/exports", tags=["Exports"])


@router.get("/history", response_model=list[ExportHistoryOut])
def history(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return ctrl.list_history(db, current_admin)


@router.get("/{data_type}")
def export(data_type: str, fmt: str = "csv", db: Session = Depends(get_db),
           current_admin: User = Depends(require_admin)):
    try:
        content, media_type, filename = ctrl.export(db, current_admin, data_type, fmt)
    except HTTPException:
        raise
    except Exception as exc:  # surface the real reason instead of a generic 500
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Export error: {type(exc).__name__}: {exc}")
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
