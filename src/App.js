Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    mixins: {
        observable: 'Ext.util.Observable',
        maskable: 'Rally.ui.mask.Maskable'
    },

    scopeType: 'release',
    componentCls: 'app',

    stories: null,
    features: null,
    initiatives: null,

    constructor: function (config) {
      this.callParent([config]);
      this.mixins.observable.constructor.call(this, config);
      //this.mixins.maskable.constructor.call(this, {maskMsg: 'Loading...'});

      this.addEvents('load');
    },

    addContent: function(tb) {
      var me = this;
      console.dir(this.getContext());

      me.on('load', function () {
        console.log('loaded');
        me._onLoad(me);
      });

      me.onScopeChange(tb);
    },

    onScopeChange: function (tb) {
      var me = this;

      me.initiatives = null;
      me.features = null;
      me.stories = null;
      me.projects = null;

      me.loadData(tb);
    },

    loadData: function (tb) {
      var me = this;

      me.showMask();

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

      Ext.create('Rally.data.WsapiDataStore', {
        model: 'Project',
        fetch: true,
        listeners: {
          load: me._projectsLoaded,
          scope: me
        }
      }).load();
    },

    _projectsLoaded: function (store, recs, success) {
      var me = this;
      //var pis = {};

      //Ext.Array.each([__PROJECT_OIDS_IN_SCOPE__], function (elt) {
        //pis[elt] = 1;
      //});

      me.projects = {};

      Ext.Array.each(recs, function (elt) {
        //if ((elt.get('Children').length === 0) && (pis.hasOwnProperty(elt.get('ObjectID')))) {
        me.projects[elt.get('ObjectID')] = elt;
        //}
      });

      if (me.stories && me.features && me.initiatives && me.projects) {
        me.fireEvent('load', me);
      }
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

      if (me.stories && me.features && me.initiatives && me.projects) {
        me.fireEvent('load', me);
      }
    },

    _storiesLoaded: function (store, recs, success) {
      var me = this;
      me.stories = {};

      Ext.Array.each(recs, function(elt) {
        me.stories[parseInt(elt.get('ObjectID') + '', 10)] = elt;
      });

      if (me.stories && me.features && me.initiatives && me.projects) {
        me.fireEvent('load', me);
      }
    },

    _initiativesLoaded: function (store, recs, success) {
      var me = this;
      me.initiatives = {};

      Ext.Array.each(recs, function(elt) {
        me.initiatives[parseInt(elt.get('ObjectID') + '', 10)] = elt;
      });

      if (me.stories && me.features && me.initiatives && me.projects) {
        me.fireEvent('load', me);
      }
    },

    _onLoad: function (me) {
      me.hideMask();
      console.log(me);
    }
});
