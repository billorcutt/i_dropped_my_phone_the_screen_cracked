/**
* flatten multidimensional arrays
* @private
* @param {Array} a
* @param {Array} r
* @returns {*|Array} 
*/
function flatten(a, r) {
    //http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
    r = r || [];
    for (var i = 0; i < a.length; i++) {
        if (a[i].constructor === Array) {
            flatten(a[i], r);
        } else {
            r.push(a[i]);
        }
    }
    return r;
}

/**
* Dedupe array
* @private
* @param {Array} array
* @returns {*|Array|string}
*/
function arrayUnique(array) {
    var a = array.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) {
                a.splice(j--, 1);
            }
        }
    }
    return a;
}

/**
* get unique id
* @private
* @returns {string}
*/
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
* helper function to set values in a map
* @param {Object} map
* @param {string} key
* @param {*} value
* @private
*/
function setter(map, key, value) {
    if (map && key) {
        if (map[key] && map[key].push) {
            map[key].push(value);
        } else {
            map[key] = [value];
        }
    }
}

/**
* helper function to remove values in a map
* @param {Object} map
* @param {string} key
* @param {*} value
* @private
*/
function unsetter(map, key, value) {
    if(__.isNotUndef(map[key])) {
        if(__.isArr(map[key])) {
            map[key] = map[key].filter(function(val){
                return value !== val;
            });
            if(map[key].length===0) {
                delete map[key];
            }
        } else {
            delete map[key];
        }
    }
}

/**
* adds and overwrites properties from the src obect to the target object
* @private
* @param source
* @param target
* @returns {*|{}}
*/
function mergeObjects(source, target) {
    source = source || {};
    target = target || {};
    for (var x in source) {
        if (source.hasOwnProperty(x)) {
            target[x] = source[x];
        }
    }
    return target;
}