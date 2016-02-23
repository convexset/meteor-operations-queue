/* global OperationsQueue: true */
/* global testAsyncMulti: true */

function mapAndSortAscending(o) {
	return _.map(o, function(v, k) {
		return {
			id: k,
			value: v
		};
	}).sort(function(a, b) {
		if (a.value > b.value) {
			return 1;
		}
		if (a.value < b.value) {
			return -1;
		}
		return 0;
	});
}

function checkOutput(name, test, expectedOutput) {
	return function(output) {
		// Figure out what to check
		var thingToCheck = output.result;
		if (thingToCheck !== expectedOutput) {
			console.log("[Failed] (" + name + ") Expected:", expectedOutput, " | Actual: ", thingToCheck);
		}
		test.isTrue(thingToCheck === expectedOutput, "(" + name + ") Expected Output: " + expectedOutput);
	};
}

function completionCallBack(name, test, data) {
	return function(completed, incomplete) {
		var precedences = data.precedences;
		var resourceAvailability = data.resourceAvailability;
		var resourceRequirements = data.resourceRequirements;
		var taskData = data.opsQueue.getTaskData();

		// All Done
		test.length(incomplete, 0);

		// Test Precedences
		precedences.forEach(function(tc) {
			tc.dependencies.forEach(function(depId) {
				test.isTrue(taskData.taskCompletionTime[depId] <= taskData.taskStartTime[tc.task], "(" + name + ") " + taskData.taskCompletionTime[depId] + " done before " + taskData.taskStartTime[tc.task]);
			});
		});

		// Resource Feasibility
		var currRes = _.extend({}, resourceAvailability);
		var currTime = -Infinity;
		var sIdx = -1;
		var cIdx = -1;
		var startTimes = mapAndSortAscending(taskData.taskStartTime);
		var completionTimes = mapAndSortAscending(taskData.taskCompletionTime);
		var currTask;

		/*
		var q;
		for (q = 0; q < startTimes.length; q++) {
			console.log("{{{StartTime}}}", startTimes[q], q > 0 ? startTimes[q].value - startTimes[q - 1].value : "-");
		}
		for (q = 0; q < completionTimes.length; q++) {
			console.log("{{{CompletionTime}}}", completionTimes[q], q > 0 ? completionTimes[q].value - completionTimes[q - 1].value : "-");
		}
		//*/

		while ((sIdx < startTimes.length) || (cIdx < completionTimes.length)) {
			// Get next
			if ((completionTimes[cIdx + 1] && completionTimes[cIdx + 1].value || Infinity) <= (startTimes[sIdx + 1] && startTimes[sIdx + 1].value || Infinity)) {
				// Ending Task Next
				cIdx += 1;
				currTime = completionTimes[cIdx].value;
				currTask = completionTimes[cIdx].id;
				_.forEach(resourceRequirements[currTask], function(v, k) {
					currRes[k] += v;
				});
				//console.log("[[end]] " + currTask + " @ " + currTime, currTask, resourceRequirements[currTask], "|", currRes)
			} else {
				// Starting Task Next
				sIdx += 1;
				currTime = startTimes[sIdx].value;
				currTask = startTimes[sIdx].id;
				_.forEach(resourceRequirements[currTask], function(v, k) {
					currRes[k] -= v;
				});
				//console.log("[[start]] " + currTask + " @ " + currTime, resourceRequirements[currTask], "|", currRes)
			}

			_.forEach(resourceAvailability, function(v, k) {
				test.isTrue(currRes[k] >= 0, "Resource " + k + " (" + currRes[k] + ") non-negative at " + currTime);
			});

			if ((sIdx >= startTimes.length - 1) && (cIdx >= completionTimes.length - 1)) {
				_.forEach(resourceAvailability, function(v, k) {
					test.equal(currRes[k], v, "Ending Resource Level for " + k + " = " + v);
				});

				break;
			}
		}
	};
}

