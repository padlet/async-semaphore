export class Semaphore {

  // Used for creating semaphores, they can be used as local groups, otherwise
  // all of the tags are sent to the global semaphore group.
  static instance() {
    return new Semaphore();
  }

  // These valyes hold the actice semaphores, as well as any pending valyes
  // that can be used the next time the waitForAny method is invoked.
  constructor() {
    this.active = {};
    this.values = {};
    this.pooled = {};
  }

  // The standard semaphore logic which waits for the dispatch method below
  // to be called before resolving the promise. In this case, order matters
  // and this needs to be called before dispatch.
  fromNext(tag) {
    this.active[tag] = generator();
    this.inspect();
    return this.active[tag].next().value;
  }

  // Unlike waitForNext, this will resolve right away if it finds a value
  // that cooresponds to the current tag. If not, it will set up a semaphore
  // that will resolve the next time that value is dispatched. Can cause naming
  // conflicts with the regular waitFor method.
  fromAny(tag) {
    const value = this.values[tag];
    if (value) {
      delete this.values[tag];
      return value;
    } else {
      return this.waitForNext(tag);
    }
  }

  // Resolves the waitFor semaphore, with the data that is passed into this
  // method. If no active semaphores are enabled, it will cache the value,
  // which can then be used when waitForAny is called.
  dispatch(tag, data) {
    if (this.active[tag]) {
      this.active[tag].next(data);
      delete this.active[tag];
    } else {
      this.values[tag] = data;
    }
  }

  // The standard semaphore logic which waits for the dispatch method below
  // to be called before resolving the promise. In this case, order matters
  // and this needs to be called before dispatch.
  fromGroup(group) {
    if (!this.pooled[group]) this.pooled[group] = [];
    const member = generator();
    this.pooled[group].push(member);
    member.id = this.pooled[group].length;
    return member.next().value;
  }

  // Resolves the waitFor semaphore, with the data that is passed into this
  // method. If no active semaphores are enabled, it will cache the value,
  // which can then be used when waitForAny is called.
  dispatchGroup(group, data) {
    if (this.pooled[group]) {
      for (const member of this.pooled[group]) member.next(data);
      delete this.pooled[group];
    } else {
      console.warn(`[Semaphore] no dispatch group "${group}"`);
    }
  }

  // Deletes all active semaphores, as well as any values that have been cached
  // used to cleanup, before moving on.
  purge() {
    this.active = {};
    this.values = {};
    this.pooled = {};
  }

  inspect() {
    console.log("[Semaphore] active:", this.active);
    console.log("[Semaphore] values:", this.values);
    console.log("[Semaphore] pooled:", this.pooled);
  }
}

// Export the semaphore as an instance, this way it acts like a global, but also
// has a method which can return a unique instance of the semaphore.
const global = new Semaphore();
export default global;


/* * * Generator * * *

Internal method that is used to create a generator, which returns a promise
that waits for another internal generator to finish before resolving.
The logic here is somewhat complicated, but flows like this:

1 )  Yield a promise, that contains generator(2), which will resolve the next
     time that generator(2) is passed a value.

2 )  The outer generator(1) which yielded the promise is suspened until it receives
     a value from its .next(some_value) call.

3 )  Execution is suspended in generator(1), generator(2) and the yielded promise. (waiting)

4 )  Data is passed back into generator(1), unsuspending its execution, this is
     saved as "waiting". This data is then passed back into generator(2), unsuspending
     its execution.

5 )  Once generator(2) is unsuspended, it the resolves the promise with the data
     that was received, and now all execution is finished!

*/
function* generator() {
  let hook;
  let waiting = yield new Promise(resolve => {
    function* wait() {
      const result = yield;
      resolve(result);
    }
    hook = wait();
    hook.next().value;
  });
  hook.next(waiting);
}




// class ExampleSyntax {
//
//   async openKeyboardShow() {
//     const isFocused = await Semaphore.fromNext('isFocused');
//     this.showingKeyboard();
//   }
//
//   onChange(event) {
//     Semaphore.dispatch('isFocused', event.isFocused);
//   }
//
//   render() {
//     return (
//       <WebView onChange={this.onChange.bind(this)} />
//     )
//   }
// }
