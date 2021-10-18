use actix_web::{cookie::Cookie, web, HttpRequest, HttpResponse};
use validator::Validate;

use actix::Addr;
use time::{Duration, OffsetDateTime};

use crate::db;
use crate::errors::ApiError;
use crate::mails as mail;
use crate::middlewares::session::*;
use crate::models::users::*;

pub async fn register(
    pool: web::Data<db::DbPool>,
    postman: web::Data<Addr<mail::Postman>>,
    input: web::Json<CreateUser>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    db::users::register(false, &input.0, &db)?;
    mail::post_email(
        mail::user::create_register_email(&input.0.email, &input.0.username)?,
        postman.get_ref(),
    )?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn update(
    pool: web::Data<db::DbPool>,
    input: web::Json<CreateUser>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let j = extract_json_token(req)?;
    db::users::update(&j.id, &input.0, &db)?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn delete(
    pool: web::Data<db::DbPool>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let db = pool.get()?;
    let j = extract_json_token(req)?;
    db::users::delete(&j.id, &db)?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn login(
    pool: web::Data<db::DbPool>,
    input: web::Json<AuthUser>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let result = db::users::auth(&input.0.email, &input.0.password, &db)?;
    let c = Cookie::build("BrancaToken", result.to_owned())
        //.domain("www.rust-lang.org")
        .path("/")
        //.secure(true)
        .http_only(true)
        .finish();
    Ok(HttpResponse::Ok().cookie(c).finish())
}

pub async fn logout() -> Result<HttpResponse, ApiError> {
    let c = Cookie::build("BrancaToken", "")
        //.domain("www.rust-lang.org")
        .path("/")
        //.secure(true)
        .http_only(true)
        .max_age(Duration::zero())
        .expires(OffsetDateTime::now_utc() - Duration::days(365))
        .finish();
    Ok(HttpResponse::Ok().cookie(c).finish())
}

pub async fn get(pool: web::Data<db::DbPool>, req: HttpRequest) -> Result<HttpResponse, ApiError> {
    let db = pool.get()?;
    let j = extract_json_token(req)?;
    let user = db::users::get_user_by_id(&j.id, &db)?;
    Ok(HttpResponse::Ok().json(user))
}

pub async fn forgot_password(
    pool: web::Data<db::DbPool>,
    postman: web::Data<Addr<mail::Postman>>,
    input: web::Json<Mail>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let user = db::users::get_user_by_email(&input.email, &db)?;
    let token = db::users::generate_reset_token(&input.email, &db)?;
    let mail = mail::user::create_reset_token_email(&input.email, &user.username, &token)?;
    mail::post_email(mail, postman.get_ref())?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn reset_password(
    pool: web::Data<db::DbPool>,
    postman: web::Data<Addr<mail::Postman>>,
    input: web::Json<ResetPassword>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let user = db::users::get_user_by_email(&input.email, &db)?;
    db::users::verify_reset_token(&input.email, &input.token, &db)?;
    db::users::change_password(&input.email, &input.password, &db)?;
    let mail = mail::user::create_password_changed_success_email(&input.email, &user.username)?;
    mail::post_email(mail, postman.get_ref())?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn change_password(
    pool: web::Data<db::DbPool>,
    postman: web::Data<Addr<mail::Postman>>,
    input: web::Json<ChangePassword>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let j = extract_json_token(req)?;
    let user = db::users::get_user_by_id(&j.id, &db)?;
    db::users::auth(&user.email, &input.old_password, &db)?;
    db::users::change_password(&user.email, &input.new_password, &db)?;
    let mail = mail::user::create_password_changed_success_email(&user.email, &user.username)?;
    mail::post_email(mail, postman.get_ref())?;
    Ok(HttpResponse::Ok().finish())
}

pub fn configure(app: &mut web::ServiceConfig) {
    app.route("/login", web::post().to(login))
        .route("/logout", web::get().to(logout))
        .service(
            web::scope("/user")
                .route("/register", web::post().to(register))
                .route("/forgot_password", web::post().to(forgot_password))
                .route("/reset_password", web::post().to(reset_password))
                .service(
                    web::scope("/user_restricted")
                        .wrap(BrancaSession(Level::User))
                        .route("", web::get().to(get))
                        .route("/update", web::put().to(update))
                        .route("/delete", web::delete().to(delete))
                        .route("/change_password", web::post().to(change_password)),
                ),
        );
}
