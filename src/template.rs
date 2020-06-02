
use ramhorns::{
    Template,
    Content,
};

use crate::db::*;
use crate::errors::ApiError;

#[derive(Content)]
struct PostContent<'a> {
    title: &'a str,
    #[md]
    body: &'a str,
    date: String,
}

#[derive(Content)]
struct PostTeaserContent<'a> {
    id : &'a str,
    title: &'a str,
    teaser: &'a str,
    body : &'a str,
    date: String,
    published: &'a bool,
}

#[derive(Content)]
struct BlogContent<'a> {
    title: &'a str,
    posts: Vec<PostTeaserContent<'a>>,
}

#[derive(Content)]
struct LoginContent<'a> {
    title: &'a str,
}

pub fn post_template( id : &str ) -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/post_page.html") ? ;
    let post = get_post( id ) ? ;

    let posts_content =
        PostContent {
            title : &post.title,
            body : &post.body,
            date : format!("{}", &post.created_at),
        };

    Ok( tpl.render( &posts_content ) )
}

pub fn login_template() -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/login.html") ? ;

    let login_content =
        LoginContent {
            title : "Login",
        };

    Ok( tpl.render( &login_content ) )
}

pub fn home_template() -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/home.html") ? ;

    let posts = get_posts() ? ;
    let mut posts_content = Vec::new();
    
    for post in posts.iter() {
        posts_content.push(
            PostTeaserContent {
                id : &post.id,
                title : &post.title,
                body : &"",
                teaser : &post.teaser,
                date : format!("{}", &post.created_at),
                published : &true,
            }
        )
    }

    let blog_content = BlogContent {
        title : "My Awesome Blog",
        posts : posts_content,
    };

    Ok( tpl.render( &blog_content ) )
}

pub fn home_admin_template() -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/admin_panel.html") ? ;

    let posts = get_all_post() ? ;
    let mut posts_content = Vec::new();
    
    for post in posts.iter() {
        posts_content.push(
            PostTeaserContent {
                id : &post.id,
                title : &post.title,
                body : &"",
                teaser : &post.teaser,
                date : format!("{}", &post.created_at),
                published : &post.published,
            }
        )
    }

    let blog_content = BlogContent {
        title : "Blog Admin Panel",
        posts : posts_content,
    };

    Ok( tpl.render( &blog_content ) )
}

pub fn edit_admin_template( id : &str ) -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/editor.html") ? ;
    let post = get_post( id ) ? ;

    let posts_content =
        PostTeaserContent {
            id : &post.id,
            title : &post.title,
            body : &post.body,
            teaser : &post.teaser,
            date : format!("{}", &post.created_at),
            published : &post.published,
        };

    Ok( tpl.render( &posts_content ) )
}

pub fn new_admin_template() -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/editor.html") ? ;

    let posts_content =
        PostTeaserContent {
            id : &"",
            title : &"",
            body : &"",
            teaser : &"",
            date : "".to_owned(),
            published : &false,
        };

    Ok( tpl.render( &posts_content ) )
}