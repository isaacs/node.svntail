��װ�ֲ�
====================

��λhooksĿ¼
--------------------
һ��hooksĿ¼λ��svn���Ŀ¼�£�һ��ͬ����Ŀ¼����dav��db��locks

NPM��װnode.svntail
--------------------
npm install node.svntail


��pre-commit����
--------------------
	��hooksĿ¼

	#!/usr/bin/node

	var config = {
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
		scope : ["^intl-style/*","^dir-1/*"],
		/** 
		 * SVN�ύ���ݻ���·�� ���������
		 * @property config.tempPath {string}
		 */
		tempPath : '/home/svn_proxy_base/hook/hooks/ali-f2e-lint-svn-temp/' + process.argv[3],
		/**
		 * svnlook����ȫ·��
		 * @property config.cmdSvnlook {string}
		 */
		cmdSvnlook : '/usr/local/bin/svnlook'
	};

	// �����ύǰ���ģ��
	var preCommit = require('./ali-f2e-lint/run-svn-server/pre-commit.js');

	// �����Զ������� ��ʼ����
	preCommit.start(config);