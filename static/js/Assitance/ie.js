//给IE等不支持getElementsByClassName的浏览器添加该功能
function getElementsByClassName(classname) {
	var d=document;
	var e=d.getElementsByTagName('*');
	var c=new RegExp('\\b'+classname+'\\b');
	var r=[];

	for(var i=0,l=e.length;i<l;i++){
		var cn=e[i].className;
		if(c.test(cn)){
			r.push(e[i]);
		}
	}
	return r;
}
//检测浏览器是否支持getElementsByClassName方法，如果不支持，绑定上面的方法
if(typeof document.getElementsByClassName !='function') {
	document.getElementsByClassName = getElementsByClassName;
}
