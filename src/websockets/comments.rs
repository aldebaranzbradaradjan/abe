use actix::{Actor, StreamHandler};
use actix_web_actors::ws;
use log::info;
use std::time::{Duration, Instant};

use actix::prelude::*;

use super::notification as notif;

/// How often heartbeat pings are sent
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
/// How long before lack of client response causes a timeout
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

/// websocket connection is long running connection, it easier
/// to handle with an actor
pub struct CommentWebSocket {
    /// unique session id
    id: usize,
    /// Client must send ping at least once per 10 seconds (CLIENT_TIMEOUT),
    /// otherwise we drop connection.
    hb: Instant,
    /// Chat server
    addr: Addr<notif::NotificationServer>,
}

impl Actor for CommentWebSocket {
    type Context = ws::WebsocketContext<Self>;

    /// Method is called on actor start. We start the heartbeat process here.
    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);
    }

    fn stopping(&mut self, _ctx: &mut Self::Context) -> Running {
        self.addr.do_send(notif::Disconnect { id: self.id });
        Running::Stop
    }
}

/// Handle messages from chat server, we simply send it to peer websocket
impl Handler<notif::Message> for CommentWebSocket {
    type Result = ();

    fn handle(&mut self, msg: notif::Message, ctx: &mut Self::Context) {
        ctx.text(format!("{} {}", msg.0, self.id));
    }
}

/// Handler for `ws::Message`
impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for CommentWebSocket {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        // println!("WS: {:?}", msg);
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                let m = text.trim();
                // we check for /sss type of messages
                if m.starts_with('/') {
                    let v: Vec<&str> = m.splitn(2, ' ').collect();
                    if let "/join" = v[0] {
                        if v.len() == 2 {
                            let addr = ctx.address();
                            if let Ok(room_id) = v[1].parse::<i32>() {
                                self.addr
                                    .send(notif::Connect { addr: addr, room_id: room_id , id: self.id })
                                    .into_actor(self)
                                    .then(|res, act, ctx| {
                                        match res {
                                            Ok(res) => act.id = res,
                                            // something is wrong with chat server
                                            _ => ctx.stop(),
                                        }
                                        fut::ready(())
                                    })
                                    .wait(ctx)
                            }
                        }
                    } else {
                        ctx.text(format!("!!! unknown command: {:?}", m))
                    }
                }
            }
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => ctx.stop(),
        }
    }
}

impl CommentWebSocket {
    pub fn new(addr: Addr<notif::NotificationServer>) -> Self {
        Self {
            id: 0,
            hb: Instant::now(),
            addr: addr,
        }
    }

    /// helper method that sends ping to client every HEARTBEAT_INTERVAL seconds
    ///
    /// also this method checks heartbeats from client
    fn hb(&self, ctx: &mut <Self as Actor>::Context) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            // check client heartbeats
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                info!("Websocket Client heartbeat failed, disconnecting!");
                ctx.stop();
                return;
            }

            ctx.ping(b"");
        });
    }
}
