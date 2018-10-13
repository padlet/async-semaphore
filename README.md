# async-semaphore
A simple semaphore class written in JavaScript based off promises and generators.

# Installation

```
yard add async-semaphore
```

# Setup

You can import the Semaphore class into your project via the following"

```Javascript
import Semaphore from 'async-semaphore';
```

The Semaphore class is a singleton object, which allows communication across different files. This can come in handy if you have multiple screens which need to pass data to each other. However, this can also cause naming collisions if you are not careful. If you would like a local instance of the Semaphore class, you can use the following method.

```Javascript
const localSemaphore = Semaphore.instance();
```

# Usage

To create a semaphore that will pause execution and wait for a value, use the following methods:

```Javascript
const data = await Semaphore.waitForNext(tag);
```
or
```Javascript
const data = await Semaphore.waitForAny(tag);
```

The main difference between the two is that `Semaphore.waitForNext` will wait for the next `dispatch` event before resolving, while `Semaphore.waitForAny` will resolve right away if the `dispatch` event has already occured.

<b>NOTE:</b> Both functions return a promise. To use the functions with the `await` keyword, you must ensure that the parent function is marked as `async`.

To dispatch a semaphore, use the following

```Javascript
Semaphore.dispatch(tag, data);
```

Once dispatch is called, it will find any corresponding semaphores waiting on the `tag` (string), if found it will pass the data variable to the semaphore, and then consume the semaphore. If no semaphore is found, it will store the `data` for that current `tag`, which can be used the next time `Dispatch.waitForAny` is called.

### `Semaphore.waitForNext(tag)`


```Javascript
class Example {

  constructor() {
    this.method1();
    this.method2();
  }

  async method1() {
    const isFocused = await Semaphore.fromNext('isFocused');
    // Execution is paused until next 'isFocused' dispatch
    console.log("Finished!", isFocused);
  }

  method2() {
    Semaphore.dispatch('isFocused', true);
  }
}
```
In this example, `method1` is called first, and then pauses its execution. Then `method2` is called, which dispatches the `isFocused` event. This causes the semaphore in `method1` to resolve, and finally the `console.log` statement is called with the value `true`!

<b>NOTE:</b> Each time `await Semaphore.waitForNext('isFocused')` is called, it will destroy any previous semaphore with the same tag name, if you would like to have multiple semaphores for a single tag, take a look at the `Groups` section.

### `Semaphore.waitForAny(tag)`

```Javascript
class Example {

  constructor() {
    this.method2();
    this.method1(); // Method 1 called 2nd!
  }

  method2() {
    const data = { artist:"Journey" };
    Semaphore.dispatch('dontStopBelieving', data);
  }

  async method1() {
    const data = await Semaphore.waitForAny('dontStopBelieving');
    // Execution is paused until next 'dontStopBelieving' dispatch
    console.log("Finished!", data);
  }
}
```

In this example `method2` is called first. Since there is no active semaphore for `dontStopBelieving` yet, it saves the value `{ artist:"Journey" }` for that tag name. Then `method1` is called, first it checks if there are any corresponding values for the `dontStopBelieving` tag, and since there is, it returns right away! Otherwise, it behaves just like the `waitForNext` semaphore.

This can come in handy if you are unsure of the order of operations, but would like to ensure a value is present before continuing execution. Note that the value will be consumed on first use.

### `Semaphore.dispatch(tag, data)`

The semaphore `dispatch` method is used to trigger any active semaphores that are currently paused. It takes a tag as a string, and a data object that can be any value to be returned. The `dispatch` method can be used for both `Semaphore.waitForNext` and `Semaphore.waitForAny`, and if no active semaphores are found for the tag provided, it will cache the value for the next `Semaphore.waitForAny` invocation.

# Groups

In the above examples, the semaphores were <b>1 to 1</b>, meaning that only one semaphore could be active for a single tag at a time. This may be great for most use cases, but there can be times when you would like a <b>1 to many</b> pattern. This is where dispatch groups come in...

To create a dispatch group, use the following

```Javascript
const data = await Semaphore.fromGroup(tag);
```

This behaves similar to `Semaphore.waitForNext` except that consecutive calls won't destroy previous active semaphores. This allows us to pause execution in multiple places, and wait for a single dispatch call.

To dispatch to the group, use the following

```Javascript
Semaphore.dispatchGroup(tag, data);
```

The `dispatchGroup` method will send the data to any active semaphores for the current tag, and once it is done, will destroy the group.

### `Semaphore.waitForGroup(tag)`

```Javascript
class Example {

  constructor() {
    // Create a bunch of semaphores
    this.someMethod(1);
    this.someMethod(2);
    this.someMethod(3);
    this.someMethod(4);
    this.someMethod(5);
    // Dispatch to the entire group
    this.someEvent();
  }

  async someMethod() {
    const data = await Semaphore.waitForGroup('friends');
    console.log("Group finished ", id, data);
    // id is only for illustrative purposes
  }

  someEvent() {
    console.log("Executing...");
    const friendList = ["Jim", "Alice", "Bob"];
    Semaphore.dispatchGroup('friends', friendList);
  }
}
```

In the above example we create 5 groups. Each time the `waitForGroup` function is called, it is paused and waiting for the `friends` dispatch signal. When the `dispatchGroup` function is called, each of the active semaphores are resolved, and the following output looks like this:

```Javascript
Executing...
Group finished 1 ["Jim", "Alice", "Bob"]
Group finished 2 ["Jim", "Alice", "Bob"]
Group finished 3 ["Jim", "Alice", "Bob"]
Group finished 4 ["Jim", "Alice", "Bob"]
Group finished 5 ["Jim", "Alice", "Bob"]
```

Just like the `waitForNext` method, the order of operations matter here, and dispatch should only be called for group that are currently active.

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

#####<i> Made with ♥ from the Padlet Team<i>
