# abe
Another blog engine written in Rust with the Actix web framework. This program is only for learning and you should probably not use it :)

# Instruction
To build the project :
```bash
cargo build
```
To run :
```bash
cargo run
```
or
```bash
systemfd --no-pid -s http::8088 -- cargo watch -x run
```
# Use
Go to the login page to create a branca token : http://127.0.0.1:8088/admin/login

Then you can use the admin panel : http://127.0.0.1:8088/admin/home

To see the blog : http://127.0.0.1:8088/site/home
