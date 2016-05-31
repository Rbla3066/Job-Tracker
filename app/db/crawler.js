var cheerio = require('cheerio');
var request = require('request');
var orm = require('./orm.js');

function getInfo(i, hrefs){
	if(i == hrefs.length) return setTimeout(requestCraiglist, 50000 + (Math.random() * 500000));
	orm.hrefCheck(hrefs[i], function(err, res){
		if(err) return console.log(err);
		if(res == null){
			var url = 'https:';
			var origin;
			if(hrefs[i].substring(0, 2) == '//'){
				url += hrefs[i];
				for(var j=0; j<hrefs[i].length; j++){
					if(hrefs[i].substring(j, j+4) == '.org'){
						origin = hrefs[i].substring(2, j+4);
						break;
					};
				};
			} else {
				url += '//newjersey.craigslist.org' + hrefs[i];
				origin = 'newjersey.craigslist.org'
			}
			request(url, function(err, result, html){
				if(err) {
					console.log("Error with href: "+hrefs[i]+ " " + err);
					return getInfo(i+1, hrefs);
				};
				var $ = cheerio.load(html);
				var job = {"href": hrefs[i], "deleted": false, "star": false};

				var postedFull = $('.timeago').attr('datetime');
				if(postedFull != undefined){
					job["post_date"] = {
						unix: postedFull,
						formal: $('.timeago').html()
					}
				};
				var title = $('#titletextonly');
				if(title != undefined) job['job_title'] = title.text().trim();
				var map = $('#map');
				if(map != undefined) job['location'] = {
					latitude: map.attr('data-latitude'),
					longitude: map.attr('data-longitude')
				};
				var info = $('#postingbody');
				if(info != undefined) job['info'] = info.text().trim();
				var attributes = $('.attrgroup');
				if(attributes != undefined) job['attributes'] = attributes.html();
				var emailLink = $('#replylink').eq(0).attr('href');
				var url2 = 'https://' + origin + emailLink
				if(emailLink) {
					request(url2, function(err, result, html){
					if(err) console.log(err);
					if(!err) {
						var $ = cheerio.load(html);
						if($("a").eq(0).html() != undefined){
							var a = $('a').eq(0).html();
							if(cheerio.load(a)('span').attr('data-cfemail')) a = decode(cheerio.load(a)('span').attr('data-cfemail'));
							job["email_address"] = a;
						}
					};
					job.display = true;
					orm.addJob(job, function(err, res){
						if(err) console.log(err + " | at: " + job.job_title);
						if(res) console.log("Added Job : " + job.job_title);
						return setTimeout(requestCraiglist, 50000 + (Math.random() * 500000))
					})
				})
				} else {
					job.display = false
					orm.addJob(job, function(err, res){
						if(err) console.log(err + " | at: " + job.job_title);
						if(res) console.log("Added Job : " + job.job_title);
						return setTimeout(requestCraiglist, 50000 + (Math.random() * 500000))
					})
				}
			})	
		} else {
			return getInfo(i+1, hrefs);
		}
	})
}
function requestCraiglist(){
	request('https://newjersey.craigslist.org/search/web', function(err, result, html){
		if(err) return console.log(err);
		var $ = cheerio.load(html);
		var jobs = $('.hdrlnk');
		var hrefs = [];
		jobs.each(function(i, elem){
			if($(this).attr("href") != undefined) hrefs.push($(this).attr("href"));
		});
		getInfo(0, hrefs);
	})
};

function decode(a){
    for (e = '', r = '0x' + a.substr(0, 2) | 0, n = 2; a.length - n; n += 2) e += '%' + ('0' + ('0x' + a.substr(n, 2) ^ r).toString(16)).slice(-2);
     return(decodeURIComponent(e))
}
module.exports = requestCraiglist;