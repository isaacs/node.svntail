演示截图
===================
![SVN尾巴](http://xunuo.com/node.svntail.snap1.png)

***************

安装手册
====================

依赖
--------------------
nodejs 0.6.1x  
[NodeJS官方网站](http://nodejs.org/) | [安装参考文章](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)

定位hooks目录
--------------------
一般hooks目录位于svn库根目录下，一般同级的目录还有dav、db、locks

通过NPM安装node.svntail
--------------------
~~~javascript
// 在hooks目录下运行
npm install node.svntail
~~~

[NPM包详情](http://search.npmjs.org/#/node.svntail)


修改pre-commit文件(以下是示例)
--------------------


注意！在一切开始前，首先要给pre-commit赋可执行权限，安装完成后建议运行 dos2unix pre-commit 转义其中的非ASCII字符.


~~~javascript
#!/usr/bin/node

/**
 * 配置集合
*/
var config = {
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
	 * 作用域
	 * @property config.scope {array}
	 */
	scope : ['^intl-style/*'],
	/** 
	 * debug 模式 （额外信息输出）
	 * @property config.debug {boolean}
	 */
	debug : false,
	/** 
	 * SVN提交内容缓存路径 检测作用域
	 * @property config.tempPath {string}
	 */
	tempPath : __dirname + '/temp-svntail-pre-commit/' + process.argv[3],
	/**
	 * svnlook命令全路径
	 * 通过whereis svnlook可获取，通常是 /usr/bin/svnlook 或 /usr/local/bin/svnlook
	 * @property config.cmdSvnlook {string}
	 */
	cmdSvnlook : 'LANG=zh_CN.utf8 /usr/local/bin/svnlook',
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
	 * 强制提交注释标识
	 * @property config.forceCommitLog {string}
	 */
	forceCommitLog : '--force-commit',
	/**
	 * 是否自动删除缓存文件
	 * @property config.autoDelTemp {boolean}
	 */
	autoDelTemp : true,
	/**
	 * 各种检测模块配置  （和检测模块同名）
	 * @property config.lintsConfig {object}
	 */
	validateConfigs : {
		
		// 提交路径检测规则
		'mod-validator-path' : {
			// 新增目录规则
			'TheNewDirNameRules' : {
				ruleName : 'The New Dir Name Validate Rules',
				//warnning : '新增目录规则为 : 英文小写字母、数字、中划线连接(开头允许一个下划线)'
				warnning : '(!) Found Some Dir(s) Name Errors, Rule: lowcase letters, number & line-through[or begining_underline].',
				filter : {
					itemType : 'dir',
					commitType : ['A']
				},
				validateRule : '^_?[a-z0-9-]*/$'
			},
			// 新增文件规则
			'TheNewFileNameRules' : {
				ruleName : 'The New File Name Validate Rules',
				//warnning : '新增文件规则为 : 英文小写字母、数字、中划线连接。'
				warnning : '(!) Found Some File(s) Name Errors, Rule: lowcase letters, number & line-through.',
				filter : {
					itemType : 'file',
					commitType : ['A']
				},
				validateRule : '^[a-z0-9-./]*$'
			},
			// JS目录文件规则
			'JsDirRules' : {
				ruleName : 'The Js Dir Validate Rules',
				warnning : '(!) New js file rule is : extname must be [js|md|js.seed|xml|html|spec.js].',
				filter : {
					itemType : 'file',
					commitType : ['A'],
					inRegx : ['^intl-style/trunk/deploy/htdocs/js/*','^intl-style/branches/.*?/deploy/htdocs/js/*'],
					// lib目录放行
					popRegx : ['^intl-style/trunk/deploy/htdocs/js/5v/lib/*','^intl-style/branches/.*?/deploy/htdocs/js/5v/lib/*']
				},
				validateRule : '^(.*?)\\.(?:js|md|js.seed|xml|html|spec.js).*$'
			},
			// CSS目录文件规则
			'CssDirRules' : {
				ruleName : 'The Css Dir Validate Rules',
				warnning : '(!) New css file rule is : extname must be [css|md|css.seed|html].',
				filter : {
					itemType : 'file',
					commitType : ['A'],
					inRegx : ['^intl-style/trunk/deploy/htdocs/css/*','^intl-style/branches/.*?/deploy/htdocs/css/*']
				},
				validateRule : '^(.*?)\\.(?:css|md|css.seed|html).*$'
			},
			// 图片目录文件规则
			'ImgDirRules' : {
				ruleName : 'The Images Dir Validate Rules',
				warnning : '(!) New image file rule is : extname must be [jpg|cur|gif|png|psd|md].',
				filter : {
					itemType : 'file',
					commitType : ['A'],
					inRegx : ['^intl-style/trunk/deploy/htdocs/simg/*','^intl-style/trunk/deploy/htdocs/wimg/*','^intl-style/branches/.*?/deploy/htdocs/simg/*','^intl-style/branches/.*?/deploy/htdocs/wimg/*']
				},
				validateRule : '^(.*?)\\.(?:jpg|cur|gif|png|psd|md).*$'
			}
		},
		// 编码检测规则
		'mod-validator-charset' : {
			// style utf-8 rule
			'TheUTF8NoBOMRules' : {
				ruleName : 'Files Charset Validate Rules',
				warnning : '(!) File(s) with wrong charset. there must be : ASCII, UTF-8(without BOM).',
				filter : {
					itemType : 'file'
				},
				validateRule : ['utf-8','ascii','null','windows-1252']
			}
		},
		// JS语法检测
		'mod-validator-jshint' : {
			'TheJsHintRules' : {
				ruleName : 'The Javascript Hint Rule',
				warnning : '(!) JsHint Warnning(s).',
				filter : {
					itemType : 'file',
					commitType : ['A','U','_U','UU','G'],
					extName : [".js"],
					inRegx : ['^intl-style/trunk/deploy/htdocs/js/*','^intl-style/branches/.*?/deploy/htdocs/js/*']
				}
			}
		},
		// 提交者检测
		'mod-validator-author' : {
			'JSCommitLimitRule' : {
				ruleName : 'The Javascript File Commit Limit',
				warnning : '(!) You can not commit in this dir. The free authors are \n[ {{freeAuthors}} ]',
				filter : {
					itemType : 'all',
					inRegx : ['^intl-style/trunk/deploy/htdocs/js/5v/app/*','^intl-style/trunk/deploy/htdocs/js/5v/util/*','^intl-style/trunk/deploy/htdocs/js/5v/lib/ae/*','^intl-style/trunk/deploy/htdocs/js/5v/mod/common/*','^intl-style/branches/.*?/deploy/htdocs/js/5v/mod/common/*','^intl-style/branches/.*?/deploy/htdocs/js/5v/lib/ae/*','^intl-style/branches/.*?/deploy/htdocs/js/5v/lib/util/*','^intl-style/branches/.*?/deploy/htdocs/js/5v/app/*','^intl-style/trunk/deploy/htdocs/css/6v/seeds/*','^intl-style/branches/.*?/deploy/htdocs/css/6v/seeds/*']
				},
				freeAuthors : ['zhenyu.zhaozy','nanqiao.dengnq','xiaoxin.zhangxx','yanhua.guyh','zhao.wuz','xiaoyun.fuxy','peng.hep','jianqing.zengjq','been.zhangb','nuo.xun']
			}
		}

	}
	// ↑ 各种检测模块配置
	
};

// 载入提交前检测模块
var preCommit = require('node.svntail/lib/hook-pre-commit.js');

// 传入自定义配置 开始运行
preCommit.start(config);
~~~

运行服务端(默认端口为99)
--------------------
~~~javascript
// 开启前注意配置SVN钩子端的remoteConnect及remoteApiSettings配置
node node.svntail/lib/server-reporter.js
~~~