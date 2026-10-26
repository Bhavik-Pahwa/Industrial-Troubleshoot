"""Send synthetic readings over HTTP; this module never connects to equipment."""

import argparse
import json
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from indux.time import utc_now


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    parser.add_argument("--count", type=int, default=20)
    parser.add_argument("--interval", type=float, default=1)
    parser.add_argument("--anomaly", action="store_true", help="Inject demo threshold anomalies")
    args = parser.parse_args()
    if args.count < 1 or args.interval < 0:
        parser.error("count must be positive and interval must be nonnegative")
    for index in range(args.count):
        timestamp = utc_now()
        abnormal = args.anomaly and index % 10 >= 3
        readings = [
            {
                "asset_id": asset,
                "sensor_id": sensor,
                "value": value,
                "unit": unit,
                "timestamp": timestamp,
            }
            for asset in ("pump-01", "motor-01")
            for sensor, value, unit in (
                ("temperature", 105 if abnormal else 55 + index % 5, "degC"),
                ("vibration", 9 if abnormal else 2 + index % 3 * 0.1, "mm/s"),
            )
        ]
        request = Request(
            args.url.rstrip("/") + "/api/v1/telemetry/ingest",
            data=json.dumps({"source_id": "demo-simulator", "readings": readings}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=10) as response:
                print(response.read().decode())
        except (HTTPError, URLError) as exc:
            parser.exit(1, f"Simulator could not send telemetry: {exc}\n")
        if index + 1 < args.count:
            time.sleep(args.interval)


if __name__ == "__main__":
    main()
