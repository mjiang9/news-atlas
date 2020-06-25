function displayCoverIfNeeded() {
    if (window.innerWidth < 500) $cover.show()
    else $cover.hide()
}

$cover = $("<div>").text("Sorry, the app is not supported for small window sizes :(").addClass("cover");
$cover.hide()
$cover.appendTo(document.body)
displayCoverIfNeeded()

window.addEventListener("resize", displayCoverIfNeeded)
