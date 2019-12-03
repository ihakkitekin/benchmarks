FROM golang:latest as builder

WORKDIR /app

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o string-operations .

FROM alpine:3.10

COPY --from=builder /app/string-operations .

EXPOSE 8080

CMD ["./string-operations"]