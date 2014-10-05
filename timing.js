/*
 * This code is licensed under the GPL-2 licence.
 */

/**
 * Consumes timing information and runs handlers bound to animation
 * labels.
 *
 * @author Simon Potter
 * @class TimingManager
 * @constructor
 * @param {Array|Object} timingInfo Timing information, as
 * exported by the [animaker package](https://github.com/pmur002/animaker) in [R](http://www.r-project.org/). For more information, refer to `?export` in R once animaker has loaded.
 * @param {String} [timeUnit="ms"] Determine what time units the
 * timing information exported from animaker refers to. Must be one of
 * `"ms"` (milliseconds), `"s"` (seconds), or `"m"` (minutes).
 */
var TimingManager = function(timingInfo, timeUnit) {
    // If we've just exported a single animation, force it
    // to be an array to generalise the rest of the code to arrays.
    if (! _.isArray(timingInfo))
        timingInfo = [timingInfo];

    // Assume milliseconds by default, as that's natural in JS
    timeUnit = timeUnit || "ms";
    if (! (_.isString(timeUnit) &&
           _.contains(["ms", "s", "m"], timeUnit)))
        throw new Error("Invalid 'timeUnit': Must be one of 'ms', 's', 'm'");

    // Where all our animation actions will be stored
    var callbacks = {};
    // When playing back, store promises to display here
    var promises = [];

    // Converts a unit of time to milliseconds
    var toMs = function(t) {
        if (timeUnit === "ms")
            return t;
        if (timeUnit === "s")
            return t * 1000;
        if (timeUnit === "m")
            return t * 60 * 1000;
        throw new Error("Invalid 'timeUnit': " + timeUnit);
    };

    /**
     * Registers an action to an animation
     *
     * @method register
     * @param {Object} fns An object where the keys are the labels for an animation, and the values are a function to register as an action to that animation
     * @param {Boolean} [overwrite=false] Allows us to overwrite existing actions for animations.
     */
    this.register = function(fns, overwrite) {
        for (var f in fns) {
            if (! callbacks[f] || overwrite)
                callbacks[f] = fns[f];
        }
    };

    // Checks whether we have any actions associated with animations
    var ensureNonEmpty = function() {
        if (_.isEmpty(callbacks))
            throw new Error("No actions assigned to animations, see 'register()'");
    };

    /**
     * Plays all animations associated with actions
     *
     * @method play
     * @param {Number} [t=0] An optional delay (in `timeUnit`s) to add to the entire animation.
     */
    this.play = function(t) {
        ensureNonEmpty();
        t = t || 0; // Default to 0 ms
        _.each(timingInfo, function(anim) {
            if (callbacks[anim.label]) {
                promises.push(Promise.delay(t + toMs(anim.start))
                    .cancellable()
                    .then(function() {
                        callbacks[anim.label](anim);
                    }));
            } else {
                console.warn("Ignoring playback of animation: " + anim.label);
            }
        });
        Promise.all(promises);
    };

    /**
     * Cancels all pending animations that are queued by the timing manager.
     *
     * @method cancel
     */
    this.cancel = function() {
        _.each(promises, function(p) {
            p.cancel("User initiated animation cancellation");
        });
        promises = [];
    };

    /**
     * Returns all of the timing information about the frames that are to be played at a given time.
     *
     * @method frameTiming
     * @param {Number} [t=0] The time in *milliseconds* to select an animation from
     * @return {Array} A list of matching animations to play at the current time
     */
    this.frameTiming = function(t) {
        t = t || 0; // Default to 0
        return _.filter(timingInfo, function(info) {
            return (t >= toMs(info.start)) &&
                    (t < toMs(info.start + info.durn));
        });
    };

    /**
     * Plays all animations associated with actions at a given rate per second.
     *
     * @method frameApply
     * @param {Number} [fps=10] How many frames per second are going to be drawn. By default this is 10.
     * @param {Number} [t=0] An optional delay (in `timeUnit`s) to add to the entire animation
     */
    this.frameApply = function(fps, t) {
        ensureNonEmpty();
        t = t || 0;
        t = toMs(t);
        fps = fps || 10;
        if (fps <= 0)
            throw new Error("Frames per second must be > 0");
        var increment = 1000 / fps;
        var durn = 0;
        _.each(timingInfo, function(info) {
            durn = Math.max(durn, toMs(info.start + info.durn));
        });
        var times = [];
        var i;
        for (i = 0; (i * increment) < durn; i++) {
            times.push(t + (i * increment));
        }

        // Do the playback after a delay in ms
        var playFrame = function(anim, t) {
            if (callbacks[anim.label]) {
                promises.push(Promise.delay(t)
                    .cancellable()
                    .then(function() {
                        callbacks[anim.label](anim);
                    }));
            } else {
                console.warn("Ignoring playback of animation: " + anim.label);
            }
        };

        // A convenience generator function for playing back timing information
        var singleTiming = function(t) {
            return function(info) {
                playFrame(info, t);
            };
        };

        // Play each frame
        for (i = t; i < _.last(times); i += increment) {
            var currentTiming = this.frameTiming(i);
            if (currentTiming) {
                _.each(currentTiming, singleTiming(i));
            }
        }

        Promise.all(promises);
    };
};
