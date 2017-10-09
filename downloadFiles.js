const request = require('request');
const fs = require('fs');

const timeToWait = 1000; // in ms

const aliasFileName = 'allAliases.json';
const implicationFileName = 'allImplications.json';
const tagFileName = 'allTags.json';

const aliasBaseURL = 'https://e621.net/tag_alias/index.json?approved=true&page=';
const implicationBaseURL = 'https://e621.net/tag_implication/index.json?approved=true&page=';
const tagBaseURL = 'https://e621.net/tag/index.json?limit=500&show_empty_tags=1&page=';

/* theres only 3, why future proof */
downloadURL(aliasBaseURL, 'alias', function(aliasObject){
	fs.writeFile(aliasFileName, JSON.stringify(aliasObject), function(err) {
		if(err) { return console.log(err); }
		console.log('Saved ' + aliasFileName);

		downloadURL(implicationBaseURL, 'implication', function(implicationObject){
			fs.writeFile(implicationFileName, JSON.stringify(implicationObject), function(err) {
				if(err) { return console.log(err); }
				console.log('Saved ' + implicationFileName);

				downloadURL(tagBaseURL, 'tag', function(tagObject){
					fs.writeFile(tagFileName, JSON.stringify(tagObject), function(err) {
						if(err) { return console.log(err); }
						console.log('Saved ' + tagFileName);
					}); 
				});
			}); 
		});
	}); 
});

function downloadURL(baseURL, identifier, callback){
	let returnArray = [];
	let counter = 0;
	let options = {headers: { 'User-Agent': 'Tag tree v1.0 (created by idem)' }}; // 
	var interval = setInterval(function(){ let tempStore = ++counter; // tempStore is to make pretty
		options.url = baseURL + counter;
		request(options, function(requestError, headers, response){
			if (requestError || headers.statusCode != 200) { clearInterval(interval); return; } // oh shit line
			console.log('p' + tempStore + '\tDownloaded '+identifier);
			
			let jsonObj = JSON.parse(response);
			Array.prototype.push.apply(returnArray, jsonObj); // add to array
		
			if(jsonObj.length == 0){ // When it has gotten an empty response
				clearInterval(interval)
				console.log('sorting');
				returnArray = mergeSort(returnArray, (a,b) => a.id-b.id);
				console.log('sorted');
				callback(returnArray);
			}
		});
	}, timeToWait);
}

function mergeSort(arr, comparator){
	return mergeSortRecurse(arr);

	function mergeSortRecurse(arr){
	    if (arr.length < 2) { return arr; }
	    let middle = parseInt(arr.length / 2);
	    let left   = arr.slice(0, middle);
	    let right  = arr.slice(middle, arr.length);
	    return merge(mergeSortRecurse(left), mergeSortRecurse(right));
	}
	
	function merge(left, right){    
		let result = [];
		while (left.length && right.length) {
			if (comparator(left[0], right[0]) > 0) {
				result.push(left.shift());
			} else {
				result.push(right.shift());
			}
		}
		while (left.length) { result.push(left.shift()); }
		while (right.length) { result.push(right.shift()); }
		return result;
	}
}