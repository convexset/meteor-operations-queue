# OperationsQueue

A client-side task queue (packaged for Meteor) for tasks with pre-requisites and resource requirements.

This is probably easier to explain by example. Consider a "file uploader" where each file has to be hashed (and the hash stored) and uploaded only after hashing. However to avoid locking up the UI, there can be at most one hashing task (done progressively), and at most three simultaneous uploads (for whatever reason). This can be readily achieved within the `OperationsQueue` framework:
 - Each hash task is a pre-requisite to the corresponding upload task (tasks may have zero or more pre-requisites)
 - The queue might have a resource availability description of `{hash: 1, upload: 3}`
 - Each hash task holds 1 `"hash"` item (and releases it on completion)
 - Each upload task consumes 1 `"upload"` item (and releases it on completion)

## Install

This is available as [`convexset:operations-queue`](https://atmospherejs.com/convexset/operations-queue) on [Atmosphere](https://atmospherejs.com/). (Install with `meteor add convexset:operations-queue`.)

## Usage By Example

#### Constructor
```javascript
var opsQueue = new OperationsQueue({
    availableResources: {
        resource_a: 5
        resource_b: 10
        resource_c: 5
    },
    singleTaskCompletionCallBack: function(tId, result) {
        // When a single task is done
        console.log("[" + tId + "] Completed. Result", result);
        console.log("[" + tId + "] Task Duration: " + (taskCompletionTime[tId] - taskStartTime[tId]) + "ms.");
    },
    terminationCallBack: function(completed, incomplete) {
        // When all done
        console.log("All Done.");
        console.log("Completed:", completed);
        console.log("Incomplete:", incomplete);
    },
    // ... in milliseconds
    sleep_period_between_task_starts: 0
    show_debug_output: false;
});
```

#### Task Creation

Here is an example of a synchronous task:

```javascript
var tId = opsQueue.createTask({
    name: "Name of Task",
    // Whether task is synchronous, actually defaults to true
    is_synchronous: true,  
    // Priority: higher => higher priority (defaults to 5)
    priority: 5,
    // Resource use. Example: {forklift: 1, driver: 1}
    resourceUse: {forklift: 1, driver: 1},
    taskCompletionCallBack: function(return_value) {
        console.log("[" + this.name + "] Default callback: Task complete with output ", return_value);
    },
    taskDependencies: [taskId1, taskId2, taskId2]
    // Note that the output of pre-requisites are passed into the task function in order
    task: function(arg1, arg2, arg3) {
        // ....
        return result;
    },
});
```

Here is an example of an asynchronous task:

```javascript
var tId = opsQueue.createTask({
    name: "Name of Task",
    // Whether task is synchronous, actually defaults to true
    is_synchronous: false,  
    // Priority: higher => higher priority (defaults to 5)
    priority: 5,
    // Resource use. Example: {forklift: 1, driver: 1}
    resourceUse: {forklift: 1, driver: 1},
    taskCompletionCallBack: function(return_value) {
        console.log("[" + this.name + "] Default callback: Task complete with output ", return_value);
    },
    taskDependencies: [taskId1, taskId2, taskId2]
    // Note that the output of pre-requisites are passed into the task function in order
    task: function(arg1, arg2, arg3) {
        // Asynchronous tasks require a function that returns a promise that does the work asynchronously (when it is created)
        return new Promise(function(resolve, reject) {
            // ...
        });
    },
});
```

**Note: while synchronous tasks return results "straight" results (like `function() {return 5;}` returns 5), but asynchronous tasks have results wrapped as `{result: ..., error: ...}` (on resolve, `.result` is set and `.error` is set to null; on reject, `.error` is set and `.result` is set to null). So a result passed through from an asynchronous task should be accessed via `arg.result` (after checking for `arg.error`).**

#### Starting/Aborting

`opsQueue.start()`: Starts the task

`opsQueue.abort()`: Aborts the work of the OperationsQueue. Irreversible. Does not actually stop tasks, just prevents new ones from running and prevents new tasks from being created (obviously).


#### "Visibility"

`opsQueue.getTaskData()` returns an object with keys:
 - `taskSequences`: unique task ids
 - `taskStartTime`: a dictionary (object) of start times of tasks
 - `taskCompletionTime`: a dictionary (object) of completion times of tasks
 - `taskDuration`: a dictionary (object) of duration times of tasks

`opsQueue.taskList` provides a list of unique task ids.

`opsQueue.totalResources` provides a dictionary (i.e.: an object) of all resources as specified in the constructor.

`opsQueue.currentAvailableResources` provides the current resource availability (total resources less resources held by tasks in process).

`opsQueue.status` returns the status of the `OperationsQueue`. Possible statuses:
 - `"READY"` (code: 0)
 - `"ABORTED"` (code: 1)
 - `"RUNNING"` (code: 2)

#### Debug

Global debug options for `OperationsQueue`:
 - `OperationsQueue.debugModeOn()`: Turns debug mode on (verbose output)
 - `OperationsQueue.debugModeOff()`: Turns debug mode off
 - `OperationsQueue.debugModeOnForDuration(t_in_milliseconds)`: Turns debug mode on for some duration
