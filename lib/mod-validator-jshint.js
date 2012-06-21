/**
 * JSHINT检测模块
 */
exports.run = function(args){

	// 定义模块名 & 引入父模块资源、API
	var modName = args.modName,
			$P = module.parent.exports,
			config = $P.config,
			temp = $P.temp,
			alert = $P.alert,
			debugAlert = $P.debugAlert,
			objectCount = $P.objectCount,
			svnItemsFilter = $P.svnItemsFilter,
			extend = $P.extend,
			MissionsClass = $P.MissionsClass,
			hookChecksMissions = $P.hookChecksMissions;
		
	// 获取配置
	var validateConfigs = config.validateConfigs[modName];

	// 准备出错容器
	var resultObj = temp.hookValidatorsResult[modName] = {};

	debugAlert("================================\nCHECK " + modName + " START\n================================");

	// 引入第三方检测库
	jshint = require("../node_modules/node.f2ehint/lib/jshint.js");
	
	for(var key in validateConfigs){
		// 获取配置
		var validateConfig = validateConfigs[key];
		// 准备错误容器结构
		resultObj[key] = {};
		resultObj[key].ruleName = validateConfig.ruleName;
		resultObj[key].warnning = validateConfig.warnning;
		resultObj[key].warnningItems = {};
		
		// 使用temp.commitItems组合出完整的filter
		validateConfig.filter = extend(true, validateConfig.filter, { items : temp.commitItems } );
		
		// 开始过滤
		var filtedItems = svnItemsFilter(validateConfig.filter),
				// 准备 tempedJsFiles 容器
				tempedLintFiles = [];
		
		for(var filtedItem in filtedItems){
				var commitItem = temp.commitItems[filtedItem];
				if(commitItem.tempedFile){
					// 收集有效JS 形成数组参数
					tempedLintFiles.push(commitItem.tempedFile);
				}
		}

		resultObj[key].warnningItems = jshint.hint( tempedLintFiles, validateConfig.hintConfig /*,reporter, ignore, extraExtensionList */ );
		
		if( objectCount(resultObj[key].warnningItems) > 0 ){
			temp.finalPassFlag = false;
		}
		
	}
	

  
	// 如果有错误 且远端服务器无法连接 拼接字符串出错字段
	if(temp.finalPassFlag === false){
		resultObjForConsole = temp.hookValidatorsResultForConsole[modName] = [];
		// resultObjForConsole.push( "+--[ CHECK PATH MODULE ]" );
		for(var ruleKey in resultObj){
			if(resultObj[ruleKey].warnningItems.length > 0){
				// resultObjForConsole.push( "+----[ " + resultObj[ruleKey].ruleName + " ]" );
				var warnningItems = resultObj[ruleKey].warnningItems;
				resultObjForConsole.push( "-----------------------------------------------------------------------\n" + resultObj[ruleKey].warnning + "\n[" );
				
				var tempFileName = "";
				for(var itemKey in warnningItems){
					var warnning = warnningItems[itemKey],
							error = warnningItems[itemKey].error,
							fileName = warnning.file.replace(config.tempPath + "/" ,"")
							;
							
					if(tempFileName === "" || tempFileName !== fileName){
						resultObjForConsole.push( "- " + warnning.file.replace(config.tempPath + "/" ,"") );
						tempFileName = fileName;
					}
					
					resultObjForConsole.push( '-      [LINE-' + error.line + '] ' + error.reason );
					//resultObjForConsole.push( '      [LINE-' + error.line + '][COL-' + error.character + '] ' + error.reason );
					
				}
				
				resultObjForConsole.push( "]" );
			}
		}
		
		temp.hookValidatorsResultForConsole[modName] = resultObjForConsole.join("\n");
	}
	
	debugAlert("================================\nCHECK " + modName + " END\n================================");
	hookChecksMissions.complete();
	

};