testAsyncMulti('[OperationsQueue] Completion, Precedences and Resource Feasibility', [

	function(test, expect) {
		var precedences = [];
		var resourceAvailability = {
			x: 2,
			y: 3,
			z: 5
		};
		var resourceRequirements = {};

		var data = {
			precedences: precedences,
			resourceAvailability: resourceAvailability,
			resourceRequirements: resourceRequirements
		};
		var opsQueue = new OperationsQueue({
			availableResources: resourceAvailability,
			terminationCallBack: expect(completionCallBack("The Example", test, data))
		});
		data.opsQueue = opsQueue;

		var resUse, deps;

		(function() {
			// The Example
			resUse = {
				x: 1,
				y: 1
			};
			deps = [];
			var t11 = opsQueue.createTask({
				name: "t11",
				priority: 4,
				resourceUse: resUse,
				taskDependencies: deps,
				task: function() {
					return 1;
				},
				taskCompletionCallBack: expect(checkOutput("t11", test, 1))
			});
			resourceRequirements[t11] = resUse;

			resUse = {
				y: 1
			};
			deps = [];
			var t12 = opsQueue.createTask({
				name: "t12",
				priority: 8,
				resourceUse: resUse,
				taskDependencies: deps,
				task: function() {
					return 10;
				},
				taskCompletionCallBack: expect(checkOutput("t12", test, 10))
			});
			resourceRequirements[t12] = resUse;

			resUse = {
				x: 1
			};
			deps = [t11, t12];
			var t2 = opsQueue.createTask({
				name: "t2-promise",
				priority: 4,
				resourceUse: resUse,
				taskDependencies: deps,
				task: function(a, b) {
					return new Promise(function(resolve) {
						setTimeout(function() {
							resolve(a.result + b.result);
						}, 10);
					});
				},
				taskCompletionCallBack: expect(checkOutput("t2", test, 11))
			});
			precedences.push({
				task: t2,
				dependencies: deps
			});
			resourceRequirements[t2] = resUse;

			resUse = {
				x: 1,
				y: 1
			};
			deps = [];
			var t13 = opsQueue.createTask({
				name: "t13",
				priority: 7,
				resourceUse: resUse,
				taskDependencies: deps,
				task: function() {
					return 100;
				},
				taskCompletionCallBack: expect(checkOutput("t13", test, 100))
			});
			resourceRequirements[t13] = resUse;

			resUse = {
				x: 1,
				y: 1
			};
			deps = [t2, t13];
			var t3 = opsQueue.createTask({
				name: "t3",
				priority: 7,
				resourceUse: resUse,
				taskDependencies: deps,
				task: function(a, b) {
					return a.result + b.result;
				},
				taskCompletionCallBack: expect(checkOutput("t3", test, 111))
			});
			precedences.push({
				task: t3,
				dependencies: deps
			});
			resourceRequirements[t3] = resUse;
		})();

		var NUM_LINES = 5;
		var NUM_ITEMS = 5;
		var taskIdsSerialLines = {};
		var taskIdsCoupled = {};
		var taskName;
		var item;
		var task;

		for (var line = 1; line <= NUM_LINES; line++) {
			taskIdsSerialLines[line] = {};
			for (item = 1; item <= NUM_ITEMS; item++) {
				resUse = Math.random() < 0.7 ? {
					z: 1
				} : {
					y: 1
				};
				deps = item === 1 ? [] : [taskIdsSerialLines[line][item - 1]];
				taskName = "S-" + line + "-" + item;

				if (item === 1) {
					task = (function(x) {
						return function() {
							return x;
						};
					})(line);
				} else {
					task = function(a) {
						return a.result;
					};
				}

				taskIdsSerialLines[line][item] = opsQueue.createTask({
					name: taskName,
					priority: 2 + Math.floor(Math.random() * 8),
					resourceUse: resUse,
					taskDependencies: deps,
					task: task,
					taskCompletionCallBack: (function(ln) {
						return expect(checkOutput(taskName, test, ln));
					})(line)
				});
				precedences.push({
					task: taskIdsSerialLines[line][item],
					dependencies: deps
				});
				resourceRequirements[taskIdsSerialLines[line][item]] = resUse;

			}
		}

		var NUM_ROWS = 7;
		var NUM_ROW_ITEMS = 7;

		for (var row = 1; row <= NUM_ROWS; row++) {
			taskIdsCoupled[row] = {};
			for (item = 1; item <= NUM_ROW_ITEMS; item++) {
				var rv = Math.random();
				if (rv < 0.2) {
					resUse = {
						x: 1
					};
				} else if (rv < 0.5) {
					resUse = {
						y: 1
					};
				} else {
					// rv <= 1
					resUse = {
						z: 1
					};
				}

				if (row === 1) {
					deps = [];
				} else {
					deps = [];
					while (Math.random() < 0.6) {
						var itm = taskIdsCoupled[row - 1][1 + Math.floor(NUM_ROW_ITEMS * Math.random())];
						if (deps.indexOf(itm) === -1) {
							deps.push(itm);
						}
					}
				}

				taskName = "C-" + line + "-" + item;

				if (Math.random() < 0.8) {
					// Synchronous task
					task = (function(x) {
						return function() {
							return x;
						};
					})(taskName);
				} else {
					// Asynchronous task
					task = (function(x) {
						return function() {
							return new Promise(function(resolve) {
								setTimeout(function() {
									resolve(x);
								}, Math.floor(Math.random() * 10));
							});
						};
					})(taskName);
				}

				taskIdsCoupled[row][item] = opsQueue.createTask({
					name: taskName,
					priority: 2 + Math.floor(Math.random() * 8),
					resourceUse: resUse,
					taskDependencies: deps,
					task: task,
					taskCompletionCallBack: (function(ans) {
						return expect(checkOutput(taskName, test, ans));
					})(taskName)
				});
				precedences.push({
					task: taskIdsCoupled[row][item],
					dependencies: deps
				});
				resourceRequirements[taskIdsCoupled[row][item]] = resUse;

			}
		}

		opsQueue.start();
	}
]);