import time
from collections import defaultdict
from typing import Dict, Any, List
from processors.log_parser import parse_log_line

class LocalMapReduceEngine:
    """
    Simulates the complete Hadoop MapReduce pipeline locally using Python.
    Strictly follows the HDFS -> Map -> Shuffle & Sort -> Reduce -> Aggregation stages.
    """

    def __init__(self):
        self.pipeline_stages = []

    def execute(self, filepath: str) -> Dict[str, Any]:
        start_total = time.time()
        self.pipeline_stages = []

        # ----------------------------------------------------
        # Stage 1: Input Ingestion / Preparation
        # ----------------------------------------------------
        stage1_start = time.time()
        lines = []
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                lines.append(line)
        stage1_duration = time.time() - stage1_start

        self.pipeline_stages.append({
            "stage_id": "input",
            "name": "Input Preparation (Local Input Stream)",
            "description": f"Read and buffered {len(lines):,} log records from disk.",
            "duration_ms": round(stage1_duration * 1000, 2),
            "status": "completed",
            "metrics": {
                "records_read": len(lines)
            }
        })

        # ----------------------------------------------------
        # Stage 2: Mapper Phase
        # ----------------------------------------------------
        stage2_start = time.time()
        intermediate_pairs = []  # List of (key, value)
        parsed_records = []
        malformed_count = 0

        for line in lines:
            parsed = parse_log_line(line)
            if not parsed:
                malformed_count += 1
                intermediate_pairs.append(("STAT_MALFORMED", 1))
                continue

            parsed_records.append(parsed)
            ip = parsed["ip"]
            method = parsed["method"]
            url = parsed["url"]
            code = str(parsed["status_code"])
            cat = parsed["category"]
            day = parsed["day"]
            hour = parsed["hour"]
            is_err = parsed["is_error"]

            # Map phase emits key-value pairs
            intermediate_pairs.append(("TOTAL_REQUESTS", 1))
            intermediate_pairs.append((f"STATUS_{code}", 1))
            intermediate_pairs.append((f"STATUS_CAT_{cat}", 1))
            intermediate_pairs.append((f"URL_{url}", 1))
            intermediate_pairs.append((f"IP_{ip}", 1))
            intermediate_pairs.append((f"METHOD_{method}", 1))
            intermediate_pairs.append((f"TIME_DAY_{day}", 1))
            intermediate_pairs.append((f"TIME_HOUR_{hour}", 1))

            if is_err:
                intermediate_pairs.append(("TOTAL_ERRORS", 1))
                intermediate_pairs.append((f"ERROR_CODE_{code}", 1))
                intermediate_pairs.append((f"ERROR_URL_{url}", 1))
                intermediate_pairs.append((f"ERROR_IP_{ip}", 1))
                intermediate_pairs.append((f"IP_ERR_{ip}", 1))
            else:
                intermediate_pairs.append(("TOTAL_SUCCESS", 1))
                intermediate_pairs.append((f"IP_SUCC_{ip}", 1))

        stage2_duration = time.time() - stage2_start
        self.pipeline_stages.append({
            "stage_id": "mapper",
            "name": "Map Phase (Mapper Execution)",
            "description": f"Processed {len(lines):,} lines and generated {len(intermediate_pairs):,} intermediate (Key, Value) pairs.",
            "duration_ms": round(stage2_duration * 1000, 2),
            "status": "completed",
            "metrics": {
                "pairs_emitted": len(intermediate_pairs),
                "valid_records": len(parsed_records),
                "malformed_records": malformed_count
            }
        })

        # ----------------------------------------------------
        # Stage 3: Shuffle & Sort Phase
        # ----------------------------------------------------
        stage3_start = time.time()
        # Group values by key, then sort keys alphabetically
        grouped = defaultdict(list)
        for key, val in intermediate_pairs:
            grouped[key].append(val)

        sorted_keys = sorted(grouped.keys())
        stage3_duration = time.time() - stage3_start

        self.pipeline_stages.append({
            "stage_id": "shuffle_sort",
            "name": "Shuffle & Sort Phase",
            "description": f"Grouped {len(intermediate_pairs):,} values into {len(sorted_keys):,} unique keys and performed alphanumeric sort.",
            "duration_ms": round(stage3_duration * 1000, 2),
            "status": "completed",
            "metrics": {
                "unique_keys_partitioned": len(sorted_keys)
            }
        })

        # ----------------------------------------------------
        # Stage 4: Reducer Phase
        # ----------------------------------------------------
        stage4_start = time.time()
        reduced_counts: Dict[str, int] = {}
        for key in sorted_keys:
            # Reducer sums the iterable values
            reduced_counts[key] = sum(grouped[key])

        stage4_duration = time.time() - stage4_start
        self.pipeline_stages.append({
            "stage_id": "reducer",
            "name": "Reduce Phase (Reducer Aggregation)",
            "description": f"Aggregated all grouped values across {len(reduced_counts):,} unique reducer keys.",
            "duration_ms": round(stage4_duration * 1000, 2),
            "status": "completed",
            "metrics": {
                "keys_aggregated": len(reduced_counts)
            }
        })

        # ----------------------------------------------------
        # Stage 5: Final Output & Structured Analytics Generation
        # ----------------------------------------------------
        stage5_start = time.time()
        analytics = self._structure_analytics(reduced_counts, parsed_records, malformed_count)
        stage5_duration = time.time() - stage5_start

        total_duration = time.time() - start_total
        self.pipeline_stages.append({
            "stage_id": "output",
            "name": "Dashboard Result Generation",
            "description": f"Built high-performance KPI aggregates, time-series points, and ranking indices in {round(stage5_duration*1000, 2)} ms.",
            "duration_ms": round(stage5_duration * 1000, 2),
            "status": "completed",
            "metrics": {
                "total_pipeline_time_ms": round(total_duration * 1000, 2)
            }
        })

        analytics["pipeline_stages"] = self.pipeline_stages
        analytics["processing_mode"] = "local"
        analytics["processing_mode_label"] = "Local Demo"
        analytics["execution_time_ms"] = round(total_duration * 1000, 2)
        analytics["parsed_records"] = parsed_records

        return analytics

    def _structure_analytics(self, counts: Dict[str, int], records: List[Dict[str, Any]], malformed: int) -> Dict[str, Any]:
        total_requests = counts.get("TOTAL_REQUESTS", 0)
        successful_requests = counts.get("TOTAL_SUCCESS", 0)
        error_requests = counts.get("TOTAL_ERRORS", 0)

        # Unique IPs
        unique_ips = set()
        ip_stats = defaultdict(lambda: {"total": 0, "success": 0, "errors": 0})
        urls = defaultdict(int)
        methods = defaultdict(int)
        status_codes = defaultdict(int)
        status_categories = {
            "2xx": counts.get("STATUS_CAT_2xx", 0),
            "3xx": counts.get("STATUS_CAT_3xx", 0),
            "4xx": counts.get("STATUS_CAT_4xx", 0),
            "5xx": counts.get("STATUS_CAT_5xx", 0),
        }
        traffic_daily = defaultdict(int)
        traffic_hourly = defaultdict(int)
        error_codes = defaultdict(int)
        error_urls = defaultdict(int)
        error_ips = defaultdict(int)

        for key, val in counts.items():
            if key.startswith("IP_SUCC_"):
                ip = key[8:]
                unique_ips.add(ip)
                ip_stats[ip]["success"] += val
                ip_stats[ip]["total"] += val
            elif key.startswith("IP_ERR_"):
                ip = key[7:]
                unique_ips.add(ip)
                ip_stats[ip]["errors"] += val
                ip_stats[ip]["total"] += val
            elif key.startswith("IP_") and not key.startswith("IP_SUCC_") and not key.startswith("IP_ERR_"):
                ip = key[3:]
                unique_ips.add(ip)
            elif key.startswith("STATUS_") and not key.startswith("STATUS_CAT_"):
                code = key[7:]
                status_codes[code] = val
            elif key.startswith("URL_"):
                url = key[4:]
                urls[url] = val
            elif key.startswith("METHOD_"):
                method = key[7:]
                methods[method] = val
            elif key.startswith("TIME_DAY_"):
                day = key[9:]
                traffic_daily[day] = val
            elif key.startswith("TIME_HOUR_"):
                hour = key[10:]
                traffic_hourly[hour] = val
            elif key.startswith("ERROR_CODE_"):
                code = key[11:]
                error_codes[code] = val
            elif key.startswith("ERROR_URL_"):
                url = key[10:]
                error_urls[url] = val
            elif key.startswith("ERROR_IP_"):
                ip = key[9:]
                error_ips[ip] = val

        # Sorted URLs
        sorted_urls = [
            {"url": u, "count": c}
            for u, c in sorted(urls.items(), key=lambda x: x[1], reverse=True)
        ]

        # Sorted IPs
        sorted_ips = [
            {
                "ip": ip,
                "requests": data["total"],
                "success": data["success"],
                "errors": data["errors"]
            }
            for ip, data in sorted(ip_stats.items(), key=lambda x: x[1]["total"], reverse=True)
        ]

        # Sorted Status Codes
        sorted_status_codes = [
            {"code": code, "count": count}
            for code, count in sorted(status_codes.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 999)
        ]

        # HTTP Methods
        sorted_methods = [
            {"method": m, "count": c}
            for m, c in sorted(methods.items(), key=lambda x: x[1], reverse=True)
        ]

        # Traffic over time (sorted chronologically)
        sorted_hourly = [
            {"time": t, "requests": c}
            for t, c in sorted(traffic_hourly.items()) if t != "UNKNOWN_HOUR"
        ]
        sorted_daily = [
            {"time": t, "requests": c}
            for t, c in sorted(traffic_daily.items()) if t != "UNKNOWN_DAY"
        ]

        # Error analysis details
        error_details = []
        for code, count in sorted(error_codes.items(), key=lambda x: x[1], reverse=True):
            pct = round((count / error_requests * 100), 2) if error_requests > 0 else 0
            # Common HTTP error titles
            title_map = {
                "400": "Bad Request",
                "401": "Unauthorized",
                "403": "Forbidden",
                "404": "Not Found",
                "500": "Internal Server Error",
                "502": "Bad Gateway",
                "503": "Service Unavailable"
            }
            error_details.append({
                "code": code,
                "title": title_map.get(code, f"HTTP {code}"),
                "count": count,
                "percentage": pct
            })

        top_error_urls = [
            {"url": u, "count": c}
            for u, c in sorted(error_urls.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        top_error_ips = [
            {"ip": ip, "count": c}
            for ip, c in sorted(error_ips.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        return {
            "summary": {
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "error_requests": error_requests,
                "unique_ips": len(unique_ips),
                "malformed_lines": malformed,
                "success_rate": round((successful_requests / total_requests * 100), 2) if total_requests > 0 else 0,
                "error_rate": round((error_requests / total_requests * 100), 2) if total_requests > 0 else 0,
            },
            "status_codes": sorted_status_codes,
            "status_categories": [
                {"category": "2xx Success", "key": "2xx", "count": status_categories["2xx"], "color": "#10B981"},
                {"category": "3xx Redirection", "key": "3xx", "count": status_categories["3xx"], "color": "#3B82F6"},
                {"category": "4xx Client Error", "key": "4xx", "count": status_categories["4xx"], "color": "#F59E0B"},
                {"category": "5xx Server Error", "key": "5xx", "count": status_categories["5xx"], "color": "#EF4444"},
            ],
            "urls": sorted_urls,
            "ips": sorted_ips,
            "methods": sorted_methods,
            "traffic": {
                "hourly": sorted_hourly,
                "daily": sorted_daily
            },
            "errors": {
                "total_errors": error_requests,
                "error_rate": round((error_requests / total_requests * 100), 2) if total_requests > 0 else 0,
                "unique_error_ips": len(error_ips),
                "distribution": error_details,
                "top_affected_urls": top_error_urls,
                "top_error_ips": top_error_ips
            }
        }
