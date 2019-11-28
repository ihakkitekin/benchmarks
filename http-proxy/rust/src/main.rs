extern crate tokio;
use hyper::{Client, Error, Server, Body, Response, Request};
use hyper::service::{make_service_fn, service_fn};
use hyper_tls::HttpsConnector;
use std::time::Duration;
use std::env;
use hyper::client::HttpConnector;
use hyper::header::HeaderValue;


type GenericError = Box<dyn std::error::Error + Send + Sync>;
type Result<T> = std::result::Result<T, GenericError>;

async fn proxy(
    mut req: Request<Body>,
    client: Client<HttpsConnector<HttpConnector>>
) -> Result<Response<Body>> {
    let proxy_url = env::var("PROXY_URL").unwrap();
    let uri_string = format!("{}{}",
                             proxy_url,
                             req.uri().path_and_query().map(|x| x.as_str()).unwrap_or(""));
    let uri = uri_string.parse().unwrap();

    *req.uri_mut() = uri;
    let mut res = client.request(req).await?;
    res.headers_mut().insert("x-powered-by", HeaderValue::from_static("Hyper"));

    Ok(res)
}

#[tokio::main]
async fn main() {
    let server_addr = ([0, 0, 0, 0], 8080).into();
    let https_connector = HttpsConnector::new().expect("TLS initialization failed");

    let client_main =  Client::builder()
        .keep_alive(true)
        .keep_alive_timeout(Duration::from_millis(1500))
        .build::<_, Body>(https_connector);

    let make_service = make_service_fn(move |_| {
        let client = client_main.clone();

        async move {
            Ok::<_, Error>(service_fn(move |req| {
                proxy(req, client.to_owned())
            }))
        }
    });

    let server = Server::bind(&server_addr)
        .serve(make_service);

    println!("Listening on http://{}", server_addr);

    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}