
var geocoder = require('geocoder');
var orm = require('./../db/orm.js');
var moment = require('moment');

function getJobDetails(i, jobs, callback){
	//40.735492, -74.987929
	if(i == jobs.length) return callback(null, jobs);
	var latDif = Math.abs(parseInt(jobs[i].location.latitude) - 40.735492);
	var lonDif = Math.abs(parseInt(jobs[i].location.longitude) + 74.987929);
	var distance = Math.floor(Math.sqrt((latDif * latDif) + (lonDif * lonDif)) * 60);
	var post = moment(jobs[i].post_date.unix.replace(/'T'/g, " ").substring(0, 19));
	jobs[i]["display_time"] = post.format('MMM Do, YYYY HH:mm')
	jobs[i]["distance_miles"] = distance;
	if(jobs[i].location.latitude && jobs[i].location.longitude){
		geocoder.reverseGeocode(jobs[i].location.latitude, jobs[i].location.longitude, function(err, data){
			if(err) {
				console.log(err);
				return getJobDetails(i+1, jobs, callback);
			};
			if(data.results[0] != undefined) jobs[i].location["formal_address"] = data.results[0].formatted_address;
			getJobDetails(i+1, jobs, callback);
		})
	} else {
		getJobDetails(i+1, jobs, callback);
	}
	
}

module.exports = function(app){
	
	app.get('/api/jobs', function(req, res){
		orm.findAll(function(err, jobs){
			if(err) return res.json(404);
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
	app.post('/api/location', function(req, res){
		geocoder.reverseGeocode( req.body.latitude, req.body.longitude,  function ( err, data ) {
			if(err){
				res.json("Error: "+err);
				
			} else {
				req.user.location = {
					longitude: req.body.longitude,
					latitude: req.body.latitude
				};
				if(data.results[0] != undefined){
					req.user.location["address"] = data.results[0].formatted_address
				}
				res.json(req.user);
			};
		});
	});

};