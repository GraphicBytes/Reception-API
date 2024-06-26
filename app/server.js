//####################################################
//####################################################
//###########                              ###########
//###########        RECEPTION API         ###########
//###########       SERVER LAUNCHER        ###########
//###########                              ###########
//####################################################
//####################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import cluster from 'cluster'; 
import { cronTasks } from './cronjobs/cronMaster.js';

///////////////////////////
////// NODE CLUSTERS //////
///////////////////////////
const clusters = Number(process.env.NODE_CLUSTERS);
const hostContainerName = process.env.HOST_CONTAINER_NAME;

if (cluster.isPrimary) { 

  console.log(hostContainerName + " cron style tasks running on primary fork: " + process.pid)
  setInterval(cronTasks, parseInt(process.env.CRON_TIMEOUT)); 

  for (let i = 0; i < clusters; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`${hostContainerName} fork ${worker.process.pid} died`); 
    cluster.fork();
  });
  

} else {
  
  import('./app.js').then(({ default: app }) => {
    app.listen(3000, () => {
      console.log(`${hostContainerName} fork started: ${process.pid}`); 
    });
  }).catch(err => {
    console.error("Error while loading app:", err);
  });

}


