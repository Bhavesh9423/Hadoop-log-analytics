import os
import random
from datetime import datetime, timedelta

def generate_sample_log(filepath, count=5500):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    ips = [
        "192.168.1.10", "192.168.1.11", "192.168.1.12", "192.168.1.25",
        "192.168.1.42", "192.168.1.55", "10.0.0.15", "10.0.0.24",
        "10.0.0.88", "172.16.0.4", "172.16.0.19", "203.0.113.195",
        "198.51.100.44", "198.51.100.82", "54.239.28.85", "34.205.11.23",
        "185.191.171.12", "66.249.66.1", "157.55.39.2", "40.77.167.1"
    ]
    # Add some random IP generator pool
    for i in range(1, 120):
        ips.append(f"192.168.{random.randint(2, 20)}.{random.randint(1, 254)}")
    for i in range(1, 80):
        ips.append(f"10.{random.randint(1, 10)}.{random.randint(1, 50)}.{random.randint(1, 254)}")

    urls = [
        "/home", "/products", "/login", "/about", "/contact",
        "/cart", "/checkout", "/api/v1/auth", "/api/v1/products",
        "/api/v1/orders", "/docs/getting-started", "/blog/hadoop-analytics",
        "/dashboard", "/settings", "/profile", "/search",
        "/assets/main.css", "/assets/app.js", "/images/banner.jpg",
        "/admin", "/admin/metrics", "/api/v2/telemetry"
    ]
    
    url_weights = [
        25, 20, 15, 8, 5,
        10, 6, 12, 18,
        7, 4, 3,
        9, 5, 6, 11,
        8, 8, 7,
        2, 1, 3
    ]
    
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    method_weights = [72, 18, 5, 3, 2]
    
    # HTTP status distribution realistic
    statuses_normal = [200, 200, 200, 200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 500, 502, 503]
    status_weights = [55, 10, 5, 2, 3, 2, 4, 2, 3, 2, 2, 2, 5, 2, 1, 0.5]
    
    base_time = datetime(2026, 10, 1, 8, 0, 0)
    current_time = base_time

    lines = []
    for i in range(count):
        # advance time slightly
        current_time += timedelta(seconds=random.randint(1, 45))
        # format: 03/Oct/2026:10:15:20
        ts_str = current_time.strftime("%d/%b/%Y:%H:%M:%S")
        
        ip = random.choice(ips)
        url = random.choices(urls, weights=url_weights, k=1)[0]
        method = random.choices(methods, weights=method_weights, k=1)[0]
        
        # Determine status logically
        if url.startswith("/admin") and random.random() < 0.6:
            status = random.choice([401, 403])
        elif url == "/login" and method == "POST" and random.random() < 0.2:
            status = 401
        elif "api" in url and random.random() < 0.08:
            status = random.choice([500, 502, 503])
        elif random.random() < 0.04:
            status = 404
        else:
            status = random.choices(statuses_normal, weights=status_weights, k=1)[0]
        
        # log format: 192.168.1.10 - - [03/Oct/2026:10:15:20] "GET /home HTTP/1.1" 200
        line = f'{ip} - - [{ts_str}] "{method} {url} HTTP/1.1" {status}'
        lines.append(line)
        
    # Introduce a couple of malformed lines to test graceful degradation
    malformed_indices = [150, 1200, 3400]
    for idx in malformed_indices:
        if idx < len(lines):
            lines[idx] = "MALFORMED LOG ENTRY ::: INVALID SYNTAX"
            
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
        
    print(f"Generated {len(lines)} records at {filepath}")

def generate_sample_csv(filepath, count=5500):
    import csv
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    ips = [
        "192.168.1.10", "192.168.1.11", "192.168.1.12", "192.168.1.25",
        "192.168.1.42", "192.168.1.55", "10.0.0.15", "10.0.0.24",
        "10.0.0.88", "172.16.0.4", "172.16.0.19", "203.0.113.195",
        "198.51.100.44", "198.51.100.82", "54.239.28.85", "34.205.11.23"
    ]
    for i in range(1, 100):
        ips.append(f"192.168.{random.randint(2, 20)}.{random.randint(1, 254)}")

    urls = [
        "/home", "/products", "/login", "/about", "/contact",
        "/cart", "/checkout", "/api/v1/auth", "/api/v1/products",
        "/api/v1/orders", "/docs/getting-started", "/blog/hadoop-analytics",
        "/dashboard", "/settings", "/profile", "/search",
        "/assets/main.css", "/assets/app.js", "/admin"
    ]
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    method_weights = [72, 18, 5, 3, 2]
    statuses_normal = [200, 200, 200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 500, 502, 503]
    
    base_time = datetime(2026, 10, 1, 8, 0, 0)
    current_time = base_time

    rows = [["ip", "timestamp", "method", "url", "status_code"]]
    for i in range(count):
        current_time += timedelta(seconds=random.randint(1, 40))
        ts_str = current_time.strftime("%d/%b/%Y:%H:%M:%S")
        ip = random.choice(ips)
        url = random.choice(urls)
        method = random.choices(methods, weights=method_weights, k=1)[0]
        
        if url.startswith("/admin") and random.random() < 0.6:
            status = random.choice([401, 403])
        elif url == "/login" and method == "POST" and random.random() < 0.2:
            status = 401
        elif "api" in url and random.random() < 0.08:
            status = random.choice([500, 502, 503])
        elif random.random() < 0.05:
            status = 404
        else:
            status = random.choice(statuses_normal)
            
        rows.append([ip, ts_str, method, url, status])

    with open(filepath, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
        
    print(f"Generated {len(rows)-1} CSV log records at {filepath}")

if __name__ == "__main__":
    generate_sample_log("d:/Hadoop_Micro/data/sample_access.log", 5500)
    generate_sample_csv("d:/Hadoop_Micro/data/sample_logs.csv", 5500)
