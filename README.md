# Hadoop Log File Analytics Dashboard
> **Web-Based Log File Analysis and Visualization Using Hadoop MapReduce**  
> *A comprehensive Big Data Analytics & Visualization Micro-Project for College Demonstrations*

---

## 1. Project Overview

The **Hadoop Log File Analytics Dashboard** is a full-stack distributed computing and data visualization web application. It ingests web/application server access logs in both text formats (Apache / Nginx `.log` / `.txt`) and structured **`.csv`** format, processes the log records using an authentic **Hadoop MapReduce pipeline** (or its local Python simulation engine), and presents an interactive, high-performance executive analytics dashboard.

This project is tailored specifically for **academic evaluations, college micro-projects, and big data viva voce examinations**, featuring dual processing engines:
1. **Hadoop Mode**: Interfaces directly with an Apache Hadoop cluster using **HDFS** commands and **Hadoop Streaming** (`mapper.py` and `reducer.py`).
2. **Local Demo Mode**: Executes the exact same Mapper, Shuffle & Sort, and Reducer stages locally in Python—allowing live presentations on laptops without requiring a multi-gigabyte Hadoop cluster.

---

## 2. Key Features

- **Dynamic MapReduce Processing Pipeline**:
  - Raw Log Ingestion & HDFS Staging
  - Tokenizing Mapper phase (`mapper.py`) emitting `<Key, 1>` intermediate pairs
  - In-memory alphanumeric Shuffle & Sort partitioner
  - Reducer phase (`reducer.py`) calculating aggregated totals (`<Key, Sum>`)
  - Real-time pipeline stage telemetry with millisecond execution metrics.
- **Dual Processing Engines**:
  - Toggle between **Local Demo Mode** and **Hadoop Mode** at runtime.
  - Transparent processing mode badge in the UI (no false claims).
- **Executive KPI Cards**:
  - Total Requests processed
  - Successful Requests count & success percentage (2xx/3xx)
  - Error Requests count & error percentage (4xx/5xx)
  - Unique Client IP Addresses
  - MapReduce Execution Latency (ms)
- **Interactive Visualizations**:
  - **Requests Over Time**: Chronological area chart with **Hourly** and **Daily** aggregation toggles.
  - **HTTP Status Code Breakdown**: Bar chart displaying only actual codes found in the uploaded file, plus 2xx / 3xx / 4xx / 5xx category progress bars.
  - **Top Visited URLs**: Horizontal bar rankings with Top 5, Top 10, and Top 20 selectors.
  - **HTTP Methods Distribution**: Interactive donut chart & legend for GET, POST, PUT, DELETE, PATCH.
  - **Top Requesting IP Addresses**: Tabular analysis with Total Hits, Successes, Errors, and Error Rates.
  - **Dedicated Error Analysis**: In-depth inspection of 404 Not Found, 500 Internal Server Error, 401 Unauthorized, affected URLs, and offending IPs.
- **Recent Log Activity & Explorer**:
  - Paginated table showing Timestamp, Client IP, Method, URL, and Status Code.
  - Live keyword search and filtering.
- **Reporting & Export**:
  - **Download CSV**: Comprehensive aggregated metrics spreadsheet.
  - **Download JSON**: Structured metadata payload.
- **Built-in 5,500+ Line Sample Dataset**:
  - Instant one-click demo testing (`data/sample_access.log`).

---

## 3. Architecture

```text
User Browser (React + Vite + Tailwind CSS)
                   │
                   ▼ (HTTP / REST API)
       Flask Backend (Python 3.x)
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
[Local Demo Engine]      [Hadoop Cluster Engine]
  • Input Buffer           • HDFS Put (/loganalysis/input)
  • Local Mapper           • Hadoop Streaming Job
  • Shuffle & Sort         • Distributed Mappers
  • Local Reducer          • YARN Shuffle & Sort
  • Result Parser          • Distributed Reducers
                           • HDFS Cat (/loganalysis/output)
    └──────────────┬──────────────┘
                   │
                   ▼
     Structured Analytics JSON
                   │
                   ▼
  Interactive Analytics Dashboard
```

---

## 4. Technology Stack

- **Frontend**:
  - React 19
  - Vite 8
  - Tailwind CSS v4
  - Lucide React Icons
  - Recharts (Data Visualizations)
- **Backend**:
  - Python 3.10+
  - Flask 3.x
  - Flask-CORS
  - Python Logging
