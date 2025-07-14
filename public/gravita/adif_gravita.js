// ADIF-GRAVITA JS
// Versión 1.6

// NOVEDADES
// Mejorada apariencia de numero de vía en plantilla de sustitución para monitores verticales
// Solucionados bugs al usar el parámetro platform-trigger-time
// Solucionado bug en CSS para representación vía BUS con font-size = 3
// Se eliminan filtros de color para los pictos de localización de composición
// Añadidos pictos de localización de composición: accessible_lift_up y accessible_lift_down
// Añadida posibilidad de configurar resumidamente un monitor de check-in/anden (platform_mode)
// Añadida plantilla de sustitución "collapse" (atributo if-no-trains)



// Variables globales
var AdGr24_trains_data = Array()
var AdGr24_station_list = Array();
var AdGr24_updateDataIntervalID = undefined;

if(typeof AdGr24_autoreload === "undefined") var AdGr24_autoreload = true;
if(typeof AdGr24_active === "undefined") var AdGr24_active = true;
if(typeof AdGr24_get_console_log === "undefined") var AdGr24_get_console_log = false;
if(typeof AdGr24_station === "undefined" && typeof station !== "undefined") var AdGr24_station = station;
if(typeof AdGr24_frases === "undefined" && typeof frases !== "undefined") var AdGr24_frases = frases;

// Settings globales
var AdGr24_default_countdown_traffics = ["C"];  // Tipos de tráfico que se muestran por defecto en cuenta atrás en interfaces de andén
                                                // y que numestran hora teorica en interfaces de salida con cuenta atrás

var AdGr24_default_estimated_time_traffics = ["C"];  // Tipos de tráfico que se muestran por defecto con hora prevista en vez de hora teorica

var AdGr24_languages = ["ESP","ENG"];  // Idiomas por defecto. Se actualizan con cada JSON nuevo. Se obvia el dato si se usa el atributo language del HTML.

var AdGr24_default_sectorization_mode = "first_and_last";  // Tipo de sectorización por defecto.


//Event handler para cuando cambia de forma la pantalla. Se recarga la página para que queden las líneas adecuadas
//y las columnas con su correcto tamaño. Asegura el funcionamiento responsive.
window.addEventListener('resize', function() {
    AdGr24_reload();
});


// Carga inicial de datos
$(document).ready(function() {

    document.fonts.ready.then(function() {

        comprobaryComenzar();

    });

});

function AdGr24_consoleLog(mensaje) {
    console.log("[Gravita] " + mensaje);
}

//FUNCION OBLIGATORIA PARA COMPROBAR QUE EXISTE UN CONTENEDOR HTML
//DONDE SE PINTARÁ GRAVITA
function comprobaryComenzar(){
    if($('#contenedorGrvta') && vars['IdEstacion'] != undefined){
        if( !$('#contenedorGrvta').hasClass('adif-gravita') ){
            generarCabecera();
        }
    }else{ requestAnimationFrame(comprobaryComenzar) }

    if(datosRecibidos != null){
        AdGr24_restartApp();
    }else{ requestAnimationFrame(comprobaryComenzar) }
}


function AdGr24_restartApp() {

    if(AdGr24_get_console_log) AdGr24_consoleLog("Reseteando aplicación");

    if(AdGr24_active) {

        AdGr24_startPlatformMonitors();

        AdGr24_startListMonitors();
    
        AdGr24_updateData();

    }
}


function AdGr24_startPlatformMonitors() {
    // Inicializa las pantallas adif-gravita-platform calculando el numero de lineas que pueden mostrar de acuerdo a su tamaño.
    // Tambien se aprovecha esta configuración en las pantalla adif-gravita-clock independientes para el tamaño del texto.

    // Tamaño de los elementos:
    // Cabecera hora/producto: 2 líneas
    // Cabecera destino: 3 líneas
    // Pie composición: 2 líneas (opcional)
    // Pie composición con info destinos: 1 línea (opcional)
    // Resto: termómetro paradas

    // Asigna el tamaño de la letra en función del alto del monitor
    // Se ejecuta al recargar el explorador


    $('.adif-gravita-platform, .adif-gravita-clock').each(function () {

        //Obtenemos el ancho y el alto del <div> del monitor
        var div_height = $(this).get(0).offsetHeight;
        var div_width = $(this).get(0).offsetWidth;


        $(this).attr('style','width: ' + div_width + 'px; height: ' + div_height + 'px; font-size: ' + div_height + 'px;');
        
        //Obtenemos la relación de aspecto
        var aspect_ratio = div_width / div_height;

        //Para dibujar elementos en el monitor dividimos el monitor verticalmente en un número entero de lineas (screen-rows)
        // de acuerdo a su relación de aspecto. Tambien se guarda el valor no redondeado para dar estilo homogeneo.
        //En un monitor 16:9 que muestra un solo tren se obtienen 18 líneas
        var screen_rows_rounded = Math.ceil(2*16/aspect_ratio);
        var screen_rows_unrounded = 2*16/aspect_ratio;
   

        $(this).attr('screen-rows',screen_rows_rounded);  
        $(this).attr('unrounded-screen-rows',screen_rows_unrounded); 
        $(this).attr('aspect-ratio',aspect_ratio); 
        $(this).attr('div-height',div_height); 
        $(this).attr('div-width',div_width);

        //Borramos contenidos
        $(this).empty();


    });

}

function AdGr24_startListMonitors() {
    // Inicializa las pantallas adif-gravita-arrivals y adif-gravita-departures 
    // Asigna el tamaño de la letra en función del alto del monitor
    // Calcula el numero de lineas que pueden mostrar de acuerdo a su relación de aspecto
    // Dibuja la estructura básica (cabecera y espacio de tabla)
    // Se ejecuta al recargar el explorador

    //Los seleccionamos:
    var list_monitors = $('.adif-gravita-departures, .adif-gravita-arrivals, .adif-gravita-arrivals-cercanias, .adif-gravita-departures-cercanias, .adif-gravita-arrivals-old, .adif-gravita-departures-old');
    
    //Números de grupo negativos para los monitores que no los declaren
    var unasigned_group = -1

    //Valores por defecto de group y order
    list_monitors.each(function() {
        if ($(this).attr('group') === undefined) {
            $(this).attr('group',unasigned_group);
            unasigned_group -= 1;
        }
        if ($(this).attr('order') === undefined) {
            $(this).attr('order',1);
        }
    })


    //Los ordenamos por salidas/llegadas, por grupos, y dentro de grupos, por orden
    list_monitors.sort(function(a, b) {

        if ($(a).hasClass('adif-gravita-departures') || $(a).hasClass('adif-gravita-departures-cercanias') || $(a).hasClass('adif-gravita-departures-old')) {
            var a_kind = 1;
        } else {
            var a_kind = 0;
        }
        if ($(b).hasClass('adif-gravita-departures') || $(b).hasClass('adif-gravita-departures-cercanias') || $(b).hasClass('adif-gravita-departures-old')) {
            var b_kind = 1;
        } else {
            var b_kind = 0;
        }
        var a_group = parseInt($(a).attr("group"),10);
        var b_group = parseInt($(b).attr("group"),10);
        var a_order = parseInt($(a).attr("order"),10);
        var b_order = parseInt($(b).attr("order"),10);
        
        if (a_kind == b_kind) {
            if (a_group == b_group) {
                return a_order - b_order;
            } else {
                return a_group - b_group;
            }
        } else {
            return a_kind - b_kind;
        }

        
      });



    //Para asignar los valores de primer tren y último tren a cada monitor de forma secuencial
    var train_counter = 0;  

    //El contador se reinicia para cada grupo de monitores o cuando pasamos de un grupo de monitores de llegadas a otro de salidas o vicecersa.
    //Valores por defecto para detectar si ha habido algún cambio.
    var last_group = 0;
    var last_class = 'departures';


    //El número de filas (num_rows) es siempre en función de las dimensiones de cada monitor
    //Se asigna a cada monitor de forma consecutiva: first-tren = train_counter + 1;  last-train = train_counter + num_rows
    //Excepto en el caso de que se haya declarado el atributo "start-train" en la cabecera del monitor.
    //En ese caso: first-tren = start-train;  last-tren = start-train + num_rows - 1;
    
    list_monitors.each(function () {



        //Obtenemos el ancho y el alto del <div> del monitor
        var div_height = $(this).get(0).offsetHeight;
        var div_width = $(this).get(0).offsetWidth;
        

        //Determinamos si hay que mostrar el acceso, la vía, el producto o el número de tren.
        var show_access = $(this).attr('show-access') == 'true';
        var show_platform = $(this).attr('show-platform') != 'false';
        var show_product = $(this).attr('show-product') != 'false';
        var show_number = $(this).attr('show-number') != 'false';

        //Por cuestiones de diseño es necesario mantener al menos un campo de los cuatro, por lo que en caso de ocultarlos todos, se mostrará necesariamente platform.
        if (!show_access && !show_product && !show_number) show_platform = true;


        //Determinamos el tamaño de fuente para los anchos de cabecera y el número de trenes a mostrar
        if ($(this).attr("font-size") !== undefined) {
            var font_size = parseInt($(this).attr("font-size"));
            if (font_size < 1) font_size = 1;
            if (font_size > 3) font_size = 3;
        } else {
            var font_size = 1; // valor por defecto
        } 

        //Consultamos si estamos en un monitor de tipo departures o arrivals
        if($(this).hasClass('adif-gravita-departures')) {
            var monitor_class = 'departures';
        } else if($(this).hasClass('adif-gravita-departures-cercanias')) {
            var monitor_class = 'departures-cercanias';
        } else if($(this).hasClass('adif-gravita-departures-old')) {
            var monitor_class = 'departures-old';
        } else if($(this).hasClass('adif-gravita-arrivals')) {
						var monitor_class = 'arrivals';
				} else if($(this).hasClass('adif-gravita-arrivals-cercanias')) {
						var monitor_class = 'arrivals-cercanias';
				} else if($(this).hasClass('adif-gravita-arrivals-old')) {
						var monitor_class = 'arrivals-old';
				}

        //Obtenemos los porcentajes de anchura de los elementos de la tabla

        var widths = AdGr24_getListWidths(font_size,show_access,show_platform,show_product,show_number);

        //Borramos contenidos
        $(this).empty();
        // $(this).find(".header").remove;
        // $(this).find(".table").remove;

        //Obtenemos el ancho y el alto del <div> del monitor
        var div_height = $(this).get(0).offsetHeight;
        var div_width = $(this).get(0).offsetWidth;

        
        //Obtenemos la relación de aspecto
        var aspect_ratio = div_width / div_height;

        //Obtenemos el número de filas que tendrá la tabla de trenes (sin incluir la de cabecera)
        switch (font_size) {
            case 1:  // Tamaño de letra medio (por defecto), en un monitor 16:9 se muestran 9 líneas (8 trenes con cabecera)
                var num_rows = Math.round(16/aspect_ratio) - 1;
                break;
            case 2: // Tamaño de letra grande, en un monitor 16:9 se muestran 8 líneas (7 trenes con cabecera)
                var num_rows = Math.round(16/9*8/aspect_ratio) - 1;
                break;      
            case 3: // Tamaño de letra muy grande, en un monitor 16:9 se muestran 7 líneas (6 trenes con cabecera)
                var num_rows = Math.round(16/9*7/aspect_ratio) - 1;
                break;
            case 4: // Tamaño de letra superfrande grande, en un monitor 16:9 se muestran 6 líneas (5 trenes con cabecera)
            var num_rows = Math.round(16/9*6/aspect_ratio) - 1;
            break;
        }
        
        $(this).attr('rows',num_rows);     
        var header_height = 0;
        var table_height = 100;
        if ($(this).attr('show-header') == 'false') {
            num_rows++;
        } else {
            header_height = 100 * (1/(num_rows + 1));
            table_height = 100 * (num_rows/(num_rows + 1));
        }
        var row_height = 100/num_rows;
        $(this).attr('style','width: ' + div_width + 'px; height: ' + div_height + 'px; font-size: ' + div_height + 'px; --header-height: ' + header_height + '%; --table-height: ' + table_height + '%; --row-height: ' + row_height + '%;')



        // Iniciamos el contador de tren si cambiamos de tipo de monitor (para empezar de nuevo por el primero)
        // También si hemos pasado de monitores de salidas a monitores de llegadas o vicecersa
        if(monitor_class != last_class) {
            train_counter = 0;
        } else {
            if(last_group != parseInt($(this).attr('group'),10)) {
                train_counter = 0;
            }
        }

        //Asignamos tren inicial y tren final a cada monitor:
        if ($(this).attr('start-train') !== undefined) {
            //Si se fija el primer tren en la cabecera del monitor:
            $(this).attr('first-train', parseInt($(this).attr('start-train'),10));
            $(this).attr('last-train', parseInt($(this).attr('start-train'),10) + num_rows - 1);
            train_counter =  parseInt($(this).attr('start-train'),10) + num_rows - 1;
        } else {
            //Si se fija el primer tren a mostrar de forma automática
            $(this).attr('first-train',train_counter + 1);
            $(this).attr('last-train',train_counter + num_rows);
            train_counter = train_counter + num_rows;
        }

        //Subtítulo de monitor
        if ($(this).attr("subtitle") !== undefined) {
            var subtitle_parts = $(this).attr("subtitle").split(":");
            var subtitle = $(this).attr("subtitle");

            if (AdGr24_subtitulos[subtitle_parts[0]] === undefined) {
                subtitle = "";
            }

        } else {
            var subtitle = "";
        }

        

        //Idiomas del monitor
        if ($(this).attr('languages') !== undefined) {
            var languages = $(this).attr('languages').split(",")
        } else {
            var languages = AdGr24_languages;
        }


        
        if (!($(this).attr('show-header') == "false")) {
            $(this).append(AdGr24_headerHTML(monitor_class, languages, widths, show_access, show_platform,subtitle));           
        }

        $(this).append(AdGr24_tableHTML($(this).attr('color-parity')));  
 
        // Datos para próxima iteración
        last_group = parseInt($(this).attr('group'),10);
        last_class = monitor_class;
    });



}

async function AdGr24_updateData() {


    try {

        if(AdGr24_get_console_log) AdGr24_consoleLog("Solicitando nuevos datos");
        var json_station_data = await getStationJSON(AdGr24_station);
        if(AdGr24_get_console_log) AdGr24_consoleLog("Nuevos datos recibidos");
        AdGr24_trains_data = $.parseJSON(json_station_data.trim());
        

        if(AdGr24_get_console_log) AdGr24_consoleLog("Fecha de emisión del JSON: " + AdGr24_trains_data.station_settings.data_time);
        if(AdGr24_get_console_log) AdGr24_consoleLog("Estacion de emisión del JSON: " + AdGr24_trains_data.station_settings.name);
        if(AdGr24_get_console_log) AdGr24_consoleLog("Número de trenes recibidos: " + Object.keys(AdGr24_trains_data.trains).length);
        if(AdGr24_get_console_log) AdGr24_consoleLog("Número de estaciones recibidas: " + Object.keys(AdGr24_trains_data.stations).length);
        
    
        // AdGr24_trains_data = json_station_data;
        AdGr24_station_list = AdGr24_trains_data.stations;

        if(AdGr24_trains_data.multimedia_info === undefined) {
            if(AdGr24_trains_data.line_colors !== undefined) {
                AdGr24_line_colors = AdGr24_trains_data.line_colors;
            } else {
                AdGr24_line_colors = [];
            }           
        }
        else if(AdGr24_trains_data.multimedia_info.line_colors !== undefined) {
            AdGr24_line_colors = AdGr24_trains_data.multimedia_info.line_colors;
        }
        else {
            AdGr24_line_colors = [];
        }
        

        if(AdGr24_trains_data.multimedia_info !== undefined) {
            if(AdGr24_trains_data.multimedia_info.product_pic_filenames === undefined) AdGr24_trains_data.multimedia_info.product_pic_filenames = [];
            if(AdGr24_trains_data.multimedia_info.line_pic_filenames === undefined) AdGr24_trains_data.multimedia_info.line_pic_filenames = [];
        } else {
            AdGr24_trains_data.multimedia_info = [];
            AdGr24_trains_data.multimedia_info.product_pic_filenames = [];
            AdGr24_trains_data.multimedia_info.line_pic_filenames = [];
        }


        // Idiomas de la estación
        if(AdGr24_trains_data.station_settings.languages !== undefined) {
            if(!AdGr24_arraysAreEqual(AdGr24_languages,AdGr24_trains_data.station_settings.languages)) {
                AdGr24_languages = AdGr24_trains_data.station_settings.languages;
            }
        }

        // Tipos de tráfico estimados y tráficos en cuenta atrás
        if(AdGr24_trains_data.station_settings.estimated_time_traffics !== undefined) {
            if(!AdGr24_arraysAreEqual(AdGr24_default_estimated_time_traffics,AdGr24_trains_data.station_settings.estimated_time_traffics)) {
                AdGr24_default_estimated_time_traffics = AdGr24_trains_data.station_settings.estimated_time_traffics;
            }           
        }
        if(AdGr24_trains_data.station_settings.countdown_traffics !== undefined) {
            if(!AdGr24_arraysAreEqual(AdGr24_default_countdown_traffics,AdGr24_trains_data.station_settings.countdown_traffics)) {
                AdGr24_default_countdown_traffics = AdGr24_trains_data.station_settings.countdown_traffics;
            }           
        }

        // Modo de sectorización
        if(AdGr24_trains_data.station_settings.sectorization_mode !== undefined) {
            AdGr24_default_sectorization_mode = AdGr24_trains_data.station_settings.sectorization_mode;
        }        


        AdGr24_updateMonitors();
        
    } catch(error) {
        console.error(error.message);
        console.error(error.stack)
    }
    

}

