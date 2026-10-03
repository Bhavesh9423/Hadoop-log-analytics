import os
import shutil
import subprocess
import time
from typing import Dict, Any, Tuple
from config import Config
from processors.local_engine import LocalMapReduceEngine
from processors.log_parser import parse_log_line

class HadoopUnavailableError(Exception):
    pass

class HadoopMapReduceEngine:
    """
    Executes actual Hadoop Streaming MapReduce jobs on a live Hadoop cluster / single-node installation.
    """

    def __init__(self, hadoop_home: str = None, hdfs_uri: str = None):
        self.hadoop_home = hadoop_home or Config.HADOOP_HOME
        self.hdfs_uri = hdfs_uri or Config.HDFS_URI
        self.pipeline_stages = []

    @classmethod
    def check_availability(cls) -> Tuple[bool, str]:
        """
        Tests if Hadoop and HDFS binaries are accessible.
        Returns (is_available, message)
        """
        hadoop_cmd = shutil.which("hadoop")
        hdfs_cmd = shutil.which("hdfs")

        if not hadoop_cmd and not hdfs_cmd:
            if not Config.HADOOP_HOME:
                return False, "Hadoop binaries not found in PATH and HADOOP_HOME environment variable is not defined."
            # Check within HADOOP_HOME/bin
            hadoop_bin = os.path.join(Config.HADOOP_HOME, "bin", "hadoop")
            hdfs_bin = os.path.join(Config.HADOOP_HOME, "bin", "hdfs")
            if not (os.path.exists(hadoop_bin) or os.path.exists(hadoop_bin + ".cmd")):
                return False, f"Hadoop executable not found in {Config.HADOOP_HOME}/bin"

        # Try executing hadoop version
        cmd = hadoop_cmd or "hadoop"
        try:
            res = subprocess.run([cmd, "version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            if res.returncode == 0:
                first_line = res.stdout.strip().splitlines()[0] if res.stdout else "Hadoop ready"
                return True, f"Hadoop detected: {first_line}"
            return False, f"Hadoop command returned error: {res.stderr.strip()[:150]}"
        except Exception as e:
            return False, f"Failed to execute hadoop command: {str(e)}"

    def execute(self, filepath: str) -> Dict[str, Any]:
        is_avail, msg = self.check_availability()
        if not is_avail:
            raise HadoopUnavailableError(msg)

        start_total = time.time()
        self.pipeline_stages = []
        filename = os.path.basename(filepath)
        hdfs_input_file = f"{Config.HDFS_INPUT_DIR}/{filename}"
        hdfs_output_dir = f"{Config.HDFS_OUTPUT_DIR}_{int(time.time())}"

        # 1. HDFS Input Ingestion
        s1_start = time.time()
        # hdfs dfs -mkdir -p /loganalysis/input
        subprocess.run(["hdfs", "dfs", "-mkdir", "-p", Config.HDFS_INPUT_DIR], check=True)
        # hdfs dfs -put -f <filepath> /loganalysis/input/<filename>
        subprocess.run(["hdfs", "dfs", "-put", "-f", filepath, hdfs_input_file], check=True)
        s1_dur = time.time() - s1_start
        self.pipeline_stages.append({
            "stage_id": "hdfs_put",
            "name": "HDFS Input Ingestion",
            "description": f"Transferred {filename} into HDFS distributed filesystem at {hdfs_input_file}.",
            "duration_ms": round(s1_dur * 1000, 2),
            "status": "completed",
            "metrics": {"hdfs_path": hdfs_input_file}
        })

        # 2. Locate Streaming Jar
        streaming_jar = Config.HADOOP_STREAMING_JAR
        if not streaming_jar and Config.HADOOP_HOME:
            tools_lib = os.path.join(Config.HADOOP_HOME, "share", "hadoop", "tools", "lib")
            if os.path.exists(tools_lib):
                for f in os.listdir(tools_lib):
                    if f.startswith("hadoop-streaming") and f.endswith(".jar"):
                        streaming_jar = os.path.join(tools_lib, f)
                        break

        mapper_script = os.path.join(Config.HADOOP_SCRIPTS_DIR, "mapper.py")
        reducer_script = os.path.join(Config.HADOOP_SCRIPTS_DIR, "reducer.py")

        # 3. Execute MapReduce Job on Hadoop
        s2_start = time.time()
        cmd = [
            "hadoop", "jar", streaming_jar,
            "-D", "mapreduce.job.name=Hadoop_Log_Analytics_Web",
            "-files", f"{mapper_script},{reducer_script}",
            "-mapper", "python3 mapper.py",
            "-reducer", "python3 reducer.py",
            "-input", hdfs_input_file,
            "-output", hdfs_output_dir
        ]
        job_res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if job_res.returncode != 0:
            raise RuntimeError(f"Hadoop MapReduce job failed: {job_res.stderr[-500:]}")
        s2_dur = time.time() - s2_start

        self.pipeline_stages.append({
            "stage_id": "hadoop_mapreduce",
            "name": "Hadoop Distributed MapReduce Execution",
            "description": f"Executed MapReduce streaming job across YARN cluster nodes to {hdfs_output_dir}.",
            "duration_ms": round(s2_dur * 1000, 2),
            "status": "completed",
            "metrics": {"output_dir": hdfs_output_dir}
        })

        # 4. Fetch Reduced Output from HDFS
        s3_start = time.time()
        cat_res = subprocess.run(["hdfs", "dfs", "-cat", f"{hdfs_output_dir}/part-*"],
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        raw_reduced_output = cat_res.stdout
        s3_dur = time.time() - s3_start

        self.pipeline_stages.append({
            "stage_id": "hdfs_fetch",
            "name": "HDFS Result Retrieval",
            "description": f"Retrieved and merged partitioned output part-* from HDFS.",
            "duration_ms": round(s3_dur * 1000, 2),
            "status": "completed",
            "metrics": {"bytes_retrieved": len(raw_reduced_output)}
        })

        # Parse reduced key-values into dictionary
        counts = {}
        for line in raw_reduced_output.splitlines():
            parts = line.strip().split("\t")
            if len(parts) == 2:
                try:
                    counts[parts[0]] = int(parts[1])
                except ValueError:
                    continue

        # Also parse raw lines for interactive log records table
        parsed_records = []
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            for l in f:
                p = parse_log_line(l)
                if p:
                    parsed_records.append(p)

        local_helper = LocalMapReduceEngine()
        analytics = local_helper._structure_analytics(counts, parsed_records, counts.get("STAT_MALFORMED", 0))

        total_dur = time.time() - start_total
        analytics["pipeline_stages"] = self.pipeline_stages
        analytics["processing_mode"] = "hadoop"
        analytics["processing_mode_label"] = "Hadoop"
        analytics["execution_time_ms"] = round(total_dur * 1000, 2)
        analytics["parsed_records"] = parsed_records

        return analytics