- **Distributed Computing / Hadoop**:
  - Apache Hadoop 3.x / 2.x
  - HDFS (Hadoop Distributed File System)
  - Hadoop Streaming (`hadoop-streaming-*.jar`)
  - MapReduce Mapper (`hadoop/mapper.py`)
  - MapReduce Reducer (`hadoop/reducer.py`)

---

## 5. Project Directory Structure

```text
Hadoop_Micro/
│
├── backend/
│   ├── app.py                     # Flask REST API server
│   ├── config.py                  # Configuration & Environment variables
│   ├── requirements.txt           # Python dependencies
│   ├── processors/
│   │   ├── log_parser.py          # Regex parser for Apache/Nginx logs
│   │   ├── local_engine.py        # Local MapReduce simulation pipeline
│   │   └── hadoop_engine.py       # HDFS & Hadoop Streaming interface
│   ├── uploads/                   # Staged upload directory
│   └── results/                   # Result cache
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js             # Vite configuration with proxy to :5000
│   ├── index.html
│   └── src/
│       ├── App.jsx                # Main application component
│       ├── main.jsx
│       ├── index.css              # Tailwind CSS imports & styles
│       ├── services/
│       │   └── api.js             # Frontend API client
│       └── components/
│           ├── Header.jsx         # Status, modes, and quick actions
│           ├── Sidebar.jsx        # Navigation sidebar
│           ├── KPICards.jsx       # 4 KPI cards & latency
│           ├── FileUpload.jsx     # Drag & drop upload component
│           ├── ProcessingPipeline.jsx # MapReduce visualizer
│           ├── TrafficChart.jsx   # Hourly/Daily traffic line chart
│           ├── StatusChart.jsx    # Status codes bar chart
│           ├── URLChart.jsx       # Top visited URLs rankings
│           ├── IPTable.jsx        # IP addresses table
│           ├── MethodChart.jsx    # HTTP methods donut chart
│           ├── ErrorAnalysis.jsx  # Dedicated error audit
│           ├── FilterPanel.jsx    # Multi-field filtering
│           ├── LogTable.jsx       # Paginated log records explorer
│           ├── EmptyState.jsx     # Clean empty state
│           └── pages/
│               ├── DashboardView.jsx
│               ├── UploadView.jsx
│               ├── DetailedAnalysisView.jsx
│               ├── ReportsView.jsx
│               ├── AboutView.jsx
│               └── SettingsView.jsx
│
├── hadoop/
│   ├── mapper.py                  # Hadoop Streaming Mapper
│   ├── reducer.py                 # Hadoop Streaming Reducer
│   ├── run_hadoop_streaming.sh    # Linux/Mac cluster execution script
│   ├── run_hadoop_streaming.bat   # Windows cluster execution script
│   └── README.md                  # Dedicated Hadoop commands documentation
│
├── data/
│   └── sample_access.log          # 5,500 realistic access log records
│
├── generate_sample.py             # Dataset generator script
└── README.md
```

---

## 6. Installation & Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js v18+ & npm**
- *(Optional)* **Apache Hadoop 3.x** for live cluster mode.

### Step 1: Install Backend Dependencies
```bash
cd backend
python -m pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 7. Running the Application

### Start the Flask Backend (Port 5000)
```bash
cd backend
python app.py
```
*Backend runs on `http://127.0.0.1:5000`.*

### Start the Vite Frontend (Port 3000)
In a separate terminal:
```bash
cd frontend
npm run dev
```
*Open your browser and navigate to `http://localhost:3000`.*

---

## 8. Running in Local Demo Mode vs Hadoop Mode

### Local Demo Mode (Default)
1. Open `http://localhost:3000`.
2. Notice the badge: `Processing Mode: Local Demo`.
3. Click **"Load Sample (5.5k)"** in the top bar or upload any `.log` / `.txt` file.
4. The Python pipeline executes the Mapper, Shuffle & Sort, and Reducer stages locally, updating the dashboard in ~120 ms.

### Hadoop Mode (Actual Hadoop Cluster)
To execute on an actual Hadoop cluster:
1. Ensure Hadoop is running (`jps` shows NameNode, DataNode, ResourceManager, NodeManager).
2. Set environment variables:
   ```bash
   export HADOOP_HOME=/path/to/hadoop
   export HADOOP_MODE=hadoop
   ```
3. In the Web UI, go to **Settings & Cluster** and select **Hadoop Cluster Mode**.
4. Upload a log file. The backend will automatically stage it into HDFS at `/loganalysis/input/` and launch the Hadoop Streaming MapReduce job.

---

