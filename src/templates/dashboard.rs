use ramhorns::{Content, Ramhorns};

use crate::errors::ApiError;
use std::env;

#[derive(Content)]
struct DashboardLogin<'a> {
    title: &'a str,
}

pub fn dashboard_login() -> Result<String, ApiError> {
    let mut tpls = Ramhorns::lazy(env::var("TEMPLATES_PATH")?)?;
    let tpl = tpls.from_file("dashboard_login.html")?;

    let content = DashboardLogin {
        title: &format!("{} Dashboard", env::var("PLATFORM_NAME")?),
    };

    Ok(tpl.render(&content))
}
