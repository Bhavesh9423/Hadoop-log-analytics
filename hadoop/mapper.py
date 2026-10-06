#!/usr/bin/env python3
"""
Hadoop MapReduce - Log File Mapper
Processes server access logs line by line (supports both Apache/Nginx .log/.txt and .csv)
and outputs key-value pairs separated by tab.

Compatible with Hadoop Streaming:
  hadoop jar hadoop-streaming.jar \
    -file mapper.py -mapper mapper.py \
    -file reducer.py -reducer reducer.py \
    -input /loganalysis/input \
    -output /loganalysis/output
"""

import sys
import re
import csv
import io
from datetime import datetime

# Regex pattern for Apache/Nginx combined/common access log format:
# IP - - [03/Oct/2026:10:15:20] "GET /home HTTP/1.1" 200
LOG_PATTERN = re.compile(
    r'^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)(?:\s+([^"]*))?"\s+(\d{3})'
)

def parse_timestamp(raw_ts):
    """
    Parses timestamp like '03/Oct/2026:10:15:20', '2026-10-03 10:15:20', or ISO format.
    Returns (day_str 'YYYY-MM-DD', hour_str 'YYYY-MM-DD HH:00')
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
            return dt.strftime("%Y-%m-%d"), dt.strftime("%Y-%m-%d %H:00")
        except Exception:
            continue

    return "UNKNOWN_DAY", "UNKNOWN_HOUR"

def emit(key, value=1):
    """Emit intermediate key-value pair to stdout for Shuffle & Sort"""
    sys.stdout.write(f"{key}\t{value}\n")

HTTP_METHODS = {"GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH", "CONNECT", "TRACE"}

RELAXED_LOG_PATTERN = re.compile(
    r'^(\S+)\s+(?:.*?\[([^\]]+)\])?\s*"?([A-Z]{3,7})\s+([^\s"]+)(?:\s+([^"]*))?"?\s+(\d{3})'
)

def is_header(row):
    joined = " ".join([str(c).lower() for c in row])
    header_keywords = [
        "ip", "timestamp", "datetime", "date", "time", "method", "url",
        "status", "path", "code", "staus", "request", "req", "host"
    ]
    match_count = sum(1 for kw in header_keywords if kw in joined)
    if match_count >= 2:
        return True
    last = str(row[-1]).strip().lower()
    return last in ["status", "status_code", "staus", "code"]

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        ip = None
        ts_str = None
        method = "GET"
        url = "/"
        status_code = None

        match = LOG_PATTERN.match(line)
        if match:
            ip = match.group(1)
            ts_str = match.group(2)
            method = match.group(3).upper()
            url = match.group(4)
            status_code = match.group(6)
        else:
            match_relaxed = RELAXED_LOG_PATTERN.match(line)
            if match_relaxed:
                ip = match_relaxed.group(1)
                ts_str = match_relaxed.group(2) or ""
                method = match_relaxed.group(3).upper()
                url = match_relaxed.group(4)
                status_code = match_relaxed.group(6)
            elif "," in line or "\t" in line:
                try:
                    delimiter = "\t" if "\t" in line and "," not in line else ","
                    reader = csv.reader(io.StringIO(line), delimiter=delimiter)
                    row = next(reader)
                    if not row or is_header(row):
                        continue

                    if len(row) == 4:
                        ip = row[0].strip()
                        ts_str = row[1].strip()
                        if row[3].strip().isdigit():
                            status_code = row[3].strip()
                            req_parts = row[2].strip().split()
                            if req_parts and req_parts[0].upper() in HTTP_METHODS:
                                method = req_parts[0].upper()
                                url = req_parts[1] if len(req_parts) > 1 else "/"
                            elif req_parts:
                                url = req_parts[0]
                    elif len(row) == 5:
                        ip = row[0].strip()
                        ts_str = row[1].strip()
                        if row[4].strip().isdigit():
                            status_code = row[4].strip()
                            method = row[2].strip().upper() if row[2].strip().upper() in HTTP_METHODS else "GET"
                            url = row[3].strip()
                        elif row[3].strip().isdigit():
                            status_code = row[3].strip()
                            req_parts = row[2].strip().split()
                            if req_parts and req_parts[0].upper() in HTTP_METHODS:
                                method = req_parts[0].upper()
                                url = req_parts[1] if len(req_parts) > 1 else "/"
                            else:
                                url = row[2].strip()
                    elif len(row) >= 6:
                        ip = row[0].strip()
                        ts_str = row[1].strip()
                        if row[5].strip().isdigit() and 100 <= int(row[5].strip()) <= 599:
                            status_code = row[5].strip()
                            method = row[2].strip().upper() if row[2].strip().upper() in HTTP_METHODS else "GET"
                            url = row[3].strip()
                        elif row[4].strip().isdigit() and 100 <= int(row[4].strip()) <= 599:
                            status_code = row[4].strip()
                            method = row[2].strip().upper() if row[2].strip().upper() in HTTP_METHODS else "GET"
                            url = row[3].strip()
                except Exception:
                    pass

        if not ip or not status_code:
            # Handle malformed log record gracefully
            emit("STAT_MALFORMED", 1)
            continue

        day_str, hour_str = parse_timestamp(ts_str)

        # Categorize status code
        try:
            status_num = int(status_code)
            if 200 <= status_num < 300:
                cat = "2xx"
                is_error = False
            elif 300 <= status_num < 400:
                cat = "3xx"
                is_error = False
            elif 400 <= status_num < 500:
                cat = "4xx"
                is_error = True
            elif 500 <= status_num < 600:
                cat = "5xx"
                is_error = True
            else:
                cat = "other"
                is_error = True
        except ValueError:
            cat = "invalid"
            is_error = True

        # Emit Metrics
        emit("TOTAL_REQUESTS", 1)
        if is_error:
            emit("TOTAL_ERRORS", 1)
            emit(f"ERROR_CODE_{status_code}", 1)
            emit(f"ERROR_URL_{url}", 1)
            emit(f"ERROR_IP_{ip}", 1)
        else:
            emit("TOTAL_SUCCESS", 1)

        emit(f"STATUS_CAT_{cat}", 1)
        emit(f"STATUS_{status_code}", 1)
        emit(f"URL_{url}", 1)
        emit(f"IP_{ip}", 1)
        emit(f"METHOD_{method}", 1)
        emit(f"TIME_DAY_{day_str}", 1)
        emit(f"TIME_HOUR_{hour_str}", 1)

        # IP Breakdown
        if is_error:
            emit(f"IP_ERR_{ip}", 1)
        else:
            emit(f"IP_SUCC_{ip}", 1)

if __name__ == "__main__":
    main()
