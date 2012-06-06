/*************************************************/
/**
 * SVN HOOK LINTS
 * @author i@xunuo.com
 */
/*************************************************/
// 建立全局时间统计索引
var howLongTimeName = {};
/**
 * 时间统计
 * @method howLong
 * @param timeName {string} 时间名称
 * @return timeSpend {string} 花费时间（毫秒）
 */
var howLong = function(timeName){
	// 判断是否有该时间标记
	if( !howLongTimeName[timeName] ){
		// 标记
		howLongTimeName[timeName] = new Date().getTime();
	}else{
		// 相减返回
		debugAlert( 'Time Spend["' + timeName + '"]:' + ( new Date().getTime() - howLongTimeName[timeName] ).toString() + ' ms' );
	}
};
/**
 * 开始全局计时 - Global Run Time
 */
howLong("Global Run Time");

/**
 * 声明依赖
 */
var nodeChildProcess = this.nodeChildProcess = require('child_process'),
		nodePath = this.nodePath = require('path'),
		nodeFs = this.nodeFs = require('fs'),
		extend = this.extend = require('node.extend'),
		MissionsClass = this.MissionsClass = require('snow.node.mission').MissionsClass,
		util = this.util = require('../lib/util.js');


// function cname map
var alert = this.alert = util.alert,
		die = this.die = util.die,
		objectCount = this.objectCount = util.objectCount,
		trim = this.trim = util.trim,
		svnItemsFilter = this.svnItemsFilter = util.svnItemsFilter;


/** 
 * 全局默认配置
 * @property config {object}
 */
var config = this.config = {
	/**
	 * 总控开关 (on/off)
	 * @property config.switch {string}
	 */
	switch : "on",
	/** 
	 * 版本库地址
	 * @property config.repos {string}
	 */
	repos : process.argv[2],
	/** 
	 * 当前提交唯一标识戳 中间状态版本号
	 * @property config.txn {string}
	 */
	txn : process.argv[3],
	/** 
	 * debug 模式 （额外信息输出）
	 * @property config.debug {boolean}
	 */
	debug : false,
	/** 
	 * 作用域
	 * @property config.scope {array}
	 */
	scope : ["^htdocs/*"],
	/** 
	 * SVN提交内容缓存路径 检测作用域
	 * @property config.tempPath {string}
	 */
	tempPath : './svn-hook-lints-temp/' + process.argv[3],
	/**
	 * svnlook命令全路径
	 * @property config.cmdSvnlook {string}
	 */
	cmdSvnlook : 'LANG=en_US.UTF-8 /usr/local/bin/svnlook',
	/**
	 * 是否需要传输数据到远程API
	 * @property config.remoteConnect {boolean}
	 */
	remoteConnect : false,
	/**
	 * 远程API设置 ( 用于发送提交信息至此API )
	 * @property config.remoteApiSettings {object}
	 */
	remoteApiSettings : {
    host: 'reporter.aliui.com',
    port: '99',
    path: '/api.js',
    method: 'POST'
  },
	/**
	 * 是否自动删除缓存文件
	 * @property config.autoDelTemp {boolean}
	 */
	autoDelTemp : false,
	/**
	 * 各种检测模块配置  （KEY值和检测模块同名）
	 * @property config.lintsConfig {object}
	 */
	validateConfigs : {
		// 检测提交路径模块配置
		// 'mod-validator-path':{},
		// 检测提交编码模块配置
		// 'mod-validator-charset' : {},
		// 检测JS语法模块配置
		// 'mod-validator-jshint' : {},
		// 严禁删除文件列表配置
		// 'mod-forbid-delete' :{},
		// 提交代码负责人或以往提交者配置
		// 'mod-notify' :{}
	}
		
},
/** 
 * 缓存对象
 * @property temp {object}
 */
