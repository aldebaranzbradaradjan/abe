#![recursion_limit="512"]

use wasm_bindgen::{ prelude::*, JsCast };
use web_sys::{ Node };
use yew::{ prelude::*, web_sys, virtual_dom::VNode, Component, ComponentLink, Html, ShouldRender };
use css_in_rust::Style;

extern crate pulldown_cmark;
use pulldown_cmark::{ html, Options, Parser };

pub fn render_markdown(markdown :&str) -> String {
    let mut unsafe_html = String::new();
    let p = Parser::new_ext(markdown, Options::empty());
    html::push_html(&mut unsafe_html, p);
	unsafe_html
}

struct EditorModel {
    content: String,
    html : String,
}

impl EditorModel {
    pub fn update_html(&mut self) {
        self.html = render_markdown(&self.content);
    } 
}

struct Model {
    style: Style,
    link: ComponentLink<Self>,
    editor : EditorModel,
    cb: Closure<dyn Fn(web_sys::MouseEvent)>,
    drag : bool,
}

enum Msg {
    TextAreaOnLoad(Event),
    TextAreaOnInput(String),
    TextAreaOnScroll(Event),
    SeparatorOnClickDown(MouseEvent),
    SeparatorOnClickUp(MouseEvent),
    SeparatorOnMove(MouseEvent),
    HeaderButtonOnClick(MouseEvent),
    BoldButtonOnClick(MouseEvent),
    ItalicButtonOnClick(MouseEvent)
}

impl Component for Model {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, link: ComponentLink<Self>) -> Self {
        let style = Style::create("editor", include_str!("editor.scss"))
            .expect("An error occured while creating the style.");

        let separator_cb = link.callback(|e| Msg::SeparatorOnMove(e));
        let separator_cb = Box::new(move |e: MouseEvent| separator_cb.emit(e)) as Box<dyn Fn(_)>;

