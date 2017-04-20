describe("Flow Calculator", function() {

    it ("should calculate the beginning of increments accurately", function(){
        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBeginningOfIncrement(new Date('4/19/2017'),'week');
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-04-16');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBeginningOfIncrement(new Date('4/19/2017'),'month');
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-04-01');


        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBeginningOfIncrement(new Date('4/16/2017'),'week');
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-04-16');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBeginningOfIncrement(new Date('4/15/2017'),'week');
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-04-09');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBeginningOfIncrement(new Date('4/01/2017'),'month');
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-04-01');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBeginningOfIncrement(new Date('3/31/2017'),'month');
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-03-01');

    });

    it("should calculate the appropriate start date boundary",function(){

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('week',6,new Date('4/19/2017'));
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-03-05');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('month',6,new Date('4/19/2017'));
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2016-10-01');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('quarter',3,new Date('4/19/2017'));
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2016-07-01');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('quarter',1, new Date('4/1/2017'));
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-01-01');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('quarter',1,new Date('5/01/2017'));
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-01-01');

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('quarter',1,new Date('7/19/2017'));
        expect(Ext.Date.format(dt,'Y-m-d')).toEqual('2017-04-01');

    });

    it("should return null for bogus increment types or increments that are less than 1",function(){

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('bogus',6,new Date('4/19/2017'));
        expect(dt).toBeNull();

        var dt = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary('week',0,new Date('4/19/2017'));
        expect(dt).toBeNull();

    });

    it("should calculate the buckets for week", function(){

        var increments = 6,
            endDate = new Date('4/19/2017');

        var buckets = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBuckets('week',increments,endDate);

        expect(buckets.length).toBe(increments);

        expect(Ext.Date.format(buckets[0].start,'Y-m-d')).toEqual('2017-03-05');
        expect(Ext.Date.format(buckets[1].start,'Y-m-d')).toEqual('2017-03-12');
        expect(Ext.Date.format(buckets[2].start,'Y-m-d')).toEqual('2017-03-19');
        expect(Ext.Date.format(buckets[3].start,'Y-m-d')).toEqual('2017-03-26');
        expect(Ext.Date.format(buckets[4].start,'Y-m-d')).toEqual('2017-04-02');
        expect(Ext.Date.format(buckets[5].start,'Y-m-d')).toEqual('2017-04-09');
        expect(Ext.Date.format(buckets[5].end,'Y-m-d')).toEqual('2017-04-16');

    });

    it("should calculate the buckets for month", function(){

        var increments = 3,
            endDate = new Date('4/19/2017');

        var buckets = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBuckets('month',increments,endDate);

        expect(buckets.length).toBe(increments);

        expect(Ext.Date.format(buckets[0].start,'Y-m-d')).toEqual('2017-01-01');
        expect(Ext.Date.format(buckets[1].start,'Y-m-d')).toEqual('2017-02-01');
        expect(Ext.Date.format(buckets[2].start,'Y-m-d')).toEqual('2017-03-01');
        expect(Ext.Date.format(buckets[2].end,'Y-m-d')).toEqual('2017-04-01');

    });

    it ("should calculate the bucket data accurately", function(){
        var records = [
            Ext.create("mockStory", {PlanEstimate: 4, AcceptedDate: new Date('01/02/2017') }),
            Ext.create("mockStory", {PlanEstimate: 5, AcceptedDate: new Date('02/01/2017') }),
            Ext.create("mockStory", {PlanEstimate: 3, AcceptedDate: new Date('02/28/2017') }),
            Ext.create("mockStory", {PlanEstimate: 1, AcceptedDate: new Date('03/02/2017') }),
            Ext.create("mockStory", {PlanEstimate: 7, AcceptedDate: new Date('04/02/2017') })
        ];
        var data = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBucketData('month',5,records,'PlanEstimate','AcceptedDate');
        expect(data[0]).toEqual(0);
        expect(data[1]).toEqual(0);
        expect(data[2]).toEqual(4);
        expect(data[3]).toEqual(8);
        expect(data[4]).toEqual(1);

    });

    it ("should calculate the bucket data accurately when some of the stories have children", function(){
        var records = [
            Ext.create("mockStory", {PlanEstimate: 4, AcceptedDate: new Date('01/02/2017') }),
            Ext.create("mockStory", {PlanEstimate: 5, AcceptedDate: new Date('02/01/2017') }),
            Ext.create("mockStory", {PlanEstimate: 3, AcceptedDate: new Date('02/28/2017'), DirectChildrenCount: 5 }),
            Ext.create("mockStory", {PlanEstimate: 1, AcceptedDate: new Date('03/02/2017') }),
            Ext.create("mockStory", {PlanEstimate: 7, AcceptedDate: new Date('04/02/2017') })
        ];
        var data = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBucketData('month',5,records,'PlanEstimate','AcceptedDate');
        expect(data[0]).toEqual(0);
        expect(data[1]).toEqual(0);
        expect(data[2]).toEqual(4);
        expect(data[3]).toEqual(5);
        expect(data[4]).toEqual(1);

    });


});
