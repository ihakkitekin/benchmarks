extern crate tokio;
use hyper::{Error, Server, Body, Response};
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

#[tokio::main]
async fn main() {
    let server_addr = ([0, 0, 0, 0], 8080).into();

    let make_service = make_service_fn(move |_| {
        async move {
            Ok::<_, Error>(service_fn(move |_| {
                hello_world()
            }))
        }
    });

    let server = Server::bind(&server_addr)
        .serve(make_service);

    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}