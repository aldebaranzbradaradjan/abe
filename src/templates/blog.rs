use ramhorns::{Content, Ramhorns};

use crate::database::models::Post;

use crate::errors::*;

use std::env;

extern crate pulldown_cmark;

use pulldown_cmark::{html, Event, Options, Parser, Tag};

use syntect::highlighting::ThemeSet;
use syntect::html::highlighted_html_for_string;
use syntect::parsing::SyntaxSet;

#[derive(Content)]
struct PostContent<'a> {
    title: &'a str,
    abstract_: &'a str,
    toc: &'a str,
    body: &'a str,
    date: String,
}

#[derive(Content)]
struct PostAbstractContent<'a> {
    id: &'a i32,
    title: &'a str,
    abstract_: &'a str,
    body: &'a str,
    date: String,
}

#[derive(Content)]
struct BlogContent<'a> {
    title: &'a str,
    posts: Vec<PostAbstractContent<'a>>,
    page: &'a i64,
    total_pages: &'a i64,
    prev_page: Option<&'a i64>,
    next_page: Option<&'a i64>,
}

#[derive(Content)]
struct LoginContent<'a> {
    title: &'a str,
}

pub fn add_markdown_toc(content: &str) -> Result<Vec<String>, ApiError> {
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
            let trimmed = l.trim_end();

            if trimmed.starts_with("```") && !skip {
                skip = true
            } else if trimmed.starts_with("```") && skip {
                skip = false
            }

            if trimmed.starts_with("#") && !skip {
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
                    })
                    .collect::<String>()
                    .trim_start()
                    .to_owned();

                Some(Heading {
                    depth: depth - 1,
                    title,
                })
            } else {
                None
            }
        })
        .filter_map(|h| {
            let x = h?;
            Some(format!(
                "{} {} {}",
                " ".repeat(2).repeat(x.depth),
                "*",
                format!(
                    "[{}](#user-content-{})",
                    &x.title,
                    &x.title.replace(" ", "-").to_lowercase()
                )
            ))
        })
        .for_each(|l| {
            toc.push_str(&format!("{}\n", l));
        });

    content
        .lines()
        .map(|l| {
            let trimmed = l.trim_end();

            if trimmed.starts_with("```") {
                skip = !skip;
            }

            if trimmed.starts_with("#") && !skip {
                let line = trimmed
                    .chars()
                    .skip_while(|c| if *c == '#' { true } else { false })
                    .collect::<String>()
                    .trim_start()
                    .to_owned();

                format!(
                    "<a class=\"anchor-content\" id=\"user-content-{}\"></a>\n{}",
                    line.replace(" ", "-").to_lowercase(),
                    l
                )
            } else {
                l.to_owned()
            }
        })
        .for_each(|l| {
            body.push_str(&format!("{}\n", l));
        });

    println!("{}",toc);
    Ok(vec![toc, body])
}

struct EventIter<'a> {
    p: Parser<'a>,
    ss: SyntaxSet,
    ts: ThemeSet,
}

impl<'a> EventIter<'a> {
    pub fn new(p: Parser<'a>) -> Self {
        EventIter {
            p: p,
            ss: SyntaxSet::load_defaults_newlines(),
            ts: ThemeSet::load_defaults(),
        }
    }
}

impl<'a> Iterator for EventIter<'a> {
    type Item = Event<'a>;

    fn next(&mut self) -> Option<Self::Item> {
        let next = match self.p.next() {
            Some(v) => v,
            None => return None,
        };

        match next {
            Event::Start(Tag::CodeBlock(_)) => {
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
                        let mut vec: Vec<&str> =
                            text_buf.split(|c| c == '\r' || c == '\n').collect();

                        let mut lang: String = vec.first()?.to_owned().to_owned();
                        lang.retain(|c| !c.is_whitespace());

                        let sr = match self.ss.find_syntax_by_extension(&lang) {
                            Some(x) => {
                                vec.drain(0..1);
                                x
                            }
                            None => self.ss.find_syntax_by_extension("rs")?,
                        };

                        return Some(Event::Html(
                            highlighted_html_for_string(
                                &vec.join("\n"),
                                &self.ss,
                                &sr,
                                &self.ts.themes["base16-ocean.dark"],
                            )
                            .into(),
                        ));
                    }
                    _ => panic!("Unexpected element inside codeblock mode {:?}", next),
                }
            }
            _ => Some(next),
        }
    }
}

pub fn render_markdown(markdown: &str, highlighting: bool) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    //options.insert(Options::ENABLE_FOOTNOTES);

    let mut unsafe_html = String::new();
    let p = Parser::new_ext(markdown, options);

    if highlighting {
        let ev_it = EventIter::new(p);
        html::push_html(&mut unsafe_html, ev_it);
    } else {
        html::push_html(&mut unsafe_html, p);
    }

    unsafe_html
}

pub fn post_template(post: Post) -> Result<String, ApiError> {
    let mut tpls = Ramhorns::lazy(env::var("TEMPLATES_PATH")?)?;
    let post_vec = add_markdown_toc(&post.body)?;
    let posts_content = PostContent {
        title: &post.title,
        toc: &render_markdown(&post_vec[0], false),
        abstract_: &post.abstract_,
        body: &render_markdown(&post_vec[1], true),
        date: format!("{}", &post.created_at),
    };
    Ok(tpls.from_file("blog_post.html")?.render(&posts_content))
}

pub fn home_template(posts: (Vec<Post>, i64), page: Option<i64>) -> Result<String, ApiError> {
    let mut tpls = Ramhorns::lazy(env::var("TEMPLATES_PATH")?)?;
    let mut posts_content = Vec::new();
    for post in posts.0.iter() {
        posts_content.push(PostAbstractContent {
            id: &post.id,
            title: &post.title,
            abstract_: &post.abstract_,
            body: &"",
            date: format!("{}", &post.created_at),
        })
    }
    let mut _prev = 0;
    let mut _next: i64 = 0;
    Ok(tpls.from_file("blog_home.html")?.render(
        &(BlogContent {
            title: &env::var("PLATFORM_NAME")?,
            posts: posts_content,
            page: &page.ok_or_else(|| ApiError::InternalError("Page must be set !".to_string()))?,
            total_pages: &posts.1,
            prev_page: match page {
                Some(n) if n > 0 => {
                    _prev = n - 1;
                    Some(&_prev)
                }
                _ => None,
            },
            next_page: match posts.1 {
                t if t - _prev - 1 > 0 => {
                    _next = _prev + 2;
                    Some(&_next)
                }
                _ => None,
            },
        }),
    ))
}
