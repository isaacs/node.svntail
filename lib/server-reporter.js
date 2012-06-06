var http = require('http'),
		qs = require('querystring'),
		fs = require('fs'),
    url = require('url');
    
runServer = function(port){

    var server = http.createServer(function(req, res){

	  		var path = url.parse(req.url),
	     			parameter = qs.parse(path.query);

        //on用于添加一个监听函数到一个特定的事件

				// 写入文件
			  switch (path.pathname) {
			    case "/api.js":

					  // 接收post数据容器
						var postData = [];
						
						req.on('data', function(chunk){
								// 累加数据
								postData.push(chunk);
						});
						
						req.on('end', function(){
							// 拼接结果
							postData = postData.join("");
							
							// 解析
							var postDataJson = JSON.parse(postData);
							
							// 报告 path 生成
							var logPath = postDataJson.commitAuthor + ".html";
							
							console.log("result from svn validator write to : " + logPath + " ; visit : http://svnlint.aliui.com:99/read.js?log=" + logPath + "\n");

							fs.open(__dirname + "/" + logPath,"w",0644,function(e,fd){
								if(e) throw e;
								// "post data : " + postData + "; path : "+ JSON.stringify(path) + ";" + "parameter : "+ JSON.stringify(parameter) + ";"
								fs.write(fd,postData ,0,'utf8',function(e){
									if(e) throw e;
									fs.closeSync(fd);
									res.end('{ "output" : "ok" }');
								});
							});

						});


			      break;
			      
			    // 读取文件
			    case "/read.js":
			    
						var readFilePath = __dirname + "/" + parameter.log.toString();
						fs.readFile(readFilePath, "utf-8", function(err, file) {
							if(err){
	        			console.log(err);
	        			res.end(JSON.stringify(err));
	        			return;
							}else{
							  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
							  res.write(file);
				        // 此时才结束这次请求
				        res.end("<br />---------------------------");
			      	}
						});
						
						
			      break;
			      
			      
			    default:
			    
			      break;
			  }
			  
        
        // console.log(req.url);
        // console.log(req.method);



    }).listen(port);

    console.log('svnlint server running....');

};

runServer(99);