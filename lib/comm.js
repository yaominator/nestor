var dgram = require('dgram'),
  _http = require('http'),
  p = require('path'),
  xml2js = require('xml2js');

// most commands use Jenkins HTTP API
function http(path, method, url, cb) {
  var req = _http.request({
    path: p.join(url.pathname, path),
    method: method,
    host: url.hostname,
    port: url.port,
    headers: (url.auth) ?
      { 'Authorization': 'Basic ' + new Buffer(url.auth).toString('base64') } :
      null
  }, function (res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      //console.log('statusCode: ' + res.statusCode);
      //console.log('headers: ' + JSON.stringify(res.headers));
      //console.log('data: ' + data);
      cb(null, {
        statusCode: res.statusCode,
        headers: res.headers,
        data: data
      });
    });
  });
  req.on('error', cb);
  req.end();  
}

// only discover commands uses UDP
function udp(message, host, port, cb) {
  var socket = dgram.createSocket('udp4'),
    buffer = new Buffer(message),
    parser = new xml2js.Parser();
  
  socket.on('error', function (err) {
    socket.close();
    cb(err);
  });

  socket.on('message', function (data) {
    socket.close();
    parser.addListener('end', function (data) {
      cb(null, data);
    });
    parser.parseString(data);
  });

  socket.send(buffer, 0, buffer.length, port, host, function (err, result) {
    if (err) {
      socket.close();
      cb(err);
    }
  });
}

exports.http = http;
exports.udp = udp;