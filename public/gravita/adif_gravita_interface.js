//El contenido de estas funciones debe desarrollarlo y actualizarlo el mantenedor
//del sistema de información para adecuarlo a sus características

var datosRecibidos = null;
var firstTime = true;

async function getStationJSON(station) {
    //Esta función devuelve el archivo JSON correspondiente a la
    //estación cuyo código se ha indicado en la variable station
    
    // ... a desarrollar por el mantenedor del sistema de información 


    // Este es el código y el servidor que se está utilizando en las pruebas
    


    sendMessage('log', 'gravita pide datos');
    
    // Devolver como promise
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if(firstTime){
                // console.log('esperando datos...');
                firstTime = false;
            }
            
            // Verificar si datosRecibidos ya no es null
            if (datosRecibidos !== null) {
                clearInterval(interval);  // Detener la verificación
                // sendMessage('log', 'gravita tiene datos');
                if(typeof datosRecibidos === 'string'){
                    resolve(datosRecibidos);  // Resolver la promesa con los datos recibidos
                }else{
                    resolve(JSON.stringify(datosRecibidos));
                }
            }else{
                // console.log('aun no hay datos');
            }
        }, 1000); // Revisa cada 1000 ms si hay datos
    });

}


function getMultimediaFolder(ruta) {
    //Devuelve la url de la carpeta raíz donde están las imágenes y pictogramas vectoriales que utiliza la aplicación.
    //Debe devolverse con el caracter "/" final indicativo de la carpeta

    //El argumento folder indica el tipo de recurso a buscar. En la versión 0.22 los posibles valores de folder son:
    // "lines": contiene SVG con las pastillas de las líneas de Cercanías con el mismo nombre que le campo "line" del JSON.
    // "svg": contiene SVG varios que usa la aplicación, como el logo de ADIF.
    // "coach-pictos": contiene SVG con pictogramas de prestaciones de tren
    // "station-pictos": contiene SVG con pictogramas de características de estación
    // "trains": contiene PNG (en el futuro SVG) con logotipos de tipo de tren

     // ... a desarrollar por el mantenedor del sistema de información 



		// ORIGINAL
    //  if (ruta != 'trains') return ruta + '/';
    //  if (!vars["rutaRecursos"] && vars["rutaRecursos"] == "") return ruta + '/';
     
    //  return vars["rutaRecursos"] + "/";

		 if (ruta != 'trains') return 'https://info.adif.es/assets/gravita/' + ruta + '/';
     if (!vars["rutaRecursos"] && vars["rutaRecursos"] == "") return 'https://info.adif.es/assets/gravita/' + ruta + '/';
     
     return 'https://info.adif.es/recursos/';

}







