# abe
Another blog engine written in Rust with the Actix web framework. This program is only for learning and you should probably not use it :)

# Instruction

To compile you need and valid Rust environnement : https://rustup.rs/
And also the diesel_cli, read this : http://diesel.rs/guides/getting-started/

## Build
```bash
cargo build
```

## Database
```bash
diesel setup
```

## Migrations
```bash
diesel migration run
```

## Run
```bash
cargo run
```
or
```bash
systemfd --no-pid -s http::8088 -- cargo watch -x run
```
# Use

We need to create a user (for now, all the users have all rights) :
```
curl -i -H "Content-Type: application/json" -X POST -d '{ "email" : "admin@mail.internet", "username" : "admin", "password" : "admin"  }'
```

Now, we can go to the login page to create a branca token : 0.0.0.0:8088/admin/login
Then you can use the admin panel : 0.0.0.0:8088/admin/home to add and manage posts.

To see the blog : 0.0.0.0:8088/site/home
