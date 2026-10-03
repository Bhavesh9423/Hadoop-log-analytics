import os
import tempfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

class Config:
    # Processing Engine Mode: 'local' (Local Demo) or 'hadoop' (Actual Hadoop cluster)
    HADOOP_MODE = os.environ.get("HADOOP_MODE", "local").lower()

    # Hadoop & HDFS Configuration
    HADOOP_HOME = os.environ.get("HADOOP_HOME", "")
    HDFS_URI = os.environ.get("HDFS_URI", "hdfs://localhost:9000")
    HDFS_INPUT_DIR = os.environ.get("HDFS_INPUT_DIR", "/loganalysis/input")
    HDFS_OUTPUT_DIR = os.environ.get("HDFS_OUTPUT_DIR", "/loganalysis/output")
    HADOOP_STREAMING_JAR = os.environ.get("HADOOP_STREAMING_JAR", "")

    # Storage paths (Use /tmp on Vercel/serverless environments where root filesystem is read-only)
    IS_SERVERLESS = os.environ.get("VERCEL") == "1" or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None

    if IS_SERVERLESS:
        TEMP_DIR = tempfile.gettempdir()
        UPLOAD_FOLDER = os.path.join(TEMP_DIR, "uploads")
        RESULTS_FOLDER = os.path.join(TEMP_DIR, "results")
        STATE_FILE = os.path.join(TEMP_DIR, "hadoop_analytics_state.json")
    else:
        UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
        RESULTS_FOLDER = os.environ.get("RESULTS_FOLDER", os.path.join(BASE_DIR, "results"))
        STATE_FILE = os.path.join(RESULTS_FOLDER, "state.json")

    # Sample dataset search paths
    SAMPLE_LOG_PATH = os.path.join(PROJECT_DIR, "data", "sample_access.log")
    if not os.path.exists(SAMPLE_LOG_PATH):
        # Fallback to local package directory if bundled in serverless
        alt_path = os.path.join(BASE_DIR, "data", "sample_access.log")
        if os.path.exists(alt_path):
            SAMPLE_LOG_PATH = alt_path

    HADOOP_SCRIPTS_DIR = os.path.join(PROJECT_DIR, "hadoop")

    # Upload restrictions
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS = {".log", ".txt", ".csv"}

    # CORS
    CORS_ORIGINS = "*"

try:
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.RESULTS_FOLDER, exist_ok=True)
except Exception:
    pass
