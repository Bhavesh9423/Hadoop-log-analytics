import re
import csv
import io
from datetime import datetime

HTTP_METHODS = {"GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH", "CONNECT", "TRACE"}

# Regex pattern matching standard Apache/Nginx format:
# IP - - [Timestamp] "METHOD URL HTTP/Version" Status
LOG_PATTERN = re.compile(
    r'^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)(?:\s+([^"]*))?"\s+(\d{3})'
)

# Relaxed pattern for logs without - -, optional quotes, or missing protocol
RELAXED_LOG_PATTERN = re.compile(
    r'^(\S+)\s+(?:.*?\[([^\]]+)\])?\s*"?([A-Z]{3,7})\s+([^\s"]+)(?:\s+([^"]*))?"?\s+(\d{3})'
)

formats = [
    "%d/%b/%Y:%H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%d/%m/%Y %H:%M:%S",
    "%Y/%m/%d %H:%M:%S",
    "%Y-%m-%d"
]

def parse_flexible_timestamp(raw_ts: str):
    """
    Parses various timestamp representations (Apache format, ISO-8601, SQL datetime).
    Returns (datetime_obj, day_str, hour_str, iso_str)
    """
    if not raw_ts:
        return None, "Unknown", "Unknown", ""
    raw_ts = raw_ts.strip().strip("[]").strip('\"\'')
    clean_ts = raw_ts.split()[0] if " " in raw_ts and "/" in raw_ts else raw_ts

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
    """Detects if row is a CSV header row like [ip, time, url, status] or [ip, timestamp, method, url, status]"""
    joined = " ".join([str(c).lower() for c in row])
    header_keywords = [
        "ip", "timestamp", "datetime", "date", "time", "method", "url",
        "status", "path", "code", "staus", "request", "req", "host"
    ]
    match_count = sum(1 for kw in header_keywords if kw in joined)
    if match_count >= 2:
        return True
    last = str(row[-1]).strip().lower()
    if last in ["status", "status_code", "staus", "code"]:
        return True
    return False

def parse_log_line(line: str):
    """
    Parses a single log line into a structured dictionary.
    Supports:
    1. Standard Apache/Nginx combined access log lines.
    2. Relaxed server access log lines.
    3. Comma-separated (CSV) and tab-separated (TSV) log rows (4-col, 5-col, 6-col).
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

    # 2. Try relaxed regex for non-standard / custom access logs
    match_relaxed = RELAXED_LOG_PATTERN.match(line)
    if match_relaxed:
        ip = match_relaxed.group(1)
        raw_ts = match_relaxed.group(2) or ""
        method = match_relaxed.group(3).upper()
        url = match_relaxed.group(4)
        http_version = match_relaxed.group(5) if match_relaxed.group(5) else "HTTP/1.1"
        status_str = match_relaxed.group(6)

        try:
            status_code = int(status_str)
        except ValueError:
            return None

        dt, day_str, hour_str, iso_str = parse_flexible_timestamp(raw_ts)
        return _build_record(ip, raw_ts, iso_str, dt, day_str, hour_str, method, url, http_version, status_code, line)

    # 3. Try parsing as CSV / TSV row if line contains comma or tab
    delimiter = "\t" if "\t" in line and "," not in line else ","
    if delimiter in line:
        try:
            reader = csv.reader(io.StringIO(line), delimiter=delimiter)
            row = next(reader)
        except Exception:
            return None

        if not row or is_csv_header(row):
            return None  # Header row or empty row

        ip = None
        raw_ts = ""
        method = "GET"
        url = "/"
        http_version = "HTTP/1.1"
        status_code = None

        # Format 4 columns: IP, Time, URL/Request, Status (e.g., weblog.csv)
        if len(row) == 4:
            ip = row[0].strip()
            raw_ts = row[1].strip()
            status_str = row[3].strip()
            if not status_str.isdigit():
                return None
            status_code = int(status_str)

            req_parts = row[2].strip().split()
            if req_parts and req_parts[0].upper() in HTTP_METHODS:
                method = req_parts[0].upper()
                url = req_parts[1] if len(req_parts) > 1 else "/"
                http_version = req_parts[2] if len(req_parts) > 2 else "HTTP/1.1"
            elif req_parts:
                url = req_parts[0]

        # Format 5 columns: IP, Timestamp, Method, URL, Status OR IP, Timestamp, URL, Status, Bytes
        elif len(row) == 5:
            ip = row[0].strip()
            raw_ts = row[1].strip()
            if row[4].strip().isdigit():
                status_code = int(row[4].strip())
                method = row[2].strip().upper() if row[2].strip().upper() in HTTP_METHODS else "GET"
                url = row[3].strip()
            elif row[3].strip().isdigit():
                status_code = int(row[3].strip())
                req_parts = row[2].strip().split()
                if req_parts and req_parts[0].upper() in HTTP_METHODS:
                    method = req_parts[0].upper()
                    url = req_parts[1] if len(req_parts) > 1 else "/"
                    http_version = req_parts[2] if len(req_parts) > 2 else "HTTP/1.1"
                else:
                    url = row[2].strip()
            else:
                return None

        # Format 6+ columns: IP, Timestamp, Method, URL, [Version], Status, ...
        elif len(row) >= 6:
            ip = row[0].strip()
            raw_ts = row[1].strip()
            if row[5].strip().isdigit() and 100 <= int(row[5].strip()) <= 599:
                status_code = int(row[5].strip())
                method = row[2].strip().upper() if row[2].strip().upper() in HTTP_METHODS else "GET"
                url = row[3].strip()
                http_version = row[4].strip()
            elif row[4].strip().isdigit() and 100 <= int(row[4].strip()) <= 599:
                status_code = int(row[4].strip())
                method = row[2].strip().upper() if row[2].strip().upper() in HTTP_METHODS else "GET"
                url = row[3].strip()
            else:
                for col in reversed(row):
                    c = col.strip()
                    if c.isdigit() and 100 <= int(c) <= 599:
                        status_code = int(c)
                        break
                if status_code is None:
                    return None
                method = row[2].strip().upper() if row[2].strip().upper() in HTTP_METHODS else "GET"
                url = row[3].strip()

        if ip and status_code is not None:
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
        "datetime": iso_str,
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