function AdGr24_updateMonitors() {
    
    if(AdGr24_get_console_log) AdGr24_consoleLog("Actualizando monitores");
    // var cambios = false;

    var restart_list_monitors = false;
    $('.adif-gravita-platform').each(function () {
        
        var this_monitor = $(this);


  
        if (this_monitor.attr("platform-location") !== undefined) {
            if(this_monitor.attr("platform-location") != "") var platform_location = this_monitor.attr("platform-location").split(",");
            else var platform_location = [];
        } else {
            var platform_location = [];
        }

        if (this_monitor.attr("platform-location-left") !== undefined) {
            var platform_location_left = this_monitor.attr("platform-location-left").split(",");
            platform_location.push(...platform_location_left);
        } else {
            var platform_location_left = [];
        }

        if (this_monitor.attr("platform-location-right") !== undefined) {
            var platform_location_right = this_monitor.attr("platform-location-right").split(",");
            platform_location.push(...platform_location_right);
        } else {
            var platform_location_right = [];
        }

        if (this_monitor.attr("sector-location") !== undefined) {
            if(this_monitor.attr("sector-location") != "") var sector_location = this_monitor.attr("sector-location").split(",");
            else var sector_location = [];
        } else {
            var sector_location = [];
        }

        if (this_monitor.attr("access-location") !== undefined) {
            if(this_monitor.attr("access-location") != "") var access_location = this_monitor.attr("access-location").split(",");
            else var access_location = [];      
        } else {
            var access_location = [];
        }

        if (this_monitor.attr("show-platform-sign") !== undefined) {
            var show_platform_sign = this_monitor.attr("show-platform-sign") == 'true';
        } else {
            var show_platform_sign = false;
        }
        if (this_monitor.attr("show-composition") !== undefined) {
            var show_composition = this_monitor.attr("show-composition") != 'false';
        } else {
            var show_composition = true;
        }

        if (this_monitor.attr("show-observation") !== undefined) {
            var show_observation = this_monitor.attr("show-observation") != 'false';
        } else {
            var show_observation = true;
        }

        if (this_monitor.attr("pin-position") !== undefined) {
            var pin_position = this_monitor.attr("pin-position").split(",");
        } else {
            var pin_position = [];
        }

        if (this_monitor.attr("pin-style") !== undefined) {
            var pin_style = this_monitor.attr("pin-style").split(",");
        } else {
            var pin_style = [];
        }

        //Comprobación de datos correctos y coherencia en pin-position y pin-style
        if(pin_style.length == 0 && pin_position.length > 0) {
            //Si no se indica pin_style, se pasa solo el primer valor de pin_position con estilo 'pin'
            pin_style = ['pin'];
            pin_position = pin_position.slice(0,1);
        } else if(pin_position.length > pin_style.length) {
            //Si hay más elementos de pin_position que de pin_style, se elimina el exceso
            pin_position = pin_position.slice(0,pin_style.length);
        } else if (pin_style.length > pin_position.length) {
            //Si hay más elementos de pin_style que de pin_position, se elimina el exceso
            pin_style = pin_style.slice(0,pin_position);
        }


        if ($(this).attr('countdown-traffics') !== undefined) {
            var countdown_traffics = $(this).attr("countdown-traffics").split(",");
        } else {
            var countdown_traffics = AdGr24_default_countdown_traffics;
        }

        if (this_monitor.attr("platform-arrangement") == 'descending') {
            var platform_arrangement = 'descending';
        } else {
            var platform_arrangement = 'ascending';
        }

        if (this_monitor.attr('sectors-highlight') == 'false') {
            var sectors_highlight = false;
        } else {
            var sectors_highlight = true;
        }

        if ($(this).attr("estimated-time-traffics") !== undefined) {
            var estimated_time_traffics = $(this).attr("estimated-time-traffics").split(",");
        } else {
            var estimated_time_traffics = AdGr24_default_estimated_time_traffics;
        }    

        if (this_monitor.attr('platform-trigger') !== undefined) {
            var platform_trigger = this_monitor.attr('platform-trigger');
        } else {
            var platform_trigger = "announced";
        }

        if(platform_trigger != "announced" && platform_trigger != "check-in" && platform_trigger != "next") {
            platform_trigger = "announced";
        }

        if (this_monitor.attr('platform-trigger-time') !== undefined) {
            var platform_trigger_time = parseInt(this_monitor.attr('platform-trigger-time'));
        } else {
            var platform_trigger_time = 15;
        }

        if (this_monitor.attr('anti-burn-in') != 'true') {
            var anti_burn_in = false;
        } else {
            var anti_burn_in = true;
        }

        if (this_monitor.attr('show-closed-check-in') == 'true') {
            var show_closed_check_in = true;
        } else {
            var show_closed_check_in = false;
        }

        // Obtención de la plantilla de sustitucion
        
        if (this_monitor.attr("if-no-trains") !== undefined) {
            var substitution_class = this_monitor.attr("if-no-trains");
            if (substitution_class == "arrivals") substitution_class = 'adif-gravita-arrivals';
            else if (substitution_class == "departures") substitution_class = 'adif-gravita-departures';
						else if (substitution_class == "arrivals-cercanias") substitution_class = 'adif-gravita-arrivals-cercanias';
						else if (substitution_class == "departures-cercanias") substitution_class = 'adif-gravita-departures-cercanias';
						else if (substitution_class == "arrivals-old") substitution_class = 'adif-gravita-arrivals-old';
						else if (substitution_class == "departures-old") substitution_class = 'adif-gravita-departures-old';
            else if (substitution_class == "clock") substitution_class = 'adif-gravita-clock';
            else if (substitution_class == "black") substitution_class = 'adif-gravita-black';
            else if (substitution_class == "number") substitution_class = 'adif-gravita-number';
            else if (substitution_class == "collapse") substitution_class = 'adif-gravita-collapse';
            else substitution_class = 'adif-gravita-clock';
        } else {
            var substitution_class = 'adif-gravita-clock';
        }


        // Configuración resumida de atributos (platform-mode)
        // Solo si no se han establecido directamente los atributos
        if (this_monitor.attr('platform-mode') !== undefined) {
            switch(this_monitor.attr('platform-mode')) {
                case "access":
                    if (this_monitor.attr("show-platform-sign") === undefined) show_platform_sign = true;
                    if (this_monitor.attr("if-no-trains") === undefined) substitution_class = 'adif-gravita-number';
                    if (this_monitor.attr('platform-trigger') === undefined) platform_trigger = "announced";
                    if (this_monitor.attr('show-closed-check-in') === undefined) show_closed_check_in = false;
                    break;
                case "check-in":
                    if (this_monitor.attr("show-platform-sign") === undefined) show_platform_sign = true;
                    if (this_monitor.attr("if-no-trains") === undefined) substitution_class = 'adif-gravita-number';
                    if (this_monitor.attr('platform-trigger') === undefined) platform_trigger = "check-in";
                    if (this_monitor.attr('show-closed-check-in') === undefined) show_closed_check_in = true;
                    break;
                case "platform":
                    if (this_monitor.attr("show-platform-sign") === undefined) show_platform_sign = false;
                    if (this_monitor.attr("if-no-trains") === undefined) substitution_class = 'adif-gravita-clock';
                    if (this_monitor.attr('platform-trigger') === undefined) platform_trigger = "announced";
                    if (this_monitor.attr('show-closed-check-in') === undefined) show_closed_check_in = false;
                    break;
            }
        }


        //Lista de trenes ordenados por vías declaradas
        var platform_trains = [...AdGr24_trains_data.trains];
        platform_trains = platform_trains.sort(AdGr24_ordenarTrenesNumeroVia(platform_location));
        

        //Contador de trenes a pintar en el monitor
        var total_trains = 0;

        //Contamos los trenes a pintar en total

        platform_trains.forEach(function(train) {    
            if(AdGr24_filtroTrenes("departures",train,["intermediate","origin"],[],[],[],[],[],[],access_location,[],platform_location,[],[],[],[],[],sector_location)) { 

                if(announceTrain(train,platform_trigger,platform_trigger_time)) total_trains++;
       
            }
        });

        
        if (total_trains == 0) {
            //Si no hay trenes que mostrar activamos la pantalla de sustitución:
            if(AdGr24_get_console_log) AdGr24_consoleLog("No hay trenes a mostrar en monitor " + this_monitor.attr('id'));
            
            // if (this_monitor.attr("if-no-trains") !== undefined) {
            //     var substitution_class = this_monitor.attr("if-no-trains");
            //     if (substitution_class == "arrivals") substitution_class = 'adif-gravita-arrivals';
            //     else if (substitution_class == "departures") substitution_class = 'adif-gravita-departures';
            //     else if (substitution_class == "clock") substitution_class = 'adif-gravita-clock';
            //     else if (substitution_class == "black") substitution_class = 'adif-gravita-black';
            //     else if (substitution_class == "number") substitution_class = 'adif-gravita-number';
            //     else substitution_class = 'adif-gravita-clock';
            // } else {
            //     var substitution_class = 'adif-gravita-clock';
            // }

            // Plantillas de sustitución anti-burn-in
            if(anti_burn_in) {
                var now_time = new Date();
                var now_hour = now_time.getHours();

                if(now_hour >= 1 && now_hour < 5) {
                    if(substitution_class == "adif-gravita-number") substitution_class = "adif-gravita-black-number";
                    if(substitution_class == "adif-gravita-clock") substitution_class = "adif-gravita-black-clock";
                }
            }


            // Si la clase de sustitucion no estaba previament activada, borramos contenidos y activamos
            if (!this_monitor.hasClass(substitution_class)) {
                this_monitor.empty();
                this_monitor.addClass(substitution_class);  
                if ((substitution_class == 'adif-gravita-departures' || substitution_class == 'adif-gravita-arrivals') || substitution_class == 'adif-gravita-departures-cercanias' || substitution_class == 'adif-gravita-arrivals-cercanias' || substitution_class == 'adif-gravita-departures-old' || substitution_class == 'adif-gravita-arrivals-old') {
                 //Si se va a poner un monitor de lista de sustitucion hay que recalcular los parametros necesarios de los monitores de lista de la pantalla
                 //boleano para proceder a hacerlo una vez examinados todos los platform monitores
                 restart_list_monitors = true;
                }    
            } 
            // Eliminamos las clases que no correspondan cuando hay opciones anti-burn-in
            if(substitution_class == "adif-gravita-number") this_monitor.removeClass("adif-gravita-black-number");
            if(substitution_class == "adif-gravita-black-number") this_monitor.removeClass("adif-gravita-number");
            if(substitution_class == "adif-gravita-clock") this_monitor.removeClass("adif-gravita-black-clock");
            if(substitution_class == "adif-gravita-black-clock") this_monitor.removeClass("adif-gravita-clock");
              
        } else {
            //Si hay trenes que mostrar
            //Eliminamos las posibles clases de sustitucion
            this_monitor.removeClass('adif-gravita-black');
            this_monitor.removeClass('adif-gravita-clock');
            this_monitor.removeClass('adif-gravita-arrivals');
            this_monitor.removeClass('adif-gravita-departures');
						this_monitor.removeClass('adif-gravita-arrivals-cercanias');
						this_monitor.removeClass('adif-gravita-departures-cercanias');
						this_monitor.removeClass('adif-gravita-arrivals-old');
						this_monitor.removeClass('adif-gravita-departures-old');
            this_monitor.removeClass('adif-gravita-number');
            this_monitor.removeClass('adif-gravita-black-number');
            this_monitor.removeClass('adif-gravita-black-clock');
            this_monitor.removeClass('adif-gravita-collapse');

            //Si el número de trenes mostrados ha cambiado repintamos la pantalla de cero
            if ($(this).attr("total-trains") != total_trains) {
                //Borrado de contenido
                this_monitor.html("");
            } 

            //Si el número de trenes a mostrar es mayor que 1, mostramos el símbolo de vía
            if (total_trains > 1) show_platform_sign = true;
             
            var row_index = 0;
            platform_trains.forEach(function(train) {
                


                if(AdGr24_filtroTrenes("departures",train,["intermediate","origin"],[],[],[],[],[],[],access_location,[],platform_location,[],[],[],[],[],sector_location)) {    
                    
    
                    if (announceTrain(train,platform_trigger,platform_trigger_time)) {
                        

                        //Determinamos platform_side
                        if (platform_location_left.some(platf => train.platform_locations.includes(platf))) {
                            var platform_side = "left";
                        } else if (platform_location_right.some(platf => train.platform_locations.includes(platf))) {
                            var platform_side = "right";
                        } else {
                            var platform_side = undefined;
                        }


                        var checked = false;
                        row_index++;

                        while(!checked) {
                            var this_row = this_monitor.find(".platform-train").slice(row_index-1,row_index);
                            var this_train = AdGr24_platformTrainHTML(train, AdGr24_trains_data.station_settings.platforms, total_trains, this_monitor.attr('screen-rows'), this_monitor.attr('unrounded-screen-rows'), show_platform_sign, platform_side, show_composition, show_observation,
                            pin_position, pin_style, countdown_traffics, estimated_time_traffics, platform_arrangement,sectors_highlight);

                            //Si no existe la fila (fila vacía), creamos el tren
                            if(this_row.html() === undefined) {
                                if(AdGr24_get_console_log) AdGr24_consoleLog("Creamos tren id: " + this_train.attr('train-id') + " / " + this_train.find('.train-commercial-id').attr('check-value'));
                                this_monitor.append(this_train);
                                checked = true;
   
                            } else {
                                // Existe ya un tren, comprobamos si es el mismo
                                if(this_row.attr('train-id') == this_train.attr('train-id')) {
                                    //Mismo tren, actualizamos los datos
                                    var checked = false;
                                    var full_change = false;
                                    if(AdGr24_get_console_log) AdGr24_consoleLog("Actualizamos tren id: " + this_train.attr('train-id') + " / " + this_train.find('.train-commercial-id').attr('check-value'));
                                    //Activa reemplazo total de tren en caso de aparición/desaparición de observación
                                    if(this_row.find('.platform-info').attr('check-value') != this_train.find('.platform-info').attr('check-value')) {
                                        if(this_row.find('.platform-info').attr('check-value') === undefined || this_train.find('.platform-info').attr('check-value') === undefined) {
                                            full_change = true;
                                        }                            
                                    }   

                                    //Activa reemplazo total de tren en caso de aparición/desaparición de composición
                                    if(this_row.find('.train-composition').attr('check-value') != this_train.find('.train-composition').attr('check-value')) {
                                        if(this_row.find('.train-composition').attr('check-value') === undefined || this_train.find('.train-composition').attr('check-value') === undefined) {
                                            full_change = true;
                                        }              
                                    }    


                                    if(full_change) {
                                        //Reemplazo de todo el contenido
                                        this_row.replaceWith(this_train);
                                    } else {
                                        //Actualización de train-time
                                        if(this_row.find('.train-time').attr('check-value') != this_train.find('.train-time').attr('check-value')) {
                                            this_row.find('.train-time').replaceWith(this_train.find('.train-time'));
                                        }
                                            
                                        //Actualización de train-status
                                        if(this_row.find('.train-status').attr('check-value') != this_train.find('.train-status').attr('check-value'))
                                        {
                                            this_row.find('.train-status').replaceWith(this_train.find('.train-status'));
                                        }  
                                        //Actualización de otros valores de cabecera (cambia toda la cabecera)
                                        if(this_row.find('.train-direction').attr('check-value') != this_train.find('.train-direction').attr('check-value') ||
                                        this_row.find('.train-commercial-id').attr('check-value') != this_train.find('.train-commercial-id').attr('check-value') || 
                                        this_row.find('.train-platform').attr('check-value') != this_train.find('.train-platform').attr('check-value'))
                                        {
                                            this_row.find('.platform-header').replaceWith(this_train.find('.platform-header'));
                                        }      
                                        //Actualización de horizontal-journey
                                        if(this_row.find('.train-horizontal-journey').attr('check-value') != this_train.find('.train-horizontal-journey').attr('check-value')) {
                                            this_row.find('.train-horizontal-journey').replaceWith(this_train.find('.train-horizontal-journey'));
                                        }       
                                        //Actualización de vertical-journey
                                        if(this_row.find('.train-vertical-journey').attr('check-value') != this_train.find('.train-vertical-journey').attr('check-value')) {
                                            this_row.find('.train-vertical-journey').replaceWith(this_train.find('.train-vertical-journey'));
                                        }                                                                 

                                        //Actualización de platform-info
                                        if(this_row.find('.platform-info').attr('check-value') != this_train.find('.platform-info').attr('check-value')) {
                                            this_row.find('.platform-info').replaceWith(this_train.find('.platform-info'));                             
                                        }   

                                        //Actualización de composition
                                        if(this_row.find('.train-composition').attr('check-value') != this_train.find('.train-composition').attr('check-value')) {
                                            this_row.find('.train-composition').replaceWith(this_train.find('.train-composition'));                 
                                        }  
                                    }
                                      
     
                          
                                    checked = true;                          
                                } else {
                                    //No coincide el tren a pintar con el pintado.

                                    //Comprobamos si el tren pintado continua vigente en la lista
                                    var old_train_index = platform_trains.findIndex(train => train.id == this_row.attr('train-id'))

                                    if(old_train_index === -1) {
                                        if(AdGr24_get_console_log) AdGr24_consoleLog("Eliminamos tren id: " + this_row.attr('train-id') + " / " + this_row.find('.train-commercial-id').attr('check-value'));
                                        //El tren pintado en la fila se ha borrado o desactivado. Borramos el tren y reiniciamos análisis fila
                                        this_row.remove()
                                        checked = false;
                                        continue;
                                    } 

                                    //Comprobamos si el tren a pintar es nuevo (no estaba en la lista)
                                    var new_train_row = this_monitor.find(".platform-train[train-id='" + train.id + "']").first();
                                    if(new_train_row.length === 0) {
                                        //El tren a pintar es nuevo en la lista (por creacción o reordenación)
                                        //Añadimos la nueva fila antes del elemento actual y seguimos prceso
                                        if(AdGr24_get_console_log) AdGr24_consoleLog("Añadimos tren id: " + this_train.attr('train-id') + " / " + this_train.find('.train-commercial-id').attr('check-value'));
                                        this_row.before(this_train);
                                        checked = true;

                                        continue;
                                    } else {
                                        //El tren a pintar existe en otra posición, lo movemos a la fila actual y reiniciamos análisis
                                        if(AdGr24_get_console_log) AdGr24_consoleLog("Reordenamos tren id: " + this_train.attr('train-id') + " / " + this_train.find('.train-commercial-id').attr('check-value'));
                                        checked = false;
                                        new_train_row.insertBefore(this_row);
                                        continue;
                                    }
                                }

                            } 
                        }
                    }         
                }
                
            });
        }

        $(this).attr("total-trains",total_trains);
        //Eliminar filas por enicima de capacidad
        $(this).find(".platform-train").slice(row_index).remove();
        
        function announceTrain(train,platform_trigger,platform_trigger_time) {

            
            if(!train.next_on_platform) return false;

            var trigger = false;

            switch(platform_trigger) {
                case "announced":
                    trigger = train.announced;
                    break;
                case "check-in":
                    if(train.check_in === undefined) train.check_in = "none";
                    trigger = train.announced || (train.check_in == "open" || train.check_in == "closed");
                    break;
                case "next":
                    var trigger = true;
                    
                    break;
            }

            if(!trigger && platform_trigger_time > 0) {
                trigger = AdGr24_minutesToArrival(train) <= platform_trigger_time;
            }

            return trigger; 
                 
        }

    });

    if(restart_list_monitors) {
        AdGr24_startListMonitors();
    }

    //Actualización monitores de salidas y llegadas (.adif-gravita-departures, .adif-gravita-arrivals)
    $('.adif-gravita-departures, .adif-gravita-arrivals, .adif-gravita-arrivals-cercanias, .adif-gravita-departures-cercanias, .adif-gravita-arrivals-old, .adif-gravita-departures-old').each(function () {

			// Mostrar el fondo en base a la estación del año
				if($(this).hasClass('adif-gravita-departures-cercanias') || $(this).hasClass('adif-gravita-arrivals-cercanias')) {
					const d = new Date();
					const seasonArray = [
							{name: 'Spring', date: new Date(d.getFullYear(),2,(d.getFullYear() % 4 === 0) ? 19 : 20).getTime()},
							{name: 'Summer', date: new Date(d.getFullYear(),5,(d.getFullYear() % 4 === 0) ? 20 : 21).getTime()},
							{name: 'Autumn', date: new Date(d.getFullYear(),8,(d.getFullYear() % 4 === 0) ? 22 : 23).getTime()},
							{name: 'Winter', date: new Date(d.getFullYear(),11,(d.getFullYear() % 4 === 0) ? 20 : 21).getTime()}
					];

					const season = seasonArray.filter(({ date }) => date <= d).slice(-1)[0] || {name: "Winter"}

					if (season.name === 'Spring') {
						// Primavera
						$(this).css('background', 'url(/gravita/imgs/bg-cercanias-1.webp) center center / cover no-repeat');
					} else if (season.name === 'Summer') {
						// Verano
						$(this).css('background', 'url(/gravita/imgs/bg-cercanias-2.webp) center center / cover no-repeat');
					} else if (season.name === 'Autumn') {
						// Otoño
						$(this).css('background', 'url(/gravita/imgs/bg-cercanias-3.webp) center center / cover no-repeat');
					} else {
						// Invierno
						$(this).css('background', 'url(/gravita/imgs/bg-cercanias-4.webp) center center / cover no-repeat');
					}
				}
        //Consultamos si estamos en un monitor de tipo departures o arrivals y si estamos en modo cuenta atrás
        if($(this).hasClass('adif-gravita-departures') || $(this).hasClass('adif-gravita-departures-cercanias') || $(this).hasClass('adif-gravita-departures-old')) {
            var monitor_class = $(this).hasClass('adif-gravita-departures-cercanias') ? 'departures-cercanias' : $(this).hasClass('adif-gravita-departures-old') ? 'departures-old' : 'departures';
            if ($(this).attr('countdown') == 'true') {
                var countdown_active = true;
                if ($(this).attr('countdown-traffics') !== undefined) {
                    var countdown_traffics = $(this).attr("countdown-traffics").split(",");
                } else {
                    var countdown_traffics = AdGr24_default_countdown_traffics;
                }
            } else {
                var countdown_active = false;
                var countdown_traffics = [];
            }
        } else {
            var monitor_class = $(this).hasClass('adif-gravita-arrivals-cercanias') ? 'arrivals-cercanias' : $(this).hasClass('adif-gravita-arrivals-old') ? 'arrivals-old' : 'arrivals';
            var countdown_active = false;
            var countdown_traffics = [];
        }

        //Determinamos si hay que mostrar el acceso, la vía, el producto o el número de tren.
        var show_access = $(this).attr('show-access') == 'true';
        var show_platform = $(this).attr('show-platform') != 'false';
        var show_product = $(this).attr('show-product') != 'false';
        var show_number = $(this).attr('show-number') != 'false';

        //Determinamos si deben mostrar vías previas
        var show_platform_preview = $(this).attr('show-platform-preview') != 'false';

        //Por cuestiones de diseño es necesario mantener al menos un campo de los cuatro, por lo que en caso de ocultarlos todos, se mostrará necesariamente platform.
        if (!show_access && !show_product && !show_number) show_platform = true;

        
        //Determinamos el tamaño de fuente para los anchos de cabecera y el número de trenes a mostrar
        if ($(this).attr("font-size") !== undefined) {
            var font_size = parseInt($(this).attr("font-size"));
            if (font_size < 1) font_size = 1;
            if (font_size > 4) font_size = 4;
        } else {
            var font_size = 1; // valor por defecto
        } 

        
        var widths = AdGr24_getListWidths(font_size,show_access,show_platform,show_product,show_number);



        var this_monitor = $(this);

        //Filtros para monitores de salidas y llegadas
        if ($(this).attr("traffic-filter") !== undefined) {
            var traffic_filter = $(this).attr("traffic-filter").split(",");
        } else {
            var traffic_filter = [];
        }
        if ($(this).attr("traffic-include") !== undefined) {
            var traffic_include = $(this).attr("traffic-include").split(",");
        } else {
            var traffic_include = [];
        }
        if ($(this).attr("company-filter") !== undefined) {
            var company_filter = $(this).attr("company-filter").split(",");
        } else {
            var company_filter = [];
        }
        if ($(this).attr("company-include") !== undefined) {
            var company_include = $(this).attr("company-include").split(",");
        } else {
            var company_include = [];
        }
        if ($(this).attr("product-filter") !== undefined) {
            var product_filter = $(this).attr("product-filter").split(",");
        } else {
            var product_filter = [];
        }
        if ($(this).attr("product-include") !== undefined) {
            var product_include = $(this).attr("product-include").split(",");
        } else {
            var product_include = [];
        }
        if ($(this).attr("access-filter") !== undefined) {
            var access_filter = $(this).attr("access-filter").split(",");
        } else {
            var access_filter = [];
        }
        if ($(this).attr("access-include") !== undefined) {
            var access_include = $(this).attr("access-include").split(",");
        } else {
            var access_include = [];
        }
        if ($(this).attr("platform-filter") !== undefined) {
            var platform_filter = $(this).attr("platform-filter").split(",");
        } else {
            var platform_filter = [];
        }
        if ($(this).attr("platform-include") !== undefined) {
            var platform_include = $(this).attr("platform-include").split(",");
        } else {
            var platform_include = [];
        }
        if ($(this).attr("stop-filter") !== undefined) {
            var stop_filter = $(this).attr("stop-filter").split(",");
        } else {
            var stop_filter = [];
        }
        if ($(this).attr("stop-include") !== undefined) {
            var stop_include = $(this).attr("stop-include").split(",");
        } else {
            var stop_include = [];
        }
        if ($(this).attr("custom-filter") !== undefined) {
            var custom_filter = $(this).attr("custom-filter").split(",");
        } else {
            var custom_filter = [];
        }
        if ($(this).attr("custom-include") !== undefined) {
            var custom_include = $(this).attr("custom-include").split(",");
        } else {
            var custom_include = [];
        }

        if ($(this).attr("journey-scroll") !== undefined) {
            var journey_scroll = $(this).attr("journey-scroll");
        } else {
            var journey_scroll = "X";
        }

        if ($(this).attr("observation-scroll") !== undefined) {
            var observation_scroll = $(this).attr("observation-scroll");
        } else {
            var observation_scroll = "X";
        }

        if ($(this).attr("estimated-time-traffics") !== undefined) {
            var estimated_time_traffics = $(this).attr("estimated-time-traffics").split(",");
        } else {
            var estimated_time_traffics = AdGr24_default_estimated_time_traffics;
        }  
        if ($(this).attr("max-show-stops") !== undefined) {
            var max_show_stops = ~~$(this).attr("max-show-stops");
        } else {
            var max_show_stops = -1;
        }
        

        //Subtítulo de monitor
        if ($(this).attr("subtitle") !== undefined) {
            var subtitle_parts = $(this).attr("subtitle").split(":");
            var subtitle = $(this).attr("subtitle");

            if (AdGr24_subtitulos[subtitle_parts[0]] === undefined) {
                subtitle = "";
            }

        } else {
            var subtitle = "";
        }

        // Idiomas del monitor
        if ($(this).attr('languages') !== undefined) {
            var languages = $(this).attr('languages').split(",")
        } else {
            var languages = AdGr24_languages;
        }

        // Actualizamos el header si han cambiados los idiomas
        var header = $(this).find('.header');
        if (header.length > 0) {
            if (header.attr('languages') !== languages.join(',')) {
                header.replaceWith(AdGr24_headerHTML(monitor_class,languages,widths,show_access,show_platform,subtitle));
            }
        }


        // Ordenamos la lista de trenes segun la configuracion del monitor

        if(monitor_class == 'departures' || monitor_class == 'departures-cercanias' || monitor_class == 'departures-old') {
            var class_stop_filter = ["intermediate","origin"];
            if(countdown_active) {
                list_trains = [...AdGr24_trains_data.trains];
                list_trains = list_trains.sort(AdGr24_ordenarTrenesCountdown(estimated_time_traffics));
            } else {
                list_trains = [...AdGr24_trains_data.trains];
                list_trains = list_trains.sort(AdGr24_ordenarTrenesHoraSalida(estimated_time_traffics));
            }
        } else {
            var class_stop_filter = ["intermediate","destination"];
            list_trains = [...AdGr24_trains_data.trains];
            list_trains = list_trains.sort(AdGr24_ordenarTrenesHoraLlegada(estimated_time_traffics));
        }

        var first_train = ~~$(this).attr('first-train');
        var last_train = ~~$(this).attr('last-train');
        var train_index = 0;
        var row_index = 0;
         

        list_trains.forEach(function(train) {
            
            if(AdGr24_filtroTrenes(monitor_class,train,class_stop_filter,traffic_filter,traffic_include,company_filter,company_include,
                product_filter,product_include,access_filter,access_include,platform_filter,platform_include,
                stop_filter,stop_include,custom_filter,custom_include,[])) {
                
                train_index++;

                if(train_index >= first_train && train_index <= last_train) {
                    //Obtenemos la fila actual de la pantalla

                    row_index++;
                    var checked = false;

                    //Obtenemos si se muestran las paradas. (max_show_stops = -1 si no hay límite)
                    show_stops = (max_show_stops < 0 || max_show_stops >= row_index);

                    while(!checked) {
                        var this_row = this_monitor.find(".table div.train-row").slice(row_index-1,row_index);
                        var this_train = AdGr24_trainHTML(train, languages, monitor_class, widths, journey_scroll, observation_scroll, show_access, 
                            show_platform, show_product, show_number, show_stops, countdown_active, countdown_traffics, estimated_time_traffics, show_platform_preview);

                        //Si no existe la fila (fila vacía), creamos el tren
                        if(this_row.html() === undefined) {
                            if(AdGr24_get_console_log) AdGr24_consoleLog("Creamos tren id: " + this_train.attr('train-id') + " / " + this_train.find('.train-commercial-id').attr('check-value'));
                            this_monitor.find(".table").append(this_train);
                            checked = true;
                        } else {
                            // Existe ya un tren, comprobamos si es el mismo
                            if(this_row.attr('train-id') == this_train.attr('train-id')) {
                                //Mismo tren, actualizamos los datos
                                if(AdGr24_get_console_log) AdGr24_consoleLog("Actualizamos tren id: " + this_train.attr('train-id') + " / " + this_train.find('.train-commercial-id').attr('check-value'));
                                //Actualización de time
                                if(this_row.find('.train-time').attr('check-value') != this_train.find('.train-time').attr('check-value')) {
                                    this_row.find('.train-time').replaceWith(this_train.find('.train-time'));
                                }      
                                //Actualización de status
                                if(this_row.find('.train-status').attr('check-value') != this_train.find('.train-status').attr('check-value')) {
                                    this_row.find('.train-status').replaceWith(this_train.find('.train-status'));
                                }                                    
                                //Actualización de direction
                                if(this_row.find('.train-direction').attr('check-value') != this_train.find('.train-direction').attr('check-value')) {
                                    this_row.find('.train-direction').replaceWith(this_train.find('.train-direction'));
                                }
                                //Actualización de horizontal-journey
                                if(this_row.find('.train-horizontal-journey').attr('check-value') != this_train.find('.train-horizontal-journey').attr('check-value')) {
                                    this_row.find('.train-horizontal-journey').replaceWith(this_train.find('.train-horizontal-journey'));
                                }                                       
                                //Actualización de comercial_id
                                if(this_row.find('.train-commercial-id').attr('check-value') != this_train.find('.train-commercial-id').attr('check-value')) {
                                    this_row.find('.train-commercial-id').replaceWith(this_train.find('.train-commercial-id'));
                                }                                  
                                //Actualización de acceso
                                if(this_row.find('.train-access').attr('check-value') != this_train.find('.train-access').attr('check-value')) {
                                    this_row.find('.train-access').replaceWith(this_train.find('.train-access'));
                                }
                                //Actualización de vía/sector
                                if(this_row.find('.train-platform').attr('check-value') != this_train.find('.train-platform').attr('check-value')) {
                                        this_row.find('.train-platform').replaceWith(this_train.find('.train-platform'));
                                }
                                //Actualización de observación
                                if(this_row.find('.train-info').attr('check-value') != this_train.find('.train-info').attr('check-value')) {
                                    this_row.find('.train-info').replaceWith(this_train.find('.train-info'));
                                }   
                                checked = true;                          
                            } else {
                                //No coincide el tren a pintar con el pintado.

                                //Comprobamos si el tren pintado continua vigente en la lista
                                var old_train_index = list_trains.findIndex(train => train.id == this_row.attr('train-id'))

                                if(old_train_index === -1) {
                                    //El tren pintado en la fila se ha borrado o desactivado. Borramos el tren y reiniciamos análisis fila
                                    if(AdGr24_get_console_log) AdGr24_consoleLog("Eliminamos tren id: " + this_row.attr('train-id') + " / " + this_row.find('.train-commercial-id').attr('check-value'));
                                    this_row.remove()
                                    checked = false;
                                    continue;
                                } 

                                //Comprobamos si el tren a pintar es nuevo (no estaba en la lista)
                                // Obtenemos las filas con trenes con el mismo id (teóricamente solo debe haber uno como máximo)
                                var new_train_row = this_monitor.find(".table div.train-row[train-id='" + train.id + "']");
                                
                                // var new_train_row = this_monitor.find(".table div.train-row[train-id='" + train.id + "']").first();
                                if(new_train_row.length == 0 || new_train_row.length > 1) {
                                    //Si vale 0, el tren a pintar es nuevo en la lista (por creacción o reordenación)

                                    //Si vale más de 1, hay varios trenes con el mismo id lo cual es un error en los datos, actuamos como si fuera un tren nuevo
                                    //para evitar que se reordenen en bucle infinito los trenes con mismo id.

                                    //Añadimos la nueva fila antes del elemento actual y seguimos proceso
                                    if(AdGr24_get_console_log) AdGr24_consoleLog("Añadimos tren id: " + this_train.attr('train-id') + " / " + this_train.find('.train-commercial-id').attr('check-value'));
                                    this_row.before(this_train);
                                    checked = true;
                                    continue;
                                } else if (new_train_row.length == 1) {
                                    //El tren a pintar existe en otra posición, lo movemos a la fila actual y reiniciamos análisis.
                                    if(AdGr24_get_console_log) AdGr24_consoleLog("Movemos tren id: " + new_train_row.attr('train-id') + " / " + new_train_row.find('.train-commercial-id').attr('check-value'));
                                    checked = false;
                                    new_train_row.insertBefore(this_row);
                                    continue;
                                }


                            }                    

                        }
                        checked = true;
                    }
          
                }                      
            }
            
        });

        //Eliminar filas por enicima de capacidad
        this_monitor.find(".table div.train-row").slice(row_index).remove();

    });
   

     //Creación del monitor de reloj si procede
     $('.adif-gravita-clock').each(function() {

        
        if($(this).find('.adif-blue-clock').length == 0) {

            $(this).empty();
            var div_height = $(this).get(0).offsetHeight;
            var div_width = $(this).get(0).offsetWidth;
            var aspect_ratio = div_width / div_height;
            $(this).append(AdGr24_adifClockHTML(aspect_ratio,'clock'));
        }

     });

    //Creación del monitor de reloj en versión anti-burn-in si procede.
    $('.adif-gravita-black-clock').each(function() {

        if($(this).find('.adif-black-clock').length == 0) {

            $(this).empty();
            var div_height = $(this).get(0).offsetHeight;
            var div_width = $(this).get(0).offsetWidth;
            var aspect_ratio = div_width / div_height;
            $(this).append(AdGr24_adifClockHTML(aspect_ratio,'black-clock'));
        }

    });

    //Creación del monitor en negro si procede
    $('.adif-gravita-black').each(function() {

        $(this).empty();

        var div = $("<div>");
        div.attr('style',"width: 100%; height: 100%; background-color: black;")
        div.addClass('adif-black');
        div.html("");
        
        $(this).append(div);

    });

    //Creación del monitor de número de vía si procede
    $('.adif-gravita-number').each(function() {
    
        var train = []

        var platform_text = ""

        if ($(this).attr('number-if-no-trains') === undefined) {
            if ($(this).attr('platform-location') === undefined) {
                platform_text = ""
            } else {
                platform_text = $(this).attr('platform-location');
            }
        } else {
            platform_text = $(this).attr('number-if-no-trains');
        }

        train.platform = platform_text.replace(/,/g,'·')
        train.sectors = [];


        actual_number = $(this).find('div.adif-number');


        if (actual_number.attr('check-value') != train.platform) {

            $(this).empty();
            var div = $("<div>");
            div.attr('style',"width: 100%; height: 100%")
            div.addClass('adif-number');
            
            div.append(AdGr24_platformSignHTML(train,100));
    
            div.attr('check-value',train.platform);
       
            
            $(this).append(div);
        }



    });
  
    
    //Creación del monitor de número de vía en versión anti-burn-in si procede
    $('.adif-gravita-black-number').each(function() {


        var train = []

        var platform_text = ""

        if ($(this).attr('number-if-no-trains') === undefined) {
            if ($(this).attr('platform-location') === undefined) {
                platform_text = ""
            } else {
                platform_text = $(this).attr('platform-location');
            }
        } else {
            platform_text = $(this).attr('number-if-no-trains');
        }

        train.platform = platform_text.replace(/,/g,'·');
        train.sectors = [];

    
        actual_number = $(this).find('div.adif-black-number');


        if (actual_number.attr('check-value') != train.platform) {
            $(this).empty();
            var div = $("<div>");
            div.attr('style',"width: 100%; height: 100%; font-size: 100%;");
            div.addClass('adif-black-number');
            
            num_rows = $(this).attr('screen-rows');
            if(num_rows >= 9) 
                {var div_rows = 4.5;}
            else 
                {var div_rows = num_rows/2;}

            var div_sup = $("<div>");
            div_sup.attr('style',"width: 100%; height: " + 100*div_rows/num_rows +  "%; background-color: black; font-size: " + 100*div_rows/num_rows + "%;");

            var div_sup1 = $("<div>")
            div_sup1.attr('style',"width: 33.3%; height: 100%; background-color: black;");


            var logo = $("<div>");
            logo.addClass('adif-logo');
            logo.attr('style','width: 100%; height: 100%;');
            logo.append(AdGr24_logoHTML('black',100));
            div_sup1.append(logo);

            var div_sup2 = $("<div>");
            div_sup2.attr('style',"width: 66.7%; height: 100%; background-color: black;");

            div_sup.append(div_sup1);
            div_sup.append(div_sup2);


            var div_cen = $("<div>");
            div_cen.attr('style',"width: 100%; height: " + 100*(num_rows - 2*div_rows)/num_rows +  "%; background-color: black;");

            var div_inf = $("<div>");
            div_inf.attr('style',"width: 100%; height: " + 100*div_rows/num_rows+  "%; background-color: black; font-size: " + 100*div_rows/num_rows + "%;");

            var div_inf_number = $("<div>");
            div_inf_number.attr('style',"width: 95%; height: 100%; background-color: font-size: 100%;");
            div_inf_number.addClass('adif-number-black');
            div_inf_number.html(train.platform);

            var div_inf_padding = $("<div>");
            div_inf_padding.attr('style',"width: 5%; height: 100%; background-color: font-size: 100%;");

            div_inf.append(div_inf_number);
            div_inf.append(div_inf_padding);
    

        
            div.append(div_sup);
            div.append(div_cen);
            div.append(div_inf);

            div.attr('check-value',train.platform);
            $(this).append(div);
        }



    });

    // Generación de la plantilla collapse
    $('.adif-gravita-collapse').each(function() {

        $(this).empty();


    });


    
    //Event listeners para las secuencias de animiaciones en scrolls horizontales
    var elements = $('.scrollableX:not(.scrollingX)');
    elements.each(function(index, el) {
        $(el).on("animationend", function() {
            if ($(el).hasClass('scrollingX-moving')) {
                $(el).removeClass('scrollingX-moving').addClass('scrollingX-fade');
            } else if ($(el).hasClass('scrollingX-fade')) {
                $(el).removeClass('scrollingX-fade').addClass('scrollingX-moving');
            }
        });
    });

    //Event listeners para las secuencias de animiaciones en scrolls verticales por saltos
    $('.scrollableS:not(.scrollingS)').each(function() {
        $(this).on("animationend", function() {
            
            // Si ha terminado una animación de salto de línea vertical:
            if (($(this).hasClass('scrollingS-moving')) || ($(this).hasClass('scrollingS-fade'))) {
                // Indicamos que se ha terminado el salto eliminado la clase scrollingS-moving
                $(this).removeClass('scrollingS-moving');

                // Actualizamos las variables CSS para el siguiente salto e iniciamos una animación en la que el texto se queda fijo en --scrollS-start:
                // (animación intermedia entre dos transiciones)
                var current_line = ~~$(this).attr('current-line');
                var total_lines = ~~$(this).attr('total-lines');
                current_line++;
                if(current_line < total_lines) {
                    $(this).attr('style','--scrollS-start: ' + (-(current_line-1)*100).toString() + '%; --scrollS-end: ' + (-current_line*100).toString() + '%;');   
                    $(this).attr('current-line',current_line);
                    $(this).addClass("scrollingS-stop"); // Si la siguiente transición es otro salto
                    $(this).removeClass('scrollingS-moving');
                    $(this).removeClass('scrollingS-fade');
                } else {
                    $(this).attr('style','--scrollS-start: ' + (-(current_line-1)*100).toString() + '%; --scrollS-end: ' + '0' + '%;');
                    current_line = 0;
                    $(this).attr('current-line',current_line);
                    $(this).addClass("scrollingS-fade-stop"); // Si la siguiente transición es volver a inicio
                    $(this).removeClass('scrollingS-moving');
                    $(this).removeClass('scrollingS-fade');
                }

                // Solo si no queda ningun scroll-Y moviendose iniciamos un temporizador de 1 segundos que da la orden a todos los scrolls-Y de iniciar el
                // siguiente salto. El temporador debe durar (bastante) más que las animaciones tipo stop.                          
                var elements_moving = $('.scrollingS-moving');
                if (elements_moving.length == 0) {
                    setTimeout(function() {
                        var elements_moving = $('.scrollingS-moving');
                        if (elements_moving.length == 0) {
                            $(".scrollingS-stop").addClass("scrollingS").addClass("scrollingS-moving").removeClass("scrollingS-stop");
                            $(".scrollingS-fade-stop").addClass("scrollingS-fade").addClass("scrollingS-moving").removeClass("scrollingS-fade-stop");
                        }
                    }, 0);

                }
            }
        });
    });

    //Event listeners para las secuencias de animiaciones en scrolls verticales por líneas (steps)
    var elements = $('.scrollableY:not(.scrollingY)');
    elements.each(function(index, el) {
        $(el).on("animationend", function() {
            if ($(el).hasClass('scrollingY-moving')) {
                $(el).removeClass('scrollingY-moving').addClass('scrollingY-fade');
            } else if ($(el).hasClass('scrollingY-fade')) {
                $(el).removeClass('scrollingY-fade').addClass('scrollingY-moving');
            }
        });
    });

    //Event listeners para las secuencias de animiaciones en scroll con transición por difuminado (scroll de idiomas)
    $('.scrollableL:not(.scrollingL)').each(function() {
        $(this).on("animationend", function() {


            // Si ha terminado la animación scrollingL y el elemento está no-visible
            if (($(this).hasClass('scrollingL-fadeout'))) {
                // Indicamos que se ha terminado la animación
                $(this).removeClass('scrollingL-active');

                // Datos del elemento actual
                var total_lines = $(this).attr('total_lines');
                var unhidden_line = $(this).attr('unhidden_line');
                

                // Solo si no queda ningun scroll-D moviendose activamos la animación de aparición y cambiamos el idioma de todos los elementos conjuntamente                   
                var elements_moving = $('.scrollingL-active');
                if (elements_moving.length == 0) {
                    setTimeout(function() {

                        //Ocultamos línea actual
                        $(".scrollingL p[line_number='" + unhidden_line + "']").addClass('hidden');
                        $(".scrollingL div[line_number='" + unhidden_line + "']").addClass('hidden');

                        unhidden_line++;

                        if(unhidden_line == total_lines) {
                            unhidden_line = 0;
                        }

                        $(".scrollingL").attr('unhidden_line',unhidden_line);
                        $(".scrollingL p[line_number='" + unhidden_line + "']").removeClass('hidden');
                        $(".scrollingL div[line_number='" + unhidden_line + "']").removeClass('hidden');

                        $(".scrollingL").addClass("scrollingL-fadein").addClass("scrollingL-active").removeClass("scrollingL-fadeout");
                    }, 50);
                    
                }
            }

            // Si ha terminado la animación scrollingL-fadein se pasa automáticamente a scrollingL
            if (($(this).hasClass('scrollingL-fadein'))) {
                $(this).removeClass('scrollingL-active');
                
                // Solo si no queda ningun scroll-D moviendose activamos la animación de aparición                     
                // var elements_moving = $('.scrollingL-active');
                // if (elements_moving.length == 0) {
                    setTimeout(function() {
                        $(".scrollingL-fadein").addClass("scrollingL-fadeout").addClass("scrollingL-active").removeClass("scrollingL-fadein");
                    }, 0);
                    
                // }

            }

        });
    });

    //Event listeners para las secuencias de animiaciones en scroll por flaps (F1 y F2)
    $('.scrollableF1:not(.scrollingF1)').each(function() {
        $(this).on("animationend", function() {
            // Si ha terminado la animación scrollingF1 y el elemento está no-visible
            if (($(this).hasClass('scrollingF1-fadeout'))) {
                // Indicamos que se ha terminado la animación
                $(this).removeClass('scrollingF1-active');
                AdGr24_changeUnhiddenLine($(this));
                // Solo si no queda ningun scroll-F1 moviendose activamos la animación de aparición                     
                var elements_moving = $('.scrollingF1-active');
                if (elements_moving.length == 0) {
                    setTimeout(function() {
                        $(".scrollingF1-fadeout").addClass("scrollingF1-fadein").addClass("scrollingF1-active").removeClass("scrollingF1-fadeout");
                    }, 0);                      
                }             
            }
            // Si ha terminado la animación scrollingL-fadein se pasa automáticamente a scrollingL
            if (($(this).hasClass('scrollingF1-fadein'))) {
                $(this).removeClass('scrollingF1-active');
                
                // Solo si no queda ningun scroll-F1 moviendose activamos la animación de aparición                     
                var elements_moving = $('.scrollingF1-active');
                if (elements_moving.length == 0) {
                    setTimeout(function() {
                        $(".scrollingF1-fadein").addClass("scrollingF1-fadeout").addClass("scrollingF1-active").removeClass("scrollingF1-fadein");
                    }, 0);
                    
                }
            }
        });
    });

    $('.scrollableF2:not(.scrollingF2)').each(function() {
        $(this).on("animationend", function() {
            // Si ha terminado la animación scrollingF2 y el elemento está no-visible
            if (($(this).hasClass('scrollingF2-fadeout'))) {
                // Indicamos que se ha terminado la animación
                $(this).removeClass('scrollingF2-active');
                AdGr24_changeUnhiddenLine($(this));
                // Solo si no queda ningun scroll-F2 moviendose activamos la animación de aparición                     
                var elements_moving = $('.scrollingF2-active');
                if (elements_moving.length == 0) {
                    setTimeout(function() {
                        $(".scrollingF2-fadeout").addClass("scrollingF2-fadein").addClass("scrollingF2-active").removeClass("scrollingF2-fadeout");
                    }, 0);                      
                }             
            }
            // Si ha terminado la animación scrollingL-fadein se pasa automáticamente a scrollingL
            if (($(this).hasClass('scrollingF2-fadein'))) {
                $(this).removeClass('scrollingF2-active');
                
                // Solo si no queda ningun scroll-F2 moviendose activamos la animación de aparición                     
                var elements_moving = $('.scrollingF2-active');
                if (elements_moving.length == 0) {
                    setTimeout(function() {
                        $(".scrollingF2-fadein").addClass("scrollingF2-fadeout").addClass("scrollingF2-active").removeClass("scrollingF2-fadein");
                    }, 0);
                    
                }
            }
        });
    });


    // Sincronizado de parpadeos (blinking)
    $('.blinking-ready').each(function() {

        //La clase blinking-ready solo se usa para inicializar los eventos
        $(this).removeClass('blinking-ready');

        //Si no hay elementos parpadeando inicia el parpadeo, si no espera a sincronizar:
        var elements_blinking = $('.blinking');
        if(elements_blinking.length > 0)  $(this).addClass('blinking-paused');
        else $(this).addClass('blinking');

        $(this).on("animationend", function() {

            //Cuando termine un ciclo de parpadeos .blinking cambia la clase a paused
            $(this).removeClass('blinking')
            $(this).addClass('blinking-paused');

            //Si no quedan elementos con clase blinking, reactiva sincronizadamente totos los parpadeos
            var elements_blinking = $('.blinking');

            if (elements_blinking.length == 0) {
                
                setTimeout(function() {
                    $(".blinking-paused").addClass("blinking").removeClass("blinking-paused");
                }, 0);
                
            }


        });
    });

    
    

    //Activa los scrolls horizontales
    $('.scrollableX:not(.scrollingX)').each(function() {
        // Verificar si el contenido excede el ancho del contenedor. 
        // Si excede del 112% del ancho se hace scroll
        // Si excede del 100% pero es menor que el 112%, se reduce sin scroll


        if ($(this).get(0).scrollWidth > 1.12*$(this).get(0).clientWidth) {

            var ratio_width_client = $(this).get(0).scrollWidth / $(this).get(0).clientWidth;
            var container_width = $(this).attr('container-width');
            var scroll_width = -100*(ratio_width_client - 1);
            var scroll_distance = container_width/100*(ratio_width_client - 1);

            //Modificando esta constante podemos variar la velocidad de scroll horizontal
            if($(this).hasClass('centrable')) {
                var scroll_time = 15*scroll_distance;
            } else {
                var scroll_time = 22*scroll_distance;
            }
            
            $(this).attr('style','--scrollX-width: ' + scroll_width + '%; --scrollX-time: ' + scroll_time + 's;')
            $(this).addClass('scrollingX');
            $(this).addClass('scrollingX-moving');
        }
        else if($(this).get(0).scrollWidth > $(this).get(0).clientWidth) {
            $(this).addClass('reducible');
        } else if($(this).hasClass('centrable')) {
            $(this).addClass('short-observation');
        }
    });


    



    //Activa los scrolls verticales por líneas (steps)
    $('.scrollableS:not(.scrollingS)').each(function() {
        // Verificar si el contenido excede el alto del contenedor. Si cabe no se hace scroll.
        if ($(this).get(0).scrollHeight > $(this).get(0).clientHeight) {
            var total_lines = Math.round($(this).get(0).scrollHeight/$(this).get(0).clientHeight);
            $(this).attr('total-lines',total_lines);
            $(this).attr('style','--scrollS-start: ' + '0' + '%; --scrollS-end: ' + '-100' + '%;');
            $(this).addClass('scrollingS');

            //Esta clase indica que se está ejecutando un salto de scroll y se elimina cuando termina el salto.
            $(this).addClass('scrollingS-moving');
        }
    });

    //Activa los scrolls horizontales
    $('.scrollableY:not(.scrollingY)').each(function() {
        // Verificar si el contenido excede el alto del contenedor. Si cabe no se hace scroll.
        // El tiempo de scroll tiene que venir ya indicado previamente en el CSS in-line --scrollY-time
        if ($(this).get(0).scrollHeight > $(this).get(0).clientHeight) {
            var total_scroll = -100*($(this).get(0).scrollHeight/$(this).get(0).clientHeight - 1);
            
            $(this).css('--scrollY-height',total_scroll + '%');
            $(this).addClass('scrollingY');
            $(this).addClass('scrollingY-moving');

        }
    });

    //Activa los scrolls con transición por difuminado  (scroll de idiomas)
    //Solo hay un elemento visible a la vez que va rotando y en la transición hay difuminado
    //Cada elemento (hijo) debe estar enumerado en una secuencia con el atributo line_number = 0, 1, 2, ... N-1
    //El elemento padre debe tener un atributo con el numero total de hijos total_lines (N) y el numero de linea visible unhidden_line
    //Al inicio el elemento visible es el primero (0)
    $('.scrollableL:not(.scrollingL)').each(function() {
        //Verificamos que el numero de elementos es mayor que 1
        if($(this).attr('total_lines') > 1) {
            //Inicia el proceso (solo si no tiene elementos unfitted -pendientes de aplicar formato-)
            var unfitted = $(this).find('.unfitted');

            if (unfitted.length == 0) {
                $(this).addClass('scrollingL');
                $(this).addClass('scrollingL-fadeout');
                //Esta clase sirve para sincronizar todos los procesos a la vez, solo hace el siguiente paso hasta que no se haya quitado esta clase a todos los elementos
                $(this).addClass('scrollingL-active');
            }

        }   
    });

    //Activa los scrolls por flaps (F1 y F2)
    //Solo hay un elemento visible a la vez que va rotando y en la transición el elmento gira verticalmente
    //Cada elemento (hijo) debe estar enumerado en una secuencia con el atributo line_number = 0, 1, 2, ... N-1
    //El elemento padre debe tener un atributo con el numero total de hijos total_lines (N) y el numero de linea visible unhidden_line
    //Al inicio el elemento visible es el primero (0)
    $('.scrollableF1:not(.scrollingF1)').each(function() {
        //Verificamos que el numero de elementos es mayor que 1
        if($(this).attr('total_lines') > 1) {
            //Inicia el proceso
            $(this).addClass('scrollingF1');
            $(this).addClass('scrollingF1-fadeout');
            //Esta clase sirve para sincronizar todos los procesos a la vez, solo hace el siguiente paso hasta que no se haya quitado esta clase a todos los elementos
            $(this).addClass('scrollingF1-active');
        }   
    });
    $('.scrollableF2:not(.scrollingF2)').each(function() {
        //Verificamos que el numero de elementos es mayor que 1
        if($(this).attr('total_lines') > 1) {
            //Inicia el proceso
            $(this).addClass('scrollingF2');
            $(this).addClass('scrollingF2-fadeout');
            //Esta clase sirve para sincronizar todos los procesos a la vez, solo hace el siguiente paso hasta que no se haya quitado esta clase a todos los elementos
            $(this).addClass('scrollingF2-active');
        }   
    });

    AdGr24_sizeAdjustments()       
}

