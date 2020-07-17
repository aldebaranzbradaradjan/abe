
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
    Parser,
    Event,
    Tag
};

use syntect::parsing::SyntaxSet;
use syntect::highlighting::ThemeSet;
use syntect::html::highlighted_html_for_string;

#[derive(Content)]
struct PostContent<'a> {
    title: &'a str,
    toc: &'a str,
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

pub fn add_markdown_toc( content : &str ) -> Result<Vec<String>, ApiError> {

    pub struct Heading {
        pub depth: usize,
        pub title: String,
    }

    let mut body = String::new();
    let mut toc = String::new();
    let mut skip = false;

    //result.push_str( &format!("# Table of Contents\n") );

    content
        .lines()
        .map(|l| {
            let trimmed = l.trim_right();

            if trimmed.starts_with("```") && !skip { skip = true }
            else if trimmed.starts_with("```") && skip { skip = false }

            if trimmed.starts_with("#") && !skip {
                let mut depth = 0usize;
                let title = trimmed
                    .chars()
                    .skip_while(|c| {
                        if *c == '#' { depth += 1;  true }
                        else { false }
                    }).collect::<String>()
                    .trim_left()
                    .to_owned();

                Some( Heading {
                    depth: depth - 1,
                    title,
                })
            }
            else {
                None
            }
        })
        .filter_map(|h| {
            let x = h?;
            Some( format!(
                "{} {} {}",
                " ".repeat(2)
                    .repeat(x.depth),
                "*",
                format!("[{}](#user-content-{})", &x.title, &x.title.replace(" ", "-").to_lowercase() )
            ))

         } )
        .for_each(|l| {
            toc.push_str( &format!("{}\n", l) );
        });

    content
        .lines()
        .map(|l| {
            let trimmed = l.trim_right();

            if trimmed.starts_with("```") && !skip { skip = true }
            else if trimmed.starts_with("```") && skip { skip = false }

            if trimmed.starts_with("#") && !skip {
                let line = trimmed
                    .chars()
                    .skip_while(|c| {
                        if *c == '#' { true }
                        else { false }
                    }
                    ).collect::<String>()
                    .trim_left()
                    .to_owned();

                format!("<a class=\"anchor-content\" id=\"user-content-{}\"></a>\n{}", line.replace(" ", "-").to_lowercase(), l ) 
            }
            else { l.to_owned() }
        })
        .for_each(|l| {
            body.push_str( &format!("{}\n", l) );
        });

    Ok( vec!(toc, body) )
}

struct EventIter<'a> {
	p :Parser<'a>,
}

impl<'a> EventIter<'a> {
	pub fn new(p :Parser<'a>) -> Self {
		EventIter {
			p,
		}
	}
}

impl<'a> Iterator for EventIter<'a> {
	type Item = Event<'a>;

	fn next(&mut self) -> Option<Self::Item> {
        let next = if let Some(v) = self.p.next() {
			v
		} else {
			return None;
        };

		if let &Event::Start(Tag::CodeBlock(_)) = &next {
			// Codeblock time!
            let mut text_buf = String::new();
            let mut next = self.p.next();
            
			loop {
				if let Some(Event::Text(ref s)) = next {
                    text_buf += s;
				} else {
					break;
				}
				next = self.p.next();
			}
			match &next {
				&Some(Event::End(Tag::CodeBlock(_))) => {
                    let mut vec: Vec<&str> = text_buf.split(|c| c == '\r' || c == '\n').collect();
                    let mut lang : String = vec.first()?.to_owned().to_owned();
                    lang.retain(|c| !c.is_whitespace());

                    let ss = SyntaxSet::load_defaults_newlines();
                    let ts = ThemeSet::load_defaults();

                    let sr = match ss.find_syntax_by_extension(&lang) {
                        Some(x) => { vec.drain(0..1); x },
                        None => ss.find_syntax_by_extension("rs") ?,
                    };
                    
                    let theme = &ts.themes["base16-ocean.dark"];

                    return Some(
                        Event::Html( highlighted_html_for_string( &vec.join("\n") , &ss, &sr, theme).into() )
                    );
				},
				_ => panic!("Unexpected element inside codeblock mode {:?}", next),
			}
        }
        
		Some(next)
	}
}

pub fn render_markdown(markdown :&str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    //options.insert(Options::ENABLE_FOOTNOTES);

    let p = Parser::new_ext(markdown, options);
	let ev_it = EventIter::new(p);
	let mut unsafe_html = String::new();
	html::push_html(&mut unsafe_html, ev_it);
	unsafe_html
}


pub fn post_template( id : &str ) -> Result<String, ApiError> {

    let tpl = Template::from_file("./src/templates/post_page_2.html") ? ;
    let post = get_post( id ) ? ;

    let post_vec = add_markdown_toc( &post.body ) ?;

    let posts_content =
        PostContent {
            title : &post.title,
            toc :  &render_markdown( &post_vec[0] ),
            body :  &render_markdown( &post_vec[1] ),
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