can.EJS.Helpers.prototype.htmlescape = function(text) {
	return text.
	replace(/&/gm, '&amp;').
	replace(/</gm, '&lt;').
	replace(/>/gm, '&gt;').
	replace(/ /gm, '&nbsp;').
	replace(/\n/gm, '<br />');
};

can.EJS.Helpers.prototype.getpic = function(type, shared, ext) {
	var s = 'images/ext/';
	if(type == 'dir') {
		s += 'dict';
	} else {
		if(exttoicon[ext])
			s += exttoicon[ext];
		else
			s += 'file';
	}
	s += '.png';
	return s;
};

can.EJS.Helpers.prototype.renderclass = function(mode) {
	var m_class = "dropdown-toggle";
	m_class += mode?'':' disabled';
	m_class += " opreation";
	return m_class;
};