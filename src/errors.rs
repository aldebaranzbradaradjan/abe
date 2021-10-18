use actix_web::{HttpResponse, ResponseError};
use derive_more::Display;

use bcrypt::BcryptError;
use branca::errors::Error as BrancaError;
use chrono::ParseError as ChronoParseError;
use diesel::result::Error as DieselError;
use lettre::smtp::error::Error as LettreSmtpError;
use lettre_email::error::Error as LettreError;
use r2d2::Error as R2D2Error;
use ramhorns::Error as RamhornsError;
use serde_json::error::Error as SerdeError;
use std::env::VarError as EnvError;
use validator::ValidationErrors;

#[derive(Debug, Display)]
pub enum ApiError {
    InternalError(String),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ErrorResponse {
    errors: Vec<String>,
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            _ => HttpResponse::InternalServerError().json::<ErrorResponse>(self.into()),
        }
    }
}

impl From<&String> for ErrorResponse {
    fn from(error: &String) -> Self {
        ErrorResponse {
            errors: vec![error.into()],
        }
    }
}

impl From<Vec<String>> for ErrorResponse {
    fn from(errors: Vec<String>) -> Self {
        ErrorResponse { errors }
    }
}

impl From<&ApiError> for ErrorResponse {
    fn from(error: &ApiError) -> Self {
        ErrorResponse {
            errors: vec![error.to_string()],
        }
    }
}

impl From<ChronoParseError> for ApiError {
    fn from(error: ChronoParseError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<SerdeError> for ApiError {
    fn from(error: SerdeError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<BrancaError> for ApiError {
    fn from(error: BrancaError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<BcryptError> for ApiError {
    fn from(error: BcryptError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<DieselError> for ApiError {
    fn from(error: DieselError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<R2D2Error> for ApiError {
    fn from(error: R2D2Error) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<LettreError> for ApiError {
    fn from(error: LettreError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<LettreSmtpError> for ApiError {
    fn from(error: LettreSmtpError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<EnvError> for ApiError {
    fn from(error: EnvError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<RamhornsError> for ApiError {
    fn from(error: RamhornsError) -> ApiError {
        ApiError::InternalError(error.to_string())
    }
}

impl From<ValidationErrors> for ApiError {
    fn from(errors: ValidationErrors) -> ApiError {
        let e = errors
            .field_errors()
            .into_iter()
            .map(|error| {
                let default_error = format!("validation error on {} field,", error.0);
                error.1[0]
                    .message
                    .as_ref()
                    .unwrap_or(&std::borrow::Cow::Owned(default_error))
                    .to_string()
            })
            .collect();

        ApiError::InternalError(e)
    }
}

#[cfg(test)]
mod tests {

    use serde_json::json;
    use validator::Validate;

    #[derive(Debug, Deserialize, Serialize, Validate)]
    pub struct TestRequest {
        #[validate(length(
            min = 3,
            message = "first_name is required and must be at least 3 characters"
        ))]
        pub first_name: String,
    }

    fn get_test_request() -> TestRequest {
        let json = json!({"first_name": "a"});
        serde_json::from_value::<TestRequest>(json).unwrap()
    }

    #[test]
    fn validation_error() {
        let request = get_test_request();
        let error = request.validate().unwrap_err();
        assert!(format!("{:?}", error)
            .contains("first_name is required and must be at least 3 characters"));
    }
}
