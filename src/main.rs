#[macro_use]
extern crate diesel;
extern crate dotenv;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;

#[macro_use]
extern crate validator_derive;
extern crate validator;

extern crate log;

use actix_web::{
    web,
    App,
    HttpServer,
    middleware::{ 
        Logger
    }
};

use listenfd::ListenFd;
use env_logger::Env;
use actix_files::Files;

mod branca_session;
mod handlers;
mod db;
mod errors;
mod template;
mod validate;

use crate::handlers::*;

#[actix_rt::main]
async
fn main() -> std::io::Result<()> {
    
    env_logger::from_env(Env::default().default_filter_or("info")).init();
    let mut listenfd = ListenFd::from_env();

    let mut server = HttpServer::new(|| {
        App::new()

            .data(web::JsonConfig::default().limit(4096))
            .wrap(Logger::default())
            .wrap(Logger::new("%a %{User-Agent}i"))

            .service(
                web::scope("/site")
                    .route("/post/{id}", web::get().to( r_post_template ))
                    .route("/home", web::get().to( r_home_template ))
            )

            .service(
                web::scope("/admin")
                    // Lock down routes with Branca Middleware
                    .wrap(branca_session::BrancaSession)

                    .route("/login", web::get().to( r_login_template ))
                    .route("/home", web::get().to( r_home_admin_template ))
                    .route("/new", web::get().to( r_new_admin_template ))
                    .route("/edit/{id}", web::get().to( r_edit_admin_template ))
            )

            .service(
                web::scope("/api/v1")
                    // Lock down routes with Branca Middleware
                    .wrap(branca_session::BrancaSession) 

                    // POST routes
                    .service(
                        web::scope("/post")
                            .route("", web::get().to( r_get_posts ))
                            .route("", web::post().to( r_create_post ))
                            .route("/pending", web::get().to( r_get_pending_posts ))
                            .route("/publish/{id}", web::put().to( r_publish ))
                            .route("/{id}", web::get().to( r_get_post ))
                            .route("/{id}", web::put().to( r_update_post ))
                            .route("/{id}", web::delete().to( r_delete_post ))
                    )

                    // AUTH routes
                    .service(
                        web::scope("/auth")
                            .route("/login", web::post().to( r_auth ))
                            //.route("/logout", web::get().to(logout)),
                    )

                    // USER routes
                    .service(
                        web::scope("/user")
                            .route("", web::get().to( r_get_users ))
                            .route("/{id}", web::get().to( r_get_user ))
                            //.route("/{id}", web::put().to(update_user))
                            //.route("/{id}", web::delete().to(delete_user))
                            .route("/create", web::post().to( r_register_user ))
                    ),
            )

            // Serve secure static files from the static-private folder
            .service(
                web::scope("/secure-static").wrap(branca_session::BrancaSession).service(
                    Files::new("", "./secure-static")
                ),
            )
            // Serve public static files from the static folder
            .service(
                web::scope("/static").default_service(
                    Files::new("", "./static").show_files_listing()
                ),
            )

    });

    server = if let Some(l) = listenfd.take_tcp_listener(0).unwrap() {
        server.listen(l)?
    } else {
        server.bind("0.0.0.0:8088") ?
    };

    server.run().await

}
