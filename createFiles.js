let aliasPath = './allAliases.json';
let implicationPath = './allImplications.json';
let tagsPath = './allTags.json';

let outputAliasPath = 'final-alias.json';
let outputImplicationPath = "final-implication.json";

const fs = require('fs');
const aliasFile = JSON.parse(fs.readFileSync(aliasPath, 'utf8')); console.log("Read Alias");
const implicationFile = JSON.parse(fs.readFileSync(implicationPath, 'utf8')); console.log("Read Implications");
const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8')); console.log("Read Tags");
console.log("────────****────────")

let aliasObjectString = JSON.stringify(makeAlias(aliasFile), null, 4); console.log("Made Alias")
fs.writeFile(outputAliasPath, aliasObjectString, function(err) {
    if(err) { return console.log(err); }
    console.log("Saved Alias");
}); 

let implicationObjectString =  JSON.stringify(makeImplication(implicationFile), null, 4); console.log("Made Implication")
fs.writeFile(outputImplicationPath, implicationObjectString, function(err) {
    if(err) { return console.log(err); }
    console.log("Saved Implications");
});
console.log("────────****────────")

/*────────────────────────────────────
             ╔═╗┌─┐┌┬┐┌─┐
             ║  │ │ ││├┤ 
             ╚═╝└─┘─┴┘└─┘ 
────────────────────────────────────*/

function makeAlias(file){
    var returnObj = {};

    /* Build structure with just tagId's */
    for(var elemK in file){
        let parent = file[elemK].alias_id;
        let name = file[elemK].name;
        returnObj[parent] ? '': returnObj[parent] = [];
        returnObj[parent].push(name);
    }

    /* Add's names to each alias */
    Object.keys(returnObj).forEach(function(objectKey) {        
        let newTop = objectKey + " " + findTagName(objectKey);
        returnObj[newTop] = returnObj[objectKey];
        returnObj[objectKey] = undefined;
    });

    return returnObj;
}

function makeImplication(file){
    /* simplified object from the Implication file */
    let simpleFile = file.map((obj) => ({parent:obj.consequent_id, child:obj.predicate_id}));
    simpleFile = mergeSort(simpleFile, (a,b) => a.parent-b.parent);

    /* returns an object containing a tree of it's children */
    function buildRecursively(wantedParentId){
        let returnObj = {}; // obj to return
        /* array of objects that have wantedParentId as their parentId */
        let range = getRange(simpleFile, {parent:wantedParentId}, (a,b) => b.parent-a.parent);
        if(range.length == 0) { return false; }

        for(let index in range){
            let childId = range[index].child;
            returnObj[childId] = buildRecursively(childId);
        }
        return returnObj;
    }
    
    /* Goes down tree adding names to the tag id recursively */
    function addTreeNames(object){
        if(!object){ return false; }
        let returnObj = {};
        
        /* add the names */
        Object.keys(object).forEach(function(objectKey, index) {
            let name = findTagName(objectKey);
            let newObjectKey = objectKey + " " + name
            returnObj[newObjectKey] = addTreeNames(object[objectKey]);
        });
        
        return returnObj;
    }



    let tree = {};
    let children = simpleFile.map((obj) => obj.child);
    for(var index in simpleFile){
        let parentId = simpleFile[index].parent;
        /* only runs future code if the parent doesn't have it's own parent */
        if(children.includes(parentId)){ continue; }
        if(tree[parentId]){ continue; } // don't repeat things that have been done
        tree[parentId] = buildRecursively(parentId);
    }

    return addTreeNames(tree)
}

/*────────────────────────────────────
         ╦ ╦┌┬┐┬┬  ┬┌┬┐┌─┐┌─┐        
         ║ ║ │ ││  │ │ ├┤ └─┐        
         ╚═╝ ┴ ┴┴─┘┴ ┴ └─┘└─┘        
────────────────────────────────────*/

/* returns an array containing all things that match the dummyVar */
function getRange(array, dummyVar, comparator){
    let start = binarySearch(array, true, dummyVar, comparator);
    let end = binarySearch(array, false, dummyVar, comparator);
    return array.slice(start, end);
}

/* returns the tagname given an id, doesn't work for invalid id's */
function findTagName(tagId){
    return tags[binarySearch(tags, true, {id:tagId}, (a,b) => a.id-b.id)].name;
}

/* custom binary search */
function binarySearch(array, findFirst, dummyVar, comparator) {
    let minIndex = 0;
    let maxIndex = array.length - 1;
 
    while (minIndex <= maxIndex) {
        let currentIndex = (minIndex + maxIndex) / 2 | 0;
        let currentElement = array[currentIndex];
        let compVal = comparator(dummyVar, currentElement);
    
        if (compVal > 0) {
            minIndex = currentIndex + 1;
        } else if(compVal < 0){
            maxIndex = currentIndex - 1;
        } else {
            findFirst ? maxIndex = currentIndex - 1 : minIndex = currentIndex + 1;
        }
    }
    
    return minIndex;
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