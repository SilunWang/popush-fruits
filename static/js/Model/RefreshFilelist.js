
var RefreshFilelist = can.Construct({},{

	init:function(data){
		this.m_global_v = data.m_global_v;
		this.dochandler = '';
		this.doccallback = '';
		this.doc_on();
		this.m_global_v.backhome = this;
	},

	backto: function(n) {
		if (this.m_global_v.operationLock)
			return;
		this.m_global_v.operationLock = true;
		var temp = [];
		for (var i = 0; i < n; i++) {
			temp.push(this.m_global_v.currentDir.pop());
		}
		this.m_global_v.currentDirString = this.m_global_v.getdirstring();
		this.refreshfilelist(function() {
			for (var i = 0; i < n; i++) {
				this.m_global_v.currentDir.push(temp.pop());
			}
			this.m_global_v.currentDirString = this.m_global_v.getdirstring();
		});
	},
	refreshfilelist: function(error, callback) {
		this.m_global_v.operationLock = true;
		this.m_global_v.filelist.loading();
		this.dochandler = this.refreshlistdone;
		this.doccallback = callback;
		this.m_global_v.socket.emit('doc', {
			path: this.m_global_v.currentDirString
		});
		this.m_global_v.filelisterror = error;
	},
	refreshlistdone: function(data) {
		this.m_global_v.filelist.removeloading();
		if (data.err) {
			this.m_global_v.filelisterror();
			this.m_global_v.showmessagebox('error', 'failed', 1);
		} else {
			$('#current-dir').html(this.m_global_v.getdirlink());
			if (this.m_global_v.dirMode == 'owned')
				this.m_global_v.filelist.setmode(this.m_global_v.filelist.getmode() | 2);
			else
				this.m_global_v.filelist.setmode(0);
			if (this.m_global_v.currentDir.length == 1) {
				if (this.m_global_v.dirMode == 'owned')
					this.m_global_v.filelist.setmode(this.m_global_v.filelist.getmode() | 1);
				this.m_global_v.filelist.formdocs(data.doc, this.m_global_v.docshowfilter);
				this.m_global_v.memberlist.clear();
				this.m_global_v.memberlist.add(this.m_global_v.currentUser);
			} else {
				this.m_global_v.filelist.setmode(this.m_global_v.filelist.getmode() & ~1);
				this.m_global_v.filelist.formdocs(data.doc.docs, this.m_global_v.docshowfilter, data.doc.members.length > 0, data.doc);
				this.m_global_v.memberlist.fromdoc(data.doc);
				this.m_global_v.memberlistdoc.fromdoc(data.doc);
			}
			if (this.doccallback)
				this.doccallback();
		}
		this.m_global_v.operationLock = false;
	},
	doc_on: function() {
		var self = this;
		this.m_global_v.socket.on('doc', function(data) {
			self.dochandler(data);
		});
	}
});
