
use actix_web::{
    HttpMessage,
    dev::ServiceRequest,
    dev::ServiceResponse,
    Error
};

use std::task::{
    Context,
    Poll
};

use actix_service::{
    Service,
    Transform
};

use futures::future::{
    ok,
    Ready
};

use futures::Future;
use std::pin::Pin;

use crate::db as DB;
use crate::errors::*;

pub struct BrancaSession;

// Middleware factory is `Transform` trait from actix-service crate
// `S` - type of the next service
// `B` - type of response's body
impl<S, B> Transform<S> for BrancaSession
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Request = ServiceRequest;
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = BrancaSessionMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(BrancaSessionMiddleware { service })
    }
}

pub struct BrancaSessionMiddleware<S> {
    service: S,
}

impl<S, B> Service for BrancaSessionMiddleware<S>
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Request = ServiceRequest;
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&mut self, req: ServiceRequest) -> Self::Future {
        match is_authorized( &req ) {
            Ok(e) => {
                if e {
                    let fut = self.service.call(req);
                    return Box::pin(async move {
                        let res = fut.await?;
                        Ok(res)
                    });
                }
                else {
                    return Box::pin ( futures::future::err (
                        ApiError::TokenError("Out of date".to_owned()).into() 
                    ) );
                }
            },
            Err(e) => {
                return Box::pin ( futures::future::err (
                    e.into() 
                ) );
            },
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct JsonBrancaToken {
    id : String,
    token : String,
}

// will check if the user is allowed to process
fn is_authorized(req: &ServiceRequest) -> Result<bool, ApiError> {
    if req.path() == "/api/v1/auth/login"
    || req.path() == "/api/v1/user/create" 
    || req.path() == "/admin/login" {
        return Ok( true )
    }

    let t = extract_cookie_token(&req) ? ;
    let j : JsonBrancaToken = serde_json::from_str ( &t ) ? ;

    DB::auth_user_token( 
        &j.id,
        &j.token 
    ) 
}

/// will extract the token from a cookie that was set previously.
fn extract_cookie_token(req: &  ServiceRequest)
    -> Result<String, ApiError>
{
    req.cookie("BrancaToken")
        .map(|cookie| cookie.value().to_string())
        .ok_or( ApiError::TokenError( "MissingToken".to_owned() ) )
}