function AdGr24_sizeAdjustments() {
    // Funciones de ajuste de elementos y textos al tamaño disponible, incluyendo la reducción a abreviaturas
    // Se ejecuta cada 100 ms debido a la latencia en la carga de imagenes y fuentes

    //Alinear hora estimada con hora teórica
    $('.train-row').each(function() {
        var train_time = $(this).find(".train-time p");
        var train_box = $(this).find(".train-time");
        var train_status_divs = $(this).find(".train-status div:not(.fitted)");


        train_status_divs.each(function() {
            
            var font_size = 100;
            var padding_top = 0;
            
            //Ajuste de tamaño cuando la observacion Cancelado/Demorado ocupa más espacio que la hora.
            if($(this).width() > train_time.width()) {
                
                // Relación entre lo que ocupa la hora y la columna de la hora
                var alpha_original = train_time.width()/train_box.width(); 
                var alpha = alpha_original
    
                while($(this).width() > alpha*train_box.width() && font_size > 0) {
                    font_size--;
                    $(this).attr('style','font-size: ' + font_size + "%;");
                    // Si la fuente debe reducirse a menos del 80% para que encaje el mensaje, se permite sobrepasar el espacio que ocupa la hora
                    // hasta un máximo del 90% de espacio de la columna
                    if (font_size < 80) {
                        alpha = alpha_original + (80 - font_size)/80;
                        if (alpha > 0.9) alpha = 0.9;
                    }
                }   
                
                // Calculo del padding_top para alinear el mensaje con texto paradas/observaciones
                // Asume que con font_size = 100, el tamaño de la fuente es el 80% de la altura del <div> de acuerdo al CSS

                var box_ratio = $(this).height()/$(this).width()
                padding_top = (100 - font_size)/100/2*80*box_ratio;


            }

            $(this).removeClass('unfitted').addClass('fitted');
            if($(this).attr('line_number') > 0)  $(this).addClass('hidden');         

            if(font_size == 100) var status_padding_left = (train_box.width() - train_time.width())/2
            else var status_padding_left = (train_box.width() - $(this).width())/2
            var width = train_box.width() - status_padding_left;
            
            // Estilos inline de padding (left o right seún el caso) para alinear hora teorica y estimada, tamaño de fuente, width
            // $(this).attr('style','--delay-padding: ' + status_padding_left + "px; font-size: " + font_size + "%; width: " + width + " px;");
            $(this).attr('style','--delay-padding: ' + status_padding_left + "px; font-size: " + font_size + "%; width: " + width + " px; padding-top: " + padding_top + "%;");
        });
        

    });

    
    //Alinear reloj con ancho de la hora en relojes en orientación vertical
    $('.adif-vertical-clock.adif-blue-clock').each(function() {
        var clock_text_width = $(this).find('.adif-clock-time .clock p').width();
        var clock_width = $(this).find('.adif-clock-time .clock').width();
        if (clock_text_width > 0) {
            $(this).find('.logo img').css("width",(clock_text_width/clock_width*100) + "%");
        }
    })
    

    //Obtiene la abreviatura que mejor encaja en los destinos/orígenes que no caben
    $('.train-direction-iteration').each(function() {

        if ($(this).children().get(0).scrollWidth > $(this).get(0).clientWidth) {
            //Obtenemos el train-id
            var train_id = $(this).parent().parent().attr('train-id');
            if (train_id === undefined) {
                var train_id = $(this).parent().parent().parent().attr('train-id');
            }
            
            
            //Obtenemos los datos del tren
            var train_data = AdGr24_trains_data.trains.filter(function(train) {
                return train.id == train_id;
            });


            //Obtenemos la estación a modificar
            var direction_number = $(this).attr("direction_number");


            if ($(this).parent().hasClass('destination-station')) {
                var station_data = train_data[0].destinations[direction_number];
                var monitor_class = 'departures';
            } else {
                var station_data = train_data[0].origins[direction_number];
                var monitor_class = 'arrivals';
            }
        
            //Obtenemos el número de abreviaturas disponibles para el destino/origen
            var abbrev_total = 0;
            abbrev_total = AdGr24_station_list[station_data['code']].name.length;
        


            //Empezando por la abreviatura actual vamos probando todas hasta encontrar una que cabe o dejar la más corta a las malas (quedaría cortada)
            var abbrev_actual = 0
            if($(this).attr("abbrev") !== undefined ) abbrev_actual = $(this).attr("abbrev");
            while(($(this).children().get(0).scrollWidth > $(this).get(0).clientWidth) && abbrev_actual < abbrev_total - 1) {

                abbrev_actual++;
                $(this).html(AdGr24_stationHTML(station_data,monitor_class,abbrev_actual,true));
                

            }

            $(this).attr("abbrev",abbrev_actual);

            if($(this).children().get(0).scrollWidth > $(this).get(0).clientWidth) {
                $(this).children('.station-combo').addClass('reducible');
            }

            //Finalmente, ocultamos la abreviatura si no es la primera de la lista
            var line_number = $(this).attr("line_number");

            if (line_number != 0) {
                $(this).addClass("hidden");
            }
        }


        
    });

    
    //Reduce el tamaño del texto en los campos reducibles (como los números de vía)
    //Hay que ir con cuidado que estos campos no tengan definidos estilos inline
    $('.reducible:not(.fitted)').each(function() {
        if($(this).attr('line_number') > 0)  $(this).removeClass('hidden');
        var font_size = 100;

        while(($(this).get(0).scrollWidth > $(this).get(0).clientWidth && font_size > 0)) {
            font_size--;
            $(this).attr('style','font-size: ' + font_size + '%;');


        }

        // En platform-sign-number-box establecemos un tamaño máximo para monitores verticales
        if($(this).hasClass('train-platform-tag') && !$(this).hasClass('platform-sign-number-text-size-adjusted')) {
            if($(this).parents('.platform-sign-number-box').length > 0) {
                var ps_box = $(this).closest('.platform-sign-number-box');
                var div_height = ps_box.get(0).offsetHeight;
                var div_width = ps_box.get(0).offsetWidth;

                var max_font_size = div_width/div_height*100;
                if (font_size > max_font_size) {
                    $(this).attr('style','font-size: ' + max_font_size + '%;');
                    $(this).addClass('platform-sign-number-text-size-adjusted');
                }
            }
        }




        if($(this).attr('line_number') > 0) {
            $(this).addClass('hidden');
            $(this).addClass('fitted');
        } 
    });

    //Reduce el tamaño del texto en los subtítulos si no caben
    //Hay que ir con cuidado que estos campos no tengan definidos estilos inline
    $('.title-text-language:not(.fitted)').each(function() {
        if($(this).attr('line_number') > 0)  $(this).removeClass('hidden');
        var font_size = 100;
        if($(this).find('span').hasClass('title-text-language-2-lines')) var font_size = 100;
    
        while(($(this).get(0).scrollWidth > $(this).get(0).clientWidth && font_size > 0)) {
            font_size--;
            var padding_top = 1 - ((font_size)/100)**(0.5);
            $(this).find('span').attr('style','font-size: ' + font_size + '%; padding-top: ' + padding_top + 'em;');
            
        }
        if($(this).attr('line_number') > 0) {
            $(this).addClass('hidden');
            $(this).addClass('fitted');
        } 
    });

    $('.reducible-vertical').each(function() {
        var font_size = 100;
    
        while(($(this).get(0).scrollHeight > $(this).get(0).clientHeight && font_size > 0)) {
            font_size--;
            $(this).attr('style','font-size: ' + font_size + '%;');
        }
        while(($(this).get(0).scrollWidth > $(this).get(0).clientWidth && font_size > 0)) {
            font_size--;
            $(this).attr('style','font-size: ' + font_size + '%;');
        }
    });

    //Reducimos el texto de los numeros de coche que no caben (se hace por grupos, por uniformidad visual por lo que se cambia el tamaño de fuente del padre)
    $('text.coach').each(function() {

        var bbox = this.getBBox();
        var coach_font_size = 48;
        while(bbox.width > 1.00*$(this).attr('coach-lenght') && coach_font_size > 0) {
            coach_font_size = coach_font_size - 1;
            
            $(this).attr('style','font-size: ' + coach_font_size + 'px;');
            bbox = this.getBBox();
            var g = $(this).parent();
            var coaches = g.find('text');
            coaches.each(function() {
                $(this).attr('style','font-size: ' + coach_font_size + 'px;');
            });
        }


    });

    //Ajuste del rectangulo que tapa la distancia entre posición y tren
    $('.distance-rectangle:not(.adjusted)').each(function() {
        fill_color = $(this).parent().closest('.platform-train').css('background-color');
        
        var bbox = this.getBBox();
        var rectangle = $(this).find('rect');

        rectangle.attr('fill',fill_color);
        rectangle.attr('width',bbox.width + 10);
        rectangle.attr('x',bbox.x - 5);

        $(this).addClass('adjusted');


    });


}

