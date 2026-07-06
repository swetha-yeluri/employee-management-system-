
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import session_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.session_schema import SessionOut, RenameRequest
from app.utils.deps import get_current_user, require_active_user, require_admin, oauth2_scheme
from app.utils.security import decode_access_token

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.get("/mine", response_model=list[SessionOut])
def my_sessions(db: Session = Depends(get_db), user: User = Depends(require_active_user)):
    return ctrl.list_my(db, user)


@router.put("/{session_id}/rename", response_model=SessionOut)
def rename(session_id: int, payload: RenameRequest, db: Session = Depends(get_db),
           user: User = Depends(require_active_user)):
    return ctrl.rename(db, user, session_id, payload.device_name)


@router.post("/{session_id}/logout")
def logout_one(session_id: int, db: Session = Depends(get_db),
               user: User = Depends(require_active_user)):
    ctrl.logout_session(db, user, session_id)
    return {"message": "Device logged out"}


@router.post("/logout-others")
def logout_others(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db),
                  user: User = Depends(require_active_user)):
    payload = decode_access_token(token) or {}
    return ctrl.logout_others(db, user, payload.get("sid"))


@router.get("/all", response_model=list[SessionOut])
def all_sessions(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return ctrl.list_all(db, admin)


@router.post("/{session_id}/force-logout")
def force_logout(session_id: int, db: Session = Depends(get_db),
                 admin: User = Depends(require_admin)):
    ctrl.force_logout(db, admin, session_id)
    return {"message": "Session force-logged out"}


@router.post("/{session_id}/revoke")
def revoke(session_id: int, db: Session = Depends(get_db),
           admin: User = Depends(require_admin)):
    ctrl.revoke(db, admin, session_id)
    return {"message": "Session revoked"}