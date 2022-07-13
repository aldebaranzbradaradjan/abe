
use actix_web::body::EitherBody;
// use actix_service::{Service, Transform};
use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::{http, web, Error, HttpRequest, HttpResponse};
use futures::future::{ok, LocalBoxFuture, Ready};

//use futures_util::future::LocalBoxFuture;

use std::rc::Rc;
//use std::task::{Context, Poll};

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
impl<S, B> Transform<S, ServiceRequest> for BrancaSession
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = BrancaSessionMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(BrancaSessionMiddleware {
            service: Rc::new(service),
            level: self.0,
        })
    }
}

pub struct BrancaSessionMiddleware<S> {
    service: Rc<S>,
    level: Level,
}

impl<S, B> Service<ServiceRequest> for BrancaSessionMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    actix_web::dev::forward_ready!(service);

    fn call(&self, request: ServiceRequest) -> Self::Future {
        let is_logged_in = match is_authorized(&request, self.level) {
            Ok(()) => true,
            Err(_) => false,
        };
        if !is_logged_in {
            let (request, _pl) = request.into_parts();

            let response = HttpResponse::Found()
                .insert_header((
                    http::header::LOCATION,
                    match self.level {
                        Level::Admin => "/dashboard/login",
                        Level::User => "/blog/login",
                    },
                ))
                .finish()
                // constructed responses map to "right" body
                .map_into_right_body();

            return Box::pin(async { Ok(ServiceResponse::new(request, response)) });
        }

        let res = self.service.call(request);
        Box::pin(async move {
            // forwarded responses map to "left" body
            res.await.map(ServiceResponse::map_into_left_body)
        })
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
