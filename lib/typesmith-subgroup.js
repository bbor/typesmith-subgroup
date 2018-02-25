
var merge_options = require('merge-options');

module.exports = plugin;

function plugin(opts) {

  var plugin_defaults = {
    subgroup_by_type:true,
    subgroup_by_key:'',
    autoexpand_subgroups:true
  }

  return function(typesmith, done){

    var config = merge_options.call({concatArrays: true}, {}, plugin_defaults, typesmith.config['typesmith-subgroup'], opts);

    Object.keys(typesmith.db).forEach( function(uid) {
      var record = typesmith.db[uid];

      if (!record.parent) { return; }

      var record_type_config = typesmith.config.types[record.type] || {};
      var type_config = merge_options.call({concatArrays: true}, {}, config, record_type_config, record);

      var parent_record = typesmith.db[record.parent];
      if (parent_record) {
        // we found a valid parent, now look for a subgroup.
        var subgroup_name, subgroup_display_name, subgroup_type;

        var parent_type_config = typesmith.config.types[parent_record.type] || {};
        var parent_type_config = merge_options.call({concatArrays: true}, {}, config, parent_type_config, parent_record);

        // start with the subgroup_by_key property.
        var subgroup_key = parent_type_config.subgroup_by_key;
        if (subgroup_key && subgroup_key != '' && record[subgroup_key])
        {
          // TODO: rationalize these
          subgroup_display_name = record[subgroup_key];
          subgroup_name = parent_record.name + (type_config.scope_separator || '.') + subgroup_display_name;
          subgroup_type = subgroup_key;
        }

        // if none, and subgroup_by_type is active, then use the subgroup_title.
        else if (parent_type_config.subgroup_by_type)
        {
          // TODO: rationalize these
          subgroup_display_name = type_config.subgroup_title || record.type;
          subgroup_name = parent_record.name + (type_config.scope_separator || '.') + subgroup_display_name;
          subgroup_type = 'subgroup';
        }

        // reparent record to the subgroup
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
              display_name: subgroup_display_name,
              page: false,
              typeahead: {
                include: false
              }
            }
            if (config.autoexpand_subgroups) {
              subgroup_record.toc = {
                autoexpand:true
              }
            }
            typesmith.add_to_db(subgroup_record);
          }
          // remove this record from its existing parent
          // TODO: I should make some simple functions to do these things.
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