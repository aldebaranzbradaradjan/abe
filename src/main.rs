use actix_files::Files;
use actix_web::{middleware, web, App, HttpServer};

#[macro_use]
extern crate diesel;
extern crate dotenv;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;

extern crate chrono;

use dotenv::dotenv;
use std::env;

mod db;
mod errors;
mod handlers;
mod mails;
mod middlewares;
mod models;
mod templates;

use crate::db as database;
use crate::handlers as handler;

use actix::prelude::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    // ASCII art banner always looks cool
    // https://www.patorjk.com/software/taag/#p=display&h=0&v=0&f=Bloody&t=Skeleton
    println!(
        "
        ▄▄▄       ▄▄▄▄   ▓█████ 
        ▒████▄    ▓█████▄ ▓█   ▀ 
        ▒██  ▀█▄  ▒██▒ ▄██▒███   
        ░██▄▄▄▄██ ▒██░█▀  ▒▓█  ▄ 
         ▓█   ▓██▒░▓█  ▀█▓░▒████▒
         ▒▒   ▓▒█░░▒▓███▀▒░░ ▒░ ░
          ▒   ▒▒ ░▒░▒   ░  ░ ░  ░
          ░   ▒    ░    ░    ░   
              ░  ░ ░         ░  ░
                        ░        
                               
        VERSION : DEV 0.1.0     
        Your server is up and running at http://127.0.0.1:8080\n
    "
    );

    let pool = database::init_pool().expect("Failed to create pool");
    let postman = mails::Postman.start();

    HttpServer::new(move || {
        App::new()
            // add the pool to app state
            .data(pool.clone())
            // insert actor postman
            .data(postman.clone())
            .service(
                web::scope("/api/v1")
                    .configure(handler::users::configure)
                    .configure(handler::posts::configure),
            )
            .configure(handler::dashboard::configure)
            .configure(handler::blog::configure)
            // PUBLICS FILES
            .service(Files::new(
                "/public",
                env::var("PUBLIC_PATH").expect("PUBLIC_PATH must be set"),
            ))
            // enable logger - always register actix-web Logger middleware last
            .wrap(middleware::Logger::default())
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
