var mongojs = require('mongojs');
var db = mongojs('heroku_ss3lpvpd:Coolbeans777@ds019633.mlab.com:19633/heroku_ss3lpvpd', ['jobs']);


//var Job = mongoose.model('Job', {
//   job_title: {type: String, default: 'unknown'},
//   location: { type: String, default: 'unknown'},
//   company: { type: String, default: 'unknown'},
//   date: { type: String, default: Date.now },
//   description: { type: String, default: 'unavailable'},
//   href: { type: String, default: 'unavailable'}
//});



module.exports = {
	findAll : function(callback){
		db.jobs.find(function(err, docs){
			if(err){
				return callback(err, null);
			} else {
				return callback(null, docs);
			};
		});
	},
	findSimilar : function(job, callback){
		db.jobs.find({job_title: job.location}, function(err, docs){
			if(!err){
				if(docs.length > 0){
					for(var i=0; i<docs.length; i++){
						if((job.company != undefined && docs[i].company == job.company) || (job.job_title != undefined && docs[i].job_title == job.job_title) || (job.href != undefined && docs[i].href == job.href)){
							return callback(null, false);
						}
					}
					return callback(null, true);
				} else {
					
					return callback(null, true);
				}
			} else {
				return callback(err, null);
			}
		});
	},
	addJob: function(job, callback){
		db.jobs.insert(job, function(err, res){
			if(err) return callback(err);
			return callback(null, res);
		})
	},
	checkJob: function(job, callback){
		if(job.location != undefined && job.location != ""){
			this.findSimilar(job, function(err, result){
				if(err) return callback(err, null);
				if(result){
					db.jobs.insert(job, function(err, res){
						if(err) return callback(err);
						return callback(null, res)
					});
				};
			});
		};
	},
	updateJob: function(job, callback){
		db.jobs.update({'href': job.href}, {$set: job}, function(err, res){
			callback(err, res);
		})
	},
	hrefCheck: function(href, callback){
		db.jobs.find({href: href}, function(err, docs){
			if(err) return callback(err);
			if(docs.length != undefined && docs.length > 0) return callback(null, docs);
			return callback(null, null);
		});
	}
};

