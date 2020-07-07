
use actix_web::{
    cookie::Cookie,
    web,
    HttpResponse,
    http::{
        StatusCode
    },
};

use validator::{
    Validate,
};

use crate::db::*;
use crate::errors::ApiError;
use crate::template::*;
use crate::validate::*;

pub async fn r_new_admin_template()
-> Result<HttpResponse, ApiError>
{
    let html = new_admin_template() ? ;
    Ok( HttpResponse::Ok().body(html) )
}

pub async fn r_edit_admin_template( path: web::Path<String> )
-> Result<HttpResponse, ApiError>
{
    let html = edit_admin_template( &path ) ? ;
    Ok( HttpResponse::Ok().body(html) )
}

pub async fn r_home_admin_template()
-> Result<HttpResponse, ApiError>
{
    let html = home_admin_template() ? ;
    Ok( HttpResponse::Ok().body(html) )
}

pub async fn r_home_template()
-> Result<HttpResponse, ApiError>
{
    let html = home_template() ? ;
    Ok( HttpResponse::Ok().body(html) )
}

pub async fn r_post_template( path: web::Path<String> )
-> Result<HttpResponse, ApiError>
{
    let html = post_template( &path ) ? ;
    Ok( HttpResponse::Ok().body(html) )
}

pub async fn r_login_template()
-> Result<HttpResponse, ApiError>
{
    let html = login_template() ? ;
    Ok( HttpResponse::Ok().body(html) )
}

#[derive(Debug, Serialize, Validate, Deserialize)]
pub struct CreateUser {
    #[validate(email)]
    email: String,
    #[validate(length(min = 1))]
    username: String,
    #[validate(length(min = 6))]
    password: String,
}

#[derive(Debug, Serialize, Validate, Deserialize)]
pub struct AuthUser {
    #[validate(email)]
    email: String,
    #[validate(length(min = 6))]
    password: String,
}

pub async fn r_register_user(user: web::Json<CreateUser>)
    -> Result<HttpResponse, ApiError>
{
    let result = register_user (
        user.0.username.as_ref(),
        user.0.password.as_ref(),
        user.0.email.as_ref(),
    ) ? ;

    Ok( HttpResponse::Ok().json(result) )
}

pub async fn r_auth(user: web::Json<AuthUser>)
    -> Result<HttpResponse, ApiError>
{
    let result = auth_user (
        user.0.email.as_ref(),
        user.0.password.as_ref()
    ) ? ;

    let c = Cookie::build("BrancaToken", result.to_owned())
        //.domain("www.rust-lang.org")
        .path("/")
        //.secure(true)
        .http_only(true)
        .finish();

    Ok( HttpResponse::build(StatusCode::OK)
        .cookie(c).json("Nice to see you again !")
    )
}

pub async fn r_get_user( path: web::Path<String> ) -> Result<HttpResponse, ApiError> {
    let user = get_user_by_email( &path ) ? ;
    Ok( HttpResponse::Ok().json(user) )
}

pub async fn r_get_users() -> Result<HttpResponse, ApiError> {
    let users = get_user_list() ? ;
    Ok( HttpResponse::Ok().json(users) )
}

#[derive(Debug, Serialize, Validate, Deserialize)]
pub struct CreatePost {
    #[validate(length(min = 1))]
    title: String,
    #[validate(length(min = 15))]
    teaser: String,
    #[validate(length(min = 100))]
    body: String,
}

pub async fn r_create_post(post: web::Json<CreatePost>)
    -> Result<HttpResponse, ApiError>
{
    validate( &post ) ? ;

    let result = create_post(
        post.0.title.as_ref(),
        post.0.teaser.as_ref(),
        post.0.body.as_ref()) ? ;

    Ok( HttpResponse::Ok().json(result) )
}

pub async fn r_get_post(path: web::Path<String>) -> Result<HttpResponse, ApiError> {
    let post = get_post(&path) ? ;
    Ok( HttpResponse::Ok().json(post) )
}

pub async fn r_get_posts() -> Result<HttpResponse, ApiError> {
    let posts = get_posts() ? ;
    Ok( HttpResponse::Ok().json(posts) )
}

pub async fn r_get_pending_posts() -> Result<HttpResponse, ApiError> {
    let posts = get_pending_posts() ? ;
    Ok( HttpResponse::Ok().json(posts) )
}

pub async fn r_publish(path: web::Path<String>) -> Result<HttpResponse, ApiError>  {
    let result = publish_post(&path) ? ;
    Ok( HttpResponse::Ok().json(result) )
}

pub async fn r_delete_post( path: web::Path<String> ) -> Result<HttpResponse, ApiError> {
    delete_post( &path ) ? ;
    Ok( HttpResponse::Ok().json("") )
}

pub async fn r_update_post(path: web::Path<String>, post: web::Json<CreatePost>)
    -> Result<HttpResponse, ApiError>
{
    validate( &post ) ? ;

    update_post(
        &path,
        post.0.title.as_ref(),
        post.0.teaser.as_ref(),
        post.0.body.as_ref()) ? ;

    Ok( HttpResponse::Ok().json("") )
}