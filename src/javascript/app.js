Ext.define("workitem-throughput", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box'}
    ],

    integrationHeaders : {
        name : "workitem-throughput"
    },

    config: {
        defaultSettings: {
            throughputMeasure: 'PlanEstimate',
            timeboxGranularity: 'week',
            numberTimeboxes: 6,
            artifactModels: ['Defect','UserStory'],
            allowSettingsOverride: true //If this is false, then the settings won't show on the front
        }
    },

    MAX_TIMEBOXES: 26,

    launch: function() {
        this.initializeApp();
    },
    initializeApp: function() {

        if (this.getAllowSettingsOverride()) {

            this.removeAll();
            this.suspendEvents();
            var selectorCt = this.add({
                xtype: 'container',
                layout: 'hbox'
            });

            var g = selectorCt.add({
                xtype: 'rallycombobox',
                fieldLabel: 'Timebox Granularity',
                labelAlign: 'right',
                name: 'timeboxGranularity',
                itemId: 'timeboxGranularity',
                editable: false,
                store: Ext.create('Rally.data.custom.Store', {
                    data: this.getGranularityData(),
                    fields: ['name', 'value']
                }),
                allowNoEntry: false,
                displayField: 'name',
                valueField: 'value',
                stateful: true,
                margin: 5,
                stateId: 'granularity-data'
            });

            var n = selectorCt.add({
                xtype: 'rallynumberfield',
                fieldLabel: '# Timeboxes',
                labelAlign: 'right',
                itemId: 'numberTimeboxes',
                name: 'numberTimeboxes',
                minValue: 1,
                maxValue: this.MAX_TIMEBOXES,
                stateful: true,
                margin: 5,
                stateId: 'number-timeboxes'
            });

            g.on('change', this.updateDisplay, this);
            n.on('change', this.updateDisplay, this);
        }
        this.updateDisplay();
    },
    updateDisplay: function(){

        if (this.down('rallychart')){
            this.down('rallychart').destroy();
        }

        if (this.down('#messageBox')) {
            this.down('#messageBox').destroy();
        }

        this.logger.log('updateDisplay', this.getNumTimeboxes(), this.getTimeboxGranularity());

        if (!this.getNumTimeboxes() || !this.getTimeboxGranularity()){

            this.add({
                xtype: 'container',
                itemId: 'messageBox',
                html:  '<div class="no-data-container"><div class="secondary-message">Please select a granularity and # timeboxes to calculate throughput for.</div></div>'
            });
            return;
        }

        this.setLoading(true);
        this.fetchWsapiArtifactRecords({
            models: this.getArtifactModels(),
            limit: Infinity,
            fetch: this.getArtifactFetch(),
            filters: this.getArtifactFilters()
        }).then({
            success: this.buildChart,
            failure: this.showErrorNotification,
            scope: this
        }).always(function(){ this.setLoading(false);}, this);
    },
    getNumTimeboxes: function(){

        if (this.getAllowSettingsOverride()){
            return this.down('#numberTimeboxes') &&
                this.down('#numberTimeboxes').getValue() || null;
        }
        return this.getSetting('numberTimeboxes');

    },
    getAllowSettingsOverride: function(){
        return this.getSetting('allowSettingsOverride');
    },
    getTimeboxGranularity: function(){

        if (this.getAllowSettingsOverride()){
            return this.down('#timeboxGranularity') &&
                this.down('#timeboxGranularity').getValue() || null;
        }
        return this.getSetting('timeboxGranularity');
    },
    buildChart: function(records){
        var numTimeboxes = this.getNumTimeboxes(),
            timeboxGranularity = this.getTimeboxGranularity();
        this.logger.log('buildChart: record count, numTimeboxes, TimeboxGranularity', records.length, numTimeboxes, timeboxGranularity);
        var userStories = Ext.Array.filter(records, function(r){ return r.get('_type') === 'hierarchicalrequirement'; }),
            userStoryData = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBucketData(timeboxGranularity,numTimeboxes,userStories,this.getThroughputMeasure(),'AcceptedDate');

        var defects = Ext.Array.filter(records, function(r){ return r.get('_type') === 'defect'; }),
            defectData = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBucketData(timeboxGranularity,numTimeboxes, defects,this.getThroughputMeasure(),'AcceptedDate');

        /**
         * catagories: [week1, week2, ...]
         * series: [{
         *      name: 'User Story',
         *      data: []
         * },{
         *      name: 'Defect',
         *      data: []
         * }]
         */

        var series = [{
            name: 'User Story',
            data: userStoryData
        },{
            name: 'Defect',
            data: defectData
        }];

        var categories = RallyTechServices.workItemThroughput.utils.FlowCalculator.getFormattedBuckets(timeboxGranularity,numTimeboxes);

        if (this.down('rallychart')){
            this.down('rallychart').destroy();
        }

        this.add({
            xtype:'rallychart',
            chartColors: ['#21A2E0','#f9a814'],
            context: this.getContext(),
            chartConfig: this.getChartConfig(),
            loadMask: false,
            chartData: {
                series: series,
                categories: categories
            }
        });


    },
    getChartConfig: function(){
        return {
            chart: {
                type: 'column'
            },
            title: {
                text: this.getChartTitle(),
                style: {
                    color: '#666',
                    fontSize: '18px',
                    fontFamily: 'ProximaNova',
                    textTransform: 'uppercase',
                    fill: '#666'
                }
            },
            subtitle: {
                text: this.getSubtitle()
            },

            xAxis: {
                title: {
                    text: null,
                    style: {
                        color: '#444',
                        fontFamily: 'ProximaNova',
                        textTransform: 'uppercase',
                        fill: '#444'
                    }
                },
                labels: {
                    style: {
                        color: '#444',
                        fontFamily: 'ProximaNova',
                        fill: '#444'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: this.getSubtitle(),
                    style: {
                        color: '#444',
                        fontFamily: 'ProximaNova',
                        textTransform: 'uppercase',
                        fill: '#444'
                    }
                },
                labels: {
                    overflow: 'justify',
                    style: {
                        color: '#444',
                        fontFamily: 'ProximaNova',
                        fill: '#444'
                    }
                }
            },
            tooltip: {
                valueSuffix: this.getValueSuffix(),
                backgroundColor: '#444',
                useHTML: true,
                borderColor: '#444',
                style: {
                    color: '#FFF',
                    fontFamily: 'ProximaNova',
                    fill: '#444'
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            legend: {
                itemStyle: {
                    color: '#444',
                    fontFamily: 'ProximaNova',
                    textTransform: 'uppercase'
                },
                borderWidth: 0
            }
        };
    },
    getValueSuffix: function(){
        var throughputMeasure = Ext.Array.filter(this.getThroughputMeasureData(), function(g){ return g.value === this.getThroughputMeasure(); }, this);

        if (!throughputMeasure || throughputMeasure.length === 0){
            return " Work Items";
        }
        return throughputMeasure[0].suffix;

    },
    getSubtitle: function(){
        var throughputMeasure = Ext.Array.filter(this.getThroughputMeasureData(), function(g){ return g.value === this.getThroughputMeasure(); }, this);

        if (!throughputMeasure || throughputMeasure.length === 0){
            return "Count of Work Items";
        }
        return Ext.String.format("Sum of {0}", throughputMeasure[0] && throughputMeasure[0].name);
    },
    getChartTitle: function(){
        var timebox = Ext.Array.filter(this.getGranularityData(), function(g){ return g.value === this.getTimeboxGranularity(); }, this);

        return Ext.String.format("{0} Throughput", timebox[0] && timebox[0].name);
    },
    showErrorNotification: function(msg){
        Rally.ui.notify.Notifier.showError({
            message: msg,
            allowHTML: true
        });
    },
    getArtifactModels: function(){
        return this.getSetting('artifactModels');
    },
    getArtifactFetch: function(){
        return ['ObjectID','AcceptedDate','DirectChildrenCount', this.getThroughputMeasure()];
    },
    getArtifactFilters: function(){
        var numTimeboxes = this.getNumTimeboxes(),
            timeboxGranularity = this.getTimeboxGranularity();

        var startDate = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary(timeboxGranularity,numTimeboxes);

        return [{
            property: 'AcceptedDate',
            operator: '>=',
            value: Rally.util.DateTime.toIsoString(startDate)
        }];
    },
    getThroughputMeasure: function(){
        return this.getSetting('throughputMeasure');
    },
    fetchWsapiArtifactRecords: function(config){
        var deferred = Ext.create('Deft.Deferred');

        if (!config.limit){ config.limit = "Infinity"; }
        if (!config.pageSize){ config.pageSize = 2000; }
        Ext.create('Rally.data.wsapi.artifact.Store',config).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.reject('Error fetching artifact records: ' + operation.error && operation.error.errors.join('<br/>'));
                }
            }
        });

        return deferred.promise;
    },
    getThroughputMeasureData: function(){
        //summable fields on the Schedulable Artifact
        return [{
            name: 'Plan Estimate',
            value: 'PlanEstimate',
            suffix: ' Points'
        },{
            name: 'Task Actual Total',
            value: 'TaskActualTotal',
            suffix: ' Hours'
        },{
            name: 'Task Estimate Total',
            value: 'TaskEstimateTotal',
            suffix: ' Hours'
        }];
    },
    getGranularityData: function(){
        return [{
            name: 'Weekly',
            value: 'week'
        },{
            name: 'Monthly',
            value: 'month'
        },{
            name: 'Quarterly',
            value: 'quarter'
        }];
    },
    getSettingsFields: function(){

        return [{
            xtype: 'rallycombobox',
            fieldLabel: 'Throughput Measure',
            labelAlign: 'right',
            labelWidth: 200,
            name: 'throughputMeasure',
            store: Ext.create('Rally.data.custom.Store', {
                data: this.getThroughputMeasureData(),
                fields: ['name', 'value']
            }),
            allowNoEntry: true,
            noEntryText: 'Count',
            displayField: 'name',
            valueField: 'value'
        },{
            xtype: 'rallycheckboxfield',
            fieldLabel: 'Allow settings change by users',
            labelAlign: 'right',
            labelWidth: 200,
            name: 'allowSettingsOverride'
        },{
            xtype: 'rallycombobox',
            fieldLabel: 'Timebox Granularity',
            labelAlign: 'right',
            labelWidth: 200,
            name: 'timeboxGranularity',
            store: Ext.create('Rally.data.custom.Store', {
                data: this.getGranularityData(),
                fields: ['name', 'value']
            }),
            allowNoEntry: false,
            displayField: 'name',
            valueField: 'value'
        },{
            xtype: 'rallynumberfield',
            fieldLabel: '# Timeboxes',
            labelAlign: 'right',
            labelWidth: 200,
            name: 'numberTimeboxes',
            minValue: 1,
            maxValue: this.MAX_TIMEBOXES
        }];

    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },

    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    }

});