function AdGr24_changeUnhiddenLine(object) {
    // Datos del elemento actual
    var total_lines = parseInt(object.attr('total_lines'));
    var old_unhidden_line = parseInt(object.attr('unhidden_line'));


    // Rotamos el elemento visible
    

    var unhidden_line = old_unhidden_line + 1;

    if(unhidden_line == total_lines) {
        unhidden_line = 0;
    }

    object.find("p[line_number='" + unhidden_line + "'],div[line_number='" + unhidden_line + "']").removeClass('hidden').removeClass('opaque');
    object.find("p[line_number='" + old_unhidden_line + "'],div[line_number='" + old_unhidden_line + "']").addClass('hidden');
    object.attr('unhidden_line',unhidden_line);

}

function AdGr24_getListWidths(font_size,show_access,show_platform,show_product,show_number) {
    // Obtiene los anchos de los campos de un monitor tipo salidas/llegadas

    var widths = [];

    // Valores para el caso estándar multiplicados por un factor si la letra es más grande

    switch(font_size) {
        case 1:
            // Caso estándar, letra tamaño medio, monitor de 9 líneas en horiziontal (incl. cabecera)telei
            var factor = 1; // =9/9
            break;
        case 2:
            // Letra tamaño grande, monitor de 8 líneas en horizontal (incl. cabecera)
            var factor = 9/8;
            break;
        case 3:
            // Letra tamaño grande, monitor de 8 líneas en horizontal (incl. cabecera)
            var factor = 9/7.5;
            break;       
    }

    widths['time'] = 11 * factor;

    widths['commercial_id'] = 0;
    if(show_product) widths['commercial_id'] += 18*(63/100) * factor;
    if(show_number) widths['commercial_id'] += 18*(37/100) * factor;

    widths['access'] = 7 * factor;
    widths['platform'] = 8 * factor;


    if(!show_access) {
        widths['access'] = 0;
        widths['platform'] = 10 * factor;
    }

    if(!show_platform) widths['platform'] = 0;

    if(font_size == 3) {
        widths['platform'] = 0.9*widths['platform'];
    }
    


    widths['margin'] = 0.5;  //margen entre .journey e .info y entre .station y .type


    widths['station'] = 100 - (widths['time'] + widths['margin'] + widths['commercial_id'] + widths['access'] + widths['platform'] );
    widths['header-text'] = 100 - (widths['access'] + widths['platform']);
    widths['journey'] = widths['station'];
    widths['info'] =  widths['commercial_id'] + widths['access'] + widths['platform'] - 2*widths['margin'];

    widths['clock'] = 17 * factor;
    widths['logo'] = widths['time']
    widths['title'] = 100 - (widths['clock'] +  widths['logo']);

    // widths para el header de platform y access
    widths['access-header'] = widths['access'] / (widths['clock']/100)
    widths['platform-header'] = widths['platform'] / (widths['clock']/100)
    widths['legend-space-header'] = 100 - widths['access-header'] - widths['platform-header']
 


    return widths;
}

function AdGr24_getPlatformWidths(show_platform_sign, train_screen_rows, train_screen_rows_unrounded) {
    
    //Factor para eliminar las distorsiones creadas por el redondeo del numero de filas del monitor
    if (train_screen_rows >= 10) {
        var eccentricity = train_screen_rows_unrounded/train_screen_rows;
    } else if (train_screen_rows == 9) {
        var eccentricity = train_screen_rows_unrounded/(train_screen_rows + 1);
    } else {
        var eccentricity = train_screen_rows_unrounded/(train_screen_rows + 2);
    }
    
    // Obtiene los anchos de los campos de un monitor tipo vía
    var widths = [];

    widths['sign'] = 20;
    widths['margin'] = 1.5 * eccentricity;
    widths['commercial_id'] = 45 * eccentricity;


    //Si no se muestra el platform-sign, se recupera ese espaio para el resto de elementos:
    if(!show_platform_sign) {
        var new_ratio = (100 - widths['sign'])/100;
        widths['margin'] = widths['margin'] * new_ratio;

        widths['commercial_id'] = widths['commercial_id'] * new_ratio;
    }

    widths['time'] = 100 - (widths['margin'] + widths['commercial_id']);

    
    widths['station'] = 100 - 2*widths['margin'];
    
    if(show_platform_sign) {
        widths['header'] = 100 - widths['sign'];    
    } else {      
        widths['header'] = 100;
    }

    // Estos anchos se adaptan al del platform-sign para que queden encajados debajo del mismo si se muestran:
    widths['stop-time'] = 0.65*widths['sign'];
    widths['stop-circle'] = 0.29*widths['sign'];
    widths['stop-time-margin'] = widths['sign'] - widths['stop-time'] - widths['stop-circle'];
    widths['stop-name-margin'] = 1.5 * (100 - widths['sign'])/100;
    widths['stop-name'] = 100 - widths['sign'] - widths['stop-name-margin'];
    

    return widths;
}





function AdGr24_headerHTML(monitor_class,languages, widths, show_access, show_platform, subtitle) {
    // Obtiene código HTML <div> clase header

    var el = $("<div>");
    el.addClass('header');
    el.append(AdGr24_logoHTML(monitor_class,widths['logo']));
    el.append(AdGr24_titleHTML(monitor_class, languages, widths, subtitle));
    el.append(AdGr24_headerClockLegendHTML(languages, widths,  show_access, show_platform)); 
    el.attr('languages',languages.join(','));

    return el;
}

function AdGr24_logoHTML(monitor_class,width) {
    // Obtiene código HTML <div> clase logo
    var el = $("<div>");
    el.addClass('logo');
    el.attr('style','width: ' + width + '%;');
    var img = $("<img>");
    img.addClass('svg_en_img')
		if (monitor_class == 'departures-cercanias' || monitor_class == 'arrivals-cercanias') {
			img.attr('src', './imgs/cercanias-logo.png');
		} else if (monitor_class == 'departures-old' || monitor_class == 'arrivals-old') {
			img.attr('src', './imgs/logo-adif.webp');
		} else {
			img.attr('src',getMultimediaFolder('svg') + "adifsumma.svg");
		}
    if (monitor_class == 'departures') {
        img.addClass('color-gravita-azul-primario');
    } else if (monitor_class == 'arrivals') {
        img.addClass('color-gravita-blanco');
		} else if (monitor_class == 'departures-cercanias') {
				el.attr('style','width: 40%;');
		} else if (monitor_class == 'arrivals-cercanias') {
				el.attr('style','width: 40%;');
    } else if (monitor_class == 'clock') {
        img.addClass('color-gravita-blanco');
    } else if (monitor_class == 'black') {
        img.addClass('color-gravita-gris');
    }
    el.append(img);
    return el;             
}

function AdGr24_titleHTML(monitor_class, languages, widths, subtitle) {
    // Obtiene código HTML <div> clase title
    var el = $("<div>");
    el.addClass('title');
    el.attr('style','width: ' + widths['title'] + '%;');
    el.append(AdGr24_titleTextHTML(monitor_class, languages, subtitle));
    el.append(AdGr24_marginHTML(100,'title-text-margin'));
    return el;          
}

function AdGr24_titleTextHTML(monitor_class, languages, subtitle) {
    // Obtiene código HTML <div> clase title-text
    var el= $("<div>");
    el.addClass('title-text');
    el.addClass('scrollableL');
    var i = 0;

    //Obtención de referencia y variable del subtítulo (ej. OPERADOR:Renfe -> REFERENCIA:variable)
    subtitle_parts = subtitle.split(":")
    if(subtitle_parts.length > 1) {
        var subtitle_reference = subtitle_parts[0];
        var subtitle_variable = subtitle_parts[1];
    } else {
        var subtitle_reference = subtitle_parts[0];
        var subtitle_variable = ""
    }
    languages.forEach(function(language) {
        var p = $("<div>");
        p.attr('line_number',i);
        p.addClass('title-text-language');
        if(subtitle_reference != "") {
            var subtitle_text = AdGr24_subtitulos[subtitle_reference][language].replace("$", subtitle_variable)
            // Caso ergativo euskera terminado en vocal
            if (language == "EUS" && AdGr24_subtitulos[subtitle_reference][language].includes("$k")) {
                let vocales = "aeiouáéíóúAEIOUÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜ";
                if (!vocales.includes(subtitle_variable.slice(-1)) && !AdGr24_euskera_vocablos_ergativo_no_terminado_en_ek.includes(subtitle_variable)) {
                    var subtitle_text = AdGr24_subtitulos[subtitle_reference][language].replace("$", subtitle_variable + "e")
                }

            }
        }
        if (monitor_class == 'departures' || monitor_class == 'departures-cercanias' || monitor_class == 'departures-old') {
            if(subtitle_reference == "") p.html(AdGr24_frases['Salidas'][language]);
            else if(AdGr24_subtitulos[subtitle_reference][language].includes("<br>")) {
                p.html(AdGr24_frases['Salidas'][language] + "&nbsp;<span style='font-size: 60%;'>" + subtitle_text + "</span>");
                p.addClass('title-text-language-2-lines');
            } else {
                p.html(AdGr24_frases['Salidas'][language] + "&nbsp;<span>" + subtitle_text + "</span>");
            }
        } else {
            if(subtitle_reference == "") p.html(AdGr24_frases['Llegadas'][language]);
            else if(AdGr24_subtitulos[subtitle_reference][language].includes("<br>")) {
                p.html(AdGr24_frases['Llegadas'][language] + "&nbsp;<span style='font-size: 60%;'>" + subtitle_text + "</span>");
                p.addClass('title-text-language-2-lines');
            } else {
                p.html(AdGr24_frases['Llegadas'][language] + "&nbsp;<span>" + subtitle_text + "</span>");
            }
        }
        if(i>0) p.addClass("hidden");
        i++;
        el.append(p);
    });

    el.attr('total_lines',languages.length)
    el.attr('unhidden_line',0)
    return el;             
}

function AdGr24_clockHTML(width) {
    // Obtiene código HTML <div> clase clock
    var el = $("<div>");
    el.addClass('clock');
    el.addClass('monospace');
    el.attr('style','width: ' + width + '%;');
    var p = $("<p>");
    el.append(p);
    return el;                  
}

function AdGr24_headerClockLegendHTML(languages, widths,  show_access, show_platform) {
    // Obtiene código HTML del <div> de la tabla de trenes para monitores llegadas/salidas
    var el = $("<div>");
    el.addClass('header-legend');

    el.attr('style','width: ' + widths['clock'] + '%;');

    if(!show_access && !show_platform) el.append(AdGr24_marginHTML(100,'no-legend-margin-sup'));
    el.append(AdGr24_clockHTML(100));
    if(!show_access && !show_platform) el.append(AdGr24_marginHTML(100,'no-legend-margin-inf'));

    if(show_access || show_platform) {
        el.append(AdGr24_marginHTML(widths['legend-space-header'],'legend-margin'));


        if (show_access) {
            var headeraccess = $("<div>");
            headeraccess.addClass('access-header');
            headeraccess.attr('style','width: ' + widths['access-header'] + '%;');    
            
         
            headeraccess.addClass('scrollableL');
            headeraccess.append(AdGr24_marginHTML(2.5,"header-margin"));
            headeraccess.attr('total_lines',languages.length)
            headeraccess.attr('unhidden_line',0)
        
            var i = 0
            languages.forEach(function(language) {
                var accesstag = $("<p>");
                accesstag.addClass('access-tag');
                accesstag.html(AdGr24_frases['Acceso'][language]);
                accesstag.addClass('reducible');
                accesstag.attr('line_number',i);
                if(i>0) accesstag.addClass("hidden");
                i++;
                headeraccess.append(accesstag);
            });
        
        
        
            headeraccess.append(AdGr24_marginHTML(2.5,"header-margin"));
            el.append(headeraccess);
        }
    
        if (show_platform) {
            var headerplatform = $("<div>");
            headerplatform.addClass('platform-header');
            if (widths['platform'] > 0) {
                headerplatform.attr('style','width: ' + widths['platform-header'] + '%;');    
            } else {
                headerplatform.attr('style','width: 0%; display: none;');    
            }
            
            headerplatform.addClass('scrollableL');
            headerplatform.append(AdGr24_marginHTML(2.5,"header-margin"));
            headerplatform.attr('total_lines',languages.length)
            headerplatform.attr('unhidden_line',0)
        
        
            var i = 0
            languages.forEach(function(language) {
                var platformtag = $("<p>");
                platformtag.addClass('platform-tag');
                platformtag.html(AdGr24_frases['Vía'][language]);
                platformtag.addClass('reducible');
                platformtag.attr('line_number',i);
                if(i>0) platformtag.addClass("hidden");
                i++;
                headerplatform.append(platformtag);
            });
        
            
        
            headerplatform.append(AdGr24_marginHTML(2.5,"header-margin"));
    }

    
        el.append(headerplatform);
    }


    return el;          
}

function AdGr24_tableHTML(color_parity) {
    // Obtiene código HTML del <div> tipo adif-table

    // En monitores de salidas, si color_parity = "even" el primer tren sale con azul oscuro, si  table_colors = "odd" sale con azul claro.
    // En monitores de salidas, si color_parity = "even" el primer tren sale con verde claro, si  table_colors = "odd" sale con verde oscuro.
    var el = $("<div>");

    el.addClass('table');
    el.addClass('train-table');
    if (color_parity == "inverse") {
        el.attr('colors','inverse');
    } else {
        el.attr('colors','normal');
    }
    return el;   

}



function AdGr24_trainHTML(train, languages, monitor_class, widths, journey_scroll, observation_scroll, show_access, show_platform, show_product, show_number, show_stops,
    countdown_active, countdown_traffics, estimated_time_traffics, show_platform_preview) {
    // Obtiene código HTML de elemento clase .train-row

    var el = $("<div>");
    el.attr("train-id",train.id)
    el.addClass("train-row");


    // if (train.status == "cancelled") el.attr('style','background-color: #521625;');    //Añadimos la información complementaria del tren
    train = AdGr24_trainInfoComplement(train);
    
    el.append(AdGr24_trainTimeHTML(train, monitor_class, widths['time'], countdown_active,countdown_traffics,estimated_time_traffics));
    el.append(AdGr24_trainDirectionHTML(train,monitor_class,widths['station'],0));


    el.append(AdGr24_marginHTML(widths['margin'],'list-margin-sup'));

    if(show_product || show_number) el.append(AdGr24_trainCommercialIdHTML(train,widths['commercial_id'],show_product,show_number));


    if (show_access) el.append(AdGr24_trainAccessHTML(train,monitor_class,widths['access']));
    if (show_platform) el.append(AdGr24_trainPlatformHTML(train,monitor_class,widths['platform'],show_platform_preview));

    el.append(AdGr24_trainStatusHTML(train,languages,monitor_class,widths['time'], countdown_active, countdown_traffics,estimated_time_traffics));
    el.append(AdGr24_trainHorizontalJourneyHTML(train, monitor_class, widths['journey'], journey_scroll, show_stops));
    el.append(AdGr24_marginHTML(widths['margin'],'list-margin-inf'));
    el.append(AdGr24_marginHTML(widths['margin'],'list-margin-inf'));
    el.append(AdGr24_trainInfoHTML(train, widths['info'], observation_scroll));
    el.append(AdGr24_marginHTML(widths['margin'],'list-margin-inf'));
    return el;
}


function AdGr24_trainTimeHTML(train, monitor_class, width, countdown_active, countdown_traffics, estimated_time_traffics) {
    // Obtiene el elemento clase .train-time
    var el = $("<div>");

    var check_value = "";

    el.addClass('train-time');

    el.attr('style','width: ' + width + '%;');

    var ps = $("<p>");

    switch(monitor_class) {
        case "departures":
				case "departures-cercanias":
				case "departures-old":
            if (countdown_active && AdGr24_isInCountdownMode(train)) {
                // Muestra cuenta atrás
                ps.html(train.countdown + " min");
                check_value = check_value + train.countdown + " min";
                el.append(ps);
                el.addClass('monospace');
                if(train.delay_out > 5 && !countdown_traffics.includes(train.traffic_type))  {
                    //Cuenta atrás con color de retraso
                    el.addClass('countdown-delayed');
                }
                if (train.countdown == 0 || (train.immediate_out == true && !countdown_traffics.includes(train.traffic_type))) {
                    //Cuenta atrás parpadeando
                    check_value = check_value + "$";
                    el.addClass('blinking-ready');
                }
            } else {
                // Resto de casos, muestra salida teórica (o salida prevista si el tráfico está en estimated-time-traffics)
                if(estimated_time_traffics.includes(train.traffic_type)) {
                    ps.html(AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out));
                    check_value = check_value + AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out);
                } else {
                    ps.html(AdGr24_isoToHoraMinutos(train.departure_time,0));
                    check_value = check_value + AdGr24_isoToHoraMinutos(train.departure_time,0);
                }  
                el.append(ps);
                el.addClass('monospace');
                if (train.immediate_out == true) {
                    check_value = check_value + "$";
                    el.addClass('blinking-ready');
                }               
            }

            break;
         
        case "arrivals":
				case "arrivals-cercanias":
				case "arrivals-old":
            if(estimated_time_traffics.includes(train.traffic_type)) {
                ps.html(AdGr24_isoToHoraMinutos(train.arrival_time,train.delay_in));
                check_value = check_value + AdGr24_isoToHoraMinutos(train.arrival_time,train.delay_in);
            } else {
                ps.html(AdGr24_isoToHoraMinutos(train.arrival_time,0));
                check_value = check_value + AdGr24_isoToHoraMinutos(train.arrival_time,0);
            }  
            el.append(ps);
            el.addClass('monospace');
            if (train.immediate_in == true) {
                check_value = check_value + "$";
                el.addClass('blinking-ready')
            }
            break;          

    }
    if (train.status == "cancelled")  {
        el.addClass('cancelled');
        el.removeClass('blinking-ready')
        check_value = check_value + "#CANCELLED#";
    }
    if (train.status == 'delayed') {
        el.removeClass('blinking-ready')
    }
    el.attr('check-value',check_value);
    return el;
}

