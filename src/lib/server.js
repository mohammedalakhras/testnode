const config = require("./config");

const startServer = (app) => {
  const PORT = config.PORT;
  try {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { startServer };
