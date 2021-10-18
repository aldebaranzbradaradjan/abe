use actix_service::{Service, Transform};
use actix_web::{
    dev::ServiceRequest, dev::ServiceResponse, http, web, Error, HttpMessage, HttpRequest,
    HttpResponse,
};
use futures::future::{ok, Either, Ready};
use std::task::{Context, Poll};

use crate::db;
use crate::errors::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct JsonBrancaToken {
    pub id: i32,
    pub token: String,
}

/// Determines the behavior of the [`BrancaSession`] middleware.
/// The default is `Level::User`.
#[non_exhaustive]
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Level {
    /// need a BrancaToken of User level
    User,
    /// need a BrancaToken of Admin level
    Admin,
}

impl Default for Level {
    fn default() -> Self {
        Level::User
    }
}

/// Middleware to restrain access to leveled users.
/// Possibles values Level::User, Level::Admin
#[derive(Debug, Clone, Copy, Default)]
pub struct BrancaSession(pub Level);

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
        ok(BrancaSessionMiddleware {
            service,
            level: self.0,
        })
    }
}

pub struct BrancaSessionMiddleware<S> {
    service: S,
    level: Level,
}

impl<S, B> Service for BrancaSessionMiddleware<S>
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    //B: 'static,
{
    type Request = ServiceRequest;
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Either<S::Future, Ready<Result<Self::Response, Self::Error>>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&mut self, req: ServiceRequest) -> Self::Future {
        match is_authorized(&req, self.level) {
            Ok(()) => Either::Left(self.service.call(req)),
            Err(e) => Either::Right(ok(req.into_response(
                HttpResponse::Found()
                    .header(
                        http::header::LOCATION,
                        match self.level {
                            Level::Admin => "/dashboard/login",
                            Level::User => "/api/v1/login",
                        },
                    )
                    .body(format!("Invalid Token : {}", e))
                    .into_body(),
            ))),
        }
    }
}

/// Will check if the user is allowed to process
fn is_authorized(req: &ServiceRequest, level: Level) -> Result<(), ApiError> {
    let t = extract_cookie_token(&req)?;
    let pool = req
        .app_data::<web::Data<db::DbPool>>()
        .ok_or(ApiError::InternalError("Can't access App Data".to_owned()))?
        .get()?;
    db::users::verify_token(&t.id, &t.token, level == Level::Admin, &pool)
}

/// Will extract the token from a cookie that was set previously.
pub fn extract_cookie_token(req: &ServiceRequest) -> Result<JsonBrancaToken, ApiError> {
    Ok(serde_json::from_str(
        &req.cookie("BrancaToken")
            .map(|cookie| cookie.value().to_string())
            .ok_or(ApiError::InternalError("MissingToken".to_owned()))?,
    )?)
}

pub fn extract_json_token(req: HttpRequest) -> Result<JsonBrancaToken, ApiError> {
    Ok(serde_json::from_str(
        &req.cookie("BrancaToken")
            .map(|cookie| cookie.value().to_string())
            .ok_or(ApiError::InternalError("MissingToken".to_owned()))?,
    )?)
}
