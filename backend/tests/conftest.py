import re
from pathlib import Path

import pytest
import yaml
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator, FormatChecker

from indux.config import Settings
from indux.main import create_app
from indux.time import utc_now

CONTRACT = yaml.safe_load(
    (Path(__file__).resolve().parents[2] / "INDUX_backend_api.yaml").read_text()
)


class ContractClient(TestClient):
    """Validate every exercised HTTP response against the user's original API contract."""

    def request(self, method, url, **kwargs):
        response = super().request(method, url, **kwargs)
        path = response.request.url.path.removeprefix("/api/v1")
        for template, methods in CONTRACT["paths"].items():
            if not re.fullmatch(re.sub(r"\{[^}]+\}", "[^/]+", template), path):
                continue
            operation = methods.get(method.lower())
            if not operation:
                break
            declared = operation["responses"].get(str(response.status_code))
            if declared and "$ref" in declared:
                declared = CONTRACT["components"]["responses"][declared["$ref"].split("/")[-1]]
            schema = (
                declared["content"]["application/json"]["schema"]
                if declared
                else {"$ref": "#/components/schemas/ApiError"}
            )
            Draft202012Validator(
                {**schema, "components": CONTRACT["components"]},
                format_checker=FormatChecker(),
            ).validate(response.json())
            break
        return response


@pytest.fixture
def settings(tmp_path):
    return Settings(database_path=tmp_path / "test.sqlite3", detector="demo")


@pytest.fixture
def client(settings):
    with ContractClient(create_app(settings)) as client:
        yield client


def reading(**overrides):
    return {
        "asset_id": "pump-01",
        "sensor_id": "temperature",
        "value": 50,
        "unit": "degC",
        "timestamp": utc_now(),
        **overrides,
    }


def ingest(client, readings=None, source="test"):
    return client.post(
        "/api/v1/telemetry/ingest",
        json={
            "source_id": source,
            "readings": readings if readings is not None else [reading()],
        },
    )
