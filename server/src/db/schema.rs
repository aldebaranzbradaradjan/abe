table! {
    posts (id) {
        id -> Text,
        title -> Text,
        teaser -> Text,
        body -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        published -> Bool,
    }
}

table! {
    users (id) {
        id -> Text,
        username -> Text,
        email -> Text,
        token_key -> Text,
        password_hash -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

allow_tables_to_appear_in_same_query!(
    posts,
    users,
);
