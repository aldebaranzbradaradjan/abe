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

pub fn register_user(
    mail: &str,
    username: &str,
    token: &str,
) -> Result<(String, String), ApiError> {
    let mut tpls: Ramhorns = Ramhorns::from_folder(env::var("TEMPLATES_PATH")?)?;
    let tpl = tpls.from_file("mail.html")?;

    let url = format!(
        "https://{}/api/v1/user/valid_account/{}/{}",
        env::var("DOMAIN")?,
        mail,
        token
    );
    let mut buttons = Vec::new();

    buttons.push(EmailButtons {
        text: "Validate your account",
        url: &url,
    });

    let text = format!("You are now register on {} !", env::var("PLATFORM_NAME")?);

    let mut paragraphs = Vec::new();
    paragraphs.push(EmailParagraphs { paragraph: &text });
    paragraphs.push(EmailParagraphs {
        paragraph: "To finish your inscription click on the button below !",
    });

    let content = EmailContent {
        supheader: "",
        header: &format!("Welcome, {}", username),
        paragraphs,
        buttons,
    };

    let alternative = format!(
        "Hi,\n{}\nTo finish your inscription click on the link below !\n{}",
        text, url
    );
    Ok((tpl.render(&content), alternative))
}

pub fn reset_token(mail: &str, username: &str, token: &str) -> Result<(String, String), ApiError> {
    let mut tpls: Ramhorns = Ramhorns::from_folder(env::var("TEMPLATES_PATH")?)?;
    let tpl = tpls.from_file("mail.html")?;

    let url = format!(
        "https://{}/blog/reset_password?email={}&token={}",
        env::var("DOMAIN")?,
        mail,
        token
    );
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
        paragraphs,
        buttons,
    };

    let alternative = format!("Hi,\n{}\n{}\n{}\n{}",
        text,
        "If you did not request new password, please let us know immediately by replying to this email.",
        "You can reset your password by clicking the link below :",
        url);

    Ok((tpl.render(&content), alternative))
}

pub fn change_password_success(mail: &str, username: &str) -> Result<(String, String), ApiError> {
    let mut tpls: Ramhorns = Ramhorns::from_folder(env::var("TEMPLATES_PATH")?)?;
    let tpl = tpls.from_file("mail.html")?;

    let text = format!(
        "The password for the {} account associated with {} has been changed.",
        username, mail
    );

    let mut paragraphs = Vec::new();
    paragraphs.push(EmailParagraphs { paragraph: &text });

    let content = EmailContent {
        supheader: "",
        header: &format!("{} : Password Reset Success", env::var("PLATFORM_NAME")?),
        paragraphs,
        buttons: Vec::new(),
    };

    let alternative = format!("Hi,\n{}", text);
    Ok((tpl.render(&content), alternative))
}
