use super::DbConnection;
use super::{models::*, schema::users, schema::users::dsl::*};

use crate::errors::*;
use crate::models::users::*;
use crate::middlewares::session::JsonBrancaToken;

extern crate chrono;
use chrono::offset::Utc;

use diesel::dsl::exists;
use diesel::prelude::*;

extern crate bcrypt;
use bcrypt::{hash, verify, DEFAULT_COST};

extern crate branca;
use branca::Branca;

extern crate rand;
use rand::{distributions::Alphanumeric, Rng};

pub fn register(admin: bool, user: &CreateUser, db: &DbConnection) -> Result<i32, ApiError> {
    if let true = diesel::select(exists(users.filter(email.eq(&user.email)))).get_result(db)? {
        return Err(ApiError::InternalError("The user email exist".to_owned()));
    }
    let key = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .collect::<String>();
    let hash = hash(format!("{}{}", user.email, user.password), DEFAULT_COST)?;
    let new_user = NewUser {
        is_admin: &admin,
        username: &user.username,
        email: &user.email,
        token_key: &key,
        password_hash: &hash,
        reset_token: "",
    };
    let created_user: User = diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(db)?;
    Ok(created_user.id)
}

pub fn update(_id: &i32, user: &CreateUser, db: &DbConnection) -> Result<(), ApiError> {
    let current_user = get_user_by_id(_id, db)?;
    let hash = hash(format!("{}{}", user.email, user.password), DEFAULT_COST)?;
    diesel::update(users.find(current_user.id))
        .set((
            email.eq(&user.email),
            password_hash.eq(hash),
            username.eq(&user.username),
        ))
        .execute(db)?;
    Ok(())
}

pub fn delete(_id: &i32, db: &DbConnection) -> Result<(), ApiError> {
    diesel::delete(users.filter(id.eq(_id))).execute(db)?;
    Ok(())
}

pub fn get_user_by_id(_id: &i32, db: &DbConnection) -> Result<User, ApiError> {
    Ok(users.filter(users::id.eq(_id)).first(db)?)
}

pub fn get_user_by_email(mail: &str, db: &DbConnection) -> Result<User, ApiError> {
    Ok(users.filter(users::email.eq(mail)).first(db)?)
}

pub fn auth(mail: &str, pwd: &str, db: &DbConnection) -> Result<String, ApiError> {
    let user: User = users.filter(users::email.eq(mail)).first(db)?;
    match verify(format!("{}{}", mail, pwd), &user.password_hash)? {
        true => Ok(create_token(user)?),
        _ => Err(ApiError::InternalError(
            "Invalid email or password".to_owned(),
        )),
    }
}

pub fn create_token(user: User) -> Result<String, ApiError> {
    let key = user.token_key.as_bytes().to_vec();
    let mut branca = Branca::new(&key)?;
    let payload = format!("{}", Utc::now());
    let t = branca.encode(&payload.as_bytes())?;
    let token = JsonBrancaToken {
        id: user.id,
        token: t,
    };
    Ok(serde_json::to_string(&token)?)
}

pub fn verify_token(
    _id: &i32,
    token: &str,
    must_be_admin: bool,
    db: &DbConnection,
) -> Result<(), ApiError> {
    let user = get_user_by_id(_id, db)?;
    if must_be_admin && !user.is_admin {
        return Err(ApiError::InternalError("User is not admin".to_owned()));
    }
    let key = user.token_key.as_bytes().to_vec();
    let branca = Branca::new(&key)?;
    branca.decode(token, 86400)?;
    Ok(())
}

pub fn generate_reset_token(mail: &str, db: &DbConnection) -> Result<String, ApiError> {
    let user = get_user_by_email(mail, db)?;
    let rand = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .collect::<String>();
    let key = user.token_key.as_bytes().to_vec();
    let mut branca = Branca::new(&key)?;
    let token = branca.encode(&rand.as_bytes())?;
    diesel::update(users.filter(email.eq(mail)))
        .set(reset_token.eq(token))
        .execute(db)?;
    Ok(rand)
}

pub fn verify_reset_token(mail: &str, token: &str, db: &DbConnection) -> Result<(), ApiError> {
    let user = get_user_by_email(mail, db)?;
    let key = user.token_key.as_bytes().to_vec();
    let rtoken = user.reset_token;
    let branca = Branca::new(&key)?;
    let rtoken = branca.decode(&rtoken, 86400)?;
    match rtoken == token.as_bytes().to_vec() {
        true => Ok(()),
        _ => Err(ApiError::InternalError("Invalid reset token".to_owned())),
    }
}

pub fn change_password(mail: &str, pwd: &str, db: &DbConnection) -> Result<(), ApiError> {
    let hash = hash(format!("{}{}", mail, pwd), DEFAULT_COST)?;
    diesel::update(users.filter(email.eq(mail)))
        .set(password_hash.eq(hash))
        .execute(db)?;
    Ok(())
}
