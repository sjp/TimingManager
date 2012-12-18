# TimingManager: A library for managing animation timing information

## Introduction

This JavaScript library is aimed to work in conjunction with the
[animaker](https://github.com/pmur002/animaker) package for
[R](http://www.r-project.org/). For more information about the
[animaker](https://github.com/pmur002/animaker) package, a [technical
report](http://www.stat.auckland.ac.nz/~paul/Reports/animaker/animaker.html)
describes it.

It has three main responsibilities:

* Import timing information and assign a unit to exported times.
* Register actions to atomic animations (using JavaScript functions).
* Play an animation sequence.

## Importing Timing Information

To begin, we assume a JavaScript variable holds the relevant timing
information necessary for TimingManager to work. In our example, this
will be called `timingData`. We will first instantiate a new
TimingManager instance.

```javascript
var tm = new TimingManager(timingData, "s");
```

The first parameter is simply passing in the data, but the second is
specifying that the exported data refers to time in seconds. Currently
valid values are `ms`, `s` and `m`. The second parameter is optional,
by default it is `ms`.

## Registering Actions

When creating an animation sequence and timing information in R with
`animaker`, we were not particularly concerned with the actions that
an animation is supposed to take. We will now assign an action to
atomic animation labelled "Alpha":

```javascript
// Creating a simple action function
var alphaAction = function(info) {
    console.log("Alpha was called at " info.start + "s");
};

// Registering the action to the 'Alpha' atomic animation
tm.register({
    Alpha: alphaAction
});
```

Although this does not represent an animation (see
[D3](http://d3js.org/)), merely a simple logging function, the
JavaScript function could do *anything* we like. In this case all the
function does is print out its name and when it was called (in
seconds).

## Playing an Animation Sequence

### Declarative Animation

Now that we have an action registered to our animation "Alpha", we can
play it.

```javascript
tm.play()
```

This simply plays the animation sequence, and if we observe the
browser's console, we can see messages being printed out. This occurs
once each time the atomic animation is called.

### Frame-based Animation

In cases where we cannot use a library like D3 to perform animations
for us, we may need to use a frame-based approach to animation. In
this case we need to draw at regular intervals in time. Using HTML, a
typical use case for this would be to create animations using the
`<canvas>` element.

To perform a frame-based animation, we will use the `frameApply` method.

```javascript
tm.frameApply(10);
```

The parameter that has been given here is the number of frames per
second that the animation sequence is going to draw at. When we
encounter the "Alpha" animation, the same animation function will be
run 10 times for each second of its duration.

After calling the `frameApply` method, we should observe a lot more
messages in the console than we get with the `play` method. The reason
for this is because it is now being called every frame, rather than
once for the atomic animation.
