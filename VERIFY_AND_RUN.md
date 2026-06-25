# Run + verify Improvement 6  (fixes the "Not Found" on /api/members & /api/invitations)

## Why you see "Not Found"
Your console shows `GET /api/members` and `/api/invitations` returning **404**,
while `/api/employees` and login work. That means the backend that is **running**
is an OLD copy that does not contain the new files
(`invitation_routes.py`, `member_routes.py`, `reactivation_routes.py`).
This happens if the new files were never copied into the folder you actually run.

## THE FIX — run from a FRESH extraction (do not reuse the old folder)
1. Delete or rename your old project folder.
2. Extract the downloaded zip to a clean location (e.g. Desktop). You get a
   folder named `employee-management-system`.
3. Confirm the new backend files are present:
       ls employee-management-system/backend/app/routes
   You MUST see: invitation_routes.py  member_routes.py  reactivation_routes.py
   (If they are missing, you extracted the wrong/old zip.)
4. Start the backend from THIS fresh folder:
       cd employee-management-system/backend
       bash start.sh
   (start.sh kills any old server on port 8000, makes a venv, installs,
    resets the database, and runs.)
5. Start the frontend:
       cd employee-management-system/frontend
       bash start.sh

## 10-second verification (just open this URL in your browser)
       http://localhost:8000/
You will see JSON. Look for:
       "improvement_6": true
       and "/api/invitations", "/api/members", "/api/reactivation-requests" in "api_routes"
- true  -> correct backend; Members create/list will work.
- false -> you are still running the OLD backend. Re-extract fresh and re-run.

## Test the full flow
1. Login admin@gmail.com / admin123 -> Members.
2. Invite a member (email + role) -> Create Invitation -> Copy link.
3. Open the link in a new tab -> set password -> logged in as the new member.
4. As admin -> Members -> Deactivate that member.
5. Log in as that member -> only the Account Deactivated page -> Request Reactivation.
6. Log in as the admin who deactivated -> Reactivations -> Approve.
7. Member logs in again -> access restored. Audit Logs shows all 7 events.
