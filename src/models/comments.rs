use serde::{Deserializer, Deserialize};
use validator::Validate;
use ammonia::clean;

fn ammonia_cleaning<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let s: String = Deserialize::deserialize(deserializer)?;
    Ok(clean(&s))
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateComment {
    #[validate(range(min = 0))]
    pub post_id: Option<i32>,
    #[validate(range(min = 1))]
    pub parent_id: Option<i32>,
    #[validate(length(min = 1))]
    #[serde(deserialize_with = "ammonia_cleaning")]
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CommentsQueryParams {
    #[validate(range(min = 1))]
    pub page: Option<i64>,
    #[validate(range(min = 1, max = 100))]
    pub page_size: Option<i64>,
    #[validate(range(min = 1))]
    pub post_id: Option<i32>,
    #[validate(range(min = 1))]
    pub parent_id: Option<i32>,
    #[validate(range(min = 1))]
    pub user_id: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CommentsQueryId {
    #[validate(range(min = 1))]
    pub post_id: Option<i32>,
    #[validate(range(min = 1))]
    pub parent_id: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CommentId {
    #[validate(range(min = 1))]
    pub id: i32,
}