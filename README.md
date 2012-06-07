��װ�ֲ�
====================

����
--------------------
nodejs 0.6.1x

��λhooksĿ¼
--------------------
һ��hooksĿ¼λ��svn���Ŀ¼�£�һ��ͬ����Ŀ¼����dav��db��locks

ͨ��NPM��װnode.svntail
--------------------
~~~
npm install node.svntail
~~~

�޸�pre-commit�ļ�
--------------------
~~~javascript
#!/usr/bin/node

/**
 * ���ü���
*/
var config = {
	/**
	 * �ܿؿ��� (on/off)
	 * @property config.switch {string}
	 */
	switch : "on",
	/** 
	 * �汾���ַ
	 * @property config.repos {string}
	 */
	repos : process.argv[2],
	/** 
	 * ��ǰ�ύΨһ��ʶ�� �м�״̬�汾��
	 * @property config.txn {string}
	 */
	txn : process.argv[3],
	/** 
	 * ������
	 * @property config.scope {array}
	 */
	scope : ['^intl-style/*'],
	/** 
	 * debug ģʽ ��������Ϣ�����
	 * @property config.debug {boolean}
	 */
	debug : false,
	/** 
	 * SVN�ύ���ݻ���·�� ���������
	 * @property config.tempPath {string}
	 */
	tempPath : __dirname + '/temp-svntail-pre-commit/' + process.argv[3],
	/**
	 * svnlook����ȫ·��
	 * ͨ��whereis svnlook�ɻ�ȡ��ͨ���� /usr/bin/svnlook �� /usr/local/bin/svnlook
	 * @property config.cmdSvnlook {string}
	 */
	cmdSvnlook : 'LANG=zh_CN.utf8 /usr/local/bin/svnlook',
	/**
	 * �Ƿ���Ҫ�������ݵ�Զ��API
	 * @property config.remoteConnect {boolean}
	 */
	remoteConnect : false,
	/**
	 * Զ��API���� ( ���ڷ����ύ��Ϣ����API )
	 * @property config.remoteApiSettings {object}
	 */
	remoteApiSettings : {
    host: 'reporter.aliui.com',
    port: '99',
    path: '/api.js',
    method: 'POST'
  },
	/**
	 * ǿ���ύע�ͱ�ʶ
	 * @property config.forceCommitLog {string}
	 */
	forceCommitLog : '--force-commit',
	/**
	 * �Ƿ��Զ�ɾ�������ļ�
	 * @property config.autoDelTemp {boolean}
	 */
	autoDelTemp : true,
	/**
	 * ���ּ��ģ������  ���ͼ��ģ��ͬ����
	 * @property config.lintsConfig {object}
	 */
	validateConfigs : {
		
		// �ύ·��������
		'mod-validator-path' : {
			// ����Ŀ¼����
			'TheNewDirNameRules' : {
				ruleName : 'The New Dir Name Validate Rules',
				//warnning : '����Ŀ¼����Ϊ : Ӣ��Сд��ĸ�����֡��л�������(��ͷ����һ���»���)'
				warnning : '(!) Found Some Dir(s) Name Errors, Rule: lowcase letters, number & line-through[or begining_underline].',
				filter : {
					itemType : 'dir',
					commitType : ['A']
				},
				validateRule : '^_?[a-z0-9-]*/$'
			},
			// �����ļ�����
			'TheNewFileNameRules' : {
				ruleName : 'The New File Name Validate Rules',
				//warnning : '�����ļ�����Ϊ : Ӣ��Сд��ĸ�����֡��л������ӡ�'
				warnning : '(!) Found Some File(s) Name Errors, Rule: lowcase letters, number & line-through.',
				filter : {
					itemType : 'file',
					commitType : ['A']
				},
				validateRule : '^[a-z0-9-./]*$'
			},
			// JSĿ¼�ļ�����
			'JsDirRules' : {
				ruleName : 'The Js Dir Validate Rules',
				warnning : '(!) New js file rule is : extname must be [js|md|js.seed|xml|html|spec.js].',
				filter : {
					itemType : 'file',
					commitType : ['A'],
					inRegx : ['^intl-style/trunk/deploy/htdocs/js/*','^intl-style/branches/.*?/deploy/htdocs/js/*'],
					// libĿ¼����
					popRegx : ['^intl-style/trunk/deploy/htdocs/js/5v/lib/*','^intl-style/branches/.*?/deploy/htdocs/js/5v/lib/*']
				},
				validateRule : '^(.*?)\\.(?:js|md|js.seed|xml|html|spec.js).*$'
			},
			// CSSĿ¼�ļ�����
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
			// ͼƬĿ¼�ļ�����
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
		// ���������
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
		// JS�﷨���
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
		}

	}
	// �� ���ּ��ģ������
	
};

// �����ύǰ���ģ��
var preCommit = require('node.svntail/lib/hook-pre-commit.js');

// �����Զ������� ��ʼ����
preCommit.start(config);
~~~javascript