temp = this.temp = {
	/** 
	 * 全局最终是否能够提交通过标志位
	 * @property temp.finalPassFlag {boolean}
	 */
	finalPassFlag : true,
	/** 
	 * 获取提交人 - 字符串
	 * @property temp.commitAuthor {string}
	 */
	commitAuthor : "",
	/** 
	 * 获取提交日志 - 字符串
	 * @property temp.commitLog {string}
	 */
	commitLog : "",
	/** 
	 * 获取提交列表信息 - 字符串
	 * @property temp.commitFilesResult {string}
	 */
	commitFilesResult : "",
	/** 
	 * 提交列表集合 - 哈希映射对象  key:文件名 value:提交状态
	 * @property temp.commitItems {object}
	 */
	commitItems : {},
	/** 
	 * 提交列表集合 - 有序索引
	 * @property temp.commitItems {array}
	 */
	commitItemsIndex : [],
	/** 
	 * Validators 检测结果
	 * @property temp.hookValidatorsResult {object}
	 */
	hookValidatorsResult : {},
	/** 
	 * Validators 检测结果 （命令行）
	 * @property temp.hookValidatorsResultForConsole {object}
	 */
	hookValidatorsResultForConsole : {}
};

// -----------------------------------------------------------------------------------
// 初始化区 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
// -----------------------------------------------------------------------------------
/**
 * Debug 信息输出
 * @method debugAlert
 * @param msg {string} 输出消息字符串
 * @param [exit] {boolean} 是否退出
 */
var debugAlert = this.debugAlert = function(msg,exit){
	if(config.debug){
		alert(msg,exit);
	}
};

/**
 * 获取提交人信息
 * @method getCommitAuthor
 */
var getCommitAuthor = function(){
	debugAlert("================================\nGET COMMIT AUTHOR START\n================================");
	var cmd = config.cmdSvnlook + ' author -t "' + config.txn + '" "' + config.repos + '"';
	var run = nodeChildProcess.exec(cmd);
	
	// 创建监听
	run.stdout.on('data', function (data){
	    temp.commitAuthor = trim(data);
	    debugAlert('commit author : ' + temp.commitAuthor);
			// 汇报完成
			debugAlert("================================\nGET COMMIT AUTHOR COMPLETE\n================================");
	    hookInitMissions.complete();
	});
	// 错误
	run.stderr.on('data', function (err) {
		die('function getCommitAuthor Error: ' + err);
	});
};

/**
 * 获取提交日志
 * @method getCommitLog
 */
var getCommitLog = function(){
	debugAlert("================================\nGET COMMIT LOG START\n================================");
	var cmd = config.cmdSvnlook + ' log -t "' + config.txn + '" "' + config.repos + '"';
	var run = nodeChildProcess.exec(cmd);
	
	// 创建监听
	run.stdout.on('data', function (data){
	    temp.commitLog = trim(data);
	    debugAlert('commit log : ' + temp.commitLog);
			// 汇报完成
			debugAlert("================================\nGET COMMIT LOG COMPLETE\n================================");
	    hookInitMissions.complete();
	});
	// 错误
	run.stderr.on('data', function (err) {
		die('function getCommitLog Error: ' + err);
	});
};

/**
 * 获取文件提交
 * @method getCommitItems
 */
var getCommitItems = function(){
	
	debugAlert("================================\nGET COMMIT ITEMS START\n================================");
	
	// 创建 svnlook changed 命令
	var cmd = config.cmdSvnlook + ' changed -t "' + config.txn + '" "' + config.repos + '"';
	var run = nodeChildProcess.exec(cmd);
	
	// 创建监听
	run.stdout.on('data', function (data){
	    temp.commitFilesResult = data;

			// 换行为条件匹配出条目
			var commitItemRegx = new RegExp(".*?\n","igm"),
					commitItemMatches = temp.commitFilesResult.match(commitItemRegx),
					itemRegx = new RegExp("(.*?)\\s+(.*)\\s*");
			
			// 开始分离提交路径和提交状态并堆栈
			for( var val in commitItemMatches ){
				var commitItem = commitItemMatches[val],
						itemMatches = commitItem.match(itemRegx),
						itemType = itemMatches[1],
						itemPath = itemMatches[2];
						
				// 提交路径作为唯一索引
				temp.commitItemsIndex.push( itemPath );
				// 路径和状态哈希
				temp.commitItems[ itemPath ] = { "path" : itemPath , "commitType" : itemType };
				debugAlert('[' + itemType + '] ' + itemPath);
			}
			
			commitItemRegx = null, itemRegx = null;
	});
	
	// 完成回调
	run.on('exit', function (code) {
		if(code === 0){
			// 汇报完成
			debugAlert("================================\nGET COMMIT ITEMS COMPLETE\n================================");
	    hookInitMissions.complete();
		}else{
			die('getCommitItems Failure.');
		}
	});
						
	// 错误
	run.stderr.on('data', function (err) {
		die('function getCommitItems Error: ' + err);
	});

};

