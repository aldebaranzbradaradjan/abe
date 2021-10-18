# actix-skeleton-api
An attempt to create a simple and functional API skeleton with Actix.

## It is a work in progress.

For now it is possible to create two types of users (admins and normal users), to manage these users (CRUD), to authenticate these users (with a Branca token, a secure alternative token format to JWT, and an auth middleware), to manage cases of forgotten passwords, change of passwords, reset of password, and to send mails from templates (with a sending pool).

Besides the main program, a very simple tool (named in a really inspired and original way: artisan) allows you to perform simple tasks on the command line, such as creating users, sending emails and maybe more! This program shares the code of the API.

# Setup
To compile we need an valid Rust environnement : https://rustup.rs/. We also the diesel_cli, read this : http://diesel.rs/guides/getting-started/.

We also need an postgresql database, and a .env containing informations such as the name of your platform, various paths, and info about the API.

The artisan target is disabled by default, because the two targets hurt my editor (rust-analyser). He complain, saying that a particular function is not used (artisan don't use them, but the api do), and I get plenty of ugly warnings. Maybe we should dig but I haven't wanted to yet.

When I want to use artisan I uncomment the "artisan" target in the .toml.

# Build
## Build API
```bash
cargo build --bin api --release
```
## Build Artisan
```bash
cargo build --bin artisan --release
```
## Setup Database
```bash
diesel setup
```
## Migrations
```bash
diesel migration run
```


# Use
## Run API
```bash
cargo run --bin api --release
```
## Run Artisan
```bash
cargo run --bin artisan --release
```
To show usage of artisan, just run :
```bash
./target/release/artisan -h
```