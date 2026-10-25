#!/usr/bin/env bash
set -euo pipefail

: "${BOOTSTRAP_MODE:?}"
: "${AWS_REGION:?}"
: "${TF_STATE_BUCKET:?}"
: "${TF_LOCK_TABLE:?}"
: "${TF_BOOTSTRAP_STATE_KEY:?}"
: "${TF_STATE_KEY:?}"

if [ "$TF_BOOTSTRAP_STATE_KEY" = "$TF_STATE_KEY" ]; then
  echo "Bootstrap and production state keys must be different." >&2
  exit 1
fi
case "$BOOTSTRAP_MODE" in
  create|adopt|manage) ;;
  *) echo "Unknown bootstrap mode: $BOOTSTRAP_MODE" >&2; exit 1 ;;
esac

error_file=$(mktemp)
trap 'rm -f "$error_file"' EXIT

bucket_exists() {
  if aws s3api head-bucket --bucket "$TF_STATE_BUCKET" 2>"$error_file"; then
    return 0
  fi
  case "$(cat "$error_file")" in
    *"(404)"*|*"(NoSuchBucket)"*) return 1 ;;
    *) cat "$error_file" >&2; exit 1 ;;
  esac
}

table_exists() {
  if aws dynamodb describe-table --table-name "$TF_LOCK_TABLE" > /dev/null 2>"$error_file"; then
    return 0
  fi
  case "$(cat "$error_file")" in
    *"(ResourceNotFoundException)"*) return 1 ;;
    *) cat "$error_file" >&2; exit 1 ;;
  esac
}

state_exists() {
  if aws s3api head-object --bucket "$TF_STATE_BUCKET" --key "$TF_BOOTSTRAP_STATE_KEY" > /dev/null 2>"$error_file"; then
    return 0
  fi
  case "$(cat "$error_file")" in
    *"(404)"*|*"(NoSuchKey)"*) return 1 ;;
    *) cat "$error_file" >&2; exit 1 ;;
  esac
}

backend_args=(
  "-backend-config=bucket=$TF_STATE_BUCKET"
  "-backend-config=key=$TF_BOOTSTRAP_STATE_KEY"
  "-backend-config=region=$AWS_REGION"
  "-backend-config=dynamodb_table=$TF_LOCK_TABLE"
  "-backend-config=encrypt=true"
)

case "${1:?}" in
  check)
    if [ "$BOOTSTRAP_MODE" = create ]; then
      if bucket_exists || table_exists; then
        echo "Backend resources already exist. Use adopt or manage instead of create." >&2
        exit 1
      fi
    else
      bucket_exists || { echo "State bucket does not exist." >&2; exit 1; }
      table_exists || { echo "Lock table does not exist." >&2; exit 1; }
      if [ "$BOOTSTRAP_MODE" = manage ]; then
        state_exists || { echo "Bootstrap state is missing. Locate the original state or use adopt." >&2; exit 1; }
      fi
    fi
    ;;
  init)
    shift
    if [ "$BOOTSTRAP_MODE" = create ]; then
      cat > bootstrap_backend_override.tf <<'EOF'
terraform {
  backend "local" {}
}
EOF
      terraform init -input=false "$@"
    else
      terraform init -input=false "${backend_args[@]}" "$@"
      if [ "$BOOTSTRAP_MODE" = manage ]; then
        resources=$(terraform state list)
        for address in aws_s3_bucket.terraform_state aws_dynamodb_table.terraform_locks; do
          if ! printf '%s\n' "$resources" | grep -Fxq "$address"; then
            echo "Bootstrap state does not track $address. Recover the original state or use adopt." >&2
            exit 1
          fi
        done
      fi
    fi
    ;;
  migrate)
    test "$BOOTSTRAP_MODE" = create
    test -s terraform.tfstate
    bucket_exists
    table_exists
    if state_exists; then
      echo "Refusing to overwrite existing bootstrap state." >&2
      exit 1
    fi
    rm bootstrap_backend_override.tf
    terraform init -input=false -migrate-state -force-copy -lockfile=readonly "${backend_args[@]}"
    state_exists
    ;;
  *) echo "Expected check, init, or migrate." >&2; exit 1 ;;
esac
