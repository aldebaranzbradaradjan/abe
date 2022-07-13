pub mod user;
use actix::prelude::*;
use actix::Addr;
use lettre::message::header;
use lettre::message::MultiPart;
use lettre::message::SinglePart;
extern crate lettre;
use crate::errors::ApiError;

use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

use log::info;
use std::env;

#[derive(Message)]
#[rtype(result = "Result<bool, std::io::Error>")]
pub struct SendableEmail {
    pub to: String,
    pub title: String,
    pub content: String,
    pub alternative: String,
}

pub fn send_mail(mail: SendableEmail) -> Result<(), ApiError> {
    let email = Message::builder()
        .to(mail.to.parse()?)
        .from(env::var("SMTP_CREDENTIAL")?.parse()?)
        .subject(mail.title)
        .multipart(
            MultiPart::alternative() // This is composed of two parts.
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(String::from(mail.alternative)), // Every message should have a plain text fallback.
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(String::from(mail.content)),
                ),
        )?;

    let mailer = SmtpTransport::relay(&env::var("SMTP_URL")?)?
        .credentials(Credentials::new(
            env::var("SMTP_CREDENTIAL")?,
            env::var("SMTP_PASSWORD")?,
        ))
        .build();

    mailer.send(&email)?;
    Ok(())
}

pub struct Postman;

impl Actor for Postman {
    type Context = Context<Self>;
    fn started(&mut self, _ctx: &mut Context<Self>) {
        info!("Starting Postman Actor");
    }
    fn stopped(&mut self, _ctx: &mut Context<Self>) {
        info!(">Shut down Postman Actor");
    }
}

impl Handler<SendableEmail> for Postman {
    type Result = Result<bool, std::io::Error>;
    fn handle(&mut self, email: SendableEmail, _ctx: &mut Context<Self>) -> Self::Result {
        info!("SendableEmail received, processing...");
        match send_mail(email) {
            Ok(()) => Ok(true),
            Err(err) => {
                info!("Error on send email : {}", err);
                Ok(false)
            }
        }
    }
}

pub fn post_email(email: SendableEmail, actor: &Addr<Postman>) -> Result<(), ApiError> {
    match actor.try_send(email) {
        Ok(()) => Ok(()),
        Err(_) => Err(ApiError::InternalError(
            "The postman can't send email".into(),
        )),
    }
}
