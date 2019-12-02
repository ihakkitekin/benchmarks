FROM golang:latest as builder

WORKDIR /app

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o http-proxy .

FROM alpine:3.10

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/http-proxy .

EXPOSE 8080

CMD ["./http-proxy"]