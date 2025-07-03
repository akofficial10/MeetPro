let IS_PROD = false;
const server = IS_PROD
  ? "https://meetpro-rcw0.onrender.com"
  : "http://localhost:8000";

export default server;
