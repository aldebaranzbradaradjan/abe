use actix_files::Files;
use actix_web::{web, HttpResponse};
use std::env;

use crate::errors::ApiError;
use crate::middlewares::session::{BrancaSession, Level};
use crate::templates::dashboard as tp;

pub async fn dashboard_login() -> Result<HttpResponse, ApiError> {
    let html = tp::dashboard_login()?;
    Ok(HttpResponse::Ok().body(html))
}

pub fn configure(app: &mut web::ServiceConfig) {
    app.service(
        web::scope("/dashboard/")
            .route("login", web::get().to(dashboard_login))
            .service(
                web::scope("/admin_restricted")
                    .wrap(BrancaSession(Level::Admin))
                    .service(
                        Files::new(
                            "",
                            env::var("DASHBOARD_PATH").expect("DASHBOARD_PATH must be set"),
                        )
                        .index_file("index.html"),
                    ),
            ),
    );
}
