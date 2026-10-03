@echo off
rem ==============================================================================
rem Hadoop Streaming Execution Script (Windows) for Log File Analysis
rem ==============================================================================

setlocal enabledelayedexpansion

if "%HADOOP_HOME%"=="" (
    echo [ERROR] HADOOP_HOME environment variable is not defined.
    echo Please set HADOOP_HOME to your Hadoop installation folder.
    exit /b 1
)

set INPUT_PATH=%1
if "%INPUT_PATH%"=="" set INPUT_PATH=/loganalysis/input/sample_access.log

set OUTPUT_PATH=%2
if "%OUTPUT_PATH%"=="" set OUTPUT_PATH=/loganalysis/output

set SCRIPT_DIR=%~dp0
set MAPPER_PATH=%SCRIPT_DIR%mapper.py
set REDUCER_PATH=%SCRIPT_DIR%reducer.py

echo Finding hadoop-streaming jar...
for /r "%HADOOP_HOME%\share\hadoop\tools\lib" %%f in (hadoop-streaming-*.jar) do (
    set STREAMING_JAR=%%f
    goto :jar_found
)

:jar_found
if "%STREAMING_JAR%"=="" (
    echo [ERROR] hadoop-streaming jar not found under %HADOOP_HOME%\share\hadoop\tools\lib
    exit /b 1
)

echo ==========================================================
echo Starting Hadoop MapReduce Log Analysis Job
echo Input HDFS:   %INPUT_PATH%
echo Output HDFS:  %OUTPUT_PATH%
echo Streaming Jar: %STREAMING_JAR%
echo ==========================================================

echo Removing existing HDFS output directory if any...
call hdfs dfs -rm -r -f %OUTPUT_PATH%

call hadoop jar "%STREAMING_JAR%" ^
    -D mapreduce.job.name="Hadoop_Log_Analytics_Job" ^
    -D mapreduce.job.reduces=2 ^
    -files "%MAPPER_PATH%,%REDUCER_PATH%" ^
    -mapper "python mapper.py" ^
    -reducer "python reducer.py" ^
    -input %INPUT_PATH% ^
    -output %OUTPUT_PATH%

echo ==========================================================
echo Hadoop Job Completed! Reading HDFS output...
call hdfs dfs -cat %OUTPUT_PATH%/part-*
