#!/usr/bin/env node
var fs = require('fs-extra')
var exec = require('sync-exec')
var path = require('path');

var divePath = process.cwd();
var attachmentsExportPath = "public/assets/images/"
var markdownImageReference = "assets/images/"
// print process.argv
process.argv.forEach(function (val, index, array) {
  if (index === 2){
    divePath = process.cwd() + "/" + val;
  }else if (index === 3){
    attachmentsExportPath = val
  }else if(index === 4){
    markdownImageReference = val
  }
});
dive(divePath)

function dive(dir) {
  var list = []
  var stat = ""
    // Read the directory
  list = fs.readdirSync(dir);
  list.forEach(function (file) {
    // Full path of that file
    var p = path.join(dir , file)

    // Get the file's stats
    stat = fs.statSync(p)

    // If the file is a directory
    if (stat && stat.isDirectory()) {
      dive(p);
    } else {
      console.log(file)
      if (file.endsWith('.html')) {
        var titleRegex = /<title>([^<]*)<\/title>/i
        var content = fs.readFileSync(p, 'utf8')
        var match = content.match(titleRegex)
        if (match != null && match.length > 1) {
          fs.ensureDir("Markdown")
          //var sanitizedfilename = match[1].replace(/[^0-9a-zA-Z]/g,"_")
          var sanitizedfilename = path.basename(file, '.html')
          var outputFile = path.join("Markdown", sanitizedfilename + ".md")
          var command = "pandoc -f html -t gfm -o " + outputFile + " " + p
          var out = exec(command, {cwd: process.cwd()})
          console.log(out)
            //images
          console.log("Reading : " + outputFile)
          var content = fs.readFileSync(outputFile, 'utf8')
          // var matches = uniq(content.match(/(<img src=")([a-z||_|0-9|.|]+)\/([a-z||_|0-9|.|]+)\/([a-z||_|0-9|.|]+)/ig))
          // matches.forEach(function (img) {
          //   img = img.replace('<img src="', '')
          //   var attachments = img.replace("attachments/", "");
          //   if (attachments == img) {
          //     return;
          //   }
          //   var fileName = attachmentsExportPath + attachments;
          //   mkdirpSync(fileName.substr(0, fileName.lastIndexOf('/')))
          //   try {
          //     fs.accessSync(dir + "/" + img, fs.F_OK);
          //     fs.createReadStream(dir + "/" + img).pipe(fs.createWriteStream(process.cwd() + "/" + fileName));
          //     console.log("Wrote: " + dir + "/" + img + "\n To: " + process.cwd() + "/" + fileName)
          //   } catch (e) {
          //     console.log("Can't read: " + dir + "/" + img)
          //   }
          // })

          //var lines = content.replace(/(<img src=")([a-z||_|0-9|.|]+)\/([a-z||_|0-9|.|]+)\/([a-z||_|0-9|.|]+)/ig, "$1"+ markdownImageReference +"$3/$4")
          
          /**
           * remove /download/ from urls (jira endpoint)
           */
          var lines = content;
          lines = lines.replace(/\/download\//ig, '')
          /**
           * replace .html file references with .md
           */
          lines = lines.replace(/\.html/ig, '')

          /**
           * remove newline and carrige return characters from body of markdown links
           */
          lines = lines.replace(/(?<=\[.+)\n+(?=.+\])/ig, '')
          lines = lines.replace(/(?<=\[.+)\r+(?=.+\])/ig, '')
          lines = lines.replace(/(?<=\[.+)\r\n+(?=.+\])/ig, '')
          
          /**
           * remove html bullet points
           */
          lines = lines.replaceAll('<img src="images/icons/bullet_blue.gif" width="8" height="8" />', '')

          /**
           * remove file type annotations occurring after markdown links
           */
          lines = lines.replaceAll('(application/vnd.openxmlformats-officedocument.presentationml.presentation)', '')
          lines = lines.replaceAll('(application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)', '')
          lines = lines.replaceAll('(application/vnd.openxmlformats-officedocument.wordprocessingml.document)', '')
          lines = lines.replaceAll('(image/png)', '')
          lines = lines.replaceAll('(application/zip)', '')
          lines = lines.replaceAll('(application/pdf)', '')
          lines = lines.replaceAll('(image/jpeg)', '')
          lines = lines.replaceAll('(image/gif)', '')
          lines = lines.replaceAll('(video/quicktime)', '')
          lines = lines.replaceAll('(image/svg+xml)', '')
          lines = lines.replaceAll('(application/octet-stream)', '')

          fs.writeFileSync(outputFile, lines)
        }
      }
    }
  })
}

function uniq(a) {
  return Array.from(new Set(a));
}

function mkdirSync(path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code != 'EEXIST') throw e;
  }
}

function mkdirpSync(dirpath) {
//  console.log("Making : " + dirpath)
  var parts = dirpath.split(path.sep);
  for (var i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)));
  }
}
