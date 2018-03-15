
var merge_options = require('merge-options');

module.exports = plugin;

function plugin(opts) {

  var plugin_defaults = {
    subgroup_by_type:false,
    subgroup_by_key:'',
    default_subgroup:{
      page:false,
      toc:{
        autoexpand:true
      },
      typeahead:{
        include:false
      }
    }
  }

  return function(typesmith, done){

    var config = merge_options.call({concatArrays: true}, {}, plugin_defaults, typesmith.config['typesmith-subgroup'], opts);

    typesmith.db.all().forEach( function(record) {

      var record_type_config = typesmith.config.types[record.type] || {};
      var type_config = merge_options.call({concatArrays: true}, {}, config, record_type_config, record);

      var parents = typesmith.db.parents_of(record);
      for (var i_parent = 0; i_parent < parents.length; i_parent++)
      {
        var parent_record = parents[i_parent];

        // we have a valid parent, now look for a subgroup.
        var subgroup_name, subgroup_display_name, subgroup_type;

        var parent_type_config = typesmith.config.types[parent_record.type];
        if (parent_record == typesmith.db.root) { parent_type_config = typesmith.config.types['root'] }
        var parent_type_config = merge_options.call({concatArrays: true}, {}, config, parent_type_config, parent_record);

        // start with the subgroup_by_key property.
        var subgroup_key = parent_type_config.subgroup_by_key;
        if (subgroup_key && subgroup_key != '' && record[subgroup_key])
        {
          // TODO: rationalize these
          subgroup_display_name = type_config.default_subgroup.content_title || record[subgroup_key];
          subgroup_name = parent_record.uid + '_' + subgroup_display_name;
          subgroup_type = type_config.default_subgroup.type || subgroup_key;
        }

        // if no key, and subgroup_by_type is active.
        else if (parent_type_config.subgroup_by_type)
        {
          // TODO: rationalize these
          subgroup_display_name = type_config.default_subgroup.content_title || record.type;
          subgroup_name = parent_record.uid + '_' + subgroup_display_name;
          subgroup_type = type_config.default_subgroup.type || 'subgroup';
        }

        // reparent record to the subgroup
        if (subgroup_name && subgroup_type)
        {
          // do a lookup in the db for the name and type of the new element.
          var subgroup_record = typesmith.db.find({name:subgroup_name, type:subgroup_type});
          // if none, create a new record element in the db.
          if (!subgroup_record)
          {
            subgroup_record = merge_options({}, config.default_subgroup);
            subgroup_record.name = subgroup_name;
            subgroup_record.type = subgroup_type;
            subgroup_record.content_title = subgroup_display_name;
            typesmith.db.add(subgroup_record);
          }

          // add subgroup as a new child of the old parent
          // a subgroup is specific to a particular parent, so it's fine to wipe out any existing parents.
          typesmith.db.add_parent(subgroup_record, parent_record, true);
          // add the subgroup as a new parent of the record
          typesmith.db.remove_parent(record, parent_record);
          typesmith.db.add_parent(record, subgroup_record);
        }
      }

   });

    done();
  }
}