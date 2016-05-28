/**
 * JSdoc plugin that allows categorization of classes
 */

exports.defineTags = function(dictionary) {
    dictionary.defineTag('category', {
        mustHaveValue: true,
        onTagged: function(doclet, tag) {
            if(env.conf.categoryList.indexOf(tag.value) !== -1)
            {
                doclet.category = tag.value.split('/');
                doclet.categoryString = tag.value;
                doclet.categoryNestingLevel = doclet.category.length - 1;
            }
            else
            {
                console.error('ERROR  Undefined category "' + tag.value + '"');
                throw 'Undefined category';
            }
        }
    });
};

exports.handlers = {
    parseBegin: function() {
        loadConfiguration();
    }
};

exports.processCategories = function (categories)
{
    return processCats(JSON.parse(JSON.stringify(categories)));
};

function processCats (categories, level, parent)
{
    if(!level)
    {
        parent = "";
        level = 1;
    }

    var processedCats = {};

    for (var category in categories)
    {
        if(categories.hasOwnProperty(category) && category.indexOf(parent) === 0 && category.split('/').length == level)
        {
            // Determine category name at this level
            var catName;
            if(level > 1)
            {
                var splitCat = category.split('/');
                catName = splitCat[splitCat.length - 1];
            }
            else
            {
                catName = category;
            }

            // Copy data of the category
            var categoryData = categories[category];

            var newCategoryObject = {};

            for(key in categoryData)
            {
                if(categoryData.hasOwnProperty(key))
                {
                    newCategoryObject[key] = categoryData[key];
                }
            }

            processedCats[catName] = newCategoryObject;

            // Recurse into next level
            delete categories[category]; // To speed up the process

            var children = processCats(categories, level + 1, category);
            if (Object.keys(children).length) processedCats[catName].children = children;
        }
    }

    return processedCats;
}

function loadConfiguration () {
    try
    {
        var fs = require('jsdoc/fs');
        var confFileContents = fs.readFileSync(env.conf.categoryfile, 'utf8');
        env.conf.categories = JSON.parse( (confFileContents || "{}" ) );
        env.conf.categoryList = Object.keys(env.conf.categories);
    }
    catch (e)
    {
        throw 'Could not load category file';
    }
}