function AdGr24_platformTimeHTML(train, width, countdown_traffics, estimated_time_traffics) {
    // Obtiene el elemento clase .train-time
    var el = $("<div>");

    var check_value = "";

    el.addClass('train-time');

    el.attr('style','width: ' + width + '%;');

    var ps = $("<p>");

    //En función de si el tráfico está en countdown-traffics
    if(countdown_traffics.includes(train.traffic_type) && AdGr24_isInCountdownMode(train)) {
        //Se muestra cuenta atrás
        ps.html(train.countdown + " min");
        check_value = check_value + train.countdown + " min";
        el.append(ps);
        el.addClass('monospace');
        if (train.countdown == 0) {
            //Cuenta atrás parpadeando
            check_value = check_value + "$";
            el.addClass('blinking-ready');
        }       
    } else {
        if(estimated_time_traffics.includes(train.traffic_type)) {
            // Se muestra hora prevista
            ps.html(AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out));
            check_value = check_value + AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out);
            el.append(ps);
            el.addClass('monospace');
            if (train.immediate_out == true) {
                check_value = check_value + "$";
                el.addClass('blinking-ready');
            }  
        } else {
            // Se muestra hora teorica (más prevista si va retrasado)      
            if(train.delay_out > 5) {
                ps.html(AdGr24_isoToHoraMinutos(train.departure_time,0) + " <span>" + AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out)  + "</span>");
                check_value = check_value + AdGr24_isoToHoraMinutos(train.departure_time,0);   
                check_value = check_value + "R" + AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out);
            } else {
                ps.html(AdGr24_isoToHoraMinutos(train.departure_time,0));
                check_value = check_value + AdGr24_isoToHoraMinutos(train.departure_time,0);
            }
            el.append(ps);
            el.addClass('monospace');
            if (train.immediate_out == true) {
                check_value = check_value + "$";
                el.addClass('blinking-ready');
            }  
        }
        

    }

   

    el.attr('check-value',check_value);
    return el;
}


function AdGr24_trainDirectionHTML(train,monitor_class,width,abbreviation) {
    // Obtiene el elemento clase .train-direction
    var el = $("<div>");
    var check_value = ""
    el.addClass('train-direction');
    el.addClass('scrollableF1');

    el.attr('style','width: ' + width + '%;');  

    switch(monitor_class) {
        
        case "departures":
				case "departures-cercanias":
				case "departures-old":
            el.addClass('destination-station');
            for(let i = 0;i < train.destinations.length;i++) {
                var d = $("<div style='width: 100%; height: 100%; font-size: 100%'>");
                d.attr("direction_number",i);
                d.append(AdGr24_stationHTML(train.destinations[i],"departures",abbreviation,true));
                if(train.destinations[i].line !== undefined) { 
                    check_value = check_value + "[" + train.destinations[i].line + "]";
                    if(train.destinations[i].line_pic_filename !== undefined) check_value = check_value + "[(" + train.destinations[i].line_pic_filename + ")]";
                    else if(AdGr24_trains_data.multimedia_info.line_pic_filenames[train.destinations[i].line] !== undefined) check_value = check_value + "[(" + AdGr24_trains_data.multimedia_info.line_pic_filenames[train.destinations[i].line] + ")]";
                }
                

                if(AdGr24_station_list[train.destinations[i].code] !== undefined) {
                    if(AdGr24_station_list[train.destinations[i].code].picto !== undefined) check_value = check_value + "(" + AdGr24_station_list[train.destinations[i].code].picto + ")";
                }
                check_value = check_value + train.destinations[i].code + "$";
                if(AdGr24_trains_data.multimedia_info.multimedia_version !== undefined) check_value = check_value + "v=" + AdGr24_trains_data.multimedia_info.multimedia_version + "$";

                d.attr('line_number',i);
                d.attr('abbrev',0);
                d.addClass('train-direction-iteration');
                if(i > 0) d.addClass('opaque');
                el.append(d);
            }

            el.attr('total_lines',train.destinations.length)
            el.attr('unhidden_line',0)
            break;
        case "arrivals":
				case "arrivals-cercanias":
				case "arrivals-old":
            let j = 0;
            for(let i = train.origins.length - 1;i >=0;i--) {
                var d = $("<div style='width: 100%; height: 100%; font-size: 100%'>");
                d.attr("direction_number",i);
                d.append(AdGr24_stationHTML(train.origins[i],"arrivals",abbreviation,true));
                if(train.origins[i].line !== undefined) { 
                    check_value = check_value + "[" + train.origins[i].line + "]";
                    if(train.origins[i].line_pic_filename !== undefined) check_value = check_value + "[(" + train.origins[i].line_pic_filename + ")]";
                    else if(AdGr24_trains_data.multimedia_info.line_pic_filenames[train.origins[i].line] !== undefined) check_value = check_value + "[(" + AdGr24_trains_data.multimedia_info.line_pic_filenames[train.origins[i].line] + ")]";
                    
                }

                if(AdGr24_station_list[train.origins[i].code].picto !== undefined) check_value = check_value + "(" + AdGr24_station_list[train.origins[i].code].picto + ")";
                check_value = check_value + train.origins[i].code + "$";
                if(AdGr24_trains_data.multimedia_info.multimedia_version !== undefined) check_value = check_value + "v=" + AdGr24_trains_data.multimedia_info.multimedia_version + "$";
                

                d.attr('line_number',j);
                d.attr('abbrev',0);
                d.addClass('train-direction-iteration');
                if(i > 0) d.addClass('opaque');
                el.append(d);
                j++;
            }

            el.attr('total_lines',train.origins.length)
            el.attr('unhidden_line',0)
            break;

    }  

    
    if (train.status == "cancelled")  {
        el.addClass('cancelled');
        check_value = check_value + "#CANCELLED#";
    }
    el.attr('check-value',check_value);

    return el;            
}


function AdGr24_trainCommercialIdHTML(train,width,show_product,show_number) {
    // Obtiene el elemento clase .train-commercial-id


    // Reordenación de los números de tren y tipos de forma que:
    // En cada tipo de tren solo haya un máximo de 2 números de tren, creando nuevos tipos de tren iguales para cubir el resto de números
    // Si hay diferentes números de tren para el mismo tipo de tren se agrupan si se puede.

    // Copia de números comerciales:
    var commercial_ids = [...train.commercial_id];
    var commercial_ids_reordered = [];

    //Sobre cada elemento, miramos si hay otros números de tren para el mismo tipo y los fusionamos
    var i = 0;
    while(i < commercial_ids.length) {
        var j = i + 1;
        while(j < commercial_ids.length) {

            if((commercial_ids[i].product == commercial_ids[j].product) && (commercial_ids[i].show_pic == commercial_ids[j].show_pic)) {
   
                commercial_ids[i].numbers.push(...commercial_ids[j].numbers);
                commercial_ids.splice(j);

            } else {
                j++;
            }
        }
        i++;
    }

    //Eliminamos tipos de tren repetidos y ordenamos en ascendente
    
    for(let i = 0; i < commercial_ids.length; i++) {
        if (commercial_ids[i].numbers.length > 1) {
            commercial_ids[i].numbers = [...new Set(commercial_ids[i].numbers)];
            commercial_ids[i].numbers.sort();
        }
        
    }

    //Creamos elementos extras si el tipo de tren tiene más de 2 números,
    commercial_ids.forEach(function(comid) {

        if (comid.numbers.length > 2) {

            var i = 0;
            while(i < comid.numbers.length) {
                let comid_copia = { ...comid };
                comid_copia.numbers = comid_copia.numbers.slice(i, i+2);
                commercial_ids_reordered.push(comid_copia);

                i = i + 2;
            }
            
        } else {
            commercial_ids_reordered.push(comid);
        }
    });

    if(show_product) {
        if (show_number) {
            var product_width = 61;
            var number_width = 35;
            var margin_width = 2;
        } else {
            var product_width = 96;
            var number_width = 0;
            var margin_width = 4;           
        }
    } else {
        if(show_number) {
            var product_width = 0;
            var number_width = 96;
            var margin_width = 4;
        } else {
            var product_width = 0;
            var number_width = 0;
            var margin_width = 0;                
        }

    }


    var el = $("<div>");
    var check_value = "";

    el.addClass('train-commercial-id');
    el.attr('style','width: ' + width + '%;');
    el.addClass('scrollableF2');

    var i = 0;
    commercial_ids_reordered.forEach(function(com_id) {
        var d = $("<div>");
        d.addClass('train-commercial-id-iteration');
        d.attr('line_number',i);

        if(show_product) {
            d.append(AdGr24_trainProductHTML(com_id,product_width))
            d.append(AdGr24_marginHTML(margin_width,'train-commercial-id-margin'));
        }

        d.append(AdGr24_trainNumberHTML(com_id,number_width))
        d.append(AdGr24_marginHTML(margin_width,'train-commercial-id-margin'));

        // if(i>0) d.addClass("hidden");
        if(com_id.show_pic) check_value = check_value + com_id.pic_filename + "$";
        else check_value = check_value + com_id.product + "$";
        if(AdGr24_trains_data.multimedia_info.multimedia_version !== undefined) check_value = check_value + "v=" + AdGr24_trains_data.multimedia_info.multimedia_version + "$";
        if (com_id.show_pic) check_value = check_value +"$"
        check_value = check_value + com_id.numbers[0] + "%"
        if (com_id.numbers[1] != undefined) check_value + com_id.numbers[1] + "%"
        i++;


        el.append(d);

    });

    el.attr('total_lines',commercial_ids_reordered.length)
    el.attr('unhidden_line',0)
    el.attr('check-value',check_value);
    return el;
}



function AdGr24_trainProductHTML(commercial_id,width) {
    // Obtiene el elemento clase .train-type
    var el = $("<div>");
    el.addClass('train-product');
    el.attr('style','width: ' + width + '%;');
    if(commercial_id.show_pic === undefined) commercial_id.show_pic = true;
    if(commercial_id.pic_filename === undefined) {
        if(AdGr24_trains_data.multimedia_info.product_pic_filenames[commercial_id.product] !== undefined) commercial_id.pic_filename = AdGr24_trains_data.multimedia_info.product_pic_filenames[commercial_id.product];
        else commercial_id.pic_filename = commercial_id.product;
    }

    if(!AdGr24_verifyTrainProductImageExtension(commercial_id.pic_filename)) commercial_id.pic_filename = commercial_id.pic_filename + ".png";

    if(commercial_id.show_pic) {
        var img1 = $("<img>");
        if(commercial_id.pic_filename.endsWith('.svg')) img1.addClass('svg_en_img');
        var pic_filename = commercial_id.pic_filename;
        if(AdGr24_trains_data.multimedia_info.multimedia_version !== undefined) pic_filename = pic_filename + "?v=" + AdGr24_trains_data.multimedia_info.multimedia_version
        img1.attr("src", getMultimediaFolder('trains') + pic_filename);
        el.append(img1);
    } else {
        el.append(AdGr24_marginHTML(3,'train-product-margin'));
        var p = $("<div>");
        p.addClass('reducible-vertical');
        p.addClass('train-product-tag')
        p.html("<p>" + commercial_id.product + "</p>")
        el.append(p);
        el.append(AdGr24_marginHTML(3,'train-product-margin'));
    }
    return el;
}

function AdGr24_verifyTrainProductImageExtension(pic_filename) {
    return pic_filename.endsWith('.png') || pic_filename.endsWith('.svg');
}

function AdGr24_trainNumberHTML(commercial_id,width) {
    
    // Obtiene el elemento clase .train-number
    var el = $("<div>");
    el.addClass('train-number');
    el.addClass('monospace');
    
    el.attr('style','width: ' + width + '%;');
    var ps = $("<div>");
    ps.addClass('train-number-tag');
    ps.addClass('reducible');
    el.append(ps);
    if(commercial_id.numbers[1] !== undefined) {
        ps.html("<p>" + commercial_id.numbers[0] + "<br>" + commercial_id.numbers[1] + "</p>");
    } else {
        ps.html("<p>" + commercial_id.numbers[0] + "</p>");
    }
    return el;
}

function AdGr24_trainAccessHTML(train,monitor_class,width) {
    // Obtiene el elemento clase .train-access
    var el = $("<div>");
    var check_value = ""

    el.addClass('train-access');
    el.attr('style','width: ' + width + '%;');
    var ps = $("<div>");
    ps.addClass('access-tag');
    ps.addClass('reducible');

    if(train.status == "cancelled") {
        ps.html("");
        check_value = "CANCELLED";
        el.append(ps);
        el.attr('check-value',check_value);
        return el;
    }


    if(monitor_class == 'departures' || monitor_class == 'departures-cercanias' || monitor_class == 'departures-old') {
        if(Array.isArray(train.departures_access)) {
            
            var access_list = train.departures_access.join("")
            // Codigo provisional acceso con hora
            
            if (access_list.includes(":")) {
                ps.addClass('access-time')
                ps.addClass('monospace')
                var img2 = $("<img>");
                img2.addClass("picto");
                img2.addClass('svg_en_img');
                img2.attr("src",getMultimediaFolder('svg') + "clock.svg");
                img2.addClass('color-gravita-verde-primario')
                ps.append(img2);
            }
            ps.html(ps.html() + train.departures_access.join(""));
            check_value = train.departures_access.join("");
        } else {
            ps.html("");
            check_value = ""
        }

    } else {
        if(Array.isArray(train.arrivals_access)) {
            ps.html(train.arrivals_access.join(""));
            check_value = train.arrivals_access.join("");
        } else {
            ps.html("");
            check_value = ""            
        }

    }
    el.append(ps);
    el.attr('check-value',check_value);
    return el;
}


function AdGr24_trainPlatformHTML(train,monitor_class,width,show_platform_preview) {
    // Obtiene el elemento clase .train-platform, .train-platform-preview o .train-platform-arrival-preview
    var check_value = ""

    var el = $("<div>");
    el.addClass('train-platform');
    el.attr('style','width: ' + width + '%;');

    var ps = $("<div>");
    ps.addClass('train-platform-tag')
    ps.addClass("reducible");
    
    if(train.status == "cancelled") {
        ps.html("");
        check_value = "CANCELLED";
        el.attr('check-value',check_value);
        return el;
    }

    var train_sectors_string = "";
    var train_sectors_string_in = "";

    var sectorization_mode = AdGr24_default_sectorization_mode;

    if(AdGr24_trains_data.station_settings.platforms[train.platform] !== undefined) {
        if(AdGr24_trains_data.station_settings.platforms[train.platform].sectorization_mode !== undefined) {
            sectorization_mode = AdGr24_trains_data.station_settings.platforms[train.platform].sectorization_mode;
        }
    }

    switch(sectorization_mode) {
        case "all":
            if(train.sectors_in !== undefined) {
                train.sectors_in.forEach(function(sector) {
                    train_sectors_string_in = train_sectors_string_in + sector;
                });
            }
            if(train.sectors !== undefined) {
                train.sectors.forEach(function(sector) {
                    train_sectors_string = train_sectors_string + sector;
                });
            }
            break;

        case "first_and_last":
            if(train.sectors_in !== undefined) {
                if(train.sectors_in.length > 1) {
                    train_sectors_string_in = train.sectors_in[0] + train.sectors_in[train.sectors_in.length - 1]
                } else if(train.sectors_in.length > 0) {
                    train_sectors_string_in = train.sectors_in[0] 
                }
            }
            if(train.sectors !== undefined) {
                if(train.sectors.length > 1) {
                    train_sectors_string = train.sectors[0] + train.sectors[train.sectors.length - 1]
                } else if(train.sectors.length > 0) {
                    train_sectors_string = train.sectors[0] 
                }       
            }
            break;

        case "middle":
            if(train.sectors_in !== undefined) {
                if(train.sectors_in.length > 0) train_sectors_string_in = train.sectors_in[Math.floor((train.sectors_in.length - 1)/2)];
            }
            if(train.sectors !== undefined) {
                if(train.sectors.length > 0) train_sectors_string = train.sectors[Math.floor((train.sectors.length - 1)/2)];
            }
            break;   
            
        case "middle_up":
            if(train.sectors_in !== undefined) {
                if(train.sectors_in.length > 1) train_sectors_string_in = train.sectors_in[Math.ceil((train.sectors_in.length - 1)/2)];
                else if(train.sectors_in.length > 0) train_sectors_string_in = train.sectors_in[0];
            }
            if(train.sectors !== undefined) {
                if(train.sectors.length > 1) train_sectors_string = train.sectors[Math.ceil((train.sectors.length - 1)/2)];
                else if(train.sectors.length > 0) train_sectors_string = train.sectors[0];
            }
            break;   
    
        case "none":
            break;

    }



    

    if (train.platform_in === undefined || monitor_class == "departures" || monitor_class == "departures-cercanias" || monitor_class == "departures-old" || monitor_class == "platform") {
        if (train.platform == "") {
            if(train.platform_preview !== undefined && show_platform_preview) {
                if (train.platform_preview[0] != "_") ps.html("<p>" + train.platform_preview + "</p>");
                else ps.html("<p></p>");
                ps.addClass('preview');
                el.addClass('train-platform-preview');
                check_value = "PVW$" + train.platform_preview
            }
            else {
                ps.html("");

            }
        } else {
            if (train.platform != "BUS" || monitor_class == "platform") {
                ps.html("<p>" + train.platform + train_sectors_string + "</p>");

                check_value = train.platform + train_sectors_string
            } else {
                var img = $("<img>");
                img.addClass("picto");
                img.addClass('svg_en_img')
                img.attr("src",getMultimediaFolder('svg') + "bus" + ".svg");
                if(monitor_class == "arrivals" || monitor_class == "arrivals-cercanias" || monitor_class == "arrivals-old") {
                    img.addClass('color-gravita-azul-primario');
                } else {
                    img.addClass('color-gravita-blanco');
                }
                check_value = "BUS"
                ps.removeClass('reducible');
                ps.append(img);
                

            }           

        }
    } else {
        if (train.platform_in == "") {
            if(train.platform_preview_in !== undefined && show_platform_preview) {
                if (train.platform_preview_in[0] != "_") ps.html("<p>" + train.platform_preview_in + "</p>");
                else ps.html("<p></p>");
                ps.addClass('preview');
                el.addClass('train-platform-preview');
                check_value = "PVW$" + train.platform_preview_in
            }
            else {
                ps.html("");

            }
        } else {
            if (train.platform_in != "BUS") {
                ps.html("<p>" + train.platform_in + train_sectors_string_in + "</p>");

                check_value = train.platform_in + train_sectors_string_in
            } else {
                var img = $("<img>");
                img.addClass("picto");
                img.addClass('svg_en_img')
                img.attr("src",getMultimediaFolder('svg') + "bus" + ".svg");
                img.addClass('color-gravita-azul-primario'); 
                check_value = "BUS"   
                ps.removeClass('reducible');     
                ps.append(img);
   
            }

        }    
    }
    
    el.attr('check-value',check_value);
    el.append(ps);
    return el;

}

function AdGr24_trainStatusHTML(train,languages,monitor_class,width,countdown_active,countdown_traffics, estimated_time_traffics) {
    // Obtiene el elemento clase .train-status
    var el = $("<div>");
    var check_value = "";

    el.addClass('monospace');
    el.addClass('train-status');
    el.attr('style','width: ' + width + '%;');
    if (train.status == "delayed") {
        var i = 0
        languages.forEach(function(language) {
            var p = $("<div>");
            p.html(AdGr24_frases['Demorado'][language]);
            check_value = check_value + "#" + AdGr24_frases['Demorado'][language];
            p.addClass('status-tag');
            p.addClass('unfitted');
            p.attr('line_number',i);
            i++;
            
            el.append(p);
            
        });
        el.addClass('scrollableL');
        el.attr('total_lines',languages.length)
        el.attr('unhidden_line',0)
        el.attr('check-value',check_value);
        return el;
    }

    if (train.status == "cancelled") {
        var i = 0
        languages.forEach(function(language) {
            var p = $("<div>");
            p.html(AdGr24_frases['Cancelado'][language]);
            check_value = check_value + "#" + AdGr24_frases['Cancelado'][language];
            p.addClass('status-tag');
            p.addClass('unfitted');
            el.addClass('cancelled');
            p.attr('line_number',i);
            i++;
            
            el.append(p);
            
        });
        el.addClass('scrollableL');
        el.attr('total_lines',languages.length)
        el.attr('unhidden_line',0)
        el.attr('check-value',check_value);
        return el;
    }

    var p = $("<div>");
    switch(monitor_class) {
        case "departures":
				case "departures-cercanias":
				case "departures-old":
            
            if(countdown_active && AdGr24_isInCountdownMode(train)) {
                // En hora sale el tren en cuenta atrás
                if(countdown_traffics.includes(train.traffic_type)){
                    // No requiere hora teórica
                    p.html("");
                } else {
                    // Requiere hora teórica
                    el.addClass('teorical');
                    p.html(AdGr24_isoToHoraMinutos(train.departure_time,0));
                    check_value = check_value + "#T#" + AdGr24_isoToHoraMinutos(train.departure_time,0);
                    if (train.countdown == 0 || (train.immediate_out == true && !countdown_traffics.includes(train.traffic_type))) {
                        el.addClass('blinking-ready')
                        check_value = check_value + "$";
                    }
                }                    
            } else 
                // En hora sale la hora teorica (o la prevista si tipo de tren en estimated-train-types)
            {
                if (estimated_time_traffics.includes(train.traffic_type)) {
                    // En hora sale la hora prevista, no ponemos nada.
                    p.html("");
                }
                else if (train.delay_out >= 5) {
                    // En hora sale la hora teórica, ponemos la prevista si prodcede
                    p.html(AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out));
                    check_value = check_value + "#R#" + AdGr24_isoToHoraMinutos(train.departure_time,train.delay_out);
                    if (train.immediate_out == true) {
                        el.addClass('blinking-ready')
                        check_value = check_value + "$";
                    }
                } else {
                    p.html("");
                }                
            }
            break;

        case "arrivals":
				case "arrivals-cercanias":
				case "arrivals-old":
            el.attr('style','width: ' + width + '%;');
            if (estimated_time_traffics.includes(train.traffic_type)) {
                // En hora sale la hora prevista, no ponemos nada.
                p.html("");
            }
            else if (train.delay_out >= 5) {
                // En hora sale la hora teórica, ponemos la prevista si prodcede
                p.html(AdGr24_isoToHoraMinutos(train.arrival_time,train.delay_in));
                check_value = check_value + "#R#" + AdGr24_isoToHoraMinutos(train.arrival_time,train.delay_in);
                if (train.immediate_in == true) {
                    el.addClass('blinking-ready')
                    check_value = check_value + "$";
                }
            } else {
                p.html("");
            }  
            break;
    }
 

    el.append(p);
    el.attr('check-value',check_value);
    return el;
}

function AdGr24_trainHorizontalJourneyHTML(train, monitor_class, width, journey_scroll, show_stops) {
    // Obtiene el elemento clase .train-horizontal-journey

   

    // Selecciona paradas de llegada o de salida
    switch (monitor_class) {
        case "departures":
            var journey = train.journey_stops_destination;
            var has_intermediate_stops = train.has_intermediate_destination_stops;
            break;
        case "arrivals":     
            var journey = train.journey_stops_origin;
            var has_intermediate_stops = train.has_intermediate_origin_stops;
            break;       
    }

    var el = $("<div>");
    var check_value = "";

    el.addClass('train-horizontal-journey');
    el.attr('style','width: ' + width + '%;');

    if(train.status == "cancelled") {
        check_value = check_value + "#CANCELLED#";
        el.html("");
        el.attr('check-value',check_value);
        return el;
    }

    if(!show_stops) {
        check_value = check_value + "#NOT SHOW STOPS#";
        el.html("");       
        el.attr('check-value',check_value);
        return el;
    }


    switch (journey_scroll) {
        case "S": //scroll vertical por bloques 1 línea (steps)
            var div = $("<div>");
            div.addClass('scrollableS');
            div.addClass('scroll-by-blocks');
            div.attr('current-line',1);
            var initialized = false
            if (has_intermediate_stops) {
                journey.forEach(function(station) {
                    if(!station.declared_as_destination) {
                        if (initialized) {
                            div.append("<div>&nbsp;·&nbsp;</div>");
                        }
                        div.append(AdGr24_stationHTML(station,monitor_class,0,false));
                        if (AdGr24_station_list[station.code].picto !== undefined) check_value = check_value + "(" + AdGr24_station_list[station.code].picto + ")";
                        check_value = check_value + station.code + "%" + station.branch + "$";
                        initialized = true;                       
                    }
                });
            }
            el.append(div);
            break;  
        case "P": //scroll vertical por estaciones 1 línea
            var div = $("<div>");
            div.addClass('scrollableS');
            div.addClass('scroll-by-stations');
            div.attr('current-line',1);
            if (has_intermediate_stops) {
                journey.forEach(function(station) {
                    if(!station.declared_as_destination) {
                        div.append(AdGr24_stationHTML(station,monitor_class,0,false));
                        if (AdGr24_station_list[station.code].picto !== undefined) check_value = check_value + "(" + AdGr24_station_list[station.code].picto + ")";
                        check_value = check_value + station.code + "%" + station.branch + "$";
                    }
                });
            }
            el.append(div);
            break;  
        default: //scroll horizontal 1 línea ("X")
            var div = $("<div>");
            div.addClass('scrollableX');
            div.attr('container-width',width);
            var initialized = false
            if (has_intermediate_stops) {
                journey.forEach(function(station) {
                    if(!station.declared_as_destination) {
                        if (initialized) {
                            div.append("<div>&nbsp;·&nbsp;</div>");
                        }
                        div.append(AdGr24_stationHTML(station,monitor_class,0,false));
                        if(AdGr24_station_list[station.code] !== undefined) {
                            if (AdGr24_station_list[station.code].picto !== undefined) check_value = check_value + "(" + AdGr24_station_list[station.code].picto + ")";
                        }
                        check_value = check_value + station.code + "%" + station.branch + "$";
                        initialized = true;
                    }
                });
            }
            el.append(div);
            break;  
    }



    el.attr('check-value',check_value);
    return el;
}

