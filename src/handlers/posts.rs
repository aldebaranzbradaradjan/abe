use actix_web::{web, HttpResponse};
use validator::Validate;

use crate::db;
use crate::errors::ApiError;
use crate::middlewares::session::{BrancaSession, Level};
use crate::models::posts::*;

pub async fn create(
    pool: web::Data<db::DbPool>,
    input: web::Json<CreatePost>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let r = db::posts::create(input.0, &db)?;
    Ok(HttpResponse::Ok().json(r))
}

pub async fn update(
    pool: web::Data<db::DbPool>,
    input: web::Json<UpdatePost>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    db::posts::update(input.0, &db)?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn delete(
    pool: web::Data<db::DbPool>,
    input: web::Json<PostId>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    db::posts::delete(&input.0.id, &db)?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn publish(
    pool: web::Data<db::DbPool>,
    input: web::Json<PublishParams>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    db::posts::publish(input.0, &db)?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn get_published(
    pool: web::Data<db::DbPool>,
    input: web::Json<PostId>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let post = db::posts::get(&input.0.id, PostState::Published, &db)?;
    Ok(HttpResponse::Ok().json(post))
}

pub async fn get(
    pool: web::Data<db::DbPool>,
    input: web::Json<PostId>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let post = db::posts::get(&input.0.id, PostState::All, &db)?;
    Ok(HttpResponse::Ok().json(post))
}

pub async fn list_published(
    pool: web::Data<db::DbPool>,
    mut input: web::Json<PaginationParams>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    input.0.state = PostState::Published;
    let posts = db::posts::list(input.0, &db)?;
    Ok(HttpResponse::Ok().json(posts))
}

pub async fn list(
    pool: web::Data<db::DbPool>,
    input: web::Json<PaginationParams>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let posts = db::posts::list(input.0, &db)?;
    Ok(HttpResponse::Ok().json(posts))
}

pub fn configure(app: &mut web::ServiceConfig) {
    app.service(
        web::scope("/post")
            .route("", web::post().to(get_published))
            .route("/list", web::post().to(list_published))
            .service(
                web::scope("/admin_restricted")
                    .wrap(BrancaSession(Level::Admin))
                    .route("", web::post().to(get))
                    .route("/list", web::post().to(list))
                    .route("/publish", web::put().to(publish))
                    .route("/update", web::put().to(update))
                    .route("/delete", web::delete().to(delete))
                    .route("/create", web::post().to(create)),
            ),
    );
}
