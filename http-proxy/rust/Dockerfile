# ------------------------------------------------------------------------------
# Cargo Build Stage
# ------------------------------------------------------------------------------

FROM ekidd/rust-musl-builder:1.39.0 as cargo-build

COPY Cargo.toml Cargo.toml

RUN sudo mkdir -p src
RUN sudo chown -R rust:rust /home/rust

RUN echo "fn main() {println!(\"if you see this, the build broke\")}" > ./src/main.rs

RUN RUSTFLAGS=-Clinker=musl-gcc cargo build --release --target=x86_64-unknown-linux-musl

RUN rm -f target/x86_64-unknown-linux-musl/release/deps/http-proxy*
RUN rm -rf src

COPY . .

RUN RUSTFLAGS=-Clinker=musl-gcc cargo build --release --target=x86_64-unknown-linux-musl

# ------------------------------------------------------------------------------
# Final Stage
# ------------------------------------------------------------------------------

FROM alpine:3.10

RUN apk --no-cache add ca-certificates

COPY --from=cargo-build /home/rust/src/target/x86_64-unknown-linux-musl/release/http-proxy /usr/local/bin/http-proxy

EXPOSE 8080

CMD ["http-proxy"]