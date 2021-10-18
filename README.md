<img src="https://raw.githubusercontent.com/aldebaranzbradaradjan/abe/master/public/images/abe.webp" alt="drawing" width="200"/>

# Another Blog Engine (abe)

Abe is a small project that I started doing my blog. I use my skeleton-api as a base and build the rest on it.
The point of this project is to learn, and I'm sharing it because I thought one more resource in Rust wouldn't hurt.
So, it's not a mature or bug-free product, but I use it and if we are not demanding it does the trick.

The backend is in Rust and uses Actix to serve the API and the blog with templates.
The Dashboard (responsible for creating / updating / deleting / publishing articles) is a Svelte app with a web assembly module that uses Yew for the editor.
Because why not. It's an admin dashboard, right now I don't care if it's not clean (or if it's a mess), but maybe I'll rewrite it someday.

# Setup
To compile we need an valid Rust environnement : https://rustup.rs/, tthe diesel_cli : http://diesel.rs/guides/getting-started/.
We also need an postgresql database, a .env containing informations such as the name of your platform, various paths, and info about the API (see example.env).
For admin dashboard we need Svelte (so npm install etc) and for the Yew module we need to install wasm-pack : https://rustwasm.github.io/wasm-pack/installer/

# Build
## Build Backend
```bash
cargo build --bin api --release
```
## Build Artisan
```bash
cargo build --bin artisan --release
```
## Build Dashboard
```bash
cd dashboard
build.sh
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
## Run Backend
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

# Post build instructions
We need to add at least an admin to the DB, to be able to use the dashboard. Use the artisan to do that (-a is a flag that mean admin):
```bash
./target/release/artisan create-user -a --email aaa@bbb.ccc --password 123456
```

Now just go to the dashboard : http://127.0.0.1:8080/dashboard/admin_restricted

Create articles and see the result here : http://127.0.0.1:8080/blog
