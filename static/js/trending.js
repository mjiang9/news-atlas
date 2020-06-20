// SIDE TRENDING -- NOT IN USE
// var states = {'01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 
// 'Michigan', '27': 'Minnesota', '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', 
// '48': 'Texas', '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming', '72': 'Puerto Rico'}

// var $list = $('<div>').attr('id', 'trending')
// var $title = $('<div>').html('<h3>States Trending</h3>')
// var $list_items = $('<ul>').attr('id', 'list_items')
// $("#container").prepend($list)
// $list.append($title, $list_items)

// for (let id in states) {
//     fetch('/trending/' + states[id])
//     .then(function (response) {
//         return response.json();
//     }).then(function (text) {
//         console.log(text)
//         var $li = $('<li>').html('<h5><b>' + states[id] + ': </b>' + text['keywords'][0] + '</h5>')
//         $list_items.append($li)
//     }); 
// }

// BOTTOM TRENDING
var $bottom_trending = $('<div>').attr('id', 'bottom-trending')
$('#help').before($bottom_trending)

// var trending_states = ["California", "New York", "Texas"] // TODO: search popular states instead

// for (let state of trending_states) {
//     fetch('/trending/' + state)
//     .then(function (response) {
//         return response.json();
//     }).then(function (text) {
//         $box = $('<div>').addClass('bottom-trending-box').html(
//             '<h5><b>' + state + ': </b><i>' + text['keywords'][0] + ', ' + text['keywords'][1] + ', ' + text['keywords'][2] + '</i></h5>' 
//             + '<h6>' + text['articles'][0]['title'] + '<br/><br/>' + text['articles'][1]['title'] + '</h6>'
//         )
//         $bottom_trending.append($box)
//     }); 
// }