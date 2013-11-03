////////////////////////////Global vars ///////////////////////////////

var socket;
var global_v;
var fileModel;

////////////////////////////Global vars end///////////////////////////////



/*******************************Initialization********************************/


////////////////////////////Socket////////////////////////////

var socket = io.connect(SOCKET_IO);

///////////////////////////Socket end////////////////////////



/////////////////////// Check Browser //////////////////////////

var Browser = {};
var ua = navigator.userAgent.toLowerCase();
var s;
(s = ua.match(/msie ([\d.]+)/)) ? Browser.ie = s[1] :
	(s = ua.match(/firefox\/([\d.]+)/)) ? Browser.firefox = s[1] :
	(s = ua.match(/chrome\/([\d.]+)/)) ? Browser.chrome = s[1] :
	(s = ua.match(/opera.([\d.]+)/)) ? Browser.opera = s[1] :
	(s = ua.match(/version\/([\d.]+).*safari/)) ? Browser.safari = s[1] : 0;

var novoice = false;

/////////////////////// Check Browser end//////////////////////////



///////////////////////////Language and Theme////////////////////////////

//get cookie of the browser
function getCookie(name) 
{ 
    var search = name + "=" 
    if(document.cookie.length > 0) 
    { 
        offset = document.cookie.indexOf(search) 
        if(offset != -1)
        { 
            offset += search.length 
            end = document.cookie.indexOf(";", offset) 
            if(end == -1) end = document.cookie.length 
            return unescape(document.cookie.substring(offset, end)) 
        } 
        else return "" 
    } 
} 

//get default language
var strings = getCookie('fruits-language-selection') == 'fruits-english-selection' ? strings_en : strings_cn;

//get default theme
var myTheme = getCookie('fruits-theme-selection');

///////////////////////////Language and Theme end////////////////////////////