/**
 * 判断是否直接通过钩子
 * @method checkIfCommitDirect
 */
var checkIfCommitDirect = function(){
	debugAlert("================================\nCHECK IF COMMIT DIRECT START\n================================");
	
	// 日志中包含"--force-commit"字段，跳过钩子
	if( temp.commitLog.indexOf(config.forceCommitLog) != -1 ){
		process.exit(0);
		die('Commit Log include ' + config.forceCommitLog + ', so commit direct!\n================================\nCHECK IF COMMIT DIRECT COMPLETE\n================================');
	}
	
	// 根据规则过滤提交列表 根据配置的作用域筛选一次 留下需要检测的列表 一般用来选择库下面第一层文件夹
	var filtedItems = svnItemsFilter({
		items : temp.commitItems,
		inRegx : config.scope
	});
	temp.commitItems = filtedItems;
	
	// 如果提交文件都不在作用域 直接通过
	if(objectCount(filtedItems) === 0){
		//die('none in config.scope '+JSON.stringify(config.scope)+', so commit direct!\n================================\nCHECK IF COMMIT DIRECT COMPLETE\n================================');
		process.exit(0);
	}
	
	// 继续下面的线程
	hookInitMissions.complete();
	/*
	// 如果有提交的文件不在以上指定目录
	if( objectCount(filtedItems) != objectCount(temp.commitItems) ){
		die('--> Some item not in [' + config.scope.join(',') + '], so commit exit!');
	}else{
		// 继续运转
		hookInitMissions.complete();
	}
	*/
	
	debugAlert("================================\nCHECK IF COMMIT DIRECT COMPLETE\n================================");
};

/**
 * 建立缓存文件
 * @method buildTempFiles
 */
var buildTempFiles = function(){

	// 只有此类提交类型需要建立缓存目录
	var tempItems = svnItemsFilter({
		items : temp.commitItems,
		itemType : "file",
		commitType : ["A","U","_U","UU","G"]
	});

	if( objectCount(tempItems) > 0 ){

		nodePath.exists(config.tempPath,function(existed){
			if(!existed){
				

				// 创建建立缓存目录任务流（创建缓存文件的前置条件）
				var buildTempDirMissions = ( new MissionsClass() ).init(
					{
						commitType : "paiallel",
						completeCallBack : function(){
							// debugAlert("================================\nALL TEMP DIRS PREPARE COMPLETE\n================================");
							// 开始执行缓存文件任务流
							debugAlert("================================\nSTART BUILD TEMP FILES\n================================");
							buildTempFileMissions.start();
						}
					}
				);

				// 创建建立缓存文件任务流
				var buildTempFileMissions = ( new MissionsClass() ).init(
					{
						commitType : "paiallel",
						completeCallBack : function(){
							debugAlert("================================\nALL TEMP FILES PREPARE COMPLETE\n================================");
							// 通知hook初始化任务可以继续推进
							hookInitMissions.complete();
						}
					}
				);


		    // 建立具体缓存内容
		    for(var itemKey in tempItems){

		    	var tempItem = tempItems[itemKey],
		    			tempDirFullPath = config.tempPath + '/' + nodePath.dirname(itemKey);
		    	
		    	// 由于svnlog可能编码错误导致转义异常，如果是UTF-8(如：中文字符转义为?\xxxx)，则不生成缓存文件。
		    	if(itemKey.indexOf("?\\") != -1){
		    		continue;
		    	}
		    	
		    	// 填充创建目录任务
		    	buildTempDirMissions.join(function(args){
						var tempDirFullPath = args.tempDirFullPath,
								cmd = 'mkdir -p ' + '"' + tempDirFullPath + '"',
								run = nodeChildProcess.exec(cmd);
						
						// 完成回调
						run.on('exit', function (code) {
							if(code === 0){
						    // alert("temp dir not found, creating : " + tempDirFullPath );
						    buildTempDirMissions.complete();
							}else{
								die('Build Temp Dir Failure : ' + tempDirFullPath);
							}
						});
						
						// 错误处理
						run.stderr.on('data', function (err) {
							die('buildTempDirMissions Error: ' + err);
						});

		    	},{tempDirFullPath:tempDirFullPath});
		    	
		    	// 填充创建缓存任务
		    	buildTempFileMissions.join(function(args){
		    		
						var tempFile = args.tempFile,
								targetTempFile = tempFile,
								cmd = config.cmdSvnlook + ' cat "'+ config.repos + '" --transaction "' + config.txn + '" "' + tempFile + '" > "' +  config.tempPath + '/' + targetTempFile + '"',
								run = nodeChildProcess.exec(cmd);
						
						debugAlert(tempFile);
						
						// 完成回调
						run.on('exit', function (code) {
							if(code === 0){
						    debugAlert("creating temp file : $tempDir/" + config.txn + "/" + tempFile );
						    
						    // 缓存中记录标记
						    temp.commitItems[tempFile].tempedFile = config.tempPath + '/' + targetTempFile;
								
								buildTempFileMissions.complete();
							}else{
								die('Build Temp File Failure.' + tempFile);
							}
						});
						
						// 错误处理
						run.stderr.on('data', function (err) {
							die('buildTempFileMissions Error: ' + err);
						});
						
		    	},{tempFile:itemKey});

		    }
				
				buildTempDirMissions.start();
	

			}
		});

	}else{
		
		hookInitMissions.complete();
		
	}
	
};

