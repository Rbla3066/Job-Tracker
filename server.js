var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var crawler = require('./app/db/crawler.js');

var PORT = process.env.PORT || 8080;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(express.static('./app/public'));


app.get('/api/startcrawl', function(req, res){
		crawler()
	})
require('./app/routes/api-routes.js')(app);
require('./app/routes/html-routes.js')(app); 





app.listen(PORT, function() {
	console.log("Server listening on PORT: " + PORT);
});