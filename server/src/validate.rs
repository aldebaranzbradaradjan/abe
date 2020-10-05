//! Validation-related functions to work with the validator crate.

use crate::errors::ApiError;
use actix_web::web::Json;
use validator::{Validate, ValidationErrors};

/// Validate a struct and collect and return the errors
pub fn validate<T>(params: &Json<T>) -> Result<(), ApiError>
where
  T: Validate,
{
  match params.validate() {
    Ok(()) => Ok(()),
    Err(error) => Err(ApiError::ValidationError( collect_errors(error) )),
  }
}

/// Collect ValidationErrors and return a vector of the messages
/// Adds a default_error when none is supplied
fn collect_errors(error: ValidationErrors) -> String {
  error
    .field_errors()
    .into_iter()
    .map(|error| {
      let default_error = format!("{} is required", error.0);
      error.1[0]
        .message
        .as_ref()
        .unwrap_or(&std::borrow::Cow::Owned(default_error))
        .to_string()
    })
    .collect()
}
