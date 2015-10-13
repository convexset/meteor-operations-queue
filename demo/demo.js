/* global OperationsQueue: true */

// Example:
// Wherein the dependencies look like:
// t11 -\
// t12 -+- t2 -+- t3
// t13 --------/
if (Meteor.isClient) {
	Meteor.startup(function() {
		OperationsQueue.debugModeOn();
		console.log("[OperationsQueue] Debug Mode On");
		console.log("");


		var opsQueue = new OperationsQueue({
			availableResources: {
				x: 1,
				y: 2
			}
		});
		var t11 = opsQueue.createTask({
			name: "t11",
			priority: 4,
			resourceUse: {
				x: 1,
				y: 1
			},
			taskDependencies: [],
			task: function() {
				return 1;
			}
		});
		var t12 = opsQueue.createTask({
			name: "t12",
			priority: 8,
			resourceUse: {
				y: 1
			},
			taskDependencies: [],
			task: function() {
				return 10;
			}
		});

		var t2 = opsQueue.createTask({
			name: "t2-promise",
			priority: 4,
			resourceUse: {
				x: 1
			},
			taskDependencies: [t11, t12],
			task: function(a, b) {
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						resolve(a + b);
					}, 1000);
					if (a + b > 1000000) {
						reject("inputs-too-big: I just want to placate JSHint.");
					}
				});
			},
			is_synchronous: false
		});
		var t13 = opsQueue.createTask({
			name: "t13",
			priority: 7,
			resourceUse: {
				x: 1,
				y: 1
			},
			taskDependencies: [],
			task: function() {
				return 100;
			}
		});
		var t3 = opsQueue.createTask({
			name: "t3",
			priority: 7,
			resourceUse: {
				x: 1,
				y: 1
			},
			taskDependencies: [t2, t13],
			task: function(a_async, b) {
				return a_async.result + b;
			}
		});

		var allTasks = {
			t11: t11,
			t12: t12,
			t13: t13,
			t2: t2,
			t3: t3
		};

		console.log("**********************************");
		console.log("* Begin Operations Queue Example *");
		console.log("**********************************");
		opsQueue.start();
		var pre_abort_wait = Math.floor(Math.random() * 5000);
		setTimeout(function() {
			console.log("Trying to send abort. (After " + pre_abort_wait + "ms)");
			try {
				opsQueue.abort();
			} catch (e) {
				console.log("Failed to abort: " + e);
			}
			var allTaskData = opsQueue.getTaskData();
			console.log(allTaskData);
			setTimeout(function() {
				console.log("********************************");
				console.log("* End Operations Queue Example *");
				console.log("********************************");

				var taskCompletionTime, taskStartTime;
				for (var tId in allTasks) {
					if (allTasks.hasOwnProperty(tId)) {
						taskCompletionTime = allTaskData.taskCompletionTime[allTasks[tId]];
						taskStartTime = allTaskData.taskStartTime[allTasks[tId]];

						if (!!taskStartTime) {
							$("#start-" + tId).text(new Date(taskStartTime));
							if (!!taskCompletionTime) {
								$("#completion-" + tId).text(new Date(taskCompletionTime));
								$("#duration-" + tId).text(taskCompletionTime - taskStartTime);
							} else {
								$("#completion-" + tId).text("NA");
								$("#duration-" + tId).text("NA");
							}
						} else {
							$("#start-" + tId).text("NA");
						}
					}
				}
			}, 2000);
		}, pre_abort_wait);
	});
}