## 9. Hadoop & HDFS Command Reference

### Create HDFS Input Directory
```bash
hdfs dfs -mkdir -p /loganalysis/input
```

### Upload Log File to HDFS
```bash
hdfs dfs -put data/sample_access.log /loganalysis/input/
```

### Verify File in HDFS
```bash
hdfs dfs -ls /loganalysis/input
hdfs dfs -head /loganalysis/input/sample_access.log
```

### Execute Hadoop Streaming MapReduce Job
```bash
hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \
    -D mapreduce.job.name="Hadoop_Log_Analytics_Job" \
    -D mapreduce.job.reduces=2 \
    -files hadoop/mapper.py,hadoop/reducer.py \
    -mapper "python3 mapper.py" \
    -reducer "python3 reducer.py" \
    -input /loganalysis/input/sample_access.log \
    -output /loganalysis/output
```

### Inspect Output in HDFS
```bash
hdfs dfs -ls /loganalysis/output
hdfs dfs -cat /loganalysis/output/part-* | head -n 30
```

---

## 10. Mapper and Reducer Logic

### Mapper (`hadoop/mapper.py`)
- Reads raw log lines from `sys.stdin`.
- Applies regex to extract: Client IP, Timestamp, HTTP Method, Requested URL, and HTTP Status Code.
- Emits intermediate tab-separated `<Key, Value>` pairs:
  ```text
  TOTAL_REQUESTS       1
  STATUS_200           1
  STATUS_CAT_2xx       1
  URL_/home            1
  IP_192.168.1.10      1
  METHOD_GET           1
  TIME_HOUR_2026-10-01 10:00  1
  TIME_DAY_2026-10-01  1
  ERROR_CODE_404       1   (if status >= 400)
  ERROR_URL_/products  1
  ```

### Reducer (`hadoop/reducer.py`)
- Reads sorted key-value pairs from `sys.stdin` (Shuffle & Sort phase).
- Accumulates the count for identical keys.
- Emits aggregated results:
  ```text
  TOTAL_REQUESTS       5497
  STATUS_200           3884
  STATUS_404           479
  URL_/home            700
  IP_192.168.1.10      48
  ```

---

## 11. REST API Documentation

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | System status and Hadoop binary diagnostics |
| `/api/config` | GET, POST | Get or toggle processing mode (`local` or `hadoop`) |
| `/api/upload` | POST | Multipart upload of `.log` or `.txt` file |
| `/api/analyze` | POST | Trigger MapReduce analysis on active file |
| `/api/load-sample`| POST | Ingest and analyze pre-packaged 5,500 record sample |
| `/api/summary` | GET | Executive KPI metrics (total, success, error, unique IPs) |
| `/api/status-codes`| GET | Response codes list and 2xx/3xx/4xx/5xx category summary |
| `/api/urls` | GET | Top visited endpoints (`?limit=10`) |
| `/api/ips` | GET | Top requesting client IP addresses (`?limit=10`) |
| `/api/methods` | GET | HTTP method distribution (GET, POST, etc.) |
| `/api/traffic` | GET | Time-series data (`?granularity=hourly` or `daily`) |
| `/api/errors` | GET | Breakdown of 4xx/5xx errors, affected URLs, and IPs |
| `/api/logs` | GET | Paginated log records explorer with live search filters |
| `/api/pipeline` | GET | Telemetry data for all 5 MapReduce pipeline stages |
| `/api/export/csv` | GET | Download aggregated CSV report |
| `/api/export/json`| GET | Download structured JSON report |

---

## 12. College Project Viva Voce Guide

### Q1: What is Apache Hadoop?
> Apache Hadoop is an open-source framework designed for distributed storage (HDFS) and distributed processing (MapReduce) across clusters of commodity hardware.

### Q2: What is the role of HDFS?
> The Hadoop Distributed File System splits large files into blocks (default 128 MB), replicates them across DataNodes for fault tolerance, and tracks block metadata using the NameNode.

### Q3: Explain the MapReduce lifecycle.
> 1. **Input Split**: Data is chunked into logical splits.  
> 2. **Mapper**: Converts input records into intermediate `<Key, Value>` pairs.  
> 3. **Shuffle & Sort**: Hadoop routes identical keys to the same reducer and sorts them alphabetically.  
> 4. **Reducer**: Computes aggregations over all values matching each unique key.  
> 5. **Output**: Writes final results back to HDFS.

---

## 13. License
Academic Open-Source License. Designed for education, coursework, and college big-data demonstrations.
