table! {
    comments (id) {
        id -> Int4,
        post_id -> Nullable<Int4>,
        parent_id -> Nullable<Int4>,
        user_id -> Int4,
        body -> Text,
        likes -> Int4,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

table! {
    posts (id) {
        id -> Int4,
        title -> Varchar,
        #[sql_name = "abstract"]
        abstract_ -> Varchar,
        body -> Text,
        published -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

table! {
    users (id) {
        id -> Int4,
        is_admin -> Bool,
        is_validated -> Bool,
        username -> Varchar,
        email -> Varchar,
        token_key -> Text,
        password_hash -> Text,
        reset_token -> Text,
        validation_token -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

allow_tables_to_appear_in_same_query!(
    comments,
    posts,
    users,
);
