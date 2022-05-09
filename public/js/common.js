function checkCookie(name) {
    var cookieArr = document.cookie.split(";");
    for (var i = 0; i < cookieArr.length; i++) {
        var cookiePair = cookieArr[i].split("=");
        if (name == cookiePair[0].trim()) {
            return true;
        }
    }
    return false;
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

function checkEmailValidity(id_email, id_error) {
    document.getElementById(id_email).addEventListener("input", function() {
        let error = document.getElementById(id_error);
        if (!document.getElementById(id_email).validity.valid) {
            error.innerHTML = "Vous devez entrer une adresse e-mail valide";
            error.className = "";
        } else {
            error.innerHTML = ""; // On réinitialise le contenu
            error.className = "hidden-important"; // On réinitialise l'état visuel du message
        }
    })
}

function checkPasswordSimilarity(one, two, id_error, validation_button) {
    document.getElementById(two).addEventListener("input", function() {
        let error = document.getElementById(id_error);
        if (document.getElementById(one).value !== document.getElementById(two).value) {
            error.innerHTML = "Les deux mot de passe doivent être identiques";
            error.className = "";
            document.getElementById(validation_button).disabled = true
        } else {
            error.innerHTML = ""; // On réinitialise le contenu
            error.className = "hidden-important"; // On réinitialise l'état visuel du message
            document.getElementById(validation_button).disabled = false
        }
    })
}