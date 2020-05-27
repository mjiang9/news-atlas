function submitQuery() {
	querytext = $('#querytext').val();
	console.log("submitted query " + querytext);
	tagcount = Storage.get('tagcount') || 4;
	tagcount += 1;
	var $btn = $("<button>").attr({
            "type": "button",
            "id": "tag" + tagcount,
            "class": "float-left btn btn-primary tag",
            "data-toggle": "button",
            "aria-pressed": "false",
            "autocomplete": "off",
            "onclick": "updateTag(event); return false",
        }).text(querytext);
    $("#querybox").after($btn);
    $('#querytext').val("");
    Storage.set('tagcount', tagcount);
    console.log("tagcount: " + tagcount);
} 

function updateTag(event) {
	selected = Storage.get('selected');
	tagid = "#" + event.target.id;
	tag = event.target.innerText.toLowerCase();
	tagname = event.target.innerText;
	if (selected && selected.id == tagid) {
		$(selected.id).removeClass('selected');
		$(selected.id).removeClass('active');
		selected = null;
	} else {
		if (selected != null) {
			$(selected.id).removeClass('selected');
			$(selected.id).removeClass('active');
		}
		selected = {'id': tagid, 'tag': tag, 'tagname': tagname};
		$(tagid).addClass('selected');
	}
	Storage.set('selected', selected);
	console.log("selected", selected);
	cur_state = Storage.get('cur_state')
	if (cur_state) getStateArticles(cur_state);
}

var Storage = {
    set: function(key, value) {
        localStorage[key] = JSON.stringify(value);
    },
    get: function(key) {
        return localStorage[key] ? JSON.parse(localStorage[key]) : null;
    }
};
