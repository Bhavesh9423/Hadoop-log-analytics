import os
import sys
from pathlib import Path

# Add project root and backend to python path for imports
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
backend_dir = project_root / "backend"

sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(project_root))

from app import app

# Vercel serverless WSGI entrypoint
app.debug = False
