
use actix_web::{
    HttpResponse,
    ResponseError,
};

use derive_more::Display;

use chrono::ParseError as ChronoParseError;
use serde_json::error::Error as SerdeError;
use branca::errors::Error as BrancaError;
use bcrypt::BcryptError as BcryptError;
use diesel::result::Error as DieselError;
use ramhorns::Error as RamhornsError;

#[derive(Debug, Display)]
#[allow(dead_code)]
pub enum ApiError {
    BadRequest(String),
    #[display(fmt = "")]
    NotFound(String),
    Unauthorized(String),
    UserError(String),
    DieselError(String),
    BcryptError(String),
    BrancaError(String),
    TokenError(String),
    ParseError(String),
    SerdeError(String),
    RamhornsError(String),
    ValidationError(String),
}

/// User-friendly error messages
#[derive(Debug, Deserialize, Serialize)]
pub struct ErrorResponse {
    errors: Vec<String>,
}

/// Automatically convert ApiErrors to external Response Errors
impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::BadRequest(error) => {
                HttpResponse::BadRequest().json::<ErrorResponse>(error.into())
            },
            ApiError::NotFound(message) => {
                HttpResponse::NotFound().json::<ErrorResponse>(message.into())
            },
            ApiError::Unauthorized(error) => {
                HttpResponse::Unauthorized().json::<ErrorResponse>(error.into())
            },
            //_ => HttpResponse::new(StatusCode::INTERNAL_SERVER_ERROR),
            _ => HttpResponse::InternalServerError().json::<ErrorResponse>(self.into())
        }
    }
}

/// Utility to make transforming a string reference into an ErrorResponse
impl From<&String> for ErrorResponse {
    fn from(error: &String) -> Self {
        ErrorResponse {
            errors: vec![error.into()],
        }
    }
}

/// Utility to make transforming a vector of strings into an ErrorResponse
impl From<Vec<String>> for ErrorResponse {
    fn from(errors: Vec<String>) -> Self {
        ErrorResponse { errors }
    }
}

/// Utility to make transforming an ApiError reference into an ErrorResponse
impl From<&ApiError> for ErrorResponse {
    fn from(error: &ApiError) -> Self {
        ErrorResponse {
            errors: vec![error.to_string()],
        }
    }
}

impl From<ChronoParseError> for ApiError {
    fn from(error: ChronoParseError) -> ApiError {
        ApiError::ParseError(error.to_string())
    }
}

impl From<SerdeError> for ApiError {
    fn from(error: SerdeError) -> ApiError {
        ApiError::SerdeError(error.to_string())
    }
}

impl From<BrancaError> for ApiError {
    fn from(error: BrancaError) -> ApiError {
        ApiError::BrancaError(error.to_string())
    }
}

impl From<BcryptError> for ApiError {
    fn from(error: BcryptError) -> ApiError {
        ApiError::BcryptError(error.to_string())
    }
}

impl From<DieselError> for ApiError {
    fn from(error: DieselError) -> ApiError {
        ApiError::DieselError(error.to_string())
    }
}

impl From<RamhornsError> for ApiError {
    fn from(error: RamhornsError) -> ApiError {
        ApiError::RamhornsError(error.to_string())
    }
}