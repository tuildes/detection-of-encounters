#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_INPUT_DIR="${ROOT_DIR}/data/inputs"
DATA_EXPECTED_DIR="${ROOT_DIR}/data/expected"
BASE_URL="https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com"

mkdir -p "${DATA_INPUT_DIR}" "${DATA_EXPECTED_DIR}"
curl --fail --location --remote-name-all --output-dir "${DATA_INPUT_DIR}" "${BASE_URL}/dataset"{1..7}".txt"
curl --fail --location --remote-name-all --output-dir "${DATA_EXPECTED_DIR}" "${BASE_URL}/respostas"{1..2}".json"
