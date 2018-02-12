# typesmith-subgroup

This plugin for [typesmith.js](http://www.github.com/bbor/typesmith) goes through the items in the typesmith database looking for records that have children. If it finds some, it automatically splits up those children into subgroups based on their types, or based on the value of a different key in the record that you specify.

Each time it adds a subgroup, it adds a new record to the database for that subgroup. So the subgroup gets its own unique anchor and spot in the TOC, etc.

## Options

Note: You can configure these options globally for all record types by setting them in the plugin options. Or, you can tailor them individually for different record types by setting them in the typesmith `config.types` object. The specific setting overrides the general when it exists.

`subgroup_by_type`

>	By default, all children of a given record will get grouped by type. So, for example, if a class has children of type "function", "variable", and "typedef", the class will end up with three newly created child records that represent those groups, each of which will be assigned the children of the original class. Or, set this to `false` to have children of all types assigned directly to the parent. These auto-created records are assigned the type "subgroup". If the subgroup element already exists in the db, that existing record will be used. That way you could assign them some content if you really wanted.

`subgroup_by_key`

>	If you want to group child elements differently, you can assign each child record in the db a particular key, say "group". Assign the name of that key to this "subgroup_by_key" option. Then, any time the plugin sees a child record with that key in the data, it will assign the create a subgroup for that key value under the parent, and assign the record as a child of that subgroup. The record generated for the auto-created group will use as its type name the name of the key you set in this parameter. As above, if that element already exists in the db, it will be reused, so you could use that mechanism to provide content for the group.

`subgroup_title`

>	When we auto-create a subgroup, it usually needs a display name. For subgroups created based on record types, you can set this name using the "subgroup_title" field for each type. For subgroups based on a key in the data, the title will be the value stored in the record under that key.

`autoexpand_subgroups`

>	When set to `true` (the default), each automatically created subgroup record will be marked with `toc.autoexpand = true`. In mixtape, this makes the subgroups expand automatically when you expand the parent record in the TOC.


## A possible type configuration example

```js
  {
    "types":{
      "class":{
        "subgroup_title":"Classes",
      },
      "function":{
        "subgroup_title":"Functions"
      },
      "typedef":{
        "subgroup_title":"Type definitions"   // but groups of typedefs within a class need a fancier title.
      },
      "namespace":{
        "subgroup_title":"Namespaces"
        "subgroup_by_type":false             // let children of a namespace all get listed together without being split up by type.
      }
    }
  }
```

## Usage

As any other `typesmith` plugin, require it in your module and pass it to `typesmith.use()`:

```js
var typesmith = require('typesmith');
var subgroup = require('typesmith-subgroup');
... // require other plugins

var config = {
	... // config options and type info goes here
}

typesmith(config)
  .use(readJson())
  .use(readMarkdown())
  .use(autoparent())
  .use(subgroup())
  .use(writeJson())
  .use(writeHtml())
  .run( function(errmsg) { if (errmsg) { console.log("Error: " + errmsg); } console.log('finished!'); } );

```
