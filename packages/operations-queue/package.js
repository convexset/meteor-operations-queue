Package.describe({
	name: 'convexset:operations-queue',
	version: '0.2.1',
	summary: 'A task queue for tasks with pre-requisites and resource requirements',
	git: 'https://github.com/convexset/meteor-operations-queue',
	documentation: '../../README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.0.2');
	api.use(['ecmascript', 'underscore']);
	api.addFiles('operations-queue.js');
    api.export('OperationsQueue');
});

Package.onTest(function(api) {
	api.use(['tinytest', 'test-helpers']);
	api.use(['ecmascript', 'underscore', 'convexset:operations-queue']);
	api.addFiles(['tests.js']);
});