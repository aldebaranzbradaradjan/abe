use super::DbConnection;
use super::{models::*, schema::posts, schema::posts::dsl::*};

extern crate chrono;

use crate::errors::*;
use crate::models::posts::*;

use chrono::offset::Utc;
use diesel::dsl::now;
use diesel::prelude::*;

use crate::db::LoadPaginated;

pub fn create(post: CreatePost, db: &DbConnection) -> Result<i32, ApiError> {
    let new_post = NewPost {
        title: &post.title,
        abstract_: &post.abstract_,
        body: &post.body,
        published: None,
    };

    let created_post: Post = diesel::insert_into(posts::table)
        .values(&new_post)
        .get_result(db)?;

    Ok(created_post.id)
}

pub fn update(post: UpdatePost, db: &DbConnection) -> Result<(), ApiError> {
    diesel::update(posts.find(post.id))
        .set((
            title.eq(post.title),
            abstract_.eq(post.abstract_),
            body.eq(post.body),
            posts::updated_at.eq(Utc::now().naive_utc()),
        ))
        .execute(db)?;
    Ok(())
}

pub fn publish(params: PublishParams, db: &DbConnection) -> Result<usize, ApiError> {
    Ok(diesel::update(posts.find(params.id))
        .set(published.eq(Some(params.date)))
        .execute(db)?)
}

pub fn delete(id_: &i32, db: &DbConnection) -> Result<(), ApiError> {
    diesel::delete(posts.find(id_)).execute(db)?;
    Ok(())
}

pub fn get(id_: &i32, state: PostState, db: &DbConnection) -> Result<Post, ApiError> {
    let mut query = posts::table.into_boxed();
    query = query.filter(posts::id.eq(id_));
    match state {
        PostState::Published => query = query.filter(posts::published.lt(now)),
        PostState::NotYetPublished => query = query.filter(posts::published.gt(now)),
        PostState::NotPublished => query = query.filter(posts::published.is_null()),
        PostState::All => (),
    }
    Ok(query.first(db)?)
}

pub fn list(params: PaginationParams, db: &DbConnection) -> Result<(Vec<Post>, i64), ApiError> {
    let mut query = posts::table.into_boxed();
    match params.state {
        PostState::Published => query = query.filter(posts::published.lt(now)),
        PostState::NotYetPublished => query = query.filter(posts::published.gt(now)),
        PostState::NotPublished => query = query.filter(posts::published.is_null()),
        PostState::All => (),
    }
    query = query.order(id.desc() );
    let (posts_list, total_pages) =
        query.load_with_pagination(db, params.page, params.page_size)?;
    Ok((posts_list, total_pages))
}
