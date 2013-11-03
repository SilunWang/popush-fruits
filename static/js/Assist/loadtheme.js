function loadjscssfile(filename, filetype){
	if (filetype=="js"){
		var fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", filename);
	}
	else if (filetype=="css"){
		var fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", filename);
	}
	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
}


function removejscssfile(filename, filetype){
	var targetelement;
	var targetattr;
	switch(filetype){
		case 'js':
			targetelement = 'script';
			targetattr = 'src';
			break;
		case 'css':
			targetelement = 'link';
			targetattr = 'href';
			break;
		default:
			break;
	}
	var allsuspects=document.getElementsByTagName(targetelement);
	for (var i=allsuspects.length; i>=0; i--){
		if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1)
		   allsuspects[i].parentNode.removeChild(allsuspects[i]);
	}
}
