import os
import io
import csv
import json
import time
import logging
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config
from processors.local_engine import LocalMapReduceEngine
from processors.hadoop_engine import HadoopMapReduceEngine, HadoopUnavailableError

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hadoop_analytics")

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global state for active dataset & cache
STATE = {
    "active_filename": None,
    "active_filepath": None,
    "file_size_bytes": 0,
    "total_lines": 0,
    "processing_mode": Config.HADOOP_MODE, # 'local' or 'hadoop'
    "analytics_result": None,
    "last_analyzed_at": None,
    "is_analyzing": False
}

def save_state():
    """Persists active state to disk for serverless container re-use"""
    try:
        if Config.STATE_FILE:
            os.makedirs(os.path.dirname(Config.STATE_FILE), exist_ok=True)
            with open(Config.STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(STATE, f)
    except Exception as e:
        logger.warning(f"Could not persist state to {Config.STATE_FILE}: {e}")

def load_state():
    """Restores active state from disk if present"""
    try:
        if Config.STATE_FILE and os.path.exists(Config.STATE_FILE):
            with open(Config.STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                STATE.update(data)
    except Exception as e:
        logger.warning(f"Could not load state from {Config.STATE_FILE}: {e}")

@app.before_request
def ensure_state_loaded():
    if STATE.get("analytics_result") is None:
        load_state()

def allowed_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in Config.ALLOWED_EXTENSIONS

@app.route("/api/health", methods=["GET"])
def health_check():
    hadoop_avail, hadoop_msg = HadoopMapReduceEngine.check_availability()
    return jsonify({
        "status": "online",
        "service": "Hadoop Log File Analytics Backend",
        "timestamp": time.time(),
        "processing_mode": STATE["processing_mode"],
        "hadoop_available": hadoop_avail,
        "hadoop_status": hadoop_msg,
        "dataset_loaded": STATE["analytics_result"] is not None
    })

@app.route("/api/config", methods=["GET", "POST"])
def manage_config():
    hadoop_avail, hadoop_msg = HadoopMapReduceEngine.check_availability()

    if request.method == "POST":
        data = request.get_json() or {}
        new_mode = data.get("mode", "").lower()
        if new_mode in ["local", "hadoop"]:
            if new_mode == "hadoop" and not hadoop_avail:
                return jsonify({
                    "success": False,
                    "error": "Cannot switch to Hadoop mode: Hadoop binaries not detected on this system.",
                    "details": hadoop_msg
                }), 400
            STATE["processing_mode"] = new_mode
            logger.info(f"Processing mode updated to: {new_mode}")
            return jsonify({
                "success": True,
                "message": f"Processing mode switched to {new_mode.capitalize()}",
                "mode": new_mode
            })
        return jsonify({"success": False, "error": "Invalid mode. Use 'local' or 'hadoop'"}), 400

    return jsonify({
        "mode": STATE["processing_mode"],
        "hadoop_available": hadoop_avail,
        "hadoop_status": hadoop_msg,
        "hadoop_home": Config.HADOOP_HOME,
        "hdfs_uri": Config.HDFS_URI,
        "active_file": STATE["active_filename"],
        "file_size_bytes": STATE["file_size_bytes"],
        "total_lines": STATE["total_lines"]
    })

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": "Unsupported file format. Please upload a .log or .txt file."
        }), 400

    safe_name = secure_filename(file.filename)
    timestamp_prefix = int(time.time())
    saved_filename = f"{timestamp_prefix}_{safe_name}"
    saved_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename)

    file.save(saved_path)
    file_size = os.path.getsize(saved_path)

    # Count lines
    line_count = 0
    with open(saved_path, "r", encoding="utf-8", errors="replace") as f:
        for _ in f:
            line_count += 1

    if line_count == 0:
        os.remove(saved_path)
        return jsonify({"success": False, "error": "Uploaded file is empty."}), 400

    STATE["active_filename"] = safe_name
    STATE["active_filepath"] = saved_path
    STATE["file_size_bytes"] = file_size
    STATE["total_lines"] = line_count
    # Invalidate previous analysis
    STATE["analytics_result"] = None
    save_state()

    return jsonify({
        "success": True,
        "filename": safe_name,
        "file_id": saved_filename,
        "size_bytes": file_size,
        "formatted_size": f"{round(file_size / (1024*1024), 2)} MB" if file_size > 1024*1024 else f"{round(file_size/1024, 2)} KB",
        "total_records": line_count,
        "message": f"Successfully uploaded {safe_name} ({line_count:,} records)."
    })

