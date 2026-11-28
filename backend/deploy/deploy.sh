#!/usr/bin/env bash
# Deploys one image of the content service and waits for the outcome.
#
#   PIBBO_CONTENT_DIR=/srv/pibbo/content deploy/deploy.sh registry.example/pibbo-api@sha256:…
#
# Exits 0 once the new release serves traffic, 1 if it never became ready and the update
# rolled back (the release before it is serving again), 2 for anything else.
set -euo pipefail

image="${1:?usage: deploy.sh IMAGE (by digest, the same image in every environment)}"
stack="${PIBBO_STACK:-pibbo}"
service="${stack}_api"
timeout="${PIBBO_DEPLOY_TIMEOUT:-300}"
here="$(cd "$(dirname "$0")" && pwd)"

if [[ "$image" != *@sha256:* ]]; then
  echo "deploy: deploy by digest (image@sha256:…), so every environment runs the same image." >&2
  [[ "${PIBBO_ALLOW_TAG:-}" == "1" ]] || exit 2
fi

if [[ "$(docker info --format '{{.Swarm.LocalNodeState}}')" != "active" ]]; then
  echo "deploy: this Docker engine is not in a swarm. Run: docker swarm init" >&2
  exit 2
fi

inspect() { docker service inspect --format "$1" "$service" 2>/dev/null; }

existed=false
if inspect '{{.ID}}' >/dev/null; then
  existed=true
  before="$(inspect '{{if .UpdateStatus}}{{.UpdateStatus.StartedAt}}{{end}}')"
  if [[ "$(inspect '{{.Spec.TaskTemplate.ContainerSpec.Image}}')" == "$image" ]]; then
    echo "deploy: $image is already deployed; nothing to do."
    exit 0
  fi
fi

PIBBO_API_IMAGE="$image" docker stack deploy --detach=true --resolve-image never -c "$here/compose.yaml" "$stack" >/dev/null

deadline=$((SECONDS + timeout))
while ((SECONDS < deadline)); do
  if [[ "$existed" == false ]]; then
    # A first deployment is not an update: done once a task of this image is healthy.
    if docker ps --filter "label=com.docker.swarm.service.name=$service" --filter "ancestor=$image" \
      --format '{{.Status}}' | grep -q '(healthy)'; then
      echo "deploy: $image is serving (first deployment)."
      exit 0
    fi
  elif [[ "$(inspect '{{if .UpdateStatus}}{{.UpdateStatus.StartedAt}}{{end}}')" != "$before" ]]; then
    # Only the outcome of the update started here counts, never an earlier one.
    state="$(inspect '{{.UpdateStatus.State}}')"
    case "$state" in
      completed)
        echo "deploy: $image is serving."
        exit 0
        ;;
      rollback_completed)
        echo "deploy: $image never became ready and was rolled back; the release before it is serving." >&2
        echo "deploy: $(inspect '{{.UpdateStatus.Message}}')" >&2
        exit 1
        ;;
      paused | rollback_paused)
        echo "deploy: the update is $state: $(inspect '{{.UpdateStatus.Message}}')" >&2
        exit 2
        ;;
    esac
  fi
  sleep 2
done

echo "deploy: no outcome after ${timeout}s." >&2
exit 2
