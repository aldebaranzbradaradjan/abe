use super::schema::comments;
use super::schema::posts;
use super::schema::users;
use chrono::NaiveDateTime;

mod naive_date_time_serializer {
    use chrono::NaiveDateTime;
    use serde::{Serializer, Serialize};

    pub fn serialize<S: Serializer>(time: &NaiveDateTime, serializer: S) -> Result<S::Ok, S::Error> {
        time.format("%Y-%m-%d %H:%M:%S").to_string().serialize(serializer)
    }

}

#[derive(Serialize, Queryable, Debug)]
pub struct User {
    pub id: i32,
    pub is_admin: bool,
    pub is_validated: bool,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub token_key: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    #[serde(skip_serializing)]
    pub reset_token: String,
    #[serde(skip_serializing)]
    pub validation_token: String,
    pub cookies_validated: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub is_admin: &'a bool,
    pub username: &'a str,
    pub email: &'a str,
    pub token_key: &'a str,
    pub password_hash: &'a str,
    pub reset_token: &'a str,
    pub validation_token: &'a str,
}
#[derive(Serialize, Queryable, Debug)]
pub struct MinimalUser {
    pub id: i32,
    #[serde(skip_serializing)]
    pub is_admin: bool,
    #[serde(skip_serializing)]
    pub is_validated: bool,
    pub username: String,
    #[serde(skip_serializing)]
    pub email: String,
    #[serde(skip_serializing)]
    pub token_key: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    #[serde(skip_serializing)]
    pub reset_token: String,
    #[serde(skip_serializing)]
    pub validation_token: String,
    #[serde(skip_serializing)]
    pub cookies_validated: bool,
    #[serde(skip_serializing)]
    pub created_at: NaiveDateTime,
    #[serde(skip_serializing)]
    pub updated_at: NaiveDateTime,
}

#[derive(Serialize, Queryable, Debug)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub abstract_: String,
    pub body: String,
    pub published: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "posts"]
pub struct NewPost<'a> {
    pub title: &'a str,
    pub abstract_: &'a str,
    pub body: &'a str,
    pub published: Option<&'a NaiveDateTime>,
}

#[derive(Serialize, Queryable, Debug)]
pub struct Comment {
    pub id: i32,
    pub post_id: Option<i32>,
    pub parent_id: Option<i32>,
    pub user_id: i32,
    pub body: String,
    pub likes: i32,
    #[serde(with = "naive_date_time_serializer")]
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "comments"]
pub struct NewComment<'a> {
    pub post_id: Option<&'a i32>,
    pub parent_id: Option<&'a i32>,
    pub user_id: &'a i32,
    pub body: &'a str,
    pub likes: Option<&'a i32>,
}
