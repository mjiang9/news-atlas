function displayCoverIfNeeded() {
    console.log("New window width: " + window.innerWidth)
    if (window.innerWidth < 800) $cover.show()
    else $cover.hide()
}

$cover = $("<div>").text("Sorry, the app is not supported for small window sizes :(").addClass("cover");
$cover.hide()
$cover.appendTo(document.body)
displayCoverIfNeeded()

window.addEventListener("resize", displayCoverIfNeeded)
