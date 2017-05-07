describe("Example test set", function() {
    it("should have written tests",function(){
        expect(false).toBe(false);

    });
    
    it('should render the app', function() {
        var app = Rally.test.Harness.launchApp("workitem-throughput");
        expect(app.getEl()).toBeDefined();
    });

    it('should have settings', function() {
        var app = Rally.test.Harness.launchApp('workitem-throughput');

        expect(app.getSettingsFields()).toBeDefined();
        expect(app.getSettingsFields().length).toBe(4);

        expect(app.getSetting('numberTimeboxes')).toBe(app.config.defaultSettings.numberTimeboxes);

    });
    
});