function AdGr24_marginHTML(width, class_name, height=-1) {
    // Obtiene un elemento vacío para margen con el ancho (en unidades %) y la clase indicada

    var el = $("<div>");
    el.addClass(class_name);
    if (height == -1) el.attr('style','width: ' + width + '%;');
    else  el.attr('style','width: ' + width + '%; height: ' + height + "%;");
    return el;

}

function AdGr24_marginHTMLem(width, class_name) {
    // Obtiene un elemento vacío para margen con el ancho (en unidades em) y la clase indicada

    var el = $("<div>");
    el.addClass(class_name);
    el.attr('style','min-width: ' + width + "em;");

    return el;

}



function AdGr24_trainInfoHTML(train, width, observation_scroll) {
    // Obtiene el elemento clase .info
    var el = $("<div>");
    var check_value = "";
    el.addClass('train-info');
    el.attr('style','width: ' + width + '%;');
    var div = $("<div>");
    switch (observation_scroll) {

        case "S":
            div.addClass('scrollableS');
            div.attr('current-line',1);
            break;   
        default: // case "X"
            div.addClass('scrollableX');
            div.attr('container-width',width);
            break;                
    }
    
    if(train.observation === undefined) train.observation = "";
    div.html(train.observation.trim());
    check_value = train.observation.trim();

    el.attr('check-value',check_value);
    el.append(div);
    return el;

}


function AdGr24_stationHTML(station, monitor_class, abbreviation, show_line) {

    //Por si no está dada de alta correctamente la estación en el diccionario

    if(AdGr24_station_list[station.code] === undefined) {
        AdGr24_station_list[station.code] = [];
        AdGr24_station_list[station.code].name = [station.code];
    } else if(AdGr24_station_list[station.code].name === undefined) {
        AdGr24_station_list[station.code].name = [station.code];
    }

    //Obtiene el código HTML del nombre de una estación, agregando los iconos asociados a la misma si procede
    var div = $("<div>");
    div.addClass("station-combo");



    if(show_line) {
        if (station.line !== undefined) {
            if(station.line_pic_filename === undefined) {
                if(AdGr24_trains_data.multimedia_info.line_pic_filenames[station.line] !== undefined) station.line_pic_filename = AdGr24_trains_data.multimedia_info.line_pic_filenames[station.line];
                else station.line_pic_filename = station.line;
            }

            if(!station.line_pic_filename.endsWith('.svg')) station.line_pic_filename = station.line_pic_filename + ".svg";
            var img1 = $("<img>");
            img1.addClass("line");
            img1.addClass('svg_en_img');
            var line_pic_filename = station.line_pic_filename;
            if(AdGr24_trains_data.multimedia_info.multimedia_version !== undefined) line_pic_filename = line_pic_filename + "?v=" + AdGr24_trains_data.multimedia_info.multimedia_version
            img1.attr("src",getMultimediaFolder('lines') + line_pic_filename);
            div.append(img1);
        }
    }

  
    var p = $("<div>");
  
    if(AdGr24_station_list[station.code] !== undefined) {
        p.html(AdGr24_station_list[station.code].name[abbreviation]);

        if (AdGr24_station_list[station.code].picto !== undefined) {
            p.append(AdGr24_marginHTMLem(0.3,'station-combo-margin'));
            var img2 = $("<img>");
            img2.addClass("picto");
            img2.addClass('svg_en_img');
            img2.attr("src",getMultimediaFolder('station_pictos') + AdGr24_station_list[station.code].picto + ".svg");
            switch(monitor_class) {
                case "departures":
								case "departures-cercanias":
								case "departures-old":
                case "platform":
                    img2.addClass('color-gravita-blanco');
                    break;
                case "arrivals":
                    img2.addClass('color-gravita-azul-primario');
                    break;
            }
            p.append(img2);
    
    
        }

    } else {
        p.html(station.code);
    }
    
    





    if (monitor_class == "platform") {
        div.addClass("reducible");
    }

    div.append(p);

    return div;

}



function AdGr24_platformTrainHTML(train, platforms, total_trains, screen_rows_rounded, screen_rows_real, show_platform_sign, platform_side, show_composition, show_observation,
                        pin_position, pin_style, countdown_traffics, estimated_time_traffics, platform_arrangement, sectors_highlight) {
    // Obtiene el elemento clase .platform-train
    // total_trains: número total de trenes en pantalla
    // screen_rows_rounded: número entero total de líneas en pantalla (según relación de aspecto), monitor 16:9 genera 18 líneas

    var el = $("<div>");
    el.addClass('platform-train');
    el.attr("train-id",train.id);


    //Añadimos la información complementaria del tren
    train = AdGr24_trainInfoComplement(train);

    //Dimensiones del <div> relativa y absoluta
    var train_height = 100 / total_trains;


    // Número de lineas dedicadas al tren y altura relativa de cada línea dentro del tren)
    var train_screen_rows = screen_rows_rounded / total_trains
    var train_screen_rows_unrounded = screen_rows_real / total_trains;


    // Si la altura disponible es demasiado pequeña, se mostrarán las paradas en scroll horizontal como en los monitores de salidas
    var show_horizontal_journey = false

    // Comprobamos si se deben mostrar picos por encima o por debajo del tren
    var down_pictos = pin_style.includes('stairs_up_left') || pin_style.includes('stairs_up_right') || pin_style.includes('lift_up') || pin_style.includes('accessible_lift_up');
    var up_pictos = pin_style.includes('stairs_down_left') || pin_style.includes('stairs_down_right') || pin_style.includes('lift_down') || pin_style.includes('accessible_lift_down') || pin_style.includes('pin');

    // Modo de dibujo de composición expandido si hay pictos arriba y abajo
    var composition_expanded = down_pictos && up_pictos;

    // Modo de dibujo con los sectores abajo si solo hay pictos abajo
    var down_sectors = down_pictos && !up_pictos;

    // Obtenemos si hay que dibujar observacion
    if(train.observation === undefined) train.observation = "";
    if (show_observation) show_observation = train.observation.trim() != "";


    // Declinamos el dibujo de la composición si no está dada de alta la topología de vía
    // Retrocompatibilidad en JSIV station/platform end/start
    if(platforms[train.platform] === undefined) {
        show_composition = false;
    } else if(platforms[train.platform].platform_start === undefined || platforms[train.platform].platform_end === undefined) {
        if(platforms[train.platform].station_start === undefined || platforms[train.platform].station_end === undefined)
            show_composition = false;
        else {
            platforms[train.platform].platform_start = platforms[train.platform].station_start;
            platforms[train.platform].platform_end = platforms[train.platform].station_end;
        }
    }

    // Autocalculamos la longitud del tren si no se ha incluído en JSIV
    if(show_composition && train.composition !== undefined && train.train_length === undefined) {
        var train_length = 0;
        train.composition.forEach(function(unit) {
            unit.forEach(function(coach) {
                if(coach.length !== undefined) train_length += parseInt(coach.length);
            });
        });
        train.train_length = train_length;
    }

    // Si no hay composición declarada, o su longitud es 0, no se dibuja:
    if(train.composition === undefined || train.train_length == 0) show_composition = false;


    if(train_screen_rows >= 9) {
        var header_screen_rows = 4.5;
        if(show_composition) {
            var composition_screen_rows = 2;  
            if (composition_expanded) composition_screen_rows = 3;
            else if(down_sectors) composition_screen_rows = 2.2;
        } else {
            var composition_screen_rows = 0;
        }
        if (show_observation) var observation_screen_rows = 1;
        else observation_screen_rows = 0;

    } else if ((train_screen_rows >= 7))  {
        var header_screen_rows = train_screen_rows/2;
        var observation_screen_rows = 0;
        if (composition_expanded) header_screen_rows = (train_screen_rows - 1)/2;
        else if(down_sectors) header_screen_rows = (train_screen_rows - 0.2)/2;

        if(show_composition) {
            var composition_screen_rows = 2;  
            if (composition_expanded) composition_screen_rows = 3;
            else if(down_sectors) composition_screen_rows = 2.2;
        } else {
            var composition_screen_rows = 0;
        }
    } else {
        var header_screen_rows = 0.75*train_screen_rows;
        var composition_screen_rows = 0;
        var observation_screen_rows = 0;
        show_horizontal_journey = true;
    } 

    

    //Si no hay vía dada de alta no se dibuja
    if(platforms[train.platform] === undefined) composition_screen_rows = 0;


    var journey_screen_rows = train_screen_rows - header_screen_rows - observation_screen_rows - composition_screen_rows;
 
    
    el.attr('style','height: ' +  train_height + '%; font-size: ' + train_height + '%;');

    //Dimensiones de los elementos relativas y absolutas
    var header_height = 100 * header_screen_rows/train_screen_rows;

    var journey_height = 100 * journey_screen_rows/train_screen_rows;
    
    var observation_height = 100 * observation_screen_rows/train_screen_rows;

    var composition_height = 100 * composition_screen_rows/train_screen_rows;

    //Si hay platform_side definido se fuerza a mostar el platform_sign
    if(platform_side !== undefined) show_platform_sign = true;

    //Anchos de los elementos
    var widths = AdGr24_getPlatformWidths(show_platform_sign,train_screen_rows,train_screen_rows_unrounded);

    el.append(AdGr24_platformHeaderHTML(train,header_height,widths,show_platform_sign, platform_side, countdown_traffics, estimated_time_traffics));
    
    if (show_horizontal_journey) {
        el.append(AdGr24_trainPlatformHorziontalJourneyHTML(train,journey_height,widths));
    } else {
        el.append(AdGr24_trainVerticalJourneyHTML(train, journey_screen_rows, journey_height, widths));
    }


    
    if(show_observation && observation_screen_rows >0 ) {
        el.append(AdGr24_marginHTML(1,'platform-info-margin',observation_height));
        el.append(AdGr24_platformInfoHTML(train,98,'X',observation_height));
        el.append(AdGr24_marginHTML(1,'platform-info-margin',observation_height));
    }

    if (train.composition !== undefined && composition_screen_rows > 0 && show_composition) {
         el.append(AdGr24_trainCompositionHTML(train, platforms, pin_position, pin_style, composition_height, platform_arrangement, sectors_highlight, composition_expanded, down_sectors));
    }

    return el;

}

function AdGr24_platformHeaderHTML(train,header_height,widths,show_platform_sign,platform_side,countdown_traffics,estimated_time_traffics) {

    var el = $("<div>");
    el.addClass('platform-header');
    el.attr('style','height: ' +  header_height + '%; font-size: ' +  header_height + '%;');

    if(show_platform_sign && platform_side == "left") el.append(AdGr24_platformSignHTML(train,widths['sign'],platform_side));
    el.append(AdGr24_platformTrainHeaderHTML(train,widths,countdown_traffics,estimated_time_traffics));
    if(show_platform_sign && platform_side != "left") el.append(AdGr24_platformSignHTML(train,widths['sign'],platform_side));
    return el;
}

function AdGr24_platformSignHTML(train,width,platform_side) {
    var el = $("<div>");
    el.addClass('platform-sign');
    el.attr('style','width: ' + width + '%;');
    
    var bar = $("<div>");
    bar.addClass('platform-sign-bar');
   
    var box = $("<div>");
    box.addClass('platform-sign-number-box');
    box.append("<div class='platform-sign-number-margin-sup'>");


    if(platform_side == "left") {
        //Vía en lado izquierda
        var div = $("<div>");
        div.addClass('platform-sign-number-margin-left');

        var img = $("<img>");
        img.addClass('arrow');
        img.addClass('color-gravita-blanco')
        img.addClass('svg_en_img');
        img.attr("src",getMultimediaFolder('svg') + "left_arrow.svg");
        img.attr("style","width: 80%;");
        div.append(img);
        div.attr('style','width: 25%;');
        box.append(div);
        box.append(AdGr24_trainPlatformHTML(train,'platform',70,false))
        box.append("<div class='platform-sign-number-margin-left' style='width: 5%;'>");
    }
    else if(platform_side == "right") {
        //Vía en lado derecho
        box.append("<div class='platform-sign-number-margin-left' style='width: 5%;'>");
        box.append(AdGr24_trainPlatformHTML(train,'platform',70,false))
        var div = $("<div>");
        div.addClass('platform-sign-number-margin-right');
        var img = $("<img>");
        img.addClass('arrow');
        img.addClass('color-gravita-blanco')
        img.addClass('svg_en_img');
        img.attr("src",getMultimediaFolder('svg') + "right_arrow.svg");
        img.attr("style","width: 80%;");
        div.append(img);
        div.attr('style','width: 25%;');
        box.append(div);
    } else {
        //Caso  general. No orientado
        box.append("<div class='platform-sign-number-margin-left' style='width: 5%;'>");
        box.append(AdGr24_trainPlatformHTML(train,'platform',90,false))
        box.append("<div class='platform-sign-number-margin-left' style='width: 5%;'>");
    }
   

    box.append("<div class='platform-sign-number-margin-inf'>");

    if(platform_side == "left") {
        el.append(box);
        el.append(bar);       
    } else {
        el.append(bar);
        el.append(box);
    }

    return el;
}

function AdGr24_platformTrainHeaderHTML(train, widths, countdown_traffics,estimated_time_traffics) {
    var el = $("<div>");
    el.addClass('platform-train-header');
    el.attr("train-id",train.id);
    el.attr('style','width: ' + (widths['header']) + '%');


    var ur = $("<div>");
    ur.addClass('platform-train-header-upper-row');

    ur.append(AdGr24_marginHTML(widths['margin'],'platform-train-header-margin-sup'))
    ur.append(AdGr24_platformTimeHTML(train,widths['time'],countdown_traffics,estimated_time_traffics))



    ur.append(AdGr24_trainCommercialIdHTML(train,widths['commercial_id'],true,true));

    el.append(ur);

    var lr = $("<div>");
    lr.attr('style','width: 100%; height: 57%; font-size: 50%; display: flex; flex-wrap: wrap;');
    lr.addClass('platform-train-header-lower-row');

    lr.append(AdGr24_marginHTML(widths['margin'],'platform-train-header-margin-inf'));
    lr.append(AdGr24_trainDirectionHTML(train,'departures',widths['station'],0));
    lr.append(AdGr24_marginHTML(widths['margin'],'platform-train-header-margin-inf'));
    lr.append(AdGr24_marginHTML(100,'platform-train-header-margin-bottom'));

    el.append(lr);

    return el;
}



// function trainStateHTML(widths,line_class) {
//     // Obtiene el elemento clase .state
//     // line_class: "sup" o "inf" (para la altura según el margen vaya en la fila de arriba o la de abajo)
//     var el = $("<div>");
//     el.addClass('state');
//     el.addClass(line_class);
//     el.attr('style','width: ' + widths['state'] + '%;');
//     return el;

// }

function AdGr24_trainPlatformHorziontalJourneyHTML(train,height,widths) {
    // Obtiene el elemento clase .platform-horizontal-journey
    // Es simplemente un .train-horizontal-journey con márgenes derecho e izquierdo

    var el = $("<div>");
    el.addClass('platform-horizontal-journey');
    el.attr('style','height: ' +  height + '%; font-size: ' + height + '%; width: 100%;');
    el.append(AdGr24_marginHTML(1.2*widths['margin'],'platform-train-journey-margin'));
    el.append(AdGr24_trainHorizontalJourneyHTML(train,'departures',100 - 2.4*widths['margin'],'X',true));
    el.append(AdGr24_marginHTML(1.2*widths['margin'],'platform-train-journey-margin'));

    return el;
}


function AdGr24_trainVerticalJourneyHTML(train, journey_screen_rows, height, widths) {

    var div = $("<div>");
    var check_value = "";
    div.addClass('train-vertical-journey');
    
    div.attr('style','height: ' +  height + '%; font-size: ' +  height + '%;');
    var journey = train.journey_stops_destination;

    var container = $("<div>");
    container.addClass('train-vertical-journey-container');
    


    // Determinar el número de screen_rows dedicadas a cada parada para que no queden paradas "cortadas" al inicio o final de la animación
    // Por lo general una parada ocupa 2.1 screen_rows. 
    if(journey_screen_rows / journey.length >= 2.1) {
        //Si cabe todo el recorrido en la pantalla, se distribuye el espacio entre todas las paradas
        var stop_screen_rows = journey_screen_rows / journey.length;
        var visible_stops = journey.length;
    } else {
        //Hay más paradas que las que caben, dedicamos 2.1 screen-rows a cada parada
        //ajustarmeos para que quede un numero entero de paradas a la vista
        //Número entero de paradas que caben
        var visible_stops = Math.floor(journey_screen_rows/2.1);
        if (visible_stops == 0) visible_stops = 1;
        var stop_screen_rows = journey_screen_rows / visible_stops;

    }


    //1.5 segundos por cada parada que no quede visible
    var scroll_time = 2 * (journey.length - visible_stops);

    if(visible_stops == 1) scroll_time = 2 * (journey.length - visible_stops);

    container.css('--scrollY-time', scroll_time + 's');
    if (scroll_time > 0) container.addClass('scrollableY');

    // Altura relativa de cada parada
    var stop_height = 100 / journey_screen_rows * stop_screen_rows;

    // Altura normalizada (para que el tamaño de la letra no varie en función de la altura de cada parada)
    var stop_height_norm = 100 / journey_screen_rows * 2;

    //Variación de color si hay mínimo de 4 paradas, si se necesitan más del 80% de las líneas y si se muestran más de 2 líneas
    // var change_colors = (journey.length >= 4 && journey.length > 0.8*journey_screen_rows/2 && journey_screen_rows/2 > 2) && allow_stops_swap_colors ;
    // Desactiva la alternancia de colores
    var change_colors = false;
    
    if (journey.length > 0) {
        var former_tab = 0;
        journey.forEach(function(station) {
            var stop = $("<div>");
            stop.addClass('train-vertical-journey-stop');
            
            if (change_colors) {
                stop.addClass('stop-swap-colors');
            }
            stop.attr('style','height: ' +  stop_height + '%; font-size: ' +  stop_height_norm*0.70 + '%;');

            var time = $("<div>");
            time.addClass('train-vertical-journey-stop-time');
            time.addClass('monospace')
            time.attr('style','width: ' + (widths['stop-time']) + '%;');
            time.html(AdGr24_journeyStopTimeHTML(train,station));
            stop.append(time);

            stop.append(AdGr24_marginHTML(widths['stop-time-margin'],'stop-margin'));
            
            for(let tab = 0;tab <= station.tabulate;tab++) {
                stop.append(AdGr24_platformJourneyStopCircle(station,widths['stop-circle'],stop_screen_rows,tab,former_tab));
            }

            stop.append(AdGr24_marginHTML(widths['stop-name-margin'],'stop-margin'));

            var stop_name_width = widths['stop-name'] - station.tabulate*widths['stop-circle'];

            var combo = $("<div>");
            combo.addClass('train-vertical-journey-stop-info');
            combo.attr('style','width: ' + stop_name_width + '%;');
            combo.html(AdGr24_stationHTML(station,'platform',0,false));

            stop.append(combo);

            container.append(stop);
            check_value = check_value + station.code + "%" + station.branch + "$";
            for(let tab = 0;tab <= station.tabulate;tab++) {
                check_value = check_value + "{" + station.color[tab] + "}";
            }
            former_tab = station.tabulate;
        });
    }
    
    div.append(container);
    div.attr('check-value',check_value);
    return div;
}


function AdGr24_journeyStopTimeHTML(train,station) {
    var el = $("<div>");
    el.addClass('time');
    if(train.delay_out > 5) {
        if(station.delay_in === undefined) station.delay_in = 0;
        el.html(AdGr24_isoToHoraMinutos(station.arrival_time,station.delay_in));
        if(station.delay_in > 0) {
            el.addClass('delayed');
        }
    } else {
        el.html(AdGr24_isoToHoraMinutos(station.arrival_time,0));
    }

    

    return el;
}

function AdGr24_platformJourneyStopCircle(station,width,stop_screen_rows,tab,former_tab) {

    var div = $("<div>");
    div.addClass('train-vertical-journey-stop-circle');
    div.attr('style','width: ' + width + '%;');
    
    div.html(AdGr24_stopCircleSVG(station,stop_screen_rows,tab,former_tab));

    return div;
}

function AdGr24_stopCircleSVG(station,stop_screen_rows,tab) {


    vbw = 185.6;
    // vbh = 185*stop_screen_rows/2;
    vbh = 100*stop_screen_rows;

    // var svg = "<svg width='100%' height='100%' viewBox='0 0 " + vbw + " " + vbh + "' >";

    svg = "";

    if(station.tabulate == tab) {
        if (station.color[tab] != '#FFFFFF') {
            svg += svgZ(0) + "<circle cx='" + vbw/2 + "' cy='" + vbh/2 + "' r='" + 0.275*vbw + "' fill='#FFFFFF' /></svg>";
        } else {
            svg += svgZ(0) + "<circle cx='" + vbw/2 + "' cy='" + vbh/2 + "' r='" + 0.25*vbw + "' fill='#FFFFFF' /></svg>";
        }
    }


    if(station.tabulate > tab || !station.starts_new_branch) {
        if (station.color[tab] != '#FFFFFF') {
            svg += svgZ(1) + "<line x1='" + vbw/2 + "' y1='" + 1.01*(-vbh/2) + "' x2='" + vbw/2 + "' y2='" + 0.5*vbh + "' stroke='#FFFFFF' stroke-width='" + 0.225*vbw + "' /></svg>";
            svg += svgZ(2) + "<line x1='" + vbw/2 + "' y1='" + 1.01*(-vbh/2) + "' x2='" + vbw/2 + "' y2='" + 0.5*vbh + "' stroke='" + station.color[tab] + "' stroke-width='" + 0.125*vbw + "' /></svg>";
        } else {
            svg += svgZ(2) + "<line x1='" + vbw/2 + "' y1='" + 1.01*(-vbh/2) + "' x2='" + vbw/2 + "' y2='" + 0.5*vbh + "' stroke='" + station.color[tab] + "' stroke-width='" + 0.15*vbw + "' /></svg>";
        }
    } else {
        
        if (station.color[tab] != '#FFFFFF') {
            svg += svgZ(1) + "<path d='M " + (vbw/2) + "," + (vbh/2) + " C " + vbw/2 + "," + 0 + " " + (-vbw/2) + "," + 0 + " " + (-vbw/2) + "," + (-vbh/2) + "' stroke='#FFFFFF'  stroke-width='" + 0.23*vbw + "'  fill='transparent' /></svg>";
            svg += svgZ(2) + "<path d='M " + (vbw/2) + "," + (vbh/2) + " C " + vbw/2 + "," + 0 + " " + (-vbw/2) + "," + 0 + " " + (-vbw/2) + "," + (-vbh/2) + "' stroke='" + station.color[tab] + "' stroke-width='" + 0.13*vbw + "'  fill='transparent' /></svg>";
        } else {
            svg += svgZ(2) + "<path d='M " + (vbw/2) + "," + (vbh/2) + " C " + vbw/2 + "," + 0 + " " + (-vbw/2) + "," + 0 + " " + (-vbw/2) + "," + (-vbh/2) + "' stroke='" + station.color[tab] + "' stroke-width='" + 0.155*vbw + "'  fill='transparent' /></svg>";
        }
        
    }

    


    if(tab == station.tabulate) {
        svg += svgZ(3) + "<circle cx='" + vbw/2 + "' cy='" + vbh/2 + "' r='" + 0.225*vbw + "' fill='" + station.color[tab] + "' /></svg>";
    }
    

    
    // svg += "</svg>";
    
    return svg;

    function svgZ(z) {
        return  "<svg width='100%' height='100%' viewBox='0 0 " + vbw + " " + vbh + "' style='z-index: " + z + ";'>";
    }
}


