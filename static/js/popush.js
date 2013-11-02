/**********************************************************************/


/////////////////////// initialize ///////////////////////////

$(document).ready(function() {

	modelInit();

	listInit();

	controlInit();

    	setTimeout('global_v.loadfailed()', 10000);
	
	debug();

	browser();	

	$('body').show();

	mainResize();

	replaceLanguage();
});
