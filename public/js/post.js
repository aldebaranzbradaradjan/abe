function toggleToc() {
    var x = document.getElementById("toc")
    if (x.className.indexOf("show") == -1) {
        x.className += " show"
    } else {
        x.className = x.className.replace(" show", "")
    }
}

async function getCountComments(post_id, parent_id) {
    const settings = {
        method: 'POST',
        body: JSON.stringify({
            "post_id": post_id,
            "parent_id": parent_id,
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
    const response = await fetch(`/api/v1/comment/count`, settings)
    if (!response.ok) throw Error(response.message)
    return await response.json()
}

async function getComments(post_id, parent_id, page_size, page) {
    const settings = {
        method: 'POST',
        body: JSON.stringify({
            "post_id": post_id,
            "parent_id": parent_id,
            "page_size": page_size,
            "page": page,
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
    const response = await fetch(`/api/v1/comment/list`, settings)
    if (!response.ok) throw Error(response.message)
    return await response.json()
}

async function getComment(comment_id) {
    const settings = {
        method: 'POST',
        body: JSON.stringify({
            "id": comment_id,
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
    const response = await fetch(`/api/v1/comment`, settings)
    if (!response.ok) throw Error(response.message)
    return await response.json()
}

async function createComments(post_id, parent_id, text) {
    const settings = {
        method: 'POST',
        body: JSON.stringify({
            "post_id": post_id,
            "parent_id": parent_id,
            "body": text,
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
    const response = await fetch(`/api/v1/comment/user_restricted/create`, settings)
    if (!response.ok) throw Error(response.message)
    return await response.json()
}

async function disconnect() {
    const settings = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
    const response = await fetch(`/api/v1/logout`, settings)
    if (!response.ok) throw Error(response.message)
    window.location.reload()
}

function appendEditor(node, id) {
    document.querySelectorAll("[id^='editor']").forEach(node => { node.parentNode.remove() })
    document.querySelectorAll("[id^='append_com_']").forEach(node => { node.innerText = "Répondre" })
    var editor_template = document.querySelector("#comment_editor_template")
    var clone = document.importNode(editor_template.content, true)

    const id_textbox_editor = (id !== null) ? ("editor_" + id) : "root_editor"
    clone.querySelector(".editor").id = id_textbox_editor

    const btns = clone.querySelectorAll("[data-edit]");
    btns.forEach(btn =>
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            const cmd_val = this.getAttribute("data-edit").split(":");
            document.execCommand(cmd_val[0], false, cmd_val[1]);
        })
    );

    clone.getElementById("send_comment").onclick = function() {
        createComments(postId, id, document.getElementById(id_textbox_editor).innerHTML)
            .then((value) => {
                if (id_textbox_editor === "root_editor")
                    document.getElementById(id_textbox_editor).innerHTML = ""
                else {
                    document.getElementById("append_com_" + id).innerText = "Répondre"
                    document.getElementById(id_textbox_editor).parentNode.remove()
                }
            })
            .catch((error) => {
                console.error(error);
                // afficher une popup
            });
    }

    if (node === null)
        document.getElementById("comments").appendChild(clone)
    else
        node.parentNode.insertBefore(clone, node.nextSibling);
}

async function appendComment(node, comment) {
    var comment_template = document.querySelector("#comment_template");
    var clone = document.importNode(comment_template.content, true)
    var divs = clone.querySelector(".comment")

    divs.id = "comment_" + comment[0].id
    divs.querySelector(".top .user").textContent = comment[1].username
    divs.querySelector(".top time").textContent = comment[0].created_at
    divs.querySelector(".body").innerHTML = comment[0].body

    const id_append_com = (comment[0].id !== null) ? ("append_com_" + comment[0].id) : "append_com_root"
    divs.querySelector(".bottom a").id = id_append_com
    if (checkCookie("CookieChecker")) {
        divs.querySelector(".bottom a")
            .onclick = function() {
                if (document.getElementById("editor_" + comment[0].id)) {
                    document.getElementById(id_append_com).innerText = "Répondre"
                    document.getElementById("editor_" + comment[0].id).parentNode.remove()
                } else {
                    appendEditor(divs, comment[0].id)
                    document.getElementById(id_append_com).innerText = "Annuler"
                }
            }
    } else {
        divs.querySelector(".bottom a").remove()
    }

    var data = await getComments(null, comment[0].id, 10, 1)
    clone.querySelector(".subcomments").id = "subcomments" + comment[0].id
    if (data[0].length > 0) {
        let a = document.createElement("a")
        a.innerText = "Charger les sous commentaires"
        a.onclick = async function() {
            a.remove()
            data = await getComments(null, comment[0].id, 10, 1)
            for (var i = 0; i < data[1]; i++) {
                for (const cmt of data[0]) {
                    await appendComment(document.getElementById("subcomments" + comment[0].id), cmt)
                }
                data = await getComments(null, comment[0].id, 10, i + 2)
            }
        }
        divs.querySelector(".bottom").append(a)
    }

    node.appendChild(clone)
}

async function renderComments(node, post_id, parent_id, page_size, page) {
    const show_more_comments = node.getElementsByClassName("show_more_comments")
    if (show_more_comments.length > 0) show_more_comments[0].remove()

    var data = (parent_id !== null) ?
        await getComments(null, parent_id, page_size, page) :
        await getComments(post_id, null, page_size, page)

    if (data[1] !== 0) {
        for (const cmt of data[0]) {
            await appendComment(node, cmt)
        }
        if (data[1] > page) {
            const show_more_comments = node.getElementsByClassName("show_more_comments")
            if (show_more_comments.length > 0) show_more_comments[0].remove()

            var show_more_comments_template = document.querySelector("#show_more_comments_template")
            var clone = document.importNode(show_more_comments_template.content, true)
            var a = clone.querySelector("div").querySelector("a")
            a.onclick = function() { renderComments(node, post_id, parent_id, page_size, parseInt(page + 1)) }
            node.appendChild(clone)
        }
    }
}

async function initComments() {
    const count = await getCountComments(postId, null)
    if (count > 0) {
        let h = document.createElement("h2")
        h.className = "header"
        h.innerText = count + " commentaires"
        document.getElementById("comments").appendChild(h)
        if (checkCookie("CookieChecker")) appendEditor(null, null)
        await renderComments(document.getElementById("comments"), postId, null, 10, 1)
    } else {
        let p = document.createElement("p")
        p.innerText = "Il n'y a pas encore de commentaires, écrivez le premier !"
        document.getElementById("comments").appendChild(p)
        if (checkCookie("CookieChecker")) appendEditor(null, null)
    }

    if (!checkCookie("CookieChecker")) {
        let p = document.createElement("p")
        p.innerText = "Vous devez être connecté pour pouvoir écrire un commentaire."
        let a = document.createElement("a")
        a.onclick = function() { window.location.href = "/blog/login" }
        a.innerText = "Aller à la page de connexion"
        document.getElementById("comments").appendChild(p)
        document.getElementById("comments").appendChild(a)
    }
}

function updateTocOnScroll() {
    var sect
    let pos = window.pageYOffset || document.documentElement.scrollTop

    tocEndpointslocaction.forEach(function(id, offs) {
        if (id !== undefined) {
            var toc_entry = document.getElementById("toc-" + id)
            if (toc_entry !== null) {
                toc_entry = toc_entry.parentElement
                if (toc_entry.className.indexOf("toc-selected") !== -1) {
                    toc_entry.className = toc_entry.className.replace(" toc-selected", "")
                }
            }
            if (offs - (window.innerHeight / 4) <= pos) sect = id
        }
    })

    if (sect !== undefined) {
        let toc_entry = document.getElementById("toc-" + sect)
        if (toc_entry !== null) toc_entry.parentElement.className += " toc-selected"
    }
}

function initTocWithDimensions() {
    let pos = window.pageYOffset || document.documentElement.scrollTop
    let tocEndpoints = document.querySelectorAll(".anchor-content")
    tocEndpointslocaction = []
    tocEndpoints.forEach(node => {
        tocEndpointslocaction[Math.round(node.getBoundingClientRect().top + pos)] = node.id
    })
    updateTocOnScroll()
}

let socket
var tocEndpointslocaction = []
var timeoutWindowResize = false
var timeoutWindowScroll = false
let delay = 150

window.onload = async function() {

    initTocWithDimensions()

    let logout_profile = document.getElementsByClassName("actions-container")[0].getElementsByTagName("a")
    let logout = logout_profile[0]
    let profile = logout_profile[1]
    let connect = logout_profile[2]
    if (!checkCookie("CookieChecker")) {
        logout.remove()
        profile.remove()
        connect.addEventListener("click", function(e) {
            e.preventDefault()
            window.location.href = "/blog/login"
        })
    } else {
        connect.remove()
        logout.addEventListener("click", function(e) {
            e.preventDefault()
            disconnect()
        })
        profile.addEventListener("click", function(e) {
            e.preventDefault()
            window.location.href = "/blog/profile"
        })
    }

    // feature only supported on firefox at time of writing
    if (navigator.userAgent.indexOf("Firefox") === -1)
        document.getElementsByClassName("toc aside-toc")[0].getElementsByTagName("ul")[0].style.alignSelf = "start"

    let pos = window.pageYOffset || document.documentElement.scrollTop
    let tocEndpoints = document.querySelectorAll(".anchor-content")
    tocEndpoints.forEach(node => {
        tocEndpointslocaction[Math.round(node.getBoundingClientRect().top + pos)] = node.id
    })

    window.addEventListener('scroll', function(e) {
        clearTimeout(timeoutWindowScroll);
        timeoutWindowScroll = setTimeout(updateTocOnScroll, delay);
    });

    var toc2 = document.getElementById("toc2").getElementsByTagName("a")
    for (var i = 0; i < toc2.length; i++) {
        let href = toc2[i].href
        toc2[i].id = "toc-" + href.substring(href.indexOf("anchor-content"))
    }

    var toc = document.getElementById("toc").getElementsByTagName("a")
    for (var i = 0; i < toc.length; i++) {
        toc[i].onclick = function() {
            toggleToc()
            return true
        }
    }

    window.addEventListener('resize', function() {
        clearTimeout(timeoutWindowResize);
        timeoutWindowResize = setTimeout(initTocWithDimensions, delay);
    });

    initComments()
    socket = new WebSocket('ws://127.0.0.1:8080/api/v1/comment/ws')
        // La connexion est ouverte
    socket.addEventListener('open', function(event) {
        socket.send('/join ' + postId)
    });

    // Écouter les messages
    socket.addEventListener('message', async function(event) {
        console.log(event.data)
        let cmd = event.data.trim().split(" ");
        if (cmd[0] === "/new_comment" && !isNaN(parseInt(cmd[1]))) {
            const cmt = await getComment(parseInt(cmd[1]))

            let more_than_one_comment = null
            if (cmt[0].parent_id !== null) {
                more_than_one_comment = document.getElementById("comment_" + cmt[0].parent_id)
                if (more_than_one_comment !== null) {
                    //console.log(more_than_one_comment)
                    if (more_than_one_comment.querySelectorAll(".bottom a").length > 1) {
                        //console.log(more_than_one_comment.querySelectorAll(".bottom a")[1])
                        more_than_one_comment.querySelectorAll(".bottom a")[1].onclick()
                        return
                    }
                }
            }

            if (cmt[0].parent_id !== null) {
                if (document.getElementById("subcomments" + cmt[0].parent_id) !== null)
                    appendComment(document.getElementById("subcomments" + cmt[0].parent_id), cmt)
            } else appendComment(document.getElementById("comments"), cmt)
        }
    });

}