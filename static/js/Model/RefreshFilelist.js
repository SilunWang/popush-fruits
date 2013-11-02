
var RefreshFilelist = can.Construct({},{

	init:function(data){
		this.m_global_v = data.m_global_v;
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
		this.m_global_v.dochandler = this.refreshlistdone;
		this.m_global_v.doccallback = callback;
		this.m_global_v.socket.emit('doc', {
			path: this.m_global_v.currentDirString
		});
		this.m_global_v.filelisterror = error;
	},
	refreshlistdone: function(data) {
		this.filelist.removeloading();
		if (data.err) {
			this.filelisterror();
			this.showmessagebox('error', 'failed', 1);
		} else {
			$('#current-dir').html(this.getdirlink());
			if (this.dirMode == 'owned')
				this.filelist.setmode(this.filelist.getmode() | 2);
			else
				this.filelist.setmode(0);
			if (this.currentDir.length == 1) {
				if (this.dirMode == 'owned')
					this.filelist.setmode(this.filelist.getmode() | 1);
				this.filelist.formdocs(data.doc, this.docshowfilter);
				this.memberlist.clear();
				this.memberlist.add(this.currentUser);
			} else {
				this.filelist.setmode(this.filelist.getmode() & ~1);
				this.filelist.formdocs(data.doc.docs, this.docshowfilter, data.doc.members.length > 0, data.doc);
				this.memberlist.fromdoc(data.doc);
				this.memberlistdoc.fromdoc(data.doc);
			}
			if (this.doccallback)
				this.doccallback();
		}
		this.operationLock = false;
	},
	doc_on: function() {
		var self = this.m_global_v;
		this.m_global_v.socket.on('doc', function(data) {
			self.dochandler(data);
		});
	}
});
