#!/usr/bin/env bash
# ==============================================================================
# Hadoop Streaming Execution Script for Log File Analysis
# ==============================================================================
# Usage:
#   ./run_hadoop_streaming.sh <input_file_or_hdfs_path> [output_hdfs_dir]
#
# Prerequisites:
#   - Hadoop 3.x or 2.x installed and running (NameNode + DataNodes + YARN/MR)
#   - HADOOP_HOME environment variable defined
# ==============================================================================

set -e

INPUT_PATH=${1:-"/loganalysis/input/sample_access.log"}
OUTPUT_PATH=${2:-"/loganalysis/output"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAPPER_PATH="${SCRIPT_DIR}/mapper.py"
REDUCER_PATH="${SCRIPT_DIR}/reducer.py"

# Locate hadoop-streaming jar
if [ -z "$HADOOP_HOME" ]; then
    echo "ERROR: HADOOP_HOME is not set. Please export HADOOP_HOME=/path/to/hadoop"
    exit 1
fi

STREAMING_JAR=$(find "$HADOOP_HOME/share/hadoop/tools/lib" -name "hadoop-streaming-*.jar" | head -n 1)

if [ -z "$STREAMING_JAR" ]; then
    echo "ERROR: hadoop-streaming-*.jar not found under $HADOOP_HOME/share/hadoop/tools/lib"
    exit 1
fi

echo "=========================================================="
echo "Starting Hadoop MapReduce Log Analysis Job"
echo "Input HDFS:   $INPUT_PATH"
echo "Output HDFS:  $OUTPUT_PATH"
echo "Streaming Jar: $STREAMING_JAR"
echo "=========================================================="

# Remove previous output directory if exists (Hadoop requirement)
echo "Removing existing HDFS output directory if any..."
hdfs dfs -rm -r -f "$OUTPUT_PATH" || true

# Execute MapReduce job via Hadoop Streaming
hadoop jar "$STREAMING_JAR" \
    -D mapreduce.job.name="Hadoop_Log_Analytics_Job" \
    -D mapreduce.job.reduces=2 \
    -files "$MAPPER_PATH,$REDUCER_PATH" \
    -mapper "python3 mapper.py" \
    -reducer "python3 reducer.py" \
    -input "$INPUT_PATH" \
    -output "$OUTPUT_PATH"

echo "=========================================================="
echo "Hadoop MapReduce Job Finished Successfully!"
echo "Displaying sample output from HDFS:"
hdfs dfs -cat "$OUTPUT_PATH/part-*" | head -n 25
echo "=========================================================="
