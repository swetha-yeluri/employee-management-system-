HOW TO RUN ON WINDOWS (no errors)
=================================

EASIEST: double-click  START_HERE.bat  (in this folder).
  - It stops any old server, opens a Backend window and a Frontend window.
  - In the BACKEND window, wait for this line:   [OK ] Activity (Imp 9)
  - Then open http://localhost:5173 in your browser.
  - Login: admin@gmail.com / admin123   (or user@gmail.com / user123)

If START_HERE.bat closes instantly or shows errors, run the two .bat files
manually instead:
  1. Open the  backend  folder, double-click  start.bat   (wait for the banner)
  2. Open the  frontend folder, double-click  start.bat

VERIFY the correct backend is running (open in a browser):
  http://localhost:8000/
  -> you should see  "improvement_9": true
  If it says false or the page won't load, an old server is still running:
  close ALL black command windows and run START_HERE.bat again.

IMPORTANT
  - Always run from THIS freshly-extracted folder (delete older copies to avoid
    confusion).
  - The database resets automatically on start (needed because the schema grew).
  - Python 3.10+ and Node.js must be installed.
