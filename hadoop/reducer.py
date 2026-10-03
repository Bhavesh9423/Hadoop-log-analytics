#!/usr/bin/env python3
"""
Hadoop MapReduce - Log File Reducer
Reads sorted key-value pairs from standard input (Shuffle & Sort phase)
and aggregates the values for each key.

Compatible with Hadoop Streaming:
  hadoop jar hadoop-streaming.jar \
    -file mapper.py -mapper mapper.py \
    -file reducer.py -reducer reducer.py \
    -input /loganalysis/input \
    -output /loganalysis/output
"""

import sys

def main():
    current_key = None
    current_count = 0

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        parts = line.split('\t')
        if len(parts) != 2:
            continue

        key, value = parts
        try:
            count = int(value)
        except ValueError:
            continue

        # In Hadoop Streaming, input to reducer is sorted by key
        if current_key == key:
            current_count += count
        else:
            if current_key is not None:
                # Output key and aggregated sum
                sys.stdout.write(f"{current_key}\t{current_count}\n")
            current_key = key
            current_count = count

    # Output the last key
    if current_key is not None:
        sys.stdout.write(f"{current_key}\t{current_count}\n")

if __name__ == "__main__":
    main()