@app.route("/api/load-sample", methods=["POST"])
def load_sample_dataset():
    sample_path = Config.SAMPLE_LOG_PATH
    if not os.path.exists(sample_path):
        return jsonify({"success": False, "error": "Sample dataset file not found."}), 404

    file_size = os.path.getsize(sample_path)
    line_count = 0
    with open(sample_path, "r", encoding="utf-8", errors="replace") as f:
        for _ in f:
            line_count += 1

    STATE["active_filename"] = "sample_access.log"
    STATE["active_filepath"] = sample_path
    STATE["file_size_bytes"] = file_size
    STATE["total_lines"] = line_count

    # Execute analysis automatically for sample
    mode = request.json.get("mode", STATE["processing_mode"]) if request.is_json else STATE["processing_mode"]
    return run_analysis_pipeline(sample_path, mode)

@app.route("/api/analyze", methods=["POST"])
def analyze_log():
    filepath = STATE["active_filepath"]
    if not filepath or not os.path.exists(filepath):
        return jsonify({
            "success": False,
            "error": "No log file has been uploaded yet. Please upload a .log file first."
        }), 400

    data = request.get_json(silent=True) or {}
    requested_mode = data.get("mode", STATE["processing_mode"]).lower()
    return run_analysis_pipeline(filepath, requested_mode)

def run_analysis_pipeline(filepath: str, requested_mode: str):
    STATE["is_analyzing"] = True
    try:
        if requested_mode == "hadoop":
            engine = HadoopMapReduceEngine()
            try:
                result = engine.execute(filepath)
            except HadoopUnavailableError as hue:
                logger.warning(f"Hadoop unavailable: {hue}. Falling back to Local Demo Mode.")
                local_engine = LocalMapReduceEngine()
                result = local_engine.execute(filepath)
                result["fallback_notice"] = {
                    "occurred": True,
                    "reason": str(hue),
                    "message": "Hadoop cluster was not detected. Automatically executed using Local Demo Mode."
                }
        else:
            local_engine = LocalMapReduceEngine()
            result = local_engine.execute(filepath)

        STATE["analytics_result"] = result
        STATE["last_analyzed_at"] = time.time()
        STATE["is_analyzing"] = False
        save_state()

        # Return comprehensive initial response
        response_data = {
            "success": True,
            "filename": STATE["active_filename"],
            "processing_mode": result["processing_mode"],
            "processing_mode_label": result["processing_mode_label"],
            "execution_time_ms": result["execution_time_ms"],
            "pipeline_stages": result["pipeline_stages"],
            "summary": result["summary"],
            "fallback_notice": result.get("fallback_notice")
        }
        return jsonify(response_data)

    except Exception as e:
        STATE["is_analyzing"] = False
        logger.error(f"Error during analysis: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": f"Analysis failed: {str(e)}"
        }), 500

@app.route("/api/summary", methods=["GET"])
def get_summary():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    return jsonify(STATE["analytics_result"]["summary"])

@app.route("/api/status-codes", methods=["GET"])
def get_status_codes():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    return jsonify({
        "status_codes": STATE["analytics_result"]["status_codes"],
        "status_categories": STATE["analytics_result"]["status_categories"]
    })

@app.route("/api/urls", methods=["GET"])
def get_urls():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    limit = int(request.args.get("limit", 10))
    all_urls = STATE["analytics_result"]["urls"]
    return jsonify({
        "urls": all_urls[:limit],
        "total_unique_urls": len(all_urls)
    })

@app.route("/api/ips", methods=["GET"])
def get_ips():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    limit = int(request.args.get("limit", 10))
    all_ips = STATE["analytics_result"]["ips"]
    return jsonify({
        "ips": all_ips[:limit],
        "total_unique_ips": len(all_ips)
    })

@app.route("/api/methods", methods=["GET"])
def get_methods():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    return jsonify({
        "methods": STATE["analytics_result"]["methods"]
    })

@app.route("/api/traffic", methods=["GET"])
def get_traffic():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    granularity = request.args.get("granularity", "hourly").lower()
    traffic_data = STATE["analytics_result"]["traffic"]
    data = traffic_data.get(granularity, traffic_data["hourly"])
    return jsonify({
        "granularity": granularity,
        "data": data
    })

@app.route("/api/errors", methods=["GET"])
def get_errors():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    return jsonify(STATE["analytics_result"]["errors"])

@app.route("/api/pipeline", methods=["GET"])
def get_pipeline():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404
    return jsonify({
        "processing_mode": STATE["analytics_result"]["processing_mode"],
        "processing_mode_label": STATE["analytics_result"]["processing_mode_label"],
        "execution_time_ms": STATE["analytics_result"]["execution_time_ms"],
        "stages": STATE["analytics_result"]["pipeline_stages"]
    })

