/**
 * 检测编码模块
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
			nodeFs = $P.nodeFs,
			MissionsClass = $P.MissionsClass,
			hookChecksMissions = $P.hookChecksMissions;
		
	// 获取配置
	var validateConfigs = config.validateConfigs[modName];

	// 准备出错容器
	var resultObj = temp.hookValidatorsResult[modName] = {};

	// 引入第三方检测库
	jschardet = require("jschardet"); // https://github.com/aadsm/jschardet
	
	var checkCharsetMissions = ( new MissionsClass() ).init({
		commitType : "paiallel",
		completeCallBack : function(){
			debugAlert("================================\nCHECK " + modName + " END\n================================");
			consoleReportBuild();
			hookChecksMissions.complete();
		}
	});

	for(var key in validateConfigs){
		// 获取配置
		var validateConfig = validateConfigs[key];
		// 准备错误容器结构
		resultObj[key] = {};
		resultObj[key].ruleName = validateConfig.ruleName;
		resultObj[key].warnning = validateConfig.warnning;
		resultObj[key].warnningItems = [];

		// 使用temp.commitItems组合出完整的filter
		validateConfig.filter = extend(true, validateConfig.filter, { items : temp.commitItems } );
		
		// 开始过滤
		var filtedItems = svnItemsFilter(validateConfig.filter),
				validateRuleMask = '|' + validateConfig.validateRule.join('|') + '|';
		
		for(var filtedItem in filtedItems){
			
				var commitItem = temp.commitItems[filtedItem];
				if(commitItem.tempedFile){
					checkCharsetMissions.join(function(args){
						
						nodeFs.readFile(args.tempedFile, function (err, data) {
						  if (err) throw err;
						  jschardetRes = jschardet.detect(data);
						  if( validateRuleMask.indexOf(jschardetRes.encoding) == -1){
						  	resultObj[key].warnningItems.push({ file : args.file , encode : jschardetRes.encoding, confidence : jschardetRes.confidence });
						  	temp.finalPassFlag = false;
							}
						  checkCharsetMissions.complete();
						});
						
					},{file : filtedItem ,tempedFile : commitItem.tempedFile});
				}
		}
	}

	// 如果有错误 且远端服务器无法连接 拼接字符串出错字段
	var consoleReportBuild = function(){
		if(temp.finalPassFlag === false){
			resultObjForConsole = temp.hookValidatorsResultForConsole[modName] = [];
			// resultObjForConsole.push( "+--[ CHECK PATH MODULE ]" );
			
			for(var ruleKey in resultObj){
				if(resultObj[ruleKey].warnningItems.length > 0){
					// resultObjForConsole.push( "+----[ " + resultObj[ruleKey].ruleName + " ]" );
					var warnningItems = resultObj[ruleKey].warnningItems;
					resultObjForConsole.push( "-----------------------------------------------------------------------\n" + resultObj[ruleKey].warnning + "\n[" );
					for(var itemKey in warnningItems){
						resultObjForConsole.push( "- " + warnningItems[itemKey].file + " [" + warnningItems[itemKey].encode +"]");
					}
					resultObjForConsole.push( "]" );
				}
			}
			
			temp.hookValidatorsResultForConsole[modName] = resultObjForConsole.join("\n");
		}
	};
	
	
	debugAlert("================================\nCHECK " + modName + " START\n================================");
	checkCharsetMissions.start();

};