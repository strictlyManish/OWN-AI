require("dotenv").config();
const conect_database = require("./src/db/db"); 
const app = require("./src/app");

const initializeSokets = require("./src/sokets/sokets.server");
const httpServer = require("http").createServer(app);







conect_database();
initializeSokets(httpServer);

httpServer.listen(3000,()=>{
    console.log('Server runnig on port 3000');
});