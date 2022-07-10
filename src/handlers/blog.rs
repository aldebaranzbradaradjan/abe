use actix_web::{web, HttpRequest, HttpResponse};
use validator::Validate;

use crate::db;
use crate::errors::ApiError;
use crate::middlewares::session::extract_json_token;
use crate::models::posts::*;
use crate::templates::blog::*;

pub async fn register_login() -> Result<HttpResponse, ApiError> {
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .body(register_login_template()?))
}

pub async fn reset_password() -> Result<HttpResponse, ApiError> {
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .body(reset_password_template()?))
}

pub async fn post(
    input: web::Path<PostId>,
    pool: web::Data<db::DbPool>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let j = extract_json_token(req);
    let cookie_accepted = match j {
        Ok(j) => db::users::get_user_by_id(&j.id, &db)?.cookies_validated,
        Err(_) => true,
    };
    let post = db::posts::get(&input.0.id, PostState::Published, &db)?;
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .body(post_template(post, cookie_accepted)?))
}

pub async fn page(
    input: web::Path<PaginationParamsShort>,
    pool: web::Data<db::DbPool>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let j = extract_json_token(req);
    let cookie_accepted = match j {
        Ok(j) => db::users::get_user_by_id(&j.id, &db)?.cookies_validated,
        Err(_) => true,
    };
    let params = PaginationParams {
        page: input.0.page,
        page_size: input.0.page_size,
        state: PostState::Published,
    };
    let posts = db::posts::list(params, &db)?;
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .body(home_template(posts, input.0.page, cookie_accepted)?))
}

pub async fn home(pool: web::Data<db::DbPool>, req: HttpRequest) -> Result<HttpResponse, ApiError> {
    let db = pool.get()?;
    let j = extract_json_token(req);
    let cookie_accepted = match j {
        Ok(j) => db::users::get_user_by_id(&j.id, &db)?.cookies_validated,
        Err(_) => true,
    };
    let params = PaginationParams {
        page: Some(1),
        page_size: Some(4),
        state: PostState::Published,
    };
    let posts = db::posts::list(params, &db)?;
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .body(home_template(posts, Some(1), cookie_accepted)?))
}

pub async fn profile(pool: web::Data<db::DbPool>, req: HttpRequest,) -> Result<HttpResponse, ApiError> {
    let db = pool.get()?;
    let j = extract_json_token(req);
    let cookie_accepted = match j {
        Ok(j) => db::users::get_user_by_id(&j.id, &db)?.cookies_validated,
        Err(_) => true,
    };
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .body(profile_template(cookie_accepted)?))
}

pub fn configure(app: &mut web::ServiceConfig) {
    app.service(
        web::scope("/blog")
            .route("", web::get().to(home))
            .route("/login", web::get().to(register_login))
            .route("/profile", web::get().to(profile))
            .route("/reset_password", web::get().to(reset_password))
            .route("/post/{id}", web::get().to(post))
            .route("/{page}/{page_size}", web::get().to(page)),
    );
}
