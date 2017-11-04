module.exports = {
  "extends": "airbnb-base",
  "plugins": [
    "html"
  ],
  "rules": {
    "no-underscore-dangle": ["error", {"allowAfterThis": true}]
  },
  "globals": {
    "log": true,
  },
  "env": {
    "browser": true,
  }
};