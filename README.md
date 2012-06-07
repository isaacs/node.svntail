安装手册
====================

定位hooks目录
--------------------
一般hooks目录位于svn库根目录下，一般同级的目录还有dav、db、locks

NPM安装node.svntail
--------------------
npm install node.svntail


打开pre-commit钩子
--------------------
	在hooks目录

	#!/usr/bin/node

	var config = {
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
		scope : ["^intl-style/*","^dir-1/*"],
		/** 
		 * SVN提交内容缓存路径 检测作用域
		 * @property config.tempPath {string}
		 */
		tempPath : '/home/svn_proxy_base/hook/hooks/ali-f2e-lint-svn-temp/' + process.argv[3],
		/**
		 * svnlook命令全路径
		 * @property config.cmdSvnlook {string}
		 */
		cmdSvnlook : '/usr/local/bin/svnlook'
	};

	// 载入提交前检测模块
	var preCommit = require('./ali-f2e-lint/run-svn-server/pre-commit.js');

	// 传入自定义配置 开始运行
	preCommit.start(config);