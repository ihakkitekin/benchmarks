# ------------------------------------------------------------------------------
# Cargo Build Stage
# ------------------------------------------------------------------------------

FROM ekidd/rust-musl-builder:1.39.0 as cargo-build

COPY --chown=rust:rust ./Cargo.toml ./
COPY --chown=rust:rust ./Cargo.lock ./

RUN mkdir -p src
RUN sudo chown -R rust:rust /home/rust

RUN echo "fn main() {println!(\"if you see this, the build broke\")}" > ./src/main.rs

RUN RUSTFLAGS=-Clinker=musl-gcc cargo build --release --target=x86_64-unknown-linux-musl

RUN rm -f target/x86_64-unknown-linux-musl/release/deps/string_operations*
RUN rm -rf src

COPY . .

RUN RUSTFLAGS=-Clinker=musl-gcc cargo build --release --target=x86_64-unknown-linux-musl

# ------------------------------------------------------------------------------
# Final Stage
# ------------------------------------------------------------------------------

FROM alpine:3.10

COPY --from=cargo-build /home/rust/src/target/x86_64-unknown-linux-musl/release/string-operations /usr/local/bin/string-operations

EXPOSE 8080

CMD ["string-operations"]