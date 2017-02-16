var express = require('express');
var exApp = express();

var fs = require('fs');
var path = require('path');
var _ = require('lodash');



  // let uploads_folder_dir = path.join(__dirname,'uploads');
  let uploads_folder_dir = path.join('./','uploads');



var engines = require('consolidate');
exApp.engine('hbs',engines.handlebars);//force handlebars as the default templating engine

  exApp.set('views','./views'); // get views from ./views
  // exApp.set('view engine','jade');
  exApp.set('view engine','hbs'); //user hbs template engine


  exApp.use('/download',express.static(uploads_folder_dir));//means: any request to /images return with the public/images/pics directory
  exApp.use(express.static('public'));// this is a default request directory




/*********************************************************************
Remove X-Powered-By →Express from header
**********************************************************************/
exApp.use(function(req,res,next){
  	res.removeHeader("X-Powered-By");
	res.set('X-Powered-By','Ahmed Badawy');
	next();
})
/**********************************************************************/




var scanDir = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          scanDir(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};



  let files_list = [];
  function populate_files_list(){
    scanDir(uploads_folder_dir,function(err,list){
      if(err) throw err;
      files_list = list;
    });
  }
  populate_files_list();


  function get_final_output(){
    let final_output = [];
    for(file of files_list.sort()){
      let output = file.split('\\');
      final_output.push({
        file_name: output.pop(),
        file_url: file
      })
    }
    return final_output;
  }




  exApp.get('/',function(request,result,next){
    populate_files_list();
    let final_output = get_final_output();
    // console.log(final_output);
    result.render("home",{files_list:final_output});
  })



// download response:    http://localhost:3000/download/1.img
// exApp.get('/download/*',function(request,result){
// 	result.download('./upload/me.jpg','file_name'); //return a download file
// 	// result.send("image was downloaded");
// })



exApp.get('/delete/:file_name', function(req, res){
  let file_name = req.params.file_name;
  // fs.rmdirSync( path.join(uploads_folder_dir,file_name) );
  fs.unlinkSync(path.join(uploads_folder_dir,file_name));
  populate_files_list();
  res.redirect('/');
});


var formidable = require('formidable');
exApp.post('/upload', function(req, res){
  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.uploadDir = uploads_folder_dir;
  form.on('file', function(field, file){
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });
  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });
  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    populate_files_list();
    res.end('success');
  });
  populate_files_list();
  // parse the incoming request containing the form data
  form.parse(req);
});




var server = exApp.listen(3000,function(){
	//fire this on start
	console.log("Server Running at http://localhost:"+server.address().port);
});