function AdGr24_platformInfoHTML(train, width, observation_scroll, height) {
    // Obtiene el elemento clase .info
    var el = $("<div>");
    var check_value = "";
    el.addClass('platform-info');
    el.attr('style','width: ' + width + '%; height: ' + height + '%; font-size: ' + height + "%;");
    
    var div = $("<div>");
    switch (observation_scroll) {

        case "S":
            div.addClass('scrollableS');
            div.attr('current-line',1);
            break;   
        default: // case "X"
            div.addClass('scrollableX');
            div.addClass('centrable');
            div.attr('container-width',width);
            break;                
    }
    
    if(train.observation === undefined) train.observation = "";
    div.html(train.observation.trim());
    check_value = train.observation.trim();

    el.attr('check-value',check_value);
    el.append(div);
    return el;

}



function AdGr24_trainCompositionHTML(train,platforms,pin_position, pin_style, height,platform_arrangement,sectors_highlight,composition_expanded,down_sectors) {

    
    var div = $("<div>");
    div.addClass('train-composition');
    
    div.attr('style','height: ' +  height + '%; font-size: ' + height + '%; width: 100%;');
    div.html(AdGr24_compositionSVG(train,platforms,pin_position,pin_style,platform_arrangement,sectors_highlight,composition_expanded,down_sectors));
    var check_value = "";
    check_value = platforms[train.platform]["platform_start"] + "$" + platforms[train.platform]["platform_end"] + "$" +
                train.stopping_point + "$" + train.stopping_point_reference + "$" + train.orientation_out + "$" + train.train_length;
    
    
    if (platforms[train.platform] !== undefined) {
        var platform_sectors = platforms[train.platform]['sectors'];

        if (platform_sectors !== undefined) {
            for (let i = 0; i < platform_sectors.length; i++) {
                check_value += "_SEC#" + platform_sectors[i]['name'] + "//" + platform_sectors[i]['position'] + "_";
            }
        }

    }
    for (var j = 0; j < train.composition.length; j++) {
        for(var i  = 0; i < train.composition[j].length; i++) {
            if(train.composition[j][i].number === undefined) train.composition[j][i].number = "";
            if(train.composition[j][i].info === undefined) train.composition[j][i].info = [];
            check_value = check_value + "#" + train.composition[j][i].type + ";" + train.composition[j][i].number + ";"
                        + train.composition[j][i].length + ";" + train.composition[j][i].info.join("&");
        }
    }
    div.attr('check-value',check_value);
    return div;

}

function AdGr24_compositionSVG(train,platforms,pin_position, pin_style, platform_arrangement,sectors_highlight,composition_expanded,down_sectors) {

    // Las dimensiones de .train-composition son aproximadamente 16:1

    if(composition_expanded) {
        var vbh_ini = 0;
        var vbh = 150;
    } else {
        if(down_sectors) {
            var vbh_ini = 42;
            var vbh = 110;       
        } else {
            var vbh_ini = 0;
            var vbh = 100;               
        }
    }

    var vbw = 1600;


    var svg = "<svg width='100%' height='100%' style='font-size: 100%;' viewBox='0 " + vbh_ini + " " + vbw + " " + vbh + "'>";


    svg += "<style>";
    svg += ".sector { font-size: 45px; fill: white; }"
    svg += ".sector-away { font-size: 45px; fill: #999999; }"
    svg += ".guideline { font-size: 10px; fill: yellow; }"
    svg += ".coach { font-size: 48px; fill: #102341; }"
    svg += ".distance { font-size: 45px; fill: #FFCE6C; }"
    svg += "</style>";


    var platform_start = parseInt(platforms[train.platform]["platform_start"]);
    var platform_end = parseInt(platforms[train.platform]["platform_end"]);

    pin_position.forEach(function(pin_pos) {
        var ppint = parseInt(pin_pos);
        if (ppint < platform_start) platform_start = ppint;
        if (ppint > platform_end) platform_end = ppint;
    });

 
6
    if (platform_arrangement == "ascending") {
        arrangement = 1;
        var svg_start = arrangement*Math.round(parseInt(platform_start) - (platform_end - platform_start)*0.015);
        var svg_end = arrangement*Math.round(platform_end + (platform_end - platform_start)*0.015);
    } else {
        arrangement = -1;
        var svg_end = arrangement*Math.round(platform_start - (platform_end - platform_start)*0.015);
        var svg_start = arrangement*Math.round(platform_end + (platform_end - platform_start)*0.015);
    }

  
   

    //Determinamos el punto en que empezamos a dibujar el tren en la pantalla de izquierda a derecha
    if(train.stopping_point === undefined || (train.orientation_out != "right" && train.orientation_out != "left")
        || (train.stopping_point_reference != "front" && train.stopping_point_reference != "middle" && train.stopping_point_reference != "rear" 
            && train.stopping_point_reference != "left" && train.stopping_point_reference != "right")) {
        //Punto de estacionamiento desconocido o sin todos los datos necesarios, dibujamos el tren en medio del monitor, y sin referencias de localización
        //No se comprueba el tipo de referencia de stopping_point
        var offset = (svg_start + svg_end)/2 - train.train_length/20;
        var draw_locations = false;

    } else {
        
        //Punto de estacionamiento conocido
        //Si va en dirección derecha empezamos a dibujar desde "rear", si va dirección izquierda empezamos a dibujar desde "front"
        switch(train.orientation_out) {
            case "left":
                switch(train.stopping_point_reference) {
                    case "front":
                    case "left":
                        var offset = train.stopping_point;
                        break;
                    case "middle":
                        var offset = train.stopping_point - train.train_length/20;
                        break;                    
                    case "rear":
                    case "right":
                        var offset = train.stopping_point - train.train_length/10;
                        break;
                }

                break;
            case "right":
                switch(train.stopping_point_reference) {
                    case "front":
                    case "right":
                        var offset = train.stopping_point - train.train_length/10;
                        break;
                    case "middle":
                        var offset = train.stopping_point - train.train_length/20;
                        break;                   
                    case "rear":
                    case "left":
                        var offset = train.stopping_point;
                        break;                       
                }

                break;
        }
        
        var draw_locations = true;
    }


    var allowed_pins = ['pin','stairs_down_left','stairs_down_right','stairs_up_left','stairs_up_right','lift_down','lift_up','accessible_lift_down','accessible_lift_up'] 
    if (draw_locations) {
        if (platforms[train.platform].sectors !== undefined) {
            svg += AdGr24_compositionSectorsSVG(train.platform,platforms,offset,offset + train.train_length/10,svg_start,svg_end,vbw,arrangement,sectors_highlight,composition_expanded,down_sectors,pin_position,pin_style);
        }
        pin_position.forEach(function(position,index) {
            if (allowed_pins.includes(pin_style[index])) {
                svg += AdGr24_compositionPinSVG(position,pin_style[index],svg_start,svg_end,vbw,arrangement);
            }
            
        });

    }

    if(draw_locations) var left_stopping_point = offset;

    svg += "<g style='font-size: 48px'>";

    if (train.orientation_out == "left") {
        // El coche de cabeza está a la izquierda, dibujamos la composición de izquierda a derecha empezando por el primero
        for (var j = 0; j < train.composition.length; j++) {
            for(var i  = 0; i < train.composition[j].length; i++) {
                coach_length = train.composition[j][i].length/10;
                var color = "#5FE0AF";
                if (train.composition[j][i].info != undefined) {
                    if (train.composition[j][i].info.includes("high_occupancy")) color = "#FF8557";
                    else if (train.composition[j][i].info.includes("medium_occupancy")) color = "#FFCE6C";
                    else if (train.composition[j][i].info.includes("low_occupancy")) color = "#5FE0AF";
                }
                if(train.composition[j][i].type == "A" && i == 0) train.composition[j][i].type = "AL";
                if(train.composition[j][i].type == "A" && i == train.composition[j].length - 1) train.composition[j][i].type = "AR";
                svg += AdGr24_compositionCoachSVG(train.composition[j][i].type,color,train.orientation_out,train.composition[j][i].number,train.composition[j][i].info,offset,offset + coach_length,svg_start,svg_end,vbw,vbh,arrangement);
                offset += coach_length;
            }

        }
    } else {
        // El coche de cabeza está a la derecha, dibujamos la composición de izquierda a derecha empezando por el último
        for (var j = train.composition.length - 1; j >= 0; j--) {
            for(i = train.composition[j].length - 1; i >=0; i--) {
                coach_length = train.composition[j][i].length/10;
                var color = "#5FE0AF";
                if (train.composition[j][i].info != undefined) {
                    if (train.composition[j][i].info.includes("high_occupancy")) color = "#FF8557";
                    else if (train.composition[j][i].info.includes("medium_occupancy")) color = "#FFCE6C";
                    else if (train.composition[j][i].info.includes("low_occupancy")) color = "#5FE0AF";
                }
                if(train.composition[j][i].type == "A" && i == 0) train.composition[j][i].type = "AL";
                if(train.composition[j][i].type == "A" && i == train.composition[j].length - 1) train.composition[j][i].type = "AR";
                svg += AdGr24_compositionCoachSVG(train.composition[j][i].type,color,train.orientation_out,train.composition[j][i].number,train.composition[j][i].info,offset,offset + coach_length,svg_start,svg_end,vbw,vbh,arrangement);
                offset += coach_length;
            }

        }
    }

    svg += "</g>";

    if(draw_locations) {
        var right_stopping_point = offset;
        if(pin_position.length > 0) {
            var main_position = pin_position[0];
   
        }
    

        if (Math.abs(left_stopping_point - main_position) > Math.abs(right_stopping_point - main_position)) {
            var nearest_stopping_point = right_stopping_point;
        } else {
            var nearest_stopping_point = left_stopping_point;
        }
    
    
        var train_distance = Math.round(Math.abs(nearest_stopping_point - main_position) / 25) * 25;
    
    

        if((main_position < left_stopping_point && main_position < right_stopping_point) || (main_position > left_stopping_point && main_position > right_stopping_point)) {
            if(train_distance > 50) {
                svg += AdGr24_compositionDistanceSVG(main_position,nearest_stopping_point,train_distance,svg_start,svg_end,vbw,arrangement);
            }
        }

    }
        

    

    if (draw_locations) {
        // svg += AdGr24_compositionGuidelineSVG(svg_start,svg_end,vbw,vbh,arrangement);
    }
    
    svg += "</svg>";
    
    return svg;
}

function AdGr24_compositionDistanceSVG(main_position,nearest_stopping_point,train_distance,svg_start,svg_end,vbw,arrangement) {


    var svg = "";
    
    
    // svg += svgPointX(main_position) + "," + 60 + " ";

    if(arrangement*main_position > arrangement*nearest_stopping_point) {
        svg += '<polyline class="moving-strokes" points="';
        svg += svgPointX(arrangement*main_position) + "," + 70 + " ";
        svg += (svgPointX(arrangement*nearest_stopping_point) + 10) + "," + 70 + " ";
    } else  {
        svg += '<polyline class="moving-strokes" points="';
        svg += svgPointX(arrangement*main_position) + "," + 70 + " ";
        svg += (svgPointX(arrangement*nearest_stopping_point) - 10) + "," + 70 + " ";
    }
    svg += '" stroke="#FFCE6C" stroke-width="' + 0.003*vbw + '" fill="transparent" stroke-dasharray="15 15" stroke-dashoffset="0" />';

    svg += '<polyline points="';
    if(arrangement*main_position > arrangement*nearest_stopping_point) {
        svg += (svgPointX(arrangement*nearest_stopping_point) + 25) + "," + 55 + " ";
        svg += (svgPointX(arrangement*nearest_stopping_point) + 10) + "," + 70 + " "
        svg += (svgPointX(arrangement*nearest_stopping_point) + 25) + "," + 85 + " ";
    } else  {
        svg += (svgPointX(arrangement*nearest_stopping_point) - 25) + "," + 55 + " ";
        svg += (svgPointX(arrangement*nearest_stopping_point) - 10) + "," + 70 + " ";
        svg += (svgPointX(arrangement*nearest_stopping_point) - 25) + "," + 85 + " ";
    }
    svg += '" stroke="#FFCE6C" stroke-width="' + 0.003*vbw + '" fill="transparent"  />';

    svg += '<polyline points="';
    if(arrangement*main_position > arrangement*nearest_stopping_point) {
        svg += (svgPointX(arrangement*nearest_stopping_point) + 10) + "," + 70 + " ";
        svg += (svgPointX(arrangement*nearest_stopping_point) + 30) + "," + 70 + " "
        
    } else  {
        svg += (svgPointX(arrangement*nearest_stopping_point) - 10 ) + "," + 70 + " ";
        svg += (svgPointX(arrangement*nearest_stopping_point) - 30) + "," + 70 + " ";
    }

    svg += '" stroke="#FFCE6C" stroke-width="' + 0.003*vbw + '" fill="transparent"  />';
 
    if(arrangement*main_position > arrangement*nearest_stopping_point) {
        var middle_point = (svgPointX(arrangement*main_position) + svgPointX(arrangement*nearest_stopping_point) + 10)/2;
    } else {
        var middle_point = (svgPointX(arrangement*main_position) + svgPointX(arrangement*nearest_stopping_point) - 10)/2;
    }

    svg += "<g class='distance-rectangle'>";
    svg += "<rect width='0' height='50' x='" + middle_point + "' y='" + 45 + "' fill='blue' />";
    svg += "<text x='" + middle_point + "' y='" + 85 + "' class='distance' text-anchor='middle'>" + train_distance + " m"  + "</text>";
    svg += ""
    svg += "</g>";

    return svg;

    function svgPointX(x) {
        return (x-svg_start)/(svg_end-svg_start)*vbw;
    }

}

function AdGr24_compositionSectorsSVG(train_platform,platforms,train_start,train_end,svg_start,svg_end,vbw,arrangement,sectors_highlight,composition_expanded,down_sectors,pin_position,pin_style) {
    
    var svg = "";

    
    
    var sectors = platforms[train_platform]["sectors"];
    if(arrangement == -1 ) {
        train_end_bis = arrangement*train_start;
        train_start = arrangement*train_end;
        train_end = train_end_bis;
    }

    if(down_sectors) {
        var sector_y_position = 136;
    } else {
        var sector_y_position = 35;
    }
    
    
    for (i = 0; i < sectors.length; i++) {
        
        var highlight = true;

        sector_position = arrangement*sectors[i]["position"];
        sector_letter = sectors[i]["name"];

        //Si el sector está a una distancia inferior a 30 de un pictograma de localización, no se dibuja
        //salvo que se esté dibujando en modo expandido y el pictograma sea inferior
        var draw_sector = true;
        pin_position.forEach(function(pin_pos,index) {
            if(Math.abs(svgPointX(pin_pos) - svgPointX(sector_position)) < 30) {
                if(!composition_expanded) draw_sector = false;
                else if(pin_style[index] == 'stairs_down_left' || pin_style[index] == 'stairs_down_right' || pin_style[index] == 'lift_down' || pin_style[index] == 'accessible_lift_down' || pin_style[index] == 'pin') draw_sector = false;
            }
        });
        
        if(!draw_sector) continue;

        if (sectors_highlight && (sector_position < train_start || sector_position > train_end)) highlight = false;

        if (highlight) {
            svg += "<text x='" + svgPointX(sector_position) + "' y='" + sector_y_position + "' class='sector' text-anchor='middle'>" + sector_letter + "</text>";
        } else {
            svg += "<text x='" + svgPointX(sector_position) + "' y='" + sector_y_position + "' class='sector-away' text-anchor='middle'>" + sector_letter + "</text>";
        }
        
    }

    return svg;

    function svgPointX(x) {
        return (x-svg_start)/(svg_end-svg_start)*vbw;
    }

}

function AdGr24_compositionPinSVG(pin_position,pin_style,svg_start,svg_end,vbw,arrangement) {

    var picto_width =  [];
    picto_width['pin'] = 36;
    picto_width['stairs_down_left'] = 48;
    picto_width['stairs_down_right'] = 48;
    picto_width['stairs_up_right'] = 50;
    picto_width['stairs_up_left'] = 50;
    picto_width['lift_down'] = 38;
    picto_width['lift_up'] = 38;
    picto_width['accessible_lift_down'] = 38;
    picto_width['accessible_lift_up'] = 38;


    if(arrangement == -1) {
        if (pin_style == 'stairs_down_left') pin_style = 'stairs_down_right';
        else if (pin_style == 'stairs_down_right') pin_style = 'stairs_down_left';
        else if (pin_style == 'stairs_up_left') pin_style = 'stairs_up_right';
        else if (pin_style == 'stairs_up_right') pin_style = 'stairs_up_left';
    }

    switch(pin_style) {
        case "pin":
            return "<image class='bouncing' href='" + getMultimediaFolder('svg') + pin_style + ".svg?v=1' x ='" + (svgPointX(arrangement*pin_position) - picto_width[pin_style]/2) + "' y = '" + 0 + "' width='" + picto_width[pin_style]  + "' />";
        case "stairs_down_left":
        case "stairs_down_right":
            return "<image class='not-bouncing' href='" + getMultimediaFolder('svg') + pin_style + ".svg?v=1' x ='" + (svgPointX(arrangement*pin_position) - picto_width[pin_style]/2) + "' y = '" + 0 + "' width='" + picto_width[pin_style]  + "' />";
        case "stairs_up_left":
        case "stairs_up_right":
            return "<image href='" + getMultimediaFolder('svg') + pin_style + ".svg?v=1' x ='" + (svgPointX(arrangement*pin_position) - picto_width[pin_style]/2) + "' y = '" + 98 + "' width='" + picto_width[pin_style]  + "' />";
        case "lift_down":
            return "<image class='not-bouncing' href='" + getMultimediaFolder('svg') + 'lift' + ".svg?v=1' x ='" + (svgPointX(arrangement*pin_position) - picto_width[pin_style]/2) + "' y = '" + 0 + "' width='" + picto_width[pin_style]  + "' />";
        case "lift_up":
            return "<image href='" + getMultimediaFolder('svg') + 'lift' + ".svg?v=1' x ='" + (svgPointX(arrangement*pin_position) - picto_width[pin_style]/2) + "' y = '" + 100 + "' width='" + picto_width[pin_style]  + "' />";
        case "accessible_lift_down":
            return "<image class='not-bouncing' href='" + getMultimediaFolder('svg') + 'accessible_lift' + ".svg?v=1' x ='" + (svgPointX(arrangement*pin_position) - picto_width[pin_style]/2) + "' y = '" + 0 + "' width='" + picto_width[pin_style]  + "' />";
        case "accessible_lift_up":
            return "<image href='" + getMultimediaFolder('svg') + 'accessible_lift' + ".svg?v=1' x ='" + (svgPointX(arrangement*pin_position) - picto_width[pin_style]/2) + "' y = '" + 100 + "' width='" + picto_width[pin_style]  + "' />";
    }



    function svgPointX(x) {
        return (x-svg_start)/(svg_end-svg_start)*vbw;
    }


}



function AdGr24_compositionCoachSVG(type,color,direction,number,info,coach_start,coach_end,svg_start,svg_end,vbw,vbh,arrangement) {

    const COACH_SEPARATION_VIEWBOX = 0.1; //separación visual entre dos coches (en % del ancho del monitor)
    const COACH_RADIUS_VIEWBOX = 0.5; //radio de las esquinas redondeadas de los coches (en % del ancho del monitor)
    const MOTOR_RADIUS_VIEWBOX = 2.0; //radio del morro de automotores (en % del ancho del monitor)


    var svg = "";

    if (arrangement == -1) {
        coach_end_bis = arrangement*coach_start;
        coach_start = arrangement*coach_end;  
        coach_end = coach_end_bis;     
        if (type == "AR") type = "AL";
        else if (type == "AL") type = "AR";
    }
 
    var coach_separation = COACH_SEPARATION_VIEWBOX/100 * (svg_end - svg_start); //en metros reales
    var coach_radius = COACH_RADIUS_VIEWBOX/100 *  (svg_end - svg_start); //en metros reales
    var motor_radius  = MOTOR_RADIUS_VIEWBOX/100 *  (svg_end - svg_start); //en metros reales
    var coach_svg_length = svgPointX(coach_end - coach_separation) - svgPointX(coach_start + coach_separation);

    // Los tipos de coche de extremo de automotor AR (automotor-right) y AL (automotor-left) están definidos para un tren que se mueve hacia la izquierda
    // Si el tren se va a mover hacia la derecha, hay que invertir la definición de los extremos del automotor
    if (direction != "left") {
        if (type == "AR") type = "AL";
        else if(type == "AL") type = "AR";
    }
    svg += "<polygon points='";
    svg += svgPointX(coach_start + coach_separation) + "," + 95 + " ";
    switch(type) {
        case "C":
        case "AR":
        case "A":
            for(let a = 0;a <= Math.PI/2;a = a + Math.PI/20) {
                svg += svgPointX(coach_start + coach_separation + coach_radius*(1-Math.cos(a))) + "," + (45 + COACH_RADIUS_VIEWBOX*16*(1-Math.sin(a)))  + " ";
            }
            break;
        case "AL":
        case "L":
            for(let a = 0;a <= Math.PI/2;a = a + Math.PI/20) {
                svg += svgPointX(coach_start + coach_separation + motor_radius*(1-Math.cos(a))) + "," + (45 + MOTOR_RADIUS_VIEWBOX*16*(1-Math.sin(a))) + " ";
            } 
            break;          
    }
    svg += svgPointX(coach_end - coach_separation) + "," + 45 + " ";
    switch(type) {
        case "C":
        case "AL":
        case "A":
            for(let a = 0;a <= Math.PI/2;a = a + Math.PI/20) {
                svg += svgPointX(coach_end - coach_separation - coach_radius*(1-Math.sin(a))) + "," + (45 + COACH_RADIUS_VIEWBOX*16*(1-Math.cos(a))) + " ";
            }
            break;
        case "AR":
        case "L":
            for(let a = 0;a <= Math.PI/2;a = a + Math.PI/20) {
                svg += svgPointX(coach_end - coach_separation - motor_radius*(1-Math.sin(a))) + "," +  (45 + MOTOR_RADIUS_VIEWBOX*16*(1-Math.cos(a))) + " ";
            }
            break;          
    }
    svg += svgPointX(coach_end - coach_separation) + "," + 95 + "'";
    svg += " fill='" + color + "' stroke='none' />";

    //Número de coche
    if (number === undefined) number = "";
    svg += "<text x='" + svgPointX((coach_start + coach_end)/2) + "' y='" + 70 + "' dy='.35em' class='coach' text-anchor='middle' coach-lenght='" + coach_svg_length + "'>" + number + "</text>";

    //Prestaciones
    if(info === undefined) info = [];
    
    person_width = vbw*0.013;
    if (info.includes("accessible")) {
        svg += AdGr24_coachPictoSVG("PMR",coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,20)
        return svg;
    }

    if (info.includes("restaurant")) {
        svg += AdGr24_coachPictoSVG("RESTAURANT",coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,20);
        return svg;
    }


    if (info.includes("bar")) {
        svg += AdGr24_coachPictoSVG("BAR",coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,20);
        return svg;
    }

    if (info.includes("bicycles")) {
        svg += AdGr24_coachPictoSVG("BICYCLE",coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,5);
        return svg;
    }
    
    
    if (info.includes("high_occupancy")) {
        svg += AdGr24_coachPictoSVG("HIGH_OCUPPANCY",coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,3);
    }
    else if (info.includes("medium_occupancy")) {
        svg += AdGr24_coachPictoSVG("MEDIUM_OCUPPANCY",coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,3);
    } else if (info.includes("low_occupancy")) {
        svg += AdGr24_coachPictoSVG("LOW_OCUPPANCY",coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,3);
    }


    return svg;


    function svgPointX(x) {
        return (x-svg_start)/(svg_end-svg_start)*vbw;
    }


}

function AdGr24_coachPictoSVG(picto_name,coach_svg_length,coach_start,coach_end,svg_start,svg_end,vbw,margin) {
    var picto_width = (100-margin)/100*Math.min(coach_svg_length,50);
    return "<image href='" + getMultimediaFolder('coach_pictos') + picto_name + ".svg?v=1' x ='" + (svgPointX((coach_start + coach_end)/2) - picto_width/2) + "' y = '" + (70 - picto_width/2) + "' width='" + picto_width  + "' />";

    function svgPointX(x) {
        return (x-svg_start)/(svg_end-svg_start)*vbw;
    }

}

function AdGr24_compositionGuidelineSVG(svg_start,svg_end,vbw,vbh,arrangement) {
    var svg = "";
    
    var station_start = svg_start;
    var station_end = svg_end;

    for (i = station_start; i <= station_end; i++) {

       if(i % 10 === 0) {
            svg += "<line x1='" + (i - station_start)/(station_end - station_start)*vbw + "' y1='" +  35  + "' x2='" + (i - station_start)/(station_end - station_start)*vbw + "' y2='" + 95 + "' stroke='#FFFF00' stroke-width='" + 0.01*vbh + "' />"
            svg += "<text x='" + (i - station_start)/(station_end - station_start)*vbw  + "' y='" + 65 + "' class='guideline' text-anchor='middle'>" + arrangement*i + "</text>";
       } else if (i % 2 === 0) {
        svg += "<line x1='" + (i - station_start)/(station_end - station_start)*vbw + "' y1='" +  40  + "' x2='" + (i - station_start)/(station_end - station_start)*vbw + "' y2='" +90 + "' stroke='#FFFF00' stroke-width='" + 0.005*vbh + "' />"
       }


    }

    return svg;
}


