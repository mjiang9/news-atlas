$modal = $("<div>").addClass("modal");
$form_box = $("<div>").addClass("form-box")
$close = $("<span>").html("&times;").addClass("close");
$modal_title = $("<div>").html("<h4><b>Feedback</b></h4>").addClass("modal-title")
$input = $("<textarea>").attr("placeholder", "Write something...").addClass("input")
$submit = $("<div>").text("Submit").addClass("submit");
$confirm_text = $("<div>").text("Thank you for your input!").addClass("confirm-text")

$form_box.append($modal_title, $close, $input, $submit, $confirm_text)
$modal.append($form_box)
$modal.appendTo(document.body)

$modal.hide()
$confirm_text.hide()

function hideModal(e) {
    if (e.target !== this) return;
    $modal.hide()
    $input.show()
    $submit.show()
    $confirm_text.hide()
}

$modal.click(hideModal)
$close.click(hideModal)

$submit.click(function() {
    fetch('/save/' + $input.val()) //This is async? but seems to be working
    $input.hide()
    $submit.hide()
    $confirm_text.show()
    $input.val('')
})

$form_box.append($modal_title, $close, $input, $submit, $confirm_text)
$modal.append($form_box)
$modal.appendTo(document.body)
$modal.hide()

$("#feedback").click(function() {
    $modal.show()
});

