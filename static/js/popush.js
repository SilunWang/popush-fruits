/**********************************************************************/


/////////////////////// document ready ///////////////////////////

$(document).ready(function() {

	//init models
	modelInit();

	//init filelist,userlist,memberlist
	listInit();

	//init controls
	controlInit();
	
	//init debug display
	debug();

	//indentify browser for voice
	browser();

	//replace 
	replaceLanguage();	

	//show body
	$('body').show();

	//set timeout
    setTimeout('global_v.loadfailed()', 10000);

	//resize
	mainResize();
});
