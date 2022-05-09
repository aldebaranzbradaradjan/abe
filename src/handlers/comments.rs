use actix::Addr;
use actix_web::{web, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use log::info;
use validator::Validate;

use crate::{db, websockets};
use crate::errors::ApiError;
use crate::middlewares::session::*;
use crate::models::comments::*;
use crate::websockets::comments::*;

pub async fn create(
    pool: web::Data<db::DbPool>,
    notification_server: web::Data<Addr<websockets::notification::NotificationServer>>,
    input: web::Json<CreateComment>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let j = extract_json_token(req)?;
    let r = db::comments::create(&j.id, input.0, &db, notification_server.get_ref().clone())?;
    Ok(HttpResponse::Ok().json(r))
}

pub async fn get(
    pool: web::Data<db::DbPool>,
    input: web::Json<CommentId>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let post = db::comments::get(&input.0.id, &db)?;
    Ok(HttpResponse::Ok().json(post))
}

pub async fn list(
    pool: web::Data<db::DbPool>,
    input: web::Json<CommentsQueryParams>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let posts = db::comments::list(input.0, &db)?;
    Ok(HttpResponse::Ok().json(posts))
}

pub async fn count(
    pool: web::Data<db::DbPool>,
    input: web::Json<CommentsQueryId>,
) -> Result<HttpResponse, ApiError> {
    input.validate()?;
    let db = pool.get()?;
    let count = db::comments::count_comments(input.0, &db)?;
    Ok(HttpResponse::Ok().json(count))
}

async fn ws(req: HttpRequest, stream: web::Payload ,
    notification_server: web::Data<Addr<websockets::notification::NotificationServer>>,
) -> Result<HttpResponse, ApiError> {
    let resp = ws::start(CommentWebSocket::new(notification_server.get_ref().clone()), &req, stream) ?;
    if let Some(peer) = req.peer_addr() {
        info!("Websocket Connection {} {} {}", peer.ip(), req.method(), req.path());
    };
    Ok(resp)
}

pub fn configure(app: &mut web::ServiceConfig) {
    app.service(
        web::scope("/comment")
            .route("", web::post().to(get))
            .route("/list", web::post().to(list))
            .route("/count", web::post().to(count))
            .route("/ws", web::get().to(ws))
            .service(
                web::scope("/user_restricted")
                    .wrap(BrancaSession(Level::User))
                    .route("/create", web::post().to(create)),
            ),
    );
}