FROM golang:latest as builder

WORKDIR /app

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o hello-world .

FROM alpine:3.10

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/hello-world .

EXPOSE 8080

CMD ["./hello-world"]