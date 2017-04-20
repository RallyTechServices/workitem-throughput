Ext.define('RallyTechServices.workItemThroughput.utils.FlowCalculator',{
    singleton: true,

    dateMapping: {
        week: {
            dateFormat: 'w',
            dateUnit: 'week',
            unitMultiplier: 1,
            dateFormat: 'Y-m-d'
        },
        month: {
            dateFormat: 'm',
            dateUnit: 'month',
            unitMultiplier: 1,
            dateFormat: 'M-y'
        },
        quarter: {
            dateFormat: 'm',
            dateUnit: 'month',
            unitMultiplier: 3,
            dateFormat: 'M-y'
        }
    },

    getFormattedBuckets: function(incrementType, numberOfIncrements, endDate){
        var buckets = this.getBuckets(incrementType, numberOfIncrements, endDate);

        var dateMapping = RallyTechServices.workItemThroughput.utils.FlowCalculator.dateMapping[incrementType];
        if (!dateMapping || !buckets || buckets.length === 0){
            return [];
        }

        return _.map(buckets, function(b){ return Rally.util.DateTime.format(b.start, dateMapping.dateFormat); });


    },

    getBuckets: function(incrementType, numberOfIncrements, endDate){

        var bucketDate = RallyTechServices.workItemThroughput.utils.FlowCalculator.getStartDateBoundary(incrementType, numberOfIncrements, endDate);
        if (!bucketDate){
             return [];
        }

        var unitMultiplier = RallyTechServices.workItemThroughput.utils.FlowCalculator.dateMapping[incrementType].unitMultiplier,
            unit = RallyTechServices.workItemThroughput.utils.FlowCalculator.dateMapping[incrementType].dateUnit;

        var buckets = [],
            i = 0;

        var startDate = bucketDate;
        while (i < numberOfIncrements){
            i++;
            var endDate = Rally.util.DateTime.add(bucketDate, unit, i * unitMultiplier);
            buckets.push({start: startDate, end: endDate});
            startDate = endDate;
        }
        return buckets;
    },

    getBucketData: function(timeboxGranularity,numTimeboxes, records, field, dateField, endDate){

        var buckets = RallyTechServices.workItemThroughput.utils.FlowCalculator.getBuckets(timeboxGranularity,numTimeboxes, endDate);

        var bucketData = _.map(buckets, function(b){ return 0; });

        for (var i=0; i < records.length; i++){
            var x = 1,
                dt = records[i].get(dateField),
                hasChildren = records[i].get('DirectChildrenCount') || 0;

            if (field && field !== 'count'){
                x = records[i].get(field) || 0;
            }

            if (hasChildren === 0){
                for (var j=0; j<buckets.length; j++){
                    if (dt >= buckets[j].start && dt < buckets[j].end){
                        bucketData[j] += x;
                        j = buckets.length;
                    }
                }
            }
        }

        return bucketData;
    },

    getStartDateBoundary: function(incrementType, numberOfIncrements, endDate){
        var   dateMapping = RallyTechServices.workItemThroughput.utils.FlowCalculator.dateMapping;

        if ((numberOfIncrements < 1) || (!dateMapping[incrementType])){ return null; }

        var currentDate = endDate || new Date(),
            dateUnit =  dateMapping[incrementType].dateUnit,
            incrementQuantity = numberOfIncrements * dateMapping[incrementType].unitMultiplier,
            startDate = Rally.util.DateTime.add(currentDate, dateUnit, -incrementQuantity);

        return RallyTechServices.workItemThroughput.utils.FlowCalculator.getBeginningOfIncrement(startDate, incrementType);

    },
    getBeginningOfIncrement: function(date, incrementType){

        var shiftedDate = new Date(date);
        shiftedDate.setHours(0);
        shiftedDate.setMinutes(0);
        shiftedDate.setSeconds(0);

        if (incrementType === 'week'){
            var day = shiftedDate.getDay();
            if (day === 0){ //Sunday
                return shiftedDate;
            }

            shiftedDate = Rally.util.DateTime.add(shiftedDate,"day",-day);
            return shiftedDate;
        }

        shiftedDate.setDate(1);  //if we are here, increment type is either month or quarter.  either way, we want the day set to the first of hte month.

        if (incrementType === 'month'){
            return new Date(shiftedDate.getFullYear(), shiftedDate.getMonth(), 1);
        }

        if (incrementType === 'quarter'){
           var month = shiftedDate.getMonth(),
               quarterStart = Math.floor(month/3) * 3;  //0-based month

           shiftedDate.setMonth(quarterStart);
           return shiftedDate;
        }
        return null;
    },
    shiftDateToMonday: function(check_date) {
        var day = check_date.getDay();

        var delta = 0;

        if ( day === 0 ) {
            // it's Sunday
            delta = 1;
        }
        if ( day === 6 ) {
            delta = 2;
        }

        var shifted_date = check_date;
        if ( delta > 0 ) {
            shifted_date = new Date(check_date.setHours(0));
            shifted_date = Rally.util.DateTime.add(shifted_date,"day",delta);
        }
        return shifted_date;
    },
});
