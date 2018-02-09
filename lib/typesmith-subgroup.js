
module.exports = plugin;

/*
  This plugin goes through the typesmith database looking for records that have children. If it finds some, it will
  automatically split up those children into subgroups based on their types, or based on the content of a different
  data element that you specify.

  options:

  Note: You can configure these options globally for all record types by setting them in the plugin options. Or,
  you can tailor them individually for different record types by setting them in the typesmith config.types object. The
  specific setting overrides the general when it exists.

  - subgroup_by_type: By default, all children of a given record will get grouped by type. So, for example, if a
                      class has children of type "function", "variable", and "typedef", the class will end up with
                      three newly created child records that represent those groups, each of which will be assigned
                      the children of the original class. Or, set this to `false` to have children of all types
                      assigned directly to the parent. These auto-created records are assigned the type "subgroup".
                      If the subgroup element already exists in the db, that existing record will be used.
                      That way you could assign them some content if you really wanted.
  - subgroup_by_key:  If you want to group child elements differently, you can assign each child record in the db
                      a particular key, say "group". Assign the name of that key to this "subgroup_by_key" option.
                      Then, any time the plugin sees a child record with that key in the data, it will assign the
                      create a subgroup for that key value under the parent, and assign the record as a child of
                      that subgroup. The record generated for the auto-created group will use as its type name the
                      name of the key you set in this parameter. As above, if that element already exists in the db,
                      it will be reused, so you could use that mechanism to provide content for the group.
                      Set to an empty string to disable.
  - subgroup_title:   When we auto-create a subgroup, it usually needs a display name. For subgroups created based on
                      record types, you can set this name using the "subgroup_title" field for each type. For subgroups
                      based on a key in the data, the title will be the value stored in the record under that key.

  example of a possible type configuration:
  {
    "types":{
      "class":{
        "child_types":["function","member","typedef"],  // records of type class can only have these kinds of children.
        "subgroup_title":"Classes",
      },
      "function":{
        "child_types":[].                     // records of type function can't have any children.
        "subgroup_title":"Functions"
      },
      "typedef":{
        "child_types":[].                     // typedefs can't have any child records.
        "subgroup_title":"Type definitions"   // but groups of typedefs within a class need a fancier title.
      },
      "namespace":{
                                             // leave out the child_types array entirely to allow any kind of child records.
        "subgroup_title":"Namespaces"
        "subgroup_by_type":false             // let children of a namespace all get listed together without being split up by type.
      }
    }
  }
*/

function plugin(opts) {

  var plugin_defaults = {
    subgroup_by_type:true,
    subgroup_by_key:'',
  }

  return function(typesmith, done){
    opts = opts || typesmith.config['typesmith-autoparent'] || {}

    var defaults = Object.assign({}, plugin_defaults, opts);

    Object.keys(typesmith.db).forEach( function(uid) {
      var record = typesmith.db[uid];
      var record_type = record.type;
      var type_config = typesmith.config.types[record_type] || {};
      var final_config = Object.assign({}, defaults, type_config);

      if (!record.parent) { return; }

      var parent_record = typesmith.db[record.parent];

      if (parent_record) {
        // we found a valid parent, now look for a subgroup.
        var subgroup_name, subgroup_display_name, subgroup_type;

        var parent_type = parent_record.type;
        var parent_type_config = typesmith.config.types[parent_type] || {};
        var parent_final_config = Object.assign({}, defaults, parent_type_config);

        // start with the subgroup_by_key property.
        var subgroup_by_key = parent_final_config.subgroup_by_key;
        if (subgroup_by_key && subgroup_by_key != '' && record[subgroup_by_key])
        {
          subgroup_display_name = record[subgroup_by_key];
          subgroup_name = parent_record.name + (final_config.scope_separator || '.') + subgroup_display_name;
          subgroup_type = subgroup_by_key;
        }

        // if none, and subgroup_by_type is active, then use the subgroup_title.
        else if (parent_final_config.subgroup_by_type)
        {
          subgroup_display_name = final_config.subgroup_title || record_type;
          subgroup_name = parent_record.name + (final_config.scope_separator || '.') + subgroup_display_name;
          subgroup_type = 'subgroup';
        }

        // reparent to the subgroup or to the parent.
        if (subgroup_name && subgroup_type)
        {
          // do a lookup in the db for the name and type of the new element.
          var subgroup_record = typesmith.lookup_by_name(subgroup_name, subgroup_type)[0];
          // if none, create a new record element in the db.
          if (!subgroup_record)
          {
            subgroup_record = {
              name: subgroup_name,
              type: subgroup_type,
              display_name: subgroup_display_name
            }
            typesmith.add_to_db(subgroup_record);
          }
          // remove this record from its existing parent
          var idx = parent_record.children.indexOf(record.uid);
          if (idx > -1)
          {
            parent_record.children.splice(idx, 1);
          }
          // add this record to the subgroup, and add the subgroup to the parent.
          if (parent_record.children.indexOf(subgroup_record.uid) == -1)
          {
            parent_record.children.push(subgroup_record.uid);
          }
          if (subgroup_record.children.indexOf(record.uid) == -1)
          {
            subgroup_record.children.push(record.uid);
          }
          subgroup_record.parent = parent_record.uid;
          record.parent = subgroup_record.uid;
        }
      }

   });

    done();
  }
}