/**
 * 创建钩子初始化串行任务流 (↓：串行)
 */
var hookInitMissions = this.hookInitMissions = ( new MissionsClass() ).init({
		commitType : "serial",
		completeCallBack : function(){
			
			debugAlert("HOOK INIT COMPLETE\n++++++++++++++++++++++++++++++++");
			
			debugAlert("++++++++++++++++++++++++++++++++\n HOOK CHECKS START");
			
			// 钩子初始化任务流结束后 多模块并行检测任务流开始运行
			hookChecksMissionsStart();
		}
});

// ↓ 获取提交人信息
hookInitMissions.join(function(){
		getCommitAuthor();
});

// ↓ 获取提交日志
hookInitMissions.join(function(){
		getCommitLog();
});

// ↓ 获取提交列表信息
hookInitMissions.join(function(){
		getCommitItems();
});

// ↓ 判断是否直接通过钩子
hookInitMissions.join(function(){
	checkIfCommitDirect();
});

// ↓ 创建缓存文件
hookInitMissions.join(function(){
	buildTempFiles();
});

// -----------------------------------------------------------------------------------
// 并行检测区 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
// -----------------------------------------------------------------------------------

/**
 * 创建HOOKLINT检测并行任务流 (→：并行)
 */
var hookChecksMissions = this.hookChecksMissions = ( new MissionsClass() ).init({
		commitType : "paiallel",
		completeCallBack : function(){
			debugAlert("================================\nHook CODA START\n================================");
			hookCodaMissions.start();
		}
});


/**
 * 运行前创造流水线
 */
var hookChecksMissionsStart = function(){

	for(var modName in config.validateConfigs){
		
		if( objectCount(config.validateConfigs[modName]) === 0 ){
			continue;
		}
		
		// 形成模块路径
		var modPath = __dirname + "/" + modName + ".js";
		
		hookChecksMissions.join(function(args){

			nodePath.exists(args.modPath,function(existed){
				if(existed){
					var checkMod = require(args.modPath);
					checkMod.run( { modName : args.modName } );
				}else{
					hookChecksMissions.complete();
				}
			});

		},{modPath : modPath, modName : modName });
	
	}

	hookChecksMissions.start();

};


// -----------------------------------------------------------------------------------
// 并行检测区 ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
// -----------------------------------------------------------------------------------


// -----------------------------------------------------------------------------------
// 结尾区
// -----------------------------------------------------------------------------------

/**
 * 命令行方式输出最终信息
 * @method consoleReport
 */
var consoleReport = function(){
	for(var validateRuleKey in temp.hookValidatorsResultForConsole){
		var consoleOutput = temp.hookValidatorsResultForConsole[validateRuleKey];
		if(consoleOutput){
			alert(consoleOutput);	
		}
	}
};

/**
 * 输出最终信息
 * @method hookValidatorsResultOutput
 */
