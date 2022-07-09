use super::DbConnection;
use super::{models::*, schema::comments, schema::comments::dsl::*, schema::users};

extern crate chrono;

use crate::errors::*;
use crate::models::comments::*;

use crate::db::posts as post;
use crate::models::posts::*;

use actix::Addr;
use diesel::dsl::count_star;
use diesel::prelude::*;

use crate::db::LoadPaginated;

use crate::websockets::notification as notif_server;

joinable!(comments -> users (user_id));

pub fn create(
    user_id_: &i32,
    comment: CreateComment,
    db: &DbConnection,
    notif_server: Addr<notif_server::NotificationServer>,
) -> Result<i32, ApiError> {
    let mut _post_id = 0;
    let mut _parent_id = 0;

    let created_comment: Comment = diesel::insert_into(comments::table)
        .values(
            &(NewComment {
                post_id: if let Some(n) = comment.post_id {
                    _post_id = n;
                    post::get(&_post_id, PostState::All, db)?;
                    Some(&_post_id)
                } else {
                    None
                },
                parent_id: if let Some(n) = comment.parent_id {
                    _parent_id = n;
                    get(&_parent_id, db)?;
                    Some(&_parent_id)
                } else {
                    None
                },
                user_id: user_id_,
                body: &comment.body,
                likes: None,
            }),
        )
        .get_result(db)?;

    notif_server.do_send(notif_server::NewComment {
        parent_id: comment.post_id.unwrap(),
        id: created_comment.id,
    });

    Ok(created_comment.id)
}

pub fn get(id_: &i32, db: &DbConnection) -> Result<(Comment, MinimalUser), ApiError> {
    Ok(comments::table
        .inner_join(users::table)
        .filter(comments::id.eq(id_))
        .first(db)?)
}

pub fn delete_by_user_id(id_: &i32, db: &DbConnection) -> Result<usize, ApiError> {
    Ok(diesel::delete(comments.filter(comments::user_id.eq(id_))).execute(db)?)
}

pub fn anonymize_by_user_id(id_: &i32, db: &DbConnection) -> Result<usize, ApiError> {
    Ok(diesel::update(comments.filter(comments::user_id.eq(id_)))
        .set(comments::user_id.eq(0))
        .execute(db)?)
}

pub fn list(
    params: CommentsQueryParams,
    db: &DbConnection,
) -> Result<(Vec<(Comment, MinimalUser)>, i64), ApiError> {
    let mut query = comments::table.inner_join(users::table).into_boxed();
    query = query.order(id.desc());

    query = if let Some(id_) = params.post_id {
        query.filter(comments::post_id.eq(id_).and(comments::parent_id.is_null()))
    } else if let Some(id_) = params.parent_id {
        query.filter(comments::parent_id.eq(id_))
    } else if let Some(id_) = params.user_id {
        query.filter(comments::user_id.eq(id_))
    } else {
        return Err(ApiError::InternalError(
            "Unvalid comment query params".to_string(),
        ));
    };

    let (comments_list, total_pages) =
        query.load_with_pagination(db, params.page, params.page_size)?;

    Ok((comments_list, total_pages))
}

pub fn count_comments(params: CommentsQueryId, db: &DbConnection) -> Result<i64, ApiError> {
    let mut query = comments::table.into_boxed();

    query = if let Some(id_) = params.post_id {
        query.filter(comments::post_id.eq(id_))
    } else if let Some(id_) = params.parent_id {
        query.filter(comments::parent_id.eq(id_))
    } else {
        return Err(ApiError::InternalError(
            "Unvalid comment query id".to_string(),
        ));
    };

    Ok(query.select(count_star()).get_result(db)?)
}
