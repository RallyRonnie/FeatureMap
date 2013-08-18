Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    mixins: {
        observable: 'Ext.util.Observable'
    },

    scopeType: 'release',
    componentCls: 'app',

    stories: null,
    features: null,
    initiatives: null,

    constructor: function (config) {
      this.callParent([config]);
      this.mixins.observable.constructor.call(this, config);

      this.addEvents('load');
    },

    launch: function() {
      var me = this;
      var tb = this.getContext().getTimeboxScope();
      console.dir(this.getContext());

      me.on('load', function () {
        console.log('loaded');
        me._onLoad(me);
      });

      Ext.create('Rally.data.WsapiDataStore', {
        model: 'PortfolioItem/Feature',
        fetch: true,
        filters: tb.getQueryFilter(),
        listeners: {
          load: me._featuresLoaded,
          scope: me
        }
      }).load();

      Ext.create('Rally.data.WsapiDataStore', {
        model: 'HierarchicalRequirement',
        fetch: true,
        filters: [{
          property: 'Feature.Release.Name',
          value: tb.getRecord().get('Name')
        }, {
          property: 'Feature.Release.ReleaseStartDate',
          value: tb.getRecord().raw.ReleaseStartDate
        }, {
          property: 'Feature.Release.ReleaseDate',
          value: tb.getRecord().raw.ReleaseDate
        }, {
          property: 'DirectChildrenCount',
          value: 0
        }],
        listeners: {
          load: me._storiesLoaded,
          scope: me
        }
      }).load();
    },

    _featuresLoaded: function (store, recs, success) {
      var initiatives = {};
      var query = [];
      var me = this;

      me.features = {};

      Ext.Array.each(recs, function(elt) {
        if (elt.get('Parent')) {
          initiatives[Rally.util.Ref.getOidFromRef(elt.get('Parent')._ref)] = 1;
        }
        me.features[parseInt(elt.get('ObjectID') + '', 10)] = elt;
      });

      Ext.Object.each(initiatives, function(key) {
        query.push({property: 'ObjectID', operator: '=', value: key});
      });

      Ext.create('Rally.data.WsapiDataStore', {
        model: 'PortfolioItem/Initiative',
        filters: query,
        fetch: true,
        listeners: {
          load: me._initiativesLoaded,
          scope: me
        }
      }).load();

      if (me.stories && me.features && me.initiatives) {
        me.fireEvent('load', me);
      }
    },

    _storiesLoaded: function (store, recs, success) {
      var me = this;
      me.stories = {};

      Ext.Array.each(recs, function(elt) {
        me.stories[parseInt(elt.get('ObjectID') + '', 10)] = elt;
      });

      if (me.stories && me.features && me.initiatives) {
        me.fireEvent('load', me);
      }
    },

    _initiativesLoaded: function (store, recs, success) {
      var me = this;
      me.initiatives = {};

      Ext.Array.each(recs, function(elt) {
        me.initiatives[parseInt(elt.get('ObjectID') + '', 10)] = elt;
      });

      if (me.stories && me.features && me.initiatives) {
        me.fireEvent('load', me);
      }
    },

    _onLoad: function (me) {
      console.log(me);
    }
});
