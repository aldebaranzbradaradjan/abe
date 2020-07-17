
pub mod models;
pub mod schema;

extern crate chrono;
use chrono::{
    DateTime
};

use chrono::offset::{ Utc };
use std::str::FromStr;

use diesel::prelude::*;
use dotenv::dotenv;
use std::env;

use uuid::Uuid;

use models::*;
use schema::posts;
use schema::users;

use schema::posts::dsl::*;
use schema::users::dsl::*;

use diesel::dsl::exists;

extern crate bcrypt;
use bcrypt::{
    DEFAULT_COST,
    hash,
    verify
};

extern crate branca;
use branca::Branca;

extern crate rand;
use rand::Rng; 
use rand::distributions::Alphanumeric;

use crate::errors::*;

fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

// posts part

pub fn get_post(key: &str) -> Result<Post, ApiError> {
    let connection = establish_connection();
    Ok( posts
        .filter(posts::id.eq(key))
        .first(&connection) ? )
}

pub fn get_all_post() -> Result<Vec<Post>, ApiError> {
    let connection = establish_connection();
    Ok( posts
        .load::<Post>(&connection) ? )
}

pub fn get_posts() -> Result<Vec<Post>, ApiError> {
    let connection = establish_connection();
    Ok( posts
        .filter(published.eq(true))
        .load::<Post>(&connection) ? )
}

pub fn get_pending_posts() -> Result<Vec<Post>, ApiError> {
    let connection = establish_connection();
    Ok( posts
        .filter(published.ne(true))
        .load::<Post>(&connection) ? )
}

pub fn create_post(t: &str, tz: &str, b: &str) -> Result<String, ApiError> {
    let connection = establish_connection();

    let uuid = Uuid::new_v4().to_hyphenated().to_string();
    let new_post = NewPost {
        id: &uuid,  
        title: t,
        teaser: tz,
        body: b
    };

    diesel::insert_into(posts::table)
        .values(&new_post)
        .execute(&connection) ? ;

    Ok( uuid )
}

pub fn publish_post(key: &str) -> Result<usize, ApiError> {
    let connection = establish_connection();

    Ok( diesel::update(posts.find(key))
        .set(published.eq(true))
        .execute(&connection) ? )
}

pub fn delete_post(i : &str) -> Result<(), ApiError> {
    let connection = establish_connection();

    diesel::delete( posts.filter( posts::id.eq( i ) ) )
        .execute(&connection) ? ;

    Ok( () )
}

pub fn update_post(i: &str, t: &str, tz: &str, b: &str) -> Result< (), ApiError> {
    let connection = establish_connection();

    diesel::update( posts.filter( posts::id.eq( i )) )
    .set((
        title.eq( t ),
        teaser.eq( tz ),
        body.eq ( b ),
        posts::updated_at.eq( Utc::now().naive_utc() ) 
    ))
    .execute(&connection) ? ;

    Ok( () )
}

// users part

pub fn register_user(u: &str, p: &str, e: &str) -> Result<String, ApiError> {
    let connection = establish_connection();

    let user_exist : bool =
    diesel::select( exists( users.filter( email.eq(e) ) ) )
    .get_result(&connection) ? ;

    if user_exist {  return Err( ApiError::UserError("Exist".to_owned()) ); }

    let uuid = Uuid::new_v4().to_hyphenated().to_string();
    let k = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .collect::<String>();

    let h = hash( format!("{}{}", e, p) , DEFAULT_COST) ? ;

    let new_user = NewUser {
        id: &uuid,
        username: u,
        email: e,
        token_key: &k,
        password_hash: &h
    };

    diesel::insert_into(users::table)
        .values(&new_user)
        .execute(&connection) ? ;

    Ok(uuid)
}

pub fn get_user_list() -> Result<Vec<User>, ApiError> {
    let connection = establish_connection();

    println!("get_user_list !");

    Ok ( users
        .load::<User>(&connection) ?
    )
}

pub fn get_user_by_id(i: &str) -> Result<User, ApiError>  {
    let connection = establish_connection();

    Ok( users
        .filter(users::id.eq(i))
        .first(&connection) ?
    )
}

pub fn get_user_by_email(e: &str) -> Result<User, ApiError>  {
    let connection = establish_connection();

    Ok( users
        .filter(users::email.eq(e))
        .first(&connection) ?
    )
}

// auth and session token part

pub fn auth_user(e: &str, p: &str) -> Result<String, ApiError> {
    let connection = establish_connection();

    let user : User =
    users
        .filter(users::email.eq(e))
        .first(&connection) ? ;

    match verify( format!("{}{}", e, p) , &user.password_hash ) ?
    {
        true =>  Ok ( create_token(user) ? ),
        false => Err( ApiError::TokenError("Create".to_owned()) )
    }
}

#[derive(Serialize, Debug)]
struct JsonBrancaToken {
    id : String,
    token : String,
}

pub fn create_token( user : User ) -> Result<String, ApiError> {

    let key = user.token_key.as_bytes().to_vec();
    let branca =  Branca::new(&key) ? ;

    let payload = format!("{}", Utc::now());
    let t = branca.encode( &payload ) ? ;

    let token = JsonBrancaToken {
        id : user.id,
        token : t,
    };

    Ok( serde_json::to_string(&token) ? )
}

pub fn auth_user_token(i: &str, t: &str) -> Result<bool, ApiError> {
    let user = get_user_by_id(i) ? ;
    let key = user.token_key.as_bytes().to_vec();
    let branca =  Branca::new( &key ) ? ;

    let j = branca.decode(t, 0) ? ;

    let d1 = Utc::now();
    let d2 : DateTime<Utc> = DateTime::from_str( &j ) ? ;
    
    let duration = d1.signed_duration_since(d2);
    Ok( duration.num_days() < 1 )
}
