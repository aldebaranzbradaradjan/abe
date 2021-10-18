use chrono::NaiveDateTime;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreatePost {
    #[validate(length(min = 1))]
    pub title: String,
    #[validate(length(min = 1))]
    pub abstract_: String,
    #[validate(length(min = 1))]
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdatePost {
    #[validate(range(min = 1))]
    pub id: i32,
    #[validate(length(min = 1))]
    pub title: String,
    #[validate(length(min = 1))]
    pub abstract_: String,
    #[validate(length(min = 1))]
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct PostId {
    #[validate(range(min = 1))]
    pub id: i32,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct PublishParams {
    #[validate(range(min = 1))]
    pub id: i32,
    pub date: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PostState {
    Published,
    NotYetPublished,
    NotPublished,
    All,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct PaginationParams {
    #[validate(range(min = 1))]
    pub page: Option<i64>,
    #[validate(range(min = 1, max = 100))]
    pub page_size: Option<i64>,
    pub state: PostState,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct PaginationParamsShort {
    #[validate(range(min = 1))]
    pub page: Option<i64>,
    #[validate(range(min = 1, max = 100))]
    pub page_size: Option<i64>,
}