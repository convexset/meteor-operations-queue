Package.describe({
	name: 'convexset:operations-queue',
	version: '0.1.2',
	summary: 'A client-side task queue for tasks with pre-requisites and resource requirements',
	git: 'https://github.com/convexset/meteor-operations-queue',
	documentation: '../../README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.0.2');
	api.use(['ecmascript', 'underscore', 'convexset:package-utils@0.1.9'], 'client');
	api.addFiles(['operations-queue.js'], 'client');
    api.export('OperationsQueue', 'client');
});

Package.onTest(function(api) {
	api.use(['tinytest', 'test-helpers'], 'client');
	api.use(['ecmascript', 'underscore', 'convexset:operations-queue'], 'client');
	api.addFiles(['tests.js'], 'client');
});