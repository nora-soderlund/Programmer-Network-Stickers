const size = 320;

const canvas = document.getElementById("canvas");

canvas.width = size * window.devicePixelRatio;
canvas.height = size * window.devicePixelRatio;

canvas.style.width = size + "px";
canvas.style.height = size + "px";

const context = canvas.getContext("2d");

context.scale(window.devicePixelRatio, window.devicePixelRatio);

const color = "rgb(99, 102, 241)";
const aspectRatio = 220 / 260;
const rectangleSize = 220;

function getRectangleSegments() {
    const left = Math.floor((size - rectangleSize) / 2);
    const top = Math.floor((size - (rectangleSize * aspectRatio)) / 2);

    const lineWidth = context.lineWidth;
    const halfLineWidth = context.lineWidth / 2;

    const width = rectangleSize;
    const height = rectangleSize * aspectRatio;

    return [
        [ left - halfLineWidth,            top + height + lineWidth         ],
        [ left - halfLineWidth,            top - halfLineWidth              ],
        [ left + width + halfLineWidth,    top - halfLineWidth              ],
        [ left + width + halfLineWidth,    top + halfLineWidth + height     ],
        [ left,                            top + halfLineWidth + height     ]
    ];
};

function getOperatorSegments() {
    const left = Math.floor(size / 2) - (size / 15);
    const top = Math.floor(size / 2);

    const increment = (size / 7);

    return [
        [ left - increment, top - increment ],
        [ left, top                         ],
        [ left - increment, top + increment ]
    ];
};

function getLineSegments() {
    const left = Math.floor(size / 2) + 8;
    const top = Math.floor(size / 2) + 40;

    return [
        [ left, top                 ],
        [ left + (size / 5), top    ]
    ];
};

function strokeAnimationSegments(animation, segments, fraction) {
    context.moveTo(segments[0][0], segments[0][1]);

    const fullLength = getSegmentsLength(segments);
    let length = 0;

    const breakPoint = (fraction * fullLength);

    for(let index = 1; index < segments.length; index++) {
        if(length > breakPoint)
            break;

        const thisLength = getSegmentsIndexLength(segments, index);

        const multiplier = Math.min((breakPoint - length) / thisLength, 1);

        const start = segments[index - 1];
        const end = segments[index];

        const difference = [
            end[0] - start[0],
            end[1] - start[1]
        ];

        context.lineTo(start[0] + (difference[0] * multiplier), start[1] + (difference[1] * multiplier));
        
        length += getSegmentsIndexLength(segments, index);
    }
};

function getSegmentsIndexLength(segments, index) {
    const left = Math.abs(segments[index][0] - segments[index - 1][0]);
    const top = Math.abs(segments[index][1] - segments[index - 1][1]);

    return left + top;
};

function getSegmentsLength(segments) {
    let length = 0;

    for(let index = 1; index < segments.length; index++)
        length += getSegmentsIndexLength(segments, index);

    return length;
};

context.strokeStyle = color;
context.lineWidth = 16;

const rectangleSegments = getRectangleSegments();
const operatorSegments = getOperatorSegments();
const lineSegments = getLineSegments();

const animationsConfig = [
    {
        segments: rectangleSegments,
        multiplier: 1.4
    },

    {
        multiple: true,
        delay: 100,
        segments: [ operatorSegments, lineSegments ],
        multiplier: 3
    }
];

const animations = animationsConfig.map((animation, index) => {
    const length = getSegmentsLength((animation.multiple)?(animation.segments[0]):(animation.segments));

    return {
        ...animation,

        length,
        duration: length * animation.multiplier,
        start: 0
    };
});

const animationLength = animations.map((animation) => animation.length).reduce((a, b) => a + b);
const animationDuration = animations.map((animation) => animation.duration + (animation.delay ?? 0)).reduce((a, b) => a + b);

// console.log(animationDuration);

const start = performance.now();

{
    let summedStart = 0;

    for(let index = 1; index < animations.length; index++) {
        animations[index].start = summedStart + (animations[index].delay ?? 0) + animations[index - 1].duration;

        summedStart = animations[index].start;
    }
}

function render(time) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    for(let index = 0; index < animations.length; index++) {
        const animation = animations[index];

        const elapsed = (time - (start + animation.start));

        if(elapsed < 0) {
            window.requestAnimationFrame(render);

            break;
        }
        
        const animationFraction = Math.min(elapsed / animation.duration, 1);

        if(animation.multiple) {
            animation.segments.forEach((segments) => {
                context.beginPath();
                
                strokeAnimationSegments(animation, segments, animationFraction);

                context.stroke();
                context.closePath();
            });
        }
        else {
            context.beginPath();

            strokeAnimationSegments(animation, animation.segments, animationFraction);

            context.stroke();
            context.closePath();
        }

        if(animationFraction < 1) {
            window.requestAnimationFrame(render);

            break;
        }
    }
};

window.requestAnimationFrame(render);