function AdGr24_adifClockHTML(aspect_ratio,monitor_class) {
    // Obtiene el elemento clase .adif-clock
    var cl = $("<div>");
    cl.addClass('adif-clock');
    cl.attr('style','width: 100%; height: 100%; font-size: 100%;');
    if(monitor_class != "black-clock") {
        cl.addClass('adif-blue-clock');
        if (aspect_ratio < 2.8) {
            cl.addClass('adif-vertical-clock');
            var space1 = $("<div>");
            space1.attr('style','width: 100%; height: 10%;');
            cl.append(space1);
            var logo = $("<div>");
            logo.addClass('adif-logo');
            logo.attr('style','width: 100%; height: 40%;');
            logo.append(AdGr24_logoHTML(monitor_class,100));
            cl.append(logo);
            var time = $("<div>");
            time.addClass('adif-clock-time');
            if(aspect_ratio <= 1) var font_size = 20*aspect_ratio;
            else if(aspect_ratio > 1) var font_size = 20*Math.sqrt(aspect_ratio);
            time.attr('style','width: 100%; height: 40%; font-size:' + font_size + '%;');
            time.append(AdGr24_clockHTML(100));        
            cl.append(time);
            var space2 = $("<div>");
            space2.attr('style','width: 100%; height: 10%;');
            cl.append(space2);
        } else {
            cl.addClass('adif-horizontal-clock');
            var logo = $("<div>");
            logo.addClass('adif-logo');
            logo.attr('style','width: 50%; height: 100%; padding-top: 1.5%;');
            logo.append(AdGr24_logoHTML(monitor_class,100));
            cl.append(logo);
            var time = $("<div>");
            time.addClass('adif-clock-time');
            var font_size = 18*Math.sqrt(aspect_ratio);
            time.attr('style','width: 50%; height: 100%; font-size:' + font_size + '%;');
            time.append(AdGr24_clockHTML(100));
            cl.append(time);
        } 
    } else {
        // black-clock
        cl.addClass('adif-black-clock');
        if (aspect_ratio < 2.8) {
            cl.addClass('adif-vertical-clock');
            var time = $("<div>");
            time.addClass('adif-clock-time');
            if(aspect_ratio <= 1) var font_size = 20*aspect_ratio;
            else if(aspect_ratio > 1) var font_size = 20*Math.sqrt(aspect_ratio);
            time.attr('style','width: 100%; height: 100%; font-size:' + font_size + '%;');
            time.append(AdGr24_clockHTML(100));
            cl.append(time);
        } else {
            cl.addClass('adif-horizontal-clock');
            var time = $("<div>");
            time.addClass('adif-clock-time');
            var font_size = 18*Math.sqrt(aspect_ratio);
            time.attr('style','width: 100%; height: 100%; font-size:' + font_size + '%;');
            time.append(AdGr24_clockHTML(100));
            cl.append(time);
        }
    }


    return cl;

}


function AdGr24_trainInfoComplement(train) {
    //Complementa la información del recorrido del tren:


    //Si una estación no tiene rama declarada asume branch = 0. Carga valores iniciales por defecto.
    // train.journey_stops_origin.forEach(function(train_stop) {
    //     if (train_stop.branch === undefined) {
    //         train_stop['branch'] = 0;
    //     }
    // });
    train.journey_stops_destination.forEach(function(train_stop) {
        if (train_stop.branch === undefined) {
            train_stop['branch'] = 0;
        }
        if (train_stop.branch_decouple === undefined) {
            train_stop['branch_decouple'] = [];
        }
        train_stop['starts_new_branch'] = false;
    });

    // Comprueba que los branch_decouple están bien definidos (Antes de la primera parada de la rama)
    // Si está mal definido o no está declarado el branch_decouple lo reasigna a la primera parada anterior a la rama
    var started_branches = [];
    if(train.journey_stops_destination.length > 0) started_branches.push(train.journey_stops_destination[0].branch);
    for(let i = 0; i  < train.journey_stops_destination.length; i++) {
        var train_stop = train.journey_stops_destination[i];
        if (!started_branches.includes(train_stop.branch) && i > 1) {
            //Nueva rama detectada sin declarar previamente branch_decouple. Se asigna a la parada anterior
            var previous_stop = train.journey_stops_destination[i - 1];
            previous_stop.branch_decouple.push(train_stop.branch);
            started_branches.push(train_stop.branch);
        }
        //Observamos los branch_decouples declarados en la parada. Si ya se han designado previamente, se eliminan, si no se añaden a la lista.
        for(let j = 0; j < train_stop.branch_decouple.length; j++) {
            if(started_branches.includes(train_stop.branch_decouple[j])) {
                //Desacople ya declarado. Se elimina
                train_stop.branch_decouple.splice(j, 1);
                j--;
            } else {
                //Nueva rama. Se añade a la lista
                started_branches.push(train_stop.branch_decouple[j])
            }
        }

    }





    //Obtenemos la lista de origenes y destinos declarados
    var train_destinations = Array();
    train.destinations.forEach(function(train_stop) {
        train_destinations.push(train_stop.code);
    });
    var train_origins = Array();
    train.origins.forEach(function(train_stop) {
        train_origins.push(train_stop.code);
    });


    //En la lista de paradas (se asume ordenada por orden) se asigna el parametro last_in_branch = "true" a la última parada de cada rama
    //Es necesario para evitar duplicar la última parada en recorrido y en destino en la lista de paradas horizontal
    //Para tener en cuenta el caso de destinos fictios y que por lo tanto deba mostrarse la última parada en la lista horizontal
    //se asigna el parámetro declared_as_destination

    var branch_list = Array();
    var has_intermediate_stops = false;
    for(let i = train.journey_stops_destination.length - 1; i >= 0; i--) {
        var train_stop = train.journey_stops_destination[i];
        if (!branch_list.includes(train_stop.branch)) {
            branch_list.push(train_stop.branch);
            train_stop["last_in_branch"] = true;
        } else {
            train_stop["last_in_branch"] = false;
        }
        train_stop["declared_as_destination"] = train_destinations.includes(train_stop.code);
        if(!train_stop["declared_as_destination"]) has_intermediate_stops = true;
        train_stop["color"] = [];
 
        
    }

    //Si el tren tiene alguna estación que no está declarada como destino, se asigna el parametro has_intermediate_destination_stops = "true"
    train["has_intermediate_destination_stops"] = has_intermediate_stops;
    

    //Operaciones similares con el recorrido de origen. 
    //"declared_as_destination" en el contexto de origen significa declarada como origen
    has_intermediate_stops = false;
    for(let i = 0; i < train.journey_stops_origin.length; i++) {
        var train_stop = train.journey_stops_origin[i];
        train_stop["declared_as_destination"] = train_origins.includes(train_stop.code);
        if(!train_stop["declared_as_destination"]) has_intermediate_stops = true;
    }
    train["has_intermediate_origin_stops"] = has_intermediate_stops;


    // Reorganiza el listado de paradas para que cada nueva rama vaya inmediatamente después de su branch_decouple
    // Presupone branch_decouples bien definidos (en apartado anterior)
    // Asigna el flag starts_new_branch cuando se inicia una nueva rama a la derecha (no aplica a la primera rama creada desde una estación last_in_branch)
    for(let i = 0; i < train.journey_stops_destination.length; i++) {
        var train_stop = train.journey_stops_destination[i];
        
        var first_new_branch = true;
        train_stop.branch_decouple.forEach(function(new_branch) {
            var next_pos = i + 1;
            var starts_new_branch = true
            for(let j = i+1; j < train.journey_stops_destination.length; j++) {
                if (train.journey_stops_destination[j].branch == new_branch) {
                    //Asignamos valor de start_new_branch
                    if(first_new_branch && train_stop.last_in_branch) starts_new_branch = false;
                    train.journey_stops_destination[j].starts_new_branch = starts_new_branch;
                    first_new_branch = false;
                    starts_new_branch = false;
                    //Cortamos parada en posicion j
                    let stop = train.journey_stops_destination.splice(j,1)[0];
                    //Insertamos la parada en la posición next_pos
                    train.journey_stops_destination.splice(next_pos,0,stop);

                    //Actualizamos next_pos
                    next_pos++;
                }
            }
        });
    }



    //Una vez reordenado el array de estaciones y obtenidos los last_in_branch, calculamos las tabulaciones 
    // branch_decouple genera una nueva tabulación y last_in_branch la elimina
    // Asignamos color blanco por defecto

    var actual_tab = 0;
    for(let i = 0; i < train.journey_stops_destination.length; i++) {

        var train_stop = train.journey_stops_destination[i];


        if(train_stop.starts_new_branch) actual_tab++;


        train_stop.tabulate = actual_tab;
        train_stop["color"][train_stop.tabulate] = "#FFFFFF";

        actual_branch = train_stop.branch;
        if(train_stop.last_in_branch && train_stop.branch_decouple.length == 0) {
            //Retrocedemos dos tabulaciones (la nueva parada generará otra tabulación)
            actual_tab--;
        }

    }
    

    //Asignación de colores de línea para el dibujo del recorrido de acuerdo a los datos en destinos

    //Obtiene los colores y destinos asociados al color
    
    if(train.destinations.length == 1) {

        //Si solo hay un destino, todas las paradas toman el mismo color
        var line_color = train.destinations[0].line_color;
        if(line_color === undefined) line_color = AdGr24_line_colors[train.destinations[0].line];
        if(line_color === undefined) line_color = "#FFFFFF";
        
        for(let i = train.journey_stops_destination.length - 1; i >= 0; i--) {
            var train_stop = train.journey_stops_destination[i];
            for(let tab = 0; tab <= train_stop.tabulate; tab++) {
                train_stop.color[tab] = line_color;
            }
        }
    } else {
        //Si hay más de un destino, empezando por el último hasta el primero, busca la parada de destino y asigna los colores hasta origen
        for(let j = train.destinations.length - 1; j >= 0; j--) {
            var destination_code = train.destinations[j].code;

            var line_color = train.destinations[j].line_color;
            if(line_color === undefined) line_color = AdGr24_line_colors[train.destinations[j].line];
            if(line_color === undefined) line_color = "#FFFFFF";


            var found = false;
            for(let i = train.journey_stops_destination.length - 1; i >= 0; i--) {
                
                var train_stop = train.journey_stops_destination[i];
                
                if (train_stop.code == destination_code) {
                    found = true;
                    var tab = train_stop.tabulate;
                }
                if(found && train_stop.tabulate < tab) {
                    tab = train_stop.tabulate;
                }
                if(found && tab <= train_stop.tabulate) {
                    train_stop["color"][tab] = line_color;
                }
            }
        }        
    }

    return train;
}


function AdGr24_filtroTrenes(monitor_class, train, class_stop_filter, traffic_filter, traffic_include, company_filter, company_include, product_filter, product_include,
    access_filter, access_include, platform_filter, platform_include, stop_filter, stop_include, custom_filter, custom_include, sector_filter) {
    // Indica si se ha de pintar el tren en función de los atributos filter o include de la interfaz

    // Crea el atributo platform_locations y platform_locations_in si no se ha definido previamente
    if (train.platform_locations === undefined) {
        train.platform_locations = [];
        if(train.platform != "" && train.platform !== undefined) {
            train.platform_locations.push(train.platform);
            if(train.sectors !== undefined) {
                train.sectors.forEach(function(sector) {
                    train.platform_locations.push(train.platform + sector);
                });
            }
        }


        if(train.platform_preview !== undefined) {
            train.platform_locations.push(train.platform_preview);
        }
    }   

    if(train.platform_in !== undefined) {
        train.platform_locations_in = [];
        if(train.platform_in != "" && train.platform_in !== undefined) {
            train.platform_locations_in.push(train.platform_in);
            if (train.sectors_in !== undefined) {
                train.sectors_in.forEach(function(sector) {
                    train.platform_locations_in.push(train.platform_in + sector);
                });
            }
        }

        if(train.platform_preview_in !== undefined) {
            train.platform_locations_in.push(train.platform_preview_in);
        }       
    }

    // Genera delay_in y delay_out a 0 si no estan declarados
    if(train.delay_in === undefined) train.delay_in = 0;
    if(train.delay_out === undefined) train.delay_out = 0;


    // Genera countdown si no estuviera bien declarado
    if(train.countdown === undefined) {
        var hora_estimada = new Date(train.departure_time);
        hora_estimada.setMinutes(hora_estimada.getMinutes() + train.delay_out);
        var hora_actual = new Date();
        train.countdown = Math.floor((hora_estimada - hora_actual)/(1000*60));
    }
    if (train.countdown < 0) {
        train.countdown = 0;
    }

    


    // FILTRADO DE TIPO DE PARADA.
    // Tiene prioridad para excluir sobre el resto ya que filtra trenes tipo destino en interaz de salidas y similares
    if (!(class_stop_filter.length === 0)) {
        if (!class_stop_filter.includes(train.class_stop)) {
            return false;
        }
    }

    // FILTROS DE INCLUSIÓN
    if (!(traffic_include.length === 0)) {
        if (traffic_include.includes(train.traffic_type)) {
            return true;
        }
    }

    if (!(company_include.length === 0)) {
        if (company_include.includes(train.company)) {
            return true;
        }
    }

    if (!(product_include.length === 0)) {
        var found = false;
        train.commercial_id.forEach(function(com_id) {
             if (product_include.includes(com_id.product)) {
                found = true;
            }           
        });
        if (found) return true;
    }

    if (!(access_include.length === 0)) {
        var found = false;
        if (monitor_class == "departures" || monitor_class == "departures-cercanias" || monitor_class == "departures-old") {
            if(Array.isArray(train.departures_access)) {
                train.departures_access.forEach(function(access) {
                    if (access_include.includes(access)) {
                       found = true;
                   }           
               });
               if (found) return true;
            }
        } else {
            if(Array.isArray(train.arrivals_access)) {
                train.arrivals_access.forEach(function(access) {
                    if (access_include.includes(access)) {
                       found = true;
                   }           
               });
               if (found) return true;  
            }         
        }         
    }
    
    if (!(platform_include.length === 0)) {
        if ((monitor_class == "arrivals" || monitor_class == "arrivals-cercanias" || monitor_class == "arrivals-old") && train.platform_in !== undefined) {
            if (platform_include.some(platf => train.platform_locations_in.includes(platf))) {
                return true;
            }
        } else {
            if (platform_include.some(platf => train.platform_locations.includes(platf))) {
                return true;
            }
        }
    }

    if (!(stop_include.length === 0)) {
        var found = false;
        if (monitor_class == "arrivals" || monitor_class == "arrivals-cercanias" || monitor_class == "arrivals-old") {
            train.journey_stops_origin.forEach(function(stop) {
                if(stop_include.includes(stop.code)) {
                    found = true;
                }
            });
            if(found) return true;
        } else {
            train.journey_stops_destination.forEach(function(stop) {
                if(stop_include.includes(stop.code)) {
                    found = true;
                }
            });
            if(found) return true;
        }

    }

    if (!(custom_include.length === 0)) {
        if(Array.isArray(train.custom_categories)) {
            var found = false;
            train.custom_categories.forEach(function(custom_categ) {
                if (custom_include.includes(custom_categ)) {
                   found = true;
               }           
           });
           if (found) return true;          
        }
    }

    
   
    // FILTROS DE EXCLUSIÓN
    if (!(traffic_filter.length === 0)) {
        if (!traffic_filter.includes(train.traffic_type)) {
            return false;
        }
    }

    if (!(company_filter.length === 0)) {
        if (!company_filter.includes(train.company)) {
            return false;
        }
    }

    
    if (!(product_filter.length === 0)) {
        var found = false;
        train.commercial_id.forEach(function(com_id) {
             if (product_filter.includes(com_id.product)) {
                found = true;
            }           
        });
        if (!found) return false;
    }

    
    if (!(access_filter.length === 0)) {
        var found = false;
        if (monitor_class == "departures" || monitor_class == "departures-cercanias" || monitor_class == "departures-old") {
            if(Array.isArray(train.departures_access)) {
                train.departures_access.forEach(function(access) {
                    if (access_filter.includes(access)) {
                       found = true;
                   }           
               });
               if (!found) return false;
            } else {
                return false;
            }
            
        } else {
            if(Array.isArray(train.arrivals_access)) {
                train.arrivals_access.forEach(function(access) {
                    if (access_filter.includes(access)) {
                       found = true;
                   }           
               });
               if (!found) return false;
            } else {
                return false;
            }
            
        }         
    }

    if (!(platform_filter.length === 0)) {
        if ((monitor_class == "arrivals" || monitor_class == "arrivals-cercanias" || monitor_class == "arrivals-old") && train.platform_in !== undefined) {
            if (!platform_filter.some(platf => train.platform_locations_in.includes(platf))) {
                return false;
            }
        } else {
            if (!platform_filter.some(platf => train.platform_locations.includes(platf))) {
                return false;
            }
        }
    }

    if (!(sector_filter.length === 0)) {
        if(train.sectors !== undefined) {
            if(train.sectors.length > 0) {
                if(!sector_filter.some(sect => train.sectors.includes(sect))) {
                    return false;
                }
            }
        }
    }

    if (!(stop_filter.length === 0)) {
        var found = false;
        if (monitor_class == "arrivals" || monitor_class == "arrivals-cercanias" || monitor_class == "arrivals-old") {
            train.journey_stops_origin.forEach(function(stop) {
                if(stop_filter.includes(stop.code)) {
                    found = true;
                }
            });
            if(!found) return false;
        } else {
            train.journey_stops_destination.forEach(function(stop) {
                if(stop_filter.includes(stop.code)) {
                    found = true;
                }
            });
            if(!found) return false;
        }

    }

    if (!(custom_filter.length === 0)) {
        if(Array.isArray(train.custom_categories)) {
            var found = false;
            train.custom_categories.forEach(function(custom_categ) {
                if (custom_filter.includes(custom_categ)) {
                   found = true;
               }           
           });
           if (!found) return false;
        } else {
            return false;
        }

    }
    
    return true;
}





function AdGr24_ordenarTrenesHoraSalida(estimated_time_traffics) {
        // Para ordenar los trenes por hora de salida ascendente
        return function(a,b) {
            if (estimated_time_traffics.includes(a.traffic_type)) {
                var fechaA = new Date(a.departure_time);
                fechaA.setMinutes(fechaA.getMinutes() + a.delay_out);
            } else {
                var fechaA = new Date(a.departure_time);
            }
            if (estimated_time_traffics.includes(b.traffic_type)) {
                var fechaB = new Date(b.departure_time);
                fechaB.setMinutes(fechaB.getMinutes() + b.delay_out);
            } else {
                var fechaB = new Date(b.departure_time);
            }       
            return fechaA - fechaB;
        };

}


function AdGr24_ordenarTrenesHoraLlegada(estimated_time_traffics) {
 
    // Para ordenar los trenes por hora de llegada ascendente
    return function(a,b) {
        if (estimated_time_traffics.includes(a.traffic_type)) {
            var fechaA = new Date(a.arrival_time);
            fechaA.setMinutes(fechaA.getMinutes() + a.delay_in);
        } else {
            var fechaA = new Date(a.arrival_time);
        }
        if (estimated_time_traffics.includes(b.traffic_type)) {
            var fechaB = new Date(b.arrival_time);
            fechaB.setMinutes(fechaB.getMinutes() + b.delay_in);
        } else {
            var fechaB = new Date(b.arrival_time);
        }       
        return fechaA - fechaB;
    };

}


function AdGr24_ordenarTrenesCountdown(estimated_time_traffics) {

    // Para ordenar los trenes por cuenta atrás
    return function(a,b) {

        var isInCountdownA = AdGr24_isInCountdownMode(a);
        var isInCountdownB = AdGr24_isInCountdownMode(b);
    
        //Prioridad al tren en cuenta atrás sobre el tren que no está en cuenta atrás
        if (isInCountdownA != isInCountdownB) return (isInCountdownA)? -1 : 1;

        // Si los dos trenes están en cuenta atrás, ordenamos por cuenta atrás:
        if (isInCountdownA) {
            return a.countdown - b.countdown;
        }

        // Si los dos trenes no están en cuenta atrás, ordenamos por la hora de salida (teórica o prevista según estimated_time_traffics)

        if (estimated_time_traffics.includes(a.traffic_type)) {
            var fechaA = new Date(a.departure_time);
            fechaA.setMinutes(fechaA.getMinutes() + a.delay_out);
        } else {
            var fechaA = new Date(a.departure_time);
        }
        if (estimated_time_traffics.includes(b.traffic_type)) {
            var fechaB = new Date(b.departure_time);
            fechaB.setMinutes(fechaB.getMinutes() + b.delay_out);
        } else {
            var fechaB = new Date(b.departure_time);
        }       
        return fechaA - fechaB;
    };

}


function AdGr24_ordenarTrenesNumeroVia(platform_location) {

    //Ordena los servicios según el orden de apareción de su vía o vía/sector en platform_location
    return function(a,b) {
        //Si el array platform_location es vacío, ordenamos alfabéticamente:
        if (platform_location.length === 0)
            return (String(a.platform) + String(a.sectors[0])) - (String(b.platform) + String(b.sectors[0]));

        //Buscamos el índice de vía/sector en el array platform_location. Si no encuentra buscamos via a solas
        var indA = platform_location.indexOf(a.platform + a.sectors[0]);
        if(indA === -1)
            indA = platform_location.indexOf(a.platform);

        var indB = platform_location.indexOf(b.platform + b.sectors[0]);
        if(indB === -1)
            indB = platform_location.indexOf(b.platform);
        
        //Si los dos valores son iguales, ordenamos alfabéticamente
        if (indA == indB)
            return (String(a.platform) + String(a.sectors[0])) - (String(b.platform) + String(b.sectors[0]));  
        //Si solo se ha encontrado uno de los dos, damos prioridad al encontrado
        if (indA == -1)
            return 1;  
        if (indB == -1)
            return -1;
        
        //Vías distintas, devolvemos el índice menor:
        return indA - indB;

    };

}

function AdGr24_isInCountdownMode(train) {
    //Devuelve verdadero si el tren está en modo cuenta atrás
    
    if (train.status == "delayed") return false;
    if (train.status == "cancelled") return false;
    
    switch(train.class_stop) {
        case "destination":
            return false;
        case "origin":
            if (train.platform == "") return false;
            return train.countdown < 10;
        case "intermediate":
            if (train.status == "scheduled") return false;
            return train.countdown < 10;
    }
        
}

function AdGr24_isoToHoraMinutos(fechaISO,delay) {
    // Convierte una cadena de fecha ISO 8601 en una cadena con la hora formato "hh:mm"
    // añadiendo los minutos de retraso indicados en delay
    if(delay == 0) return fechaISO.substring(11,16);

    var fecha = new Date(fechaISO);
    fecha.setMinutes(fecha.getMinutes() + delay);
    var horas = fecha.getHours();
    var minutos = fecha.getMinutes();

    horas = horas.toString().padStart(2, '0');
    minutos = minutos.toString().padStart(2, '0');
    
    return horas + ":" + minutos;
}

function AdGr24_minutesToArrival(train) {
    var hora_datos = new Date(AdGr24_trains_data.station_settings.data_time)
    var llegada = new Date(train.arrival_time)

    var llegada_real = new Date(llegada.getTime() + train.delay_in * 60000)
    var diff = Math.floor((llegada_real - hora_datos) / 60000);

    return diff;

}



function AdGr24_updateClock() {
    var now_time = new Date();
    var hours = now_time.getHours();
    var minutes = now_time.getMinutes();
    var seconds = now_time.getSeconds();

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    var clock_time = hours + ':' + minutes + '<small>.' + seconds + '</small>';
    $(".clock p").html(clock_time);
}

function AdGr24_arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    
    return true;
}

function AdGr24_reload() {
    if (AdGr24_autoreload) location.reload(true);
}

function AdGr24_changeUpdateDataInterval(update_interval_seconds) {
    if(AdGr24_updateDataIntervalID !== undefined) {
        clearInterval(AdGr24_updateDataIntervalID); 
    } 
    AdGr24_updateDataIntervalID = setInterval(AdGr24_updateData,update_interval_seconds * 1000);
}
    

setInterval(AdGr24_reload,60 * 60 * 1000 - 100);
setInterval(AdGr24_updateClock, 250);
setInterval(AdGr24_sizeAdjustments, 250);


