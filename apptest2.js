const queueing = require('./module/screenshot-service');

(function () {
    queueing({
        instances: "1",
        layout: "l1"
    });
    queueing({
        instances: "2",
        layout: "l2"
    });

    setTimeout(() => {
        console.log("timeouted");
        queueing({
            instances: "3",
            layout: "l3"
        });
        queueing({
            instances: "2",
            layout: "l2"
        });
        queueing({
            instances: "5",
            layout: "l5"
        });
    }, 6000);

    setTimeout(() => {
        console.log("exit after it");
    }, 50000)
})();