
use ramhorns::{
    Template,
    Content,
};

use crate::db::*;
use crate::errors::ApiError;

extern crate pulldown_cmark;

use pulldown_cmark::{
    html,
    Options,
    Parser
};

use std::str::FromStr;

#[derive(Content)]
struct PostContent<'a> {
    title: &'a str,
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

pub struct Heading {
    pub depth: usize,
    pub title: String,
}

impl FromStr for Heading {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let trimmed = s.trim_right();

        if trimmed.starts_with("#") {
            let mut depth = 0usize;
            let title = trimmed
                .chars()
                .skip_while(|c| {
                    if *c == '#' {
                        depth += 1;
                        true
                    } else {
                        false
                    }
                }).collect::<String>()
                .trim_left()
                .to_owned();

            Ok(Heading {
                depth: depth - 1,
                title,
            })
        }
        else {
            Err(())
        }
    }
}

impl Heading {
    pub fn format(&self) -> Option<String> {
        //let depth : usize;
        //if self.depth > 2 { depth = 2; }
        //else { depth = self.depth; }

        Some(format!(
            "{} {} {}",
            " ".repeat(2)
                .repeat(self.depth),
            "*",
            format!("[{}](#user-content-{})", &self.title, &self.title.replace(" ", "-").to_lowercase() )
        ))
    }
}

pub struct ContentM {
    pub line: String,
}

impl FromStr for ContentM {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let trimmed = s.trim_right();

        if trimmed.starts_with("#") {
            let mut depth = 0usize;
            let line = trimmed
                .chars()
                .skip_while(|c| {
                    if *c == '#' {
                        depth += 1;
                        true
                    } else {
                        false
                    }
                }).collect::<String>()
                .trim_left()
                .to_owned();

            Ok(ContentM {
                line : format!("{} <a id=\"user-content-{}\"></a>", s, line.replace(" ", "-").to_lowercase() ) ,
            })
        }
        else {
            Ok(ContentM {
                line : s.to_owned(),
            })
        }
    }
}

pub fn add_markdown_toc( content : &str ) -> Result<String, ApiError> {
    let mut result = String::new();

    content
        .lines()
        .map(Heading::from_str)
        .filter_map(Result::ok)
        .filter_map(|h| h.format() )
        .for_each(|l| {
            result.push_str( &l );
            result.push('\n');
        });

    result.push('\n');

    content
        .lines()
        .map(ContentM::from_str)
        .filter_map(Result::ok)
        .for_each(|l| {
            //println!("{}", l.line);
            result.push_str( &l.line );
            result.push('\n');
        });
    
    println!("{}", result);

    Ok( result )
}

pub fn markdown_to_html( markdown : &str ) -> Result<String, ApiError> {
    let mut options = Options::empty();

    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    //options.insert(Options::ENABLE_FOOTNOTES);

    let parser = Parser::new_ext(markdown, options);

    let mut html_output: String = String::with_capacity(markdown.len() * 3 / 2);
    html::push_html(&mut html_output, parser);
    Ok( html_output )
}


pub fn post_template( id : &str ) -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/post_page.html") ? ;
    let post = get_post( id ) ? ;

    let posts_content =
        PostContent {
            title : &post.title,
            body :  &markdown_to_html( &add_markdown_toc( &post.body ) ? ) ? ,
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