        Self {
            style,
            link,
            editor : EditorModel { content : "".into(), html : "".into() },
            cb : Closure::wrap(separator_cb), drag : false
        }
    }

    fn rendered(&mut self, first_render: bool) {
        if first_render {
            let cb_onload = self.link.callback(|e| Msg::TextAreaOnLoad(e));
            cb_onload.emit(web_sys::Event::new("").unwrap());
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::TextAreaOnLoad(_event) => {
                let textarea = yew::utils::document().get_element_by_id("textarea").unwrap()
                    .dyn_into::<web_sys::HtmlTextAreaElement>().unwrap();
                textarea.set_value("# ame\name is **another markdown editor**, this one is fully written in **rust** and based on **pulldown**, **yew** and **wasm**.\n## pulldown\npulldown is responsible of the markdown to html rendering, it's a pretty good crate.\nWith just that you can render markdown :\n```\nextern crate pulldown_cmark;\nuse pulldown_cmark::{ html, Options, Parser };\npub fn render_markdown(markdown :&str) -> String {\nlet mut unsafe_html = String::new();\nlet p = Parser::new_ext(markdown, Options::empty());\nhtml::push_html(&mut unsafe_html, p);\nunsafe_html\n}\n```\n# yew");
                self.editor.content = textarea.value();
                self.editor.update_html();
            },
            Msg::TextAreaOnInput(event) => {
                self.editor.content = event;
                self.editor.update_html();
            },
            Msg::TextAreaOnScroll(_event) => {
                let markdown  = yew::utils::document().get_element_by_id("markdown").unwrap();
                let textarea = yew::utils::document().get_element_by_id("textarea").unwrap();
                let ratio = markdown.scroll_height() as f64 / textarea.scroll_height() as f64;
                markdown.set_scroll_top( (textarea.scroll_top() as f64 * ratio) as i32 );
            },
            Msg::SeparatorOnClickDown(_event) => {
                let editor  = yew::utils::document().get_element_by_id("editor").unwrap();
                (editor.as_ref() as &web_sys::EventTarget)
                    .add_event_listener_with_callback(&"mousemove".to_owned(), self.cb.as_ref().unchecked_ref())
                    .unwrap();
                self.drag = true;
            },
            Msg::SeparatorOnClickUp(_event) => {
                if self.drag {
                    let editor  = yew::utils::document().get_element_by_id("editor").unwrap();
                    (editor.as_ref() as &web_sys::EventTarget)
                        .remove_event_listener_with_callback(&"mousemove".to_owned(), self.cb.as_ref().unchecked_ref())
                        .unwrap();
                    self.drag = false;
                }
            },
            Msg::SeparatorOnMove(_event) => {
                let markdown  = yew::utils::document().get_element_by_id("markdown").unwrap()
                    .dyn_into::<web_sys::HtmlElement>().unwrap();
                let textarea = yew::utils::document().get_element_by_id("textarea").unwrap()
                    .dyn_into::<web_sys::HtmlElement>().unwrap();
                let splitter = yew::utils::document().get_element_by_id("splitter").unwrap()
                    .dyn_into::<web_sys::HtmlElement>().unwrap();

                //web_sys::console::log_2(&_event.client_x().into(), &splitter.offset_width().into());
                let current_x = _event.client_x() - splitter.offset_left();
                let percent_separator = 5.0 / (splitter.offset_width()as f64 / 100.0);
                let percent_markdown = ((current_x + 5).max(0) as f64 / splitter.offset_width() as f64 * 100 as f64).max(10.0).min(90.0);
                let percent_textarea = (100 as f64 - percent_markdown).max(10.0).min(90.0);
                
                //web_sys::console::log_3(&percent_separator.into(), &percent_markdown.into(), &percent_textarea.into());
                markdown.style().set_property("width", &format!("{}%", percent_markdown)).unwrap();
                textarea.style().set_property("width", &format!("{}%", percent_textarea)).unwrap();
            },
            Msg::HeaderButtonOnClick(_event) => {
                let textarea  = yew::utils::document().get_element_by_id("textarea").unwrap()
                    .dyn_into::<web_sys::HtmlTextAreaElement>().unwrap();
                let doc = yew::utils::document().dyn_into::<web_sys::HtmlDocument>().unwrap();
                
                textarea.focus().unwrap();
                if !doc.exec_command_with_show_ui_and_value("insertText", false, "#").unwrap() {
                    // a workaround for firefox :( 
                    textarea.set_range_text("#"); self.editor.content = textarea.value();
                    self.editor.update_html();
                }
            },
            Msg::BoldButtonOnClick(_event) => {
                let textarea  = yew::utils::document().get_element_by_id("textarea").unwrap()
                    .dyn_into::<web_sys::HtmlTextAreaElement>().unwrap();
                let cursor_s = textarea.selection_start().unwrap().unwrap() as usize;
                let cursor_e = textarea.selection_end().unwrap().unwrap() as usize;
                let doc = yew::utils::document().dyn_into::<web_sys::HtmlDocument>().unwrap();
 
                textarea.focus().unwrap();
                textarea.set_selection_end(Some((cursor_s) as u32)).unwrap();

                if !doc.exec_command_with_show_ui_and_value("insertText", false, "**").unwrap()
                    { textarea.set_range_text("**"); }
                textarea.set_selection_start(Some((cursor_e + 2) as u32)).unwrap();
                if !doc.exec_command_with_show_ui_and_value("insertText", false, "**").unwrap() {
                    textarea.set_range_text("**"); self.editor.content = textarea.value();
                    self.editor.update_html();
                }
            },
            Msg::ItalicButtonOnClick(_event) => {
                let textarea  = yew::utils::document().get_element_by_id("textarea").unwrap()
                    .dyn_into::<web_sys::HtmlTextAreaElement>().unwrap();
                let cursor_s = textarea.selection_start().unwrap().unwrap() as usize;
                let cursor_e = textarea.selection_end().unwrap().unwrap() as usize;
                let doc = yew::utils::document().dyn_into::<web_sys::HtmlDocument>().unwrap();
 
                textarea.focus().unwrap();
                textarea.set_selection_end(Some((cursor_s) as u32)).unwrap();
                if !doc.exec_command_with_show_ui_and_value("insertText", false, "*").unwrap()
                    { textarea.set_range_text("*"); }
                textarea.set_selection_start(Some((cursor_e + 1) as u32)).unwrap();
                if !doc.exec_command_with_show_ui_and_value("insertText", false, "*").unwrap() {
                    textarea.set_range_text("*"); self.editor.content = textarea.value();
                    self.editor.update_html();
                }
            }
            // _ => ()
        }

        true
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        false
    }

    fn view(&self) -> Html {

        html! {
            <div id="editor" class=self.style.clone()
                onmouseup = self.link.callback(|e : MouseEvent | Msg::SeparatorOnClickUp(e))>
                <div class="inner">
                    <div id="splitter" class="splitter">
                        <div id="markdown" class="scroller">
                            <RawHTML inner_html = self.editor.html.clone() />
                        </div>
                        <div id="separator" 
                            onmousedown = self.link.callback(|e : MouseEvent | Msg::SeparatorOnClickDown(e)) />
                        <textarea id="textarea" class="scroller" spellcheck="false"
                            oninput = self.link.callback(|e: InputData| Msg::TextAreaOnInput(e.value))
                            onscroll = self.link.callback(|e: Event| Msg::TextAreaOnScroll(e)) />
                    </div>
                    <div id="panel">
                        <button class="button" onclick = 
                            self.link.callback(|e: MouseEvent| Msg::HeaderButtonOnClick(e))>
                            <b>{"H"}<sub>{"1"}</sub></b>
                        </button>
                        <button class="button" onclick = 
                            self.link.callback(|e: MouseEvent| Msg::BoldButtonOnClick(e))>
                            <b>{"B"}</b>
                        </button>
                        <button class="button" onclick = 
                            self.link.callback(|e: MouseEvent| Msg::ItalicButtonOnClick(e))>
                            <b><i>{"I"}</i></b>
                        </button>
                    </div>
                </div>
            </div>
        }
    }
}

#[derive(Debug, Clone, Eq, PartialEq, Properties)]
struct RawHTMLProps {
    pub inner_html: String,
}

struct RawHTML {
    props: RawHTMLProps,
}

impl Component for RawHTML {
    type Message = Msg;
    type Properties = RawHTMLProps;

    fn create(props: Self::Properties, _: ComponentLink<Self>) -> Self {
        Self { props }
    }

    fn update(&mut self, _: Self::Message) -> ShouldRender {
        true
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        if self.props != props {
            self.props = props;
            true
        } else {
            false
        }
    }

    fn view(&self) -> Html {
        let element = yew::utils::document().create_element("div").unwrap();
        element.set_inner_html(&self.props.inner_html[..]);
        element.set_id("markdown_content");
        let node = Node::from(element);
        let vnode = VNode::VRef(node);
        vnode
    }
}

#[wasm_bindgen(start)]
pub fn run_app() {
    let element = yew::utils::document().get_element_by_id("yew_editor")
        .expect("expecting yew_editor in body");
    App::<Model>::new().mount(element);
}