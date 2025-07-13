
var datosRecibidos = null;
var stringAttrs = '';

/**
 * Envia un mensaje a al contenedor padre con el contenido de msg.
 * Utiliza target como selector para elegir el target de la llamada
 * a postMessage.
 * @param {string} target - El target al que se quiere enviar el mensaje.
 * Posibles targets:
 * dnvlog
 * urlNext
 * 
 * @param {string} msg - El contenido del mensaje a enviar.
 * Para el target 'dnvlog': El textto que se desee guardar en disco (no enviar json, arrays, etc, ni usar dentro de bucles)
 * Para el target 'urlNext': Puede ir string vacio o null
 */
function sendMessage(target, msg ) {
    if(target){
        var message = '';
        if(target == 'log') {
            message = {'t': target, 'data': msg };
        }
        if(target == 'urlNext') {
            message = {'t': target, 'data': 'urlNext' };
        }
        window.parent.postMessage(message, '*'); 
    }
}
function loadFunction() {
    //Esto se ejecuta al cargar el gravita.html
    getUrlParams();
    //se crea la escucha de datos
    window.addEventListener('message', function(event) {
        if(event.data.target == 'grvta.setData' && event.data.objData != '') {
            datosRecibidos = event.data.objData
        }
    });
}

function getUrlParams() {
    // Obtener la URL actual
    const params = new URL(window.location.href).searchParams;
    const result = {};
    // Recorrer todos los parámetros de la URL
    params.forEach((value, key) => {
        //dividimos el vars:
        if(key == 'vars'){
            var valueArr = value.split(' ');
            $.each( valueArr, function( i, v ) {
                var variable = v.replace(/'/g, '').split('=');
                result[variable[0]] = variable[1];
            })
        }

        // Si la clave ya existe, convertirla en un array (manejar claves repetidas)
        if (result[key]) {
            if (Array.isArray(result[key])) {
                result[key].push(value);  // Si es un array, simplemente añadir
            } else {
                result[key] = [result[key], value];  // Si no es un array, convertirlo en uno
            }
        } else {
            result[key] = value;  // Si no existe, asignar el valor normalmente
        }
    });
    // console.log('URL Params :: ', params);
    // console.log('VARIABLES :: ', result);
    vars = result;
}

function setAttibutesString(){
    //funcion que recorre las variables y crea el string de atributos para la cabecera
    if(stringAttrs == ''){
        Object.keys(vars).forEach(key => {
            if(vars[key] != '' && vars[key] != 'undefined'){
                stringAttrs += key +'="'+ vars[key] +'" ';
            }

        });
    }
    return stringAttrs
}
