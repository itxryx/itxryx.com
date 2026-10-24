FROM debian:trixie-slim

COPY --from=ghcr.io/jdx/mise:2026.10.18 /usr/local/bin/mise /usr/local/bin/mise

ENV MISE_DATA_DIR=/opt/mise
ENV PATH="/opt/mise/shims:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates libstdc++6 libatomic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY mise.toml mise.lock ./

RUN mise trust \
    && mise install --yes --locked
