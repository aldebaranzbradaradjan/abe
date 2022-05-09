use actix::prelude::*;
use rand::{self, rngs::ThreadRng, Rng};

use std::collections::{HashMap, HashSet};

/// Chat server sends this messages to session
#[derive(Message)]
#[rtype(result = "()")]
pub struct Message(pub String);

/// Message for server communications

/// New session is created
#[derive(Message)]
#[rtype(usize)]
pub struct Connect {
    pub addr: Addr<super::comments::CommentWebSocket>,
    pub id: usize,
    pub room_id: i32,
}

/// Session is disconnected
#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: usize,
}

/// New session is created
#[derive(Message)]
#[rtype(result = "()")]
pub struct NewComment {
    pub parent_id: i32,
    pub id: i32,
}

/// `NotificationServer` manages post rooms and responsible for coordinating chat
/// session. implementation is super primitive
pub struct NotificationServer {
    sessions: HashMap<usize, Addr<super::comments::CommentWebSocket>>,
    rng: ThreadRng,
    rooms: HashMap<i32, HashSet<usize>>,
}

impl NotificationServer {
    pub fn new() -> NotificationServer {
        // default room
        let mut rooms = HashMap::new();
        rooms.insert(0, HashSet::new());

        NotificationServer {
            sessions: HashMap::new(),
            rng: rand::thread_rng(),
            rooms,
        }
    }
}

impl NotificationServer {
    /// Send message to all users in the room
    fn send_message(&self, room: i32, message: &str) {
        if let Some(sessions) = self.rooms.get(&room) {
            for id in sessions {
                if let Some(addr) = self.sessions.get(id) {
                    let _ = addr.do_send(Message(message.to_owned()));
                }
            }
        }
    }
}

/// Make actor from `NotificationServer`
impl Actor for NotificationServer {
    /// We are going to use simple Context, we just need ability to communicate
    /// with other actors.
    type Context = Context<Self>;
}

/// Handler for Connect message.
///
/// Register new session and assign unique id to this session
impl Handler<Connect> for NotificationServer {
    type Result = usize;

    fn handle(&mut self, msg: Connect, _: &mut Context<Self>) -> usize {
        if msg.id != 0 {
            if self.sessions.remove(&msg.id).is_some() {
                // remove session from all rooms
                for (_id, sessions) in &mut self.rooms {
                    sessions.remove(&msg.id);
                }
            }
        }

        // register session with random id
        let id = self.rng.gen::<usize>();
        self.sessions.insert(id, msg.addr);

        // auto join session to Main room
        self.rooms
            .entry(msg.room_id)
            .or_insert_with(HashSet::new)
            .insert(id);

        // notify all users in same room
        self.send_message(msg.room_id, "Someone joined");

        id
    }
}

/// Handler for Disconnect message.
impl Handler<Disconnect> for NotificationServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
        // remove address
        if self.sessions.remove(&msg.id).is_some() {
            // remove session from all rooms
            for (_id, sessions) in &mut self.rooms {
                sessions.remove(&msg.id);
            }
        }
    }
}

/// Handler for Disconnect message.
impl Handler<NewComment> for NotificationServer {
    type Result = ();

    fn handle(&mut self, msg: NewComment, _: &mut Context<Self>) {
        self.send_message(msg.parent_id, &format!("/new_comment {}", msg.id) );
    }
}