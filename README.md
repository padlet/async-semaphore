# async-semaphore
A simple semaphore class written in JavaScript based off promises and generators. 


# Setup

You can import the Semaphore class into your project via the following"

```Javascript
import Semaphore from 'async-semaphore';
```
or
```Javascript
const Semaphore = require('async-semaphore');
```

The Semaphore class is a singleton object, which allows communication across different files. This can come in handy if you have multiple screens which need to pass data to each other. However, this can also cause naming collisions if you are not careful. If you would like a local instance of the Semaphore class, you can use the following method.

```Javascript
const localSemaphore = Semaphore.instance();
```

# Usage

To create a semaphore that will pause execution and wait for a value, use the following methods:

```Javascript
const data = await Semaphore.fromNext(tag);
```
or
```Javascript
const data = await Semaphore.fromAny(tag);
```

The main difference between the two is that `Semaphore.fromNext` will wait for the next `dispatch` event before resolving, while `Semaphore.fromAny` will resolve right away if the `dispatch` event has already occured.

<b>NOTE:</b> Both functions return a promise. To use the functions with the `await` keyword, you must ensure that the parent function is marked as `async`.

To dispatch a semaphore, use the following

```Javascript
Semaphore.dispatch(tag, data);
```

Once dispatch is called, it will find any cooresponding semaphores waiting on the `tag` (string), if found it will pass the data variable to the semaphore, and then consume the semaphore. If no semaphore is found, it will store the `data` for that current `tag`, which can be used the next time `Dispatch.fromAny` is called.

### `Semaphore.fromNext(tag)`


```Javascript
class Example {

  constructor() {
    this.method1();
    this.method2();
  }

  async method1() {
    const isFocused = await Semaphore.fromNext('isFocused');
    // Execution is paused until next 'isFocused' dispatch
    console.log("Finished!");
  }

  method2() {
    Semaphore.dispatch('isFocused', true);
  }
}
```
In this example, `method1` is called first, and then pauses its execution. Then `method2` is called, which dispatches the `isFocused` event. This causes the semaphore in `method1` to resolve, and finally the `console.log` statement is called!

<b>NOTE:</b> Each time `await Semaphore.fromNext('isFocused')` is called, it will destroy any previous semaphore with the same tag name, if you would like to have multiple semaphores for a single tag, take a look at the `dispatchGroup` section.

### `Semaphore.fromAny(tag)`

```Javascript
class Example {

  constructor() {
    this.method2();
    this.method1(); // Method 1 called 2nd!
  }

  async method1() {
    const isFocused = await Semaphore.fromAny('isFocused');
    // Execution is paused until next 'isFocused' dispatch
    console.log("Finished!");
  }

  method2() {
    Semaphore.dispatch('isFocused', true);
  }
}
```

In this example `method2` is called first. Since there is no active semaphore for `isFocused` yet, it saves the value `true` for that tag name. Then `method1` is called, first it checks if there are any cooresponding values for the `isFocused` tag, and since there is, it returns right away! Otherwise, it behaves just like the `fromNext` semaphore.

This can come in handy if you are unsure of the order of operations, but would like to ensure a value is present before continuing execution. Note that the value will be consumed on first use.

# Groups

In the above examples, the semaphores were `1 to 1`, meaning that only one semaphore could be active for a single tag at a time. This may be great for most use cases, but there can be times when you would like a `1 to many` pattern. This is where dispatch groups come in...

To create a dispatch group, use the following

```Javascript
const data = await Semaphore.fromGroup(tag);
```

This behaves similar to `Semaphore.fromNext` except that consective calls won't destroy previous active semaphores. This allows us to pause execution in multiple places, and wait for a single dispatch call.

To dispatch to the group, use the following

```Javascript
Semaphore.dispatchGroup(tag, data);
```

The `dispatchGroup` method will send the data to any active semaphores for the current tag, and once it is done, will destroy the group. 

### `Semaphore.fromGroup(tag)`

```Javascript
class Example {

  constructor() {
    this.group(1);
    this.group(2);
    this.group(3);
    this.group(4);
    this.group(5);
    this.execute();
  }

  async group(id) {
    const isFocused = await Semaphore.fromGroup('isClosed');
    console.log("Group finished ", id);
  }

  execute() {
    console.log("Executing...");
    Semaphore.dispatchGroup('isClosed', {});
  }
}
```

In the above example we create 5 groups. Each time the `group` function is called, it is paused and waiting for the `isClosed` dispatch signal. When the execute function is called, each of the active semaphores are resolved, and the following output looks like this:

```Javascript 
Executing...
Group finished 1
Group finished 2
Group finished 3
Group finished 4
Group finished 5
```

Just like the `fromNext` method, the order of operations matter here, and dispatch should only be called for group that are currently active.

# Helpers

The following helper methods can come in handy:

To delete all currently active semaphores and cached values, use the following

```Javascript
Dispatch.purge();
```

To inspect the current contents of a semaphore class, use the following
```Javascript
Dispatch.inspect();
```
