
var orm = require('./../db/orm.js');
var key = require('./../db/keys/google.js');
var NodeGeocoder = require('node-geocoder');
var request = require('request');
var cheerio = require('cheerio');
var options = {
  provider: 'google',
  apiKey: key, 
  formatter: null
};
var geocoder = NodeGeocoder(options);
var moment = require('moment');

function getJobDetails(i, jobs, callback){
	//40.735492, -74.987929
	if(i == jobs.length) return callback(null, jobs);
	if(jobs[i].location == undefined) return(getJobDetails(i+1, jobs, callback))
	var latDif = Math.abs(parseInt(jobs[i].location.latitude) - 40.735492);
	var lonDif = Math.abs(parseInt(jobs[i].location.longitude) + 74.987929);
	var distance = Math.floor(Math.sqrt((latDif * latDif) + (lonDif * lonDif)) * 60);
	var post = moment(jobs[i].post_date.unix.replace(/'T'/g, " ").substring(0, 19));
	jobs[i]["display_time"] = post.format('MMM Do')
	jobs[i]["distance_miles"] = distance;
	if((!jobs[i].location.city_state || !jobs[i].location.formal_address) && jobs[i].location.latitude && jobs[i].location.longitude){
		geocoder.reverse({lat: jobs[i].location.latitude, lon: jobs[i].location.longitude})
		.then(function(data){
			if(data[0] != undefined && data[0].formattedAddress) jobs[i].location["formal_address"] = data[0].formattedAddress;
			if(data[0] != undefined && data[0].city && data[0].administrativeLevels) jobs[i].location["city_state"] = data[0].city + ", " + data[0].administrativeLevels.level1short;
			orm.updateJob(jobs[i], function(err, res){
				if(err) console.log(err);
				return getJobDetails(i+1, jobs, callback);
			})
		})
		.catch(function(err){
			console.log(err);
			return getJobDetails(i+1, jobs, callback);
		})
	} else {
		return getJobDetails(i+1, jobs, callback);
	}
	
}

module.exports = function(app){
	app.get('/api/jobs', function(req, res){
		orm.findAll(function(err, jobs){
			if(err) return res.json(404);
			if(jobs.length == 0) return res.json("fail")
			getJobDetails(0, jobs, function(err, newjobs){
				newjobs.sort(function(a,b){
				var c = new Date(a.post_date.unix);
				var d = new Date(b.post_date.unix);
				return d-c;
				});
				res.json(newjobs);
			})
		})
	})
	app.get('/api/map/:id', function(req, res){
		var id = req.params.id;
		orm.sendHref(id, function(err, result){
			if(err) throw err;
			if(result){
				request(result, function(err, response, html){
					var $ = cheerio.load(html);
					var map = $('.mapbox');
					if(map){
						res.send("<div class='mapbox'>"+map.html()+"</div>")
					} else {
						res.send('not found');
					}
				})
			}
		})
	})
	app.get('/api/undelete', function(req, res){
		orm.unDelete(function(err, result){

			if(err) throw err;
			
			res.send('success');
		})
	})
	app.get('/api/delete/:id', function(req, res){
		var id = req.params.id;
		orm.deleteJob(id, function(err, result){
			if(err) throw err;
			res.redirect('/');
		});
	})
	app.get('/api/star/:id', function(req, res){
		var id = req.params.id;
		orm.starJob(id, function(err, result){
			if(err) throw err;
			res.redirect('/');
		});
	})
	app.get('/api/unstar/:id', function(req, res){
		var id = req.params.id;
		orm.unStarJob(id, function(err, result){
			if(err) throw err;
			res.redirect('/');
		});
	})
};