# typesmith-subgroup

This plugin for [typesmith.js](http://www.github.com/bbor/typesmith) goes through the items in the typesmith database looking for records that have children. If it finds some, it automatically splits up those children into subgroups based on their types, or based on the value of a different key in the record that you specify.

Each time it adds a subgroup, it adds a new record to the database for that subgroup. So the subgroup gets its own unique anchor and spot in the TOC, etc.

## Options

Note: You can configure these options globally for all record types by setting them in the plugin options. Or, you can tailor them individually for different record types by setting them in the typesmith `config.types` object. The specific setting overrides the general when it exists.

`subgroup_by_type`

>	By default, all children of a given record will get grouped by type. So, for example, if a class has children of type "function", "variable", and "typedef", the class will end up with three newly created child records that represent those groups, each of which will be assigned the children of the original class. Or, set this to `false` to have children of all types assigned directly to the parent. These auto-created records are assigned the type "subgroup". If the subgroup element already exists in the db, that existing record will be used. That way you could assign them some content if you really wanted.

`subgroup_by_key`

>	If you want to group child elements differently, you can assign each child record in the db a particular key, say "group". Assign the name of that key to this "subgroup_by_key" option. Then, any time the plugin sees a child record with that key in the data, it will assign the create a subgroup for that key value under the parent, and assign the record as a child of that subgroup. The record generated for the auto-created group will use as its type name the name of the key you set in this parameter. As above, if that element already exists in the db, it will be reused, so you could use that mechanism to provide content for the group.

`default_subgroup`

>	When we auto-create a subgroup, a copy of this default record is used as the template for each new record we create. You can re-configure the settings in the `default_subgroup` object to change the behavior of your subgroups. The only field that is always set automatically for you is the name.
>
> The default settings are:
>
> ```js
>     default_subgroup:{
>     page:false,
>     toc:{
>       autoexpand:true
>     },
>     typeahead:{
>       include:false
>     }
>   }
> ```


## A possible configuration example

```js
  {
    "types":{
      "class":{
        "default_subgroup":{
          "content_title":"Classes"
        }
      },
      "function":{
        "default_subgroup":{
          "content_title":"Functions"
        }
      },
      "typedef":{
        "default_subgroup":{
          "content_title":"Tyoe definitions" // but groups of typedefs within a class need a fancier title.
        }
      },
      "namespace":{
        "default_subgroup":{
          "content_title":"Namespaces"
        }
        "subgroup_by_type":false             // let children of a namespace all get listed together without being split up by type.
      }
    }
    "typesmith-subgroup": {
      "default_subgroup":{
        "toc":{
          "autoexpand":false                 // override this one setting for all auto-created subgroups, regardless of type.
        }
      }
    },
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
