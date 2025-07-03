const server = import.meta.env.PROD
  ? "https://meetpro-rcw0.onrender.com"
  : "http://localhost:8000";


export default server;
