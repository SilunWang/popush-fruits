//////////////////////// Controller //////////////////////////////

/************************************************************************
|    函数功能： 包含代码编辑界面的几个controller                                           
|    toolbar chatbox varlist
************************************************************************/
var ToolbarController = can.Control.extend({

        globalModel: '',
        roomModel: '',
        roomObj: '',
        msgObj: '',
        runObj: '',
        editorObj: '',

        init: function(element, options) {
                
                globalModel = this.options.globalModel;
                roomModel = this.options.roomModel;
                roomObj = this.options.roomObj;
                msgObj = this.options.msgObj;
                runObj = this.options.runObj;
                editorObj = this.options.editorObj;
                this.element.append(can.view("../ejs/toolbar.ejs", {}));
        },

        '#togglechat click': function() {
                roomObj.togglechat(this);
        },

        '#editor-debug click': function() {
                if (!roomModel.debugenabled())
                        return;
                if (globalModel.operationLock)
                        return;
                globalModel.operationLock = true;
                if (roomModel.vars.debugLock) {
                        globalModel.socket.emit('kill');
                } else {
                        globalModel.socket.emit('debug', {
                                version: roomModel.vars.doc.version,
                                type: roomModel.vars.ext
                        });
                }
        },

        '#editor-console click': function() {
                roomObj.toggleconsole();
        },

        '#editor-back click': function() {
                $('#editor').hide();
                $('#filecontrol').show();
                $('#footer').show();
                roomObj.closeeditor();
        },

        '#editor-run click': function() {
                runObj.run();
        },

        '#setFullScreen click': function() {
                editorObj.setFullScreen(roomModel.vars.editor, true);
        }

});

var ChatboxController = can.Control.extend({

        globalModel: '',
        roomModel: '',
        roomObj: '',
        runObj: '',
        msgObj: '',

        init: function(element, options) {
                globalModel = this.options.globalModel;
                roomModel = this.options.roomModel;
                roomObj = this.options.roomObj;
                runObj = this.options.runObj;
                msgObj = this.options.msgObj;
                this.element.append(can.view("../ejs/chatbox.ejs", {}));
        },

        '#chat click': function() {
                msgObj.chat();
        },

        '#voice-on click': function() {
                msgObj.voice();
        },

        '#chat-input keydown': function(){
                if(event.keyCode == 13)
                        msgObj.chat();
        }

});

var ConsoleController = can.Control.extend({

        globalModel: '',
        roomModel: '',
        roomObj: '',
        runObj: '',

        init: function(element, options){
                globalModel = this.options.globalModel;
                roomModel = this.options.roomModel;
                roomObj = this.options.roomObj;
                runObj = this.options.runObj;
                this.element.append(can.view("../ejs/console.ejs", {}));
        },
        
        '#console-input keydown': function() {
                if (event.keyCode == 13)
                        runObj.stdin();
        }

});

var VarlistController = can.Control.extend({

        globalModel: '',
        roomModel: '',
        roomObj: '',
        runObj: '',
        msgObj: '',

        init: function(element, options) {

                globalModel = this.options.globalModel;
                roomModel = this.options.roomModel;
                roomObj = this.options.roomObj;
                runObj = this.options.runObj;
                msgObj = this.options.msgObj;

                this.element.append(can.view("../ejs/varlist.ejs", {}));
                //expressionlist init
                globalModel.expressionlist = expressionList('#varlist-table');
                
                //初始化expressionList
                expressionlist = globalModel.expressionlist;
                var localRunDebugC = runObj;

                expressionlist.renameExpression = function(id) {
                        localRunDebugC.expressionlist_renameExpression(id);
                };
                
                expressionlist.renameExpressionDone = function(id) {
                        localRunDebugC.expressionlist_renameExpressionDone(id);
                };

                expressionlist.removeExpression = function(id) {
                        localRunDebugC.expressionlist_removeExpression(id);
                };

        },

        '#debugstep click': function() {
                if (roomModel.vars.debugLock && roomModel.vars.waiting) {
                        globalModel.socket.emit('step', {});
                }
        },

        '#debugnext click': function() {
                if (roomModel.vars.debugLock && roomModel.vars.waiting) {
                        globalModel.socket.emit('next', {});
                }
        },

        '#debugfinish click': function() {
                if (roomModel.vars.debugLock && roomModel.vars.waiting) {
                        globalModel.socket.emit('finish', {});
                }
        },

        '#debugcontinue click': function() {
                if (roomModel.vars.debugLock && roomModel.vars.waiting) {
                        globalModel.socket.emit('resume', {});
                }
        }

});
