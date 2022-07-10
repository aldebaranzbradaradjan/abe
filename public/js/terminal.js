let hdd_root = { name: '/home/root', supDir: null, dirs: [], files: [] }
let hdd = hdd_root
let commandHistory = { index: 0, commands: [] }

const delayMS = ms => new Promise(res => setTimeout(res, ms));

async function acceptCookies() {
    const settings = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
    const response = await fetch(`/api/v1/user/user_restricted/accept_cookies`, settings)
    if (!response.ok) {
        var history = document.getElementById('terminal_history')
        addHistoryLine(history, "An error occured while accepting cookies.")
    } else {
        var history = document.getElementById('terminal_history')
        addHistoryLine(history, "Thank you for accepting our cookies !")
        addHistoryLine(history, "Terminal will be close")
        let terminal = document.getElementById('cookie_popup')
        terminal.scrollTop = terminal.scrollHeight
        await delayMS(2000);
        document.getElementById('cookie_popup').remove()
    }
}

async function handleCommand(command) {
    if (command.length == 0) return
    commandHistory.commands.push(command)
    commandHistory.index = commandHistory.commands.length + 1
    var history = document.getElementById('terminal_history')
    addHistoryLine(history, "[root@dunmer.eu ~]# " + command)

    // perform a list of commands
    if (command.includes("ls")) {
        let line = hdd.supDir !== null ? "./ ../" : ''
        hdd.dirs.forEach(dir => {
            line += " <div class='terminal_dir'>" + dir.name + "</div>"
        });
        hdd.files.forEach(file => {
            line += " " + file.name
        });
        addHistoryLine(history, line)
    } else if (command.includes("touch")) {
        let fname = command.split(" ")[1]
        if (hdd.files.find(f => f.name === fname) === undefined) {
            hdd.files.push({ name: fname, content: '' })
        }
    } else if (command.includes("rm -r")) {
        let dname = command.split(" ")[2]
        if (hdd.dirs.find(d => d.name === dname) !== undefined) {
            hdd.dirs = hdd.dirs.filter(function(value, index, arr) {
                return value.name != dname;
            });
        } else {
            addHistoryLine(history, "rm: " + dname + ": No such file or directory")
        }
    } else if (command.includes("rm")) {
        let fname = command.split(" ")[1]
        hdd.files = hdd.files.filter(function(value, index, arr) {
            return value.name != fname;
        });
    } else if (command.includes("cd")) {
        let dname = command.split(" ")[1]
        if (dname === ".." && hdd.supDir !== null) {
            hdd = hdd.supDir
        } else {
            if (hdd.dirs.find(d => d.name === dname) !== undefined) {
                hdd = hdd.dirs.find(d => d.name === dname)
            } else {
                addHistoryLine(history, "cd: " + dname + ": No such file or directory")
            }
        }
    } else if (command.includes("cat")) {
        let fname = command.split(" ")[1]
        if (hdd.files.find(f => f.name === fname) !== undefined) {
            addHistoryLine(history, hdd.files.find(f => f.name === fname).content)
        } else {
            addHistoryLine(history, "cat: " + fname + ": No such file or directory")
        }
    } else if (command.includes("echo") && command.includes(">>")) {
        var index = command.indexOf(" ")
        var text = command.substr(index + 1)
        index = text.indexOf(">>")
        text = text.substr(0, index)
        text = text.replace(/\'/g, "")
        text = text.replace(/\"/g, "")
        index = command.indexOf(">>")
        var fname = command.substr(index + 3)
        if (hdd.files.find(f => f.name === fname) !== undefined) {
            hdd.files.find(f => f.name === fname).content += text + "\n"
        } else {
            addHistoryLine(history, "echo: " + fname + ": No such file or directory")
        }
    } else if (command.includes("echo")) {
        var index = command.indexOf(" ")
        var text = command.substr(index + 1)
        text = text.replace(/\'/g, "")
        text = text.replace(/\"/g, "")
        addHistoryLine(history, text)
    } else if (command.includes("mkdir")) {
        let dname = command.split(" ")[1]
        if (hdd.dirs.find(d => d.name === dname) === undefined) {
            hdd.dirs.push({ name: dname, supDir: hdd, dirs: [], files: [] })
        }
    } else if (command.includes("clear")) {
        history.innerHTML = ""
    } else if (command.includes("exit")) {
        document.getElementById('cookie_popup').remove()
    } else if (command === "OK" || command === "ok" || command === "Ok" || command === "o" || command === "o") {
        acceptCookies()
    } else if (command === "NO" || command === "no" || command === "No" || command === "n" || command === "N") {
        addHistoryLine(history, "No problem, you only need cookie if you want to comment !")
        addHistoryLine(history, "You will be disconnected now")
        await delayMS(3000);
        disconnect()
    } else if (command.includes("help")) {
        addHistoryLine(history, "OK: Accept cookies")
        addHistoryLine(history, "NO: Refuse cookies")
        addHistoryLine(history, "ls: list directory contents")
        addHistoryLine(history, "touch: create a new file")
        addHistoryLine(history, "rm: remove a file")
        addHistoryLine(history, "cd: change directory")
        addHistoryLine(history, "cat: display contents of a file")
        addHistoryLine(history, "echo: display text (support >> file)")
        addHistoryLine(history, "mkdir: create a new directory")
        addHistoryLine(history, "rm -r: remove a directory")
        addHistoryLine(history, "clear: clear the terminal")
        addHistoryLine(history, "exit: exit the terminal")
        addHistoryLine(history, "help: display this help")
    } else if (command.length > 0) {
        addHistoryLine(history, command + ": command not found")
    }
    // scroll to the bottom
    let terminal = document.getElementById('cookie_popup')
    terminal.scrollTop = terminal.scrollHeight
}

function addHistoryLine(history, text) {
    const line = document.createElement('div')
    line.innerHTML = text
    history.appendChild(line)
}

function setupTerminal() {

    hdd.files.push({ name: 'readme', content: 'This is a readme file' })
    hdd.dirs.push({ name: 'test', supDir: hdd, dirs: [], files: [] })

    var history = document.getElementById('terminal_history')
    addHistoryLine(history, "AldeOS Linux 0.8 (core)")
    addHistoryLine(history, "Kernel 2.6.32-696.el6.x86_64 on an AMD64 machine")
    addHistoryLine(history, "Last login: Wed Apr 12 09:00:00 from this place")
    addHistoryLine(history, "-")
    addHistoryLine(history, "dunmer.eu use cookies to manage your session.")
    addHistoryLine(history, "Type : 'OK' to accept cookies or 'NO' to reject them (and logout).")
    addHistoryLine(history, "-")

    var input = document.getElementById('terminal_input_text')
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleCommand(input.value)
            input.value = ''
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (commandHistory.commands.length > 0 && commandHistory.index > 1) {
                commandHistory.index--;
                input.value = commandHistory.commands[commandHistory.index - 1]
            } else {
                commandHistory.index = 0
                input.value = ''
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (commandHistory.commands.length > 0 && commandHistory.index < commandHistory.commands.length) {
                commandHistory.index++;
                input.value = commandHistory.commands[commandHistory.index - 1]
            } else {
                input.value = ''
                commandHistory.index = commandHistory.commands.length + 1
            }
        }
    });

    var terminal = document.getElementById('cookie_popup')
    terminal.addEventListener('click', (e) => {
        input.focus()
    });
}