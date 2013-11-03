function modelInit(){
	//global data
	global_v = new GlobalVariables({
		////////////////////////// vars ///////////////////////////////
		////////////////////////Socket//////////////////////
		g_socket: socket,

		///////////////////////language related///////////////////
		g_strings: strings,
		g_strings_en: strings_en,
		g_strings_cn: strings_cn,
		///////////////////////theme related//////// //////////////
		g_myTheme: myTheme,
		model_currentDir:[],
		model_filelist:[],
		model_mode:''
	});

	fileModel = new RefreshFilelist({
		m_global_v: global_v
	});

	//创建Model和Controller
	room_Model = new RoomModel({});
	room_Construct = new RoomConstruct({
		roomModel: room_Model,
		globalModel: global_v
	});
} 


function listInit(){
	//filelist init
	global_v.filelist = fileList('#file-list-table');
	global_v.filelist.clear();

	//userlist init
	global_v.userlist = userList('#share-user-list');
	global_v.userlist.clear();

	//memberlist init	
	global_v.memberlist = userListAvatar('#member-list');
	global_v.memberlistdoc = userListAvatar('#member-list-doc');

}

function controlInit(){
	var footer_control = new FooterController('#footer', {
		m_global_v: global_v
	});
	var file_list_control = new FileListController('#file-list-table', {
		m_global_v: global_v,
		m_room_Construct: room_Construct,
		m_fileModel: fileModel
	});
	var new_file_control = new NewFileController('#newfile', {
		m_global_v: global_v,
		m_fileModel: fileModel
	});
	var file_tabs_control = new FileTabsContorl('#file-tabs', {
		m_global_v: global_v,
		m_fileModel: fileModel
	});
	var change_pass_control = new ChangePassControl('#changepassword', {
		m_global_v: global_v
	});
	var change_avatar_control = new ChangeAvatarControl('#changeavatar', {
		m_global_v: global_v
	});
	var nav_head_control = new NavHeadControl('#nav-head', {
		m_global_v: global_v
	});
	var share_control = new ShareController('#share', {
		m_global_v: global_v,
		m_fileModel: fileModel
	});
	var delete_controller = new DeleteControl('#delete', {
		m_global_v: global_v,
		m_fileModel: fileModel
	});
	var rename_controller = new ReNameControl('#rename', {
		m_global_v: global_v
	});
	var register_control = new RegisterController('#register', {
		m_global_v: global_v,
		m_fileModel: fileModel
	});
	var login_control = new LoginControl('#login-box', {
		m_global_v: global_v,
		m_fileModel: fileModel
	});
	var load_control = new DownloadControl('', {
		m_global_v: global_v,
		m_fileModel: fileModel
	});
	var currentdir_controller = new CurrentdirController('#current-dir', {
		m_global_v:global_v
	});
}

function debug(){
	if (!ENABLE_RUN) {
		$('#editor-run').remove();
		if (!ENABLE_DEBUG) {
			$('#editor-console').remove();
		}
	}

	if (!ENABLE_DEBUG) {
		$('#editor-debug').remove();
	}
}

function browser(){
	if((!Browser.chrome || parseInt(Browser.chrome) < 18) &&
		(!Browser.opera || parseInt(Browser.opera) < 12)) {
		novoice = true;
		$('#voice-on').addClass('disabled');
		$('#voice-on').removeAttr('title');
		$('#voice-on').popover({
			html: true,
			content: strings['novoice'],
			placement: 'left',
			trigger: 'hover',
			container: 'body'
		});
	}
}

function mainResize(){
	room_Construct.resize();
	$(window).resize(function() {room_Construct.resize();});
	$(window).scroll(function() {
		$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');
	});
}

function replaceLanguage(){
	$('[localization]').html(function(index, old) {
		if (strings[old])
			return strings[old];
		return old;
	});
	$('[title]').attr('title', function(index, old) {
		if (strings[old])
			return strings[old];
		return old;
	});
}