@app.route("/api/logs", methods=["GET"])
def get_logs():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404

    records = STATE["analytics_result"]["parsed_records"]

    # Filter parameters
    status_filter = request.args.get("status", "").strip()
    method_filter = request.args.get("method", "").strip().upper()
    url_query = request.args.get("url", "").strip().lower()
    ip_query = request.args.get("ip", "").strip()
    search_query = request.args.get("search", "").strip().lower()

    filtered = records

    if status_filter:
        if status_filter.endswith("xx"):
            cat = status_filter
            filtered = [r for r in filtered if r["category"] == cat]
        else:
            try:
                code = int(status_filter)
                filtered = [r for r in filtered if r["status_code"] == code]
            except ValueError:
                pass

    if method_filter:
        filtered = [r for r in filtered if r["method"] == method_filter]

    if url_query:
        filtered = [r for r in filtered if url_query in r["url"].lower()]

    if ip_query:
        filtered = [r for r in filtered if ip_query in r["ip"]]

    if search_query:
        filtered = [
            r for r in filtered
            if search_query in r["ip"].lower()
            or search_query in r["url"].lower()
            or search_query in r["method"].lower()
            or search_query in str(r["status_code"])
        ]

    # Pagination
    page = max(1, int(request.args.get("page", 1)))
    limit = max(5, min(100, int(request.args.get("limit", 20))))
    total_count = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    page_records = [
        {
            "ip": r["ip"],
            "timestamp": r["timestamp_raw"],
            "method": r["method"],
            "url": r["url"],
            "status_code": r["status_code"],
            "category": r["category"],
            "is_error": r["is_error"]
        }
        for r in filtered[start_idx:end_idx]
    ]

    return jsonify({
        "records": page_records,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_records": total_count,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1
        }
    })

@app.route("/api/export/json", methods=["GET"])
def export_json():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404

    # Build clean export payload omitting heavy raw line arrays
    res = STATE["analytics_result"]
    export_payload = {
        "metadata": {
            "project": "Hadoop Log File Analytics Dashboard",
            "filename": STATE["active_filename"],
            "export_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "processing_mode": res["processing_mode_label"],
            "execution_time_ms": res["execution_time_ms"]
        },
        "summary": res["summary"],
        "status_codes": res["status_codes"],
        "status_categories": res["status_categories"],
        "top_urls": res["urls"][:50],
        "top_ips": res["ips"][:50],
        "methods": res["methods"],
        "errors": res["errors"],
        "pipeline_stages": res["pipeline_stages"]
    }

    buffer = io.BytesIO()
    buffer.write(json.dumps(export_payload, indent=2).encode("utf-8"))
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"hadoop_analytics_{int(time.time())}.json",
        mimetype="application/json"
    )

@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    if not STATE["analytics_result"]:
        return jsonify({"error": "No active dataset analyzed."}), 404

    res = STATE["analytics_result"]
    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Summary
    writer.writerow(["# Hadoop Log Analytics Summary Report"])
    writer.writerow(["Filename", STATE["active_filename"]])
    writer.writerow(["Processing Mode", res["processing_mode_label"]])
    writer.writerow(["Execution Time (ms)", res["execution_time_ms"]])
    writer.writerow([])
    writer.writerow(["Metric", "Value"])
    for k, v in res["summary"].items():
        writer.writerow([k, v])

    # 2. Status codes
    writer.writerow([])
    writer.writerow(["# HTTP Status Codes"])
    writer.writerow(["Status Code", "Count"])
    for sc in res["status_codes"]:
        writer.writerow([sc["code"], sc["count"]])

    # 3. Top URLs
    writer.writerow([])
    writer.writerow(["# Top Visited URLs"])
    writer.writerow(["URL Path", "Request Count"])
    for u in res["urls"][:30]:
        writer.writerow([u["url"], u["count"]])

    # 4. Top IPs
    writer.writerow([])
    writer.writerow(["# Top IP Addresses"])
    writer.writerow(["IP Address", "Total Requests", "Success Count", "Error Count"])
    for ip in res["ips"][:30]:
        writer.writerow([ip["ip"], ip["requests"], ip["success"], ip["errors"]])

    # 5. Methods
    writer.writerow([])
    writer.writerow(["# HTTP Methods"])
    writer.writerow(["HTTP Method", "Count"])
    for m in res["methods"]:
        writer.writerow([m["method"], m["count"]])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=hadoop_analytics_{int(time.time())}.csv"}
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting Hadoop Log Analytics Backend on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
