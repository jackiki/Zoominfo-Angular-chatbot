const MSG_TYPES = {
    TEXT: "text",
    FEEDBACK: "feedback",
    PLAIN_INPUT: "plainInput"
}

const FEEDBACK_VALUES = {
    1: 'Disappointing',
    2: 'Bad',
    3: 'Just Ok',
    4: 'Good',
    5: 'Excellent'
}

const MSG = {
    NO: 'No, I want something else'
}

const FEEDBACK_EMOJIS = [
    {
        imgFileName: 'disappointingEmoji.svg',
        altName: FEEDBACK_VALUES[1]
    },
    {
        imgFileName: 'badEmoji.svg',
        altName: FEEDBACK_VALUES[2]
    },
    {
        imgFileName: 'justokEmoji.svg',
        altName: FEEDBACK_VALUES[3]
    }, {
        imgFileName: 'goodEmoji.svg',
        altName: FEEDBACK_VALUES[4]
    },
    {
        imgFileName: 'excellentEmoji.svg',
        altName: FEEDBACK_VALUES[5]
    }
];

export const CONSTANTS = {
    USER_CREDENTIALS: {
        EMAIL: "jackcse3@gmail.com",
        PASSWORD: "Admin@12345"
    },
    DEFAULT_CONVO_ID: "UxtoROG1654669603483",
    FEEDBACK_EMOJIS,
    MSG_TYPES,
    FEEDBACK_VALUES,
    MSG
}