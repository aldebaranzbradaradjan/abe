use ramhorns::{Content, Ramhorns};

use std::env;

use crate::errors::ApiError;

#[derive(Content)]
struct EmailContent<'a> {
    supheader: &'a str,
    header: &'a str,
    paragraphs: Vec<EmailParagraphs<'a>>,
    buttons: Vec<EmailButtons<'a>>,
}

#[derive(Content)]
struct EmailParagraphs<'a> {
    paragraph: &'a str,
}

#[derive(Content)]
struct EmailButtons<'a> {
    text: &'a str,
    url: &'a str,
}

pub fn register_user(username: &str) -> Result<String, ApiError> {
    let mut tpls = Ramhorns::lazy(env::var("TEMPLATES_PATH")?)?;
    let tpl = tpls.from_file("mail.html")?;

    let text = format!("You are now register on {} !", env::var("PLATFORM_NAME")?);
    let mut paragraphs = Vec::new();
    paragraphs.push(EmailParagraphs { paragraph: &text });

    let content = EmailContent {
        supheader: "",
        header: &format!("Welcome, {}", username),
        paragraphs: paragraphs,
        buttons: Vec::new(),
    };

    Ok(tpl.render(&content))
}

pub fn reset_token(mail: &str, username: &str, token: &str) -> Result<String, ApiError> {
    let mut tpls = Ramhorns::lazy(env::var("TEMPLATES_PATH")?)?;
    let tpl = tpls.from_file("mail.html")?;

    let url = format!("{}/blog/reset_password?email={}&token={}", env::var("DOMAIN")?, mail, token);
    let mut buttons = Vec::new();

    buttons.push(EmailButtons {
        text: "Reset your password",
        url: &url,
    });

    let text = format!(
        "We have received a request to reset the password for the {} account associated with {}.",
        username, mail
    );

    let mut paragraphs = Vec::new();

    paragraphs.push(EmailParagraphs { paragraph: &text });
    
    paragraphs.push( EmailParagraphs {
        paragraph : "If you did not request new password, please let us know immediately by replying to this email.",
    });

    paragraphs.push(EmailParagraphs {
        paragraph: "You can reset your password by clicking the link below :",
    });

    let content = EmailContent {
        supheader: "",
        header: &format!("{} : Password Reset", env::var("PLATFORM_NAME")?),
        paragraphs: paragraphs,
        buttons: buttons,
    };

    Ok(tpl.render(&content))
}

pub fn change_password_success(mail: &str, username: &str) -> Result<String, ApiError> {
    let mut tpls = Ramhorns::lazy(env::var("TEMPLATES_PATH")?)?;
    let tpl = tpls.from_file("mail.html")?;

    let text = format!(
        "The password for the {} account associated with {} has changed.",
        username, mail
    );

    let mut paragraphs = Vec::new();
    paragraphs.push(EmailParagraphs { paragraph: &text });

    let content = EmailContent {
        supheader: "",
        header: &format!("{} : Password Reset Success", env::var("PLATFORM_NAME")?),
        paragraphs: paragraphs,
        buttons: Vec::new(),
    };

    Ok(tpl.render(&content))
}
