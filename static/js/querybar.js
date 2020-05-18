function submitQuery() {
	querytext = $('#querytext').val();
	console.log("submitted query " + querytext);
	var $btn = $("<button>").attr({
            "type": "button",
            "class": "float-left btn btn-primary tag",
            "data-toggle": "button",
            "aria-pressed": "false",
            "autocomplete": "off",
        }).text(querytext);
    $("#querybox").after($btn);
    $('#querytext').val("");
} 