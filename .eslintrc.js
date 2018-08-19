module.exports = {
    "env": {
        "browser": true,
    },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "extends": [
        "airbnb",
        "plugin:flowtype/recommended"
        ],
    "parser": "babel-eslint",
    "plugins": [
        "flowtype",
        "react",
    ]
};
