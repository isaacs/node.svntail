/**
 * 声明依赖
 */
var extend = require('node.extend'),
		nodePath = require('path');

/**
 * 工具函数 - 输出可让提交结果页面显示的信息
 * @method alert
 * @param msg {string} 输出消息字符串
 * @param [exit] {boolean} 是否退出
 */
var alert = exports.alert = function(msg,exit){
	process.stderr.write(msg.toString() + '\n');
	if(exit){
		process.exit(1);
	}
};


/**
 * 工具函数 - 结束并抛出信息
 * @method die
 * @param [msg] {string} 输出消息字符串
 */
exports.die = function(msg){
	if(msg){
		alert(msg);
	}
	process.exit(1);
};

/**
 * 工具函数 - 统计对象中元素个数
 * @method objectCount
 * @param obj {object} 统计的对象
 */
exports.objectCount = function(obj){
	var count = 0;
	for(var key in obj){
		count ++;
	}
	return count;
};

/**
 * 工具函数 - 对象转一维数组
 * @method objectToArray
 * @param obj {object} 转换的对象
 */
exports.objectToArray = function(obj){
	var objectArray = [];
	for(var key in obj){
			objectArray.push(obj[key]);
	}
	return objectArray;
};


/**
 * 工具函数 - 删除文本左右两端的空格
 * @method trim
 * @param str {string} 处理文本
 */
exports.trim = function(str){
	return str.replace(/(^\s*)|(\s*$)/g, "");
};

/**
 * 工具函数 - SVN列表过滤器
 * @method svnItemsFilter
 * @param opt {object} 参数选项
 * @param opt.items {object}  来源数据 格式示例 {"/path-1/test.js" : { "path" : "/path-1/test.js", "type" : "U"  } }
 * @param opt.itemType {string} "all" : 返回文件及目录(默认) | "dir" : 单纯返回目录 | "file" : 单纯返回文件
 * @param opt.commitType {array} 提交状态掩码限定
 * 'A'  条目添加到版本库
 * 'D'  条目从版本库删除
 * 'U'  文件内容改变了
 * '_U' 条目的属性改变了；注意开头的下划线
 * 'UU' 文件内容和属性修改了
 * 'G'  合并操作
 * @param opt.extName {array} 扩展名限定
 * @param opt.inRegx {array}  过滤所指正则表达路径
 * @param opt.popRegx {array} 剔除所指正则表达路径
 */
exports.svnItemsFilter = function(opt){
	
	// 默认配置
	var defaultOption = {
		items : {},
		itemType : "all",
		commitType : [],
		extName : [],
		inRegx : [],
		popRegx : []
	};
	
	// merge
	var opt = extend( true, defaultOption, opt );

	// 克隆列表
	var filterItems = {};
	extend( true, filterItems, opt.items );
	
	// 仅是目录 或 仅是文件过滤
	if(opt.itemType == "dir" || opt.itemType == "file"){

		// 判断是否是目录正则
		var dirRegx = new RegExp("^.+\/$");
		
		// 遍历
		for( var key in filterItems){
			// 如果是筛选目录 删除不符合目录正则项
			if( opt.itemType == "dir" && !dirRegx.test(key) ){
				delete filterItems[key];
			}
			
			// 如果是筛选文件 删除符合目录正则项
			if( opt.itemType == "file" && dirRegx.test(key) ){
				delete filterItems[key];
			}
		}
		
		dirRegx = null;
		
	}
	
	// 提交类型掩码过滤
	if(opt.commitType.length > 0){
		var commitTypeMaskStr = "|" + opt.commitType.join("|") + "|";
		for( var key in filterItems){
			if( commitTypeMaskStr.indexOf( "|" + filterItems[key].commitType + "|" ) === -1 ){
				delete filterItems[key];
			}
		}
	}
	
	// 扩展名过滤
	if(opt.extName.length > 0){
		var commitExtNameMaskStr = "|" + opt.extName.join("|") + "|";
		for(var key in filterItems){
			var extName = nodePath.extname( key );
			
			// 如果是目录跳出这次循环
			if(extName === ""){ continue; }
			
			if( commitExtNameMaskStr.indexOf( "|" + nodePath.extname( key ) + "|" ) === -1 ){
				delete filterItems[key];
			}
		}
	}
	
	// 所处路径过滤
	if(opt.inRegx.length > 0 || opt.popRegx.length > 0){
		for(var key in filterItems){
			var keepItem = false;
			
			// 处于路径
			if(opt.inRegx.length > 0){
	      for(var inRegxItem in opt.inRegx){
	        regx = new RegExp(opt.inRegx[inRegxItem]);
	        if( regx.test(key) ){
	          keepItem = true;
	        }
	      }
      }else{
      	keepItem = true;
      }
      
      // 剔除路径
      for(var popRegxItem in opt.popRegx){
        regx = new RegExp(opt.popRegx[popRegxItem]);
        if( regx.test(key) ){
          keepItem = false;
        }
      }
      
      if(filterItems[key] && !keepItem){
        delete filterItems[key];
      }
		}
	}
	
	
	return filterItems;
	
};