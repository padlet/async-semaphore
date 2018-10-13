# async-semaphore
A simple semaphore class written in JavaScript based off promises and generators. 


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

To create a semaphore that will pause execution and wait for a value, you can use the following methods:

```Javascript
await Semaphore.fromNext(tag);

await Semaphore.fromAny(tag);
```

The main difference between the two is that `Semaphore.fromNext` will wait for the next `dispatch` event before resolving, while `Semaphore.fromAny` will resolve right away if the `dispatch` event has already occured.

To dispatch a semaphore, use the following

```Javascript
Semaphore.dispatch(tag, data);
```

Once dispatch is called, it will find any cooresponding semaphores waiting on the `tag` (string), if found it will pass the data variable to the semaphore, and then consume the semaphore. If no semaphore is found, it will store the `data` for that current `tag`, which can be used the next time `Dispatch.fromAny` is called.

Here is a simple example:

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