var hookValidatorsResultOutput = function(){
	debugAlert("================================\nHOOK LINTS RESULT OUTPUT START\n================================");
		
	if(config.remoteConnect === true){

		var nodeQuerystring = require('querystring'),
				nodeHttp = require('http');
	
		// 开始设置
	  var req = nodeHttp.request(config.remoteApiSettings);
	
	  // 收集需要发送的信息
	  var postAPIData = {
	  	"repos" : config.repos,
	  	"scope" : config.scope,
	  	"validateConfigs" : config.validateConfigs,
	  	"commitAuthor" : temp.commitAuthor,
	  	"commitLog" : temp.commitLog,
	  	"commitFilesResult" : temp.commitFilesResult,
	  	"commitItems" : temp.commitItems,
	  	"hookValidatorsResultForConsole" : temp.hookValidatorsResultForConsole
	  }
	  
	  // 开始写数据
	  req.write(JSON.stringify(postAPIData));
	  
	  // 监听发送结束
		req.on('response', function(res){
	
	    // 结束
	    res.on('end', function(){
	 				alert("(!) Warning! You can not commit yet, please visit :\n--------------------------------------------------------\nhttp://"+ config.remoteApiSettings.host +":" + config.remoteApiSettings.port + "/read.js?log=" + temp.commitAuthor + ".html\n--------------------------------------------------------" );
	        hookCodaMissions.complete();
	    });
	
	  });
	  
	  // 监听无法连接服务器或错误， 直接使用命令行输出方式
		req.on('error', function(error) {
			
			// consoleReport();
	
			alert("-----------------------------------------------------------------------\n# PS. Can not connect svnlint.aliui.com, please check the server.");
	
		  hookCodaMissions.complete();
		});
	
	  // 发送完毕
	  req.end();
	  
	}else{
		
		// 直接输出
		consoleReport();
		hookCodaMissions.complete();
		
	}

};

/**
 * 清理缓存文件
 * @method delTempDir
 */
var delTempDir = function(){
		debugAlert("================================\nDELETE TEMPDIR START\n================================");
		
		// 确保安全
		if(config.tempPath && config.tempPath !== "" && config.tempPath !== "/" && config.tempPath !== "/home" && config.tempPath !== "/home/"){
			
			var cmd = 'rm -rf ' + '"' + config.tempPath + '"',
					run = nodeChildProcess.exec(cmd);

			debugAlert("DEL TEMPDIR CMD : " + cmd );
			
			// 完成回调
			run.on('exit', function (code) {
				if(code === 0){
					debugAlert("================================\nDELETE TEMPDIR COMPLETE\n================================");
			    hookCodaMissions.complete();
				}else{
					die('Del Temp Dir Failure : ' + tempDirFullPath);
				}
			});
			
			// 错误处理
			run.stderr.on('data', function (err) {
				die('delTempDir Error: ' + err);
			});
			
		}
		
};

/**
 * 创建钩子尾声任务流 (→：串行)
 */
var hookCodaMissions = this.hookCodaMissions = ( new MissionsClass() ).init({
		commitType : "serial",
		completeCallBack : function(){
			debugAlert("================================\nHook CODA COMPLETE\n================================");
			// 最终判断是否能通过钩子
			if( temp.finalPassFlag === false ){
				die();
			}
		}
});

// ↓ 最终收集结果
hookCodaMissions.join(function(){
	hookValidatorsResultOutput();
});


// ↓ 清理缓存目录
hookCodaMissions.join(function(){
	if(config.autoDelTemp === true){
		delTempDir();
	}else{
		hookCodaMissions.complete();
	}
});

// -----------------------------------------------------------------------------------
// 对外接口
// -----------------------------------------------------------------------------------

/**
 * 模块启动方法
 * @method start
 */
var start = function(customConfig){
	// 合并外来配置
	extend( true, config, customConfig );
	
	// 判断开关
	if(config.switch !== "on"){
		process.exit(0);
	}
	
	// 正式启动钩子初始化任务流
	debugAlert("++++++++++++++++++++++++++++++++\nHOOK INIT START");
	hookInitMissions.start();
};

/**
 * 对外暴露启动方法
 */
exports.start = start;

// -----------------------------------------------------------------------------------
// 统计
// -----------------------------------------------------------------------------------

// 结束运行事件
process.on('exit', function () {
  // 抛出全局运行时间 - Global Run Time
  howLong("Global Run Time");
});
	