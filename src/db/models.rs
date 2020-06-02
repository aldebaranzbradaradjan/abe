
use super::schema::posts;
use super::schema::users;

use chrono::{NaiveDateTime};

#[derive(Serialize, Queryable)]
pub struct Post {
    pub id: String,
    pub title: String,
    pub teaser: String,
    pub body: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub published: bool,
}

#[derive(Insertable)]
#[table_name = "posts"]
pub struct NewPost<'a> {
    pub id: &'a str,
    pub title: &'a str,
    pub teaser: &'a str,
    pub body: &'a str,
}

#[derive(Serialize, Queryable, Debug)]
pub struct User {
    pub id: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub email: String,
    #[serde(skip_serializing)]
    pub token_key: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub id: &'a str,
    pub username: &'a str,
    pub email: &'a str,
    pub token_key: &'a str,
    pub password_hash: &'a str,
}