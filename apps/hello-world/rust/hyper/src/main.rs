extern crate tokio;
use hyper::{Error, Server, Body, Response, Request, Method, StatusCode};
use hyper::service::{make_service_fn, service_fn};
use hyper::header::HeaderValue;

type GenericError = Box<dyn std::error::Error + Send + Sync>;
type Result<T> = std::result::Result<T, GenericError>;

async fn hello_world() -> Result<Response<Body>> {
    let res = Response::builder()
        .header("Server", HeaderValue::from_static("Hyper"))
        .body(Body::from("Hello, world!"))
        .unwrap();

    Ok(res)
}

async fn routes(
    req: Request<Body>
) -> Result<Response<Body>> {
    match (req.method(), req.uri().path()) {
        (&Method::GET, "/hello-world") => {
            hello_world().await
        },
        _ => {
            Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Server", HeaderValue::from_static("Hyper"))
                .body(Body::from("Not Found."))
                .unwrap())
        }
    }
}

#[tokio::main]
async fn main() {
    let server_addr = ([0, 0, 0, 0], 8080).into();
    let make_service = make_service_fn(move |_| {
        async move {
            Ok::<_, Error>(service_fn(move |req| {
                routes(req)
            }))
        }
    });

    let server = Server::bind(&server_addr)
        .serve(make_service);

    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}