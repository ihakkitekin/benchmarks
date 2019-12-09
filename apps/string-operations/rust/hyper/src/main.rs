#[macro_use]
extern crate lazy_static;

extern crate tokio;
use hyper::{Error, Server, Body, Response, Request, Method, StatusCode};
use hyper::service::{make_service_fn, service_fn};
use hyper::header::HeaderValue;
use regex::Regex;
use std::time::SystemTime;
use chrono;

type GenericError = Box<dyn std::error::Error + Send + Sync>;
type Result<T> = std::result::Result<T, GenericError>;

const STATIC_STRING: &'static str = "0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum";
const STATIC_STRING_TIME: &'static str = "Current time: $time";

lazy_static! {
    static ref STATIC_REGEXP: Regex = Regex::new(r"-[1-9]\d*").unwrap();
    static ref STATIC_REGEXP_TIME: Regex = Regex::new(r"\$time").unwrap();
}

async fn static_regexp() -> Result<Response<Body>> {
    let mut result= String::new();

    STATIC_REGEXP.find_iter(STATIC_STRING).for_each(|mat|{
        result.push_str(mat.as_str());
        result.push_str("\n");
    });

    let response = Response::builder()
        .header("Server", HeaderValue::from_static("Hyper"))
        .body(Body::from(result))
        .unwrap();

    Ok(response)
}

async fn dynamic_regexp() -> Result<Response<Body>> {
    let rg = Regex::new(r"-[1-9]\d*").unwrap();

    let mut result= String::new();

    rg.find_iter(STATIC_STRING).for_each(|mat|{
        result.push_str(mat.as_str());
        result.push_str("\n");
    });

    let response = Response::builder()
        .header("Server", HeaderValue::from_static("Hyper"))
        .body(Body::from(result))
        .unwrap();

    Ok(response)
}

async fn string_replace() -> Result<Response<Body>> {
    let time = chrono::DateTime::<chrono::Utc>::from(SystemTime::now());
    let date = time.format("%Y-%m-%d %H:%M:%S").to_string();
    let mut result = STATIC_STRING_TIME.replace("$time", &date);

    let response = Response::builder()
        .header("Server", HeaderValue::from_static("Hyper"))
        .body(Body::from(result))
        .unwrap();

    Ok(response)
}

async fn regexp_replace() -> Result<Response<Body>> {
    let time = chrono::DateTime::<chrono::Utc>::from(SystemTime::now());
    let date = time.format("%Y-%m-%d %H:%M:%S").to_string();
    let mut result = STATIC_REGEXP_TIME.replace_all(STATIC_STRING_TIME, &*date);

    let response = Response::builder()
        .header("Server", HeaderValue::from_static("Hyper"))
        .body(Body::from(result))
        .unwrap();

    Ok(response)
}

async fn routes(
    req: Request<Body>
) -> Result<Response<Body>> {
    match (req.method(), req.uri().path()) {
        (&Method::GET, "/static-regexp") => {
            static_regexp().await
        },
        (&Method::GET, "/dynamic-regexp") => {
            dynamic_regexp().await
        },
        (&Method::GET, "/string-replace") => {
            string_replace().await
        },
        (&Method::GET, "/regexp-replace") => {
            regexp_replace().await
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