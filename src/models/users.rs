use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateUser {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1))]
    pub username: String,
    #[validate(length(min = 5))]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateUser {
    #[validate(email)]
    pub old_email: String,
    #[validate(email)]
    pub new_email: String,
    #[validate(length(min = 1))]
    pub username: String,
    #[validate(length(min = 5))]
    pub old_password: String,
    #[validate(length(min = 5))]
    pub new_password: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct AuthUser {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 5))]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct DeleteUser {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 5))]
    pub password: String,
    pub anonymise: bool,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct ChangePassword {
    #[validate(length(min = 5))]
    pub old_password: String,
    #[validate(length(min = 5))]
    pub new_password: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct Mail {
    #[validate(email)]
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct ResetPassword {
    #[validate(email)]
    pub email: String,
    pub token: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct TokenValidation {
    #[validate(email)]
    pub email: String,
    pub token: String,
}