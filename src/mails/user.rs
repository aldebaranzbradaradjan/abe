use crate::errors::ApiError;
use crate::mails::SendableEmail;
use crate::templates as template;
use std::env;

pub fn create_register_email(mail: &str, username: &str) -> Result<SendableEmail, ApiError> {
    let content = template::mail::register_user(username)?;
    Ok(SendableEmail {
        to: mail.into(),
        title: format!("Welcome on {} !", env::var("PLATFORM_NAME")?),
        content,
    })
}

pub fn create_reset_token_email(
    mail: &str,
    username: &str,
    token: &str,
) -> Result<SendableEmail, ApiError> {
    let content = template::mail::reset_token(mail, username, token)?;
    Ok(SendableEmail {
        to: mail.into(),
        title: format!("{} : Password Reset", env::var("PLATFORM_NAME")?),
        content,
    })
}

pub fn create_password_changed_success_email(
    mail: &str,
    username: &str,
) -> Result<SendableEmail, ApiError> {
    let content = template::mail::change_password_success(mail, username)?;
    Ok(SendableEmail {
        to: mail.into(),
        title: format!("{} : Password Reset Success", env::var("PLATFORM_NAME")?),
        content,
    })
}
