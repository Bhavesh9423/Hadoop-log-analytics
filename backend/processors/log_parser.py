import re
import csv
import io
from datetime import datetime

# Regex pattern matching standard Apache/Nginx format:
# IP - - [Timestamp] "METHOD URL HTTP/Version" Status
LOG_PATTERN = re.compile(
    r'^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)(?:\s+([^"]*))?"\s+(\d{3})'
)

def parse_flexible_timestamp(raw_ts: str):
    """
    Parses various timestamp representations (Apache format, ISO-8601, SQL datetime).
    Returns (datetime_obj, day_str, hour_str, iso_str)
    """
    raw_ts = raw_ts.strip().strip("[]").strip('"').strip("'")
    clean_ts = raw_ts.split()[0] if " " in raw_ts and "/" in raw_ts else raw_ts

    formats = [
        "%d/%b/%Y:%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%Y/%m/%d %H:%M:%S",
        "%Y-%m-%d"
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(clean_ts, fmt)
            day_str = dt.strftime("%Y-%m-%d")
            hour_str = dt.strftime("%Y-%m-%d %H:00")
            return dt, day_str, hour_str, dt.isoformat()
        except Exception:
            continue

    return None, "Unknown", "Unknown", raw_ts

def is_csv_header(row):
    """Detects if row is a CSV header row like [ip, timestamp, method, url, status]"""
    joined = " ".join([str(c).lower() for c in row])
    header_keywords = ["ip", "timestamp", "datetime", "method", "url", "status", "path", "code"]
    match_count = sum(1 for kw in header_keywords if kw in joined)
    return match_count >= 2

def parse_log_line(line: str):
    """
    Parses a single log line into a structured dictionary.
    Supports both standard Apache/Nginx combined access log lines AND comma-separated CSV log rows.
    Returns None if line is malformed, header, or empty.
    """
    line = line.strip()
    if not line:
        return None

    # 1. Try standard Apache/Nginx log format
    match = LOG_PATTERN.match(line)
    if match:
        ip = match.group(1)
        raw_ts = match.group(2)
        method = match.group(3).upper()
        url = match.group(4)
        http_version = match.group(5) if match.group(5) else "HTTP/1.1"
        status_str = match.group(6)

        try:
            status_code = int(status_str)
        except ValueError:
            return None

        dt, day_str, hour_str, iso_str = parse_flexible_timestamp(raw_ts)

        return _build_record(ip, raw_ts, iso_str, dt, day_str, hour_str, method, url, http_version, status_code, line)

    # 2. Try parsing as CSV row if line contains comma
    if "," in line:
        try:
            reader = csv.reader(io.StringIO(line))
            row = next(reader)
        except Exception:
            return None

        if not row or is_csv_header(row):
            return None  # Header row or empty row

        # Extract columns dynamically based on count
        # Typical CSV: IP, Timestamp, Method, URL, Status (or Status Code)
        if len(row) >= 5:
            ip = row[0].strip()
            raw_ts = row[1].strip()
            method = row[2].strip().upper()
            url = row[3].strip()
            # If 6 columns, could be ip, timestamp, method, url, version, status
            if len(row) >= 6 and (row[5].strip().isdigit()):
                http_version = row[4].strip()
                status_str = row[5].strip()
            else:
                http_version = "HTTP/1.1"
                status_str = row[4].strip()

            try:
                status_code = int(status_str)
            except ValueError:
                return None

            dt, day_str, hour_str, iso_str = parse_flexible_timestamp(raw_ts)
            return _build_record(ip, raw_ts, iso_str, dt, day_str, hour_str, method, url, http_version, status_code, line)

    return None

def _build_record(ip, raw_ts, iso_str, dt, day_str, hour_str, method, url, http_version, status_code, raw_line):
    # Determine status category
    if 200 <= status_code < 300:
        category = "2xx"
        is_error = False
    elif 300 <= status_code < 400:
        category = "3xx"
        is_error = False
    elif 400 <= status_code < 500:
        category = "4xx"
        is_error = True
    elif 500 <= status_code < 600:
        category = "5xx"
        is_error = True
    else:
        category = "other"
        is_error = True

    return {
        "ip": ip,
        "timestamp_raw": raw_ts,
        "timestamp_iso": iso_str,
        "datetime": dt,
        "day": day_str,
        "hour": hour_str,
        "method": method,
        "url": url,
        "http_version": http_version,
        "status_code": status_code,
        "category": category,
        "is_error": is_error,
        "raw_line": raw_line
    }
